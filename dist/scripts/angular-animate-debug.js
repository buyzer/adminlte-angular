/**
 * @license AngularJS v1.5.1
 * (c) 2010-2016 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

/* jshint ignore:start */
var noop        = angular.noop;
var copy        = angular.copy;
var extend      = angular.extend;
var jqLite      = angular.element;
var forEach     = angular.forEach;
var isArray     = angular.isArray;
var isString    = angular.isString;
var isObject    = angular.isObject;
var isUndefined = angular.isUndefined;
var isDefined   = angular.isDefined;
var isFunction  = angular.isFunction;
var isElement   = angular.isElement;

var ELEMENT_NODE = 1;
var COMMENT_NODE = 8;

var ADD_CLASS_SUFFIX = '-add';
var REMOVE_CLASS_SUFFIX = '-remove';
var EVENT_CLASS_PREFIX = 'ng-';
var ACTIVE_CLASS_SUFFIX = '-active';
var PREPARE_CLASS_SUFFIX = '-prepare';

var NG_ANIMATE_CLASSNAME = 'ng-animate';
var NG_ANIMATE_CHILDREN_DATA = '$$ngAnimateChildren';

// Detect proper transitionend/animationend event names.
var CSS_PREFIX = '', TRANSITION_PROP, TRANSITIONEND_EVENT, ANIMATION_PROP, ANIMATIONEND_EVENT;

// If unprefixed events are not supported but webkit-prefixed are, use the latter.
// Otherwise, just use W3C names, browsers not supporting them at all will just ignore them.
// Note: Chrome implements `window.onwebkitanimationend` and doesn't implement `window.onanimationend`
// but at the same time dispatches the `animationend` event and not `webkitAnimationEnd`.
// Register both events in case `window.onanimationend` is not supported because of that,
// do the same for `transitionend` as Safari is likely to exhibit similar behavior.
// Also, the only modern browser that uses vendor prefixes for transitions/keyframes is webkit
// therefore there is no reason to test anymore for other vendor prefixes:
// http://caniuse.com/#search=transition
if (isUndefined(window.ontransitionend) && isDefined(window.onwebkittransitionend)) {
  CSS_PREFIX = '-webkit-';
  TRANSITION_PROP = 'WebkitTransition';
  TRANSITIONEND_EVENT = 'webkitTransitionEnd transitionend';
} else {
  TRANSITION_PROP = 'transition';
  TRANSITIONEND_EVENT = 'transitionend';
}

if (isUndefined(window.onanimationend) && isDefined(window.onwebkitanimationend)) {
  CSS_PREFIX = '-webkit-';
  ANIMATION_PROP = 'WebkitAnimation';
  ANIMATIONEND_EVENT = 'webkitAnimationEnd animationend';
} else {
  ANIMATION_PROP = 'animation';
  ANIMATIONEND_EVENT = 'animationend';
}

var DURATION_KEY = 'Duration';
var PROPERTY_KEY = 'Property';
var DELAY_KEY = 'Delay';
var TIMING_KEY = 'TimingFunction';
var ANIMATION_ITERATION_COUNT_KEY = 'IterationCount';
var ANIMATION_PLAYSTATE_KEY = 'PlayState';
var SAFE_FAST_FORWARD_DURATION_VALUE = 9999;

var ANIMATION_DELAY_PROP = ANIMATION_PROP + DELAY_KEY;
var ANIMATION_DURATION_PROP = ANIMATION_PROP + DURATION_KEY;
var TRANSITION_DELAY_PROP = TRANSITION_PROP + DELAY_KEY;
var TRANSITION_DURATION_PROP = TRANSITION_PROP + DURATION_KEY;

var isPromiseLike = function(p) {
  return p && p.then ? true : false;
};

var ngMinErr = angular.$$minErr('ng');
function assertArg(arg, name, reason) {
  if (!arg) {
    throw ngMinErr('areq', "Argument '{0}' is {1}", (name || '?'), (reason || "required"));
  }
  return arg;
}

function mergeClasses(a,b) {
  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;
  if (isArray(a)) a = a.join(' ');
  if (isArray(b)) b = b.join(' ');
  return a + ' ' + b;
}

function packageStyles(options) {
  var styles = {};
  if (options && (options.to || options.from)) {
    styles.to = options.to;
    styles.from = options.from;
  }
  return styles;
}

function pendClasses(classes, fix, isPrefix) {
  var className = '';
  classes = isArray(classes)
      ? classes
      : classes && isString(classes) && classes.length
          ? classes.split(/\s+/)
          : [];
  forEach(classes, function(klass, i) {
    if (klass && klass.length > 0) {
      className += (i > 0) ? ' ' : '';
      className += isPrefix ? fix + klass
                            : klass + fix;
    }
  });
  return className;
}

function removeFromArray(arr, val) {
  var index = arr.indexOf(val);
  if (val >= 0) {
    arr.splice(index, 1);
  }
}

function stripCommentsFromElement(element) {
  if (element instanceof jqLite) {
    switch (element.length) {
      case 0:
        return [];
        break;

      case 1:
        // there is no point of stripping anything if the element
        // is the only element within the jqLite wrapper.
        // (it's important that we retain the element instance.)
        if (element[0].nodeType === ELEMENT_NODE) {
          return element;
        }
        break;

      default:
        return jqLite(extractElementNode(element));
        break;
    }
  }

  if (element.nodeType === ELEMENT_NODE) {
    return jqLite(element);
  }
}

function extractElementNode(element) {
  if (!element[0]) return element;
  for (var i = 0; i < element.length; i++) {
    var elm = element[i];
    if (elm.nodeType == ELEMENT_NODE) {
      return elm;
    }
  }
}

function $$addClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.addClass(elm, className);
  });
}

function $$removeClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.removeClass(elm, className);
  });
}

function applyAnimationClassesFactory($$jqLite) {
  return function(element, options) {
    if (options.addClass) {
      $$addClass($$jqLite, element, options.addClass);
      options.addClass = null;
    }
    if (options.removeClass) {
      $$removeClass($$jqLite, element, options.removeClass);
      options.removeClass = null;
    }
  }
}

function prepareAnimationOptions(options) {
  options = options || {};
  if (!options.$$prepared) {
    var domOperation = options.domOperation || noop;
    options.domOperation = function() {
      options.$$domOperationFired = true;
      domOperation();
      domOperation = noop;
    };
    options.$$prepared = true;
  }
  return options;
}

function applyAnimationStyles(element, options) {
  applyAnimationFromStyles(element, options);
  applyAnimationToStyles(element, options);
}

function applyAnimationFromStyles(element, options) {
  if (options.from) {
    element.css(options.from);
    options.from = null;
  }
}

function applyAnimationToStyles(element, options) {
  if (options.to) {
    element.css(options.to);
    options.to = null;
  }
}

function mergeAnimationDetails(element, oldAnimation, newAnimation) {
  var target = oldAnimation.options || {};
  var newOptions = newAnimation.options || {};

  var toAdd = (target.addClass || '') + ' ' + (newOptions.addClass || '');
  var toRemove = (target.removeClass || '') + ' ' + (newOptions.removeClass || '');
  var classes = resolveElementClasses(element.attr('class'), toAdd, toRemove);

  if (newOptions.preparationClasses) {
    target.preparationClasses = concatWithSpace(newOptions.preparationClasses, target.preparationClasses);
    delete newOptions.preparationClasses;
  }

  // noop is basically when there is no callback; otherwise something has been set
  var realDomOperation = target.domOperation !== noop ? target.domOperation : null;

  extend(target, newOptions);

  // TODO(matsko or sreeramu): proper fix is to maintain all animation callback in array and call at last,but now only leave has the callback so no issue with this.
  if (realDomOperation) {
    target.domOperation = realDomOperation;
  }

  if (classes.addClass) {
    target.addClass = classes.addClass;
  } else {
    target.addClass = null;
  }

  if (classes.removeClass) {
    target.removeClass = classes.removeClass;
  } else {
    target.removeClass = null;
  }

  oldAnimation.addClass = target.addClass;
  oldAnimation.removeClass = target.removeClass;

  return target;
}

function resolveElementClasses(existing, toAdd, toRemove) {
  var ADD_CLASS = 1;
  var REMOVE_CLASS = -1;

  var flags = {};
  existing = splitClassesToLookup(existing);

  toAdd = splitClassesToLookup(toAdd);
  forEach(toAdd, function(value, key) {
    flags[key] = ADD_CLASS;
  });

  toRemove = splitClassesToLookup(toRemove);
  forEach(toRemove, function(value, key) {
    flags[key] = flags[key] === ADD_CLASS ? null : REMOVE_CLASS;
  });

  var classes = {
    addClass: '',
    removeClass: ''
  };

  forEach(flags, function(val, klass) {
    var prop, allow;
    if (val === ADD_CLASS) {
      prop = 'addClass';
      allow = !existing[klass];
    } else if (val === REMOVE_CLASS) {
      prop = 'removeClass';
      allow = existing[klass];
    }
    if (allow) {
      if (classes[prop].length) {
        classes[prop] += ' ';
      }
      classes[prop] += klass;
    }
  });

  function splitClassesToLookup(classes) {
    if (isString(classes)) {
      classes = classes.split(' ');
    }

    var obj = {};
    forEach(classes, function(klass) {
      // sometimes the split leaves empty string values
      // incase extra spaces were applied to the options
      if (klass.length) {
        obj[klass] = true;
      }
    });
    return obj;
  }

  return classes;
}

function getDomNode(element) {
  return (element instanceof angular.element) ? element[0] : element;
}

function applyGeneratedPreparationClasses(element, event, options) {
  var classes = '';
  if (event) {
    classes = pendClasses(event, EVENT_CLASS_PREFIX, true);
  }
  if (options.addClass) {
    classes = concatWithSpace(classes, pendClasses(options.addClass, ADD_CLASS_SUFFIX));
  }
  if (options.removeClass) {
    classes = concatWithSpace(classes, pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX));
  }
  if (classes.length) {
    options.preparationClasses = classes;
    element.addClass(classes);
  }
}

function clearGeneratedClasses(element, options) {
  if (options.preparationClasses) {
    element.removeClass(options.preparationClasses);
    options.preparationClasses = null;
  }
  if (options.activeClasses) {
    element.removeClass(options.activeClasses);
    options.activeClasses = null;
  }
}

function blockTransitions(node, duration) {
  // we use a negative delay value since it performs blocking
  // yet it doesn't kill any existing transitions running on the
  // same element which makes this safe for class-based animations
  var value = duration ? '-' + duration + 's' : '';
  applyInlineStyle(node, [TRANSITION_DELAY_PROP, value]);
  return [TRANSITION_DELAY_PROP, value];
}

function blockKeyframeAnimations(node, applyBlock) {
  var value = applyBlock ? 'paused' : '';
  var key = ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY;
  applyInlineStyle(node, [key, value]);
  return [key, value];
}

function applyInlineStyle(node, styleTuple) {
  var prop = styleTuple[0];
  var value = styleTuple[1];
  node.style[prop] = value;
}

function concatWithSpace(a,b) {
  if (!a) return b;
  if (!b) return a;
  return a + ' ' + b;
}

var $$rAFSchedulerFactory = ['$$rAF', function($$rAF) {
  var queue, cancelFn;

  function scheduler(tasks) {
    // we make a copy since RAFScheduler mutates the state
    // of the passed in array variable and this would be difficult
    // to track down on the outside code
    queue = queue.concat(tasks);
    nextTick();
  }

  queue = scheduler.queue = [];

  /* waitUntilQuiet does two things:
   * 1. It will run the FINAL `fn` value only when an uncanceled RAF has passed through
   * 2. It will delay the next wave of tasks from running until the quiet `fn` has run.
   *
   * The motivation here is that animation code can request more time from the scheduler
   * before the next wave runs. This allows for certain DOM properties such as classes to
   * be resolved in time for the next animation to run.
   */
  scheduler.waitUntilQuiet = function(fn) {
    if (cancelFn) cancelFn();

    cancelFn = $$rAF(function() {
      cancelFn = null;
      fn();
      nextTick();
    });
  };

  return scheduler;

  function nextTick() {
    if (!queue.length) return;

    var items = queue.shift();
    for (var i = 0; i < items.length; i++) {
      items[i]();
    }

    if (!cancelFn) {
      $$rAF(function() {
        if (!cancelFn) nextTick();
      });
    }
  }
}];

/**
 * @ngdoc directive
 * @name ngAnimateChildren
 * @restrict AE
 * @element ANY
 *
 * @description
 *
 * ngAnimateChildren allows you to specify that children of this element should animate even if any
 * of the children's parents are currently animating. By default, when an element has an active `enter`, `leave`, or `move`
 * (structural) animation, child elements that also have an active structural animation are not animated.
 *
 * Note that even if `ngAnimteChildren` is set, no child animations will run when the parent element is removed from the DOM (`leave` animation).
 *
 *
 * @param {string} ngAnimateChildren If the value is empty, `true` or `on`,
 *     then child animations are allowed. If the value is `false`, child animations are not allowed.
 *
 * @example
 * <example module="ngAnimateChildren" name="ngAnimateChildren" deps="angular-animate.js" animations="true">
     <file name="index.html">
       <div ng-controller="mainController as main">
         <label>Show container? <input type="checkbox" ng-model="main.enterElement" /></label>
         <label>Animate children? <input type="checkbox" ng-model="main.animateChildren" /></label>
         <hr>
         <div ng-animate-children="{{main.animateChildren}}">
           <div ng-if="main.enterElement" class="container">
             List of items:
             <div ng-repeat="item in [0, 1, 2, 3]" class="item">Item {{item}}</div>
           </div>
         </div>
       </div>
     </file>
     <file name="animations.css">

      .container.ng-enter,
      .container.ng-leave {
        transition: all ease 1.5s;
      }

      .container.ng-enter,
      .container.ng-leave-active {
        opacity: 0;
      }

      .container.ng-leave,
      .container.ng-enter-active {
        opacity: 1;
      }

      .item {
        background: firebrick;
        color: #FFF;
        margin-bottom: 10px;
      }

      .item.ng-enter,
      .item.ng-leave {
        transition: transform 1.5s ease;
      }

      .item.ng-enter {
        transform: translateX(50px);
      }

      .item.ng-enter-active {
        transform: translateX(0);
      }
    </file>
    <file name="script.js">
      angular.module('ngAnimateChildren', ['ngAnimate'])
        .controller('mainController', function() {
          this.animateChildren = false;
          this.enterElement = false;
        });
    </file>
  </example>
 */
var $$AnimateChildrenDirective = ['$interpolate', function($interpolate) {
  return {
    link: function(scope, element, attrs) {
      var val = attrs.ngAnimateChildren;
      if (angular.isString(val) && val.length === 0) { //empty attribute
        element.data(NG_ANIMATE_CHILDREN_DATA, true);
      } else {
        // Interpolate and set the value, so that it is available to
        // animations that run right after compilation
        setData($interpolate(val)(scope));
        attrs.$observe('ngAnimateChildren', setData);
      }

      function setData(value) {
        value = value === 'on' || value === 'true';
        element.data(NG_ANIMATE_CHILDREN_DATA, value);
      }
    }
  };
}];

var ANIMATE_TIMER_KEY = '$$animateCss';

/**
 * @ngdoc service
 * @name $animateCss
 * @kind object
 *
 * @description
 * The `$animateCss` service is a useful utility to trigger customized CSS-based transitions/keyframes
 * from a JavaScript-based animation or directly from a directive. The purpose of `$animateCss` is NOT
 * to side-step how `$animate` and ngAnimate work, but the goal is to allow pre-existing animations or
 * directives to create more complex animations that can be purely driven using CSS code.
 *
 * Note that only browsers that support CSS transitions and/or keyframe animations are capable of
 * rendering animations triggered via `$animateCss` (bad news for IE9 and lower).
 *
 * ## Usage
 * Once again, `$animateCss` is designed to be used inside of a registered JavaScript animation that
 * is powered by ngAnimate. It is possible to use `$animateCss` directly inside of a directive, however,
 * any automatic control over cancelling animations and/or preventing animations from being run on
 * child elements will not be handled by Angular. For this to work as expected, please use `$animate` to
 * trigger the animation and then setup a JavaScript animation that injects `$animateCss` to trigger
 * the CSS animation.
 *
 * The example below shows how we can create a folding animation on an element using `ng-if`:
 *
 * ```html
 * <!-- notice the `fold-animation` CSS class -->
 * <div ng-if="onOff" class="fold-animation">
 *   This element will go BOOM
 * </div>
 * <button ng-click="onOff=true">Fold In</button>
 * ```
 *
 * Now we create the **JavaScript animation** that will trigger the CSS transition:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * ## More Advanced Uses
 *
 * `$animateCss` is the underlying code that ngAnimate uses to power **CSS-based animations** behind the scenes. Therefore CSS hooks
 * like `.ng-EVENT`, `.ng-EVENT-active`, `.ng-EVENT-stagger` are all features that can be triggered using `$animateCss` via JavaScript code.
 *
 * This also means that just about any combination of adding classes, removing classes, setting styles, dynamically setting a keyframe animation,
 * applying a hardcoded duration or delay value, changing the animation easing or applying a stagger animation are all options that work with
 * `$animateCss`. The service itself is smart enough to figure out the combination of options and examine the element styling properties in order
 * to provide a working animation that will run in CSS.
 *
 * The example below showcases a more advanced version of the `.fold-animation` from the example above:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         addClass: 'red large-text pulse-twice',
 *         easing: 'ease-out',
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Since we're adding/removing CSS classes then the CSS transition will also pick those up:
 *
 * ```css
 * /&#42; since a hardcoded duration value of 1 was provided in the JavaScript animation code,
 * the CSS classes below will be transitioned despite them being defined as regular CSS classes &#42;/
 * .red { background:red; }
 * .large-text { font-size:20px; }
 *
 * /&#42; we can also use a keyframe animation and $animateCss will make it work alongside the transition &#42;/
 * .pulse-twice {
 *   animation: 0.5s pulse linear 2;
 *   -webkit-animation: 0.5s pulse linear 2;
 * }
 *
 * @keyframes pulse {
 *   from { transform: scale(0.5); }
 *   to { transform: scale(1.5); }
 * }
 *
 * @-webkit-keyframes pulse {
 *   from { -webkit-transform: scale(0.5); }
 *   to { -webkit-transform: scale(1.5); }
 * }
 * ```
 *
 * Given this complex combination of CSS classes, styles and options, `$animateCss` will figure everything out and make the animation happen.
 *
 * ## How the Options are handled
 *
 * `$animateCss` is very versatile and intelligent when it comes to figuring out what configurations to apply to the element to ensure the animation
 * works with the options provided. Say for example we were adding a class that contained a keyframe value and we wanted to also animate some inline
 * styles using the `from` and `to` properties.
 *
 * ```js
 * var animator = $animateCss(element, {
 *   from: { background:'red' },
 *   to: { background:'blue' }
 * });
 * animator.start();
 * ```
 *
 * ```css
 * .rotating-animation {
 *   animation:0.5s rotate linear;
 *   -webkit-animation:0.5s rotate linear;
 * }
 *
 * @keyframes rotate {
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * }
 *
 * @-webkit-keyframes rotate {
 *   from { -webkit-transform: rotate(0deg); }
 *   to { -webkit-transform: rotate(360deg); }
 * }
 * ```
 *
 * The missing pieces here are that we do not have a transition set (within the CSS code nor within the `$animateCss` options) and the duration of the animation is
 * going to be detected from what the keyframe styles on the CSS class are. In this event, `$animateCss` will automatically create an inline transition
 * style matching the duration detected from the keyframe style (which is present in the CSS class that is being added) and then prepare both the transition
 * and keyframe animations to run in parallel on the element. Then when the animation is underway the provided `from` and `to` CSS styles will be applied
 * and spread across the transition and keyframe animation.
 *
 * ## What is returned
 *
 * `$animateCss` works in two stages: a preparation phase and an animation phase. Therefore when `$animateCss` is first called it will NOT actually
 * start the animation. All that is going on here is that the element is being prepared for the animation (which means that the generated CSS classes are
 * added and removed on the element). Once `$animateCss` is called it will return an object with the following properties:
 *
 * ```js
 * var animator = $animateCss(element, { ... });
 * ```
 *
 * Now what do the contents of our `animator` variable look like:
 *
 * ```js
 * {
 *   // starts the animation
 *   start: Function,
 *
 *   // ends (aborts) the animation
 *   end: Function
 * }
 * ```
 *
 * To actually start the animation we need to run `animation.start()` which will then return a promise that we can hook into to detect when the animation ends.
 * If we choose not to run the animation then we MUST run `animation.end()` to perform a cleanup on the element (since some CSS classes and styles may have been
 * applied to the element during the preparation phase). Note that all other properties such as duration, delay, transitions and keyframes are just properties
 * and that changing them will not reconfigure the parameters of the animation.
 *
 * ### runner.done() vs runner.then()
 * It is documented that `animation.start()` will return a promise object and this is true, however, there is also an additional method available on the
 * runner called `.done(callbackFn)`. The done method works the same as `.finally(callbackFn)`, however, it does **not trigger a digest to occur**.
 * Therefore, for performance reasons, it's always best to use `runner.done(callback)` instead of `runner.then()`, `runner.catch()` or `runner.finally()`
 * unless you really need a digest to kick off afterwards.
 *
 * Keep in mind that, to make this easier, ngAnimate has tweaked the JS animations API to recognize when a runner instance is returned from $animateCss
 * (so there is no need to call `runner.done(doneFn)` inside of your JavaScript animation code).
 * Check the {@link ngAnimate.$animateCss#usage animation code above} to see how this works.
 *
 * @param {DOMElement} element the element that will be animated
 * @param {object} options the animation-related options that will be applied during the animation
 *
 * * `event` - The DOM event (e.g. enter, leave, move). When used, a generated CSS class of `ng-EVENT` and `ng-EVENT-active` will be applied
 * to the element during the animation. Multiple events can be provided when spaces are used as a separator. (Note that this will not perform any DOM operation.)
 * * `structural` - Indicates that the `ng-` prefix will be added to the event class. Setting to `false` or omitting will turn `ng-EVENT` and
 * `ng-EVENT-active` in `EVENT` and `EVENT-active`. Unused if `event` is omitted.
 * * `easing` - The CSS easing value that will be applied to the transition or keyframe animation (or both).
 * * `transitionStyle` - The raw CSS transition style that will be used (e.g. `1s linear all`).
 * * `keyframeStyle` - The raw CSS keyframe animation style that will be used (e.g. `1s my_animation linear`).
 * * `from` - The starting CSS styles (a key/value object) that will be applied at the start of the animation.
 * * `to` - The ending CSS styles (a key/value object) that will be applied across the animation via a CSS transition.
 * * `addClass` - A space separated list of CSS classes that will be added to the element and spread across the animation.
 * * `removeClass` - A space separated list of CSS classes that will be removed from the element and spread across the animation.
 * * `duration` - A number value representing the total duration of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `0`
 * is provided then the animation will be skipped entirely.
 * * `delay` - A number value representing the total delay of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `true` is
 * used then whatever delay value is detected from the CSS classes will be mirrored on the elements styles (e.g. by setting delay true then the style value
 * of the element will be `transition-delay: DETECTED_VALUE`). Using `true` is useful when you want the CSS classes and inline styles to all share the same
 * CSS delay value.
 * * `stagger` - A numeric time value representing the delay between successively animated elements
 * ({@link ngAnimate#css-staggering-animations Click here to learn how CSS-based staggering works in ngAnimate.})
 * * `staggerIndex` - The numeric index representing the stagger item (e.g. a value of 5 is equal to the sixth item in the stagger; therefore when a
 *   `stagger` option value of `0.1` is used then there will be a stagger delay of `600ms`)
 * * `applyClassesEarly` - Whether or not the classes being added or removed will be used when detecting the animation. This is set by `$animate` when enter/leave/move animations are fired to ensure that the CSS classes are resolved in time. (Note that this will prevent any transitions from occurring on the classes being added and removed.)
 * * `cleanupStyles` - Whether or not the provided `from` and `to` styles will be removed once
 *    the animation is closed. This is useful for when the styles are used purely for the sake of
 *    the animation and do not have a lasting visual effect on the element (e.g. a collapse and open animation).
 *    By default this value is set to `false`.
 *
 * @return {object} an object with start and end methods and details about the animation.
 *
 * * `start` - The method to start the animation. This will return a `Promise` when called.
 * * `end` - This method will cancel the animation and remove all applied CSS classes and styles.
 */
var ONE_SECOND = 1000;
var BASE_TEN = 10;

var ELAPSED_TIME_MAX_DECIMAL_PLACES = 3;
var CLOSING_TIME_BUFFER = 1.5;

var DETECT_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  transitionProperty:      TRANSITION_PROP + PROPERTY_KEY,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP,
  animationIterationCount: ANIMATION_PROP + ANIMATION_ITERATION_COUNT_KEY
};

var DETECT_STAGGER_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP
};

function getCssKeyframeDurationStyle(duration) {
  return [ANIMATION_DURATION_PROP, duration + 's'];
}

function getCssDelayStyle(delay, isKeyframeAnimation) {
  var prop = isKeyframeAnimation ? ANIMATION_DELAY_PROP : TRANSITION_DELAY_PROP;
  return [prop, delay + 's'];
}

function computeCssStyles($window, element, properties) {
  var styles = Object.create(null);
  var detectedStyles = $window.getComputedStyle(element) || {};
  forEach(properties, function(formalStyleName, actualStyleName) {
    var val = detectedStyles[formalStyleName];
    if (val) {
      var c = val.charAt(0);

      // only numerical-based values have a negative sign or digit as the first value
      if (c === '-' || c === '+' || c >= 0) {
        val = parseMaxTime(val);
      }

      // by setting this to null in the event that the delay is not set or is set directly as 0
      // then we can still allow for negative values to be used later on and not mistake this
      // value for being greater than any other negative value.
      if (val === 0) {
        val = null;
      }
      styles[actualStyleName] = val;
    }
  });

  return styles;
}

function parseMaxTime(str) {
  var maxValue = 0;
  var values = str.split(/\s*,\s*/);
  forEach(values, function(value) {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) == 's') {
      value = value.substring(0, value.length - 1);
    }
    value = parseFloat(value) || 0;
    maxValue = maxValue ? Math.max(value, maxValue) : value;
  });
  return maxValue;
}

function truthyTimingValue(val) {
  return val === 0 || val != null;
}

function getCssTransitionDurationStyle(duration, applyOnlyDuration) {
  var style = TRANSITION_PROP;
  var value = duration + 's';
  if (applyOnlyDuration) {
    style += DURATION_KEY;
  } else {
    value += ' linear all';
  }
  return [style, value];
}

function createLocalCacheLookup() {
  var cache = Object.create(null);
  return {
    flush: function() {
      cache = Object.create(null);
    },

    count: function(key) {
      var entry = cache[key];
      return entry ? entry.total : 0;
    },

    get: function(key) {
      var entry = cache[key];
      return entry && entry.value;
    },

    put: function(key, value) {
      if (!cache[key]) {
        cache[key] = { total: 1, value: value };
      } else {
        cache[key].total++;
      }
    }
  };
}

// we do not reassign an already present style value since
// if we detect the style property value again we may be
// detecting styles that were added via the `from` styles.
// We make use of `isDefined` here since an empty string
// or null value (which is what getPropertyValue will return
// for a non-existing style) will still be marked as a valid
// value for the style (a falsy value implies that the style
// is to be removed at the end of the animation). If we had a simple
// "OR" statement then it would not be enough to catch that.
function registerRestorableStyles(backup, node, properties) {
  forEach(properties, function(prop) {
    backup[prop] = isDefined(backup[prop])
        ? backup[prop]
        : node.style.getPropertyValue(prop);
  });
}

var $AnimateCssProvider = ['$animateProvider', function($animateProvider) {
  var gcsLookup = createLocalCacheLookup();
  var gcsStaggerLookup = createLocalCacheLookup();

  this.$get = ['$window', '$$jqLite', '$$AnimateRunner', '$timeout',
               '$$forceReflow', '$sniffer', '$$rAFScheduler', '$$animateQueue',
       function($window,   $$jqLite,   $$AnimateRunner,   $timeout,
                $$forceReflow,   $sniffer,   $$rAFScheduler, $$animateQueue) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    var parentCounter = 0;
    function gcsHashFn(node, extraClasses) {
      var KEY = "$$ngAnimateParentKey";
      var parentNode = node.parentNode;
      var parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
      return parentID + '-' + node.getAttribute('class') + '-' + extraClasses;
    }

    function computeCachedCssStyles(node, className, cacheKey, properties) {
      var timings = gcsLookup.get(cacheKey);

      if (!timings) {
        timings = computeCssStyles($window, node, properties);
        if (timings.animationIterationCount === 'infinite') {
          timings.animationIterationCount = 1;
        }
      }

      // we keep putting this in multiple times even though the value and the cacheKey are the same
      // because we're keeping an internal tally of how many duplicate animations are detected.
      gcsLookup.put(cacheKey, timings);
      return timings;
    }

    function computeCachedCssStaggerStyles(node, className, cacheKey, properties) {
      var stagger;

      // if we have one or more existing matches of matching elements
      // containing the same parent + CSS styles (which is how cacheKey works)
      // then staggering is possible
      if (gcsLookup.count(cacheKey) > 0) {
        stagger = gcsStaggerLookup.get(cacheKey);

        if (!stagger) {
          var staggerClassName = pendClasses(className, '-stagger');

          $$jqLite.addClass(node, staggerClassName);

          stagger = computeCssStyles($window, node, properties);

          // force the conversion of a null value to zero incase not set
          stagger.animationDuration = Math.max(stagger.animationDuration, 0);
          stagger.transitionDuration = Math.max(stagger.transitionDuration, 0);

          $$jqLite.removeClass(node, staggerClassName);

          gcsStaggerLookup.put(cacheKey, stagger);
        }
      }

      return stagger || {};
    }

    var cancelLastRAFRequest;
    var rafWaitQueue = [];
    function waitUntilQuiet(callback) {
      rafWaitQueue.push(callback);
      $$rAFScheduler.waitUntilQuiet(function() {
        gcsLookup.flush();
        gcsStaggerLookup.flush();

        // DO NOT REMOVE THIS LINE OR REFACTOR OUT THE `pageWidth` variable.
        // PLEASE EXAMINE THE `$$forceReflow` service to understand why.
        var pageWidth = $$forceReflow();

        // we use a for loop to ensure that if the queue is changed
        // during this looping then it will consider new requests
        for (var i = 0; i < rafWaitQueue.length; i++) {
          rafWaitQueue[i](pageWidth);
        }
        rafWaitQueue.length = 0;
      });
    }

    function computeTimings(node, className, cacheKey) {
      var timings = computeCachedCssStyles(node, className, cacheKey, DETECT_CSS_PROPERTIES);
      var aD = timings.animationDelay;
      var tD = timings.transitionDelay;
      timings.maxDelay = aD && tD
          ? Math.max(aD, tD)
          : (aD || tD);
      timings.maxDuration = Math.max(
          timings.animationDuration * timings.animationIterationCount,
          timings.transitionDuration);

      return timings;
    }

    return function init(element, initialOptions) {
      // all of the animation functions should create
      // a copy of the options data, however, if a
      // parent service has already created a copy then
      // we should stick to using that
      var options = initialOptions || {};
      if (!options.$$prepared) {
        options = prepareAnimationOptions(copy(options));
      }

      var restoreStyles = {};
      var node = getDomNode(element);
      if (!node
          || !node.parentNode
          || !$$animateQueue.enabled()) {
        return closeAndReturnNoopAnimator();
      }

      var temporaryStyles = [];
      var classes = element.attr('class');
      var styles = packageStyles(options);
      var animationClosed;
      var animationPaused;
      var animationCompleted;
      var runner;
      var runnerHost;
      var maxDelay;
      var maxDelayTime;
      var maxDuration;
      var maxDurationTime;
      var startTime;
      var events = [];

      if (options.duration === 0 || (!$sniffer.animations && !$sniffer.transitions)) {
        return closeAndReturnNoopAnimator();
      }

      var method = options.event && isArray(options.event)
            ? options.event.join(' ')
            : options.event;

      var isStructural = method && options.structural;
      var structuralClassName = '';
      var addRemoveClassName = '';

      if (isStructural) {
        structuralClassName = pendClasses(method, EVENT_CLASS_PREFIX, true);
      } else if (method) {
        structuralClassName = method;
      }

      if (options.addClass) {
        addRemoveClassName += pendClasses(options.addClass, ADD_CLASS_SUFFIX);
      }

      if (options.removeClass) {
        if (addRemoveClassName.length) {
          addRemoveClassName += ' ';
        }
        addRemoveClassName += pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX);
      }

      // there may be a situation where a structural animation is combined together
      // with CSS classes that need to resolve before the animation is computed.
      // However this means that there is no explicit CSS code to block the animation
      // from happening (by setting 0s none in the class name). If this is the case
      // we need to apply the classes before the first rAF so we know to continue if
      // there actually is a detected transition or keyframe animation
      if (options.applyClassesEarly && addRemoveClassName.length) {
        applyAnimationClasses(element, options);
      }

      var preparationClasses = [structuralClassName, addRemoveClassName].join(' ').trim();
      var fullClassName = classes + ' ' + preparationClasses;
      var activeClasses = pendClasses(preparationClasses, ACTIVE_CLASS_SUFFIX);
      var hasToStyles = styles.to && Object.keys(styles.to).length > 0;
      var containsKeyframeAnimation = (options.keyframeStyle || '').length > 0;

      // there is no way we can trigger an animation if no styles and
      // no classes are being applied which would then trigger a transition,
      // unless there a is raw keyframe value that is applied to the element.
      if (!containsKeyframeAnimation
           && !hasToStyles
           && !preparationClasses) {
        return closeAndReturnNoopAnimator();
      }

      var cacheKey, stagger;
      if (options.stagger > 0) {
        var staggerVal = parseFloat(options.stagger);
        stagger = {
          transitionDelay: staggerVal,
          animationDelay: staggerVal,
          transitionDuration: 0,
          animationDuration: 0
        };
      } else {
        cacheKey = gcsHashFn(node, fullClassName);
        stagger = computeCachedCssStaggerStyles(node, preparationClasses, cacheKey, DETECT_STAGGER_CSS_PROPERTIES);
      }

      if (!options.$$skipPreparationClasses) {
        $$jqLite.addClass(element, preparationClasses);
      }

      var applyOnlyDuration;

      if (options.transitionStyle) {
        var transitionStyle = [TRANSITION_PROP, options.transitionStyle];
        applyInlineStyle(node, transitionStyle);
        temporaryStyles.push(transitionStyle);
      }

      if (options.duration >= 0) {
        applyOnlyDuration = node.style[TRANSITION_PROP].length > 0;
        var durationStyle = getCssTransitionDurationStyle(options.duration, applyOnlyDuration);

        // we set the duration so that it will be picked up by getComputedStyle later
        applyInlineStyle(node, durationStyle);
        temporaryStyles.push(durationStyle);
      }

      if (options.keyframeStyle) {
        var keyframeStyle = [ANIMATION_PROP, options.keyframeStyle];
        applyInlineStyle(node, keyframeStyle);
        temporaryStyles.push(keyframeStyle);
      }

      var itemIndex = stagger
          ? options.staggerIndex >= 0
              ? options.staggerIndex
              : gcsLookup.count(cacheKey)
          : 0;

      var isFirst = itemIndex === 0;

      // this is a pre-emptive way of forcing the setup classes to be added and applied INSTANTLY
      // without causing any combination of transitions to kick in. By adding a negative delay value
      // it forces the setup class' transition to end immediately. We later then remove the negative
      // transition delay to allow for the transition to naturally do it's thing. The beauty here is
      // that if there is no transition defined then nothing will happen and this will also allow
      // other transitions to be stacked on top of each other without any chopping them out.
      if (isFirst && !options.skipBlocking) {
        blockTransitions(node, SAFE_FAST_FORWARD_DURATION_VALUE);
      }

      var timings = computeTimings(node, fullClassName, cacheKey);
      var relativeDelay = timings.maxDelay;
      maxDelay = Math.max(relativeDelay, 0);
      maxDuration = timings.maxDuration;

      var flags = {};
      flags.hasTransitions          = timings.transitionDuration > 0;
      flags.hasAnimations           = timings.animationDuration > 0;
      flags.hasTransitionAll        = flags.hasTransitions && timings.transitionProperty == 'all';
      flags.applyTransitionDuration = hasToStyles && (
                                        (flags.hasTransitions && !flags.hasTransitionAll)
                                         || (flags.hasAnimations && !flags.hasTransitions));
      flags.applyAnimationDuration  = options.duration && flags.hasAnimations;
      flags.applyTransitionDelay    = truthyTimingValue(options.delay) && (flags.applyTransitionDuration || flags.hasTransitions);
      flags.applyAnimationDelay     = truthyTimingValue(options.delay) && flags.hasAnimations;
      flags.recalculateTimingStyles = addRemoveClassName.length > 0;

      if (flags.applyTransitionDuration || flags.applyAnimationDuration) {
        maxDuration = options.duration ? parseFloat(options.duration) : maxDuration;

        if (flags.applyTransitionDuration) {
          flags.hasTransitions = true;
          timings.transitionDuration = maxDuration;
          applyOnlyDuration = node.style[TRANSITION_PROP + PROPERTY_KEY].length > 0;
          temporaryStyles.push(getCssTransitionDurationStyle(maxDuration, applyOnlyDuration));
        }

        if (flags.applyAnimationDuration) {
          flags.hasAnimations = true;
          timings.animationDuration = maxDuration;
          temporaryStyles.push(getCssKeyframeDurationStyle(maxDuration));
        }
      }

      if (maxDuration === 0 && !flags.recalculateTimingStyles) {
        return closeAndReturnNoopAnimator();
      }

      if (options.delay != null) {
        var delayStyle;
        if (typeof options.delay !== "boolean") {
          delayStyle = parseFloat(options.delay);
          // number in options.delay means we have to recalculate the delay for the closing timeout
          maxDelay = Math.max(delayStyle, 0);
        }

        if (flags.applyTransitionDelay) {
          temporaryStyles.push(getCssDelayStyle(delayStyle));
        }

        if (flags.applyAnimationDelay) {
          temporaryStyles.push(getCssDelayStyle(delayStyle, true));
        }
      }

      // we need to recalculate the delay value since we used a pre-emptive negative
      // delay value and the delay value is required for the final event checking. This
      // property will ensure that this will happen after the RAF phase has passed.
      if (options.duration == null && timings.transitionDuration > 0) {
        flags.recalculateTimingStyles = flags.recalculateTimingStyles || isFirst;
      }

      maxDelayTime = maxDelay * ONE_SECOND;
      maxDurationTime = maxDuration * ONE_SECOND;
      if (!options.skipBlocking) {
        flags.blockTransition = timings.transitionDuration > 0;
        flags.blockKeyframeAnimation = timings.animationDuration > 0 &&
                                       stagger.animationDelay > 0 &&
                                       stagger.animationDuration === 0;
      }

      if (options.from) {
        if (options.cleanupStyles) {
          registerRestorableStyles(restoreStyles, node, Object.keys(options.from));
        }
        applyAnimationFromStyles(element, options);
      }

      if (flags.blockTransition || flags.blockKeyframeAnimation) {
        applyBlocking(maxDuration);
      } else if (!options.skipBlocking) {
        blockTransitions(node, false);
      }

      // TODO(matsko): for 1.5 change this code to have an animator object for better debugging
      return {
        $$willAnimate: true,
        end: endFn,
        start: function() {
          if (animationClosed) return;

          runnerHost = {
            end: endFn,
            cancel: cancelFn,
            resume: null, //this will be set during the start() phase
            pause: null
          };

          runner = new $$AnimateRunner(runnerHost);

          waitUntilQuiet(start);

          // we don't have access to pause/resume the animation
          // since it hasn't run yet. AnimateRunner will therefore
          // set noop functions for resume and pause and they will
          // later be overridden once the animation is triggered
          return runner;
        }
      };

      function endFn() {
        close();
      }

      function cancelFn() {
        close(true);
      }

      function close(rejected) { // jshint ignore:line
        // if the promise has been called already then we shouldn't close
        // the animation again
        if (animationClosed || (animationCompleted && animationPaused)) return;
        animationClosed = true;
        animationPaused = false;

        if (!options.$$skipPreparationClasses) {
          $$jqLite.removeClass(element, preparationClasses);
        }
        $$jqLite.removeClass(element, activeClasses);

        blockKeyframeAnimations(node, false);
        blockTransitions(node, false);

        forEach(temporaryStyles, function(entry) {
          // There is only one way to remove inline style properties entirely from elements.
          // By using `removeProperty` this works, but we need to convert camel-cased CSS
          // styles down to hyphenated values.
          node.style[entry[0]] = '';
        });

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);

        if (Object.keys(restoreStyles).length) {
          forEach(restoreStyles, function(value, prop) {
            value ? node.style.setProperty(prop, value)
                  : node.style.removeProperty(prop);
          });
        }

        // the reason why we have this option is to allow a synchronous closing callback
        // that is fired as SOON as the animation ends (when the CSS is removed) or if
        // the animation never takes off at all. A good example is a leave animation since
        // the element must be removed just after the animation is over or else the element
        // will appear on screen for one animation frame causing an overbearing flicker.
        if (options.onDone) {
          options.onDone();
        }

        if (events && events.length) {
          // Remove the transitionend / animationend listener(s)
          element.off(events.join(' '), onAnimationProgress);
        }

        //Cancel the fallback closing timeout and remove the timer data
        var animationTimerData = element.data(ANIMATE_TIMER_KEY);
        if (animationTimerData) {
          $timeout.cancel(animationTimerData[0].timer);
          element.removeData(ANIMATE_TIMER_KEY);
        }

        // if the preparation function fails then the promise is not setup
        if (runner) {
          runner.complete(!rejected);
        }
      }

      function applyBlocking(duration) {
        if (flags.blockTransition) {
          blockTransitions(node, duration);
        }

        if (flags.blockKeyframeAnimation) {
          blockKeyframeAnimations(node, !!duration);
        }
      }

      function closeAndReturnNoopAnimator() {
        runner = new $$AnimateRunner({
          end: endFn,
          cancel: cancelFn
        });

        // should flush the cache animation
        waitUntilQuiet(noop);
        close();

        return {
          $$willAnimate: false,
          start: function() {
            return runner;
          },
          end: endFn
        };
      }

      function onAnimationProgress(event) {
        event.stopPropagation();
        var ev = event.originalEvent || event;

        // we now always use `Date.now()` due to the recent changes with
        // event.timeStamp in Firefox, Webkit and Chrome (see #13494 for more info)
        var timeStamp = ev.$manualTimeStamp || Date.now();

        /* Firefox (or possibly just Gecko) likes to not round values up
         * when a ms measurement is used for the animation */
        var elapsedTime = parseFloat(ev.elapsedTime.toFixed(ELAPSED_TIME_MAX_DECIMAL_PLACES));

        /* $manualTimeStamp is a mocked timeStamp value which is set
         * within browserTrigger(). This is only here so that tests can
         * mock animations properly. Real events fallback to event.timeStamp,
         * or, if they don't, then a timeStamp is automatically created for them.
         * We're checking to see if the timeStamp surpasses the expected delay,
         * but we're using elapsedTime instead of the timeStamp on the 2nd
         * pre-condition since animationPauseds sometimes close off early */
        if (Math.max(timeStamp - startTime, 0) >= maxDelayTime && elapsedTime >= maxDuration) {
          // we set this flag to ensure that if the transition is paused then, when resumed,
          // the animation will automatically close itself since transitions cannot be paused.
          animationCompleted = true;
          close();
        }
      }

      function start() {
        if (animationClosed) return;
        if (!node.parentNode) {
          close();
          return;
        }

        // even though we only pause keyframe animations here the pause flag
        // will still happen when transitions are used. Only the transition will
        // not be paused since that is not possible. If the animation ends when
        // paused then it will not complete until unpaused or cancelled.
        var playPause = function(playAnimation) {
          if (!animationCompleted) {
            animationPaused = !playAnimation;
            if (timings.animationDuration) {
              var value = blockKeyframeAnimations(node, animationPaused);
              animationPaused
                  ? temporaryStyles.push(value)
                  : removeFromArray(temporaryStyles, value);
            }
          } else if (animationPaused && playAnimation) {
            animationPaused = false;
            close();
          }
        };

        // checking the stagger duration prevents an accidentally cascade of the CSS delay style
        // being inherited from the parent. If the transition duration is zero then we can safely
        // rely that the delay value is an intentional stagger delay style.
        var maxStagger = itemIndex > 0
                         && ((timings.transitionDuration && stagger.transitionDuration === 0) ||
                            (timings.animationDuration && stagger.animationDuration === 0))
                         && Math.max(stagger.animationDelay, stagger.transitionDelay);
        if (maxStagger) {
          $timeout(triggerAnimationStart,
                   Math.floor(maxStagger * itemIndex * ONE_SECOND),
                   false);
        } else {
          triggerAnimationStart();
        }

        // this will decorate the existing promise runner with pause/resume methods
        runnerHost.resume = function() {
          playPause(true);
        };

        runnerHost.pause = function() {
          playPause(false);
        };

        function triggerAnimationStart() {
          // just incase a stagger animation kicks in when the animation
          // itself was cancelled entirely
          if (animationClosed) return;

          applyBlocking(false);

          forEach(temporaryStyles, function(entry) {
            var key = entry[0];
            var value = entry[1];
            node.style[key] = value;
          });

          applyAnimationClasses(element, options);
          $$jqLite.addClass(element, activeClasses);

          if (flags.recalculateTimingStyles) {
            fullClassName = node.className + ' ' + preparationClasses;
            cacheKey = gcsHashFn(node, fullClassName);

            timings = computeTimings(node, fullClassName, cacheKey);
            relativeDelay = timings.maxDelay;
            maxDelay = Math.max(relativeDelay, 0);
            maxDuration = timings.maxDuration;

            if (maxDuration === 0) {
              close();
              return;
            }

            flags.hasTransitions = timings.transitionDuration > 0;
            flags.hasAnimations = timings.animationDuration > 0;
          }

          if (flags.applyAnimationDelay) {
            relativeDelay = typeof options.delay !== "boolean" && truthyTimingValue(options.delay)
                  ? parseFloat(options.delay)
                  : relativeDelay;

            maxDelay = Math.max(relativeDelay, 0);
            timings.animationDelay = relativeDelay;
            delayStyle = getCssDelayStyle(relativeDelay, true);
            temporaryStyles.push(delayStyle);
            node.style[delayStyle[0]] = delayStyle[1];
          }

          maxDelayTime = maxDelay * ONE_SECOND;
          maxDurationTime = maxDuration * ONE_SECOND;

          if (options.easing) {
            var easeProp, easeVal = options.easing;
            if (flags.hasTransitions) {
              easeProp = TRANSITION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
            if (flags.hasAnimations) {
              easeProp = ANIMATION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
          }

          if (timings.transitionDuration) {
            events.push(TRANSITIONEND_EVENT);
          }

          if (timings.animationDuration) {
            events.push(ANIMATIONEND_EVENT);
          }

          startTime = Date.now();
          var timerTime = maxDelayTime + CLOSING_TIME_BUFFER * maxDurationTime;
          var endTime = startTime + timerTime;

          var animationsData = element.data(ANIMATE_TIMER_KEY) || [];
          var setupFallbackTimer = true;
          if (animationsData.length) {
            var currentTimerData = animationsData[0];
            setupFallbackTimer = endTime > currentTimerData.expectedEndTime;
            if (setupFallbackTimer) {
              $timeout.cancel(currentTimerData.timer);
            } else {
              animationsData.push(close);
            }
          }

          if (setupFallbackTimer) {
            var timer = $timeout(onAnimationExpired, timerTime, false);
            animationsData[0] = {
              timer: timer,
              expectedEndTime: endTime
            };
            animationsData.push(close);
            element.data(ANIMATE_TIMER_KEY, animationsData);
          }

          if (events.length) {
            element.on(events.join(' '), onAnimationProgress);
          }

          if (options.to) {
            if (options.cleanupStyles) {
              registerRestorableStyles(restoreStyles, node, Object.keys(options.to));
            }
            applyAnimationToStyles(element, options);
          }
        }

        function onAnimationExpired() {
          var animationsData = element.data(ANIMATE_TIMER_KEY);

          // this will be false in the event that the element was
          // removed from the DOM (via a leave animation or something
          // similar)
          if (animationsData) {
            for (var i = 1; i < animationsData.length; i++) {
              animationsData[i]();
            }
            element.removeData(ANIMATE_TIMER_KEY);
          }
        }
      }
    };
  }];
}];

var $$AnimateCssDriverProvider = ['$$animationProvider', function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateCssDriver');

  var NG_ANIMATE_SHIM_CLASS_NAME = 'ng-animate-shim';
  var NG_ANIMATE_ANCHOR_CLASS_NAME = 'ng-anchor';

  var NG_OUT_ANCHOR_CLASS_NAME = 'ng-anchor-out';
  var NG_IN_ANCHOR_CLASS_NAME = 'ng-anchor-in';

  function isDocumentFragment(node) {
    return node.parentNode && node.parentNode.nodeType === 11;
  }

  this.$get = ['$animateCss', '$rootScope', '$$AnimateRunner', '$rootElement', '$sniffer', '$$jqLite', '$document',
       function($animateCss,   $rootScope,   $$AnimateRunner,   $rootElement,   $sniffer,   $$jqLite,   $document) {

    // only browsers that support these properties can render animations
    if (!$sniffer.animations && !$sniffer.transitions) return noop;

    var bodyNode = $document[0].body;
    var rootNode = getDomNode($rootElement);

    var rootBodyElement = jqLite(
      // this is to avoid using something that exists outside of the body
      // we also special case the doc fragment case because our unit test code
      // appends the $rootElement to the body after the app has been bootstrapped
      isDocumentFragment(rootNode) || bodyNode.contains(rootNode) ? rootNode : bodyNode
    );

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    return function initDriverFn(animationDetails) {
      return animationDetails.from && animationDetails.to
          ? prepareFromToAnchorAnimation(animationDetails.from,
                                         animationDetails.to,
                                         animationDetails.classes,
                                         animationDetails.anchors)
          : prepareRegularAnimation(animationDetails);
    };

    function filterCssClasses(classes) {
      //remove all the `ng-` stuff
      return classes.replace(/\bng-\S+\b/g, '');
    }

    function getUniqueValues(a, b) {
      if (isString(a)) a = a.split(' ');
      if (isString(b)) b = b.split(' ');
      return a.filter(function(val) {
        return b.indexOf(val) === -1;
      }).join(' ');
    }

    function prepareAnchoredAnimation(classes, outAnchor, inAnchor) {
      var clone = jqLite(getDomNode(outAnchor).cloneNode(true));
      var startingClasses = filterCssClasses(getClassVal(clone));

      outAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
      inAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);

      clone.addClass(NG_ANIMATE_ANCHOR_CLASS_NAME);

      rootBodyElement.append(clone);

      var animatorIn, animatorOut = prepareOutAnimation();

      // the user may not end up using the `out` animation and
      // only making use of the `in` animation or vice-versa.
      // In either case we should allow this and not assume the
      // animation is over unless both animations are not used.
      if (!animatorOut) {
        animatorIn = prepareInAnimation();
        if (!animatorIn) {
          return end();
        }
      }

      var startingAnimator = animatorOut || animatorIn;

      return {
        start: function() {
          var runner;

          var currentAnimation = startingAnimator.start();
          currentAnimation.done(function() {
            currentAnimation = null;
            if (!animatorIn) {
              animatorIn = prepareInAnimation();
              if (animatorIn) {
                currentAnimation = animatorIn.start();
                currentAnimation.done(function() {
                  currentAnimation = null;
                  end();
                  runner.complete();
                });
                return currentAnimation;
              }
            }
            // in the event that there is no `in` animation
            end();
            runner.complete();
          });

          runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn
          });

          return runner;

          function endFn() {
            if (currentAnimation) {
              currentAnimation.end();
            }
          }
        }
      };

      function calculateAnchorStyles(anchor) {
        var styles = {};

        var coords = getDomNode(anchor).getBoundingClientRect();

        // we iterate directly since safari messes up and doesn't return
        // all the keys for the coords object when iterated
        forEach(['width','height','top','left'], function(key) {
          var value = coords[key];
          switch (key) {
            case 'top':
              value += bodyNode.scrollTop;
              break;
            case 'left':
              value += bodyNode.scrollLeft;
              break;
          }
          styles[key] = Math.floor(value) + 'px';
        });
        return styles;
      }

      function prepareOutAnimation() {
        var animator = $animateCss(clone, {
          addClass: NG_OUT_ANCHOR_CLASS_NAME,
          delay: true,
          from: calculateAnchorStyles(outAnchor)
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function getClassVal(element) {
        return element.attr('class') || '';
      }

      function prepareInAnimation() {
        var endingClasses = filterCssClasses(getClassVal(inAnchor));
        var toAdd = getUniqueValues(endingClasses, startingClasses);
        var toRemove = getUniqueValues(startingClasses, endingClasses);

        var animator = $animateCss(clone, {
          to: calculateAnchorStyles(inAnchor),
          addClass: NG_IN_ANCHOR_CLASS_NAME + ' ' + toAdd,
          removeClass: NG_OUT_ANCHOR_CLASS_NAME + ' ' + toRemove,
          delay: true
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function end() {
        clone.remove();
        outAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
        inAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
      }
    }

    function prepareFromToAnchorAnimation(from, to, classes, anchors) {
      var fromAnimation = prepareRegularAnimation(from, noop);
      var toAnimation = prepareRegularAnimation(to, noop);

      var anchorAnimations = [];
      forEach(anchors, function(anchor) {
        var outElement = anchor['out'];
        var inElement = anchor['in'];
        var animator = prepareAnchoredAnimation(classes, outElement, inElement);
        if (animator) {
          anchorAnimations.push(animator);
        }
      });

      // no point in doing anything when there are no elements to animate
      if (!fromAnimation && !toAnimation && anchorAnimations.length === 0) return;

      return {
        start: function() {
          var animationRunners = [];

          if (fromAnimation) {
            animationRunners.push(fromAnimation.start());
          }

          if (toAnimation) {
            animationRunners.push(toAnimation.start());
          }

          forEach(anchorAnimations, function(animation) {
            animationRunners.push(animation.start());
          });

          var runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn // CSS-driven animations cannot be cancelled, only ended
          });

          $$AnimateRunner.all(animationRunners, function(status) {
            runner.complete(status);
          });

          return runner;

          function endFn() {
            forEach(animationRunners, function(runner) {
              runner.end();
            });
          }
        }
      };
    }

    function prepareRegularAnimation(animationDetails) {
      var element = animationDetails.element;
      var options = animationDetails.options || {};

      if (animationDetails.structural) {
        options.event = animationDetails.event;
        options.structural = true;
        options.applyClassesEarly = true;

        // we special case the leave animation since we want to ensure that
        // the element is removed as soon as the animation is over. Otherwise
        // a flicker might appear or the element may not be removed at all
        if (animationDetails.event === 'leave') {
          options.onDone = options.domOperation;
        }
      }

      // We assign the preparationClasses as the actual animation event since
      // the internals of $animateCss will just suffix the event token values
      // with `-active` to trigger the animation.
      if (options.preparationClasses) {
        options.event = concatWithSpace(options.event, options.preparationClasses);
      }

      var animator = $animateCss(element, options);

      // the driver lookup code inside of $$animation attempts to spawn a
      // driver one by one until a driver returns a.$$willAnimate animator object.
      // $animateCss will always return an object, however, it will pass in
      // a flag as a hint as to whether an animation was detected or not
      return animator.$$willAnimate ? animator : null;
    }
  }];
}];

// TODO(matsko): use caching here to speed things up for detection
// TODO(matsko): add documentation
//  by the time...

var $$AnimateJsProvider = ['$animateProvider', function($animateProvider) {
  this.$get = ['$injector', '$$AnimateRunner', '$$jqLite',
       function($injector,   $$AnimateRunner,   $$jqLite) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
         // $animateJs(element, 'enter');
    return function(element, event, classes, options) {
      var animationClosed = false;

      // the `classes` argument is optional and if it is not used
      // then the classes will be resolved from the element's className
      // property as well as options.addClass/options.removeClass.
      if (arguments.length === 3 && isObject(classes)) {
        options = classes;
        classes = null;
      }

      options = prepareAnimationOptions(options);
      if (!classes) {
        classes = element.attr('class') || '';
        if (options.addClass) {
          classes += ' ' + options.addClass;
        }
        if (options.removeClass) {
          classes += ' ' + options.removeClass;
        }
      }

      var classesToAdd = options.addClass;
      var classesToRemove = options.removeClass;

      // the lookupAnimations function returns a series of animation objects that are
      // matched up with one or more of the CSS classes. These animation objects are
      // defined via the module.animation factory function. If nothing is detected then
      // we don't return anything which then makes $animation query the next driver.
      var animations = lookupAnimations(classes);
      var before, after;
      if (animations.length) {
        var afterFn, beforeFn;
        if (event == 'leave') {
          beforeFn = 'leave';
          afterFn = 'afterLeave'; // TODO(matsko): get rid of this
        } else {
          beforeFn = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
          afterFn = event;
        }

        if (event !== 'enter' && event !== 'move') {
          before = packageAnimations(element, event, options, animations, beforeFn);
        }
        after  = packageAnimations(element, event, options, animations, afterFn);
      }

      // no matching animations
      if (!before && !after) return;

      function applyOptions() {
        options.domOperation();
        applyAnimationClasses(element, options);
      }

      function close() {
        animationClosed = true;
        applyOptions();
        applyAnimationStyles(element, options);
      }

      var runner;

      return {
        $$willAnimate: true,
        end: function() {
          if (runner) {
            runner.end();
          } else {
            close();
            runner = new $$AnimateRunner();
            runner.complete(true);
          }
          return runner;
        },
        start: function() {
          if (runner) {
            return runner;
          }

          runner = new $$AnimateRunner();
          var closeActiveAnimations;
          var chain = [];

          if (before) {
            chain.push(function(fn) {
              closeActiveAnimations = before(fn);
            });
          }

          if (chain.length) {
            chain.push(function(fn) {
              applyOptions();
              fn(true);
            });
          } else {
            applyOptions();
          }

          if (after) {
            chain.push(function(fn) {
              closeActiveAnimations = after(fn);
            });
          }

          runner.setHost({
            end: function() {
              endAnimations();
            },
            cancel: function() {
              endAnimations(true);
            }
          });

          $$AnimateRunner.chain(chain, onComplete);
          return runner;

          function onComplete(success) {
            close(success);
            runner.complete(success);
          }

          function endAnimations(cancelled) {
            if (!animationClosed) {
              (closeActiveAnimations || noop)(cancelled);
              onComplete(cancelled);
            }
          }
        }
      };

      function executeAnimationFn(fn, element, event, options, onDone) {
        var args;
        switch (event) {
          case 'animate':
            args = [element, options.from, options.to, onDone];
            break;

          case 'setClass':
            args = [element, classesToAdd, classesToRemove, onDone];
            break;

          case 'addClass':
            args = [element, classesToAdd, onDone];
            break;

          case 'removeClass':
            args = [element, classesToRemove, onDone];
            break;

          default:
            args = [element, onDone];
            break;
        }

        args.push(options);

        var value = fn.apply(fn, args);
        if (value) {
          if (isFunction(value.start)) {
            value = value.start();
          }

          if (value instanceof $$AnimateRunner) {
            value.done(onDone);
          } else if (isFunction(value)) {
            // optional onEnd / onCancel callback
            return value;
          }
        }

        return noop;
      }

      function groupEventedAnimations(element, event, options, animations, fnName) {
        var operations = [];
        forEach(animations, function(ani) {
          var animation = ani[fnName];
          if (!animation) return;

          // note that all of these animations will run in parallel
          operations.push(function() {
            var runner;
            var endProgressCb;

            var resolved = false;
            var onAnimationComplete = function(rejected) {
              if (!resolved) {
                resolved = true;
                (endProgressCb || noop)(rejected);
                runner.complete(!rejected);
              }
            };

            runner = new $$AnimateRunner({
              end: function() {
                onAnimationComplete();
              },
              cancel: function() {
                onAnimationComplete(true);
              }
            });

            endProgressCb = executeAnimationFn(animation, element, event, options, function(result) {
              var cancelled = result === false;
              onAnimationComplete(cancelled);
            });

            return runner;
          });
        });

        return operations;
      }

      function packageAnimations(element, event, options, animations, fnName) {
        var operations = groupEventedAnimations(element, event, options, animations, fnName);
        if (operations.length === 0) {
          var a,b;
          if (fnName === 'beforeSetClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'beforeRemoveClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'beforeAddClass');
          } else if (fnName === 'setClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'removeClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'addClass');
          }

          if (a) {
            operations = operations.concat(a);
          }
          if (b) {
            operations = operations.concat(b);
          }
        }

        if (operations.length === 0) return;

        // TODO(matsko): add documentation
        return function startAnimation(callback) {
          var runners = [];
          if (operations.length) {
            forEach(operations, function(animateFn) {
              runners.push(animateFn());
            });
          }

          runners.length ? $$AnimateRunner.all(runners, callback) : callback();

          return function endFn(reject) {
            forEach(runners, function(runner) {
              reject ? runner.cancel() : runner.end();
            });
          };
        };
      }
    };

    function lookupAnimations(classes) {
      classes = isArray(classes) ? classes : classes.split(' ');
      var matches = [], flagMap = {};
      for (var i=0; i < classes.length; i++) {
        var klass = classes[i],
            animationFactory = $animateProvider.$$registeredAnimations[klass];
        if (animationFactory && !flagMap[klass]) {
          matches.push($injector.get(animationFactory));
          flagMap[klass] = true;
        }
      }
      return matches;
    }
  }];
}];

var $$AnimateJsDriverProvider = ['$$animationProvider', function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateJsDriver');
  this.$get = ['$$animateJs', '$$AnimateRunner', function($$animateJs, $$AnimateRunner) {
    return function initDriverFn(animationDetails) {
      if (animationDetails.from && animationDetails.to) {
        var fromAnimation = prepareAnimation(animationDetails.from);
        var toAnimation = prepareAnimation(animationDetails.to);
        if (!fromAnimation && !toAnimation) return;

        return {
          start: function() {
            var animationRunners = [];

            if (fromAnimation) {
              animationRunners.push(fromAnimation.start());
            }

            if (toAnimation) {
              animationRunners.push(toAnimation.start());
            }

            $$AnimateRunner.all(animationRunners, done);

            var runner = new $$AnimateRunner({
              end: endFnFactory(),
              cancel: endFnFactory()
            });

            return runner;

            function endFnFactory() {
              return function() {
                forEach(animationRunners, function(runner) {
                  // at this point we cannot cancel animations for groups just yet. 1.5+
                  runner.end();
                });
              };
            }

            function done(status) {
              runner.complete(status);
            }
          }
        };
      } else {
        return prepareAnimation(animationDetails);
      }
    };

    function prepareAnimation(animationDetails) {
      // TODO(matsko): make sure to check for grouped animations and delegate down to normal animations
      var element = animationDetails.element;
      var event = animationDetails.event;
      var options = animationDetails.options;
      var classes = animationDetails.classes;
      return $$animateJs(element, event, classes, options);
    }
  }];
}];

var NG_ANIMATE_ATTR_NAME = 'data-ng-animate';
var NG_ANIMATE_PIN_DATA = '$ngAnimatePin';
var $$AnimateQueueProvider = ['$animateProvider', function($animateProvider) {
  var PRE_DIGEST_STATE = 1;
  var RUNNING_STATE = 2;
  var ONE_SPACE = ' ';

  var rules = this.rules = {
    skip: [],
    cancel: [],
    join: []
  };

  function makeTruthyCssClassMap(classString) {
    if (!classString) {
      return null;
    }

    var keys = classString.split(ONE_SPACE);
    var map = Object.create(null);

    forEach(keys, function(key) {
      map[key] = true;
    });
    return map;
  }

  function hasMatchingClasses(newClassString, currentClassString) {
    if (newClassString && currentClassString) {
      var currentClassMap = makeTruthyCssClassMap(currentClassString);
      return newClassString.split(ONE_SPACE).some(function(className) {
        return currentClassMap[className];
      });
    }
  }

  function isAllowed(ruleType, element, currentAnimation, previousAnimation) {
    return rules[ruleType].some(function(fn) {
      return fn(element, currentAnimation, previousAnimation);
    });
  }

  function hasAnimationClasses(animation, and) {
    var a = (animation.addClass || '').length > 0;
    var b = (animation.removeClass || '').length > 0;
    return and ? a && b : a || b;
  }

  rules.join.push(function(element, newAnimation, currentAnimation) {
    // if the new animation is class-based then we can just tack that on
    return !newAnimation.structural && hasAnimationClasses(newAnimation);
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // there is no need to animate anything if no classes are being added and
    // there is no structural animation that will be triggered
    return !newAnimation.structural && !hasAnimationClasses(newAnimation);
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // why should we trigger a new structural animation if the element will
    // be removed from the DOM anyway?
    return currentAnimation.event == 'leave' && newAnimation.structural;
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // if there is an ongoing current animation then don't even bother running the class-based animation
    return currentAnimation.structural && currentAnimation.state === RUNNING_STATE && !newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // there can never be two structural animations running at the same time
    return currentAnimation.structural && newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // if the previous animation is already running, but the new animation will
    // be triggered, but the new animation is structural
    return currentAnimation.state === RUNNING_STATE && newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    var nA = newAnimation.addClass;
    var nR = newAnimation.removeClass;
    var cA = currentAnimation.addClass;
    var cR = currentAnimation.removeClass;

    // early detection to save the global CPU shortage :)
    if ((isUndefined(nA) && isUndefined(nR)) || (isUndefined(cA) && isUndefined(cR))) {
      return false;
    }

    return hasMatchingClasses(nA, cR) || hasMatchingClasses(nR, cA);
  });

  this.$get = ['$$rAF', '$rootScope', '$rootElement', '$document', '$$HashMap',
               '$$animation', '$$AnimateRunner', '$templateRequest', '$$jqLite', '$$forceReflow',
       function($$rAF,   $rootScope,   $rootElement,   $document,   $$HashMap,
                $$animation,   $$AnimateRunner,   $templateRequest,   $$jqLite,   $$forceReflow) {

    var activeAnimationsLookup = new $$HashMap();
    var disabledElementsLookup = new $$HashMap();
    var animationsEnabled = null;

    function postDigestTaskFactory() {
      var postDigestCalled = false;
      return function(fn) {
        // we only issue a call to postDigest before
        // it has first passed. This prevents any callbacks
        // from not firing once the animation has completed
        // since it will be out of the digest cycle.
        if (postDigestCalled) {
          fn();
        } else {
          $rootScope.$$postDigest(function() {
            postDigestCalled = true;
            fn();
          });
        }
      };
    }

    // Wait until all directive and route-related templates are downloaded and
    // compiled. The $templateRequest.totalPendingRequests variable keeps track of
    // all of the remote templates being currently downloaded. If there are no
    // templates currently downloading then the watcher will still fire anyway.
    var deregisterWatch = $rootScope.$watch(
      function() { return $templateRequest.totalPendingRequests === 0; },
      function(isEmpty) {
        if (!isEmpty) return;
        deregisterWatch();

        // Now that all templates have been downloaded, $animate will wait until
        // the post digest queue is empty before enabling animations. By having two
        // calls to $postDigest calls we can ensure that the flag is enabled at the
        // very end of the post digest queue. Since all of the animations in $animate
        // use $postDigest, it's important that the code below executes at the end.
        // This basically means that the page is fully downloaded and compiled before
        // any animations are triggered.
        $rootScope.$$postDigest(function() {
          $rootScope.$$postDigest(function() {
            // we check for null directly in the event that the application already called
            // .enabled() with whatever arguments that it provided it with
            if (animationsEnabled === null) {
              animationsEnabled = true;
            }
          });
        });
      }
    );

    var callbackRegistry = {};

    // remember that the classNameFilter is set during the provider/config
    // stage therefore we can optimize here and setup a helper function
    var classNameFilter = $animateProvider.classNameFilter();
    var isAnimatableClassName = !classNameFilter
              ? function() { return true; }
              : function(className) {
                return classNameFilter.test(className);
              };

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function normalizeAnimationDetails(element, animation) {
      return mergeAnimationDetails(element, animation, {});
    }

    // IE9-11 has no method "contains" in SVG element and in Node.prototype. Bug #10259.
    var contains = Node.prototype.contains || function(arg) {
      // jshint bitwise: false
      return this === arg || !!(this.compareDocumentPosition(arg) & 16);
      // jshint bitwise: true
    };

    function findCallbacks(parent, element, event) {
      var targetNode = getDomNode(element);
      var targetParentNode = getDomNode(parent);

      var matches = [];
      var entries = callbackRegistry[event];
      if (entries) {
        forEach(entries, function(entry) {
          if (contains.call(entry.node, targetNode)) {
            matches.push(entry.callback);
          } else if (event === 'leave' && contains.call(entry.node, targetParentNode)) {
            matches.push(entry.callback);
          }
        });
      }

      return matches;
    }

    return {
      on: function(event, container, callback) {
        var node = extractElementNode(container);
        callbackRegistry[event] = callbackRegistry[event] || [];
        callbackRegistry[event].push({
          node: node,
          callback: callback
        });
      },

      off: function(event, container, callback) {
        var entries = callbackRegistry[event];
        if (!entries) return;

        callbackRegistry[event] = arguments.length === 1
            ? null
            : filterFromRegistry(entries, container, callback);

        function filterFromRegistry(list, matchContainer, matchCallback) {
          var containerNode = extractElementNode(matchContainer);
          return list.filter(function(entry) {
            var isMatch = entry.node === containerNode &&
                            (!matchCallback || entry.callback === matchCallback);
            return !isMatch;
          });
        }
      },

      pin: function(element, parentElement) {
        assertArg(isElement(element), 'element', 'not an element');
        assertArg(isElement(parentElement), 'parentElement', 'not an element');
        element.data(NG_ANIMATE_PIN_DATA, parentElement);
      },

      push: function(element, event, options, domOperation) {
        options = options || {};
        options.domOperation = domOperation;
        return queueAnimation(element, event, options);
      },

      // this method has four signatures:
      //  () - global getter
      //  (bool) - global setter
      //  (element) - element getter
      //  (element, bool) - element setter<F37>
      enabled: function(element, bool) {
        var argCount = arguments.length;

        if (argCount === 0) {
          // () - Global getter
          bool = !!animationsEnabled;
        } else {
          var hasElement = isElement(element);

          if (!hasElement) {
            // (bool) - Global setter
            bool = animationsEnabled = !!element;
          } else {
            var node = getDomNode(element);
            var recordExists = disabledElementsLookup.get(node);

            if (argCount === 1) {
              // (element) - Element getter
              bool = !recordExists;
            } else {
              // (element, bool) - Element setter
              disabledElementsLookup.put(node, !bool);
            }
          }
        }

        return bool;
      }
    };

    function queueAnimation(element, event, initialOptions) {
      // we always make a copy of the options since
      // there should never be any side effects on
      // the input data when running `$animateCss`.
      var options = copy(initialOptions);

      var node, parent;
      element = stripCommentsFromElement(element);
      if (element) {
        node = getDomNode(element);
        parent = element.parent();
      }

      options = prepareAnimationOptions(options);

      // we create a fake runner with a working promise.
      // These methods will become available after the digest has passed
      var runner = new $$AnimateRunner();

      // this is used to trigger callbacks in postDigest mode
      var runInNextPostDigestOrNow = postDigestTaskFactory();

      if (isArray(options.addClass)) {
        options.addClass = options.addClass.join(' ');
      }

      if (options.addClass && !isString(options.addClass)) {
        options.addClass = null;
      }

      if (isArray(options.removeClass)) {
        options.removeClass = options.removeClass.join(' ');
      }

      if (options.removeClass && !isString(options.removeClass)) {
        options.removeClass = null;
      }

      if (options.from && !isObject(options.from)) {
        options.from = null;
      }

      if (options.to && !isObject(options.to)) {
        options.to = null;
      }

      // there are situations where a directive issues an animation for
      // a jqLite wrapper that contains only comment nodes... If this
      // happens then there is no way we can perform an animation
      if (!node) {
        close();
        return runner;
      }

      var className = [node.className, options.addClass, options.removeClass].join(' ');
      if (!isAnimatableClassName(className)) {
        close();
        return runner;
      }

      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      // this is a hard disable of all animations for the application or on
      // the element itself, therefore  there is no need to continue further
      // past this point if not enabled
      // Animations are also disabled if the document is currently hidden (page is not visible
      // to the user), because browsers slow down or do not flush calls to requestAnimationFrame
      var skipAnimations = !animationsEnabled || $document[0].hidden || disabledElementsLookup.get(node);
      var existingAnimation = (!skipAnimations && activeAnimationsLookup.get(node)) || {};
      var hasExistingAnimation = !!existingAnimation.state;

      // there is no point in traversing the same collection of parent ancestors if a followup
      // animation will be run on the same element that already did all that checking work
      if (!skipAnimations && (!hasExistingAnimation || existingAnimation.state != PRE_DIGEST_STATE)) {
        skipAnimations = !areAnimationsAllowed(element, parent, event);
      }

      if (skipAnimations) {
        close();
        return runner;
      }

      if (isStructural) {
        closeChildAnimations(element);
      }

      var newAnimation = {
        structural: isStructural,
        element: element,
        event: event,
        addClass: options.addClass,
        removeClass: options.removeClass,
        close: close,
        options: options,
        runner: runner
      };

      if (hasExistingAnimation) {
        var skipAnimationFlag = isAllowed('skip', element, newAnimation, existingAnimation);
        if (skipAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            close();
            return runner;
          } else {
            mergeAnimationDetails(element, existingAnimation, newAnimation);
            return existingAnimation.runner;
          }
        }
        var cancelAnimationFlag = isAllowed('cancel', element, newAnimation, existingAnimation);
        if (cancelAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            // this will end the animation right away and it is safe
            // to do so since the animation is already running and the
            // runner callback code will run in async
            existingAnimation.runner.end();
          } else if (existingAnimation.structural) {
            // this means that the animation is queued into a digest, but
            // hasn't started yet. Therefore it is safe to run the close
            // method which will call the runner methods in async.
            existingAnimation.close();
          } else {
            // this will merge the new animation options into existing animation options
            mergeAnimationDetails(element, existingAnimation, newAnimation);

            return existingAnimation.runner;
          }
        } else {
          // a joined animation means that this animation will take over the existing one
          // so an example would involve a leave animation taking over an enter. Then when
          // the postDigest kicks in the enter will be ignored.
          var joinAnimationFlag = isAllowed('join', element, newAnimation, existingAnimation);
          if (joinAnimationFlag) {
            if (existingAnimation.state === RUNNING_STATE) {
              normalizeAnimationDetails(element, newAnimation);
            } else {
              applyGeneratedPreparationClasses(element, isStructural ? event : null, options);

              event = newAnimation.event = existingAnimation.event;
              options = mergeAnimationDetails(element, existingAnimation, newAnimation);

              //we return the same runner since only the option values of this animation will
              //be fed into the `existingAnimation`.
              return existingAnimation.runner;
            }
          }
        }
      } else {
        // normalization in this case means that it removes redundant CSS classes that
        // already exist (addClass) or do not exist (removeClass) on the element
        normalizeAnimationDetails(element, newAnimation);
      }

      // when the options are merged and cleaned up we may end up not having to do
      // an animation at all, therefore we should check this before issuing a post
      // digest callback. Structural animations will always run no matter what.
      var isValidAnimation = newAnimation.structural;
      if (!isValidAnimation) {
        // animate (from/to) can be quickly checked first, otherwise we check if any classes are present
        isValidAnimation = (newAnimation.event === 'animate' && Object.keys(newAnimation.options.to || {}).length > 0)
                            || hasAnimationClasses(newAnimation);
      }

      if (!isValidAnimation) {
        close();
        clearElementAnimationState(element);
        return runner;
      }

      // the counter keeps track of cancelled animations
      var counter = (existingAnimation.counter || 0) + 1;
      newAnimation.counter = counter;

      markElementAnimationState(element, PRE_DIGEST_STATE, newAnimation);

      $rootScope.$$postDigest(function() {
        var animationDetails = activeAnimationsLookup.get(node);
        var animationCancelled = !animationDetails;
        animationDetails = animationDetails || {};

        // if addClass/removeClass is called before something like enter then the
        // registered parent element may not be present. The code below will ensure
        // that a final value for parent element is obtained
        var parentElement = element.parent() || [];

        // animate/structural/class-based animations all have requirements. Otherwise there
        // is no point in performing an animation. The parent node must also be set.
        var isValidAnimation = parentElement.length > 0
                                && (animationDetails.event === 'animate'
                                    || animationDetails.structural
                                    || hasAnimationClasses(animationDetails));

        // this means that the previous animation was cancelled
        // even if the follow-up animation is the same event
        if (animationCancelled || animationDetails.counter !== counter || !isValidAnimation) {
          // if another animation did not take over then we need
          // to make sure that the domOperation and options are
          // handled accordingly
          if (animationCancelled) {
            applyAnimationClasses(element, options);
            applyAnimationStyles(element, options);
          }

          // if the event changed from something like enter to leave then we do
          // it, otherwise if it's the same then the end result will be the same too
          if (animationCancelled || (isStructural && animationDetails.event !== event)) {
            options.domOperation();
            runner.end();
          }

          // in the event that the element animation was not cancelled or a follow-up animation
          // isn't allowed to animate from here then we need to clear the state of the element
          // so that any future animations won't read the expired animation data.
          if (!isValidAnimation) {
            clearElementAnimationState(element);
          }

          return;
        }

        // this combined multiple class to addClass / removeClass into a setClass event
        // so long as a structural event did not take over the animation
        event = !animationDetails.structural && hasAnimationClasses(animationDetails, true)
            ? 'setClass'
            : animationDetails.event;

        markElementAnimationState(element, RUNNING_STATE);
        var realRunner = $$animation(element, event, animationDetails.options);

        realRunner.done(function(status) {
          close(!status);
          var animationDetails = activeAnimationsLookup.get(node);
          if (animationDetails && animationDetails.counter === counter) {
            clearElementAnimationState(getDomNode(element));
          }
          notifyProgress(runner, event, 'close', {});
        });

        // this will update the runner's flow-control events based on
        // the `realRunner` object.
        runner.setHost(realRunner);
        notifyProgress(runner, event, 'start', {});
      });

      return runner;

      function notifyProgress(runner, event, phase, data) {
        runInNextPostDigestOrNow(function() {
          var callbacks = findCallbacks(parent, element, event);
          if (callbacks.length) {
            // do not optimize this call here to RAF because
            // we don't know how heavy the callback code here will
            // be and if this code is buffered then this can
            // lead to a performance regression.
            $$rAF(function() {
              forEach(callbacks, function(callback) {
                callback(element, phase, data);
              });
            });
          }
        });
        runner.progress(event, phase, data);
      }

      function close(reject) { // jshint ignore:line
        clearGeneratedClasses(element, options);
        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();
        runner.complete(!reject);
      }
    }

    function closeChildAnimations(element) {
      var node = getDomNode(element);
      var children = node.querySelectorAll('[' + NG_ANIMATE_ATTR_NAME + ']');
      forEach(children, function(child) {
        var state = parseInt(child.getAttribute(NG_ANIMATE_ATTR_NAME));
        var animationDetails = activeAnimationsLookup.get(child);
        if (animationDetails) {
          switch (state) {
            case RUNNING_STATE:
              animationDetails.runner.end();
              /* falls through */
            case PRE_DIGEST_STATE:
              activeAnimationsLookup.remove(child);
              break;
          }
        }
      });
    }

    function clearElementAnimationState(element) {
      var node = getDomNode(element);
      node.removeAttribute(NG_ANIMATE_ATTR_NAME);
      activeAnimationsLookup.remove(node);
    }

    function isMatchingElement(nodeOrElmA, nodeOrElmB) {
      return getDomNode(nodeOrElmA) === getDomNode(nodeOrElmB);
    }

    /**
     * This fn returns false if any of the following is true:
     * a) animations on any parent element are disabled, and animations on the element aren't explicitly allowed
     * b) a parent element has an ongoing structural animation, and animateChildren is false
     * c) the element is not a child of the body
     * d) the element is not a child of the $rootElement
     */
    function areAnimationsAllowed(element, parentElement, event) {
      var bodyElement = jqLite($document[0].body);
      var bodyElementDetected = isMatchingElement(element, bodyElement) || element[0].nodeName === 'HTML';
      var rootElementDetected = isMatchingElement(element, $rootElement);
      var parentAnimationDetected = false;
      var animateChildren;
      var elementDisabled = disabledElementsLookup.get(getDomNode(element));

      var parentHost = jqLite.data(element[0], NG_ANIMATE_PIN_DATA);
      if (parentHost) {
        parentElement = parentHost;
      }

      parentElement = getDomNode(parentElement);

      while (parentElement) {
        if (!rootElementDetected) {
          // angular doesn't want to attempt to animate elements outside of the application
          // therefore we need to ensure that the rootElement is an ancestor of the current element
          rootElementDetected = isMatchingElement(parentElement, $rootElement);
        }

        if (parentElement.nodeType !== ELEMENT_NODE) {
          // no point in inspecting the #document element
          break;
        }

        var details = activeAnimationsLookup.get(parentElement) || {};
        // either an enter, leave or move animation will commence
        // therefore we can't allow any animations to take place
        // but if a parent animation is class-based then that's ok
        if (!parentAnimationDetected) {
          var parentElementDisabled = disabledElementsLookup.get(parentElement);

          if (parentElementDisabled === true && elementDisabled !== false) {
            // disable animations if the user hasn't explicitly enabled animations on the
            // current element
            elementDisabled = true;
            // element is disabled via parent element, no need to check anything else
            break;
          } else if (parentElementDisabled === false) {
            elementDisabled = false;
          }
          parentAnimationDetected = details.structural;
        }

        if (isUndefined(animateChildren) || animateChildren === true) {
          var value = jqLite.data(parentElement, NG_ANIMATE_CHILDREN_DATA);
          if (isDefined(value)) {
            animateChildren = value;
          }
        }

        // there is no need to continue traversing at this point
        if (parentAnimationDetected && animateChildren === false) break;

        if (!bodyElementDetected) {
          // we also need to ensure that the element is or will be a part of the body element
          // otherwise it is pointless to even issue an animation to be rendered
          bodyElementDetected = isMatchingElement(parentElement, bodyElement);
        }

        if (bodyElementDetected && rootElementDetected) {
          // If both body and root have been found, any other checks are pointless,
          // as no animation data should live outside the application
          break;
        }

        if (!rootElementDetected) {
          // If no rootElement is detected, check if the parentElement is pinned to another element
          parentHost = jqLite.data(parentElement, NG_ANIMATE_PIN_DATA);
          if (parentHost) {
            // The pin target element becomes the next parent element
            parentElement = getDomNode(parentHost);
            continue;
          }
        }

        parentElement = parentElement.parentNode;
      }

      var allowAnimation = (!parentAnimationDetected || animateChildren) && elementDisabled !== true;
      return allowAnimation && rootElementDetected && bodyElementDetected;
    }

    function markElementAnimationState(element, state, details) {
      details = details || {};
      details.state = state;

      var node = getDomNode(element);
      node.setAttribute(NG_ANIMATE_ATTR_NAME, state);

      var oldValue = activeAnimationsLookup.get(node);
      var newValue = oldValue
          ? extend(oldValue, details)
          : details;
      activeAnimationsLookup.put(node, newValue);
    }
  }];
}];

var $$AnimationProvider = ['$animateProvider', function($animateProvider) {
  var NG_ANIMATE_REF_ATTR = 'ng-animate-ref';

  var drivers = this.drivers = [];

  var RUNNER_STORAGE_KEY = '$$animationRunner';

  function setRunner(element, runner) {
    element.data(RUNNER_STORAGE_KEY, runner);
  }

  function removeRunner(element) {
    element.removeData(RUNNER_STORAGE_KEY);
  }

  function getRunner(element) {
    return element.data(RUNNER_STORAGE_KEY);
  }

  this.$get = ['$$jqLite', '$rootScope', '$injector', '$$AnimateRunner', '$$HashMap', '$$rAFScheduler',
       function($$jqLite,   $rootScope,   $injector,   $$AnimateRunner,   $$HashMap,   $$rAFScheduler) {

    var animationQueue = [];
    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function sortAnimations(animations) {
      var tree = { children: [] };
      var i, lookup = new $$HashMap();

      // this is done first beforehand so that the hashmap
      // is filled with a list of the elements that will be animated
      for (i = 0; i < animations.length; i++) {
        var animation = animations[i];
        lookup.put(animation.domNode, animations[i] = {
          domNode: animation.domNode,
          fn: animation.fn,
          children: []
        });
      }

      for (i = 0; i < animations.length; i++) {
        processNode(animations[i]);
      }

      return flatten(tree);

      function processNode(entry) {
        if (entry.processed) return entry;
        entry.processed = true;

        var elementNode = entry.domNode;
        var parentNode = elementNode.parentNode;
        lookup.put(elementNode, entry);

        var parentEntry;
        while (parentNode) {
          parentEntry = lookup.get(parentNode);
          if (parentEntry) {
            if (!parentEntry.processed) {
              parentEntry = processNode(parentEntry);
            }
            break;
          }
          parentNode = parentNode.parentNode;
        }

        (parentEntry || tree).children.push(entry);
        return entry;
      }

      function flatten(tree) {
        var result = [];
        var queue = [];
        var i;

        for (i = 0; i < tree.children.length; i++) {
          queue.push(tree.children[i]);
        }

        var remainingLevelEntries = queue.length;
        var nextLevelEntries = 0;
        var row = [];

        for (i = 0; i < queue.length; i++) {
          var entry = queue[i];
          if (remainingLevelEntries <= 0) {
            remainingLevelEntries = nextLevelEntries;
            nextLevelEntries = 0;
            result.push(row);
            row = [];
          }
          row.push(entry.fn);
          entry.children.forEach(function(childEntry) {
            nextLevelEntries++;
            queue.push(childEntry);
          });
          remainingLevelEntries--;
        }

        if (row.length) {
          result.push(row);
        }

        return result;
      }
    }

    // TODO(matsko): document the signature in a better way
    return function(element, event, options) {
      options = prepareAnimationOptions(options);
      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      // there is no animation at the current moment, however
      // these runner methods will get later updated with the
      // methods leading into the driver's end/cancel methods
      // for now they just stop the animation from starting
      var runner = new $$AnimateRunner({
        end: function() { close(); },
        cancel: function() { close(true); }
      });

      if (!drivers.length) {
        close();
        return runner;
      }

      setRunner(element, runner);

      var classes = mergeClasses(element.attr('class'), mergeClasses(options.addClass, options.removeClass));
      var tempClasses = options.tempClasses;
      if (tempClasses) {
        classes += ' ' + tempClasses;
        options.tempClasses = null;
      }

      var prepareClassName;
      if (isStructural) {
        prepareClassName = 'ng-' + event + PREPARE_CLASS_SUFFIX;
        $$jqLite.addClass(element, prepareClassName);
      }

      animationQueue.push({
        // this data is used by the postDigest code and passed into
        // the driver step function
        element: element,
        classes: classes,
        event: event,
        structural: isStructural,
        options: options,
        beforeStart: beforeStart,
        close: close
      });

      element.on('$destroy', handleDestroyedElement);

      // we only want there to be one function called within the post digest
      // block. This way we can group animations for all the animations that
      // were apart of the same postDigest flush call.
      if (animationQueue.length > 1) return runner;

      $rootScope.$$postDigest(function() {
        var animations = [];
        forEach(animationQueue, function(entry) {
          // the element was destroyed early on which removed the runner
          // form its storage. This means we can't animate this element
          // at all and it already has been closed due to destruction.
          if (getRunner(entry.element)) {
            animations.push(entry);
          } else {
            entry.close();
          }
        });

        // now any future animations will be in another postDigest
        animationQueue.length = 0;

        var groupedAnimations = groupAnimations(animations);
        var toBeSortedAnimations = [];

        forEach(groupedAnimations, function(animationEntry) {
          toBeSortedAnimations.push({
            domNode: getDomNode(animationEntry.from ? animationEntry.from.element : animationEntry.element),
            fn: function triggerAnimationStart() {
              // it's important that we apply the `ng-animate` CSS class and the
              // temporary classes before we do any driver invoking since these
              // CSS classes may be required for proper CSS detection.
              animationEntry.beforeStart();

              var startAnimationFn, closeFn = animationEntry.close;

              // in the event that the element was removed before the digest runs or
              // during the RAF sequencing then we should not trigger the animation.
              var targetElement = animationEntry.anchors
                  ? (animationEntry.from.element || animationEntry.to.element)
                  : animationEntry.element;

              if (getRunner(targetElement)) {
                var operation = invokeFirstDriver(animationEntry);
                if (operation) {
                  startAnimationFn = operation.start;
                }
              }

              if (!startAnimationFn) {
                closeFn();
              } else {
                var animationRunner = startAnimationFn();
                animationRunner.done(function(status) {
                  closeFn(!status);
                });
                updateAnimationRunners(animationEntry, animationRunner);
              }
            }
          });
        });

        // we need to sort each of the animations in order of parent to child
        // relationships. This ensures that the child classes are applied at the
        // right time.
        $$rAFScheduler(sortAnimations(toBeSortedAnimations));
      });

      return runner;

      // TODO(matsko): change to reference nodes
      function getAnchorNodes(node) {
        var SELECTOR = '[' + NG_ANIMATE_REF_ATTR + ']';
        var items = node.hasAttribute(NG_ANIMATE_REF_ATTR)
              ? [node]
              : node.querySelectorAll(SELECTOR);
        var anchors = [];
        forEach(items, function(node) {
          var attr = node.getAttribute(NG_ANIMATE_REF_ATTR);
          if (attr && attr.length) {
            anchors.push(node);
          }
        });
        return anchors;
      }

      function groupAnimations(animations) {
        var preparedAnimations = [];
        var refLookup = {};
        forEach(animations, function(animation, index) {
          var element = animation.element;
          var node = getDomNode(element);
          var event = animation.event;
          var enterOrMove = ['enter', 'move'].indexOf(event) >= 0;
          var anchorNodes = animation.structural ? getAnchorNodes(node) : [];

          if (anchorNodes.length) {
            var direction = enterOrMove ? 'to' : 'from';

            forEach(anchorNodes, function(anchor) {
              var key = anchor.getAttribute(NG_ANIMATE_REF_ATTR);
              refLookup[key] = refLookup[key] || {};
              refLookup[key][direction] = {
                animationID: index,
                element: jqLite(anchor)
              };
            });
          } else {
            preparedAnimations.push(animation);
          }
        });

        var usedIndicesLookup = {};
        var anchorGroups = {};
        forEach(refLookup, function(operations, key) {
          var from = operations.from;
          var to = operations.to;

          if (!from || !to) {
            // only one of these is set therefore we can't have an
            // anchor animation since all three pieces are required
            var index = from ? from.animationID : to.animationID;
            var indexKey = index.toString();
            if (!usedIndicesLookup[indexKey]) {
              usedIndicesLookup[indexKey] = true;
              preparedAnimations.push(animations[index]);
            }
            return;
          }

          var fromAnimation = animations[from.animationID];
          var toAnimation = animations[to.animationID];
          var lookupKey = from.animationID.toString();
          if (!anchorGroups[lookupKey]) {
            var group = anchorGroups[lookupKey] = {
              structural: true,
              beforeStart: function() {
                fromAnimation.beforeStart();
                toAnimation.beforeStart();
              },
              close: function() {
                fromAnimation.close();
                toAnimation.close();
              },
              classes: cssClassesIntersection(fromAnimation.classes, toAnimation.classes),
              from: fromAnimation,
              to: toAnimation,
              anchors: [] // TODO(matsko): change to reference nodes
            };

            // the anchor animations require that the from and to elements both have at least
            // one shared CSS class which effectively marries the two elements together to use
            // the same animation driver and to properly sequence the anchor animation.
            if (group.classes.length) {
              preparedAnimations.push(group);
            } else {
              preparedAnimations.push(fromAnimation);
              preparedAnimations.push(toAnimation);
            }
          }

          anchorGroups[lookupKey].anchors.push({
            'out': from.element, 'in': to.element
          });
        });

        return preparedAnimations;
      }

      function cssClassesIntersection(a,b) {
        a = a.split(' ');
        b = b.split(' ');
        var matches = [];

        for (var i = 0; i < a.length; i++) {
          var aa = a[i];
          if (aa.substring(0,3) === 'ng-') continue;

          for (var j = 0; j < b.length; j++) {
            if (aa === b[j]) {
              matches.push(aa);
              break;
            }
          }
        }

        return matches.join(' ');
      }

      function invokeFirstDriver(animationDetails) {
        // we loop in reverse order since the more general drivers (like CSS and JS)
        // may attempt more elements, but custom drivers are more particular
        for (var i = drivers.length - 1; i >= 0; i--) {
          var driverName = drivers[i];
          if (!$injector.has(driverName)) continue; // TODO(matsko): remove this check

          var factory = $injector.get(driverName);
          var driver = factory(animationDetails);
          if (driver) {
            return driver;
          }
        }
      }

      function beforeStart() {
        element.addClass(NG_ANIMATE_CLASSNAME);
        if (tempClasses) {
          $$jqLite.addClass(element, tempClasses);
        }
        if (prepareClassName) {
          $$jqLite.removeClass(element, prepareClassName);
          prepareClassName = null;
        }
      }

      function updateAnimationRunners(animation, newRunner) {
        if (animation.from && animation.to) {
          update(animation.from.element);
          update(animation.to.element);
        } else {
          update(animation.element);
        }

        function update(element) {
          getRunner(element).setHost(newRunner);
        }
      }

      function handleDestroyedElement() {
        var runner = getRunner(element);
        if (runner && (event !== 'leave' || !options.$$domOperationFired)) {
          runner.end();
        }
      }

      function close(rejected) { // jshint ignore:line
        element.off('$destroy', handleDestroyedElement);
        removeRunner(element);

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();

        if (tempClasses) {
          $$jqLite.removeClass(element, tempClasses);
        }

        element.removeClass(NG_ANIMATE_CLASSNAME);
        runner.complete(!rejected);
      }
    };
  }];
}];

/**
 * @ngdoc directive
 * @name ngAnimateSwap
 * @restrict A
 * @scope
 *
 * @description
 *
 * ngAnimateSwap is a animation-oriented directive that allows for the container to
 * be removed and entered in whenever the associated expression changes. A
 * common usecase for this directive is a rotating banner or slider component which
 * contains one image being present at a time. When the active image changes
 * then the old image will perform a `leave` animation and the new element
 * will be inserted via an `enter` animation.
 *
 * @animations
 * | Animation                        | Occurs                               |
 * |----------------------------------|--------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the new element is inserted to the DOM  |
 * | {@link ng.$animate#leave leave}  | when the old element is removed from the DOM |
 *
 * @example
 * <example name="ngAnimateSwap-directive" module="ngAnimateSwapExample"
 *          deps="angular-animate.js"
 *          animations="true" fixBase="true">
 *   <file name="index.html">
 *     <div class="container" ng-controller="AppCtrl">
 *       <div ng-animate-swap="number" class="cell swap-animation" ng-class="colorClass(number)">
 *         {{ number }}
 *       </div>
 *     </div>
 *   </file>
 *   <file name="script.js">
 *     angular.module('ngAnimateSwapExample', ['ngAnimate'])
 *       .controller('AppCtrl', ['$scope', '$interval', function($scope, $interval) {
 *         $scope.number = 0;
 *         $interval(function() {
 *           $scope.number++;
 *         }, 1000);
 *
 *         var colors = ['red','blue','green','yellow','orange'];
 *         $scope.colorClass = function(number) {
 *           return colors[number % colors.length];
 *         };
 *       }]);
 *   </file>
 *  <file name="animations.css">
 *  .container {
 *    height:250px;
 *    width:250px;
 *    position:relative;
 *    overflow:hidden;
 *    border:2px solid black;
 *  }
 *  .container .cell {
 *    font-size:150px;
 *    text-align:center;
 *    line-height:250px;
 *    position:absolute;
 *    top:0;
 *    left:0;
 *    right:0;
 *    border-bottom:2px solid black;
 *  }
 *  .swap-animation.ng-enter, .swap-animation.ng-leave {
 *    transition:0.5s linear all;
 *  }
 *  .swap-animation.ng-enter {
 *    top:-250px;
 *  }
 *  .swap-animation.ng-enter-active {
 *    top:0px;
 *  }
 *  .swap-animation.ng-leave {
 *    top:0px;
 *  }
 *  .swap-animation.ng-leave-active {
 *    top:250px;
 *  }
 *  .red { background:red; }
 *  .green { background:green; }
 *  .blue { background:blue; }
 *  .yellow { background:yellow; }
 *  .orange { background:orange; }
 *  </file>
 * </example>
 */
var ngAnimateSwapDirective = ['$animate', '$rootScope', function($animate, $rootScope) {
  return {
    restrict: 'A',
    transclude: 'element',
    terminal: true,
    priority: 600, // we use 600 here to ensure that the directive is caught before others
    link: function(scope, $element, attrs, ctrl, $transclude) {
      var previousElement, previousScope;
      scope.$watchCollection(attrs.ngAnimateSwap || attrs['for'], function(value) {
        if (previousElement) {
          $animate.leave(previousElement);
        }
        if (previousScope) {
          previousScope.$destroy();
          previousScope = null;
        }
        if (value || value === 0) {
          previousScope = scope.$new();
          $transclude(previousScope, function(element) {
            previousElement = element;
            $animate.enter(element, null, $element);
          });
        }
      });
    }
  };
}];

/* global angularAnimateModule: true,

   ngAnimateSwapDirective,
   $$AnimateAsyncRunFactory,
   $$rAFSchedulerFactory,
   $$AnimateChildrenDirective,
   $$AnimateQueueProvider,
   $$AnimationProvider,
   $AnimateCssProvider,
   $$AnimateCssDriverProvider,
   $$AnimateJsProvider,
   $$AnimateJsDriverProvider,
*/

/**
 * @ngdoc module
 * @name ngAnimate
 * @description
 *
 * The `ngAnimate` module provides support for CSS-based animations (keyframes and transitions) as well as JavaScript-based animations via
 * callback hooks. Animations are not enabled by default, however, by including `ngAnimate` the animation hooks are enabled for an Angular app.
 *
 * <div doc-module-components="ngAnimate"></div>
 *
 * # Usage
 * Simply put, there are two ways to make use of animations when ngAnimate is used: by using **CSS** and **JavaScript**. The former works purely based
 * using CSS (by using matching CSS selectors/styles) and the latter triggers animations that are registered via `module.animation()`. For
 * both CSS and JS animations the sole requirement is to have a matching `CSS class` that exists both in the registered animation and within
 * the HTML element that the animation will be triggered on.
 *
 * ## Directive Support
 * The following directives are "animation aware":
 *
 * | Directive                                                                                                | Supported Animations                                                     |
 * |----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
 * | {@link ng.directive:ngRepeat#animations ngRepeat}                                                        | enter, leave and move                                                    |
 * | {@link ngRoute.directive:ngView#animations ngView}                                                       | enter and leave                                                          |
 * | {@link ng.directive:ngInclude#animations ngInclude}                                                      | enter and leave                                                          |
 * | {@link ng.directive:ngSwitch#animations ngSwitch}                                                        | enter and leave                                                          |
 * | {@link ng.directive:ngIf#animations ngIf}                                                                | enter and leave                                                          |
 * | {@link ng.directive:ngClass#animations ngClass}                                                          | add and remove (the CSS class(es) present)                               |
 * | {@link ng.directive:ngShow#animations ngShow} & {@link ng.directive:ngHide#animations ngHide}            | add and remove (the ng-hide class value)                                 |
 * | {@link ng.directive:form#animation-hooks form} & {@link ng.directive:ngModel#animation-hooks ngModel}    | add and remove (dirty, pristine, valid, invalid & all other validations) |
 * | {@link module:ngMessages#animations ngMessages}                                                          | add and remove (ng-active & ng-inactive)                                 |
 * | {@link module:ngMessages#animations ngMessage}                                                           | enter and leave                                                          |
 *
 * (More information can be found by visiting each the documentation associated with each directive.)
 *
 * ## CSS-based Animations
 *
 * CSS-based animations with ngAnimate are unique since they require no JavaScript code at all. By using a CSS class that we reference between our HTML
 * and CSS code we can create an animation that will be picked up by Angular when an the underlying directive performs an operation.
 *
 * The example below shows how an `enter` animation can be made possible on an element using `ng-if`:
 *
 * ```html
 * <div ng-if="bool" class="fade">
 *    Fade me in out
 * </div>
 * <button ng-click="bool=true">Fade In!</button>
 * <button ng-click="bool=false">Fade Out!</button>
 * ```
 *
 * Notice the CSS class **fade**? We can now create the CSS transition code that references this class:
 *
 * ```css
 * /&#42; The starting CSS styles for the enter animation &#42;/
 * .fade.ng-enter {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 *
 * /&#42; The finishing CSS styles for the enter animation &#42;/
 * .fade.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * ```
 *
 * The key thing to remember here is that, depending on the animation event (which each of the directives above trigger depending on what's going on) two
 * generated CSS classes will be applied to the element; in the example above we have `.ng-enter` and `.ng-enter-active`. For CSS transitions, the transition
 * code **must** be defined within the starting CSS class (in this case `.ng-enter`). The destination class is what the transition will animate towards.
 *
 * If for example we wanted to create animations for `leave` and `move` (ngRepeat triggers move) then we can do so using the same CSS naming conventions:
 *
 * ```css
 * /&#42; now the element will fade out before it is removed from the DOM &#42;/
 * .fade.ng-leave {
 *   transition:0.5s linear all;
 *   opacity:1;
 * }
 * .fade.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * We can also make use of **CSS Keyframes** by referencing the keyframe animation within the starting CSS class:
 *
 * ```css
 * /&#42; there is no need to define anything inside of the destination
 * CSS class since the keyframe will take charge of the animation &#42;/
 * .fade.ng-leave {
 *   animation: my_fade_animation 0.5s linear;
 *   -webkit-animation: my_fade_animation 0.5s linear;
 * }
 *
 * @keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 *
 * @-webkit-keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 * ```
 *
 * Feel free also mix transitions and keyframes together as well as any other CSS classes on the same element.
 *
 * ### CSS Class-based Animations
 *
 * Class-based animations (animations that are triggered via `ngClass`, `ngShow`, `ngHide` and some other directives) have a slightly different
 * naming convention. Class-based animations are basic enough that a standard transition or keyframe can be referenced on the class being added
 * and removed.
 *
 * For example if we wanted to do a CSS animation for `ngHide` then we place an animation on the `.ng-hide` CSS class:
 *
 * ```html
 * <div ng-show="bool" class="fade">
 *   Show and hide me
 * </div>
 * <button ng-click="bool=true">Toggle</button>
 *
 * <style>
 * .fade.ng-hide {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 * </style>
 * ```
 *
 * All that is going on here with ngShow/ngHide behind the scenes is the `.ng-hide` class is added/removed (when the hidden state is valid). Since
 * ngShow and ngHide are animation aware then we can match up a transition and ngAnimate handles the rest.
 *
 * In addition the addition and removal of the CSS class, ngAnimate also provides two helper methods that we can use to further decorate the animation
 * with CSS styles.
 *
 * ```html
 * <div ng-class="{on:onOff}" class="highlight">
 *   Highlight this box
 * </div>
 * <button ng-click="onOff=!onOff">Toggle</button>
 *
 * <style>
 * .highlight {
 *   transition:0.5s linear all;
 * }
 * .highlight.on-add {
 *   background:white;
 * }
 * .highlight.on {
 *   background:yellow;
 * }
 * .highlight.on-remove {
 *   background:black;
 * }
 * </style>
 * ```
 *
 * We can also make use of CSS keyframes by placing them within the CSS classes.
 *
 *
 * ### CSS Staggering Animations
 * A Staggering animation is a collection of animations that are issued with a slight delay in between each successive operation resulting in a
 * curtain-like effect. The ngAnimate module (versions >=1.2) supports staggering animations and the stagger effect can be
 * performed by creating a **ng-EVENT-stagger** CSS class and attaching that class to the base CSS class used for
 * the animation. The style property expected within the stagger class can either be a **transition-delay** or an
 * **animation-delay** property (or both if your animation contains both transitions and keyframe animations).
 *
 * ```css
 * .my-animation.ng-enter {
 *   /&#42; standard transition code &#42;/
 *   transition: 1s linear all;
 *   opacity:0;
 * }
 * .my-animation.ng-enter-stagger {
 *   /&#42; this will have a 100ms delay between each successive leave animation &#42;/
 *   transition-delay: 0.1s;
 *
 *   /&#42; As of 1.4.4, this must always be set: it signals ngAnimate
 *     to not accidentally inherit a delay property from another CSS class &#42;/
 *   transition-duration: 0s;
 * }
 * .my-animation.ng-enter.ng-enter-active {
 *   /&#42; standard transition styles &#42;/
 *   opacity:1;
 * }
 * ```
 *
 * Staggering animations work by default in ngRepeat (so long as the CSS class is defined). Outside of ngRepeat, to use staggering animations
 * on your own, they can be triggered by firing multiple calls to the same event on $animate. However, the restrictions surrounding this
 * are that each of the elements must have the same CSS className value as well as the same parent element. A stagger operation
 * will also be reset if one or more animation frames have passed since the multiple calls to `$animate` were fired.
 *
 * The following code will issue the **ng-leave-stagger** event on the element provided:
 *
 * ```js
 * var kids = parent.children();
 *
 * $animate.leave(kids[0]); //stagger index=0
 * $animate.leave(kids[1]); //stagger index=1
 * $animate.leave(kids[2]); //stagger index=2
 * $animate.leave(kids[3]); //stagger index=3
 * $animate.leave(kids[4]); //stagger index=4
 *
 * window.requestAnimationFrame(function() {
 *   //stagger has reset itself
 *   $animate.leave(kids[5]); //stagger index=0
 *   $animate.leave(kids[6]); //stagger index=1
 *
 *   $scope.$digest();
 * });
 * ```
 *
 * Stagger animations are currently only supported within CSS-defined animations.
 *
 * ### The `ng-animate` CSS class
 *
 * When ngAnimate is animating an element it will apply the `ng-animate` CSS class to the element for the duration of the animation.
 * This is a temporary CSS class and it will be removed once the animation is over (for both JavaScript and CSS-based animations).
 *
 * Therefore, animations can be applied to an element using this temporary class directly via CSS.
 *
 * ```css
 * .zipper.ng-animate {
 *   transition:0.5s linear all;
 * }
 * .zipper.ng-enter {
 *   opacity:0;
 * }
 * .zipper.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * .zipper.ng-leave {
 *   opacity:1;
 * }
 * .zipper.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * (Note that the `ng-animate` CSS class is reserved and it cannot be applied on an element directly since ngAnimate will always remove
 * the CSS class once an animation has completed.)
 *
 *
 * ### The `ng-[event]-prepare` class
 *
 * This is a special class that can be used to prevent unwanted flickering / flash of content before
 * the actual animation starts. The class is added as soon as an animation is initialized, but removed
 * before the actual animation starts (after waiting for a $digest).
 * It is also only added for *structural* animations (`enter`, `move`, and `leave`).
 *
 * In practice, flickering can appear when nesting elements with structural animations such as `ngIf`
 * into elements that have class-based animations such as `ngClass`.
 *
 * ```html
 * <div ng-class="{red: myProp}">
 *   <div ng-class="{blue: myProp}">
 *     <div class="message" ng-if="myProp"></div>
 *   </div>
 * </div>
 * ```
 *
 * It is possible that during the `enter` animation, the `.message` div will be briefly visible before it starts animating.
 * In that case, you can add styles to the CSS that make sure the element stays hidden before the animation starts:
 *
 * ```css
 * .message.ng-enter-prepare {
 *   opacity: 0;
 * }
 *
 * ```
 *
 * ## JavaScript-based Animations
 *
 * ngAnimate also allows for animations to be consumed by JavaScript code. The approach is similar to CSS-based animations (where there is a shared
 * CSS class that is referenced in our HTML code) but in addition we need to register the JavaScript animation on the module. By making use of the
 * `module.animation()` module function we can register the animation.
 *
 * Let's see an example of a enter/leave animation using `ngRepeat`:
 *
 * ```html
 * <div ng-repeat="item in items" class="slide">
 *   {{ item }}
 * </div>
 * ```
 *
 * See the **slide** CSS class? Let's use that class to define an animation that we'll structure in our module code by using `module.animation`:
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     // make note that other events (like addClass/removeClass)
 *     // have different function input parameters
 *     enter: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *
 *       // remember to call doneFn so that angular
 *       // knows that the animation has concluded
 *     },
 *
 *     move: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *     },
 *
 *     leave: function(element, doneFn) {
 *       jQuery(element).fadeOut(1000, doneFn);
 *     }
 *   }
 * }]);
 * ```
 *
 * The nice thing about JS-based animations is that we can inject other services and make use of advanced animation libraries such as
 * greensock.js and velocity.js.
 *
 * If our animation code class-based (meaning that something like `ngClass`, `ngHide` and `ngShow` triggers it) then we can still define
 * our animations inside of the same registered animation, however, the function input arguments are a bit different:
 *
 * ```html
 * <div ng-class="color" class="colorful">
 *   this box is moody
 * </div>
 * <button ng-click="color='red'">Change to red</button>
 * <button ng-click="color='blue'">Change to blue</button>
 * <button ng-click="color='green'">Change to green</button>
 * ```
 *
 * ```js
 * myModule.animation('.colorful', [function() {
 *   return {
 *     addClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     removeClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     setClass: function(element, addedClass, removedClass, doneFn) {
 *       // do some cool animation and call the doneFn
 *     }
 *   }
 * }]);
 * ```
 *
 * ## CSS + JS Animations Together
 *
 * AngularJS 1.4 and higher has taken steps to make the amalgamation of CSS and JS animations more flexible. However, unlike earlier versions of Angular,
 * defining CSS and JS animations to work off of the same CSS class will not work anymore. Therefore the example below will only result in **JS animations taking
 * charge of the animation**:
 *
 * ```html
 * <div ng-if="bool" class="slide">
 *   Slide in and out
 * </div>
 * ```
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     enter: function(element, doneFn) {
 *       jQuery(element).slideIn(1000, doneFn);
 *     }
 *   }
 * }]);
 * ```
 *
 * ```css
 * .slide.ng-enter {
 *   transition:0.5s linear all;
 *   transform:translateY(-100px);
 * }
 * .slide.ng-enter.ng-enter-active {
 *   transform:translateY(0);
 * }
 * ```
 *
 * Does this mean that CSS and JS animations cannot be used together? Do JS-based animations always have higher priority? We can make up for the
 * lack of CSS animations by using the `$animateCss` service to trigger our own tweaked-out, CSS-based animations directly from
 * our own JS-based animation code:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element) {
*        // this will trigger `.slide.ng-enter` and `.slide.ng-enter-active`.
 *       return $animateCss(element, {
 *         event: 'enter',
 *         structural: true
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * The nice thing here is that we can save bandwidth by sticking to our CSS-based animation code and we don't need to rely on a 3rd-party animation framework.
 *
 * The `$animateCss` service is very powerful since we can feed in all kinds of extra properties that will be evaluated and fed into a CSS transition or
 * keyframe animation. For example if we wanted to animate the height of an element while adding and removing classes then we can do so by providing that
 * data into `$animateCss` directly:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element) {
 *       return $animateCss(element, {
 *         event: 'enter',
 *         structural: true,
 *         addClass: 'maroon-setting',
 *         from: { height:0 },
 *         to: { height: 200 }
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Now we can fill in the rest via our transition CSS code:
 *
 * ```css
 * /&#42; the transition tells ngAnimate to make the animation happen &#42;/
 * .slide.ng-enter { transition:0.5s linear all; }
 *
 * /&#42; this extra CSS class will be absorbed into the transition
 * since the $animateCss code is adding the class &#42;/
 * .maroon-setting { background:red; }
 * ```
 *
 * And `$animateCss` will figure out the rest. Just make sure to have the `done()` callback fire the `doneFn` function to signal when the animation is over.
 *
 * To learn more about what's possible be sure to visit the {@link ngAnimate.$animateCss $animateCss service}.
 *
 * ## Animation Anchoring (via `ng-animate-ref`)
 *
 * ngAnimate in AngularJS 1.4 comes packed with the ability to cross-animate elements between
 * structural areas of an application (like views) by pairing up elements using an attribute
 * called `ng-animate-ref`.
 *
 * Let's say for example we have two views that are managed by `ng-view` and we want to show
 * that there is a relationship between two components situated in within these views. By using the
 * `ng-animate-ref` attribute we can identify that the two components are paired together and we
 * can then attach an animation, which is triggered when the view changes.
 *
 * Say for example we have the following template code:
 *
 * ```html
 * <!-- index.html -->
 * <div ng-view class="view-animation">
 * </div>
 *
 * <!-- home.html -->
 * <a href="#/banner-page">
 *   <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * </a>
 *
 * <!-- banner-page.html -->
 * <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * ```
 *
 * Now, when the view changes (once the link is clicked), ngAnimate will examine the
 * HTML contents to see if there is a match reference between any components in the view
 * that is leaving and the view that is entering. It will scan both the view which is being
 * removed (leave) and inserted (enter) to see if there are any paired DOM elements that
 * contain a matching ref value.
 *
 * The two images match since they share the same ref value. ngAnimate will now create a
 * transport element (which is a clone of the first image element) and it will then attempt
 * to animate to the position of the second image element in the next view. For the animation to
 * work a special CSS class called `ng-anchor` will be added to the transported element.
 *
 * We can now attach a transition onto the `.banner.ng-anchor` CSS class and then
 * ngAnimate will handle the entire transition for us as well as the addition and removal of
 * any changes of CSS classes between the elements:
 *
 * ```css
 * .banner.ng-anchor {
 *   /&#42; this animation will last for 1 second since there are
 *          two phases to the animation (an `in` and an `out` phase) &#42;/
 *   transition:0.5s linear all;
 * }
 * ```
 *
 * We also **must** include animations for the views that are being entered and removed
 * (otherwise anchoring wouldn't be possible since the new view would be inserted right away).
 *
 * ```css
 * .view-animation.ng-enter, .view-animation.ng-leave {
 *   transition:0.5s linear all;
 *   position:fixed;
 *   left:0;
 *   top:0;
 *   width:100%;
 * }
 * .view-animation.ng-enter {
 *   transform:translateX(100%);
 * }
 * .view-animation.ng-leave,
 * .view-animation.ng-enter.ng-enter-active {
 *   transform:translateX(0%);
 * }
 * .view-animation.ng-leave.ng-leave-active {
 *   transform:translateX(-100%);
 * }
 * ```
 *
 * Now we can jump back to the anchor animation. When the animation happens, there are two stages that occur:
 * an `out` and an `in` stage. The `out` stage happens first and that is when the element is animated away
 * from its origin. Once that animation is over then the `in` stage occurs which animates the
 * element to its destination. The reason why there are two animations is to give enough time
 * for the enter animation on the new element to be ready.
 *
 * The example above sets up a transition for both the in and out phases, but we can also target the out or
 * in phases directly via `ng-anchor-out` and `ng-anchor-in`.
 *
 * ```css
 * .banner.ng-anchor-out {
 *   transition: 0.5s linear all;
 *
 *   /&#42; the scale will be applied during the out animation,
 *          but will be animated away when the in animation runs &#42;/
 *   transform: scale(1.2);
 * }
 *
 * .banner.ng-anchor-in {
 *   transition: 1s linear all;
 * }
 * ```
 *
 *
 *
 *
 * ### Anchoring Demo
 *
  <example module="anchoringExample"
           name="anchoringExample"
           id="anchoringExample"
           deps="angular-animate.js;angular-route.js"
           animations="true">
    <file name="index.html">
      <a href="#/">Home</a>
      <hr />
      <div class="view-container">
        <div ng-view class="view"></div>
      </div>
    </file>
    <file name="script.js">
      angular.module('anchoringExample', ['ngAnimate', 'ngRoute'])
        .config(['$routeProvider', function($routeProvider) {
          $routeProvider.when('/', {
            templateUrl: 'home.html',
            controller: 'HomeController as home'
          });
          $routeProvider.when('/profile/:id', {
            templateUrl: 'profile.html',
            controller: 'ProfileController as profile'
          });
        }])
        .run(['$rootScope', function($rootScope) {
          $rootScope.records = [
            { id:1, title: "Miss Beulah Roob" },
            { id:2, title: "Trent Morissette" },
            { id:3, title: "Miss Ava Pouros" },
            { id:4, title: "Rod Pouros" },
            { id:5, title: "Abdul Rice" },
            { id:6, title: "Laurie Rutherford Sr." },
            { id:7, title: "Nakia McLaughlin" },
            { id:8, title: "Jordon Blanda DVM" },
            { id:9, title: "Rhoda Hand" },
            { id:10, title: "Alexandrea Sauer" }
          ];
        }])
        .controller('HomeController', [function() {
          //empty
        }])
        .controller('ProfileController', ['$rootScope', '$routeParams', function($rootScope, $routeParams) {
          var index = parseInt($routeParams.id, 10);
          var record = $rootScope.records[index - 1];

          this.title = record.title;
          this.id = record.id;
        }]);
    </file>
    <file name="home.html">
      <h2>Welcome to the home page</h1>
      <p>Please click on an element</p>
      <a class="record"
         ng-href="#/profile/{{ record.id }}"
         ng-animate-ref="{{ record.id }}"
         ng-repeat="record in records">
        {{ record.title }}
      </a>
    </file>
    <file name="profile.html">
      <div class="profile record" ng-animate-ref="{{ profile.id }}">
        {{ profile.title }}
      </div>
    </file>
    <file name="animations.css">
      .record {
        display:block;
        font-size:20px;
      }
      .profile {
        background:black;
        color:white;
        font-size:100px;
      }
      .view-container {
        position:relative;
      }
      .view-container > .view.ng-animate {
        position:absolute;
        top:0;
        left:0;
        width:100%;
        min-height:500px;
      }
      .view.ng-enter, .view.ng-leave,
      .record.ng-anchor {
        transition:0.5s linear all;
      }
      .view.ng-enter {
        transform:translateX(100%);
      }
      .view.ng-enter.ng-enter-active, .view.ng-leave {
        transform:translateX(0%);
      }
      .view.ng-leave.ng-leave-active {
        transform:translateX(-100%);
      }
      .record.ng-anchor-out {
        background:red;
      }
    </file>
  </example>
 *
 * ### How is the element transported?
 *
 * When an anchor animation occurs, ngAnimate will clone the starting element and position it exactly where the starting
 * element is located on screen via absolute positioning. The cloned element will be placed inside of the root element
 * of the application (where ng-app was defined) and all of the CSS classes of the starting element will be applied. The
 * element will then animate into the `out` and `in` animations and will eventually reach the coordinates and match
 * the dimensions of the destination element. During the entire animation a CSS class of `.ng-animate-shim` will be applied
 * to both the starting and destination elements in order to hide them from being visible (the CSS styling for the class
 * is: `visibility:hidden`). Once the anchor reaches its destination then it will be removed and the destination element
 * will become visible since the shim class will be removed.
 *
 * ### How is the morphing handled?
 *
 * CSS Anchoring relies on transitions and keyframes and the internal code is intelligent enough to figure out
 * what CSS classes differ between the starting element and the destination element. These different CSS classes
 * will be added/removed on the anchor element and a transition will be applied (the transition that is provided
 * in the anchor class). Long story short, ngAnimate will figure out what classes to add and remove which will
 * make the transition of the element as smooth and automatic as possible. Be sure to use simple CSS classes that
 * do not rely on DOM nesting structure so that the anchor element appears the same as the starting element (since
 * the cloned element is placed inside of root element which is likely close to the body element).
 *
 * Note that if the root element is on the `<html>` element then the cloned node will be placed inside of body.
 *
 *
 * ## Using $animate in your directive code
 *
 * So far we've explored how to feed in animations into an Angular application, but how do we trigger animations within our own directives in our application?
 * By injecting the `$animate` service into our directive code, we can trigger structural and class-based hooks which can then be consumed by animations. Let's
 * imagine we have a greeting box that shows and hides itself when the data changes
 *
 * ```html
 * <greeting-box active="onOrOff">Hi there</greeting-box>
 * ```
 *
 * ```js
 * ngModule.directive('greetingBox', ['$animate', function($animate) {
 *   return function(scope, element, attrs) {
 *     attrs.$observe('active', function(value) {
 *       value ? $animate.addClass(element, 'on') : $animate.removeClass(element, 'on');
 *     });
 *   });
 * }]);
 * ```
 *
 * Now the `on` CSS class is added and removed on the greeting box component. Now if we add a CSS class on top of the greeting box element
 * in our HTML code then we can trigger a CSS or JS animation to happen.
 *
 * ```css
 * /&#42; normally we would create a CSS class to reference on the element &#42;/
 * greeting-box.on { transition:0.5s linear all; background:green; color:white; }
 * ```
 *
 * The `$animate` service contains a variety of other methods like `enter`, `leave`, `animate` and `setClass`. To learn more about what's
 * possible be sure to visit the {@link ng.$animate $animate service API page}.
 *
 *
 * ## Callbacks and Promises
 *
 * When `$animate` is called it returns a promise that can be used to capture when the animation has ended. Therefore if we were to trigger
 * an animation (within our directive code) then we can continue performing directive and scope related activities after the animation has
 * ended by chaining onto the returned promise that animation method returns.
 *
 * ```js
 * // somewhere within the depths of the directive
 * $animate.enter(element, parent).then(function() {
 *   //the animation has completed
 * });
 * ```
 *
 * (Note that earlier versions of Angular prior to v1.4 required the promise code to be wrapped using `$scope.$apply(...)`. This is not the case
 * anymore.)
 *
 * In addition to the animation promise, we can also make use of animation-related callbacks within our directives and controller code by registering
 * an event listener using the `$animate` service. Let's say for example that an animation was triggered on our view
 * routing controller to hook into that:
 *
 * ```js
 * ngModule.controller('HomePageController', ['$animate', function($animate) {
 *   $animate.on('enter', ngViewElement, function(element) {
 *     // the animation for this route has completed
 *   }]);
 * }])
 * ```
 *
 * (Note that you will need to trigger a digest within the callback to get angular to notice any scope-related changes.)
 */

/**
 * @ngdoc service
 * @name $animate
 * @kind object
 *
 * @description
 * The ngAnimate `$animate` service documentation is the same for the core `$animate` service.
 *
 * Click here {@link ng.$animate to learn more about animations with `$animate`}.
 */
angular.module('ngAnimate', [])
  .directive('ngAnimateSwap', ngAnimateSwapDirective)

  .directive('ngAnimateChildren', $$AnimateChildrenDirective)
  .factory('$$rAFScheduler', $$rAFSchedulerFactory)

  .provider('$$animateQueue', $$AnimateQueueProvider)
  .provider('$$animation', $$AnimationProvider)

  .provider('$animateCss', $AnimateCssProvider)
  .provider('$$animateCssDriver', $$AnimateCssDriverProvider)

  .provider('$$animateJs', $$AnimateJsProvider)
  .provider('$$animateJsDriver', $$AnimateJsDriverProvider);


})(window, window.angular);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFuZ3VsYXItYW5pbWF0ZS5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhbmd1bGFyIiwidW5kZWZpbmVkIiwiYXNzZXJ0QXJnIiwiYXJnIiwibmFtZSIsInJlYXNvbiIsIm5nTWluRXJyIiwibWVyZ2VDbGFzc2VzIiwiYSIsImIiLCJpc0FycmF5Iiwiam9pbiIsInBhY2thZ2VTdHlsZXMiLCJvcHRpb25zIiwic3R5bGVzIiwidG8iLCJmcm9tIiwicGVuZENsYXNzZXMiLCJjbGFzc2VzIiwiZml4IiwiaXNQcmVmaXgiLCJjbGFzc05hbWUiLCJpc1N0cmluZyIsImxlbmd0aCIsInNwbGl0IiwiZm9yRWFjaCIsImtsYXNzIiwiaSIsInJlbW92ZUZyb21BcnJheSIsImFyciIsInZhbCIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInN0cmlwQ29tbWVudHNGcm9tRWxlbWVudCIsImVsZW1lbnQiLCJqcUxpdGUiLCJub2RlVHlwZSIsIkVMRU1FTlRfTk9ERSIsImV4dHJhY3RFbGVtZW50Tm9kZSIsImVsbSIsIiQkYWRkQ2xhc3MiLCIkJGpxTGl0ZSIsImFkZENsYXNzIiwiJCRyZW1vdmVDbGFzcyIsInJlbW92ZUNsYXNzIiwiYXBwbHlBbmltYXRpb25DbGFzc2VzRmFjdG9yeSIsInByZXBhcmVBbmltYXRpb25PcHRpb25zIiwiJCRwcmVwYXJlZCIsImRvbU9wZXJhdGlvbiIsIm5vb3AiLCIkJGRvbU9wZXJhdGlvbkZpcmVkIiwiYXBwbHlBbmltYXRpb25TdHlsZXMiLCJhcHBseUFuaW1hdGlvbkZyb21TdHlsZXMiLCJhcHBseUFuaW1hdGlvblRvU3R5bGVzIiwiY3NzIiwibWVyZ2VBbmltYXRpb25EZXRhaWxzIiwib2xkQW5pbWF0aW9uIiwibmV3QW5pbWF0aW9uIiwidGFyZ2V0IiwibmV3T3B0aW9ucyIsInRvQWRkIiwidG9SZW1vdmUiLCJyZXNvbHZlRWxlbWVudENsYXNzZXMiLCJhdHRyIiwicHJlcGFyYXRpb25DbGFzc2VzIiwiY29uY2F0V2l0aFNwYWNlIiwicmVhbERvbU9wZXJhdGlvbiIsImV4dGVuZCIsImV4aXN0aW5nIiwic3BsaXRDbGFzc2VzVG9Mb29rdXAiLCJvYmoiLCJBRERfQ0xBU1MiLCJSRU1PVkVfQ0xBU1MiLCJmbGFncyIsInZhbHVlIiwia2V5IiwicHJvcCIsImFsbG93IiwiZ2V0RG9tTm9kZSIsImFwcGx5R2VuZXJhdGVkUHJlcGFyYXRpb25DbGFzc2VzIiwiZXZlbnQiLCJFVkVOVF9DTEFTU19QUkVGSVgiLCJBRERfQ0xBU1NfU1VGRklYIiwiUkVNT1ZFX0NMQVNTX1NVRkZJWCIsImNsZWFyR2VuZXJhdGVkQ2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJibG9ja1RyYW5zaXRpb25zIiwibm9kZSIsImR1cmF0aW9uIiwiYXBwbHlJbmxpbmVTdHlsZSIsIlRSQU5TSVRJT05fREVMQVlfUFJPUCIsImJsb2NrS2V5ZnJhbWVBbmltYXRpb25zIiwiYXBwbHlCbG9jayIsIkFOSU1BVElPTl9QUk9QIiwiQU5JTUFUSU9OX1BMQVlTVEFURV9LRVkiLCJzdHlsZVR1cGxlIiwic3R5bGUiLCJnZXRDc3NLZXlmcmFtZUR1cmF0aW9uU3R5bGUiLCJBTklNQVRJT05fRFVSQVRJT05fUFJPUCIsImdldENzc0RlbGF5U3R5bGUiLCJkZWxheSIsImlzS2V5ZnJhbWVBbmltYXRpb24iLCJBTklNQVRJT05fREVMQVlfUFJPUCIsImNvbXB1dGVDc3NTdHlsZXMiLCIkd2luZG93IiwicHJvcGVydGllcyIsIk9iamVjdCIsImNyZWF0ZSIsImRldGVjdGVkU3R5bGVzIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImZvcm1hbFN0eWxlTmFtZSIsImFjdHVhbFN0eWxlTmFtZSIsImMiLCJjaGFyQXQiLCJwYXJzZU1heFRpbWUiLCJzdHIiLCJtYXhWYWx1ZSIsInZhbHVlcyIsInN1YnN0cmluZyIsInBhcnNlRmxvYXQiLCJNYXRoIiwibWF4IiwidHJ1dGh5VGltaW5nVmFsdWUiLCJnZXRDc3NUcmFuc2l0aW9uRHVyYXRpb25TdHlsZSIsImFwcGx5T25seUR1cmF0aW9uIiwiVFJBTlNJVElPTl9QUk9QIiwiRFVSQVRJT05fS0VZIiwiY3JlYXRlTG9jYWxDYWNoZUxvb2t1cCIsImNhY2hlIiwiZmx1c2giLCJjb3VudCIsImVudHJ5IiwidG90YWwiLCJnZXQiLCJwdXQiLCJyZWdpc3RlclJlc3RvcmFibGVTdHlsZXMiLCJiYWNrdXAiLCJpc0RlZmluZWQiLCJnZXRQcm9wZXJ0eVZhbHVlIiwiVFJBTlNJVElPTkVORF9FVkVOVCIsIkFOSU1BVElPTkVORF9FVkVOVCIsImNvcHkiLCJpc09iamVjdCIsImlzVW5kZWZpbmVkIiwiaXNGdW5jdGlvbiIsImlzRWxlbWVudCIsIkFDVElWRV9DTEFTU19TVUZGSVgiLCJQUkVQQVJFX0NMQVNTX1NVRkZJWCIsIk5HX0FOSU1BVEVfQ0xBU1NOQU1FIiwiTkdfQU5JTUFURV9DSElMRFJFTl9EQVRBIiwiQ1NTX1BSRUZJWCIsIm9udHJhbnNpdGlvbmVuZCIsIm9ud2Via2l0dHJhbnNpdGlvbmVuZCIsIm9uYW5pbWF0aW9uZW5kIiwib253ZWJraXRhbmltYXRpb25lbmQiLCJQUk9QRVJUWV9LRVkiLCJERUxBWV9LRVkiLCJUSU1JTkdfS0VZIiwiQU5JTUFUSU9OX0lURVJBVElPTl9DT1VOVF9LRVkiLCJTQUZFX0ZBU1RfRk9SV0FSRF9EVVJBVElPTl9WQUxVRSIsIlRSQU5TSVRJT05fRFVSQVRJT05fUFJPUCIsIiQkbWluRXJyIiwiJCRyQUZTY2hlZHVsZXJGYWN0b3J5IiwiJCRyQUYiLCJzY2hlZHVsZXIiLCJ0YXNrcyIsInF1ZXVlIiwiY29uY2F0IiwibmV4dFRpY2siLCJpdGVtcyIsInNoaWZ0IiwiY2FuY2VsRm4iLCJ3YWl0VW50aWxRdWlldCIsImZuIiwiJCRBbmltYXRlQ2hpbGRyZW5EaXJlY3RpdmUiLCIkaW50ZXJwb2xhdGUiLCJsaW5rIiwic2NvcGUiLCJhdHRycyIsInNldERhdGEiLCJkYXRhIiwibmdBbmltYXRlQ2hpbGRyZW4iLCIkb2JzZXJ2ZSIsIkFOSU1BVEVfVElNRVJfS0VZIiwiT05FX1NFQ09ORCIsIkVMQVBTRURfVElNRV9NQVhfREVDSU1BTF9QTEFDRVMiLCJDTE9TSU5HX1RJTUVfQlVGRkVSIiwiREVURUNUX0NTU19QUk9QRVJUSUVTIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvbkRlbGF5IiwidHJhbnNpdGlvblByb3BlcnR5IiwiYW5pbWF0aW9uRHVyYXRpb24iLCJhbmltYXRpb25EZWxheSIsImFuaW1hdGlvbkl0ZXJhdGlvbkNvdW50IiwiREVURUNUX1NUQUdHRVJfQ1NTX1BST1BFUlRJRVMiLCIkQW5pbWF0ZUNzc1Byb3ZpZGVyIiwiJGFuaW1hdGVQcm92aWRlciIsImdjc0xvb2t1cCIsImdjc1N0YWdnZXJMb29rdXAiLCJ0aGlzIiwiJGdldCIsIiQkQW5pbWF0ZVJ1bm5lciIsIiR0aW1lb3V0IiwiJCRmb3JjZVJlZmxvdyIsIiRzbmlmZmVyIiwiJCRyQUZTY2hlZHVsZXIiLCIkJGFuaW1hdGVRdWV1ZSIsImdjc0hhc2hGbiIsImV4dHJhQ2xhc3NlcyIsIktFWSIsInBhcmVudE5vZGUiLCJwYXJlbnRJRCIsInBhcmVudENvdW50ZXIiLCJnZXRBdHRyaWJ1dGUiLCJjb21wdXRlQ2FjaGVkQ3NzU3R5bGVzIiwiY2FjaGVLZXkiLCJ0aW1pbmdzIiwiY29tcHV0ZUNhY2hlZENzc1N0YWdnZXJTdHlsZXMiLCJzdGFnZ2VyIiwic3RhZ2dlckNsYXNzTmFtZSIsImNhbGxiYWNrIiwicmFmV2FpdFF1ZXVlIiwicHVzaCIsInBhZ2VXaWR0aCIsImNvbXB1dGVUaW1pbmdzIiwiYUQiLCJ0RCIsIm1heERlbGF5IiwibWF4RHVyYXRpb24iLCJhcHBseUFuaW1hdGlvbkNsYXNzZXMiLCJpbml0aWFsT3B0aW9ucyIsImVuZEZuIiwiY2xvc2UiLCJyZWplY3RlZCIsImFuaW1hdGlvbkNsb3NlZCIsImFuaW1hdGlvbkNvbXBsZXRlZCIsImFuaW1hdGlvblBhdXNlZCIsIiQkc2tpcFByZXBhcmF0aW9uQ2xhc3NlcyIsInRlbXBvcmFyeVN0eWxlcyIsImtleXMiLCJyZXN0b3JlU3R5bGVzIiwic2V0UHJvcGVydHkiLCJyZW1vdmVQcm9wZXJ0eSIsIm9uRG9uZSIsImV2ZW50cyIsIm9mZiIsIm9uQW5pbWF0aW9uUHJvZ3Jlc3MiLCJhbmltYXRpb25UaW1lckRhdGEiLCJjYW5jZWwiLCJ0aW1lciIsInJlbW92ZURhdGEiLCJydW5uZXIiLCJjb21wbGV0ZSIsImFwcGx5QmxvY2tpbmciLCJibG9ja1RyYW5zaXRpb24iLCJibG9ja0tleWZyYW1lQW5pbWF0aW9uIiwiY2xvc2VBbmRSZXR1cm5Ob29wQW5pbWF0b3IiLCJlbmQiLCIkJHdpbGxBbmltYXRlIiwic3RhcnQiLCJzdG9wUHJvcGFnYXRpb24iLCJldiIsIm9yaWdpbmFsRXZlbnQiLCJ0aW1lU3RhbXAiLCIkbWFudWFsVGltZVN0YW1wIiwiRGF0ZSIsIm5vdyIsImVsYXBzZWRUaW1lIiwidG9GaXhlZCIsInN0YXJ0VGltZSIsIm1heERlbGF5VGltZSIsInRyaWdnZXJBbmltYXRpb25TdGFydCIsInJlY2FsY3VsYXRlVGltaW5nU3R5bGVzIiwiZnVsbENsYXNzTmFtZSIsInJlbGF0aXZlRGVsYXkiLCJoYXNUcmFuc2l0aW9ucyIsImhhc0FuaW1hdGlvbnMiLCJhcHBseUFuaW1hdGlvbkRlbGF5IiwiZGVsYXlTdHlsZSIsIm1heER1cmF0aW9uVGltZSIsImVhc2luZyIsImVhc2VQcm9wIiwiZWFzZVZhbCIsInRpbWVyVGltZSIsImVuZFRpbWUiLCJhbmltYXRpb25zRGF0YSIsInNldHVwRmFsbGJhY2tUaW1lciIsImN1cnJlbnRUaW1lckRhdGEiLCJleHBlY3RlZEVuZFRpbWUiLCJvbkFuaW1hdGlvbkV4cGlyZWQiLCJvbiIsImNsZWFudXBTdHlsZXMiLCJwbGF5UGF1c2UiLCJwbGF5QW5pbWF0aW9uIiwibWF4U3RhZ2dlciIsIml0ZW1JbmRleCIsImZsb29yIiwicnVubmVySG9zdCIsInJlc3VtZSIsInBhdXNlIiwiZW5hYmxlZCIsImFuaW1hdGlvbnMiLCJ0cmFuc2l0aW9ucyIsIm1ldGhvZCIsImlzU3RydWN0dXJhbCIsInN0cnVjdHVyYWwiLCJzdHJ1Y3R1cmFsQ2xhc3NOYW1lIiwiYWRkUmVtb3ZlQ2xhc3NOYW1lIiwiYXBwbHlDbGFzc2VzRWFybHkiLCJ0cmltIiwiaGFzVG9TdHlsZXMiLCJjb250YWluc0tleWZyYW1lQW5pbWF0aW9uIiwia2V5ZnJhbWVTdHlsZSIsInN0YWdnZXJWYWwiLCJ0cmFuc2l0aW9uU3R5bGUiLCJkdXJhdGlvblN0eWxlIiwic3RhZ2dlckluZGV4IiwiaXNGaXJzdCIsInNraXBCbG9ja2luZyIsImhhc1RyYW5zaXRpb25BbGwiLCJhcHBseVRyYW5zaXRpb25EdXJhdGlvbiIsImFwcGx5QW5pbWF0aW9uRHVyYXRpb24iLCJhcHBseVRyYW5zaXRpb25EZWxheSIsIiQkQW5pbWF0ZUNzc0RyaXZlclByb3ZpZGVyIiwiJCRhbmltYXRpb25Qcm92aWRlciIsImlzRG9jdW1lbnRGcmFnbWVudCIsImRyaXZlcnMiLCJOR19BTklNQVRFX1NISU1fQ0xBU1NfTkFNRSIsIk5HX0FOSU1BVEVfQU5DSE9SX0NMQVNTX05BTUUiLCJOR19PVVRfQU5DSE9SX0NMQVNTX05BTUUiLCJOR19JTl9BTkNIT1JfQ0xBU1NfTkFNRSIsIiRhbmltYXRlQ3NzIiwiJHJvb3RTY29wZSIsIiRyb290RWxlbWVudCIsIiRkb2N1bWVudCIsImZpbHRlckNzc0NsYXNzZXMiLCJyZXBsYWNlIiwiZ2V0VW5pcXVlVmFsdWVzIiwiZmlsdGVyIiwicHJlcGFyZUFuY2hvcmVkQW5pbWF0aW9uIiwib3V0QW5jaG9yIiwiaW5BbmNob3IiLCJjYWxjdWxhdGVBbmNob3JTdHlsZXMiLCJhbmNob3IiLCJjb29yZHMiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJib2R5Tm9kZSIsInNjcm9sbFRvcCIsInNjcm9sbExlZnQiLCJwcmVwYXJlT3V0QW5pbWF0aW9uIiwiYW5pbWF0b3IiLCJjbG9uZSIsImdldENsYXNzVmFsIiwicHJlcGFyZUluQW5pbWF0aW9uIiwiZW5kaW5nQ2xhc3NlcyIsInN0YXJ0aW5nQ2xhc3NlcyIsInJlbW92ZSIsImNsb25lTm9kZSIsInJvb3RCb2R5RWxlbWVudCIsImFwcGVuZCIsImFuaW1hdG9ySW4iLCJhbmltYXRvck91dCIsInN0YXJ0aW5nQW5pbWF0b3IiLCJjdXJyZW50QW5pbWF0aW9uIiwiZG9uZSIsInByZXBhcmVGcm9tVG9BbmNob3JBbmltYXRpb24iLCJhbmNob3JzIiwiZnJvbUFuaW1hdGlvbiIsInByZXBhcmVSZWd1bGFyQW5pbWF0aW9uIiwidG9BbmltYXRpb24iLCJhbmNob3JBbmltYXRpb25zIiwib3V0RWxlbWVudCIsImluRWxlbWVudCIsImFuaW1hdGlvblJ1bm5lcnMiLCJhbmltYXRpb24iLCJhbGwiLCJzdGF0dXMiLCJhbmltYXRpb25EZXRhaWxzIiwiYm9keSIsInJvb3ROb2RlIiwiY29udGFpbnMiLCIkJEFuaW1hdGVKc1Byb3ZpZGVyIiwiJGluamVjdG9yIiwibG9va3VwQW5pbWF0aW9ucyIsIm1hdGNoZXMiLCJmbGFnTWFwIiwiYW5pbWF0aW9uRmFjdG9yeSIsIiQkcmVnaXN0ZXJlZEFuaW1hdGlvbnMiLCJhcHBseU9wdGlvbnMiLCJleGVjdXRlQW5pbWF0aW9uRm4iLCJhcmdzIiwiY2xhc3Nlc1RvQWRkIiwiY2xhc3Nlc1RvUmVtb3ZlIiwiYXBwbHkiLCJncm91cEV2ZW50ZWRBbmltYXRpb25zIiwiZm5OYW1lIiwib3BlcmF0aW9ucyIsImFuaSIsImVuZFByb2dyZXNzQ2IiLCJyZXNvbHZlZCIsIm9uQW5pbWF0aW9uQ29tcGxldGUiLCJyZXN1bHQiLCJjYW5jZWxsZWQiLCJwYWNrYWdlQW5pbWF0aW9ucyIsInJ1bm5lcnMiLCJhbmltYXRlRm4iLCJyZWplY3QiLCJhcmd1bWVudHMiLCJiZWZvcmUiLCJhZnRlciIsImFmdGVyRm4iLCJiZWZvcmVGbiIsInRvVXBwZXJDYXNlIiwic3Vic3RyIiwib25Db21wbGV0ZSIsInN1Y2Nlc3MiLCJlbmRBbmltYXRpb25zIiwiY2xvc2VBY3RpdmVBbmltYXRpb25zIiwiY2hhaW4iLCJzZXRIb3N0IiwiJCRBbmltYXRlSnNEcml2ZXJQcm92aWRlciIsIiQkYW5pbWF0ZUpzIiwicHJlcGFyZUFuaW1hdGlvbiIsImVuZEZuRmFjdG9yeSIsIk5HX0FOSU1BVEVfQVRUUl9OQU1FIiwiTkdfQU5JTUFURV9QSU5fREFUQSIsIiQkQW5pbWF0ZVF1ZXVlUHJvdmlkZXIiLCJtYWtlVHJ1dGh5Q3NzQ2xhc3NNYXAiLCJjbGFzc1N0cmluZyIsIk9ORV9TUEFDRSIsIm1hcCIsImhhc01hdGNoaW5nQ2xhc3NlcyIsIm5ld0NsYXNzU3RyaW5nIiwiY3VycmVudENsYXNzU3RyaW5nIiwiY3VycmVudENsYXNzTWFwIiwic29tZSIsImlzQWxsb3dlZCIsInJ1bGVUeXBlIiwicHJldmlvdXNBbmltYXRpb24iLCJydWxlcyIsImhhc0FuaW1hdGlvbkNsYXNzZXMiLCJhbmQiLCJQUkVfRElHRVNUX1NUQVRFIiwiUlVOTklOR19TVEFURSIsInNraXAiLCJzdGF0ZSIsIm5BIiwiblIiLCJjQSIsImNSIiwiJCRIYXNoTWFwIiwiJCRhbmltYXRpb24iLCIkdGVtcGxhdGVSZXF1ZXN0IiwicG9zdERpZ2VzdFRhc2tGYWN0b3J5IiwicG9zdERpZ2VzdENhbGxlZCIsIiQkcG9zdERpZ2VzdCIsIm5vcm1hbGl6ZUFuaW1hdGlvbkRldGFpbHMiLCJmaW5kQ2FsbGJhY2tzIiwicGFyZW50IiwidGFyZ2V0Tm9kZSIsInRhcmdldFBhcmVudE5vZGUiLCJlbnRyaWVzIiwiY2FsbGJhY2tSZWdpc3RyeSIsImNhbGwiLCJxdWV1ZUFuaW1hdGlvbiIsIm5vdGlmeVByb2dyZXNzIiwicGhhc2UiLCJydW5Jbk5leHRQb3N0RGlnZXN0T3JOb3ciLCJjYWxsYmFja3MiLCJwcm9ncmVzcyIsImlzQW5pbWF0YWJsZUNsYXNzTmFtZSIsInNraXBBbmltYXRpb25zIiwiYW5pbWF0aW9uc0VuYWJsZWQiLCJoaWRkZW4iLCJkaXNhYmxlZEVsZW1lbnRzTG9va3VwIiwiZXhpc3RpbmdBbmltYXRpb24iLCJhY3RpdmVBbmltYXRpb25zTG9va3VwIiwiaGFzRXhpc3RpbmdBbmltYXRpb24iLCJhcmVBbmltYXRpb25zQWxsb3dlZCIsImNsb3NlQ2hpbGRBbmltYXRpb25zIiwic2tpcEFuaW1hdGlvbkZsYWciLCJjYW5jZWxBbmltYXRpb25GbGFnIiwiam9pbkFuaW1hdGlvbkZsYWciLCJpc1ZhbGlkQW5pbWF0aW9uIiwiY2xlYXJFbGVtZW50QW5pbWF0aW9uU3RhdGUiLCJjb3VudGVyIiwibWFya0VsZW1lbnRBbmltYXRpb25TdGF0ZSIsImFuaW1hdGlvbkNhbmNlbGxlZCIsInBhcmVudEVsZW1lbnQiLCJyZWFsUnVubmVyIiwiY2hpbGRyZW4iLCJxdWVyeVNlbGVjdG9yQWxsIiwiY2hpbGQiLCJwYXJzZUludCIsInJlbW92ZUF0dHJpYnV0ZSIsImlzTWF0Y2hpbmdFbGVtZW50Iiwibm9kZU9yRWxtQSIsIm5vZGVPckVsbUIiLCJhbmltYXRlQ2hpbGRyZW4iLCJib2R5RWxlbWVudCIsImJvZHlFbGVtZW50RGV0ZWN0ZWQiLCJub2RlTmFtZSIsInJvb3RFbGVtZW50RGV0ZWN0ZWQiLCJwYXJlbnRBbmltYXRpb25EZXRlY3RlZCIsImVsZW1lbnREaXNhYmxlZCIsInBhcmVudEhvc3QiLCJkZXRhaWxzIiwicGFyZW50RWxlbWVudERpc2FibGVkIiwiYWxsb3dBbmltYXRpb24iLCJzZXRBdHRyaWJ1dGUiLCJvbGRWYWx1ZSIsIm5ld1ZhbHVlIiwiZGVyZWdpc3RlcldhdGNoIiwiJHdhdGNoIiwidG90YWxQZW5kaW5nUmVxdWVzdHMiLCJpc0VtcHR5IiwiY2xhc3NOYW1lRmlsdGVyIiwidGVzdCIsIk5vZGUiLCJwcm90b3R5cGUiLCJjb21wYXJlRG9jdW1lbnRQb3NpdGlvbiIsImNvbnRhaW5lciIsImZpbHRlckZyb21SZWdpc3RyeSIsImxpc3QiLCJtYXRjaENvbnRhaW5lciIsIm1hdGNoQ2FsbGJhY2siLCJjb250YWluZXJOb2RlIiwiaXNNYXRjaCIsInBpbiIsImJvb2wiLCJhcmdDb3VudCIsImhhc0VsZW1lbnQiLCJyZWNvcmRFeGlzdHMiLCIkJEFuaW1hdGlvblByb3ZpZGVyIiwic2V0UnVubmVyIiwiUlVOTkVSX1NUT1JBR0VfS0VZIiwicmVtb3ZlUnVubmVyIiwiZ2V0UnVubmVyIiwiTkdfQU5JTUFURV9SRUZfQVRUUiIsInNvcnRBbmltYXRpb25zIiwicHJvY2Vzc05vZGUiLCJwcm9jZXNzZWQiLCJlbGVtZW50Tm9kZSIsImRvbU5vZGUiLCJsb29rdXAiLCJwYXJlbnRFbnRyeSIsInRyZWUiLCJmbGF0dGVuIiwicmVtYWluaW5nTGV2ZWxFbnRyaWVzIiwibmV4dExldmVsRW50cmllcyIsInJvdyIsImNoaWxkRW50cnkiLCJhbmltYXRpb25RdWV1ZSIsImdldEFuY2hvck5vZGVzIiwiU0VMRUNUT1IiLCJoYXNBdHRyaWJ1dGUiLCJncm91cEFuaW1hdGlvbnMiLCJwcmVwYXJlZEFuaW1hdGlvbnMiLCJyZWZMb29rdXAiLCJlbnRlck9yTW92ZSIsImFuY2hvck5vZGVzIiwiZGlyZWN0aW9uIiwiYW5pbWF0aW9uSUQiLCJ1c2VkSW5kaWNlc0xvb2t1cCIsImFuY2hvckdyb3VwcyIsImluZGV4S2V5IiwidG9TdHJpbmciLCJsb29rdXBLZXkiLCJncm91cCIsImJlZm9yZVN0YXJ0IiwiY3NzQ2xhc3Nlc0ludGVyc2VjdGlvbiIsIm91dCIsImluIiwiYWEiLCJqIiwiaW52b2tlRmlyc3REcml2ZXIiLCJkcml2ZXJOYW1lIiwiaGFzIiwiZmFjdG9yeSIsImRyaXZlciIsInRlbXBDbGFzc2VzIiwicHJlcGFyZUNsYXNzTmFtZSIsInVwZGF0ZUFuaW1hdGlvblJ1bm5lcnMiLCJuZXdSdW5uZXIiLCJ1cGRhdGUiLCJoYW5kbGVEZXN0cm95ZWRFbGVtZW50IiwiZ3JvdXBlZEFuaW1hdGlvbnMiLCJ0b0JlU29ydGVkQW5pbWF0aW9ucyIsImFuaW1hdGlvbkVudHJ5Iiwic3RhcnRBbmltYXRpb25GbiIsImNsb3NlRm4iLCJ0YXJnZXRFbGVtZW50Iiwib3BlcmF0aW9uIiwiYW5pbWF0aW9uUnVubmVyIiwibmdBbmltYXRlU3dhcERpcmVjdGl2ZSIsIiRhbmltYXRlIiwicmVzdHJpY3QiLCJ0cmFuc2NsdWRlIiwidGVybWluYWwiLCJwcmlvcml0eSIsIiRlbGVtZW50IiwiY3RybCIsIiR0cmFuc2NsdWRlIiwicHJldmlvdXNFbGVtZW50IiwicHJldmlvdXNTY29wZSIsIiR3YXRjaENvbGxlY3Rpb24iLCJuZ0FuaW1hdGVTd2FwIiwibGVhdmUiLCIkZGVzdHJveSIsIiRuZXciLCJlbnRlciIsIm1vZHVsZSIsImRpcmVjdGl2ZSIsInByb3ZpZGVyIl0sIm1hcHBpbmdzIjoiQ0FLQSxTQUFVQSxFQUFRQyxFQUFTQyxHQUFZLFlBNEV2QyxTQUFTQyxHQUFVQyxFQUFLQyxFQUFNQyxHQUM1QixJQUFLRixFQUNILEtBQU1HLElBQVMsT0FBUSx3QkFBMEJGLEdBQVEsSUFBT0MsR0FBVSxXQUU1RSxPQUFPRixHQUdULFFBQVNJLEdBQWFDLEVBQUVDLEdBQ3RCLE1BQUtELElBQU1DLEVBQ05ELEVBQ0FDLEdBQ0RDLEVBQVFGLEtBQUlBLEVBQUlBLEVBQUVHLEtBQUssTUFDdkJELEVBQVFELEtBQUlBLEVBQUlBLEVBQUVFLEtBQUssTUFDcEJILEVBQUksSUFBTUMsR0FIRkQsRUFEQUMsRUFETSxHQVF2QixRQUFTRyxHQUFjQyxHQUNyQixHQUFJQyxLQUtKLE9BSklELEtBQVlBLEVBQVFFLElBQU1GLEVBQVFHLFFBQ3BDRixFQUFPQyxHQUFLRixFQUFRRSxHQUNwQkQsRUFBT0UsS0FBT0gsRUFBUUcsTUFFakJGLEVBR1QsUUFBU0csR0FBWUMsRUFBU0MsRUFBS0MsR0FDakMsR0FBSUMsR0FBWSxFQWFoQixPQVpBSCxHQUFVUixFQUFRUSxHQUNaQSxFQUNBQSxHQUFXSSxFQUFTSixJQUFZQSxFQUFRSyxPQUNwQ0wsRUFBUU0sTUFBTSxVQUV4QkMsRUFBUVAsRUFBUyxTQUFTUSxFQUFPQyxHQUMzQkQsR0FBU0EsRUFBTUgsT0FBUyxJQUMxQkYsR0FBY00sRUFBSSxFQUFLLElBQU0sR0FDN0JOLEdBQWFELEVBQVdELEVBQU1PLEVBQ05BLEVBQVFQLEtBRzdCRSxFQUdULFFBQVNPLEdBQWdCQyxFQUFLQyxHQUM1QixHQUFJQyxHQUFRRixFQUFJRyxRQUFRRixFQUNwQkEsSUFBTyxHQUNURCxFQUFJSSxP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QUNGSCxFQUFtQkcsRUFBVTdVLE9BSWpDLEdBQUswVSxFQUVFLENBQ0wsR0FBSUksR0FBa0JKLEdBQ3RCSSxHQUFnQnJPLEtBQUssU0FBU1ksR0FDNUJzTixHQUFTdE4sS0FFWDhNLEVBQXVCTSxFQUFnQkssT0FOdkNILFVBZVJqWSxFQUFlOFUsRUFBZWdELE1BR3pCaFYsUUFpUlR1VixJQUEwQixXQUFZLGFBQWMsU0FBU0MsRUFBVXZRLEdBQ3pFLE9BQ0V3USxTQUFVLElBQ1ZDLFdBQVksVUFDWkMsVUFBVSxFQUNWQyxTQUFVLElBQ1Z2YSxLQUFNLFNBQVNDLEVBQU91YSxFQUFVdGEsRUFBT3VhLEVBQU1DLEdBQzNDLEdBQUlDLEdBQWlCQyxDQUNyQjNhLEdBQU00YSxpQkFBaUIzYSxFQUFNNGEsZUFBaUI1YSxFQUFXLElBQUcsU0FBU3hHLEdBQy9EaWhCLEdBQ0ZSLEVBQVNZLE1BQU1KLEdBRWJDLElBQ0ZBLEVBQWNJLFdBQ2RKLEVBQWdCLE9BRWRsaEIsR0FBbUIsSUFBVkEsS0FDWGtoQixFQUFnQjNhLEVBQU1nYixPQUN0QlAsRUFBWUUsRUFBZSxTQUFTMWpCLEdBQ2xDeWpCLEVBQWtCempCLEVBQ2xCaWpCLEVBQVNlLE1BQU1oa0IsRUFBUyxLQUFNc2pCLFdBNHVCMUN6bEIsR0FBUW9tQixPQUFPLGdCQUNaQyxVQUFVLGdCQUFpQmxCLElBRTNCa0IsVUFBVSxvQkFBcUJ0YixJQUMvQm9aLFFBQVEsaUJBQWtCaGEsSUFFMUJtYyxTQUFTLGlCQUFrQjNMLElBQzNCMkwsU0FBUyxjQUFlaEYsSUFFeEJnRixTQUFTLGNBQWVsYSxJQUN4QmthLFNBQVMscUJBQXNCbFMsSUFFL0JrUyxTQUFTLGNBQWV4TyxJQUN4QndPLFNBQVMsb0JBQXFCak0sS0FHOUJ0YSxPQUFRQSxPQUFPQyIsImZpbGUiOiJhbmd1bGFyLWFuaW1hdGUtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlIEFuZ3VsYXJKUyB2MS41LjFcbiAqIChjKSAyMDEwLTIwMTYgR29vZ2xlLCBJbmMuIGh0dHA6Ly9hbmd1bGFyanMub3JnXG4gKiBMaWNlbnNlOiBNSVRcbiAqL1xuKGZ1bmN0aW9uKHdpbmRvdywgYW5ndWxhciwgdW5kZWZpbmVkKSB7J3VzZSBzdHJpY3QnO1xuXG4vKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG52YXIgbm9vcCAgICAgICAgPSBhbmd1bGFyLm5vb3A7XG52YXIgY29weSAgICAgICAgPSBhbmd1bGFyLmNvcHk7XG52YXIgZXh0ZW5kICAgICAgPSBhbmd1bGFyLmV4dGVuZDtcbnZhciBqcUxpdGUgICAgICA9IGFuZ3VsYXIuZWxlbWVudDtcbnZhciBmb3JFYWNoICAgICA9IGFuZ3VsYXIuZm9yRWFjaDtcbnZhciBpc0FycmF5ICAgICA9IGFuZ3VsYXIuaXNBcnJheTtcbnZhciBpc1N0cmluZyAgICA9IGFuZ3VsYXIuaXNTdHJpbmc7XG52YXIgaXNPYmplY3QgICAgPSBhbmd1bGFyLmlzT2JqZWN0O1xudmFyIGlzVW5kZWZpbmVkID0gYW5ndWxhci5pc1VuZGVmaW5lZDtcbnZhciBpc0RlZmluZWQgICA9IGFuZ3VsYXIuaXNEZWZpbmVkO1xudmFyIGlzRnVuY3Rpb24gID0gYW5ndWxhci5pc0Z1bmN0aW9uO1xudmFyIGlzRWxlbWVudCAgID0gYW5ndWxhci5pc0VsZW1lbnQ7XG5cbnZhciBFTEVNRU5UX05PREUgPSAxO1xudmFyIENPTU1FTlRfTk9ERSA9IDg7XG5cbnZhciBBRERfQ0xBU1NfU1VGRklYID0gJy1hZGQnO1xudmFyIFJFTU9WRV9DTEFTU19TVUZGSVggPSAnLXJlbW92ZSc7XG52YXIgRVZFTlRfQ0xBU1NfUFJFRklYID0gJ25nLSc7XG52YXIgQUNUSVZFX0NMQVNTX1NVRkZJWCA9ICctYWN0aXZlJztcbnZhciBQUkVQQVJFX0NMQVNTX1NVRkZJWCA9ICctcHJlcGFyZSc7XG5cbnZhciBOR19BTklNQVRFX0NMQVNTTkFNRSA9ICduZy1hbmltYXRlJztcbnZhciBOR19BTklNQVRFX0NISUxEUkVOX0RBVEEgPSAnJCRuZ0FuaW1hdGVDaGlsZHJlbic7XG5cbi8vIERldGVjdCBwcm9wZXIgdHJhbnNpdGlvbmVuZC9hbmltYXRpb25lbmQgZXZlbnQgbmFtZXMuXG52YXIgQ1NTX1BSRUZJWCA9ICcnLCBUUkFOU0lUSU9OX1BST1AsIFRSQU5TSVRJT05FTkRfRVZFTlQsIEFOSU1BVElPTl9QUk9QLCBBTklNQVRJT05FTkRfRVZFTlQ7XG5cbi8vIElmIHVucHJlZml4ZWQgZXZlbnRzIGFyZSBub3Qgc3VwcG9ydGVkIGJ1dCB3ZWJraXQtcHJlZml4ZWQgYXJlLCB1c2UgdGhlIGxhdHRlci5cbi8vIE90aGVyd2lzZSwganVzdCB1c2UgVzNDIG5hbWVzLCBicm93c2VycyBub3Qgc3VwcG9ydGluZyB0aGVtIGF0IGFsbCB3aWxsIGp1c3QgaWdub3JlIHRoZW0uXG4vLyBOb3RlOiBDaHJvbWUgaW1wbGVtZW50cyBgd2luZG93Lm9ud2Via2l0YW5pbWF0aW9uZW5kYCBhbmQgZG9lc24ndCBpbXBsZW1lbnQgYHdpbmRvdy5vbmFuaW1hdGlvbmVuZGBcbi8vIGJ1dCBhdCB0aGUgc2FtZSB0aW1lIGRpc3BhdGNoZXMgdGhlIGBhbmltYXRpb25lbmRgIGV2ZW50IGFuZCBub3QgYHdlYmtpdEFuaW1hdGlvbkVuZGAuXG4vLyBSZWdpc3RlciBib3RoIGV2ZW50cyBpbiBjYXNlIGB3aW5kb3cub25hbmltYXRpb25lbmRgIGlzIG5vdCBzdXBwb3J0ZWQgYmVjYXVzZSBvZiB0aGF0LFxuLy8gZG8gdGhlIHNhbWUgZm9yIGB0cmFuc2l0aW9uZW5kYCBhcyBTYWZhcmkgaXMgbGlrZWx5IHRvIGV4aGliaXQgc2ltaWxhciBiZWhhdmlvci5cbi8vIEFsc28sIHRoZSBvbmx5IG1vZGVybiBicm93c2VyIHRoYXQgdXNlcyB2ZW5kb3IgcHJlZml4ZXMgZm9yIHRyYW5zaXRpb25zL2tleWZyYW1lcyBpcyB3ZWJraXRcbi8vIHRoZXJlZm9yZSB0aGVyZSBpcyBubyByZWFzb24gdG8gdGVzdCBhbnltb3JlIGZvciBvdGhlciB2ZW5kb3IgcHJlZml4ZXM6XG4vLyBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD10cmFuc2l0aW9uXG5pZiAoaXNVbmRlZmluZWQod2luZG93Lm9udHJhbnNpdGlvbmVuZCkgJiYgaXNEZWZpbmVkKHdpbmRvdy5vbndlYmtpdHRyYW5zaXRpb25lbmQpKSB7XG4gIENTU19QUkVGSVggPSAnLXdlYmtpdC0nO1xuICBUUkFOU0lUSU9OX1BST1AgPSAnV2Via2l0VHJhbnNpdGlvbic7XG4gIFRSQU5TSVRJT05FTkRfRVZFTlQgPSAnd2Via2l0VHJhbnNpdGlvbkVuZCB0cmFuc2l0aW9uZW5kJztcbn0gZWxzZSB7XG4gIFRSQU5TSVRJT05fUFJPUCA9ICd0cmFuc2l0aW9uJztcbiAgVFJBTlNJVElPTkVORF9FVkVOVCA9ICd0cmFuc2l0aW9uZW5kJztcbn1cblxuaWYgKGlzVW5kZWZpbmVkKHdpbmRvdy5vbmFuaW1hdGlvbmVuZCkgJiYgaXNEZWZpbmVkKHdpbmRvdy5vbndlYmtpdGFuaW1hdGlvbmVuZCkpIHtcbiAgQ1NTX1BSRUZJWCA9ICctd2Via2l0LSc7XG4gIEFOSU1BVElPTl9QUk9QID0gJ1dlYmtpdEFuaW1hdGlvbic7XG4gIEFOSU1BVElPTkVORF9FVkVOVCA9ICd3ZWJraXRBbmltYXRpb25FbmQgYW5pbWF0aW9uZW5kJztcbn0gZWxzZSB7XG4gIEFOSU1BVElPTl9QUk9QID0gJ2FuaW1hdGlvbic7XG4gIEFOSU1BVElPTkVORF9FVkVOVCA9ICdhbmltYXRpb25lbmQnO1xufVxuXG52YXIgRFVSQVRJT05fS0VZID0gJ0R1cmF0aW9uJztcbnZhciBQUk9QRVJUWV9LRVkgPSAnUHJvcGVydHknO1xudmFyIERFTEFZX0tFWSA9ICdEZWxheSc7XG52YXIgVElNSU5HX0tFWSA9ICdUaW1pbmdGdW5jdGlvbic7XG52YXIgQU5JTUFUSU9OX0lURVJBVElPTl9DT1VOVF9LRVkgPSAnSXRlcmF0aW9uQ291bnQnO1xudmFyIEFOSU1BVElPTl9QTEFZU1RBVEVfS0VZID0gJ1BsYXlTdGF0ZSc7XG52YXIgU0FGRV9GQVNUX0ZPUldBUkRfRFVSQVRJT05fVkFMVUUgPSA5OTk5O1xuXG52YXIgQU5JTUFUSU9OX0RFTEFZX1BST1AgPSBBTklNQVRJT05fUFJPUCArIERFTEFZX0tFWTtcbnZhciBBTklNQVRJT05fRFVSQVRJT05fUFJPUCA9IEFOSU1BVElPTl9QUk9QICsgRFVSQVRJT05fS0VZO1xudmFyIFRSQU5TSVRJT05fREVMQVlfUFJPUCA9IFRSQU5TSVRJT05fUFJPUCArIERFTEFZX0tFWTtcbnZhciBUUkFOU0lUSU9OX0RVUkFUSU9OX1BST1AgPSBUUkFOU0lUSU9OX1BST1AgKyBEVVJBVElPTl9LRVk7XG5cbnZhciBpc1Byb21pc2VMaWtlID0gZnVuY3Rpb24ocCkge1xuICByZXR1cm4gcCAmJiBwLnRoZW4gPyB0cnVlIDogZmFsc2U7XG59O1xuXG52YXIgbmdNaW5FcnIgPSBhbmd1bGFyLiQkbWluRXJyKCduZycpO1xuZnVuY3Rpb24gYXNzZXJ0QXJnKGFyZywgbmFtZSwgcmVhc29uKSB7XG4gIGlmICghYXJnKSB7XG4gICAgdGhyb3cgbmdNaW5FcnIoJ2FyZXEnLCBcIkFyZ3VtZW50ICd7MH0nIGlzIHsxfVwiLCAobmFtZSB8fCAnPycpLCAocmVhc29uIHx8IFwicmVxdWlyZWRcIikpO1xuICB9XG4gIHJldHVybiBhcmc7XG59XG5cbmZ1bmN0aW9uIG1lcmdlQ2xhc3NlcyhhLGIpIHtcbiAgaWYgKCFhICYmICFiKSByZXR1cm4gJyc7XG4gIGlmICghYSkgcmV0dXJuIGI7XG4gIGlmICghYikgcmV0dXJuIGE7XG4gIGlmIChpc0FycmF5KGEpKSBhID0gYS5qb2luKCcgJyk7XG4gIGlmIChpc0FycmF5KGIpKSBiID0gYi5qb2luKCcgJyk7XG4gIHJldHVybiBhICsgJyAnICsgYjtcbn1cblxuZnVuY3Rpb24gcGFja2FnZVN0eWxlcyhvcHRpb25zKSB7XG4gIHZhciBzdHlsZXMgPSB7fTtcbiAgaWYgKG9wdGlvbnMgJiYgKG9wdGlvbnMudG8gfHwgb3B0aW9ucy5mcm9tKSkge1xuICAgIHN0eWxlcy50byA9IG9wdGlvbnMudG87XG4gICAgc3R5bGVzLmZyb20gPSBvcHRpb25zLmZyb207XG4gIH1cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZnVuY3Rpb24gcGVuZENsYXNzZXMoY2xhc3NlcywgZml4LCBpc1ByZWZpeCkge1xuICB2YXIgY2xhc3NOYW1lID0gJyc7XG4gIGNsYXNzZXMgPSBpc0FycmF5KGNsYXNzZXMpXG4gICAgICA/IGNsYXNzZXNcbiAgICAgIDogY2xhc3NlcyAmJiBpc1N0cmluZyhjbGFzc2VzKSAmJiBjbGFzc2VzLmxlbmd0aFxuICAgICAgICAgID8gY2xhc3Nlcy5zcGxpdCgvXFxzKy8pXG4gICAgICAgICAgOiBbXTtcbiAgZm9yRWFjaChjbGFzc2VzLCBmdW5jdGlvbihrbGFzcywgaSkge1xuICAgIGlmIChrbGFzcyAmJiBrbGFzcy5sZW5ndGggPiAwKSB7XG4gICAgICBjbGFzc05hbWUgKz0gKGkgPiAwKSA/ICcgJyA6ICcnO1xuICAgICAgY2xhc3NOYW1lICs9IGlzUHJlZml4ID8gZml4ICsga2xhc3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGtsYXNzICsgZml4O1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21BcnJheShhcnIsIHZhbCkge1xuICB2YXIgaW5kZXggPSBhcnIuaW5kZXhPZih2YWwpO1xuICBpZiAodmFsID49IDApIHtcbiAgICBhcnIuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdHJpcENvbW1lbnRzRnJvbUVsZW1lbnQoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIGpxTGl0ZSkge1xuICAgIHN3aXRjaCAoZWxlbWVudC5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxOlxuICAgICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBvZiBzdHJpcHBpbmcgYW55dGhpbmcgaWYgdGhlIGVsZW1lbnRcbiAgICAgICAgLy8gaXMgdGhlIG9ubHkgZWxlbWVudCB3aXRoaW4gdGhlIGpxTGl0ZSB3cmFwcGVyLlxuICAgICAgICAvLyAoaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSByZXRhaW4gdGhlIGVsZW1lbnQgaW5zdGFuY2UuKVxuICAgICAgICBpZiAoZWxlbWVudFswXS5ub2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBqcUxpdGUoZXh0cmFjdEVsZW1lbnROb2RlKGVsZW1lbnQpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVsZW1lbnQubm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgIHJldHVybiBqcUxpdGUoZWxlbWVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEVsZW1lbnROb2RlKGVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50WzBdKSByZXR1cm4gZWxlbWVudDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGVsbSA9IGVsZW1lbnRbaV07XG4gICAgaWYgKGVsbS5ub2RlVHlwZSA9PSBFTEVNRU5UX05PREUpIHtcbiAgICAgIHJldHVybiBlbG07XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uICQkYWRkQ2xhc3MoJCRqcUxpdGUsIGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICBmb3JFYWNoKGVsZW1lbnQsIGZ1bmN0aW9uKGVsbSkge1xuICAgICQkanFMaXRlLmFkZENsYXNzKGVsbSwgY2xhc3NOYW1lKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uICQkcmVtb3ZlQ2xhc3MoJCRqcUxpdGUsIGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICBmb3JFYWNoKGVsZW1lbnQsIGZ1bmN0aW9uKGVsbSkge1xuICAgICQkanFMaXRlLnJlbW92ZUNsYXNzKGVsbSwgY2xhc3NOYW1lKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5hZGRDbGFzcykge1xuICAgICAgJCRhZGRDbGFzcygkJGpxTGl0ZSwgZWxlbWVudCwgb3B0aW9ucy5hZGRDbGFzcyk7XG4gICAgICBvcHRpb25zLmFkZENsYXNzID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMucmVtb3ZlQ2xhc3MpIHtcbiAgICAgICQkcmVtb3ZlQ2xhc3MoJCRqcUxpdGUsIGVsZW1lbnQsIG9wdGlvbnMucmVtb3ZlQ2xhc3MpO1xuICAgICAgb3B0aW9ucy5yZW1vdmVDbGFzcyA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVBbmltYXRpb25PcHRpb25zKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICghb3B0aW9ucy4kJHByZXBhcmVkKSB7XG4gICAgdmFyIGRvbU9wZXJhdGlvbiA9IG9wdGlvbnMuZG9tT3BlcmF0aW9uIHx8IG5vb3A7XG4gICAgb3B0aW9ucy5kb21PcGVyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIG9wdGlvbnMuJCRkb21PcGVyYXRpb25GaXJlZCA9IHRydWU7XG4gICAgICBkb21PcGVyYXRpb24oKTtcbiAgICAgIGRvbU9wZXJhdGlvbiA9IG5vb3A7XG4gICAgfTtcbiAgICBvcHRpb25zLiQkcHJlcGFyZWQgPSB0cnVlO1xuICB9XG4gIHJldHVybiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiBhcHBseUFuaW1hdGlvblN0eWxlcyhlbGVtZW50LCBvcHRpb25zKSB7XG4gIGFwcGx5QW5pbWF0aW9uRnJvbVN0eWxlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgYXBwbHlBbmltYXRpb25Ub1N0eWxlcyhlbGVtZW50LCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gYXBwbHlBbmltYXRpb25Gcm9tU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuZnJvbSkge1xuICAgIGVsZW1lbnQuY3NzKG9wdGlvbnMuZnJvbSk7XG4gICAgb3B0aW9ucy5mcm9tID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseUFuaW1hdGlvblRvU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMudG8pIHtcbiAgICBlbGVtZW50LmNzcyhvcHRpb25zLnRvKTtcbiAgICBvcHRpb25zLnRvID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBtZXJnZUFuaW1hdGlvbkRldGFpbHMoZWxlbWVudCwgb2xkQW5pbWF0aW9uLCBuZXdBbmltYXRpb24pIHtcbiAgdmFyIHRhcmdldCA9IG9sZEFuaW1hdGlvbi5vcHRpb25zIHx8IHt9O1xuICB2YXIgbmV3T3B0aW9ucyA9IG5ld0FuaW1hdGlvbi5vcHRpb25zIHx8IHt9O1xuXG4gIHZhciB0b0FkZCA9ICh0YXJnZXQuYWRkQ2xhc3MgfHwgJycpICsgJyAnICsgKG5ld09wdGlvbnMuYWRkQ2xhc3MgfHwgJycpO1xuICB2YXIgdG9SZW1vdmUgPSAodGFyZ2V0LnJlbW92ZUNsYXNzIHx8ICcnKSArICcgJyArIChuZXdPcHRpb25zLnJlbW92ZUNsYXNzIHx8ICcnKTtcbiAgdmFyIGNsYXNzZXMgPSByZXNvbHZlRWxlbWVudENsYXNzZXMoZWxlbWVudC5hdHRyKCdjbGFzcycpLCB0b0FkZCwgdG9SZW1vdmUpO1xuXG4gIGlmIChuZXdPcHRpb25zLnByZXBhcmF0aW9uQ2xhc3Nlcykge1xuICAgIHRhcmdldC5wcmVwYXJhdGlvbkNsYXNzZXMgPSBjb25jYXRXaXRoU3BhY2UobmV3T3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMsIHRhcmdldC5wcmVwYXJhdGlvbkNsYXNzZXMpO1xuICAgIGRlbGV0ZSBuZXdPcHRpb25zLnByZXBhcmF0aW9uQ2xhc3NlcztcbiAgfVxuXG4gIC8vIG5vb3AgaXMgYmFzaWNhbGx5IHdoZW4gdGhlcmUgaXMgbm8gY2FsbGJhY2s7IG90aGVyd2lzZSBzb21ldGhpbmcgaGFzIGJlZW4gc2V0XG4gIHZhciByZWFsRG9tT3BlcmF0aW9uID0gdGFyZ2V0LmRvbU9wZXJhdGlvbiAhPT0gbm9vcCA/IHRhcmdldC5kb21PcGVyYXRpb24gOiBudWxsO1xuXG4gIGV4dGVuZCh0YXJnZXQsIG5ld09wdGlvbnMpO1xuXG4gIC8vIFRPRE8obWF0c2tvIG9yIHNyZWVyYW11KTogcHJvcGVyIGZpeCBpcyB0byBtYWludGFpbiBhbGwgYW5pbWF0aW9uIGNhbGxiYWNrIGluIGFycmF5IGFuZCBjYWxsIGF0IGxhc3QsYnV0IG5vdyBvbmx5IGxlYXZlIGhhcyB0aGUgY2FsbGJhY2sgc28gbm8gaXNzdWUgd2l0aCB0aGlzLlxuICBpZiAocmVhbERvbU9wZXJhdGlvbikge1xuICAgIHRhcmdldC5kb21PcGVyYXRpb24gPSByZWFsRG9tT3BlcmF0aW9uO1xuICB9XG5cbiAgaWYgKGNsYXNzZXMuYWRkQ2xhc3MpIHtcbiAgICB0YXJnZXQuYWRkQ2xhc3MgPSBjbGFzc2VzLmFkZENsYXNzO1xuICB9IGVsc2Uge1xuICAgIHRhcmdldC5hZGRDbGFzcyA9IG51bGw7XG4gIH1cblxuICBpZiAoY2xhc3Nlcy5yZW1vdmVDbGFzcykge1xuICAgIHRhcmdldC5yZW1vdmVDbGFzcyA9IGNsYXNzZXMucmVtb3ZlQ2xhc3M7XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0LnJlbW92ZUNsYXNzID0gbnVsbDtcbiAgfVxuXG4gIG9sZEFuaW1hdGlvbi5hZGRDbGFzcyA9IHRhcmdldC5hZGRDbGFzcztcbiAgb2xkQW5pbWF0aW9uLnJlbW92ZUNsYXNzID0gdGFyZ2V0LnJlbW92ZUNsYXNzO1xuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVFbGVtZW50Q2xhc3NlcyhleGlzdGluZywgdG9BZGQsIHRvUmVtb3ZlKSB7XG4gIHZhciBBRERfQ0xBU1MgPSAxO1xuICB2YXIgUkVNT1ZFX0NMQVNTID0gLTE7XG5cbiAgdmFyIGZsYWdzID0ge307XG4gIGV4aXN0aW5nID0gc3BsaXRDbGFzc2VzVG9Mb29rdXAoZXhpc3RpbmcpO1xuXG4gIHRvQWRkID0gc3BsaXRDbGFzc2VzVG9Mb29rdXAodG9BZGQpO1xuICBmb3JFYWNoKHRvQWRkLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgZmxhZ3Nba2V5XSA9IEFERF9DTEFTUztcbiAgfSk7XG5cbiAgdG9SZW1vdmUgPSBzcGxpdENsYXNzZXNUb0xvb2t1cCh0b1JlbW92ZSk7XG4gIGZvckVhY2godG9SZW1vdmUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICBmbGFnc1trZXldID0gZmxhZ3Nba2V5XSA9PT0gQUREX0NMQVNTID8gbnVsbCA6IFJFTU9WRV9DTEFTUztcbiAgfSk7XG5cbiAgdmFyIGNsYXNzZXMgPSB7XG4gICAgYWRkQ2xhc3M6ICcnLFxuICAgIHJlbW92ZUNsYXNzOiAnJ1xuICB9O1xuXG4gIGZvckVhY2goZmxhZ3MsIGZ1bmN0aW9uKHZhbCwga2xhc3MpIHtcbiAgICB2YXIgcHJvcCwgYWxsb3c7XG4gICAgaWYgKHZhbCA9PT0gQUREX0NMQVNTKSB7XG4gICAgICBwcm9wID0gJ2FkZENsYXNzJztcbiAgICAgIGFsbG93ID0gIWV4aXN0aW5nW2tsYXNzXTtcbiAgICB9IGVsc2UgaWYgKHZhbCA9PT0gUkVNT1ZFX0NMQVNTKSB7XG4gICAgICBwcm9wID0gJ3JlbW92ZUNsYXNzJztcbiAgICAgIGFsbG93ID0gZXhpc3Rpbmdba2xhc3NdO1xuICAgIH1cbiAgICBpZiAoYWxsb3cpIHtcbiAgICAgIGlmIChjbGFzc2VzW3Byb3BdLmxlbmd0aCkge1xuICAgICAgICBjbGFzc2VzW3Byb3BdICs9ICcgJztcbiAgICAgIH1cbiAgICAgIGNsYXNzZXNbcHJvcF0gKz0ga2xhc3M7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBzcGxpdENsYXNzZXNUb0xvb2t1cChjbGFzc2VzKSB7XG4gICAgaWYgKGlzU3RyaW5nKGNsYXNzZXMpKSB7XG4gICAgICBjbGFzc2VzID0gY2xhc3Nlcy5zcGxpdCgnICcpO1xuICAgIH1cblxuICAgIHZhciBvYmogPSB7fTtcbiAgICBmb3JFYWNoKGNsYXNzZXMsIGZ1bmN0aW9uKGtsYXNzKSB7XG4gICAgICAvLyBzb21ldGltZXMgdGhlIHNwbGl0IGxlYXZlcyBlbXB0eSBzdHJpbmcgdmFsdWVzXG4gICAgICAvLyBpbmNhc2UgZXh0cmEgc3BhY2VzIHdlcmUgYXBwbGllZCB0byB0aGUgb3B0aW9uc1xuICAgICAgaWYgKGtsYXNzLmxlbmd0aCkge1xuICAgICAgICBvYmpba2xhc3NdID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgcmV0dXJuIGNsYXNzZXM7XG59XG5cbmZ1bmN0aW9uIGdldERvbU5vZGUoZWxlbWVudCkge1xuICByZXR1cm4gKGVsZW1lbnQgaW5zdGFuY2VvZiBhbmd1bGFyLmVsZW1lbnQpID8gZWxlbWVudFswXSA6IGVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGFwcGx5R2VuZXJhdGVkUHJlcGFyYXRpb25DbGFzc2VzKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zKSB7XG4gIHZhciBjbGFzc2VzID0gJyc7XG4gIGlmIChldmVudCkge1xuICAgIGNsYXNzZXMgPSBwZW5kQ2xhc3NlcyhldmVudCwgRVZFTlRfQ0xBU1NfUFJFRklYLCB0cnVlKTtcbiAgfVxuICBpZiAob3B0aW9ucy5hZGRDbGFzcykge1xuICAgIGNsYXNzZXMgPSBjb25jYXRXaXRoU3BhY2UoY2xhc3NlcywgcGVuZENsYXNzZXMob3B0aW9ucy5hZGRDbGFzcywgQUREX0NMQVNTX1NVRkZJWCkpO1xuICB9XG4gIGlmIChvcHRpb25zLnJlbW92ZUNsYXNzKSB7XG4gICAgY2xhc3NlcyA9IGNvbmNhdFdpdGhTcGFjZShjbGFzc2VzLCBwZW5kQ2xhc3NlcyhvcHRpb25zLnJlbW92ZUNsYXNzLCBSRU1PVkVfQ0xBU1NfU1VGRklYKSk7XG4gIH1cbiAgaWYgKGNsYXNzZXMubGVuZ3RoKSB7XG4gICAgb3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMgPSBjbGFzc2VzO1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoY2xhc3Nlcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJHZW5lcmF0ZWRDbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMucHJlcGFyYXRpb25DbGFzc2VzKSB7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhvcHRpb25zLnByZXBhcmF0aW9uQ2xhc3Nlcyk7XG4gICAgb3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMgPSBudWxsO1xuICB9XG4gIGlmIChvcHRpb25zLmFjdGl2ZUNsYXNzZXMpIHtcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKG9wdGlvbnMuYWN0aXZlQ2xhc3Nlcyk7XG4gICAgb3B0aW9ucy5hY3RpdmVDbGFzc2VzID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBibG9ja1RyYW5zaXRpb25zKG5vZGUsIGR1cmF0aW9uKSB7XG4gIC8vIHdlIHVzZSBhIG5lZ2F0aXZlIGRlbGF5IHZhbHVlIHNpbmNlIGl0IHBlcmZvcm1zIGJsb2NraW5nXG4gIC8vIHlldCBpdCBkb2Vzbid0IGtpbGwgYW55IGV4aXN0aW5nIHRyYW5zaXRpb25zIHJ1bm5pbmcgb24gdGhlXG4gIC8vIHNhbWUgZWxlbWVudCB3aGljaCBtYWtlcyB0aGlzIHNhZmUgZm9yIGNsYXNzLWJhc2VkIGFuaW1hdGlvbnNcbiAgdmFyIHZhbHVlID0gZHVyYXRpb24gPyAnLScgKyBkdXJhdGlvbiArICdzJyA6ICcnO1xuICBhcHBseUlubGluZVN0eWxlKG5vZGUsIFtUUkFOU0lUSU9OX0RFTEFZX1BST1AsIHZhbHVlXSk7XG4gIHJldHVybiBbVFJBTlNJVElPTl9ERUxBWV9QUk9QLCB2YWx1ZV07XG59XG5cbmZ1bmN0aW9uIGJsb2NrS2V5ZnJhbWVBbmltYXRpb25zKG5vZGUsIGFwcGx5QmxvY2spIHtcbiAgdmFyIHZhbHVlID0gYXBwbHlCbG9jayA/ICdwYXVzZWQnIDogJyc7XG4gIHZhciBrZXkgPSBBTklNQVRJT05fUFJPUCArIEFOSU1BVElPTl9QTEFZU1RBVEVfS0VZO1xuICBhcHBseUlubGluZVN0eWxlKG5vZGUsIFtrZXksIHZhbHVlXSk7XG4gIHJldHVybiBba2V5LCB2YWx1ZV07XG59XG5cbmZ1bmN0aW9uIGFwcGx5SW5saW5lU3R5bGUobm9kZSwgc3R5bGVUdXBsZSkge1xuICB2YXIgcHJvcCA9IHN0eWxlVHVwbGVbMF07XG4gIHZhciB2YWx1ZSA9IHN0eWxlVHVwbGVbMV07XG4gIG5vZGUuc3R5bGVbcHJvcF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gY29uY2F0V2l0aFNwYWNlKGEsYikge1xuICBpZiAoIWEpIHJldHVybiBiO1xuICBpZiAoIWIpIHJldHVybiBhO1xuICByZXR1cm4gYSArICcgJyArIGI7XG59XG5cbnZhciAkJHJBRlNjaGVkdWxlckZhY3RvcnkgPSBbJyQkckFGJywgZnVuY3Rpb24oJCRyQUYpIHtcbiAgdmFyIHF1ZXVlLCBjYW5jZWxGbjtcblxuICBmdW5jdGlvbiBzY2hlZHVsZXIodGFza3MpIHtcbiAgICAvLyB3ZSBtYWtlIGEgY29weSBzaW5jZSBSQUZTY2hlZHVsZXIgbXV0YXRlcyB0aGUgc3RhdGVcbiAgICAvLyBvZiB0aGUgcGFzc2VkIGluIGFycmF5IHZhcmlhYmxlIGFuZCB0aGlzIHdvdWxkIGJlIGRpZmZpY3VsdFxuICAgIC8vIHRvIHRyYWNrIGRvd24gb24gdGhlIG91dHNpZGUgY29kZVxuICAgIHF1ZXVlID0gcXVldWUuY29uY2F0KHRhc2tzKTtcbiAgICBuZXh0VGljaygpO1xuICB9XG5cbiAgcXVldWUgPSBzY2hlZHVsZXIucXVldWUgPSBbXTtcblxuICAvKiB3YWl0VW50aWxRdWlldCBkb2VzIHR3byB0aGluZ3M6XG4gICAqIDEuIEl0IHdpbGwgcnVuIHRoZSBGSU5BTCBgZm5gIHZhbHVlIG9ubHkgd2hlbiBhbiB1bmNhbmNlbGVkIFJBRiBoYXMgcGFzc2VkIHRocm91Z2hcbiAgICogMi4gSXQgd2lsbCBkZWxheSB0aGUgbmV4dCB3YXZlIG9mIHRhc2tzIGZyb20gcnVubmluZyB1bnRpbCB0aGUgcXVpZXQgYGZuYCBoYXMgcnVuLlxuICAgKlxuICAgKiBUaGUgbW90aXZhdGlvbiBoZXJlIGlzIHRoYXQgYW5pbWF0aW9uIGNvZGUgY2FuIHJlcXVlc3QgbW9yZSB0aW1lIGZyb20gdGhlIHNjaGVkdWxlclxuICAgKiBiZWZvcmUgdGhlIG5leHQgd2F2ZSBydW5zLiBUaGlzIGFsbG93cyBmb3IgY2VydGFpbiBET00gcHJvcGVydGllcyBzdWNoIGFzIGNsYXNzZXMgdG9cbiAgICogYmUgcmVzb2x2ZWQgaW4gdGltZSBmb3IgdGhlIG5leHQgYW5pbWF0aW9uIHRvIHJ1bi5cbiAgICovXG4gIHNjaGVkdWxlci53YWl0VW50aWxRdWlldCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKGNhbmNlbEZuKSBjYW5jZWxGbigpO1xuXG4gICAgY2FuY2VsRm4gPSAkJHJBRihmdW5jdGlvbigpIHtcbiAgICAgIGNhbmNlbEZuID0gbnVsbDtcbiAgICAgIGZuKCk7XG4gICAgICBuZXh0VGljaygpO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBzY2hlZHVsZXI7XG5cbiAgZnVuY3Rpb24gbmV4dFRpY2soKSB7XG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHJldHVybjtcblxuICAgIHZhciBpdGVtcyA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgaXRlbXNbaV0oKTtcbiAgICB9XG5cbiAgICBpZiAoIWNhbmNlbEZuKSB7XG4gICAgICAkJHJBRihmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFjYW5jZWxGbikgbmV4dFRpY2soKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufV07XG5cbi8qKlxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbmdBbmltYXRlQ2hpbGRyZW5cbiAqIEByZXN0cmljdCBBRVxuICogQGVsZW1lbnQgQU5ZXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogbmdBbmltYXRlQ2hpbGRyZW4gYWxsb3dzIHlvdSB0byBzcGVjaWZ5IHRoYXQgY2hpbGRyZW4gb2YgdGhpcyBlbGVtZW50IHNob3VsZCBhbmltYXRlIGV2ZW4gaWYgYW55XG4gKiBvZiB0aGUgY2hpbGRyZW4ncyBwYXJlbnRzIGFyZSBjdXJyZW50bHkgYW5pbWF0aW5nLiBCeSBkZWZhdWx0LCB3aGVuIGFuIGVsZW1lbnQgaGFzIGFuIGFjdGl2ZSBgZW50ZXJgLCBgbGVhdmVgLCBvciBgbW92ZWBcbiAqIChzdHJ1Y3R1cmFsKSBhbmltYXRpb24sIGNoaWxkIGVsZW1lbnRzIHRoYXQgYWxzbyBoYXZlIGFuIGFjdGl2ZSBzdHJ1Y3R1cmFsIGFuaW1hdGlvbiBhcmUgbm90IGFuaW1hdGVkLlxuICpcbiAqIE5vdGUgdGhhdCBldmVuIGlmIGBuZ0FuaW10ZUNoaWxkcmVuYCBpcyBzZXQsIG5vIGNoaWxkIGFuaW1hdGlvbnMgd2lsbCBydW4gd2hlbiB0aGUgcGFyZW50IGVsZW1lbnQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBET00gKGBsZWF2ZWAgYW5pbWF0aW9uKS5cbiAqXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5nQW5pbWF0ZUNoaWxkcmVuIElmIHRoZSB2YWx1ZSBpcyBlbXB0eSwgYHRydWVgIG9yIGBvbmAsXG4gKiAgICAgdGhlbiBjaGlsZCBhbmltYXRpb25zIGFyZSBhbGxvd2VkLiBJZiB0aGUgdmFsdWUgaXMgYGZhbHNlYCwgY2hpbGQgYW5pbWF0aW9ucyBhcmUgbm90IGFsbG93ZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIDxleGFtcGxlIG1vZHVsZT1cIm5nQW5pbWF0ZUNoaWxkcmVuXCIgbmFtZT1cIm5nQW5pbWF0ZUNoaWxkcmVuXCIgZGVwcz1cImFuZ3VsYXItYW5pbWF0ZS5qc1wiIGFuaW1hdGlvbnM9XCJ0cnVlXCI+XG4gICAgIDxmaWxlIG5hbWU9XCJpbmRleC5odG1sXCI+XG4gICAgICAgPGRpdiBuZy1jb250cm9sbGVyPVwibWFpbkNvbnRyb2xsZXIgYXMgbWFpblwiPlxuICAgICAgICAgPGxhYmVsPlNob3cgY29udGFpbmVyPyA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmctbW9kZWw9XCJtYWluLmVudGVyRWxlbWVudFwiIC8+PC9sYWJlbD5cbiAgICAgICAgIDxsYWJlbD5BbmltYXRlIGNoaWxkcmVuPyA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmctbW9kZWw9XCJtYWluLmFuaW1hdGVDaGlsZHJlblwiIC8+PC9sYWJlbD5cbiAgICAgICAgIDxocj5cbiAgICAgICAgIDxkaXYgbmctYW5pbWF0ZS1jaGlsZHJlbj1cInt7bWFpbi5hbmltYXRlQ2hpbGRyZW59fVwiPlxuICAgICAgICAgICA8ZGl2IG5nLWlmPVwibWFpbi5lbnRlckVsZW1lbnRcIiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICAgICAgIExpc3Qgb2YgaXRlbXM6XG4gICAgICAgICAgICAgPGRpdiBuZy1yZXBlYXQ9XCJpdGVtIGluIFswLCAxLCAyLCAzXVwiIGNsYXNzPVwiaXRlbVwiPkl0ZW0ge3tpdGVtfX08L2Rpdj5cbiAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICA8L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICAgPC9maWxlPlxuICAgICA8ZmlsZSBuYW1lPVwiYW5pbWF0aW9ucy5jc3NcIj5cblxuICAgICAgLmNvbnRhaW5lci5uZy1lbnRlcixcbiAgICAgIC5jb250YWluZXIubmctbGVhdmUge1xuICAgICAgICB0cmFuc2l0aW9uOiBhbGwgZWFzZSAxLjVzO1xuICAgICAgfVxuXG4gICAgICAuY29udGFpbmVyLm5nLWVudGVyLFxuICAgICAgLmNvbnRhaW5lci5uZy1sZWF2ZS1hY3RpdmUge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgfVxuXG4gICAgICAuY29udGFpbmVyLm5nLWxlYXZlLFxuICAgICAgLmNvbnRhaW5lci5uZy1lbnRlci1hY3RpdmUge1xuICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgfVxuXG4gICAgICAuaXRlbSB7XG4gICAgICAgIGJhY2tncm91bmQ6IGZpcmVicmljaztcbiAgICAgICAgY29sb3I6ICNGRkY7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gICAgICB9XG5cbiAgICAgIC5pdGVtLm5nLWVudGVyLFxuICAgICAgLml0ZW0ubmctbGVhdmUge1xuICAgICAgICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMS41cyBlYXNlO1xuICAgICAgfVxuXG4gICAgICAuaXRlbS5uZy1lbnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCg1MHB4KTtcbiAgICAgIH1cblxuICAgICAgLml0ZW0ubmctZW50ZXItYWN0aXZlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDApO1xuICAgICAgfVxuICAgIDwvZmlsZT5cbiAgICA8ZmlsZSBuYW1lPVwic2NyaXB0LmpzXCI+XG4gICAgICBhbmd1bGFyLm1vZHVsZSgnbmdBbmltYXRlQ2hpbGRyZW4nLCBbJ25nQW5pbWF0ZSddKVxuICAgICAgICAuY29udHJvbGxlcignbWFpbkNvbnRyb2xsZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzLmFuaW1hdGVDaGlsZHJlbiA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuZW50ZXJFbGVtZW50ID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIDwvZmlsZT5cbiAgPC9leGFtcGxlPlxuICovXG52YXIgJCRBbmltYXRlQ2hpbGRyZW5EaXJlY3RpdmUgPSBbJyRpbnRlcnBvbGF0ZScsIGZ1bmN0aW9uKCRpbnRlcnBvbGF0ZSkge1xuICByZXR1cm4ge1xuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIHZhbCA9IGF0dHJzLm5nQW5pbWF0ZUNoaWxkcmVuO1xuICAgICAgaWYgKGFuZ3VsYXIuaXNTdHJpbmcodmFsKSAmJiB2YWwubGVuZ3RoID09PSAwKSB7IC8vZW1wdHkgYXR0cmlidXRlXG4gICAgICAgIGVsZW1lbnQuZGF0YShOR19BTklNQVRFX0NISUxEUkVOX0RBVEEsIHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSW50ZXJwb2xhdGUgYW5kIHNldCB0aGUgdmFsdWUsIHNvIHRoYXQgaXQgaXMgYXZhaWxhYmxlIHRvXG4gICAgICAgIC8vIGFuaW1hdGlvbnMgdGhhdCBydW4gcmlnaHQgYWZ0ZXIgY29tcGlsYXRpb25cbiAgICAgICAgc2V0RGF0YSgkaW50ZXJwb2xhdGUodmFsKShzY29wZSkpO1xuICAgICAgICBhdHRycy4kb2JzZXJ2ZSgnbmdBbmltYXRlQ2hpbGRyZW4nLCBzZXREYXRhKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2V0RGF0YSh2YWx1ZSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlID09PSAnb24nIHx8IHZhbHVlID09PSAndHJ1ZSc7XG4gICAgICAgIGVsZW1lbnQuZGF0YShOR19BTklNQVRFX0NISUxEUkVOX0RBVEEsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XTtcblxudmFyIEFOSU1BVEVfVElNRVJfS0VZID0gJyQkYW5pbWF0ZUNzcyc7XG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRhbmltYXRlQ3NzXG4gKiBAa2luZCBvYmplY3RcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFRoZSBgJGFuaW1hdGVDc3NgIHNlcnZpY2UgaXMgYSB1c2VmdWwgdXRpbGl0eSB0byB0cmlnZ2VyIGN1c3RvbWl6ZWQgQ1NTLWJhc2VkIHRyYW5zaXRpb25zL2tleWZyYW1lc1xuICogZnJvbSBhIEphdmFTY3JpcHQtYmFzZWQgYW5pbWF0aW9uIG9yIGRpcmVjdGx5IGZyb20gYSBkaXJlY3RpdmUuIFRoZSBwdXJwb3NlIG9mIGAkYW5pbWF0ZUNzc2AgaXMgTk9UXG4gKiB0byBzaWRlLXN0ZXAgaG93IGAkYW5pbWF0ZWAgYW5kIG5nQW5pbWF0ZSB3b3JrLCBidXQgdGhlIGdvYWwgaXMgdG8gYWxsb3cgcHJlLWV4aXN0aW5nIGFuaW1hdGlvbnMgb3JcbiAqIGRpcmVjdGl2ZXMgdG8gY3JlYXRlIG1vcmUgY29tcGxleCBhbmltYXRpb25zIHRoYXQgY2FuIGJlIHB1cmVseSBkcml2ZW4gdXNpbmcgQ1NTIGNvZGUuXG4gKlxuICogTm90ZSB0aGF0IG9ubHkgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IENTUyB0cmFuc2l0aW9ucyBhbmQvb3Iga2V5ZnJhbWUgYW5pbWF0aW9ucyBhcmUgY2FwYWJsZSBvZlxuICogcmVuZGVyaW5nIGFuaW1hdGlvbnMgdHJpZ2dlcmVkIHZpYSBgJGFuaW1hdGVDc3NgIChiYWQgbmV3cyBmb3IgSUU5IGFuZCBsb3dlcikuXG4gKlxuICogIyMgVXNhZ2VcbiAqIE9uY2UgYWdhaW4sIGAkYW5pbWF0ZUNzc2AgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCBpbnNpZGUgb2YgYSByZWdpc3RlcmVkIEphdmFTY3JpcHQgYW5pbWF0aW9uIHRoYXRcbiAqIGlzIHBvd2VyZWQgYnkgbmdBbmltYXRlLiBJdCBpcyBwb3NzaWJsZSB0byB1c2UgYCRhbmltYXRlQ3NzYCBkaXJlY3RseSBpbnNpZGUgb2YgYSBkaXJlY3RpdmUsIGhvd2V2ZXIsXG4gKiBhbnkgYXV0b21hdGljIGNvbnRyb2wgb3ZlciBjYW5jZWxsaW5nIGFuaW1hdGlvbnMgYW5kL29yIHByZXZlbnRpbmcgYW5pbWF0aW9ucyBmcm9tIGJlaW5nIHJ1biBvblxuICogY2hpbGQgZWxlbWVudHMgd2lsbCBub3QgYmUgaGFuZGxlZCBieSBBbmd1bGFyLiBGb3IgdGhpcyB0byB3b3JrIGFzIGV4cGVjdGVkLCBwbGVhc2UgdXNlIGAkYW5pbWF0ZWAgdG9cbiAqIHRyaWdnZXIgdGhlIGFuaW1hdGlvbiBhbmQgdGhlbiBzZXR1cCBhIEphdmFTY3JpcHQgYW5pbWF0aW9uIHRoYXQgaW5qZWN0cyBgJGFuaW1hdGVDc3NgIHRvIHRyaWdnZXJcbiAqIHRoZSBDU1MgYW5pbWF0aW9uLlxuICpcbiAqIFRoZSBleGFtcGxlIGJlbG93IHNob3dzIGhvdyB3ZSBjYW4gY3JlYXRlIGEgZm9sZGluZyBhbmltYXRpb24gb24gYW4gZWxlbWVudCB1c2luZyBgbmctaWZgOlxuICpcbiAqIGBgYGh0bWxcbiAqIDwhLS0gbm90aWNlIHRoZSBgZm9sZC1hbmltYXRpb25gIENTUyBjbGFzcyAtLT5cbiAqIDxkaXYgbmctaWY9XCJvbk9mZlwiIGNsYXNzPVwiZm9sZC1hbmltYXRpb25cIj5cbiAqICAgVGhpcyBlbGVtZW50IHdpbGwgZ28gQk9PTVxuICogPC9kaXY+XG4gKiA8YnV0dG9uIG5nLWNsaWNrPVwib25PZmY9dHJ1ZVwiPkZvbGQgSW48L2J1dHRvbj5cbiAqIGBgYFxuICpcbiAqIE5vdyB3ZSBjcmVhdGUgdGhlICoqSmF2YVNjcmlwdCBhbmltYXRpb24qKiB0aGF0IHdpbGwgdHJpZ2dlciB0aGUgQ1NTIHRyYW5zaXRpb246XG4gKlxuICogYGBganNcbiAqIG5nTW9kdWxlLmFuaW1hdGlvbignLmZvbGQtYW5pbWF0aW9uJywgWyckYW5pbWF0ZUNzcycsIGZ1bmN0aW9uKCRhbmltYXRlQ3NzKSB7XG4gKiAgIHJldHVybiB7XG4gKiAgICAgZW50ZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGRvbmVGbikge1xuICogICAgICAgdmFyIGhlaWdodCA9IGVsZW1lbnRbMF0ub2Zmc2V0SGVpZ2h0O1xuICogICAgICAgcmV0dXJuICRhbmltYXRlQ3NzKGVsZW1lbnQsIHtcbiAqICAgICAgICAgZnJvbTogeyBoZWlnaHQ6JzBweCcgfSxcbiAqICAgICAgICAgdG86IHsgaGVpZ2h0OmhlaWdodCArICdweCcgfSxcbiAqICAgICAgICAgZHVyYXRpb246IDEgLy8gb25lIHNlY29uZFxuICogICAgICAgfSk7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XSk7XG4gKiBgYGBcbiAqXG4gKiAjIyBNb3JlIEFkdmFuY2VkIFVzZXNcbiAqXG4gKiBgJGFuaW1hdGVDc3NgIGlzIHRoZSB1bmRlcmx5aW5nIGNvZGUgdGhhdCBuZ0FuaW1hdGUgdXNlcyB0byBwb3dlciAqKkNTUy1iYXNlZCBhbmltYXRpb25zKiogYmVoaW5kIHRoZSBzY2VuZXMuIFRoZXJlZm9yZSBDU1MgaG9va3NcbiAqIGxpa2UgYC5uZy1FVkVOVGAsIGAubmctRVZFTlQtYWN0aXZlYCwgYC5uZy1FVkVOVC1zdGFnZ2VyYCBhcmUgYWxsIGZlYXR1cmVzIHRoYXQgY2FuIGJlIHRyaWdnZXJlZCB1c2luZyBgJGFuaW1hdGVDc3NgIHZpYSBKYXZhU2NyaXB0IGNvZGUuXG4gKlxuICogVGhpcyBhbHNvIG1lYW5zIHRoYXQganVzdCBhYm91dCBhbnkgY29tYmluYXRpb24gb2YgYWRkaW5nIGNsYXNzZXMsIHJlbW92aW5nIGNsYXNzZXMsIHNldHRpbmcgc3R5bGVzLCBkeW5hbWljYWxseSBzZXR0aW5nIGEga2V5ZnJhbWUgYW5pbWF0aW9uLFxuICogYXBwbHlpbmcgYSBoYXJkY29kZWQgZHVyYXRpb24gb3IgZGVsYXkgdmFsdWUsIGNoYW5naW5nIHRoZSBhbmltYXRpb24gZWFzaW5nIG9yIGFwcGx5aW5nIGEgc3RhZ2dlciBhbmltYXRpb24gYXJlIGFsbCBvcHRpb25zIHRoYXQgd29yayB3aXRoXG4gKiBgJGFuaW1hdGVDc3NgLiBUaGUgc2VydmljZSBpdHNlbGYgaXMgc21hcnQgZW5vdWdoIHRvIGZpZ3VyZSBvdXQgdGhlIGNvbWJpbmF0aW9uIG9mIG9wdGlvbnMgYW5kIGV4YW1pbmUgdGhlIGVsZW1lbnQgc3R5bGluZyBwcm9wZXJ0aWVzIGluIG9yZGVyXG4gKiB0byBwcm92aWRlIGEgd29ya2luZyBhbmltYXRpb24gdGhhdCB3aWxsIHJ1biBpbiBDU1MuXG4gKlxuICogVGhlIGV4YW1wbGUgYmVsb3cgc2hvd2Nhc2VzIGEgbW9yZSBhZHZhbmNlZCB2ZXJzaW9uIG9mIHRoZSBgLmZvbGQtYW5pbWF0aW9uYCBmcm9tIHRoZSBleGFtcGxlIGFib3ZlOlxuICpcbiAqIGBgYGpzXG4gKiBuZ01vZHVsZS5hbmltYXRpb24oJy5mb2xkLWFuaW1hdGlvbicsIFsnJGFuaW1hdGVDc3MnLCBmdW5jdGlvbigkYW5pbWF0ZUNzcykge1xuICogICByZXR1cm4ge1xuICogICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50LCBkb25lRm4pIHtcbiAqICAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50WzBdLm9mZnNldEhlaWdodDtcbiAqICAgICAgIHJldHVybiAkYW5pbWF0ZUNzcyhlbGVtZW50LCB7XG4gKiAgICAgICAgIGFkZENsYXNzOiAncmVkIGxhcmdlLXRleHQgcHVsc2UtdHdpY2UnLFxuICogICAgICAgICBlYXNpbmc6ICdlYXNlLW91dCcsXG4gKiAgICAgICAgIGZyb206IHsgaGVpZ2h0OicwcHgnIH0sXG4gKiAgICAgICAgIHRvOiB7IGhlaWdodDpoZWlnaHQgKyAncHgnIH0sXG4gKiAgICAgICAgIGR1cmF0aW9uOiAxIC8vIG9uZSBzZWNvbmRcbiAqICAgICAgIH0pO1xuICogICAgIH1cbiAqICAgfVxuICogfV0pO1xuICogYGBgXG4gKlxuICogU2luY2Ugd2UncmUgYWRkaW5nL3JlbW92aW5nIENTUyBjbGFzc2VzIHRoZW4gdGhlIENTUyB0cmFuc2l0aW9uIHdpbGwgYWxzbyBwaWNrIHRob3NlIHVwOlxuICpcbiAqIGBgYGNzc1xuICogLyYjNDI7IHNpbmNlIGEgaGFyZGNvZGVkIGR1cmF0aW9uIHZhbHVlIG9mIDEgd2FzIHByb3ZpZGVkIGluIHRoZSBKYXZhU2NyaXB0IGFuaW1hdGlvbiBjb2RlLFxuICogdGhlIENTUyBjbGFzc2VzIGJlbG93IHdpbGwgYmUgdHJhbnNpdGlvbmVkIGRlc3BpdGUgdGhlbSBiZWluZyBkZWZpbmVkIGFzIHJlZ3VsYXIgQ1NTIGNsYXNzZXMgJiM0MjsvXG4gKiAucmVkIHsgYmFja2dyb3VuZDpyZWQ7IH1cbiAqIC5sYXJnZS10ZXh0IHsgZm9udC1zaXplOjIwcHg7IH1cbiAqXG4gKiAvJiM0Mjsgd2UgY2FuIGFsc28gdXNlIGEga2V5ZnJhbWUgYW5pbWF0aW9uIGFuZCAkYW5pbWF0ZUNzcyB3aWxsIG1ha2UgaXQgd29yayBhbG9uZ3NpZGUgdGhlIHRyYW5zaXRpb24gJiM0MjsvXG4gKiAucHVsc2UtdHdpY2Uge1xuICogICBhbmltYXRpb246IDAuNXMgcHVsc2UgbGluZWFyIDI7XG4gKiAgIC13ZWJraXQtYW5pbWF0aW9uOiAwLjVzIHB1bHNlIGxpbmVhciAyO1xuICogfVxuICpcbiAqIEBrZXlmcmFtZXMgcHVsc2Uge1xuICogICBmcm9tIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjUpOyB9XG4gKiAgIHRvIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjUpOyB9XG4gKiB9XG4gKlxuICogQC13ZWJraXQta2V5ZnJhbWVzIHB1bHNlIHtcbiAqICAgZnJvbSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjUpOyB9XG4gKiAgIHRvIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuNSk7IH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEdpdmVuIHRoaXMgY29tcGxleCBjb21iaW5hdGlvbiBvZiBDU1MgY2xhc3Nlcywgc3R5bGVzIGFuZCBvcHRpb25zLCBgJGFuaW1hdGVDc3NgIHdpbGwgZmlndXJlIGV2ZXJ5dGhpbmcgb3V0IGFuZCBtYWtlIHRoZSBhbmltYXRpb24gaGFwcGVuLlxuICpcbiAqICMjIEhvdyB0aGUgT3B0aW9ucyBhcmUgaGFuZGxlZFxuICpcbiAqIGAkYW5pbWF0ZUNzc2AgaXMgdmVyeSB2ZXJzYXRpbGUgYW5kIGludGVsbGlnZW50IHdoZW4gaXQgY29tZXMgdG8gZmlndXJpbmcgb3V0IHdoYXQgY29uZmlndXJhdGlvbnMgdG8gYXBwbHkgdG8gdGhlIGVsZW1lbnQgdG8gZW5zdXJlIHRoZSBhbmltYXRpb25cbiAqIHdvcmtzIHdpdGggdGhlIG9wdGlvbnMgcHJvdmlkZWQuIFNheSBmb3IgZXhhbXBsZSB3ZSB3ZXJlIGFkZGluZyBhIGNsYXNzIHRoYXQgY29udGFpbmVkIGEga2V5ZnJhbWUgdmFsdWUgYW5kIHdlIHdhbnRlZCB0byBhbHNvIGFuaW1hdGUgc29tZSBpbmxpbmVcbiAqIHN0eWxlcyB1c2luZyB0aGUgYGZyb21gIGFuZCBgdG9gIHByb3BlcnRpZXMuXG4gKlxuICogYGBganNcbiAqIHZhciBhbmltYXRvciA9ICRhbmltYXRlQ3NzKGVsZW1lbnQsIHtcbiAqICAgZnJvbTogeyBiYWNrZ3JvdW5kOidyZWQnIH0sXG4gKiAgIHRvOiB7IGJhY2tncm91bmQ6J2JsdWUnIH1cbiAqIH0pO1xuICogYW5pbWF0b3Iuc3RhcnQoKTtcbiAqIGBgYFxuICpcbiAqIGBgYGNzc1xuICogLnJvdGF0aW5nLWFuaW1hdGlvbiB7XG4gKiAgIGFuaW1hdGlvbjowLjVzIHJvdGF0ZSBsaW5lYXI7XG4gKiAgIC13ZWJraXQtYW5pbWF0aW9uOjAuNXMgcm90YXRlIGxpbmVhcjtcbiAqIH1cbiAqXG4gKiBAa2V5ZnJhbWVzIHJvdGF0ZSB7XG4gKiAgIGZyb20geyB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsgfVxuICogICB0byB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH1cbiAqIH1cbiAqXG4gKiBALXdlYmtpdC1rZXlmcmFtZXMgcm90YXRlIHtcbiAqICAgZnJvbSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMGRlZyk7IH1cbiAqICAgdG8geyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIFRoZSBtaXNzaW5nIHBpZWNlcyBoZXJlIGFyZSB0aGF0IHdlIGRvIG5vdCBoYXZlIGEgdHJhbnNpdGlvbiBzZXQgKHdpdGhpbiB0aGUgQ1NTIGNvZGUgbm9yIHdpdGhpbiB0aGUgYCRhbmltYXRlQ3NzYCBvcHRpb25zKSBhbmQgdGhlIGR1cmF0aW9uIG9mIHRoZSBhbmltYXRpb24gaXNcbiAqIGdvaW5nIHRvIGJlIGRldGVjdGVkIGZyb20gd2hhdCB0aGUga2V5ZnJhbWUgc3R5bGVzIG9uIHRoZSBDU1MgY2xhc3MgYXJlLiBJbiB0aGlzIGV2ZW50LCBgJGFuaW1hdGVDc3NgIHdpbGwgYXV0b21hdGljYWxseSBjcmVhdGUgYW4gaW5saW5lIHRyYW5zaXRpb25cbiAqIHN0eWxlIG1hdGNoaW5nIHRoZSBkdXJhdGlvbiBkZXRlY3RlZCBmcm9tIHRoZSBrZXlmcmFtZSBzdHlsZSAod2hpY2ggaXMgcHJlc2VudCBpbiB0aGUgQ1NTIGNsYXNzIHRoYXQgaXMgYmVpbmcgYWRkZWQpIGFuZCB0aGVuIHByZXBhcmUgYm90aCB0aGUgdHJhbnNpdGlvblxuICogYW5kIGtleWZyYW1lIGFuaW1hdGlvbnMgdG8gcnVuIGluIHBhcmFsbGVsIG9uIHRoZSBlbGVtZW50LiBUaGVuIHdoZW4gdGhlIGFuaW1hdGlvbiBpcyB1bmRlcndheSB0aGUgcHJvdmlkZWQgYGZyb21gIGFuZCBgdG9gIENTUyBzdHlsZXMgd2lsbCBiZSBhcHBsaWVkXG4gKiBhbmQgc3ByZWFkIGFjcm9zcyB0aGUgdHJhbnNpdGlvbiBhbmQga2V5ZnJhbWUgYW5pbWF0aW9uLlxuICpcbiAqICMjIFdoYXQgaXMgcmV0dXJuZWRcbiAqXG4gKiBgJGFuaW1hdGVDc3NgIHdvcmtzIGluIHR3byBzdGFnZXM6IGEgcHJlcGFyYXRpb24gcGhhc2UgYW5kIGFuIGFuaW1hdGlvbiBwaGFzZS4gVGhlcmVmb3JlIHdoZW4gYCRhbmltYXRlQ3NzYCBpcyBmaXJzdCBjYWxsZWQgaXQgd2lsbCBOT1QgYWN0dWFsbHlcbiAqIHN0YXJ0IHRoZSBhbmltYXRpb24uIEFsbCB0aGF0IGlzIGdvaW5nIG9uIGhlcmUgaXMgdGhhdCB0aGUgZWxlbWVudCBpcyBiZWluZyBwcmVwYXJlZCBmb3IgdGhlIGFuaW1hdGlvbiAod2hpY2ggbWVhbnMgdGhhdCB0aGUgZ2VuZXJhdGVkIENTUyBjbGFzc2VzIGFyZVxuICogYWRkZWQgYW5kIHJlbW92ZWQgb24gdGhlIGVsZW1lbnQpLiBPbmNlIGAkYW5pbWF0ZUNzc2AgaXMgY2FsbGVkIGl0IHdpbGwgcmV0dXJuIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqXG4gKiBgYGBqc1xuICogdmFyIGFuaW1hdG9yID0gJGFuaW1hdGVDc3MoZWxlbWVudCwgeyAuLi4gfSk7XG4gKiBgYGBcbiAqXG4gKiBOb3cgd2hhdCBkbyB0aGUgY29udGVudHMgb2Ygb3VyIGBhbmltYXRvcmAgdmFyaWFibGUgbG9vayBsaWtlOlxuICpcbiAqIGBgYGpzXG4gKiB7XG4gKiAgIC8vIHN0YXJ0cyB0aGUgYW5pbWF0aW9uXG4gKiAgIHN0YXJ0OiBGdW5jdGlvbixcbiAqXG4gKiAgIC8vIGVuZHMgKGFib3J0cykgdGhlIGFuaW1hdGlvblxuICogICBlbmQ6IEZ1bmN0aW9uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUbyBhY3R1YWxseSBzdGFydCB0aGUgYW5pbWF0aW9uIHdlIG5lZWQgdG8gcnVuIGBhbmltYXRpb24uc3RhcnQoKWAgd2hpY2ggd2lsbCB0aGVuIHJldHVybiBhIHByb21pc2UgdGhhdCB3ZSBjYW4gaG9vayBpbnRvIHRvIGRldGVjdCB3aGVuIHRoZSBhbmltYXRpb24gZW5kcy5cbiAqIElmIHdlIGNob29zZSBub3QgdG8gcnVuIHRoZSBhbmltYXRpb24gdGhlbiB3ZSBNVVNUIHJ1biBgYW5pbWF0aW9uLmVuZCgpYCB0byBwZXJmb3JtIGEgY2xlYW51cCBvbiB0aGUgZWxlbWVudCAoc2luY2Ugc29tZSBDU1MgY2xhc3NlcyBhbmQgc3R5bGVzIG1heSBoYXZlIGJlZW5cbiAqIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIHRoZSBwcmVwYXJhdGlvbiBwaGFzZSkuIE5vdGUgdGhhdCBhbGwgb3RoZXIgcHJvcGVydGllcyBzdWNoIGFzIGR1cmF0aW9uLCBkZWxheSwgdHJhbnNpdGlvbnMgYW5kIGtleWZyYW1lcyBhcmUganVzdCBwcm9wZXJ0aWVzXG4gKiBhbmQgdGhhdCBjaGFuZ2luZyB0aGVtIHdpbGwgbm90IHJlY29uZmlndXJlIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBhbmltYXRpb24uXG4gKlxuICogIyMjIHJ1bm5lci5kb25lKCkgdnMgcnVubmVyLnRoZW4oKVxuICogSXQgaXMgZG9jdW1lbnRlZCB0aGF0IGBhbmltYXRpb24uc3RhcnQoKWAgd2lsbCByZXR1cm4gYSBwcm9taXNlIG9iamVjdCBhbmQgdGhpcyBpcyB0cnVlLCBob3dldmVyLCB0aGVyZSBpcyBhbHNvIGFuIGFkZGl0aW9uYWwgbWV0aG9kIGF2YWlsYWJsZSBvbiB0aGVcbiAqIHJ1bm5lciBjYWxsZWQgYC5kb25lKGNhbGxiYWNrRm4pYC4gVGhlIGRvbmUgbWV0aG9kIHdvcmtzIHRoZSBzYW1lIGFzIGAuZmluYWxseShjYWxsYmFja0ZuKWAsIGhvd2V2ZXIsIGl0IGRvZXMgKipub3QgdHJpZ2dlciBhIGRpZ2VzdCB0byBvY2N1cioqLlxuICogVGhlcmVmb3JlLCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgaXQncyBhbHdheXMgYmVzdCB0byB1c2UgYHJ1bm5lci5kb25lKGNhbGxiYWNrKWAgaW5zdGVhZCBvZiBgcnVubmVyLnRoZW4oKWAsIGBydW5uZXIuY2F0Y2goKWAgb3IgYHJ1bm5lci5maW5hbGx5KClgXG4gKiB1bmxlc3MgeW91IHJlYWxseSBuZWVkIGEgZGlnZXN0IHRvIGtpY2sgb2ZmIGFmdGVyd2FyZHMuXG4gKlxuICogS2VlcCBpbiBtaW5kIHRoYXQsIHRvIG1ha2UgdGhpcyBlYXNpZXIsIG5nQW5pbWF0ZSBoYXMgdHdlYWtlZCB0aGUgSlMgYW5pbWF0aW9ucyBBUEkgdG8gcmVjb2duaXplIHdoZW4gYSBydW5uZXIgaW5zdGFuY2UgaXMgcmV0dXJuZWQgZnJvbSAkYW5pbWF0ZUNzc1xuICogKHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gY2FsbCBgcnVubmVyLmRvbmUoZG9uZUZuKWAgaW5zaWRlIG9mIHlvdXIgSmF2YVNjcmlwdCBhbmltYXRpb24gY29kZSkuXG4gKiBDaGVjayB0aGUge0BsaW5rIG5nQW5pbWF0ZS4kYW5pbWF0ZUNzcyN1c2FnZSBhbmltYXRpb24gY29kZSBhYm92ZX0gdG8gc2VlIGhvdyB0aGlzIHdvcmtzLlxuICpcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gZWxlbWVudCB0aGUgZWxlbWVudCB0aGF0IHdpbGwgYmUgYW5pbWF0ZWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHRoZSBhbmltYXRpb24tcmVsYXRlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGR1cmluZyB0aGUgYW5pbWF0aW9uXG4gKlxuICogKiBgZXZlbnRgIC0gVGhlIERPTSBldmVudCAoZS5nLiBlbnRlciwgbGVhdmUsIG1vdmUpLiBXaGVuIHVzZWQsIGEgZ2VuZXJhdGVkIENTUyBjbGFzcyBvZiBgbmctRVZFTlRgIGFuZCBgbmctRVZFTlQtYWN0aXZlYCB3aWxsIGJlIGFwcGxpZWRcbiAqIHRvIHRoZSBlbGVtZW50IGR1cmluZyB0aGUgYW5pbWF0aW9uLiBNdWx0aXBsZSBldmVudHMgY2FuIGJlIHByb3ZpZGVkIHdoZW4gc3BhY2VzIGFyZSB1c2VkIGFzIGEgc2VwYXJhdG9yLiAoTm90ZSB0aGF0IHRoaXMgd2lsbCBub3QgcGVyZm9ybSBhbnkgRE9NIG9wZXJhdGlvbi4pXG4gKiAqIGBzdHJ1Y3R1cmFsYCAtIEluZGljYXRlcyB0aGF0IHRoZSBgbmctYCBwcmVmaXggd2lsbCBiZSBhZGRlZCB0byB0aGUgZXZlbnQgY2xhc3MuIFNldHRpbmcgdG8gYGZhbHNlYCBvciBvbWl0dGluZyB3aWxsIHR1cm4gYG5nLUVWRU5UYCBhbmRcbiAqIGBuZy1FVkVOVC1hY3RpdmVgIGluIGBFVkVOVGAgYW5kIGBFVkVOVC1hY3RpdmVgLiBVbnVzZWQgaWYgYGV2ZW50YCBpcyBvbWl0dGVkLlxuICogKiBgZWFzaW5nYCAtIFRoZSBDU1MgZWFzaW5nIHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSB0cmFuc2l0aW9uIG9yIGtleWZyYW1lIGFuaW1hdGlvbiAob3IgYm90aCkuXG4gKiAqIGB0cmFuc2l0aW9uU3R5bGVgIC0gVGhlIHJhdyBDU1MgdHJhbnNpdGlvbiBzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCAoZS5nLiBgMXMgbGluZWFyIGFsbGApLlxuICogKiBga2V5ZnJhbWVTdHlsZWAgLSBUaGUgcmF3IENTUyBrZXlmcmFtZSBhbmltYXRpb24gc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgKGUuZy4gYDFzIG15X2FuaW1hdGlvbiBsaW5lYXJgKS5cbiAqICogYGZyb21gIC0gVGhlIHN0YXJ0aW5nIENTUyBzdHlsZXMgKGEga2V5L3ZhbHVlIG9iamVjdCkgdGhhdCB3aWxsIGJlIGFwcGxpZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBhbmltYXRpb24uXG4gKiAqIGB0b2AgLSBUaGUgZW5kaW5nIENTUyBzdHlsZXMgKGEga2V5L3ZhbHVlIG9iamVjdCkgdGhhdCB3aWxsIGJlIGFwcGxpZWQgYWNyb3NzIHRoZSBhbmltYXRpb24gdmlhIGEgQ1NTIHRyYW5zaXRpb24uXG4gKiAqIGBhZGRDbGFzc2AgLSBBIHNwYWNlIHNlcGFyYXRlZCBsaXN0IG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgZWxlbWVudCBhbmQgc3ByZWFkIGFjcm9zcyB0aGUgYW5pbWF0aW9uLlxuICogKiBgcmVtb3ZlQ2xhc3NgIC0gQSBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50IGFuZCBzcHJlYWQgYWNyb3NzIHRoZSBhbmltYXRpb24uXG4gKiAqIGBkdXJhdGlvbmAgLSBBIG51bWJlciB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIHRvdGFsIGR1cmF0aW9uIG9mIHRoZSB0cmFuc2l0aW9uIGFuZC9vciBrZXlmcmFtZSAobm90ZSB0aGF0IGEgdmFsdWUgb2YgMSBpcyAxMDAwbXMpLiBJZiBhIHZhbHVlIG9mIGAwYFxuICogaXMgcHJvdmlkZWQgdGhlbiB0aGUgYW5pbWF0aW9uIHdpbGwgYmUgc2tpcHBlZCBlbnRpcmVseS5cbiAqICogYGRlbGF5YCAtIEEgbnVtYmVyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgdG90YWwgZGVsYXkgb2YgdGhlIHRyYW5zaXRpb24gYW5kL29yIGtleWZyYW1lIChub3RlIHRoYXQgYSB2YWx1ZSBvZiAxIGlzIDEwMDBtcykuIElmIGEgdmFsdWUgb2YgYHRydWVgIGlzXG4gKiB1c2VkIHRoZW4gd2hhdGV2ZXIgZGVsYXkgdmFsdWUgaXMgZGV0ZWN0ZWQgZnJvbSB0aGUgQ1NTIGNsYXNzZXMgd2lsbCBiZSBtaXJyb3JlZCBvbiB0aGUgZWxlbWVudHMgc3R5bGVzIChlLmcuIGJ5IHNldHRpbmcgZGVsYXkgdHJ1ZSB0aGVuIHRoZSBzdHlsZSB2YWx1ZVxuICogb2YgdGhlIGVsZW1lbnQgd2lsbCBiZSBgdHJhbnNpdGlvbi1kZWxheTogREVURUNURURfVkFMVUVgKS4gVXNpbmcgYHRydWVgIGlzIHVzZWZ1bCB3aGVuIHlvdSB3YW50IHRoZSBDU1MgY2xhc3NlcyBhbmQgaW5saW5lIHN0eWxlcyB0byBhbGwgc2hhcmUgdGhlIHNhbWVcbiAqIENTUyBkZWxheSB2YWx1ZS5cbiAqICogYHN0YWdnZXJgIC0gQSBudW1lcmljIHRpbWUgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBkZWxheSBiZXR3ZWVuIHN1Y2Nlc3NpdmVseSBhbmltYXRlZCBlbGVtZW50c1xuICogKHtAbGluayBuZ0FuaW1hdGUjY3NzLXN0YWdnZXJpbmctYW5pbWF0aW9ucyBDbGljayBoZXJlIHRvIGxlYXJuIGhvdyBDU1MtYmFzZWQgc3RhZ2dlcmluZyB3b3JrcyBpbiBuZ0FuaW1hdGUufSlcbiAqICogYHN0YWdnZXJJbmRleGAgLSBUaGUgbnVtZXJpYyBpbmRleCByZXByZXNlbnRpbmcgdGhlIHN0YWdnZXIgaXRlbSAoZS5nLiBhIHZhbHVlIG9mIDUgaXMgZXF1YWwgdG8gdGhlIHNpeHRoIGl0ZW0gaW4gdGhlIHN0YWdnZXI7IHRoZXJlZm9yZSB3aGVuIGFcbiAqICAgYHN0YWdnZXJgIG9wdGlvbiB2YWx1ZSBvZiBgMC4xYCBpcyB1c2VkIHRoZW4gdGhlcmUgd2lsbCBiZSBhIHN0YWdnZXIgZGVsYXkgb2YgYDYwMG1zYClcbiAqICogYGFwcGx5Q2xhc3Nlc0Vhcmx5YCAtIFdoZXRoZXIgb3Igbm90IHRoZSBjbGFzc2VzIGJlaW5nIGFkZGVkIG9yIHJlbW92ZWQgd2lsbCBiZSB1c2VkIHdoZW4gZGV0ZWN0aW5nIHRoZSBhbmltYXRpb24uIFRoaXMgaXMgc2V0IGJ5IGAkYW5pbWF0ZWAgd2hlbiBlbnRlci9sZWF2ZS9tb3ZlIGFuaW1hdGlvbnMgYXJlIGZpcmVkIHRvIGVuc3VyZSB0aGF0IHRoZSBDU1MgY2xhc3NlcyBhcmUgcmVzb2x2ZWQgaW4gdGltZS4gKE5vdGUgdGhhdCB0aGlzIHdpbGwgcHJldmVudCBhbnkgdHJhbnNpdGlvbnMgZnJvbSBvY2N1cnJpbmcgb24gdGhlIGNsYXNzZXMgYmVpbmcgYWRkZWQgYW5kIHJlbW92ZWQuKVxuICogKiBgY2xlYW51cFN0eWxlc2AgLSBXaGV0aGVyIG9yIG5vdCB0aGUgcHJvdmlkZWQgYGZyb21gIGFuZCBgdG9gIHN0eWxlcyB3aWxsIGJlIHJlbW92ZWQgb25jZVxuICogICAgdGhlIGFuaW1hdGlvbiBpcyBjbG9zZWQuIFRoaXMgaXMgdXNlZnVsIGZvciB3aGVuIHRoZSBzdHlsZXMgYXJlIHVzZWQgcHVyZWx5IGZvciB0aGUgc2FrZSBvZlxuICogICAgdGhlIGFuaW1hdGlvbiBhbmQgZG8gbm90IGhhdmUgYSBsYXN0aW5nIHZpc3VhbCBlZmZlY3Qgb24gdGhlIGVsZW1lbnQgKGUuZy4gYSBjb2xsYXBzZSBhbmQgb3BlbiBhbmltYXRpb24pLlxuICogICAgQnkgZGVmYXVsdCB0aGlzIHZhbHVlIGlzIHNldCB0byBgZmFsc2VgLlxuICpcbiAqIEByZXR1cm4ge29iamVjdH0gYW4gb2JqZWN0IHdpdGggc3RhcnQgYW5kIGVuZCBtZXRob2RzIGFuZCBkZXRhaWxzIGFib3V0IHRoZSBhbmltYXRpb24uXG4gKlxuICogKiBgc3RhcnRgIC0gVGhlIG1ldGhvZCB0byBzdGFydCB0aGUgYW5pbWF0aW9uLiBUaGlzIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoZW4gY2FsbGVkLlxuICogKiBgZW5kYCAtIFRoaXMgbWV0aG9kIHdpbGwgY2FuY2VsIHRoZSBhbmltYXRpb24gYW5kIHJlbW92ZSBhbGwgYXBwbGllZCBDU1MgY2xhc3NlcyBhbmQgc3R5bGVzLlxuICovXG52YXIgT05FX1NFQ09ORCA9IDEwMDA7XG52YXIgQkFTRV9URU4gPSAxMDtcblxudmFyIEVMQVBTRURfVElNRV9NQVhfREVDSU1BTF9QTEFDRVMgPSAzO1xudmFyIENMT1NJTkdfVElNRV9CVUZGRVIgPSAxLjU7XG5cbnZhciBERVRFQ1RfQ1NTX1BST1BFUlRJRVMgPSB7XG4gIHRyYW5zaXRpb25EdXJhdGlvbjogICAgICBUUkFOU0lUSU9OX0RVUkFUSU9OX1BST1AsXG4gIHRyYW5zaXRpb25EZWxheTogICAgICAgICBUUkFOU0lUSU9OX0RFTEFZX1BST1AsXG4gIHRyYW5zaXRpb25Qcm9wZXJ0eTogICAgICBUUkFOU0lUSU9OX1BST1AgKyBQUk9QRVJUWV9LRVksXG4gIGFuaW1hdGlvbkR1cmF0aW9uOiAgICAgICBBTklNQVRJT05fRFVSQVRJT05fUFJPUCxcbiAgYW5pbWF0aW9uRGVsYXk6ICAgICAgICAgIEFOSU1BVElPTl9ERUxBWV9QUk9QLFxuICBhbmltYXRpb25JdGVyYXRpb25Db3VudDogQU5JTUFUSU9OX1BST1AgKyBBTklNQVRJT05fSVRFUkFUSU9OX0NPVU5UX0tFWVxufTtcblxudmFyIERFVEVDVF9TVEFHR0VSX0NTU19QUk9QRVJUSUVTID0ge1xuICB0cmFuc2l0aW9uRHVyYXRpb246ICAgICAgVFJBTlNJVElPTl9EVVJBVElPTl9QUk9QLFxuICB0cmFuc2l0aW9uRGVsYXk6ICAgICAgICAgVFJBTlNJVElPTl9ERUxBWV9QUk9QLFxuICBhbmltYXRpb25EdXJhdGlvbjogICAgICAgQU5JTUFUSU9OX0RVUkFUSU9OX1BST1AsXG4gIGFuaW1hdGlvbkRlbGF5OiAgICAgICAgICBBTklNQVRJT05fREVMQVlfUFJPUFxufTtcblxuZnVuY3Rpb24gZ2V0Q3NzS2V5ZnJhbWVEdXJhdGlvblN0eWxlKGR1cmF0aW9uKSB7XG4gIHJldHVybiBbQU5JTUFUSU9OX0RVUkFUSU9OX1BST1AsIGR1cmF0aW9uICsgJ3MnXTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3NzRGVsYXlTdHlsZShkZWxheSwgaXNLZXlmcmFtZUFuaW1hdGlvbikge1xuICB2YXIgcHJvcCA9IGlzS2V5ZnJhbWVBbmltYXRpb24gPyBBTklNQVRJT05fREVMQVlfUFJPUCA6IFRSQU5TSVRJT05fREVMQVlfUFJPUDtcbiAgcmV0dXJuIFtwcm9wLCBkZWxheSArICdzJ107XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDc3NTdHlsZXMoJHdpbmRvdywgZWxlbWVudCwgcHJvcGVydGllcykge1xuICB2YXIgc3R5bGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdmFyIGRldGVjdGVkU3R5bGVzID0gJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIHx8IHt9O1xuICBmb3JFYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uKGZvcm1hbFN0eWxlTmFtZSwgYWN0dWFsU3R5bGVOYW1lKSB7XG4gICAgdmFyIHZhbCA9IGRldGVjdGVkU3R5bGVzW2Zvcm1hbFN0eWxlTmFtZV07XG4gICAgaWYgKHZhbCkge1xuICAgICAgdmFyIGMgPSB2YWwuY2hhckF0KDApO1xuXG4gICAgICAvLyBvbmx5IG51bWVyaWNhbC1iYXNlZCB2YWx1ZXMgaGF2ZSBhIG5lZ2F0aXZlIHNpZ24gb3IgZGlnaXQgYXMgdGhlIGZpcnN0IHZhbHVlXG4gICAgICBpZiAoYyA9PT0gJy0nIHx8IGMgPT09ICcrJyB8fCBjID49IDApIHtcbiAgICAgICAgdmFsID0gcGFyc2VNYXhUaW1lKHZhbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGJ5IHNldHRpbmcgdGhpcyB0byBudWxsIGluIHRoZSBldmVudCB0aGF0IHRoZSBkZWxheSBpcyBub3Qgc2V0IG9yIGlzIHNldCBkaXJlY3RseSBhcyAwXG4gICAgICAvLyB0aGVuIHdlIGNhbiBzdGlsbCBhbGxvdyBmb3IgbmVnYXRpdmUgdmFsdWVzIHRvIGJlIHVzZWQgbGF0ZXIgb24gYW5kIG5vdCBtaXN0YWtlIHRoaXNcbiAgICAgIC8vIHZhbHVlIGZvciBiZWluZyBncmVhdGVyIHRoYW4gYW55IG90aGVyIG5lZ2F0aXZlIHZhbHVlLlxuICAgICAgaWYgKHZhbCA9PT0gMCkge1xuICAgICAgICB2YWwgPSBudWxsO1xuICAgICAgfVxuICAgICAgc3R5bGVzW2FjdHVhbFN0eWxlTmFtZV0gPSB2YWw7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gc3R5bGVzO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1heFRpbWUoc3RyKSB7XG4gIHZhciBtYXhWYWx1ZSA9IDA7XG4gIHZhciB2YWx1ZXMgPSBzdHIuc3BsaXQoL1xccyosXFxzKi8pO1xuICBmb3JFYWNoKHZhbHVlcywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAvLyBpdCdzIGFsd2F5cyBzYWZlIHRvIGNvbnNpZGVyIG9ubHkgc2Vjb25kIHZhbHVlcyBhbmQgb21pdCBgbXNgIHZhbHVlcyBzaW5jZVxuICAgIC8vIGdldENvbXB1dGVkU3R5bGUgd2lsbCBhbHdheXMgaGFuZGxlIHRoZSBjb252ZXJzaW9uIGZvciB1c1xuICAgIGlmICh2YWx1ZS5jaGFyQXQodmFsdWUubGVuZ3RoIC0gMSkgPT0gJ3MnKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCB2YWx1ZS5sZW5ndGggLSAxKTtcbiAgICB9XG4gICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKSB8fCAwO1xuICAgIG1heFZhbHVlID0gbWF4VmFsdWUgPyBNYXRoLm1heCh2YWx1ZSwgbWF4VmFsdWUpIDogdmFsdWU7XG4gIH0pO1xuICByZXR1cm4gbWF4VmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydXRoeVRpbWluZ1ZhbHVlKHZhbCkge1xuICByZXR1cm4gdmFsID09PSAwIHx8IHZhbCAhPSBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRDc3NUcmFuc2l0aW9uRHVyYXRpb25TdHlsZShkdXJhdGlvbiwgYXBwbHlPbmx5RHVyYXRpb24pIHtcbiAgdmFyIHN0eWxlID0gVFJBTlNJVElPTl9QUk9QO1xuICB2YXIgdmFsdWUgPSBkdXJhdGlvbiArICdzJztcbiAgaWYgKGFwcGx5T25seUR1cmF0aW9uKSB7XG4gICAgc3R5bGUgKz0gRFVSQVRJT05fS0VZO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlICs9ICcgbGluZWFyIGFsbCc7XG4gIH1cbiAgcmV0dXJuIFtzdHlsZSwgdmFsdWVdO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMb2NhbENhY2hlTG9va3VwKCkge1xuICB2YXIgY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICByZXR1cm4ge1xuICAgIGZsdXNoOiBmdW5jdGlvbigpIHtcbiAgICAgIGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9LFxuXG4gICAgY291bnQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIGVudHJ5ID0gY2FjaGVba2V5XTtcbiAgICAgIHJldHVybiBlbnRyeSA/IGVudHJ5LnRvdGFsIDogMDtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBlbnRyeSA9IGNhY2hlW2tleV07XG4gICAgICByZXR1cm4gZW50cnkgJiYgZW50cnkudmFsdWU7XG4gICAgfSxcblxuICAgIHB1dDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgaWYgKCFjYWNoZVtrZXldKSB7XG4gICAgICAgIGNhY2hlW2tleV0gPSB7IHRvdGFsOiAxLCB2YWx1ZTogdmFsdWUgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhY2hlW2tleV0udG90YWwrKztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbi8vIHdlIGRvIG5vdCByZWFzc2lnbiBhbiBhbHJlYWR5IHByZXNlbnQgc3R5bGUgdmFsdWUgc2luY2Vcbi8vIGlmIHdlIGRldGVjdCB0aGUgc3R5bGUgcHJvcGVydHkgdmFsdWUgYWdhaW4gd2UgbWF5IGJlXG4vLyBkZXRlY3Rpbmcgc3R5bGVzIHRoYXQgd2VyZSBhZGRlZCB2aWEgdGhlIGBmcm9tYCBzdHlsZXMuXG4vLyBXZSBtYWtlIHVzZSBvZiBgaXNEZWZpbmVkYCBoZXJlIHNpbmNlIGFuIGVtcHR5IHN0cmluZ1xuLy8gb3IgbnVsbCB2YWx1ZSAod2hpY2ggaXMgd2hhdCBnZXRQcm9wZXJ0eVZhbHVlIHdpbGwgcmV0dXJuXG4vLyBmb3IgYSBub24tZXhpc3Rpbmcgc3R5bGUpIHdpbGwgc3RpbGwgYmUgbWFya2VkIGFzIGEgdmFsaWRcbi8vIHZhbHVlIGZvciB0aGUgc3R5bGUgKGEgZmFsc3kgdmFsdWUgaW1wbGllcyB0aGF0IHRoZSBzdHlsZVxuLy8gaXMgdG8gYmUgcmVtb3ZlZCBhdCB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24pLiBJZiB3ZSBoYWQgYSBzaW1wbGVcbi8vIFwiT1JcIiBzdGF0ZW1lbnQgdGhlbiBpdCB3b3VsZCBub3QgYmUgZW5vdWdoIHRvIGNhdGNoIHRoYXQuXG5mdW5jdGlvbiByZWdpc3RlclJlc3RvcmFibGVTdHlsZXMoYmFja3VwLCBub2RlLCBwcm9wZXJ0aWVzKSB7XG4gIGZvckVhY2gocHJvcGVydGllcywgZnVuY3Rpb24ocHJvcCkge1xuICAgIGJhY2t1cFtwcm9wXSA9IGlzRGVmaW5lZChiYWNrdXBbcHJvcF0pXG4gICAgICAgID8gYmFja3VwW3Byb3BdXG4gICAgICAgIDogbm9kZS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHByb3ApO1xuICB9KTtcbn1cblxudmFyICRBbmltYXRlQ3NzUHJvdmlkZXIgPSBbJyRhbmltYXRlUHJvdmlkZXInLCBmdW5jdGlvbigkYW5pbWF0ZVByb3ZpZGVyKSB7XG4gIHZhciBnY3NMb29rdXAgPSBjcmVhdGVMb2NhbENhY2hlTG9va3VwKCk7XG4gIHZhciBnY3NTdGFnZ2VyTG9va3VwID0gY3JlYXRlTG9jYWxDYWNoZUxvb2t1cCgpO1xuXG4gIHRoaXMuJGdldCA9IFsnJHdpbmRvdycsICckJGpxTGl0ZScsICckJEFuaW1hdGVSdW5uZXInLCAnJHRpbWVvdXQnLFxuICAgICAgICAgICAgICAgJyQkZm9yY2VSZWZsb3cnLCAnJHNuaWZmZXInLCAnJCRyQUZTY2hlZHVsZXInLCAnJCRhbmltYXRlUXVldWUnLFxuICAgICAgIGZ1bmN0aW9uKCR3aW5kb3csICAgJCRqcUxpdGUsICAgJCRBbmltYXRlUnVubmVyLCAgICR0aW1lb3V0LFxuICAgICAgICAgICAgICAgICQkZm9yY2VSZWZsb3csICAgJHNuaWZmZXIsICAgJCRyQUZTY2hlZHVsZXIsICQkYW5pbWF0ZVF1ZXVlKSB7XG5cbiAgICB2YXIgYXBwbHlBbmltYXRpb25DbGFzc2VzID0gYXBwbHlBbmltYXRpb25DbGFzc2VzRmFjdG9yeSgkJGpxTGl0ZSk7XG5cbiAgICB2YXIgcGFyZW50Q291bnRlciA9IDA7XG4gICAgZnVuY3Rpb24gZ2NzSGFzaEZuKG5vZGUsIGV4dHJhQ2xhc3Nlcykge1xuICAgICAgdmFyIEtFWSA9IFwiJCRuZ0FuaW1hdGVQYXJlbnRLZXlcIjtcbiAgICAgIHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgdmFyIHBhcmVudElEID0gcGFyZW50Tm9kZVtLRVldIHx8IChwYXJlbnROb2RlW0tFWV0gPSArK3BhcmVudENvdW50ZXIpO1xuICAgICAgcmV0dXJuIHBhcmVudElEICsgJy0nICsgbm9kZS5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgKyAnLScgKyBleHRyYUNsYXNzZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUNhY2hlZENzc1N0eWxlcyhub2RlLCBjbGFzc05hbWUsIGNhY2hlS2V5LCBwcm9wZXJ0aWVzKSB7XG4gICAgICB2YXIgdGltaW5ncyA9IGdjc0xvb2t1cC5nZXQoY2FjaGVLZXkpO1xuXG4gICAgICBpZiAoIXRpbWluZ3MpIHtcbiAgICAgICAgdGltaW5ncyA9IGNvbXB1dGVDc3NTdHlsZXMoJHdpbmRvdywgbm9kZSwgcHJvcGVydGllcyk7XG4gICAgICAgIGlmICh0aW1pbmdzLmFuaW1hdGlvbkl0ZXJhdGlvbkNvdW50ID09PSAnaW5maW5pdGUnKSB7XG4gICAgICAgICAgdGltaW5ncy5hbmltYXRpb25JdGVyYXRpb25Db3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gd2Uga2VlcCBwdXR0aW5nIHRoaXMgaW4gbXVsdGlwbGUgdGltZXMgZXZlbiB0aG91Z2ggdGhlIHZhbHVlIGFuZCB0aGUgY2FjaGVLZXkgYXJlIHRoZSBzYW1lXG4gICAgICAvLyBiZWNhdXNlIHdlJ3JlIGtlZXBpbmcgYW4gaW50ZXJuYWwgdGFsbHkgb2YgaG93IG1hbnkgZHVwbGljYXRlIGFuaW1hdGlvbnMgYXJlIGRldGVjdGVkLlxuICAgICAgZ2NzTG9va3VwLnB1dChjYWNoZUtleSwgdGltaW5ncyk7XG4gICAgICByZXR1cm4gdGltaW5ncztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlQ2FjaGVkQ3NzU3RhZ2dlclN0eWxlcyhub2RlLCBjbGFzc05hbWUsIGNhY2hlS2V5LCBwcm9wZXJ0aWVzKSB7XG4gICAgICB2YXIgc3RhZ2dlcjtcblxuICAgICAgLy8gaWYgd2UgaGF2ZSBvbmUgb3IgbW9yZSBleGlzdGluZyBtYXRjaGVzIG9mIG1hdGNoaW5nIGVsZW1lbnRzXG4gICAgICAvLyBjb250YWluaW5nIHRoZSBzYW1lIHBhcmVudCArIENTUyBzdHlsZXMgKHdoaWNoIGlzIGhvdyBjYWNoZUtleSB3b3JrcylcbiAgICAgIC8vIHRoZW4gc3RhZ2dlcmluZyBpcyBwb3NzaWJsZVxuICAgICAgaWYgKGdjc0xvb2t1cC5jb3VudChjYWNoZUtleSkgPiAwKSB7XG4gICAgICAgIHN0YWdnZXIgPSBnY3NTdGFnZ2VyTG9va3VwLmdldChjYWNoZUtleSk7XG5cbiAgICAgICAgaWYgKCFzdGFnZ2VyKSB7XG4gICAgICAgICAgdmFyIHN0YWdnZXJDbGFzc05hbWUgPSBwZW5kQ2xhc3NlcyhjbGFzc05hbWUsICctc3RhZ2dlcicpO1xuXG4gICAgICAgICAgJCRqcUxpdGUuYWRkQ2xhc3Mobm9kZSwgc3RhZ2dlckNsYXNzTmFtZSk7XG5cbiAgICAgICAgICBzdGFnZ2VyID0gY29tcHV0ZUNzc1N0eWxlcygkd2luZG93LCBub2RlLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICAgIC8vIGZvcmNlIHRoZSBjb252ZXJzaW9uIG9mIGEgbnVsbCB2YWx1ZSB0byB6ZXJvIGluY2FzZSBub3Qgc2V0XG4gICAgICAgICAgc3RhZ2dlci5hbmltYXRpb25EdXJhdGlvbiA9IE1hdGgubWF4KHN0YWdnZXIuYW5pbWF0aW9uRHVyYXRpb24sIDApO1xuICAgICAgICAgIHN0YWdnZXIudHJhbnNpdGlvbkR1cmF0aW9uID0gTWF0aC5tYXgoc3RhZ2dlci50cmFuc2l0aW9uRHVyYXRpb24sIDApO1xuXG4gICAgICAgICAgJCRqcUxpdGUucmVtb3ZlQ2xhc3Mobm9kZSwgc3RhZ2dlckNsYXNzTmFtZSk7XG5cbiAgICAgICAgICBnY3NTdGFnZ2VyTG9va3VwLnB1dChjYWNoZUtleSwgc3RhZ2dlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0YWdnZXIgfHwge307XG4gICAgfVxuXG4gICAgdmFyIGNhbmNlbExhc3RSQUZSZXF1ZXN0O1xuICAgIHZhciByYWZXYWl0UXVldWUgPSBbXTtcbiAgICBmdW5jdGlvbiB3YWl0VW50aWxRdWlldChjYWxsYmFjaykge1xuICAgICAgcmFmV2FpdFF1ZXVlLnB1c2goY2FsbGJhY2spO1xuICAgICAgJCRyQUZTY2hlZHVsZXIud2FpdFVudGlsUXVpZXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGdjc0xvb2t1cC5mbHVzaCgpO1xuICAgICAgICBnY3NTdGFnZ2VyTG9va3VwLmZsdXNoKCk7XG5cbiAgICAgICAgLy8gRE8gTk9UIFJFTU9WRSBUSElTIExJTkUgT1IgUkVGQUNUT1IgT1VUIFRIRSBgcGFnZVdpZHRoYCB2YXJpYWJsZS5cbiAgICAgICAgLy8gUExFQVNFIEVYQU1JTkUgVEhFIGAkJGZvcmNlUmVmbG93YCBzZXJ2aWNlIHRvIHVuZGVyc3RhbmQgd2h5LlxuICAgICAgICB2YXIgcGFnZVdpZHRoID0gJCRmb3JjZVJlZmxvdygpO1xuXG4gICAgICAgIC8vIHdlIHVzZSBhIGZvciBsb29wIHRvIGVuc3VyZSB0aGF0IGlmIHRoZSBxdWV1ZSBpcyBjaGFuZ2VkXG4gICAgICAgIC8vIGR1cmluZyB0aGlzIGxvb3BpbmcgdGhlbiBpdCB3aWxsIGNvbnNpZGVyIG5ldyByZXF1ZXN0c1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhZldhaXRRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHJhZldhaXRRdWV1ZVtpXShwYWdlV2lkdGgpO1xuICAgICAgICB9XG4gICAgICAgIHJhZldhaXRRdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZVRpbWluZ3Mobm9kZSwgY2xhc3NOYW1lLCBjYWNoZUtleSkge1xuICAgICAgdmFyIHRpbWluZ3MgPSBjb21wdXRlQ2FjaGVkQ3NzU3R5bGVzKG5vZGUsIGNsYXNzTmFtZSwgY2FjaGVLZXksIERFVEVDVF9DU1NfUFJPUEVSVElFUyk7XG4gICAgICB2YXIgYUQgPSB0aW1pbmdzLmFuaW1hdGlvbkRlbGF5O1xuICAgICAgdmFyIHREID0gdGltaW5ncy50cmFuc2l0aW9uRGVsYXk7XG4gICAgICB0aW1pbmdzLm1heERlbGF5ID0gYUQgJiYgdERcbiAgICAgICAgICA/IE1hdGgubWF4KGFELCB0RClcbiAgICAgICAgICA6IChhRCB8fCB0RCk7XG4gICAgICB0aW1pbmdzLm1heER1cmF0aW9uID0gTWF0aC5tYXgoXG4gICAgICAgICAgdGltaW5ncy5hbmltYXRpb25EdXJhdGlvbiAqIHRpbWluZ3MuYW5pbWF0aW9uSXRlcmF0aW9uQ291bnQsXG4gICAgICAgICAgdGltaW5ncy50cmFuc2l0aW9uRHVyYXRpb24pO1xuXG4gICAgICByZXR1cm4gdGltaW5ncztcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gaW5pdChlbGVtZW50LCBpbml0aWFsT3B0aW9ucykge1xuICAgICAgLy8gYWxsIG9mIHRoZSBhbmltYXRpb24gZnVuY3Rpb25zIHNob3VsZCBjcmVhdGVcbiAgICAgIC8vIGEgY29weSBvZiB0aGUgb3B0aW9ucyBkYXRhLCBob3dldmVyLCBpZiBhXG4gICAgICAvLyBwYXJlbnQgc2VydmljZSBoYXMgYWxyZWFkeSBjcmVhdGVkIGEgY29weSB0aGVuXG4gICAgICAvLyB3ZSBzaG91bGQgc3RpY2sgdG8gdXNpbmcgdGhhdFxuICAgICAgdmFyIG9wdGlvbnMgPSBpbml0aWFsT3B0aW9ucyB8fCB7fTtcbiAgICAgIGlmICghb3B0aW9ucy4kJHByZXBhcmVkKSB7XG4gICAgICAgIG9wdGlvbnMgPSBwcmVwYXJlQW5pbWF0aW9uT3B0aW9ucyhjb3B5KG9wdGlvbnMpKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHJlc3RvcmVTdHlsZXMgPSB7fTtcbiAgICAgIHZhciBub2RlID0gZ2V0RG9tTm9kZShlbGVtZW50KTtcbiAgICAgIGlmICghbm9kZVxuICAgICAgICAgIHx8ICFub2RlLnBhcmVudE5vZGVcbiAgICAgICAgICB8fCAhJCRhbmltYXRlUXVldWUuZW5hYmxlZCgpKSB7XG4gICAgICAgIHJldHVybiBjbG9zZUFuZFJldHVybk5vb3BBbmltYXRvcigpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdGVtcG9yYXJ5U3R5bGVzID0gW107XG4gICAgICB2YXIgY2xhc3NlcyA9IGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgIHZhciBzdHlsZXMgPSBwYWNrYWdlU3R5bGVzKG9wdGlvbnMpO1xuICAgICAgdmFyIGFuaW1hdGlvbkNsb3NlZDtcbiAgICAgIHZhciBhbmltYXRpb25QYXVzZWQ7XG4gICAgICB2YXIgYW5pbWF0aW9uQ29tcGxldGVkO1xuICAgICAgdmFyIHJ1bm5lcjtcbiAgICAgIHZhciBydW5uZXJIb3N0O1xuICAgICAgdmFyIG1heERlbGF5O1xuICAgICAgdmFyIG1heERlbGF5VGltZTtcbiAgICAgIHZhciBtYXhEdXJhdGlvbjtcbiAgICAgIHZhciBtYXhEdXJhdGlvblRpbWU7XG4gICAgICB2YXIgc3RhcnRUaW1lO1xuICAgICAgdmFyIGV2ZW50cyA9IFtdO1xuXG4gICAgICBpZiAob3B0aW9ucy5kdXJhdGlvbiA9PT0gMCB8fCAoISRzbmlmZmVyLmFuaW1hdGlvbnMgJiYgISRzbmlmZmVyLnRyYW5zaXRpb25zKSkge1xuICAgICAgICByZXR1cm4gY2xvc2VBbmRSZXR1cm5Ob29wQW5pbWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIG1ldGhvZCA9IG9wdGlvbnMuZXZlbnQgJiYgaXNBcnJheShvcHRpb25zLmV2ZW50KVxuICAgICAgICAgICAgPyBvcHRpb25zLmV2ZW50LmpvaW4oJyAnKVxuICAgICAgICAgICAgOiBvcHRpb25zLmV2ZW50O1xuXG4gICAgICB2YXIgaXNTdHJ1Y3R1cmFsID0gbWV0aG9kICYmIG9wdGlvbnMuc3RydWN0dXJhbDtcbiAgICAgIHZhciBzdHJ1Y3R1cmFsQ2xhc3NOYW1lID0gJyc7XG4gICAgICB2YXIgYWRkUmVtb3ZlQ2xhc3NOYW1lID0gJyc7XG5cbiAgICAgIGlmIChpc1N0cnVjdHVyYWwpIHtcbiAgICAgICAgc3RydWN0dXJhbENsYXNzTmFtZSA9IHBlbmRDbGFzc2VzKG1ldGhvZCwgRVZFTlRfQ0xBU1NfUFJFRklYLCB0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAobWV0aG9kKSB7XG4gICAgICAgIHN0cnVjdHVyYWxDbGFzc05hbWUgPSBtZXRob2Q7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmFkZENsYXNzKSB7XG4gICAgICAgIGFkZFJlbW92ZUNsYXNzTmFtZSArPSBwZW5kQ2xhc3NlcyhvcHRpb25zLmFkZENsYXNzLCBBRERfQ0xBU1NfU1VGRklYKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMucmVtb3ZlQ2xhc3MpIHtcbiAgICAgICAgaWYgKGFkZFJlbW92ZUNsYXNzTmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICBhZGRSZW1vdmVDbGFzc05hbWUgKz0gJyAnO1xuICAgICAgICB9XG4gICAgICAgIGFkZFJlbW92ZUNsYXNzTmFtZSArPSBwZW5kQ2xhc3NlcyhvcHRpb25zLnJlbW92ZUNsYXNzLCBSRU1PVkVfQ0xBU1NfU1VGRklYKTtcbiAgICAgIH1cblxuICAgICAgLy8gdGhlcmUgbWF5IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgc3RydWN0dXJhbCBhbmltYXRpb24gaXMgY29tYmluZWQgdG9nZXRoZXJcbiAgICAgIC8vIHdpdGggQ1NTIGNsYXNzZXMgdGhhdCBuZWVkIHRvIHJlc29sdmUgYmVmb3JlIHRoZSBhbmltYXRpb24gaXMgY29tcHV0ZWQuXG4gICAgICAvLyBIb3dldmVyIHRoaXMgbWVhbnMgdGhhdCB0aGVyZSBpcyBubyBleHBsaWNpdCBDU1MgY29kZSB0byBibG9jayB0aGUgYW5pbWF0aW9uXG4gICAgICAvLyBmcm9tIGhhcHBlbmluZyAoYnkgc2V0dGluZyAwcyBub25lIGluIHRoZSBjbGFzcyBuYW1lKS4gSWYgdGhpcyBpcyB0aGUgY2FzZVxuICAgICAgLy8gd2UgbmVlZCB0byBhcHBseSB0aGUgY2xhc3NlcyBiZWZvcmUgdGhlIGZpcnN0IHJBRiBzbyB3ZSBrbm93IHRvIGNvbnRpbnVlIGlmXG4gICAgICAvLyB0aGVyZSBhY3R1YWxseSBpcyBhIGRldGVjdGVkIHRyYW5zaXRpb24gb3Iga2V5ZnJhbWUgYW5pbWF0aW9uXG4gICAgICBpZiAob3B0aW9ucy5hcHBseUNsYXNzZXNFYXJseSAmJiBhZGRSZW1vdmVDbGFzc05hbWUubGVuZ3RoKSB7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHByZXBhcmF0aW9uQ2xhc3NlcyA9IFtzdHJ1Y3R1cmFsQ2xhc3NOYW1lLCBhZGRSZW1vdmVDbGFzc05hbWVdLmpvaW4oJyAnKS50cmltKCk7XG4gICAgICB2YXIgZnVsbENsYXNzTmFtZSA9IGNsYXNzZXMgKyAnICcgKyBwcmVwYXJhdGlvbkNsYXNzZXM7XG4gICAgICB2YXIgYWN0aXZlQ2xhc3NlcyA9IHBlbmRDbGFzc2VzKHByZXBhcmF0aW9uQ2xhc3NlcywgQUNUSVZFX0NMQVNTX1NVRkZJWCk7XG4gICAgICB2YXIgaGFzVG9TdHlsZXMgPSBzdHlsZXMudG8gJiYgT2JqZWN0LmtleXMoc3R5bGVzLnRvKS5sZW5ndGggPiAwO1xuICAgICAgdmFyIGNvbnRhaW5zS2V5ZnJhbWVBbmltYXRpb24gPSAob3B0aW9ucy5rZXlmcmFtZVN0eWxlIHx8ICcnKS5sZW5ndGggPiAwO1xuXG4gICAgICAvLyB0aGVyZSBpcyBubyB3YXkgd2UgY2FuIHRyaWdnZXIgYW4gYW5pbWF0aW9uIGlmIG5vIHN0eWxlcyBhbmRcbiAgICAgIC8vIG5vIGNsYXNzZXMgYXJlIGJlaW5nIGFwcGxpZWQgd2hpY2ggd291bGQgdGhlbiB0cmlnZ2VyIGEgdHJhbnNpdGlvbixcbiAgICAgIC8vIHVubGVzcyB0aGVyZSBhIGlzIHJhdyBrZXlmcmFtZSB2YWx1ZSB0aGF0IGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAgICBpZiAoIWNvbnRhaW5zS2V5ZnJhbWVBbmltYXRpb25cbiAgICAgICAgICAgJiYgIWhhc1RvU3R5bGVzXG4gICAgICAgICAgICYmICFwcmVwYXJhdGlvbkNsYXNzZXMpIHtcbiAgICAgICAgcmV0dXJuIGNsb3NlQW5kUmV0dXJuTm9vcEFuaW1hdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBjYWNoZUtleSwgc3RhZ2dlcjtcbiAgICAgIGlmIChvcHRpb25zLnN0YWdnZXIgPiAwKSB7XG4gICAgICAgIHZhciBzdGFnZ2VyVmFsID0gcGFyc2VGbG9hdChvcHRpb25zLnN0YWdnZXIpO1xuICAgICAgICBzdGFnZ2VyID0ge1xuICAgICAgICAgIHRyYW5zaXRpb25EZWxheTogc3RhZ2dlclZhbCxcbiAgICAgICAgICBhbmltYXRpb25EZWxheTogc3RhZ2dlclZhbCxcbiAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDAsXG4gICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDBcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhY2hlS2V5ID0gZ2NzSGFzaEZuKG5vZGUsIGZ1bGxDbGFzc05hbWUpO1xuICAgICAgICBzdGFnZ2VyID0gY29tcHV0ZUNhY2hlZENzc1N0YWdnZXJTdHlsZXMobm9kZSwgcHJlcGFyYXRpb25DbGFzc2VzLCBjYWNoZUtleSwgREVURUNUX1NUQUdHRVJfQ1NTX1BST1BFUlRJRVMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMuJCRza2lwUHJlcGFyYXRpb25DbGFzc2VzKSB7XG4gICAgICAgICQkanFMaXRlLmFkZENsYXNzKGVsZW1lbnQsIHByZXBhcmF0aW9uQ2xhc3Nlcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhcHBseU9ubHlEdXJhdGlvbjtcblxuICAgICAgaWYgKG9wdGlvbnMudHJhbnNpdGlvblN0eWxlKSB7XG4gICAgICAgIHZhciB0cmFuc2l0aW9uU3R5bGUgPSBbVFJBTlNJVElPTl9QUk9QLCBvcHRpb25zLnRyYW5zaXRpb25TdHlsZV07XG4gICAgICAgIGFwcGx5SW5saW5lU3R5bGUobm9kZSwgdHJhbnNpdGlvblN0eWxlKTtcbiAgICAgICAgdGVtcG9yYXJ5U3R5bGVzLnB1c2godHJhbnNpdGlvblN0eWxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuZHVyYXRpb24gPj0gMCkge1xuICAgICAgICBhcHBseU9ubHlEdXJhdGlvbiA9IG5vZGUuc3R5bGVbVFJBTlNJVElPTl9QUk9QXS5sZW5ndGggPiAwO1xuICAgICAgICB2YXIgZHVyYXRpb25TdHlsZSA9IGdldENzc1RyYW5zaXRpb25EdXJhdGlvblN0eWxlKG9wdGlvbnMuZHVyYXRpb24sIGFwcGx5T25seUR1cmF0aW9uKTtcblxuICAgICAgICAvLyB3ZSBzZXQgdGhlIGR1cmF0aW9uIHNvIHRoYXQgaXQgd2lsbCBiZSBwaWNrZWQgdXAgYnkgZ2V0Q29tcHV0ZWRTdHlsZSBsYXRlclxuICAgICAgICBhcHBseUlubGluZVN0eWxlKG5vZGUsIGR1cmF0aW9uU3R5bGUpO1xuICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChkdXJhdGlvblN0eWxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMua2V5ZnJhbWVTdHlsZSkge1xuICAgICAgICB2YXIga2V5ZnJhbWVTdHlsZSA9IFtBTklNQVRJT05fUFJPUCwgb3B0aW9ucy5rZXlmcmFtZVN0eWxlXTtcbiAgICAgICAgYXBwbHlJbmxpbmVTdHlsZShub2RlLCBrZXlmcmFtZVN0eWxlKTtcbiAgICAgICAgdGVtcG9yYXJ5U3R5bGVzLnB1c2goa2V5ZnJhbWVTdHlsZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpdGVtSW5kZXggPSBzdGFnZ2VyXG4gICAgICAgICAgPyBvcHRpb25zLnN0YWdnZXJJbmRleCA+PSAwXG4gICAgICAgICAgICAgID8gb3B0aW9ucy5zdGFnZ2VySW5kZXhcbiAgICAgICAgICAgICAgOiBnY3NMb29rdXAuY291bnQoY2FjaGVLZXkpXG4gICAgICAgICAgOiAwO1xuXG4gICAgICB2YXIgaXNGaXJzdCA9IGl0ZW1JbmRleCA9PT0gMDtcblxuICAgICAgLy8gdGhpcyBpcyBhIHByZS1lbXB0aXZlIHdheSBvZiBmb3JjaW5nIHRoZSBzZXR1cCBjbGFzc2VzIHRvIGJlIGFkZGVkIGFuZCBhcHBsaWVkIElOU1RBTlRMWVxuICAgICAgLy8gd2l0aG91dCBjYXVzaW5nIGFueSBjb21iaW5hdGlvbiBvZiB0cmFuc2l0aW9ucyB0byBraWNrIGluLiBCeSBhZGRpbmcgYSBuZWdhdGl2ZSBkZWxheSB2YWx1ZVxuICAgICAgLy8gaXQgZm9yY2VzIHRoZSBzZXR1cCBjbGFzcycgdHJhbnNpdGlvbiB0byBlbmQgaW1tZWRpYXRlbHkuIFdlIGxhdGVyIHRoZW4gcmVtb3ZlIHRoZSBuZWdhdGl2ZVxuICAgICAgLy8gdHJhbnNpdGlvbiBkZWxheSB0byBhbGxvdyBmb3IgdGhlIHRyYW5zaXRpb24gdG8gbmF0dXJhbGx5IGRvIGl0J3MgdGhpbmcuIFRoZSBiZWF1dHkgaGVyZSBpc1xuICAgICAgLy8gdGhhdCBpZiB0aGVyZSBpcyBubyB0cmFuc2l0aW9uIGRlZmluZWQgdGhlbiBub3RoaW5nIHdpbGwgaGFwcGVuIGFuZCB0aGlzIHdpbGwgYWxzbyBhbGxvd1xuICAgICAgLy8gb3RoZXIgdHJhbnNpdGlvbnMgdG8gYmUgc3RhY2tlZCBvbiB0b3Agb2YgZWFjaCBvdGhlciB3aXRob3V0IGFueSBjaG9wcGluZyB0aGVtIG91dC5cbiAgICAgIGlmIChpc0ZpcnN0ICYmICFvcHRpb25zLnNraXBCbG9ja2luZykge1xuICAgICAgICBibG9ja1RyYW5zaXRpb25zKG5vZGUsIFNBRkVfRkFTVF9GT1JXQVJEX0RVUkFUSU9OX1ZBTFVFKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRpbWluZ3MgPSBjb21wdXRlVGltaW5ncyhub2RlLCBmdWxsQ2xhc3NOYW1lLCBjYWNoZUtleSk7XG4gICAgICB2YXIgcmVsYXRpdmVEZWxheSA9IHRpbWluZ3MubWF4RGVsYXk7XG4gICAgICBtYXhEZWxheSA9IE1hdGgubWF4KHJlbGF0aXZlRGVsYXksIDApO1xuICAgICAgbWF4RHVyYXRpb24gPSB0aW1pbmdzLm1heER1cmF0aW9uO1xuXG4gICAgICB2YXIgZmxhZ3MgPSB7fTtcbiAgICAgIGZsYWdzLmhhc1RyYW5zaXRpb25zICAgICAgICAgID0gdGltaW5ncy50cmFuc2l0aW9uRHVyYXRpb24gPiAwO1xuICAgICAgZmxhZ3MuaGFzQW5pbWF0aW9ucyAgICAgICAgICAgPSB0aW1pbmdzLmFuaW1hdGlvbkR1cmF0aW9uID4gMDtcbiAgICAgIGZsYWdzLmhhc1RyYW5zaXRpb25BbGwgICAgICAgID0gZmxhZ3MuaGFzVHJhbnNpdGlvbnMgJiYgdGltaW5ncy50cmFuc2l0aW9uUHJvcGVydHkgPT0gJ2FsbCc7XG4gICAgICBmbGFncy5hcHBseVRyYW5zaXRpb25EdXJhdGlvbiA9IGhhc1RvU3R5bGVzICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZmxhZ3MuaGFzVHJhbnNpdGlvbnMgJiYgIWZsYWdzLmhhc1RyYW5zaXRpb25BbGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChmbGFncy5oYXNBbmltYXRpb25zICYmICFmbGFncy5oYXNUcmFuc2l0aW9ucykpO1xuICAgICAgZmxhZ3MuYXBwbHlBbmltYXRpb25EdXJhdGlvbiAgPSBvcHRpb25zLmR1cmF0aW9uICYmIGZsYWdzLmhhc0FuaW1hdGlvbnM7XG4gICAgICBmbGFncy5hcHBseVRyYW5zaXRpb25EZWxheSAgICA9IHRydXRoeVRpbWluZ1ZhbHVlKG9wdGlvbnMuZGVsYXkpICYmIChmbGFncy5hcHBseVRyYW5zaXRpb25EdXJhdGlvbiB8fCBmbGFncy5oYXNUcmFuc2l0aW9ucyk7XG4gICAgICBmbGFncy5hcHBseUFuaW1hdGlvbkRlbGF5ICAgICA9IHRydXRoeVRpbWluZ1ZhbHVlKG9wdGlvbnMuZGVsYXkpICYmIGZsYWdzLmhhc0FuaW1hdGlvbnM7XG4gICAgICBmbGFncy5yZWNhbGN1bGF0ZVRpbWluZ1N0eWxlcyA9IGFkZFJlbW92ZUNsYXNzTmFtZS5sZW5ndGggPiAwO1xuXG4gICAgICBpZiAoZmxhZ3MuYXBwbHlUcmFuc2l0aW9uRHVyYXRpb24gfHwgZmxhZ3MuYXBwbHlBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICBtYXhEdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24gPyBwYXJzZUZsb2F0KG9wdGlvbnMuZHVyYXRpb24pIDogbWF4RHVyYXRpb247XG5cbiAgICAgICAgaWYgKGZsYWdzLmFwcGx5VHJhbnNpdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgZmxhZ3MuaGFzVHJhbnNpdGlvbnMgPSB0cnVlO1xuICAgICAgICAgIHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uID0gbWF4RHVyYXRpb247XG4gICAgICAgICAgYXBwbHlPbmx5RHVyYXRpb24gPSBub2RlLnN0eWxlW1RSQU5TSVRJT05fUFJPUCArIFBST1BFUlRZX0tFWV0ubGVuZ3RoID4gMDtcbiAgICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChnZXRDc3NUcmFuc2l0aW9uRHVyYXRpb25TdHlsZShtYXhEdXJhdGlvbiwgYXBwbHlPbmx5RHVyYXRpb24pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmbGFncy5hcHBseUFuaW1hdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgZmxhZ3MuaGFzQW5pbWF0aW9ucyA9IHRydWU7XG4gICAgICAgICAgdGltaW5ncy5hbmltYXRpb25EdXJhdGlvbiA9IG1heER1cmF0aW9uO1xuICAgICAgICAgIHRlbXBvcmFyeVN0eWxlcy5wdXNoKGdldENzc0tleWZyYW1lRHVyYXRpb25TdHlsZShtYXhEdXJhdGlvbikpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXhEdXJhdGlvbiA9PT0gMCAmJiAhZmxhZ3MucmVjYWxjdWxhdGVUaW1pbmdTdHlsZXMpIHtcbiAgICAgICAgcmV0dXJuIGNsb3NlQW5kUmV0dXJuTm9vcEFuaW1hdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmRlbGF5ICE9IG51bGwpIHtcbiAgICAgICAgdmFyIGRlbGF5U3R5bGU7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5kZWxheSAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICBkZWxheVN0eWxlID0gcGFyc2VGbG9hdChvcHRpb25zLmRlbGF5KTtcbiAgICAgICAgICAvLyBudW1iZXIgaW4gb3B0aW9ucy5kZWxheSBtZWFucyB3ZSBoYXZlIHRvIHJlY2FsY3VsYXRlIHRoZSBkZWxheSBmb3IgdGhlIGNsb3NpbmcgdGltZW91dFxuICAgICAgICAgIG1heERlbGF5ID0gTWF0aC5tYXgoZGVsYXlTdHlsZSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmxhZ3MuYXBwbHlUcmFuc2l0aW9uRGVsYXkpIHtcbiAgICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChnZXRDc3NEZWxheVN0eWxlKGRlbGF5U3R5bGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmbGFncy5hcHBseUFuaW1hdGlvbkRlbGF5KSB7XG4gICAgICAgICAgdGVtcG9yYXJ5U3R5bGVzLnB1c2goZ2V0Q3NzRGVsYXlTdHlsZShkZWxheVN0eWxlLCB0cnVlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gd2UgbmVlZCB0byByZWNhbGN1bGF0ZSB0aGUgZGVsYXkgdmFsdWUgc2luY2Ugd2UgdXNlZCBhIHByZS1lbXB0aXZlIG5lZ2F0aXZlXG4gICAgICAvLyBkZWxheSB2YWx1ZSBhbmQgdGhlIGRlbGF5IHZhbHVlIGlzIHJlcXVpcmVkIGZvciB0aGUgZmluYWwgZXZlbnQgY2hlY2tpbmcuIFRoaXNcbiAgICAgIC8vIHByb3BlcnR5IHdpbGwgZW5zdXJlIHRoYXQgdGhpcyB3aWxsIGhhcHBlbiBhZnRlciB0aGUgUkFGIHBoYXNlIGhhcyBwYXNzZWQuXG4gICAgICBpZiAob3B0aW9ucy5kdXJhdGlvbiA9PSBudWxsICYmIHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uID4gMCkge1xuICAgICAgICBmbGFncy5yZWNhbGN1bGF0ZVRpbWluZ1N0eWxlcyA9IGZsYWdzLnJlY2FsY3VsYXRlVGltaW5nU3R5bGVzIHx8IGlzRmlyc3Q7XG4gICAgICB9XG5cbiAgICAgIG1heERlbGF5VGltZSA9IG1heERlbGF5ICogT05FX1NFQ09ORDtcbiAgICAgIG1heER1cmF0aW9uVGltZSA9IG1heER1cmF0aW9uICogT05FX1NFQ09ORDtcbiAgICAgIGlmICghb3B0aW9ucy5za2lwQmxvY2tpbmcpIHtcbiAgICAgICAgZmxhZ3MuYmxvY2tUcmFuc2l0aW9uID0gdGltaW5ncy50cmFuc2l0aW9uRHVyYXRpb24gPiAwO1xuICAgICAgICBmbGFncy5ibG9ja0tleWZyYW1lQW5pbWF0aW9uID0gdGltaW5ncy5hbmltYXRpb25EdXJhdGlvbiA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWdnZXIuYW5pbWF0aW9uRGVsYXkgPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFnZ2VyLmFuaW1hdGlvbkR1cmF0aW9uID09PSAwO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5mcm9tKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmNsZWFudXBTdHlsZXMpIHtcbiAgICAgICAgICByZWdpc3RlclJlc3RvcmFibGVTdHlsZXMocmVzdG9yZVN0eWxlcywgbm9kZSwgT2JqZWN0LmtleXMob3B0aW9ucy5mcm9tKSk7XG4gICAgICAgIH1cbiAgICAgICAgYXBwbHlBbmltYXRpb25Gcm9tU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmxhZ3MuYmxvY2tUcmFuc2l0aW9uIHx8IGZsYWdzLmJsb2NrS2V5ZnJhbWVBbmltYXRpb24pIHtcbiAgICAgICAgYXBwbHlCbG9ja2luZyhtYXhEdXJhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKCFvcHRpb25zLnNraXBCbG9ja2luZykge1xuICAgICAgICBibG9ja1RyYW5zaXRpb25zKG5vZGUsIGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETyhtYXRza28pOiBmb3IgMS41IGNoYW5nZSB0aGlzIGNvZGUgdG8gaGF2ZSBhbiBhbmltYXRvciBvYmplY3QgZm9yIGJldHRlciBkZWJ1Z2dpbmdcbiAgICAgIHJldHVybiB7XG4gICAgICAgICQkd2lsbEFuaW1hdGU6IHRydWUsXG4gICAgICAgIGVuZDogZW5kRm4sXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoYW5pbWF0aW9uQ2xvc2VkKSByZXR1cm47XG5cbiAgICAgICAgICBydW5uZXJIb3N0ID0ge1xuICAgICAgICAgICAgZW5kOiBlbmRGbixcbiAgICAgICAgICAgIGNhbmNlbDogY2FuY2VsRm4sXG4gICAgICAgICAgICByZXN1bWU6IG51bGwsIC8vdGhpcyB3aWxsIGJlIHNldCBkdXJpbmcgdGhlIHN0YXJ0KCkgcGhhc2VcbiAgICAgICAgICAgIHBhdXNlOiBudWxsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIocnVubmVySG9zdCk7XG5cbiAgICAgICAgICB3YWl0VW50aWxRdWlldChzdGFydCk7XG5cbiAgICAgICAgICAvLyB3ZSBkb24ndCBoYXZlIGFjY2VzcyB0byBwYXVzZS9yZXN1bWUgdGhlIGFuaW1hdGlvblxuICAgICAgICAgIC8vIHNpbmNlIGl0IGhhc24ndCBydW4geWV0LiBBbmltYXRlUnVubmVyIHdpbGwgdGhlcmVmb3JlXG4gICAgICAgICAgLy8gc2V0IG5vb3AgZnVuY3Rpb25zIGZvciByZXN1bWUgYW5kIHBhdXNlIGFuZCB0aGV5IHdpbGxcbiAgICAgICAgICAvLyBsYXRlciBiZSBvdmVycmlkZGVuIG9uY2UgdGhlIGFuaW1hdGlvbiBpcyB0cmlnZ2VyZWRcbiAgICAgICAgICByZXR1cm4gcnVubmVyO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBlbmRGbigpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2FuY2VsRm4oKSB7XG4gICAgICAgIGNsb3NlKHRydWUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbG9zZShyZWplY3RlZCkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgLy8gaWYgdGhlIHByb21pc2UgaGFzIGJlZW4gY2FsbGVkIGFscmVhZHkgdGhlbiB3ZSBzaG91bGRuJ3QgY2xvc2VcbiAgICAgICAgLy8gdGhlIGFuaW1hdGlvbiBhZ2FpblxuICAgICAgICBpZiAoYW5pbWF0aW9uQ2xvc2VkIHx8IChhbmltYXRpb25Db21wbGV0ZWQgJiYgYW5pbWF0aW9uUGF1c2VkKSkgcmV0dXJuO1xuICAgICAgICBhbmltYXRpb25DbG9zZWQgPSB0cnVlO1xuICAgICAgICBhbmltYXRpb25QYXVzZWQgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIW9wdGlvbnMuJCRza2lwUHJlcGFyYXRpb25DbGFzc2VzKSB7XG4gICAgICAgICAgJCRqcUxpdGUucmVtb3ZlQ2xhc3MoZWxlbWVudCwgcHJlcGFyYXRpb25DbGFzc2VzKTtcbiAgICAgICAgfVxuICAgICAgICAkJGpxTGl0ZS5yZW1vdmVDbGFzcyhlbGVtZW50LCBhY3RpdmVDbGFzc2VzKTtcblxuICAgICAgICBibG9ja0tleWZyYW1lQW5pbWF0aW9ucyhub2RlLCBmYWxzZSk7XG4gICAgICAgIGJsb2NrVHJhbnNpdGlvbnMobm9kZSwgZmFsc2UpO1xuXG4gICAgICAgIGZvckVhY2godGVtcG9yYXJ5U3R5bGVzLCBmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICAgIC8vIFRoZXJlIGlzIG9ubHkgb25lIHdheSB0byByZW1vdmUgaW5saW5lIHN0eWxlIHByb3BlcnRpZXMgZW50aXJlbHkgZnJvbSBlbGVtZW50cy5cbiAgICAgICAgICAvLyBCeSB1c2luZyBgcmVtb3ZlUHJvcGVydHlgIHRoaXMgd29ya3MsIGJ1dCB3ZSBuZWVkIHRvIGNvbnZlcnQgY2FtZWwtY2FzZWQgQ1NTXG4gICAgICAgICAgLy8gc3R5bGVzIGRvd24gdG8gaHlwaGVuYXRlZCB2YWx1ZXMuXG4gICAgICAgICAgbm9kZS5zdHlsZVtlbnRyeVswXV0gPSAnJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBwbHlBbmltYXRpb25DbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBhcHBseUFuaW1hdGlvblN0eWxlcyhlbGVtZW50LCBvcHRpb25zKTtcblxuICAgICAgICBpZiAoT2JqZWN0LmtleXMocmVzdG9yZVN0eWxlcykubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yRWFjaChyZXN0b3JlU3R5bGVzLCBmdW5jdGlvbih2YWx1ZSwgcHJvcCkge1xuICAgICAgICAgICAgdmFsdWUgPyBub2RlLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKVxuICAgICAgICAgICAgICAgICAgOiBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgd2UgaGF2ZSB0aGlzIG9wdGlvbiBpcyB0byBhbGxvdyBhIHN5bmNocm9ub3VzIGNsb3NpbmcgY2FsbGJhY2tcbiAgICAgICAgLy8gdGhhdCBpcyBmaXJlZCBhcyBTT09OIGFzIHRoZSBhbmltYXRpb24gZW5kcyAod2hlbiB0aGUgQ1NTIGlzIHJlbW92ZWQpIG9yIGlmXG4gICAgICAgIC8vIHRoZSBhbmltYXRpb24gbmV2ZXIgdGFrZXMgb2ZmIGF0IGFsbC4gQSBnb29kIGV4YW1wbGUgaXMgYSBsZWF2ZSBhbmltYXRpb24gc2luY2VcbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgbXVzdCBiZSByZW1vdmVkIGp1c3QgYWZ0ZXIgdGhlIGFuaW1hdGlvbiBpcyBvdmVyIG9yIGVsc2UgdGhlIGVsZW1lbnRcbiAgICAgICAgLy8gd2lsbCBhcHBlYXIgb24gc2NyZWVuIGZvciBvbmUgYW5pbWF0aW9uIGZyYW1lIGNhdXNpbmcgYW4gb3ZlcmJlYXJpbmcgZmxpY2tlci5cbiAgICAgICAgaWYgKG9wdGlvbnMub25Eb25lKSB7XG4gICAgICAgICAgb3B0aW9ucy5vbkRvbmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudHMgJiYgZXZlbnRzLmxlbmd0aCkge1xuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgdHJhbnNpdGlvbmVuZCAvIGFuaW1hdGlvbmVuZCBsaXN0ZW5lcihzKVxuICAgICAgICAgIGVsZW1lbnQub2ZmKGV2ZW50cy5qb2luKCcgJyksIG9uQW5pbWF0aW9uUHJvZ3Jlc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9DYW5jZWwgdGhlIGZhbGxiYWNrIGNsb3NpbmcgdGltZW91dCBhbmQgcmVtb3ZlIHRoZSB0aW1lciBkYXRhXG4gICAgICAgIHZhciBhbmltYXRpb25UaW1lckRhdGEgPSBlbGVtZW50LmRhdGEoQU5JTUFURV9USU1FUl9LRVkpO1xuICAgICAgICBpZiAoYW5pbWF0aW9uVGltZXJEYXRhKSB7XG4gICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKGFuaW1hdGlvblRpbWVyRGF0YVswXS50aW1lcik7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVEYXRhKEFOSU1BVEVfVElNRVJfS0VZKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSBwcmVwYXJhdGlvbiBmdW5jdGlvbiBmYWlscyB0aGVuIHRoZSBwcm9taXNlIGlzIG5vdCBzZXR1cFxuICAgICAgICBpZiAocnVubmVyKSB7XG4gICAgICAgICAgcnVubmVyLmNvbXBsZXRlKCFyZWplY3RlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYXBwbHlCbG9ja2luZyhkdXJhdGlvbikge1xuICAgICAgICBpZiAoZmxhZ3MuYmxvY2tUcmFuc2l0aW9uKSB7XG4gICAgICAgICAgYmxvY2tUcmFuc2l0aW9ucyhub2RlLCBkdXJhdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmxhZ3MuYmxvY2tLZXlmcmFtZUFuaW1hdGlvbikge1xuICAgICAgICAgIGJsb2NrS2V5ZnJhbWVBbmltYXRpb25zKG5vZGUsICEhZHVyYXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNsb3NlQW5kUmV0dXJuTm9vcEFuaW1hdG9yKCkge1xuICAgICAgICBydW5uZXIgPSBuZXcgJCRBbmltYXRlUnVubmVyKHtcbiAgICAgICAgICBlbmQ6IGVuZEZuLFxuICAgICAgICAgIGNhbmNlbDogY2FuY2VsRm5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc2hvdWxkIGZsdXNoIHRoZSBjYWNoZSBhbmltYXRpb25cbiAgICAgICAgd2FpdFVudGlsUXVpZXQobm9vcCk7XG4gICAgICAgIGNsb3NlKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAkJHdpbGxBbmltYXRlOiBmYWxzZSxcbiAgICAgICAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVubmVyO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZW5kOiBlbmRGblxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvblByb2dyZXNzKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB2YXIgZXYgPSBldmVudC5vcmlnaW5hbEV2ZW50IHx8IGV2ZW50O1xuXG4gICAgICAgIC8vIHdlIG5vdyBhbHdheXMgdXNlIGBEYXRlLm5vdygpYCBkdWUgdG8gdGhlIHJlY2VudCBjaGFuZ2VzIHdpdGhcbiAgICAgICAgLy8gZXZlbnQudGltZVN0YW1wIGluIEZpcmVmb3gsIFdlYmtpdCBhbmQgQ2hyb21lIChzZWUgIzEzNDk0IGZvciBtb3JlIGluZm8pXG4gICAgICAgIHZhciB0aW1lU3RhbXAgPSBldi4kbWFudWFsVGltZVN0YW1wIHx8IERhdGUubm93KCk7XG5cbiAgICAgICAgLyogRmlyZWZveCAob3IgcG9zc2libHkganVzdCBHZWNrbykgbGlrZXMgdG8gbm90IHJvdW5kIHZhbHVlcyB1cFxuICAgICAgICAgKiB3aGVuIGEgbXMgbWVhc3VyZW1lbnQgaXMgdXNlZCBmb3IgdGhlIGFuaW1hdGlvbiAqL1xuICAgICAgICB2YXIgZWxhcHNlZFRpbWUgPSBwYXJzZUZsb2F0KGV2LmVsYXBzZWRUaW1lLnRvRml4ZWQoRUxBUFNFRF9USU1FX01BWF9ERUNJTUFMX1BMQUNFUykpO1xuXG4gICAgICAgIC8qICRtYW51YWxUaW1lU3RhbXAgaXMgYSBtb2NrZWQgdGltZVN0YW1wIHZhbHVlIHdoaWNoIGlzIHNldFxuICAgICAgICAgKiB3aXRoaW4gYnJvd3NlclRyaWdnZXIoKS4gVGhpcyBpcyBvbmx5IGhlcmUgc28gdGhhdCB0ZXN0cyBjYW5cbiAgICAgICAgICogbW9jayBhbmltYXRpb25zIHByb3Blcmx5LiBSZWFsIGV2ZW50cyBmYWxsYmFjayB0byBldmVudC50aW1lU3RhbXAsXG4gICAgICAgICAqIG9yLCBpZiB0aGV5IGRvbid0LCB0aGVuIGEgdGltZVN0YW1wIGlzIGF1dG9tYXRpY2FsbHkgY3JlYXRlZCBmb3IgdGhlbS5cbiAgICAgICAgICogV2UncmUgY2hlY2tpbmcgdG8gc2VlIGlmIHRoZSB0aW1lU3RhbXAgc3VycGFzc2VzIHRoZSBleHBlY3RlZCBkZWxheSxcbiAgICAgICAgICogYnV0IHdlJ3JlIHVzaW5nIGVsYXBzZWRUaW1lIGluc3RlYWQgb2YgdGhlIHRpbWVTdGFtcCBvbiB0aGUgMm5kXG4gICAgICAgICAqIHByZS1jb25kaXRpb24gc2luY2UgYW5pbWF0aW9uUGF1c2VkcyBzb21ldGltZXMgY2xvc2Ugb2ZmIGVhcmx5ICovXG4gICAgICAgIGlmIChNYXRoLm1heCh0aW1lU3RhbXAgLSBzdGFydFRpbWUsIDApID49IG1heERlbGF5VGltZSAmJiBlbGFwc2VkVGltZSA+PSBtYXhEdXJhdGlvbikge1xuICAgICAgICAgIC8vIHdlIHNldCB0aGlzIGZsYWcgdG8gZW5zdXJlIHRoYXQgaWYgdGhlIHRyYW5zaXRpb24gaXMgcGF1c2VkIHRoZW4sIHdoZW4gcmVzdW1lZCxcbiAgICAgICAgICAvLyB0aGUgYW5pbWF0aW9uIHdpbGwgYXV0b21hdGljYWxseSBjbG9zZSBpdHNlbGYgc2luY2UgdHJhbnNpdGlvbnMgY2Fubm90IGJlIHBhdXNlZC5cbiAgICAgICAgICBhbmltYXRpb25Db21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25DbG9zZWQpIHJldHVybjtcbiAgICAgICAgaWYgKCFub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV2ZW4gdGhvdWdoIHdlIG9ubHkgcGF1c2Uga2V5ZnJhbWUgYW5pbWF0aW9ucyBoZXJlIHRoZSBwYXVzZSBmbGFnXG4gICAgICAgIC8vIHdpbGwgc3RpbGwgaGFwcGVuIHdoZW4gdHJhbnNpdGlvbnMgYXJlIHVzZWQuIE9ubHkgdGhlIHRyYW5zaXRpb24gd2lsbFxuICAgICAgICAvLyBub3QgYmUgcGF1c2VkIHNpbmNlIHRoYXQgaXMgbm90IHBvc3NpYmxlLiBJZiB0aGUgYW5pbWF0aW9uIGVuZHMgd2hlblxuICAgICAgICAvLyBwYXVzZWQgdGhlbiBpdCB3aWxsIG5vdCBjb21wbGV0ZSB1bnRpbCB1bnBhdXNlZCBvciBjYW5jZWxsZWQuXG4gICAgICAgIHZhciBwbGF5UGF1c2UgPSBmdW5jdGlvbihwbGF5QW5pbWF0aW9uKSB7XG4gICAgICAgICAgaWYgKCFhbmltYXRpb25Db21wbGV0ZWQpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvblBhdXNlZCA9ICFwbGF5QW5pbWF0aW9uO1xuICAgICAgICAgICAgaWYgKHRpbWluZ3MuYW5pbWF0aW9uRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYmxvY2tLZXlmcmFtZUFuaW1hdGlvbnMobm9kZSwgYW5pbWF0aW9uUGF1c2VkKTtcbiAgICAgICAgICAgICAgYW5pbWF0aW9uUGF1c2VkXG4gICAgICAgICAgICAgICAgICA/IHRlbXBvcmFyeVN0eWxlcy5wdXNoKHZhbHVlKVxuICAgICAgICAgICAgICAgICAgOiByZW1vdmVGcm9tQXJyYXkodGVtcG9yYXJ5U3R5bGVzLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChhbmltYXRpb25QYXVzZWQgJiYgcGxheUFuaW1hdGlvbikge1xuICAgICAgICAgICAgYW5pbWF0aW9uUGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjaGVja2luZyB0aGUgc3RhZ2dlciBkdXJhdGlvbiBwcmV2ZW50cyBhbiBhY2NpZGVudGFsbHkgY2FzY2FkZSBvZiB0aGUgQ1NTIGRlbGF5IHN0eWxlXG4gICAgICAgIC8vIGJlaW5nIGluaGVyaXRlZCBmcm9tIHRoZSBwYXJlbnQuIElmIHRoZSB0cmFuc2l0aW9uIGR1cmF0aW9uIGlzIHplcm8gdGhlbiB3ZSBjYW4gc2FmZWx5XG4gICAgICAgIC8vIHJlbHkgdGhhdCB0aGUgZGVsYXkgdmFsdWUgaXMgYW4gaW50ZW50aW9uYWwgc3RhZ2dlciBkZWxheSBzdHlsZS5cbiAgICAgICAgdmFyIG1heFN0YWdnZXIgPSBpdGVtSW5kZXggPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgJiYgKCh0aW1pbmdzLnRyYW5zaXRpb25EdXJhdGlvbiAmJiBzdGFnZ2VyLnRyYW5zaXRpb25EdXJhdGlvbiA9PT0gMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGltaW5ncy5hbmltYXRpb25EdXJhdGlvbiAmJiBzdGFnZ2VyLmFuaW1hdGlvbkR1cmF0aW9uID09PSAwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAmJiBNYXRoLm1heChzdGFnZ2VyLmFuaW1hdGlvbkRlbGF5LCBzdGFnZ2VyLnRyYW5zaXRpb25EZWxheSk7XG4gICAgICAgIGlmIChtYXhTdGFnZ2VyKSB7XG4gICAgICAgICAgJHRpbWVvdXQodHJpZ2dlckFuaW1hdGlvblN0YXJ0LFxuICAgICAgICAgICAgICAgICAgIE1hdGguZmxvb3IobWF4U3RhZ2dlciAqIGl0ZW1JbmRleCAqIE9ORV9TRUNPTkQpLFxuICAgICAgICAgICAgICAgICAgIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cmlnZ2VyQW5pbWF0aW9uU3RhcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMgd2lsbCBkZWNvcmF0ZSB0aGUgZXhpc3RpbmcgcHJvbWlzZSBydW5uZXIgd2l0aCBwYXVzZS9yZXN1bWUgbWV0aG9kc1xuICAgICAgICBydW5uZXJIb3N0LnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHBsYXlQYXVzZSh0cnVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBydW5uZXJIb3N0LnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcGxheVBhdXNlKGZhbHNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiB0cmlnZ2VyQW5pbWF0aW9uU3RhcnQoKSB7XG4gICAgICAgICAgLy8ganVzdCBpbmNhc2UgYSBzdGFnZ2VyIGFuaW1hdGlvbiBraWNrcyBpbiB3aGVuIHRoZSBhbmltYXRpb25cbiAgICAgICAgICAvLyBpdHNlbGYgd2FzIGNhbmNlbGxlZCBlbnRpcmVseVxuICAgICAgICAgIGlmIChhbmltYXRpb25DbG9zZWQpIHJldHVybjtcblxuICAgICAgICAgIGFwcGx5QmxvY2tpbmcoZmFsc2UpO1xuXG4gICAgICAgICAgZm9yRWFjaCh0ZW1wb3JhcnlTdHlsZXMsIGZ1bmN0aW9uKGVudHJ5KSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gZW50cnlbMF07XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbnRyeVsxXTtcbiAgICAgICAgICAgIG5vZGUuc3R5bGVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYXBwbHlBbmltYXRpb25DbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICQkanFMaXRlLmFkZENsYXNzKGVsZW1lbnQsIGFjdGl2ZUNsYXNzZXMpO1xuXG4gICAgICAgICAgaWYgKGZsYWdzLnJlY2FsY3VsYXRlVGltaW5nU3R5bGVzKSB7XG4gICAgICAgICAgICBmdWxsQ2xhc3NOYW1lID0gbm9kZS5jbGFzc05hbWUgKyAnICcgKyBwcmVwYXJhdGlvbkNsYXNzZXM7XG4gICAgICAgICAgICBjYWNoZUtleSA9IGdjc0hhc2hGbihub2RlLCBmdWxsQ2xhc3NOYW1lKTtcblxuICAgICAgICAgICAgdGltaW5ncyA9IGNvbXB1dGVUaW1pbmdzKG5vZGUsIGZ1bGxDbGFzc05hbWUsIGNhY2hlS2V5KTtcbiAgICAgICAgICAgIHJlbGF0aXZlRGVsYXkgPSB0aW1pbmdzLm1heERlbGF5O1xuICAgICAgICAgICAgbWF4RGVsYXkgPSBNYXRoLm1heChyZWxhdGl2ZURlbGF5LCAwKTtcbiAgICAgICAgICAgIG1heER1cmF0aW9uID0gdGltaW5ncy5tYXhEdXJhdGlvbjtcblxuICAgICAgICAgICAgaWYgKG1heER1cmF0aW9uID09PSAwKSB7XG4gICAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmxhZ3MuaGFzVHJhbnNpdGlvbnMgPSB0aW1pbmdzLnRyYW5zaXRpb25EdXJhdGlvbiA+IDA7XG4gICAgICAgICAgICBmbGFncy5oYXNBbmltYXRpb25zID0gdGltaW5ncy5hbmltYXRpb25EdXJhdGlvbiA+IDA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGZsYWdzLmFwcGx5QW5pbWF0aW9uRGVsYXkpIHtcbiAgICAgICAgICAgIHJlbGF0aXZlRGVsYXkgPSB0eXBlb2Ygb3B0aW9ucy5kZWxheSAhPT0gXCJib29sZWFuXCIgJiYgdHJ1dGh5VGltaW5nVmFsdWUob3B0aW9ucy5kZWxheSlcbiAgICAgICAgICAgICAgICAgID8gcGFyc2VGbG9hdChvcHRpb25zLmRlbGF5KVxuICAgICAgICAgICAgICAgICAgOiByZWxhdGl2ZURlbGF5O1xuXG4gICAgICAgICAgICBtYXhEZWxheSA9IE1hdGgubWF4KHJlbGF0aXZlRGVsYXksIDApO1xuICAgICAgICAgICAgdGltaW5ncy5hbmltYXRpb25EZWxheSA9IHJlbGF0aXZlRGVsYXk7XG4gICAgICAgICAgICBkZWxheVN0eWxlID0gZ2V0Q3NzRGVsYXlTdHlsZShyZWxhdGl2ZURlbGF5LCB0cnVlKTtcbiAgICAgICAgICAgIHRlbXBvcmFyeVN0eWxlcy5wdXNoKGRlbGF5U3R5bGUpO1xuICAgICAgICAgICAgbm9kZS5zdHlsZVtkZWxheVN0eWxlWzBdXSA9IGRlbGF5U3R5bGVbMV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWF4RGVsYXlUaW1lID0gbWF4RGVsYXkgKiBPTkVfU0VDT05EO1xuICAgICAgICAgIG1heER1cmF0aW9uVGltZSA9IG1heER1cmF0aW9uICogT05FX1NFQ09ORDtcblxuICAgICAgICAgIGlmIChvcHRpb25zLmVhc2luZykge1xuICAgICAgICAgICAgdmFyIGVhc2VQcm9wLCBlYXNlVmFsID0gb3B0aW9ucy5lYXNpbmc7XG4gICAgICAgICAgICBpZiAoZmxhZ3MuaGFzVHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgICAgZWFzZVByb3AgPSBUUkFOU0lUSU9OX1BST1AgKyBUSU1JTkdfS0VZO1xuICAgICAgICAgICAgICB0ZW1wb3JhcnlTdHlsZXMucHVzaChbZWFzZVByb3AsIGVhc2VWYWxdKTtcbiAgICAgICAgICAgICAgbm9kZS5zdHlsZVtlYXNlUHJvcF0gPSBlYXNlVmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZsYWdzLmhhc0FuaW1hdGlvbnMpIHtcbiAgICAgICAgICAgICAgZWFzZVByb3AgPSBBTklNQVRJT05fUFJPUCArIFRJTUlOR19LRVk7XG4gICAgICAgICAgICAgIHRlbXBvcmFyeVN0eWxlcy5wdXNoKFtlYXNlUHJvcCwgZWFzZVZhbF0pO1xuICAgICAgICAgICAgICBub2RlLnN0eWxlW2Vhc2VQcm9wXSA9IGVhc2VWYWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRpbWluZ3MudHJhbnNpdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgICBldmVudHMucHVzaChUUkFOU0lUSU9ORU5EX0VWRU5UKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGltaW5ncy5hbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgICAgZXZlbnRzLnB1c2goQU5JTUFUSU9ORU5EX0VWRU5UKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIHZhciB0aW1lclRpbWUgPSBtYXhEZWxheVRpbWUgKyBDTE9TSU5HX1RJTUVfQlVGRkVSICogbWF4RHVyYXRpb25UaW1lO1xuICAgICAgICAgIHZhciBlbmRUaW1lID0gc3RhcnRUaW1lICsgdGltZXJUaW1lO1xuXG4gICAgICAgICAgdmFyIGFuaW1hdGlvbnNEYXRhID0gZWxlbWVudC5kYXRhKEFOSU1BVEVfVElNRVJfS0VZKSB8fCBbXTtcbiAgICAgICAgICB2YXIgc2V0dXBGYWxsYmFja1RpbWVyID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoYW5pbWF0aW9uc0RhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFRpbWVyRGF0YSA9IGFuaW1hdGlvbnNEYXRhWzBdO1xuICAgICAgICAgICAgc2V0dXBGYWxsYmFja1RpbWVyID0gZW5kVGltZSA+IGN1cnJlbnRUaW1lckRhdGEuZXhwZWN0ZWRFbmRUaW1lO1xuICAgICAgICAgICAgaWYgKHNldHVwRmFsbGJhY2tUaW1lcikge1xuICAgICAgICAgICAgICAkdGltZW91dC5jYW5jZWwoY3VycmVudFRpbWVyRGF0YS50aW1lcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhbmltYXRpb25zRGF0YS5wdXNoKGNsb3NlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2V0dXBGYWxsYmFja1RpbWVyKSB7XG4gICAgICAgICAgICB2YXIgdGltZXIgPSAkdGltZW91dChvbkFuaW1hdGlvbkV4cGlyZWQsIHRpbWVyVGltZSwgZmFsc2UpO1xuICAgICAgICAgICAgYW5pbWF0aW9uc0RhdGFbMF0gPSB7XG4gICAgICAgICAgICAgIHRpbWVyOiB0aW1lcixcbiAgICAgICAgICAgICAgZXhwZWN0ZWRFbmRUaW1lOiBlbmRUaW1lXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYW5pbWF0aW9uc0RhdGEucHVzaChjbG9zZSk7XG4gICAgICAgICAgICBlbGVtZW50LmRhdGEoQU5JTUFURV9USU1FUl9LRVksIGFuaW1hdGlvbnNEYXRhKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5vbihldmVudHMuam9pbignICcpLCBvbkFuaW1hdGlvblByb2dyZXNzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob3B0aW9ucy50bykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2xlYW51cFN0eWxlcykge1xuICAgICAgICAgICAgICByZWdpc3RlclJlc3RvcmFibGVTdHlsZXMocmVzdG9yZVN0eWxlcywgbm9kZSwgT2JqZWN0LmtleXMob3B0aW9ucy50bykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXBwbHlBbmltYXRpb25Ub1N0eWxlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvbkV4cGlyZWQoKSB7XG4gICAgICAgICAgdmFyIGFuaW1hdGlvbnNEYXRhID0gZWxlbWVudC5kYXRhKEFOSU1BVEVfVElNRVJfS0VZKTtcblxuICAgICAgICAgIC8vIHRoaXMgd2lsbCBiZSBmYWxzZSBpbiB0aGUgZXZlbnQgdGhhdCB0aGUgZWxlbWVudCB3YXNcbiAgICAgICAgICAvLyByZW1vdmVkIGZyb20gdGhlIERPTSAodmlhIGEgbGVhdmUgYW5pbWF0aW9uIG9yIHNvbWV0aGluZ1xuICAgICAgICAgIC8vIHNpbWlsYXIpXG4gICAgICAgICAgaWYgKGFuaW1hdGlvbnNEYXRhKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFuaW1hdGlvbnNEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGFuaW1hdGlvbnNEYXRhW2ldKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZURhdGEoQU5JTUFURV9USU1FUl9LRVkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1dO1xufV07XG5cbnZhciAkJEFuaW1hdGVDc3NEcml2ZXJQcm92aWRlciA9IFsnJCRhbmltYXRpb25Qcm92aWRlcicsIGZ1bmN0aW9uKCQkYW5pbWF0aW9uUHJvdmlkZXIpIHtcbiAgJCRhbmltYXRpb25Qcm92aWRlci5kcml2ZXJzLnB1c2goJyQkYW5pbWF0ZUNzc0RyaXZlcicpO1xuXG4gIHZhciBOR19BTklNQVRFX1NISU1fQ0xBU1NfTkFNRSA9ICduZy1hbmltYXRlLXNoaW0nO1xuICB2YXIgTkdfQU5JTUFURV9BTkNIT1JfQ0xBU1NfTkFNRSA9ICduZy1hbmNob3InO1xuXG4gIHZhciBOR19PVVRfQU5DSE9SX0NMQVNTX05BTUUgPSAnbmctYW5jaG9yLW91dCc7XG4gIHZhciBOR19JTl9BTkNIT1JfQ0xBU1NfTkFNRSA9ICduZy1hbmNob3ItaW4nO1xuXG4gIGZ1bmN0aW9uIGlzRG9jdW1lbnRGcmFnbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUubm9kZVR5cGUgPT09IDExO1xuICB9XG5cbiAgdGhpcy4kZ2V0ID0gWyckYW5pbWF0ZUNzcycsICckcm9vdFNjb3BlJywgJyQkQW5pbWF0ZVJ1bm5lcicsICckcm9vdEVsZW1lbnQnLCAnJHNuaWZmZXInLCAnJCRqcUxpdGUnLCAnJGRvY3VtZW50JyxcbiAgICAgICBmdW5jdGlvbigkYW5pbWF0ZUNzcywgICAkcm9vdFNjb3BlLCAgICQkQW5pbWF0ZVJ1bm5lciwgICAkcm9vdEVsZW1lbnQsICAgJHNuaWZmZXIsICAgJCRqcUxpdGUsICAgJGRvY3VtZW50KSB7XG5cbiAgICAvLyBvbmx5IGJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0aGVzZSBwcm9wZXJ0aWVzIGNhbiByZW5kZXIgYW5pbWF0aW9uc1xuICAgIGlmICghJHNuaWZmZXIuYW5pbWF0aW9ucyAmJiAhJHNuaWZmZXIudHJhbnNpdGlvbnMpIHJldHVybiBub29wO1xuXG4gICAgdmFyIGJvZHlOb2RlID0gJGRvY3VtZW50WzBdLmJvZHk7XG4gICAgdmFyIHJvb3ROb2RlID0gZ2V0RG9tTm9kZSgkcm9vdEVsZW1lbnQpO1xuXG4gICAgdmFyIHJvb3RCb2R5RWxlbWVudCA9IGpxTGl0ZShcbiAgICAgIC8vIHRoaXMgaXMgdG8gYXZvaWQgdXNpbmcgc29tZXRoaW5nIHRoYXQgZXhpc3RzIG91dHNpZGUgb2YgdGhlIGJvZHlcbiAgICAgIC8vIHdlIGFsc28gc3BlY2lhbCBjYXNlIHRoZSBkb2MgZnJhZ21lbnQgY2FzZSBiZWNhdXNlIG91ciB1bml0IHRlc3QgY29kZVxuICAgICAgLy8gYXBwZW5kcyB0aGUgJHJvb3RFbGVtZW50IHRvIHRoZSBib2R5IGFmdGVyIHRoZSBhcHAgaGFzIGJlZW4gYm9vdHN0cmFwcGVkXG4gICAgICBpc0RvY3VtZW50RnJhZ21lbnQocm9vdE5vZGUpIHx8IGJvZHlOb2RlLmNvbnRhaW5zKHJvb3ROb2RlKSA/IHJvb3ROb2RlIDogYm9keU5vZGVcbiAgICApO1xuXG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGluaXREcml2ZXJGbihhbmltYXRpb25EZXRhaWxzKSB7XG4gICAgICByZXR1cm4gYW5pbWF0aW9uRGV0YWlscy5mcm9tICYmIGFuaW1hdGlvbkRldGFpbHMudG9cbiAgICAgICAgICA/IHByZXBhcmVGcm9tVG9BbmNob3JBbmltYXRpb24oYW5pbWF0aW9uRGV0YWlscy5mcm9tLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25EZXRhaWxzLnRvLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25EZXRhaWxzLmNsYXNzZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkRldGFpbHMuYW5jaG9ycylcbiAgICAgICAgICA6IHByZXBhcmVSZWd1bGFyQW5pbWF0aW9uKGFuaW1hdGlvbkRldGFpbHMpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJDc3NDbGFzc2VzKGNsYXNzZXMpIHtcbiAgICAgIC8vcmVtb3ZlIGFsbCB0aGUgYG5nLWAgc3R1ZmZcbiAgICAgIHJldHVybiBjbGFzc2VzLnJlcGxhY2UoL1xcYm5nLVxcUytcXGIvZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFVuaXF1ZVZhbHVlcyhhLCBiKSB7XG4gICAgICBpZiAoaXNTdHJpbmcoYSkpIGEgPSBhLnNwbGl0KCcgJyk7XG4gICAgICBpZiAoaXNTdHJpbmcoYikpIGIgPSBiLnNwbGl0KCcgJyk7XG4gICAgICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHJldHVybiBiLmluZGV4T2YodmFsKSA9PT0gLTE7XG4gICAgICB9KS5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUFuY2hvcmVkQW5pbWF0aW9uKGNsYXNzZXMsIG91dEFuY2hvciwgaW5BbmNob3IpIHtcbiAgICAgIHZhciBjbG9uZSA9IGpxTGl0ZShnZXREb21Ob2RlKG91dEFuY2hvcikuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgIHZhciBzdGFydGluZ0NsYXNzZXMgPSBmaWx0ZXJDc3NDbGFzc2VzKGdldENsYXNzVmFsKGNsb25lKSk7XG5cbiAgICAgIG91dEFuY2hvci5hZGRDbGFzcyhOR19BTklNQVRFX1NISU1fQ0xBU1NfTkFNRSk7XG4gICAgICBpbkFuY2hvci5hZGRDbGFzcyhOR19BTklNQVRFX1NISU1fQ0xBU1NfTkFNRSk7XG5cbiAgICAgIGNsb25lLmFkZENsYXNzKE5HX0FOSU1BVEVfQU5DSE9SX0NMQVNTX05BTUUpO1xuXG4gICAgICByb290Qm9keUVsZW1lbnQuYXBwZW5kKGNsb25lKTtcblxuICAgICAgdmFyIGFuaW1hdG9ySW4sIGFuaW1hdG9yT3V0ID0gcHJlcGFyZU91dEFuaW1hdGlvbigpO1xuXG4gICAgICAvLyB0aGUgdXNlciBtYXkgbm90IGVuZCB1cCB1c2luZyB0aGUgYG91dGAgYW5pbWF0aW9uIGFuZFxuICAgICAgLy8gb25seSBtYWtpbmcgdXNlIG9mIHRoZSBgaW5gIGFuaW1hdGlvbiBvciB2aWNlLXZlcnNhLlxuICAgICAgLy8gSW4gZWl0aGVyIGNhc2Ugd2Ugc2hvdWxkIGFsbG93IHRoaXMgYW5kIG5vdCBhc3N1bWUgdGhlXG4gICAgICAvLyBhbmltYXRpb24gaXMgb3ZlciB1bmxlc3MgYm90aCBhbmltYXRpb25zIGFyZSBub3QgdXNlZC5cbiAgICAgIGlmICghYW5pbWF0b3JPdXQpIHtcbiAgICAgICAgYW5pbWF0b3JJbiA9IHByZXBhcmVJbkFuaW1hdGlvbigpO1xuICAgICAgICBpZiAoIWFuaW1hdG9ySW4pIHtcbiAgICAgICAgICByZXR1cm4gZW5kKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHN0YXJ0aW5nQW5pbWF0b3IgPSBhbmltYXRvck91dCB8fCBhbmltYXRvckluO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJ1bm5lcjtcblxuICAgICAgICAgIHZhciBjdXJyZW50QW5pbWF0aW9uID0gc3RhcnRpbmdBbmltYXRvci5zdGFydCgpO1xuICAgICAgICAgIGN1cnJlbnRBbmltYXRpb24uZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbmltYXRpb24gPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFhbmltYXRvckluKSB7XG4gICAgICAgICAgICAgIGFuaW1hdG9ySW4gPSBwcmVwYXJlSW5BbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgaWYgKGFuaW1hdG9ySW4pIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50QW5pbWF0aW9uID0gYW5pbWF0b3JJbi5zdGFydCgpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRBbmltYXRpb24uZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRBbmltYXRpb24gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgZW5kKCk7XG4gICAgICAgICAgICAgICAgICBydW5uZXIuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudEFuaW1hdGlvbjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gYGluYCBhbmltYXRpb25cbiAgICAgICAgICAgIGVuZCgpO1xuICAgICAgICAgICAgcnVubmVyLmNvbXBsZXRlKCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBydW5uZXIgPSBuZXcgJCRBbmltYXRlUnVubmVyKHtcbiAgICAgICAgICAgIGVuZDogZW5kRm4sXG4gICAgICAgICAgICBjYW5jZWw6IGVuZEZuXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gcnVubmVyO1xuXG4gICAgICAgICAgZnVuY3Rpb24gZW5kRm4oKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudEFuaW1hdGlvbikge1xuICAgICAgICAgICAgICBjdXJyZW50QW5pbWF0aW9uLmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlQW5jaG9yU3R5bGVzKGFuY2hvcikge1xuICAgICAgICB2YXIgc3R5bGVzID0ge307XG5cbiAgICAgICAgdmFyIGNvb3JkcyA9IGdldERvbU5vZGUoYW5jaG9yKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICAvLyB3ZSBpdGVyYXRlIGRpcmVjdGx5IHNpbmNlIHNhZmFyaSBtZXNzZXMgdXAgYW5kIGRvZXNuJ3QgcmV0dXJuXG4gICAgICAgIC8vIGFsbCB0aGUga2V5cyBmb3IgdGhlIGNvb3JkcyBvYmplY3Qgd2hlbiBpdGVyYXRlZFxuICAgICAgICBmb3JFYWNoKFsnd2lkdGgnLCdoZWlnaHQnLCd0b3AnLCdsZWZ0J10sIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGNvb3Jkc1trZXldO1xuICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgICAgICB2YWx1ZSArPSBib2R5Tm9kZS5zY3JvbGxUb3A7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICAgIHZhbHVlICs9IGJvZHlOb2RlLnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHlsZXNba2V5XSA9IE1hdGguZmxvb3IodmFsdWUpICsgJ3B4JztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdHlsZXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHByZXBhcmVPdXRBbmltYXRpb24oKSB7XG4gICAgICAgIHZhciBhbmltYXRvciA9ICRhbmltYXRlQ3NzKGNsb25lLCB7XG4gICAgICAgICAgYWRkQ2xhc3M6IE5HX09VVF9BTkNIT1JfQ0xBU1NfTkFNRSxcbiAgICAgICAgICBkZWxheTogdHJ1ZSxcbiAgICAgICAgICBmcm9tOiBjYWxjdWxhdGVBbmNob3JTdHlsZXMob3V0QW5jaG9yKVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZWFkIHRoZSBjb21tZW50IHdpdGhpbiBgcHJlcGFyZVJlZ3VsYXJBbmltYXRpb25gIHRvIHVuZGVyc3RhbmRcbiAgICAgICAgLy8gd2h5IHRoaXMgY2hlY2sgaXMgbmVjZXNzYXJ5XG4gICAgICAgIHJldHVybiBhbmltYXRvci4kJHdpbGxBbmltYXRlID8gYW5pbWF0b3IgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRDbGFzc1ZhbChlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmF0dHIoJ2NsYXNzJykgfHwgJyc7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHByZXBhcmVJbkFuaW1hdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZGluZ0NsYXNzZXMgPSBmaWx0ZXJDc3NDbGFzc2VzKGdldENsYXNzVmFsKGluQW5jaG9yKSk7XG4gICAgICAgIHZhciB0b0FkZCA9IGdldFVuaXF1ZVZhbHVlcyhlbmRpbmdDbGFzc2VzLCBzdGFydGluZ0NsYXNzZXMpO1xuICAgICAgICB2YXIgdG9SZW1vdmUgPSBnZXRVbmlxdWVWYWx1ZXMoc3RhcnRpbmdDbGFzc2VzLCBlbmRpbmdDbGFzc2VzKTtcblxuICAgICAgICB2YXIgYW5pbWF0b3IgPSAkYW5pbWF0ZUNzcyhjbG9uZSwge1xuICAgICAgICAgIHRvOiBjYWxjdWxhdGVBbmNob3JTdHlsZXMoaW5BbmNob3IpLFxuICAgICAgICAgIGFkZENsYXNzOiBOR19JTl9BTkNIT1JfQ0xBU1NfTkFNRSArICcgJyArIHRvQWRkLFxuICAgICAgICAgIHJlbW92ZUNsYXNzOiBOR19PVVRfQU5DSE9SX0NMQVNTX05BTUUgKyAnICcgKyB0b1JlbW92ZSxcbiAgICAgICAgICBkZWxheTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZWFkIHRoZSBjb21tZW50IHdpdGhpbiBgcHJlcGFyZVJlZ3VsYXJBbmltYXRpb25gIHRvIHVuZGVyc3RhbmRcbiAgICAgICAgLy8gd2h5IHRoaXMgY2hlY2sgaXMgbmVjZXNzYXJ5XG4gICAgICAgIHJldHVybiBhbmltYXRvci4kJHdpbGxBbmltYXRlID8gYW5pbWF0b3IgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBlbmQoKSB7XG4gICAgICAgIGNsb25lLnJlbW92ZSgpO1xuICAgICAgICBvdXRBbmNob3IucmVtb3ZlQ2xhc3MoTkdfQU5JTUFURV9TSElNX0NMQVNTX05BTUUpO1xuICAgICAgICBpbkFuY2hvci5yZW1vdmVDbGFzcyhOR19BTklNQVRFX1NISU1fQ0xBU1NfTkFNRSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUZyb21Ub0FuY2hvckFuaW1hdGlvbihmcm9tLCB0bywgY2xhc3NlcywgYW5jaG9ycykge1xuICAgICAgdmFyIGZyb21BbmltYXRpb24gPSBwcmVwYXJlUmVndWxhckFuaW1hdGlvbihmcm9tLCBub29wKTtcbiAgICAgIHZhciB0b0FuaW1hdGlvbiA9IHByZXBhcmVSZWd1bGFyQW5pbWF0aW9uKHRvLCBub29wKTtcblxuICAgICAgdmFyIGFuY2hvckFuaW1hdGlvbnMgPSBbXTtcbiAgICAgIGZvckVhY2goYW5jaG9ycywgZnVuY3Rpb24oYW5jaG9yKSB7XG4gICAgICAgIHZhciBvdXRFbGVtZW50ID0gYW5jaG9yWydvdXQnXTtcbiAgICAgICAgdmFyIGluRWxlbWVudCA9IGFuY2hvclsnaW4nXTtcbiAgICAgICAgdmFyIGFuaW1hdG9yID0gcHJlcGFyZUFuY2hvcmVkQW5pbWF0aW9uKGNsYXNzZXMsIG91dEVsZW1lbnQsIGluRWxlbWVudCk7XG4gICAgICAgIGlmIChhbmltYXRvcikge1xuICAgICAgICAgIGFuY2hvckFuaW1hdGlvbnMucHVzaChhbmltYXRvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBubyBwb2ludCBpbiBkb2luZyBhbnl0aGluZyB3aGVuIHRoZXJlIGFyZSBubyBlbGVtZW50cyB0byBhbmltYXRlXG4gICAgICBpZiAoIWZyb21BbmltYXRpb24gJiYgIXRvQW5pbWF0aW9uICYmIGFuY2hvckFuaW1hdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYW5pbWF0aW9uUnVubmVycyA9IFtdO1xuXG4gICAgICAgICAgaWYgKGZyb21BbmltYXRpb24pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvblJ1bm5lcnMucHVzaChmcm9tQW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0b0FuaW1hdGlvbikge1xuICAgICAgICAgICAgYW5pbWF0aW9uUnVubmVycy5wdXNoKHRvQW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvckVhY2goYW5jaG9yQW5pbWF0aW9ucywgZnVuY3Rpb24oYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICBhbmltYXRpb25SdW5uZXJzLnB1c2goYW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIoe1xuICAgICAgICAgICAgZW5kOiBlbmRGbixcbiAgICAgICAgICAgIGNhbmNlbDogZW5kRm4gLy8gQ1NTLWRyaXZlbiBhbmltYXRpb25zIGNhbm5vdCBiZSBjYW5jZWxsZWQsIG9ubHkgZW5kZWRcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgICQkQW5pbWF0ZVJ1bm5lci5hbGwoYW5pbWF0aW9uUnVubmVycywgZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICBydW5uZXIuY29tcGxldGUoc3RhdHVzKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBydW5uZXI7XG5cbiAgICAgICAgICBmdW5jdGlvbiBlbmRGbigpIHtcbiAgICAgICAgICAgIGZvckVhY2goYW5pbWF0aW9uUnVubmVycywgZnVuY3Rpb24ocnVubmVyKSB7XG4gICAgICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlUmVndWxhckFuaW1hdGlvbihhbmltYXRpb25EZXRhaWxzKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IGFuaW1hdGlvbkRldGFpbHMuZWxlbWVudDtcbiAgICAgIHZhciBvcHRpb25zID0gYW5pbWF0aW9uRGV0YWlscy5vcHRpb25zIHx8IHt9O1xuXG4gICAgICBpZiAoYW5pbWF0aW9uRGV0YWlscy5zdHJ1Y3R1cmFsKSB7XG4gICAgICAgIG9wdGlvbnMuZXZlbnQgPSBhbmltYXRpb25EZXRhaWxzLmV2ZW50O1xuICAgICAgICBvcHRpb25zLnN0cnVjdHVyYWwgPSB0cnVlO1xuICAgICAgICBvcHRpb25zLmFwcGx5Q2xhc3Nlc0Vhcmx5ID0gdHJ1ZTtcblxuICAgICAgICAvLyB3ZSBzcGVjaWFsIGNhc2UgdGhlIGxlYXZlIGFuaW1hdGlvbiBzaW5jZSB3ZSB3YW50IHRvIGVuc3VyZSB0aGF0XG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIHJlbW92ZWQgYXMgc29vbiBhcyB0aGUgYW5pbWF0aW9uIGlzIG92ZXIuIE90aGVyd2lzZVxuICAgICAgICAvLyBhIGZsaWNrZXIgbWlnaHQgYXBwZWFyIG9yIHRoZSBlbGVtZW50IG1heSBub3QgYmUgcmVtb3ZlZCBhdCBhbGxcbiAgICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMuZXZlbnQgPT09ICdsZWF2ZScpIHtcbiAgICAgICAgICBvcHRpb25zLm9uRG9uZSA9IG9wdGlvbnMuZG9tT3BlcmF0aW9uO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGFzc2lnbiB0aGUgcHJlcGFyYXRpb25DbGFzc2VzIGFzIHRoZSBhY3R1YWwgYW5pbWF0aW9uIGV2ZW50IHNpbmNlXG4gICAgICAvLyB0aGUgaW50ZXJuYWxzIG9mICRhbmltYXRlQ3NzIHdpbGwganVzdCBzdWZmaXggdGhlIGV2ZW50IHRva2VuIHZhbHVlc1xuICAgICAgLy8gd2l0aCBgLWFjdGl2ZWAgdG8gdHJpZ2dlciB0aGUgYW5pbWF0aW9uLlxuICAgICAgaWYgKG9wdGlvbnMucHJlcGFyYXRpb25DbGFzc2VzKSB7XG4gICAgICAgIG9wdGlvbnMuZXZlbnQgPSBjb25jYXRXaXRoU3BhY2Uob3B0aW9ucy5ldmVudCwgb3B0aW9ucy5wcmVwYXJhdGlvbkNsYXNzZXMpO1xuICAgICAgfVxuXG4gICAgICB2YXIgYW5pbWF0b3IgPSAkYW5pbWF0ZUNzcyhlbGVtZW50LCBvcHRpb25zKTtcblxuICAgICAgLy8gdGhlIGRyaXZlciBsb29rdXAgY29kZSBpbnNpZGUgb2YgJCRhbmltYXRpb24gYXR0ZW1wdHMgdG8gc3Bhd24gYVxuICAgICAgLy8gZHJpdmVyIG9uZSBieSBvbmUgdW50aWwgYSBkcml2ZXIgcmV0dXJucyBhLiQkd2lsbEFuaW1hdGUgYW5pbWF0b3Igb2JqZWN0LlxuICAgICAgLy8gJGFuaW1hdGVDc3Mgd2lsbCBhbHdheXMgcmV0dXJuIGFuIG9iamVjdCwgaG93ZXZlciwgaXQgd2lsbCBwYXNzIGluXG4gICAgICAvLyBhIGZsYWcgYXMgYSBoaW50IGFzIHRvIHdoZXRoZXIgYW4gYW5pbWF0aW9uIHdhcyBkZXRlY3RlZCBvciBub3RcbiAgICAgIHJldHVybiBhbmltYXRvci4kJHdpbGxBbmltYXRlID8gYW5pbWF0b3IgOiBudWxsO1xuICAgIH1cbiAgfV07XG59XTtcblxuLy8gVE9ETyhtYXRza28pOiB1c2UgY2FjaGluZyBoZXJlIHRvIHNwZWVkIHRoaW5ncyB1cCBmb3IgZGV0ZWN0aW9uXG4vLyBUT0RPKG1hdHNrbyk6IGFkZCBkb2N1bWVudGF0aW9uXG4vLyAgYnkgdGhlIHRpbWUuLi5cblxudmFyICQkQW5pbWF0ZUpzUHJvdmlkZXIgPSBbJyRhbmltYXRlUHJvdmlkZXInLCBmdW5jdGlvbigkYW5pbWF0ZVByb3ZpZGVyKSB7XG4gIHRoaXMuJGdldCA9IFsnJGluamVjdG9yJywgJyQkQW5pbWF0ZVJ1bm5lcicsICckJGpxTGl0ZScsXG4gICAgICAgZnVuY3Rpb24oJGluamVjdG9yLCAgICQkQW5pbWF0ZVJ1bm5lciwgICAkJGpxTGl0ZSkge1xuXG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuICAgICAgICAgLy8gJGFuaW1hdGVKcyhlbGVtZW50LCAnZW50ZXInKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCwgZXZlbnQsIGNsYXNzZXMsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBhbmltYXRpb25DbG9zZWQgPSBmYWxzZTtcblxuICAgICAgLy8gdGhlIGBjbGFzc2VzYCBhcmd1bWVudCBpcyBvcHRpb25hbCBhbmQgaWYgaXQgaXMgbm90IHVzZWRcbiAgICAgIC8vIHRoZW4gdGhlIGNsYXNzZXMgd2lsbCBiZSByZXNvbHZlZCBmcm9tIHRoZSBlbGVtZW50J3MgY2xhc3NOYW1lXG4gICAgICAvLyBwcm9wZXJ0eSBhcyB3ZWxsIGFzIG9wdGlvbnMuYWRkQ2xhc3Mvb3B0aW9ucy5yZW1vdmVDbGFzcy5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIGlzT2JqZWN0KGNsYXNzZXMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSBjbGFzc2VzO1xuICAgICAgICBjbGFzc2VzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHByZXBhcmVBbmltYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuICAgICAgaWYgKCFjbGFzc2VzKSB7XG4gICAgICAgIGNsYXNzZXMgPSBlbGVtZW50LmF0dHIoJ2NsYXNzJykgfHwgJyc7XG4gICAgICAgIGlmIChvcHRpb25zLmFkZENsYXNzKSB7XG4gICAgICAgICAgY2xhc3NlcyArPSAnICcgKyBvcHRpb25zLmFkZENsYXNzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnJlbW92ZUNsYXNzKSB7XG4gICAgICAgICAgY2xhc3NlcyArPSAnICcgKyBvcHRpb25zLnJlbW92ZUNsYXNzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBjbGFzc2VzVG9BZGQgPSBvcHRpb25zLmFkZENsYXNzO1xuICAgICAgdmFyIGNsYXNzZXNUb1JlbW92ZSA9IG9wdGlvbnMucmVtb3ZlQ2xhc3M7XG5cbiAgICAgIC8vIHRoZSBsb29rdXBBbmltYXRpb25zIGZ1bmN0aW9uIHJldHVybnMgYSBzZXJpZXMgb2YgYW5pbWF0aW9uIG9iamVjdHMgdGhhdCBhcmVcbiAgICAgIC8vIG1hdGNoZWQgdXAgd2l0aCBvbmUgb3IgbW9yZSBvZiB0aGUgQ1NTIGNsYXNzZXMuIFRoZXNlIGFuaW1hdGlvbiBvYmplY3RzIGFyZVxuICAgICAgLy8gZGVmaW5lZCB2aWEgdGhlIG1vZHVsZS5hbmltYXRpb24gZmFjdG9yeSBmdW5jdGlvbi4gSWYgbm90aGluZyBpcyBkZXRlY3RlZCB0aGVuXG4gICAgICAvLyB3ZSBkb24ndCByZXR1cm4gYW55dGhpbmcgd2hpY2ggdGhlbiBtYWtlcyAkYW5pbWF0aW9uIHF1ZXJ5IHRoZSBuZXh0IGRyaXZlci5cbiAgICAgIHZhciBhbmltYXRpb25zID0gbG9va3VwQW5pbWF0aW9ucyhjbGFzc2VzKTtcbiAgICAgIHZhciBiZWZvcmUsIGFmdGVyO1xuICAgICAgaWYgKGFuaW1hdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHZhciBhZnRlckZuLCBiZWZvcmVGbjtcbiAgICAgICAgaWYgKGV2ZW50ID09ICdsZWF2ZScpIHtcbiAgICAgICAgICBiZWZvcmVGbiA9ICdsZWF2ZSc7XG4gICAgICAgICAgYWZ0ZXJGbiA9ICdhZnRlckxlYXZlJzsgLy8gVE9ETyhtYXRza28pOiBnZXQgcmlkIG9mIHRoaXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiZWZvcmVGbiA9ICdiZWZvcmUnICsgZXZlbnQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBldmVudC5zdWJzdHIoMSk7XG4gICAgICAgICAgYWZ0ZXJGbiA9IGV2ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50ICE9PSAnZW50ZXInICYmIGV2ZW50ICE9PSAnbW92ZScpIHtcbiAgICAgICAgICBiZWZvcmUgPSBwYWNrYWdlQW5pbWF0aW9ucyhlbGVtZW50LCBldmVudCwgb3B0aW9ucywgYW5pbWF0aW9ucywgYmVmb3JlRm4pO1xuICAgICAgICB9XG4gICAgICAgIGFmdGVyICA9IHBhY2thZ2VBbmltYXRpb25zKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zLCBhbmltYXRpb25zLCBhZnRlckZuKTtcbiAgICAgIH1cblxuICAgICAgLy8gbm8gbWF0Y2hpbmcgYW5pbWF0aW9uc1xuICAgICAgaWYgKCFiZWZvcmUgJiYgIWFmdGVyKSByZXR1cm47XG5cbiAgICAgIGZ1bmN0aW9uIGFwcGx5T3B0aW9ucygpIHtcbiAgICAgICAgb3B0aW9ucy5kb21PcGVyYXRpb24oKTtcbiAgICAgICAgYXBwbHlBbmltYXRpb25DbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICAgICAgYW5pbWF0aW9uQ2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgYXBwbHlPcHRpb25zKCk7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcnVubmVyO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAkJHdpbGxBbmltYXRlOiB0cnVlLFxuICAgICAgICBlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChydW5uZXIpIHtcbiAgICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIoKTtcbiAgICAgICAgICAgIHJ1bm5lci5jb21wbGV0ZSh0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChydW5uZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5uZXI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcnVubmVyID0gbmV3ICQkQW5pbWF0ZVJ1bm5lcigpO1xuICAgICAgICAgIHZhciBjbG9zZUFjdGl2ZUFuaW1hdGlvbnM7XG4gICAgICAgICAgdmFyIGNoYWluID0gW107XG5cbiAgICAgICAgICBpZiAoYmVmb3JlKSB7XG4gICAgICAgICAgICBjaGFpbi5wdXNoKGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgIGNsb3NlQWN0aXZlQW5pbWF0aW9ucyA9IGJlZm9yZShmbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2hhaW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGFpbi5wdXNoKGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgIGFwcGx5T3B0aW9ucygpO1xuICAgICAgICAgICAgICBmbih0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBseU9wdGlvbnMoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYWZ0ZXIpIHtcbiAgICAgICAgICAgIGNoYWluLnB1c2goZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgY2xvc2VBY3RpdmVBbmltYXRpb25zID0gYWZ0ZXIoZm4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcnVubmVyLnNldEhvc3Qoe1xuICAgICAgICAgICAgZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgZW5kQW5pbWF0aW9ucygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGVuZEFuaW1hdGlvbnModHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAkJEFuaW1hdGVSdW5uZXIuY2hhaW4oY2hhaW4sIG9uQ29tcGxldGUpO1xuICAgICAgICAgIHJldHVybiBydW5uZXI7XG5cbiAgICAgICAgICBmdW5jdGlvbiBvbkNvbXBsZXRlKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGNsb3NlKHN1Y2Nlc3MpO1xuICAgICAgICAgICAgcnVubmVyLmNvbXBsZXRlKHN1Y2Nlc3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGVuZEFuaW1hdGlvbnMoY2FuY2VsbGVkKSB7XG4gICAgICAgICAgICBpZiAoIWFuaW1hdGlvbkNsb3NlZCkge1xuICAgICAgICAgICAgICAoY2xvc2VBY3RpdmVBbmltYXRpb25zIHx8IG5vb3ApKGNhbmNlbGxlZCk7XG4gICAgICAgICAgICAgIG9uQ29tcGxldGUoY2FuY2VsbGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGV4ZWN1dGVBbmltYXRpb25GbihmbiwgZWxlbWVudCwgZXZlbnQsIG9wdGlvbnMsIG9uRG9uZSkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgc3dpdGNoIChldmVudCkge1xuICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxuICAgICAgICAgICAgYXJncyA9IFtlbGVtZW50LCBvcHRpb25zLmZyb20sIG9wdGlvbnMudG8sIG9uRG9uZV07XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ3NldENsYXNzJzpcbiAgICAgICAgICAgIGFyZ3MgPSBbZWxlbWVudCwgY2xhc3Nlc1RvQWRkLCBjbGFzc2VzVG9SZW1vdmUsIG9uRG9uZV07XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2FkZENsYXNzJzpcbiAgICAgICAgICAgIGFyZ3MgPSBbZWxlbWVudCwgY2xhc3Nlc1RvQWRkLCBvbkRvbmVdO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdyZW1vdmVDbGFzcyc6XG4gICAgICAgICAgICBhcmdzID0gW2VsZW1lbnQsIGNsYXNzZXNUb1JlbW92ZSwgb25Eb25lXTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGFyZ3MgPSBbZWxlbWVudCwgb25Eb25lXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncy5wdXNoKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciB2YWx1ZSA9IGZuLmFwcGx5KGZuLCBhcmdzKTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUuc3RhcnQpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN0YXJ0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgJCRBbmltYXRlUnVubmVyKSB7XG4gICAgICAgICAgICB2YWx1ZS5kb25lKG9uRG9uZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gb3B0aW9uYWwgb25FbmQgLyBvbkNhbmNlbCBjYWxsYmFja1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub29wO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBncm91cEV2ZW50ZWRBbmltYXRpb25zKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zLCBhbmltYXRpb25zLCBmbk5hbWUpIHtcbiAgICAgICAgdmFyIG9wZXJhdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yRWFjaChhbmltYXRpb25zLCBmdW5jdGlvbihhbmkpIHtcbiAgICAgICAgICB2YXIgYW5pbWF0aW9uID0gYW5pW2ZuTmFtZV07XG4gICAgICAgICAgaWYgKCFhbmltYXRpb24pIHJldHVybjtcblxuICAgICAgICAgIC8vIG5vdGUgdGhhdCBhbGwgb2YgdGhlc2UgYW5pbWF0aW9ucyB3aWxsIHJ1biBpbiBwYXJhbGxlbFxuICAgICAgICAgIG9wZXJhdGlvbnMucHVzaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBydW5uZXI7XG4gICAgICAgICAgICB2YXIgZW5kUHJvZ3Jlc3NDYjtcblxuICAgICAgICAgICAgdmFyIHJlc29sdmVkID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgb25BbmltYXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgIGlmICghcmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgKGVuZFByb2dyZXNzQ2IgfHwgbm9vcCkocmVqZWN0ZWQpO1xuICAgICAgICAgICAgICAgIHJ1bm5lci5jb21wbGV0ZSghcmVqZWN0ZWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBydW5uZXIgPSBuZXcgJCRBbmltYXRlUnVubmVyKHtcbiAgICAgICAgICAgICAgZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBvbkFuaW1hdGlvbkNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb25BbmltYXRpb25Db21wbGV0ZSh0cnVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVuZFByb2dyZXNzQ2IgPSBleGVjdXRlQW5pbWF0aW9uRm4oYW5pbWF0aW9uLCBlbGVtZW50LCBldmVudCwgb3B0aW9ucywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICAgIHZhciBjYW5jZWxsZWQgPSByZXN1bHQgPT09IGZhbHNlO1xuICAgICAgICAgICAgICBvbkFuaW1hdGlvbkNvbXBsZXRlKGNhbmNlbGxlZCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG9wZXJhdGlvbnM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHBhY2thZ2VBbmltYXRpb25zKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zLCBhbmltYXRpb25zLCBmbk5hbWUpIHtcbiAgICAgICAgdmFyIG9wZXJhdGlvbnMgPSBncm91cEV2ZW50ZWRBbmltYXRpb25zKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zLCBhbmltYXRpb25zLCBmbk5hbWUpO1xuICAgICAgICBpZiAob3BlcmF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB2YXIgYSxiO1xuICAgICAgICAgIGlmIChmbk5hbWUgPT09ICdiZWZvcmVTZXRDbGFzcycpIHtcbiAgICAgICAgICAgIGEgPSBncm91cEV2ZW50ZWRBbmltYXRpb25zKGVsZW1lbnQsICdyZW1vdmVDbGFzcycsIG9wdGlvbnMsIGFuaW1hdGlvbnMsICdiZWZvcmVSZW1vdmVDbGFzcycpO1xuICAgICAgICAgICAgYiA9IGdyb3VwRXZlbnRlZEFuaW1hdGlvbnMoZWxlbWVudCwgJ2FkZENsYXNzJywgb3B0aW9ucywgYW5pbWF0aW9ucywgJ2JlZm9yZUFkZENsYXNzJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmbk5hbWUgPT09ICdzZXRDbGFzcycpIHtcbiAgICAgICAgICAgIGEgPSBncm91cEV2ZW50ZWRBbmltYXRpb25zKGVsZW1lbnQsICdyZW1vdmVDbGFzcycsIG9wdGlvbnMsIGFuaW1hdGlvbnMsICdyZW1vdmVDbGFzcycpO1xuICAgICAgICAgICAgYiA9IGdyb3VwRXZlbnRlZEFuaW1hdGlvbnMoZWxlbWVudCwgJ2FkZENsYXNzJywgb3B0aW9ucywgYW5pbWF0aW9ucywgJ2FkZENsYXNzJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgIG9wZXJhdGlvbnMgPSBvcGVyYXRpb25zLmNvbmNhdChhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGIpIHtcbiAgICAgICAgICAgIG9wZXJhdGlvbnMgPSBvcGVyYXRpb25zLmNvbmNhdChiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3BlcmF0aW9ucy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgICAgICAvLyBUT0RPKG1hdHNrbyk6IGFkZCBkb2N1bWVudGF0aW9uXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBzdGFydEFuaW1hdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgIHZhciBydW5uZXJzID0gW107XG4gICAgICAgICAgaWYgKG9wZXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3JFYWNoKG9wZXJhdGlvbnMsIGZ1bmN0aW9uKGFuaW1hdGVGbikge1xuICAgICAgICAgICAgICBydW5uZXJzLnB1c2goYW5pbWF0ZUZuKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcnVubmVycy5sZW5ndGggPyAkJEFuaW1hdGVSdW5uZXIuYWxsKHJ1bm5lcnMsIGNhbGxiYWNrKSA6IGNhbGxiYWNrKCk7XG5cbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gZW5kRm4ocmVqZWN0KSB7XG4gICAgICAgICAgICBmb3JFYWNoKHJ1bm5lcnMsIGZ1bmN0aW9uKHJ1bm5lcikge1xuICAgICAgICAgICAgICByZWplY3QgPyBydW5uZXIuY2FuY2VsKCkgOiBydW5uZXIuZW5kKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBsb29rdXBBbmltYXRpb25zKGNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBpc0FycmF5KGNsYXNzZXMpID8gY2xhc3NlcyA6IGNsYXNzZXMuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBtYXRjaGVzID0gW10sIGZsYWdNYXAgPSB7fTtcbiAgICAgIGZvciAodmFyIGk9MDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtsYXNzID0gY2xhc3Nlc1tpXSxcbiAgICAgICAgICAgIGFuaW1hdGlvbkZhY3RvcnkgPSAkYW5pbWF0ZVByb3ZpZGVyLiQkcmVnaXN0ZXJlZEFuaW1hdGlvbnNba2xhc3NdO1xuICAgICAgICBpZiAoYW5pbWF0aW9uRmFjdG9yeSAmJiAhZmxhZ01hcFtrbGFzc10pIHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goJGluamVjdG9yLmdldChhbmltYXRpb25GYWN0b3J5KSk7XG4gICAgICAgICAgZmxhZ01hcFtrbGFzc10gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9XG4gIH1dO1xufV07XG5cbnZhciAkJEFuaW1hdGVKc0RyaXZlclByb3ZpZGVyID0gWyckJGFuaW1hdGlvblByb3ZpZGVyJywgZnVuY3Rpb24oJCRhbmltYXRpb25Qcm92aWRlcikge1xuICAkJGFuaW1hdGlvblByb3ZpZGVyLmRyaXZlcnMucHVzaCgnJCRhbmltYXRlSnNEcml2ZXInKTtcbiAgdGhpcy4kZ2V0ID0gWyckJGFuaW1hdGVKcycsICckJEFuaW1hdGVSdW5uZXInLCBmdW5jdGlvbigkJGFuaW1hdGVKcywgJCRBbmltYXRlUnVubmVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGluaXREcml2ZXJGbihhbmltYXRpb25EZXRhaWxzKSB7XG4gICAgICBpZiAoYW5pbWF0aW9uRGV0YWlscy5mcm9tICYmIGFuaW1hdGlvbkRldGFpbHMudG8pIHtcbiAgICAgICAgdmFyIGZyb21BbmltYXRpb24gPSBwcmVwYXJlQW5pbWF0aW9uKGFuaW1hdGlvbkRldGFpbHMuZnJvbSk7XG4gICAgICAgIHZhciB0b0FuaW1hdGlvbiA9IHByZXBhcmVBbmltYXRpb24oYW5pbWF0aW9uRGV0YWlscy50byk7XG4gICAgICAgIGlmICghZnJvbUFuaW1hdGlvbiAmJiAhdG9BbmltYXRpb24pIHJldHVybjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhbmltYXRpb25SdW5uZXJzID0gW107XG5cbiAgICAgICAgICAgIGlmIChmcm9tQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgIGFuaW1hdGlvblJ1bm5lcnMucHVzaChmcm9tQW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodG9BbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgYW5pbWF0aW9uUnVubmVycy5wdXNoKHRvQW5pbWF0aW9uLnN0YXJ0KCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkJEFuaW1hdGVSdW5uZXIuYWxsKGFuaW1hdGlvblJ1bm5lcnMsIGRvbmUpO1xuXG4gICAgICAgICAgICB2YXIgcnVubmVyID0gbmV3ICQkQW5pbWF0ZVJ1bm5lcih7XG4gICAgICAgICAgICAgIGVuZDogZW5kRm5GYWN0b3J5KCksXG4gICAgICAgICAgICAgIGNhbmNlbDogZW5kRm5GYWN0b3J5KClcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcnVubmVyO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBlbmRGbkZhY3RvcnkoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBmb3JFYWNoKGFuaW1hdGlvblJ1bm5lcnMsIGZ1bmN0aW9uKHJ1bm5lcikge1xuICAgICAgICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCB3ZSBjYW5ub3QgY2FuY2VsIGFuaW1hdGlvbnMgZm9yIGdyb3VwcyBqdXN0IHlldC4gMS41K1xuICAgICAgICAgICAgICAgICAgcnVubmVyLmVuZCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBkb25lKHN0YXR1cykge1xuICAgICAgICAgICAgICBydW5uZXIuY29tcGxldGUoc3RhdHVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcHJlcGFyZUFuaW1hdGlvbihhbmltYXRpb25EZXRhaWxzKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcHJlcGFyZUFuaW1hdGlvbihhbmltYXRpb25EZXRhaWxzKSB7XG4gICAgICAvLyBUT0RPKG1hdHNrbyk6IG1ha2Ugc3VyZSB0byBjaGVjayBmb3IgZ3JvdXBlZCBhbmltYXRpb25zIGFuZCBkZWxlZ2F0ZSBkb3duIHRvIG5vcm1hbCBhbmltYXRpb25zXG4gICAgICB2YXIgZWxlbWVudCA9IGFuaW1hdGlvbkRldGFpbHMuZWxlbWVudDtcbiAgICAgIHZhciBldmVudCA9IGFuaW1hdGlvbkRldGFpbHMuZXZlbnQ7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFuaW1hdGlvbkRldGFpbHMub3B0aW9ucztcbiAgICAgIHZhciBjbGFzc2VzID0gYW5pbWF0aW9uRGV0YWlscy5jbGFzc2VzO1xuICAgICAgcmV0dXJuICQkYW5pbWF0ZUpzKGVsZW1lbnQsIGV2ZW50LCBjbGFzc2VzLCBvcHRpb25zKTtcbiAgICB9XG4gIH1dO1xufV07XG5cbnZhciBOR19BTklNQVRFX0FUVFJfTkFNRSA9ICdkYXRhLW5nLWFuaW1hdGUnO1xudmFyIE5HX0FOSU1BVEVfUElOX0RBVEEgPSAnJG5nQW5pbWF0ZVBpbic7XG52YXIgJCRBbmltYXRlUXVldWVQcm92aWRlciA9IFsnJGFuaW1hdGVQcm92aWRlcicsIGZ1bmN0aW9uKCRhbmltYXRlUHJvdmlkZXIpIHtcbiAgdmFyIFBSRV9ESUdFU1RfU1RBVEUgPSAxO1xuICB2YXIgUlVOTklOR19TVEFURSA9IDI7XG4gIHZhciBPTkVfU1BBQ0UgPSAnICc7XG5cbiAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlcyA9IHtcbiAgICBza2lwOiBbXSxcbiAgICBjYW5jZWw6IFtdLFxuICAgIGpvaW46IFtdXG4gIH07XG5cbiAgZnVuY3Rpb24gbWFrZVRydXRoeUNzc0NsYXNzTWFwKGNsYXNzU3RyaW5nKSB7XG4gICAgaWYgKCFjbGFzc1N0cmluZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSBjbGFzc1N0cmluZy5zcGxpdChPTkVfU1BBQ0UpO1xuICAgIHZhciBtYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIG1hcFtrZXldID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzTWF0Y2hpbmdDbGFzc2VzKG5ld0NsYXNzU3RyaW5nLCBjdXJyZW50Q2xhc3NTdHJpbmcpIHtcbiAgICBpZiAobmV3Q2xhc3NTdHJpbmcgJiYgY3VycmVudENsYXNzU3RyaW5nKSB7XG4gICAgICB2YXIgY3VycmVudENsYXNzTWFwID0gbWFrZVRydXRoeUNzc0NsYXNzTWFwKGN1cnJlbnRDbGFzc1N0cmluZyk7XG4gICAgICByZXR1cm4gbmV3Q2xhc3NTdHJpbmcuc3BsaXQoT05FX1NQQUNFKS5zb21lKGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICByZXR1cm4gY3VycmVudENsYXNzTWFwW2NsYXNzTmFtZV07XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc0FsbG93ZWQocnVsZVR5cGUsIGVsZW1lbnQsIGN1cnJlbnRBbmltYXRpb24sIHByZXZpb3VzQW5pbWF0aW9uKSB7XG4gICAgcmV0dXJuIHJ1bGVzW3J1bGVUeXBlXS5zb21lKGZ1bmN0aW9uKGZuKSB7XG4gICAgICByZXR1cm4gZm4oZWxlbWVudCwgY3VycmVudEFuaW1hdGlvbiwgcHJldmlvdXNBbmltYXRpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzQW5pbWF0aW9uQ2xhc3NlcyhhbmltYXRpb24sIGFuZCkge1xuICAgIHZhciBhID0gKGFuaW1hdGlvbi5hZGRDbGFzcyB8fCAnJykubGVuZ3RoID4gMDtcbiAgICB2YXIgYiA9IChhbmltYXRpb24ucmVtb3ZlQ2xhc3MgfHwgJycpLmxlbmd0aCA+IDA7XG4gICAgcmV0dXJuIGFuZCA/IGEgJiYgYiA6IGEgfHwgYjtcbiAgfVxuXG4gIHJ1bGVzLmpvaW4ucHVzaChmdW5jdGlvbihlbGVtZW50LCBuZXdBbmltYXRpb24sIGN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAvLyBpZiB0aGUgbmV3IGFuaW1hdGlvbiBpcyBjbGFzcy1iYXNlZCB0aGVuIHdlIGNhbiBqdXN0IHRhY2sgdGhhdCBvblxuICAgIHJldHVybiAhbmV3QW5pbWF0aW9uLnN0cnVjdHVyYWwgJiYgaGFzQW5pbWF0aW9uQ2xhc3NlcyhuZXdBbmltYXRpb24pO1xuICB9KTtcblxuICBydWxlcy5za2lwLnB1c2goZnVuY3Rpb24oZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBjdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBhbmltYXRlIGFueXRoaW5nIGlmIG5vIGNsYXNzZXMgYXJlIGJlaW5nIGFkZGVkIGFuZFxuICAgIC8vIHRoZXJlIGlzIG5vIHN0cnVjdHVyYWwgYW5pbWF0aW9uIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWRcbiAgICByZXR1cm4gIW5ld0FuaW1hdGlvbi5zdHJ1Y3R1cmFsICYmICFoYXNBbmltYXRpb25DbGFzc2VzKG5ld0FuaW1hdGlvbik7XG4gIH0pO1xuXG4gIHJ1bGVzLnNraXAucHVzaChmdW5jdGlvbihlbGVtZW50LCBuZXdBbmltYXRpb24sIGN1cnJlbnRBbmltYXRpb24pIHtcbiAgICAvLyB3aHkgc2hvdWxkIHdlIHRyaWdnZXIgYSBuZXcgc3RydWN0dXJhbCBhbmltYXRpb24gaWYgdGhlIGVsZW1lbnQgd2lsbFxuICAgIC8vIGJlIHJlbW92ZWQgZnJvbSB0aGUgRE9NIGFueXdheT9cbiAgICByZXR1cm4gY3VycmVudEFuaW1hdGlvbi5ldmVudCA9PSAnbGVhdmUnICYmIG5ld0FuaW1hdGlvbi5zdHJ1Y3R1cmFsO1xuICB9KTtcblxuICBydWxlcy5za2lwLnB1c2goZnVuY3Rpb24oZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBjdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgLy8gaWYgdGhlcmUgaXMgYW4gb25nb2luZyBjdXJyZW50IGFuaW1hdGlvbiB0aGVuIGRvbid0IGV2ZW4gYm90aGVyIHJ1bm5pbmcgdGhlIGNsYXNzLWJhc2VkIGFuaW1hdGlvblxuICAgIHJldHVybiBjdXJyZW50QW5pbWF0aW9uLnN0cnVjdHVyYWwgJiYgY3VycmVudEFuaW1hdGlvbi5zdGF0ZSA9PT0gUlVOTklOR19TVEFURSAmJiAhbmV3QW5pbWF0aW9uLnN0cnVjdHVyYWw7XG4gIH0pO1xuXG4gIHJ1bGVzLmNhbmNlbC5wdXNoKGZ1bmN0aW9uKGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgY3VycmVudEFuaW1hdGlvbikge1xuICAgIC8vIHRoZXJlIGNhbiBuZXZlciBiZSB0d28gc3RydWN0dXJhbCBhbmltYXRpb25zIHJ1bm5pbmcgYXQgdGhlIHNhbWUgdGltZVxuICAgIHJldHVybiBjdXJyZW50QW5pbWF0aW9uLnN0cnVjdHVyYWwgJiYgbmV3QW5pbWF0aW9uLnN0cnVjdHVyYWw7XG4gIH0pO1xuXG4gIHJ1bGVzLmNhbmNlbC5wdXNoKGZ1bmN0aW9uKGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgY3VycmVudEFuaW1hdGlvbikge1xuICAgIC8vIGlmIHRoZSBwcmV2aW91cyBhbmltYXRpb24gaXMgYWxyZWFkeSBydW5uaW5nLCBidXQgdGhlIG5ldyBhbmltYXRpb24gd2lsbFxuICAgIC8vIGJlIHRyaWdnZXJlZCwgYnV0IHRoZSBuZXcgYW5pbWF0aW9uIGlzIHN0cnVjdHVyYWxcbiAgICByZXR1cm4gY3VycmVudEFuaW1hdGlvbi5zdGF0ZSA9PT0gUlVOTklOR19TVEFURSAmJiBuZXdBbmltYXRpb24uc3RydWN0dXJhbDtcbiAgfSk7XG5cbiAgcnVsZXMuY2FuY2VsLnB1c2goZnVuY3Rpb24oZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBjdXJyZW50QW5pbWF0aW9uKSB7XG4gICAgdmFyIG5BID0gbmV3QW5pbWF0aW9uLmFkZENsYXNzO1xuICAgIHZhciBuUiA9IG5ld0FuaW1hdGlvbi5yZW1vdmVDbGFzcztcbiAgICB2YXIgY0EgPSBjdXJyZW50QW5pbWF0aW9uLmFkZENsYXNzO1xuICAgIHZhciBjUiA9IGN1cnJlbnRBbmltYXRpb24ucmVtb3ZlQ2xhc3M7XG5cbiAgICAvLyBlYXJseSBkZXRlY3Rpb24gdG8gc2F2ZSB0aGUgZ2xvYmFsIENQVSBzaG9ydGFnZSA6KVxuICAgIGlmICgoaXNVbmRlZmluZWQobkEpICYmIGlzVW5kZWZpbmVkKG5SKSkgfHwgKGlzVW5kZWZpbmVkKGNBKSAmJiBpc1VuZGVmaW5lZChjUikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhc01hdGNoaW5nQ2xhc3NlcyhuQSwgY1IpIHx8IGhhc01hdGNoaW5nQ2xhc3NlcyhuUiwgY0EpO1xuICB9KTtcblxuICB0aGlzLiRnZXQgPSBbJyQkckFGJywgJyRyb290U2NvcGUnLCAnJHJvb3RFbGVtZW50JywgJyRkb2N1bWVudCcsICckJEhhc2hNYXAnLFxuICAgICAgICAgICAgICAgJyQkYW5pbWF0aW9uJywgJyQkQW5pbWF0ZVJ1bm5lcicsICckdGVtcGxhdGVSZXF1ZXN0JywgJyQkanFMaXRlJywgJyQkZm9yY2VSZWZsb3cnLFxuICAgICAgIGZ1bmN0aW9uKCQkckFGLCAgICRyb290U2NvcGUsICAgJHJvb3RFbGVtZW50LCAgICRkb2N1bWVudCwgICAkJEhhc2hNYXAsXG4gICAgICAgICAgICAgICAgJCRhbmltYXRpb24sICAgJCRBbmltYXRlUnVubmVyLCAgICR0ZW1wbGF0ZVJlcXVlc3QsICAgJCRqcUxpdGUsICAgJCRmb3JjZVJlZmxvdykge1xuXG4gICAgdmFyIGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAgPSBuZXcgJCRIYXNoTWFwKCk7XG4gICAgdmFyIGRpc2FibGVkRWxlbWVudHNMb29rdXAgPSBuZXcgJCRIYXNoTWFwKCk7XG4gICAgdmFyIGFuaW1hdGlvbnNFbmFibGVkID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIHBvc3REaWdlc3RUYXNrRmFjdG9yeSgpIHtcbiAgICAgIHZhciBwb3N0RGlnZXN0Q2FsbGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgLy8gd2Ugb25seSBpc3N1ZSBhIGNhbGwgdG8gcG9zdERpZ2VzdCBiZWZvcmVcbiAgICAgICAgLy8gaXQgaGFzIGZpcnN0IHBhc3NlZC4gVGhpcyBwcmV2ZW50cyBhbnkgY2FsbGJhY2tzXG4gICAgICAgIC8vIGZyb20gbm90IGZpcmluZyBvbmNlIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZFxuICAgICAgICAvLyBzaW5jZSBpdCB3aWxsIGJlIG91dCBvZiB0aGUgZGlnZXN0IGN5Y2xlLlxuICAgICAgICBpZiAocG9zdERpZ2VzdENhbGxlZCkge1xuICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kJHBvc3REaWdlc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwb3N0RGlnZXN0Q2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gV2FpdCB1bnRpbCBhbGwgZGlyZWN0aXZlIGFuZCByb3V0ZS1yZWxhdGVkIHRlbXBsYXRlcyBhcmUgZG93bmxvYWRlZCBhbmRcbiAgICAvLyBjb21waWxlZC4gVGhlICR0ZW1wbGF0ZVJlcXVlc3QudG90YWxQZW5kaW5nUmVxdWVzdHMgdmFyaWFibGUga2VlcHMgdHJhY2sgb2ZcbiAgICAvLyBhbGwgb2YgdGhlIHJlbW90ZSB0ZW1wbGF0ZXMgYmVpbmcgY3VycmVudGx5IGRvd25sb2FkZWQuIElmIHRoZXJlIGFyZSBub1xuICAgIC8vIHRlbXBsYXRlcyBjdXJyZW50bHkgZG93bmxvYWRpbmcgdGhlbiB0aGUgd2F0Y2hlciB3aWxsIHN0aWxsIGZpcmUgYW55d2F5LlxuICAgIHZhciBkZXJlZ2lzdGVyV2F0Y2ggPSAkcm9vdFNjb3BlLiR3YXRjaChcbiAgICAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gJHRlbXBsYXRlUmVxdWVzdC50b3RhbFBlbmRpbmdSZXF1ZXN0cyA9PT0gMDsgfSxcbiAgICAgIGZ1bmN0aW9uKGlzRW1wdHkpIHtcbiAgICAgICAgaWYgKCFpc0VtcHR5KSByZXR1cm47XG4gICAgICAgIGRlcmVnaXN0ZXJXYXRjaCgpO1xuXG4gICAgICAgIC8vIE5vdyB0aGF0IGFsbCB0ZW1wbGF0ZXMgaGF2ZSBiZWVuIGRvd25sb2FkZWQsICRhbmltYXRlIHdpbGwgd2FpdCB1bnRpbFxuICAgICAgICAvLyB0aGUgcG9zdCBkaWdlc3QgcXVldWUgaXMgZW1wdHkgYmVmb3JlIGVuYWJsaW5nIGFuaW1hdGlvbnMuIEJ5IGhhdmluZyB0d29cbiAgICAgICAgLy8gY2FsbHMgdG8gJHBvc3REaWdlc3QgY2FsbHMgd2UgY2FuIGVuc3VyZSB0aGF0IHRoZSBmbGFnIGlzIGVuYWJsZWQgYXQgdGhlXG4gICAgICAgIC8vIHZlcnkgZW5kIG9mIHRoZSBwb3N0IGRpZ2VzdCBxdWV1ZS4gU2luY2UgYWxsIG9mIHRoZSBhbmltYXRpb25zIGluICRhbmltYXRlXG4gICAgICAgIC8vIHVzZSAkcG9zdERpZ2VzdCwgaXQncyBpbXBvcnRhbnQgdGhhdCB0aGUgY29kZSBiZWxvdyBleGVjdXRlcyBhdCB0aGUgZW5kLlxuICAgICAgICAvLyBUaGlzIGJhc2ljYWxseSBtZWFucyB0aGF0IHRoZSBwYWdlIGlzIGZ1bGx5IGRvd25sb2FkZWQgYW5kIGNvbXBpbGVkIGJlZm9yZVxuICAgICAgICAvLyBhbnkgYW5pbWF0aW9ucyBhcmUgdHJpZ2dlcmVkLlxuICAgICAgICAkcm9vdFNjb3BlLiQkcG9zdERpZ2VzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLiQkcG9zdERpZ2VzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHdlIGNoZWNrIGZvciBudWxsIGRpcmVjdGx5IGluIHRoZSBldmVudCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBhbHJlYWR5IGNhbGxlZFxuICAgICAgICAgICAgLy8gLmVuYWJsZWQoKSB3aXRoIHdoYXRldmVyIGFyZ3VtZW50cyB0aGF0IGl0IHByb3ZpZGVkIGl0IHdpdGhcbiAgICAgICAgICAgIGlmIChhbmltYXRpb25zRW5hYmxlZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICBhbmltYXRpb25zRW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB2YXIgY2FsbGJhY2tSZWdpc3RyeSA9IHt9O1xuXG4gICAgLy8gcmVtZW1iZXIgdGhhdCB0aGUgY2xhc3NOYW1lRmlsdGVyIGlzIHNldCBkdXJpbmcgdGhlIHByb3ZpZGVyL2NvbmZpZ1xuICAgIC8vIHN0YWdlIHRoZXJlZm9yZSB3ZSBjYW4gb3B0aW1pemUgaGVyZSBhbmQgc2V0dXAgYSBoZWxwZXIgZnVuY3Rpb25cbiAgICB2YXIgY2xhc3NOYW1lRmlsdGVyID0gJGFuaW1hdGVQcm92aWRlci5jbGFzc05hbWVGaWx0ZXIoKTtcbiAgICB2YXIgaXNBbmltYXRhYmxlQ2xhc3NOYW1lID0gIWNsYXNzTmFtZUZpbHRlclxuICAgICAgICAgICAgICA/IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgICA6IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWVGaWx0ZXIudGVzdChjbGFzc05hbWUpO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplQW5pbWF0aW9uRGV0YWlscyhlbGVtZW50LCBhbmltYXRpb24pIHtcbiAgICAgIHJldHVybiBtZXJnZUFuaW1hdGlvbkRldGFpbHMoZWxlbWVudCwgYW5pbWF0aW9uLCB7fSk7XG4gICAgfVxuXG4gICAgLy8gSUU5LTExIGhhcyBubyBtZXRob2QgXCJjb250YWluc1wiIGluIFNWRyBlbGVtZW50IGFuZCBpbiBOb2RlLnByb3RvdHlwZS4gQnVnICMxMDI1OS5cbiAgICB2YXIgY29udGFpbnMgPSBOb2RlLnByb3RvdHlwZS5jb250YWlucyB8fCBmdW5jdGlvbihhcmcpIHtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOiBmYWxzZVxuICAgICAgcmV0dXJuIHRoaXMgPT09IGFyZyB8fCAhISh0aGlzLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGFyZykgJiAxNik7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTogdHJ1ZVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBmaW5kQ2FsbGJhY2tzKHBhcmVudCwgZWxlbWVudCwgZXZlbnQpIHtcbiAgICAgIHZhciB0YXJnZXROb2RlID0gZ2V0RG9tTm9kZShlbGVtZW50KTtcbiAgICAgIHZhciB0YXJnZXRQYXJlbnROb2RlID0gZ2V0RG9tTm9kZShwYXJlbnQpO1xuXG4gICAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgICAgdmFyIGVudHJpZXMgPSBjYWxsYmFja1JlZ2lzdHJ5W2V2ZW50XTtcbiAgICAgIGlmIChlbnRyaWVzKSB7XG4gICAgICAgIGZvckVhY2goZW50cmllcywgZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgICBpZiAoY29udGFpbnMuY2FsbChlbnRyeS5ub2RlLCB0YXJnZXROb2RlKSkge1xuICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKGVudHJ5LmNhbGxiYWNrKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50ID09PSAnbGVhdmUnICYmIGNvbnRhaW5zLmNhbGwoZW50cnkubm9kZSwgdGFyZ2V0UGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgIG1hdGNoZXMucHVzaChlbnRyeS5jYWxsYmFjayk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9uOiBmdW5jdGlvbihldmVudCwgY29udGFpbmVyLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm9kZSA9IGV4dHJhY3RFbGVtZW50Tm9kZShjb250YWluZXIpO1xuICAgICAgICBjYWxsYmFja1JlZ2lzdHJ5W2V2ZW50XSA9IGNhbGxiYWNrUmVnaXN0cnlbZXZlbnRdIHx8IFtdO1xuICAgICAgICBjYWxsYmFja1JlZ2lzdHJ5W2V2ZW50XS5wdXNoKHtcbiAgICAgICAgICBub2RlOiBub2RlLFxuICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIG9mZjogZnVuY3Rpb24oZXZlbnQsIGNvbnRhaW5lciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGVudHJpZXMgPSBjYWxsYmFja1JlZ2lzdHJ5W2V2ZW50XTtcbiAgICAgICAgaWYgKCFlbnRyaWVzKSByZXR1cm47XG5cbiAgICAgICAgY2FsbGJhY2tSZWdpc3RyeVtldmVudF0gPSBhcmd1bWVudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgIDogZmlsdGVyRnJvbVJlZ2lzdHJ5KGVudHJpZXMsIGNvbnRhaW5lciwgY2FsbGJhY2spO1xuXG4gICAgICAgIGZ1bmN0aW9uIGZpbHRlckZyb21SZWdpc3RyeShsaXN0LCBtYXRjaENvbnRhaW5lciwgbWF0Y2hDYWxsYmFjaykge1xuICAgICAgICAgIHZhciBjb250YWluZXJOb2RlID0gZXh0cmFjdEVsZW1lbnROb2RlKG1hdGNoQ29udGFpbmVyKTtcbiAgICAgICAgICByZXR1cm4gbGlzdC5maWx0ZXIoZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgICAgIHZhciBpc01hdGNoID0gZW50cnkubm9kZSA9PT0gY29udGFpbmVyTm9kZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICghbWF0Y2hDYWxsYmFjayB8fCBlbnRyeS5jYWxsYmFjayA9PT0gbWF0Y2hDYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gIWlzTWF0Y2g7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHBpbjogZnVuY3Rpb24oZWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBhc3NlcnRBcmcoaXNFbGVtZW50KGVsZW1lbnQpLCAnZWxlbWVudCcsICdub3QgYW4gZWxlbWVudCcpO1xuICAgICAgICBhc3NlcnRBcmcoaXNFbGVtZW50KHBhcmVudEVsZW1lbnQpLCAncGFyZW50RWxlbWVudCcsICdub3QgYW4gZWxlbWVudCcpO1xuICAgICAgICBlbGVtZW50LmRhdGEoTkdfQU5JTUFURV9QSU5fREFUQSwgcGFyZW50RWxlbWVudCk7XG4gICAgICB9LFxuXG4gICAgICBwdXNoOiBmdW5jdGlvbihlbGVtZW50LCBldmVudCwgb3B0aW9ucywgZG9tT3BlcmF0aW9uKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBvcHRpb25zLmRvbU9wZXJhdGlvbiA9IGRvbU9wZXJhdGlvbjtcbiAgICAgICAgcmV0dXJuIHF1ZXVlQW5pbWF0aW9uKGVsZW1lbnQsIGV2ZW50LCBvcHRpb25zKTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIHRoaXMgbWV0aG9kIGhhcyBmb3VyIHNpZ25hdHVyZXM6XG4gICAgICAvLyAgKCkgLSBnbG9iYWwgZ2V0dGVyXG4gICAgICAvLyAgKGJvb2wpIC0gZ2xvYmFsIHNldHRlclxuICAgICAgLy8gIChlbGVtZW50KSAtIGVsZW1lbnQgZ2V0dGVyXG4gICAgICAvLyAgKGVsZW1lbnQsIGJvb2wpIC0gZWxlbWVudCBzZXR0ZXI8RjM3PlxuICAgICAgZW5hYmxlZDogZnVuY3Rpb24oZWxlbWVudCwgYm9vbCkge1xuICAgICAgICB2YXIgYXJnQ291bnQgPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChhcmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgIC8vICgpIC0gR2xvYmFsIGdldHRlclxuICAgICAgICAgIGJvb2wgPSAhIWFuaW1hdGlvbnNFbmFibGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoYXNFbGVtZW50ID0gaXNFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgICAgICAgaWYgKCFoYXNFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyAoYm9vbCkgLSBHbG9iYWwgc2V0dGVyXG4gICAgICAgICAgICBib29sID0gYW5pbWF0aW9uc0VuYWJsZWQgPSAhIWVsZW1lbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gZ2V0RG9tTm9kZShlbGVtZW50KTtcbiAgICAgICAgICAgIHZhciByZWNvcmRFeGlzdHMgPSBkaXNhYmxlZEVsZW1lbnRzTG9va3VwLmdldChub2RlKTtcblxuICAgICAgICAgICAgaWYgKGFyZ0NvdW50ID09PSAxKSB7XG4gICAgICAgICAgICAgIC8vIChlbGVtZW50KSAtIEVsZW1lbnQgZ2V0dGVyXG4gICAgICAgICAgICAgIGJvb2wgPSAhcmVjb3JkRXhpc3RzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gKGVsZW1lbnQsIGJvb2wpIC0gRWxlbWVudCBzZXR0ZXJcbiAgICAgICAgICAgICAgZGlzYWJsZWRFbGVtZW50c0xvb2t1cC5wdXQobm9kZSwgIWJvb2wpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBxdWV1ZUFuaW1hdGlvbihlbGVtZW50LCBldmVudCwgaW5pdGlhbE9wdGlvbnMpIHtcbiAgICAgIC8vIHdlIGFsd2F5cyBtYWtlIGEgY29weSBvZiB0aGUgb3B0aW9ucyBzaW5jZVxuICAgICAgLy8gdGhlcmUgc2hvdWxkIG5ldmVyIGJlIGFueSBzaWRlIGVmZmVjdHMgb25cbiAgICAgIC8vIHRoZSBpbnB1dCBkYXRhIHdoZW4gcnVubmluZyBgJGFuaW1hdGVDc3NgLlxuICAgICAgdmFyIG9wdGlvbnMgPSBjb3B5KGluaXRpYWxPcHRpb25zKTtcblxuICAgICAgdmFyIG5vZGUsIHBhcmVudDtcbiAgICAgIGVsZW1lbnQgPSBzdHJpcENvbW1lbnRzRnJvbUVsZW1lbnQoZWxlbWVudCk7XG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICBub2RlID0gZ2V0RG9tTm9kZShlbGVtZW50KTtcbiAgICAgICAgcGFyZW50ID0gZWxlbWVudC5wYXJlbnQoKTtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHByZXBhcmVBbmltYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAvLyB3ZSBjcmVhdGUgYSBmYWtlIHJ1bm5lciB3aXRoIGEgd29ya2luZyBwcm9taXNlLlxuICAgICAgLy8gVGhlc2UgbWV0aG9kcyB3aWxsIGJlY29tZSBhdmFpbGFibGUgYWZ0ZXIgdGhlIGRpZ2VzdCBoYXMgcGFzc2VkXG4gICAgICB2YXIgcnVubmVyID0gbmV3ICQkQW5pbWF0ZVJ1bm5lcigpO1xuXG4gICAgICAvLyB0aGlzIGlzIHVzZWQgdG8gdHJpZ2dlciBjYWxsYmFja3MgaW4gcG9zdERpZ2VzdCBtb2RlXG4gICAgICB2YXIgcnVuSW5OZXh0UG9zdERpZ2VzdE9yTm93ID0gcG9zdERpZ2VzdFRhc2tGYWN0b3J5KCk7XG5cbiAgICAgIGlmIChpc0FycmF5KG9wdGlvbnMuYWRkQ2xhc3MpKSB7XG4gICAgICAgIG9wdGlvbnMuYWRkQ2xhc3MgPSBvcHRpb25zLmFkZENsYXNzLmpvaW4oJyAnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuYWRkQ2xhc3MgJiYgIWlzU3RyaW5nKG9wdGlvbnMuYWRkQ2xhc3MpKSB7XG4gICAgICAgIG9wdGlvbnMuYWRkQ2xhc3MgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNBcnJheShvcHRpb25zLnJlbW92ZUNsYXNzKSkge1xuICAgICAgICBvcHRpb25zLnJlbW92ZUNsYXNzID0gb3B0aW9ucy5yZW1vdmVDbGFzcy5qb2luKCcgJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnJlbW92ZUNsYXNzICYmICFpc1N0cmluZyhvcHRpb25zLnJlbW92ZUNsYXNzKSkge1xuICAgICAgICBvcHRpb25zLnJlbW92ZUNsYXNzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuZnJvbSAmJiAhaXNPYmplY3Qob3B0aW9ucy5mcm9tKSkge1xuICAgICAgICBvcHRpb25zLmZyb20gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy50byAmJiAhaXNPYmplY3Qob3B0aW9ucy50bykpIHtcbiAgICAgICAgb3B0aW9ucy50byA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIHRoZXJlIGFyZSBzaXR1YXRpb25zIHdoZXJlIGEgZGlyZWN0aXZlIGlzc3VlcyBhbiBhbmltYXRpb24gZm9yXG4gICAgICAvLyBhIGpxTGl0ZSB3cmFwcGVyIHRoYXQgY29udGFpbnMgb25seSBjb21tZW50IG5vZGVzLi4uIElmIHRoaXNcbiAgICAgIC8vIGhhcHBlbnMgdGhlbiB0aGVyZSBpcyBubyB3YXkgd2UgY2FuIHBlcmZvcm0gYW4gYW5pbWF0aW9uXG4gICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgIH1cblxuICAgICAgdmFyIGNsYXNzTmFtZSA9IFtub2RlLmNsYXNzTmFtZSwgb3B0aW9ucy5hZGRDbGFzcywgb3B0aW9ucy5yZW1vdmVDbGFzc10uam9pbignICcpO1xuICAgICAgaWYgKCFpc0FuaW1hdGFibGVDbGFzc05hbWUoY2xhc3NOYW1lKSkge1xuICAgICAgICBjbG9zZSgpO1xuICAgICAgICByZXR1cm4gcnVubmVyO1xuICAgICAgfVxuXG4gICAgICB2YXIgaXNTdHJ1Y3R1cmFsID0gWydlbnRlcicsICdtb3ZlJywgJ2xlYXZlJ10uaW5kZXhPZihldmVudCkgPj0gMDtcblxuICAgICAgLy8gdGhpcyBpcyBhIGhhcmQgZGlzYWJsZSBvZiBhbGwgYW5pbWF0aW9ucyBmb3IgdGhlIGFwcGxpY2F0aW9uIG9yIG9uXG4gICAgICAvLyB0aGUgZWxlbWVudCBpdHNlbGYsIHRoZXJlZm9yZSAgdGhlcmUgaXMgbm8gbmVlZCB0byBjb250aW51ZSBmdXJ0aGVyXG4gICAgICAvLyBwYXN0IHRoaXMgcG9pbnQgaWYgbm90IGVuYWJsZWRcbiAgICAgIC8vIEFuaW1hdGlvbnMgYXJlIGFsc28gZGlzYWJsZWQgaWYgdGhlIGRvY3VtZW50IGlzIGN1cnJlbnRseSBoaWRkZW4gKHBhZ2UgaXMgbm90IHZpc2libGVcbiAgICAgIC8vIHRvIHRoZSB1c2VyKSwgYmVjYXVzZSBicm93c2VycyBzbG93IGRvd24gb3IgZG8gbm90IGZsdXNoIGNhbGxzIHRvIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAgdmFyIHNraXBBbmltYXRpb25zID0gIWFuaW1hdGlvbnNFbmFibGVkIHx8ICRkb2N1bWVudFswXS5oaWRkZW4gfHwgZGlzYWJsZWRFbGVtZW50c0xvb2t1cC5nZXQobm9kZSk7XG4gICAgICB2YXIgZXhpc3RpbmdBbmltYXRpb24gPSAoIXNraXBBbmltYXRpb25zICYmIGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAuZ2V0KG5vZGUpKSB8fCB7fTtcbiAgICAgIHZhciBoYXNFeGlzdGluZ0FuaW1hdGlvbiA9ICEhZXhpc3RpbmdBbmltYXRpb24uc3RhdGU7XG5cbiAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHRyYXZlcnNpbmcgdGhlIHNhbWUgY29sbGVjdGlvbiBvZiBwYXJlbnQgYW5jZXN0b3JzIGlmIGEgZm9sbG93dXBcbiAgICAgIC8vIGFuaW1hdGlvbiB3aWxsIGJlIHJ1biBvbiB0aGUgc2FtZSBlbGVtZW50IHRoYXQgYWxyZWFkeSBkaWQgYWxsIHRoYXQgY2hlY2tpbmcgd29ya1xuICAgICAgaWYgKCFza2lwQW5pbWF0aW9ucyAmJiAoIWhhc0V4aXN0aW5nQW5pbWF0aW9uIHx8IGV4aXN0aW5nQW5pbWF0aW9uLnN0YXRlICE9IFBSRV9ESUdFU1RfU1RBVEUpKSB7XG4gICAgICAgIHNraXBBbmltYXRpb25zID0gIWFyZUFuaW1hdGlvbnNBbGxvd2VkKGVsZW1lbnQsIHBhcmVudCwgZXZlbnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2tpcEFuaW1hdGlvbnMpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzU3RydWN0dXJhbCkge1xuICAgICAgICBjbG9zZUNoaWxkQW5pbWF0aW9ucyhlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld0FuaW1hdGlvbiA9IHtcbiAgICAgICAgc3RydWN0dXJhbDogaXNTdHJ1Y3R1cmFsLFxuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgIGFkZENsYXNzOiBvcHRpb25zLmFkZENsYXNzLFxuICAgICAgICByZW1vdmVDbGFzczogb3B0aW9ucy5yZW1vdmVDbGFzcyxcbiAgICAgICAgY2xvc2U6IGNsb3NlLFxuICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgICAgICBydW5uZXI6IHJ1bm5lclxuICAgICAgfTtcblxuICAgICAgaWYgKGhhc0V4aXN0aW5nQW5pbWF0aW9uKSB7XG4gICAgICAgIHZhciBza2lwQW5pbWF0aW9uRmxhZyA9IGlzQWxsb3dlZCgnc2tpcCcsIGVsZW1lbnQsIG5ld0FuaW1hdGlvbiwgZXhpc3RpbmdBbmltYXRpb24pO1xuICAgICAgICBpZiAoc2tpcEFuaW1hdGlvbkZsYWcpIHtcbiAgICAgICAgICBpZiAoZXhpc3RpbmdBbmltYXRpb24uc3RhdGUgPT09IFJVTk5JTkdfU1RBVEUpIHtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICByZXR1cm4gcnVubmVyO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXJnZUFuaW1hdGlvbkRldGFpbHMoZWxlbWVudCwgZXhpc3RpbmdBbmltYXRpb24sIG5ld0FuaW1hdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdBbmltYXRpb24ucnVubmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgY2FuY2VsQW5pbWF0aW9uRmxhZyA9IGlzQWxsb3dlZCgnY2FuY2VsJywgZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBleGlzdGluZ0FuaW1hdGlvbik7XG4gICAgICAgIGlmIChjYW5jZWxBbmltYXRpb25GbGFnKSB7XG4gICAgICAgICAgaWYgKGV4aXN0aW5nQW5pbWF0aW9uLnN0YXRlID09PSBSVU5OSU5HX1NUQVRFKSB7XG4gICAgICAgICAgICAvLyB0aGlzIHdpbGwgZW5kIHRoZSBhbmltYXRpb24gcmlnaHQgYXdheSBhbmQgaXQgaXMgc2FmZVxuICAgICAgICAgICAgLy8gdG8gZG8gc28gc2luY2UgdGhlIGFuaW1hdGlvbiBpcyBhbHJlYWR5IHJ1bm5pbmcgYW5kIHRoZVxuICAgICAgICAgICAgLy8gcnVubmVyIGNhbGxiYWNrIGNvZGUgd2lsbCBydW4gaW4gYXN5bmNcbiAgICAgICAgICAgIGV4aXN0aW5nQW5pbWF0aW9uLnJ1bm5lci5lbmQoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGV4aXN0aW5nQW5pbWF0aW9uLnN0cnVjdHVyYWwpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgYW5pbWF0aW9uIGlzIHF1ZXVlZCBpbnRvIGEgZGlnZXN0LCBidXRcbiAgICAgICAgICAgIC8vIGhhc24ndCBzdGFydGVkIHlldC4gVGhlcmVmb3JlIGl0IGlzIHNhZmUgdG8gcnVuIHRoZSBjbG9zZVxuICAgICAgICAgICAgLy8gbWV0aG9kIHdoaWNoIHdpbGwgY2FsbCB0aGUgcnVubmVyIG1ldGhvZHMgaW4gYXN5bmMuXG4gICAgICAgICAgICBleGlzdGluZ0FuaW1hdGlvbi5jbG9zZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGlzIHdpbGwgbWVyZ2UgdGhlIG5ldyBhbmltYXRpb24gb3B0aW9ucyBpbnRvIGV4aXN0aW5nIGFuaW1hdGlvbiBvcHRpb25zXG4gICAgICAgICAgICBtZXJnZUFuaW1hdGlvbkRldGFpbHMoZWxlbWVudCwgZXhpc3RpbmdBbmltYXRpb24sIG5ld0FuaW1hdGlvbik7XG5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ0FuaW1hdGlvbi5ydW5uZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGEgam9pbmVkIGFuaW1hdGlvbiBtZWFucyB0aGF0IHRoaXMgYW5pbWF0aW9uIHdpbGwgdGFrZSBvdmVyIHRoZSBleGlzdGluZyBvbmVcbiAgICAgICAgICAvLyBzbyBhbiBleGFtcGxlIHdvdWxkIGludm9sdmUgYSBsZWF2ZSBhbmltYXRpb24gdGFraW5nIG92ZXIgYW4gZW50ZXIuIFRoZW4gd2hlblxuICAgICAgICAgIC8vIHRoZSBwb3N0RGlnZXN0IGtpY2tzIGluIHRoZSBlbnRlciB3aWxsIGJlIGlnbm9yZWQuXG4gICAgICAgICAgdmFyIGpvaW5BbmltYXRpb25GbGFnID0gaXNBbGxvd2VkKCdqb2luJywgZWxlbWVudCwgbmV3QW5pbWF0aW9uLCBleGlzdGluZ0FuaW1hdGlvbik7XG4gICAgICAgICAgaWYgKGpvaW5BbmltYXRpb25GbGFnKSB7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdBbmltYXRpb24uc3RhdGUgPT09IFJVTk5JTkdfU1RBVEUpIHtcbiAgICAgICAgICAgICAgbm9ybWFsaXplQW5pbWF0aW9uRGV0YWlscyhlbGVtZW50LCBuZXdBbmltYXRpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXBwbHlHZW5lcmF0ZWRQcmVwYXJhdGlvbkNsYXNzZXMoZWxlbWVudCwgaXNTdHJ1Y3R1cmFsID8gZXZlbnQgOiBudWxsLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgICBldmVudCA9IG5ld0FuaW1hdGlvbi5ldmVudCA9IGV4aXN0aW5nQW5pbWF0aW9uLmV2ZW50O1xuICAgICAgICAgICAgICBvcHRpb25zID0gbWVyZ2VBbmltYXRpb25EZXRhaWxzKGVsZW1lbnQsIGV4aXN0aW5nQW5pbWF0aW9uLCBuZXdBbmltYXRpb24pO1xuXG4gICAgICAgICAgICAgIC8vd2UgcmV0dXJuIHRoZSBzYW1lIHJ1bm5lciBzaW5jZSBvbmx5IHRoZSBvcHRpb24gdmFsdWVzIG9mIHRoaXMgYW5pbWF0aW9uIHdpbGxcbiAgICAgICAgICAgICAgLy9iZSBmZWQgaW50byB0aGUgYGV4aXN0aW5nQW5pbWF0aW9uYC5cbiAgICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nQW5pbWF0aW9uLnJ1bm5lcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vcm1hbGl6YXRpb24gaW4gdGhpcyBjYXNlIG1lYW5zIHRoYXQgaXQgcmVtb3ZlcyByZWR1bmRhbnQgQ1NTIGNsYXNzZXMgdGhhdFxuICAgICAgICAvLyBhbHJlYWR5IGV4aXN0IChhZGRDbGFzcykgb3IgZG8gbm90IGV4aXN0IChyZW1vdmVDbGFzcykgb24gdGhlIGVsZW1lbnRcbiAgICAgICAgbm9ybWFsaXplQW5pbWF0aW9uRGV0YWlscyhlbGVtZW50LCBuZXdBbmltYXRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyB3aGVuIHRoZSBvcHRpb25zIGFyZSBtZXJnZWQgYW5kIGNsZWFuZWQgdXAgd2UgbWF5IGVuZCB1cCBub3QgaGF2aW5nIHRvIGRvXG4gICAgICAvLyBhbiBhbmltYXRpb24gYXQgYWxsLCB0aGVyZWZvcmUgd2Ugc2hvdWxkIGNoZWNrIHRoaXMgYmVmb3JlIGlzc3VpbmcgYSBwb3N0XG4gICAgICAvLyBkaWdlc3QgY2FsbGJhY2suIFN0cnVjdHVyYWwgYW5pbWF0aW9ucyB3aWxsIGFsd2F5cyBydW4gbm8gbWF0dGVyIHdoYXQuXG4gICAgICB2YXIgaXNWYWxpZEFuaW1hdGlvbiA9IG5ld0FuaW1hdGlvbi5zdHJ1Y3R1cmFsO1xuICAgICAgaWYgKCFpc1ZhbGlkQW5pbWF0aW9uKSB7XG4gICAgICAgIC8vIGFuaW1hdGUgKGZyb20vdG8pIGNhbiBiZSBxdWlja2x5IGNoZWNrZWQgZmlyc3QsIG90aGVyd2lzZSB3ZSBjaGVjayBpZiBhbnkgY2xhc3NlcyBhcmUgcHJlc2VudFxuICAgICAgICBpc1ZhbGlkQW5pbWF0aW9uID0gKG5ld0FuaW1hdGlvbi5ldmVudCA9PT0gJ2FuaW1hdGUnICYmIE9iamVjdC5rZXlzKG5ld0FuaW1hdGlvbi5vcHRpb25zLnRvIHx8IHt9KS5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IGhhc0FuaW1hdGlvbkNsYXNzZXMobmV3QW5pbWF0aW9uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc1ZhbGlkQW5pbWF0aW9uKSB7XG4gICAgICAgIGNsb3NlKCk7XG4gICAgICAgIGNsZWFyRWxlbWVudEFuaW1hdGlvblN0YXRlKGVsZW1lbnQpO1xuICAgICAgICByZXR1cm4gcnVubmVyO1xuICAgICAgfVxuXG4gICAgICAvLyB0aGUgY291bnRlciBrZWVwcyB0cmFjayBvZiBjYW5jZWxsZWQgYW5pbWF0aW9uc1xuICAgICAgdmFyIGNvdW50ZXIgPSAoZXhpc3RpbmdBbmltYXRpb24uY291bnRlciB8fCAwKSArIDE7XG4gICAgICBuZXdBbmltYXRpb24uY291bnRlciA9IGNvdW50ZXI7XG5cbiAgICAgIG1hcmtFbGVtZW50QW5pbWF0aW9uU3RhdGUoZWxlbWVudCwgUFJFX0RJR0VTVF9TVEFURSwgbmV3QW5pbWF0aW9uKTtcblxuICAgICAgJHJvb3RTY29wZS4kJHBvc3REaWdlc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhbmltYXRpb25EZXRhaWxzID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQobm9kZSk7XG4gICAgICAgIHZhciBhbmltYXRpb25DYW5jZWxsZWQgPSAhYW5pbWF0aW9uRGV0YWlscztcbiAgICAgICAgYW5pbWF0aW9uRGV0YWlscyA9IGFuaW1hdGlvbkRldGFpbHMgfHwge307XG5cbiAgICAgICAgLy8gaWYgYWRkQ2xhc3MvcmVtb3ZlQ2xhc3MgaXMgY2FsbGVkIGJlZm9yZSBzb21ldGhpbmcgbGlrZSBlbnRlciB0aGVuIHRoZVxuICAgICAgICAvLyByZWdpc3RlcmVkIHBhcmVudCBlbGVtZW50IG1heSBub3QgYmUgcHJlc2VudC4gVGhlIGNvZGUgYmVsb3cgd2lsbCBlbnN1cmVcbiAgICAgICAgLy8gdGhhdCBhIGZpbmFsIHZhbHVlIGZvciBwYXJlbnQgZWxlbWVudCBpcyBvYnRhaW5lZFxuICAgICAgICB2YXIgcGFyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50KCkgfHwgW107XG5cbiAgICAgICAgLy8gYW5pbWF0ZS9zdHJ1Y3R1cmFsL2NsYXNzLWJhc2VkIGFuaW1hdGlvbnMgYWxsIGhhdmUgcmVxdWlyZW1lbnRzLiBPdGhlcndpc2UgdGhlcmVcbiAgICAgICAgLy8gaXMgbm8gcG9pbnQgaW4gcGVyZm9ybWluZyBhbiBhbmltYXRpb24uIFRoZSBwYXJlbnQgbm9kZSBtdXN0IGFsc28gYmUgc2V0LlxuICAgICAgICB2YXIgaXNWYWxpZEFuaW1hdGlvbiA9IHBhcmVudEVsZW1lbnQubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoYW5pbWF0aW9uRGV0YWlscy5ldmVudCA9PT0gJ2FuaW1hdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBhbmltYXRpb25EZXRhaWxzLnN0cnVjdHVyYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IGhhc0FuaW1hdGlvbkNsYXNzZXMoYW5pbWF0aW9uRGV0YWlscykpO1xuXG4gICAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgcHJldmlvdXMgYW5pbWF0aW9uIHdhcyBjYW5jZWxsZWRcbiAgICAgICAgLy8gZXZlbiBpZiB0aGUgZm9sbG93LXVwIGFuaW1hdGlvbiBpcyB0aGUgc2FtZSBldmVudFxuICAgICAgICBpZiAoYW5pbWF0aW9uQ2FuY2VsbGVkIHx8IGFuaW1hdGlvbkRldGFpbHMuY291bnRlciAhPT0gY291bnRlciB8fCAhaXNWYWxpZEFuaW1hdGlvbikge1xuICAgICAgICAgIC8vIGlmIGFub3RoZXIgYW5pbWF0aW9uIGRpZCBub3QgdGFrZSBvdmVyIHRoZW4gd2UgbmVlZFxuICAgICAgICAgIC8vIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBkb21PcGVyYXRpb24gYW5kIG9wdGlvbnMgYXJlXG4gICAgICAgICAgLy8gaGFuZGxlZCBhY2NvcmRpbmdseVxuICAgICAgICAgIGlmIChhbmltYXRpb25DYW5jZWxsZWQpIHtcbiAgICAgICAgICAgIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyhlbGVtZW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGFwcGx5QW5pbWF0aW9uU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGlmIHRoZSBldmVudCBjaGFuZ2VkIGZyb20gc29tZXRoaW5nIGxpa2UgZW50ZXIgdG8gbGVhdmUgdGhlbiB3ZSBkb1xuICAgICAgICAgIC8vIGl0LCBvdGhlcndpc2UgaWYgaXQncyB0aGUgc2FtZSB0aGVuIHRoZSBlbmQgcmVzdWx0IHdpbGwgYmUgdGhlIHNhbWUgdG9vXG4gICAgICAgICAgaWYgKGFuaW1hdGlvbkNhbmNlbGxlZCB8fCAoaXNTdHJ1Y3R1cmFsICYmIGFuaW1hdGlvbkRldGFpbHMuZXZlbnQgIT09IGV2ZW50KSkge1xuICAgICAgICAgICAgb3B0aW9ucy5kb21PcGVyYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGUgZWxlbWVudCBhbmltYXRpb24gd2FzIG5vdCBjYW5jZWxsZWQgb3IgYSBmb2xsb3ctdXAgYW5pbWF0aW9uXG4gICAgICAgICAgLy8gaXNuJ3QgYWxsb3dlZCB0byBhbmltYXRlIGZyb20gaGVyZSB0aGVuIHdlIG5lZWQgdG8gY2xlYXIgdGhlIHN0YXRlIG9mIHRoZSBlbGVtZW50XG4gICAgICAgICAgLy8gc28gdGhhdCBhbnkgZnV0dXJlIGFuaW1hdGlvbnMgd29uJ3QgcmVhZCB0aGUgZXhwaXJlZCBhbmltYXRpb24gZGF0YS5cbiAgICAgICAgICBpZiAoIWlzVmFsaWRBbmltYXRpb24pIHtcbiAgICAgICAgICAgIGNsZWFyRWxlbWVudEFuaW1hdGlvblN0YXRlKGVsZW1lbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMgY29tYmluZWQgbXVsdGlwbGUgY2xhc3MgdG8gYWRkQ2xhc3MgLyByZW1vdmVDbGFzcyBpbnRvIGEgc2V0Q2xhc3MgZXZlbnRcbiAgICAgICAgLy8gc28gbG9uZyBhcyBhIHN0cnVjdHVyYWwgZXZlbnQgZGlkIG5vdCB0YWtlIG92ZXIgdGhlIGFuaW1hdGlvblxuICAgICAgICBldmVudCA9ICFhbmltYXRpb25EZXRhaWxzLnN0cnVjdHVyYWwgJiYgaGFzQW5pbWF0aW9uQ2xhc3NlcyhhbmltYXRpb25EZXRhaWxzLCB0cnVlKVxuICAgICAgICAgICAgPyAnc2V0Q2xhc3MnXG4gICAgICAgICAgICA6IGFuaW1hdGlvbkRldGFpbHMuZXZlbnQ7XG5cbiAgICAgICAgbWFya0VsZW1lbnRBbmltYXRpb25TdGF0ZShlbGVtZW50LCBSVU5OSU5HX1NUQVRFKTtcbiAgICAgICAgdmFyIHJlYWxSdW5uZXIgPSAkJGFuaW1hdGlvbihlbGVtZW50LCBldmVudCwgYW5pbWF0aW9uRGV0YWlscy5vcHRpb25zKTtcblxuICAgICAgICByZWFsUnVubmVyLmRvbmUoZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgY2xvc2UoIXN0YXR1cyk7XG4gICAgICAgICAgdmFyIGFuaW1hdGlvbkRldGFpbHMgPSBhY3RpdmVBbmltYXRpb25zTG9va3VwLmdldChub2RlKTtcbiAgICAgICAgICBpZiAoYW5pbWF0aW9uRGV0YWlscyAmJiBhbmltYXRpb25EZXRhaWxzLmNvdW50ZXIgPT09IGNvdW50ZXIpIHtcbiAgICAgICAgICAgIGNsZWFyRWxlbWVudEFuaW1hdGlvblN0YXRlKGdldERvbU5vZGUoZWxlbWVudCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBub3RpZnlQcm9ncmVzcyhydW5uZXIsIGV2ZW50LCAnY2xvc2UnLCB7fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHRoaXMgd2lsbCB1cGRhdGUgdGhlIHJ1bm5lcidzIGZsb3ctY29udHJvbCBldmVudHMgYmFzZWQgb25cbiAgICAgICAgLy8gdGhlIGByZWFsUnVubmVyYCBvYmplY3QuXG4gICAgICAgIHJ1bm5lci5zZXRIb3N0KHJlYWxSdW5uZXIpO1xuICAgICAgICBub3RpZnlQcm9ncmVzcyhydW5uZXIsIGV2ZW50LCAnc3RhcnQnLCB7fSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJ1bm5lcjtcblxuICAgICAgZnVuY3Rpb24gbm90aWZ5UHJvZ3Jlc3MocnVubmVyLCBldmVudCwgcGhhc2UsIGRhdGEpIHtcbiAgICAgICAgcnVuSW5OZXh0UG9zdERpZ2VzdE9yTm93KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBmaW5kQ2FsbGJhY2tzKHBhcmVudCwgZWxlbWVudCwgZXZlbnQpO1xuICAgICAgICAgIGlmIChjYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBkbyBub3Qgb3B0aW1pemUgdGhpcyBjYWxsIGhlcmUgdG8gUkFGIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIHdlIGRvbid0IGtub3cgaG93IGhlYXZ5IHRoZSBjYWxsYmFjayBjb2RlIGhlcmUgd2lsbFxuICAgICAgICAgICAgLy8gYmUgYW5kIGlmIHRoaXMgY29kZSBpcyBidWZmZXJlZCB0aGVuIHRoaXMgY2FuXG4gICAgICAgICAgICAvLyBsZWFkIHRvIGEgcGVyZm9ybWFuY2UgcmVncmVzc2lvbi5cbiAgICAgICAgICAgICQkckFGKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBmb3JFYWNoKGNhbGxiYWNrcywgZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlbGVtZW50LCBwaGFzZSwgZGF0YSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcnVubmVyLnByb2dyZXNzKGV2ZW50LCBwaGFzZSwgZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNsb3NlKHJlamVjdCkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgY2xlYXJHZW5lcmF0ZWRDbGFzc2VzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBhcHBseUFuaW1hdGlvbkNsYXNzZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBvcHRpb25zLmRvbU9wZXJhdGlvbigpO1xuICAgICAgICBydW5uZXIuY29tcGxldGUoIXJlamVjdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VDaGlsZEFuaW1hdGlvbnMoZWxlbWVudCkge1xuICAgICAgdmFyIG5vZGUgPSBnZXREb21Ob2RlKGVsZW1lbnQpO1xuICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKCdbJyArIE5HX0FOSU1BVEVfQVRUUl9OQU1FICsgJ10nKTtcbiAgICAgIGZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHBhcnNlSW50KGNoaWxkLmdldEF0dHJpYnV0ZShOR19BTklNQVRFX0FUVFJfTkFNRSkpO1xuICAgICAgICB2YXIgYW5pbWF0aW9uRGV0YWlscyA9IGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAuZ2V0KGNoaWxkKTtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkRldGFpbHMpIHtcbiAgICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIFJVTk5JTkdfU1RBVEU6XG4gICAgICAgICAgICAgIGFuaW1hdGlvbkRldGFpbHMucnVubmVyLmVuZCgpO1xuICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlIFBSRV9ESUdFU1RfU1RBVEU6XG4gICAgICAgICAgICAgIGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAucmVtb3ZlKGNoaWxkKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhckVsZW1lbnRBbmltYXRpb25TdGF0ZShlbGVtZW50KSB7XG4gICAgICB2YXIgbm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG4gICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShOR19BTklNQVRFX0FUVFJfTkFNRSk7XG4gICAgICBhY3RpdmVBbmltYXRpb25zTG9va3VwLnJlbW92ZShub2RlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc01hdGNoaW5nRWxlbWVudChub2RlT3JFbG1BLCBub2RlT3JFbG1CKSB7XG4gICAgICByZXR1cm4gZ2V0RG9tTm9kZShub2RlT3JFbG1BKSA9PT0gZ2V0RG9tTm9kZShub2RlT3JFbG1CKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGZuIHJldHVybnMgZmFsc2UgaWYgYW55IG9mIHRoZSBmb2xsb3dpbmcgaXMgdHJ1ZTpcbiAgICAgKiBhKSBhbmltYXRpb25zIG9uIGFueSBwYXJlbnQgZWxlbWVudCBhcmUgZGlzYWJsZWQsIGFuZCBhbmltYXRpb25zIG9uIHRoZSBlbGVtZW50IGFyZW4ndCBleHBsaWNpdGx5IGFsbG93ZWRcbiAgICAgKiBiKSBhIHBhcmVudCBlbGVtZW50IGhhcyBhbiBvbmdvaW5nIHN0cnVjdHVyYWwgYW5pbWF0aW9uLCBhbmQgYW5pbWF0ZUNoaWxkcmVuIGlzIGZhbHNlXG4gICAgICogYykgdGhlIGVsZW1lbnQgaXMgbm90IGEgY2hpbGQgb2YgdGhlIGJvZHlcbiAgICAgKiBkKSB0aGUgZWxlbWVudCBpcyBub3QgYSBjaGlsZCBvZiB0aGUgJHJvb3RFbGVtZW50XG4gICAgICovXG4gICAgZnVuY3Rpb24gYXJlQW5pbWF0aW9uc0FsbG93ZWQoZWxlbWVudCwgcGFyZW50RWxlbWVudCwgZXZlbnQpIHtcbiAgICAgIHZhciBib2R5RWxlbWVudCA9IGpxTGl0ZSgkZG9jdW1lbnRbMF0uYm9keSk7XG4gICAgICB2YXIgYm9keUVsZW1lbnREZXRlY3RlZCA9IGlzTWF0Y2hpbmdFbGVtZW50KGVsZW1lbnQsIGJvZHlFbGVtZW50KSB8fCBlbGVtZW50WzBdLm5vZGVOYW1lID09PSAnSFRNTCc7XG4gICAgICB2YXIgcm9vdEVsZW1lbnREZXRlY3RlZCA9IGlzTWF0Y2hpbmdFbGVtZW50KGVsZW1lbnQsICRyb290RWxlbWVudCk7XG4gICAgICB2YXIgcGFyZW50QW5pbWF0aW9uRGV0ZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHZhciBhbmltYXRlQ2hpbGRyZW47XG4gICAgICB2YXIgZWxlbWVudERpc2FibGVkID0gZGlzYWJsZWRFbGVtZW50c0xvb2t1cC5nZXQoZ2V0RG9tTm9kZShlbGVtZW50KSk7XG5cbiAgICAgIHZhciBwYXJlbnRIb3N0ID0ganFMaXRlLmRhdGEoZWxlbWVudFswXSwgTkdfQU5JTUFURV9QSU5fREFUQSk7XG4gICAgICBpZiAocGFyZW50SG9zdCkge1xuICAgICAgICBwYXJlbnRFbGVtZW50ID0gcGFyZW50SG9zdDtcbiAgICAgIH1cblxuICAgICAgcGFyZW50RWxlbWVudCA9IGdldERvbU5vZGUocGFyZW50RWxlbWVudCk7XG5cbiAgICAgIHdoaWxlIChwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGlmICghcm9vdEVsZW1lbnREZXRlY3RlZCkge1xuICAgICAgICAgIC8vIGFuZ3VsYXIgZG9lc24ndCB3YW50IHRvIGF0dGVtcHQgdG8gYW5pbWF0ZSBlbGVtZW50cyBvdXRzaWRlIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgIC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IHRoZSByb290RWxlbWVudCBpcyBhbiBhbmNlc3RvciBvZiB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICAgICAgcm9vdEVsZW1lbnREZXRlY3RlZCA9IGlzTWF0Y2hpbmdFbGVtZW50KHBhcmVudEVsZW1lbnQsICRyb290RWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyZW50RWxlbWVudC5ub2RlVHlwZSAhPT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgLy8gbm8gcG9pbnQgaW4gaW5zcGVjdGluZyB0aGUgI2RvY3VtZW50IGVsZW1lbnRcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZXRhaWxzID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQocGFyZW50RWxlbWVudCkgfHwge307XG4gICAgICAgIC8vIGVpdGhlciBhbiBlbnRlciwgbGVhdmUgb3IgbW92ZSBhbmltYXRpb24gd2lsbCBjb21tZW5jZVxuICAgICAgICAvLyB0aGVyZWZvcmUgd2UgY2FuJ3QgYWxsb3cgYW55IGFuaW1hdGlvbnMgdG8gdGFrZSBwbGFjZVxuICAgICAgICAvLyBidXQgaWYgYSBwYXJlbnQgYW5pbWF0aW9uIGlzIGNsYXNzLWJhc2VkIHRoZW4gdGhhdCdzIG9rXG4gICAgICAgIGlmICghcGFyZW50QW5pbWF0aW9uRGV0ZWN0ZWQpIHtcbiAgICAgICAgICB2YXIgcGFyZW50RWxlbWVudERpc2FibGVkID0gZGlzYWJsZWRFbGVtZW50c0xvb2t1cC5nZXQocGFyZW50RWxlbWVudCk7XG5cbiAgICAgICAgICBpZiAocGFyZW50RWxlbWVudERpc2FibGVkID09PSB0cnVlICYmIGVsZW1lbnREaXNhYmxlZCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIC8vIGRpc2FibGUgYW5pbWF0aW9ucyBpZiB0aGUgdXNlciBoYXNuJ3QgZXhwbGljaXRseSBlbmFibGVkIGFuaW1hdGlvbnMgb24gdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGVsZW1lbnRcbiAgICAgICAgICAgIGVsZW1lbnREaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAvLyBlbGVtZW50IGlzIGRpc2FibGVkIHZpYSBwYXJlbnQgZWxlbWVudCwgbm8gbmVlZCB0byBjaGVjayBhbnl0aGluZyBlbHNlXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcmVudEVsZW1lbnREaXNhYmxlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGVsZW1lbnREaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJlbnRBbmltYXRpb25EZXRlY3RlZCA9IGRldGFpbHMuc3RydWN0dXJhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1VuZGVmaW5lZChhbmltYXRlQ2hpbGRyZW4pIHx8IGFuaW1hdGVDaGlsZHJlbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGpxTGl0ZS5kYXRhKHBhcmVudEVsZW1lbnQsIE5HX0FOSU1BVEVfQ0hJTERSRU5fREFUQSk7XG4gICAgICAgICAgaWYgKGlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGFuaW1hdGVDaGlsZHJlbiA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29udGludWUgdHJhdmVyc2luZyBhdCB0aGlzIHBvaW50XG4gICAgICAgIGlmIChwYXJlbnRBbmltYXRpb25EZXRlY3RlZCAmJiBhbmltYXRlQ2hpbGRyZW4gPT09IGZhbHNlKSBicmVhaztcblxuICAgICAgICBpZiAoIWJvZHlFbGVtZW50RGV0ZWN0ZWQpIHtcbiAgICAgICAgICAvLyB3ZSBhbHNvIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaXMgb3Igd2lsbCBiZSBhIHBhcnQgb2YgdGhlIGJvZHkgZWxlbWVudFxuICAgICAgICAgIC8vIG90aGVyd2lzZSBpdCBpcyBwb2ludGxlc3MgdG8gZXZlbiBpc3N1ZSBhbiBhbmltYXRpb24gdG8gYmUgcmVuZGVyZWRcbiAgICAgICAgICBib2R5RWxlbWVudERldGVjdGVkID0gaXNNYXRjaGluZ0VsZW1lbnQocGFyZW50RWxlbWVudCwgYm9keUVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGJvZHlFbGVtZW50RGV0ZWN0ZWQgJiYgcm9vdEVsZW1lbnREZXRlY3RlZCkge1xuICAgICAgICAgIC8vIElmIGJvdGggYm9keSBhbmQgcm9vdCBoYXZlIGJlZW4gZm91bmQsIGFueSBvdGhlciBjaGVja3MgYXJlIHBvaW50bGVzcyxcbiAgICAgICAgICAvLyBhcyBubyBhbmltYXRpb24gZGF0YSBzaG91bGQgbGl2ZSBvdXRzaWRlIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyb290RWxlbWVudERldGVjdGVkKSB7XG4gICAgICAgICAgLy8gSWYgbm8gcm9vdEVsZW1lbnQgaXMgZGV0ZWN0ZWQsIGNoZWNrIGlmIHRoZSBwYXJlbnRFbGVtZW50IGlzIHBpbm5lZCB0byBhbm90aGVyIGVsZW1lbnRcbiAgICAgICAgICBwYXJlbnRIb3N0ID0ganFMaXRlLmRhdGEocGFyZW50RWxlbWVudCwgTkdfQU5JTUFURV9QSU5fREFUQSk7XG4gICAgICAgICAgaWYgKHBhcmVudEhvc3QpIHtcbiAgICAgICAgICAgIC8vIFRoZSBwaW4gdGFyZ2V0IGVsZW1lbnQgYmVjb21lcyB0aGUgbmV4dCBwYXJlbnQgZWxlbWVudFxuICAgICAgICAgICAgcGFyZW50RWxlbWVudCA9IGdldERvbU5vZGUocGFyZW50SG9zdCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnRFbGVtZW50ID0gcGFyZW50RWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICB2YXIgYWxsb3dBbmltYXRpb24gPSAoIXBhcmVudEFuaW1hdGlvbkRldGVjdGVkIHx8IGFuaW1hdGVDaGlsZHJlbikgJiYgZWxlbWVudERpc2FibGVkICE9PSB0cnVlO1xuICAgICAgcmV0dXJuIGFsbG93QW5pbWF0aW9uICYmIHJvb3RFbGVtZW50RGV0ZWN0ZWQgJiYgYm9keUVsZW1lbnREZXRlY3RlZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXJrRWxlbWVudEFuaW1hdGlvblN0YXRlKGVsZW1lbnQsIHN0YXRlLCBkZXRhaWxzKSB7XG4gICAgICBkZXRhaWxzID0gZGV0YWlscyB8fCB7fTtcbiAgICAgIGRldGFpbHMuc3RhdGUgPSBzdGF0ZTtcblxuICAgICAgdmFyIG5vZGUgPSBnZXREb21Ob2RlKGVsZW1lbnQpO1xuICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoTkdfQU5JTUFURV9BVFRSX05BTUUsIHN0YXRlKTtcblxuICAgICAgdmFyIG9sZFZhbHVlID0gYWN0aXZlQW5pbWF0aW9uc0xvb2t1cC5nZXQobm9kZSk7XG4gICAgICB2YXIgbmV3VmFsdWUgPSBvbGRWYWx1ZVxuICAgICAgICAgID8gZXh0ZW5kKG9sZFZhbHVlLCBkZXRhaWxzKVxuICAgICAgICAgIDogZGV0YWlscztcbiAgICAgIGFjdGl2ZUFuaW1hdGlvbnNMb29rdXAucHV0KG5vZGUsIG5ld1ZhbHVlKTtcbiAgICB9XG4gIH1dO1xufV07XG5cbnZhciAkJEFuaW1hdGlvblByb3ZpZGVyID0gWyckYW5pbWF0ZVByb3ZpZGVyJywgZnVuY3Rpb24oJGFuaW1hdGVQcm92aWRlcikge1xuICB2YXIgTkdfQU5JTUFURV9SRUZfQVRUUiA9ICduZy1hbmltYXRlLXJlZic7XG5cbiAgdmFyIGRyaXZlcnMgPSB0aGlzLmRyaXZlcnMgPSBbXTtcblxuICB2YXIgUlVOTkVSX1NUT1JBR0VfS0VZID0gJyQkYW5pbWF0aW9uUnVubmVyJztcblxuICBmdW5jdGlvbiBzZXRSdW5uZXIoZWxlbWVudCwgcnVubmVyKSB7XG4gICAgZWxlbWVudC5kYXRhKFJVTk5FUl9TVE9SQUdFX0tFWSwgcnVubmVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVJ1bm5lcihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5yZW1vdmVEYXRhKFJVTk5FUl9TVE9SQUdFX0tFWSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSdW5uZXIoZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50LmRhdGEoUlVOTkVSX1NUT1JBR0VfS0VZKTtcbiAgfVxuXG4gIHRoaXMuJGdldCA9IFsnJCRqcUxpdGUnLCAnJHJvb3RTY29wZScsICckaW5qZWN0b3InLCAnJCRBbmltYXRlUnVubmVyJywgJyQkSGFzaE1hcCcsICckJHJBRlNjaGVkdWxlcicsXG4gICAgICAgZnVuY3Rpb24oJCRqcUxpdGUsICAgJHJvb3RTY29wZSwgICAkaW5qZWN0b3IsICAgJCRBbmltYXRlUnVubmVyLCAgICQkSGFzaE1hcCwgICAkJHJBRlNjaGVkdWxlcikge1xuXG4gICAgdmFyIGFuaW1hdGlvblF1ZXVlID0gW107XG4gICAgdmFyIGFwcGx5QW5pbWF0aW9uQ2xhc3NlcyA9IGFwcGx5QW5pbWF0aW9uQ2xhc3Nlc0ZhY3RvcnkoJCRqcUxpdGUpO1xuXG4gICAgZnVuY3Rpb24gc29ydEFuaW1hdGlvbnMoYW5pbWF0aW9ucykge1xuICAgICAgdmFyIHRyZWUgPSB7IGNoaWxkcmVuOiBbXSB9O1xuICAgICAgdmFyIGksIGxvb2t1cCA9IG5ldyAkJEhhc2hNYXAoKTtcblxuICAgICAgLy8gdGhpcyBpcyBkb25lIGZpcnN0IGJlZm9yZWhhbmQgc28gdGhhdCB0aGUgaGFzaG1hcFxuICAgICAgLy8gaXMgZmlsbGVkIHdpdGggYSBsaXN0IG9mIHRoZSBlbGVtZW50cyB0aGF0IHdpbGwgYmUgYW5pbWF0ZWRcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhbmltYXRpb24gPSBhbmltYXRpb25zW2ldO1xuICAgICAgICBsb29rdXAucHV0KGFuaW1hdGlvbi5kb21Ob2RlLCBhbmltYXRpb25zW2ldID0ge1xuICAgICAgICAgIGRvbU5vZGU6IGFuaW1hdGlvbi5kb21Ob2RlLFxuICAgICAgICAgIGZuOiBhbmltYXRpb24uZm4sXG4gICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgYW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwcm9jZXNzTm9kZShhbmltYXRpb25zW2ldKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZsYXR0ZW4odHJlZSk7XG5cbiAgICAgIGZ1bmN0aW9uIHByb2Nlc3NOb2RlKGVudHJ5KSB7XG4gICAgICAgIGlmIChlbnRyeS5wcm9jZXNzZWQpIHJldHVybiBlbnRyeTtcbiAgICAgICAgZW50cnkucHJvY2Vzc2VkID0gdHJ1ZTtcblxuICAgICAgICB2YXIgZWxlbWVudE5vZGUgPSBlbnRyeS5kb21Ob2RlO1xuICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGVsZW1lbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgIGxvb2t1cC5wdXQoZWxlbWVudE5vZGUsIGVudHJ5KTtcblxuICAgICAgICB2YXIgcGFyZW50RW50cnk7XG4gICAgICAgIHdoaWxlIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgcGFyZW50RW50cnkgPSBsb29rdXAuZ2V0KHBhcmVudE5vZGUpO1xuICAgICAgICAgIGlmIChwYXJlbnRFbnRyeSkge1xuICAgICAgICAgICAgaWYgKCFwYXJlbnRFbnRyeS5wcm9jZXNzZWQpIHtcbiAgICAgICAgICAgICAgcGFyZW50RW50cnkgPSBwcm9jZXNzTm9kZShwYXJlbnRFbnRyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyZW50Tm9kZSA9IHBhcmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIChwYXJlbnRFbnRyeSB8fCB0cmVlKS5jaGlsZHJlbi5wdXNoKGVudHJ5KTtcbiAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBmbGF0dGVuKHRyZWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRyZWUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBxdWV1ZS5wdXNoKHRyZWUuY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlbWFpbmluZ0xldmVsRW50cmllcyA9IHF1ZXVlLmxlbmd0aDtcbiAgICAgICAgdmFyIG5leHRMZXZlbEVudHJpZXMgPSAwO1xuICAgICAgICB2YXIgcm93ID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGVudHJ5ID0gcXVldWVbaV07XG4gICAgICAgICAgaWYgKHJlbWFpbmluZ0xldmVsRW50cmllcyA8PSAwKSB7XG4gICAgICAgICAgICByZW1haW5pbmdMZXZlbEVudHJpZXMgPSBuZXh0TGV2ZWxFbnRyaWVzO1xuICAgICAgICAgICAgbmV4dExldmVsRW50cmllcyA9IDA7XG4gICAgICAgICAgICByZXN1bHQucHVzaChyb3cpO1xuICAgICAgICAgICAgcm93ID0gW107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJvdy5wdXNoKGVudHJ5LmZuKTtcbiAgICAgICAgICBlbnRyeS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRW50cnkpIHtcbiAgICAgICAgICAgIG5leHRMZXZlbEVudHJpZXMrKztcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goY2hpbGRFbnRyeSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVtYWluaW5nTGV2ZWxFbnRyaWVzLS07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm93Lmxlbmd0aCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJvdyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8obWF0c2tvKTogZG9jdW1lbnQgdGhlIHNpZ25hdHVyZSBpbiBhIGJldHRlciB3YXlcbiAgICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCwgZXZlbnQsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBwcmVwYXJlQW5pbWF0aW9uT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgIHZhciBpc1N0cnVjdHVyYWwgPSBbJ2VudGVyJywgJ21vdmUnLCAnbGVhdmUnXS5pbmRleE9mKGV2ZW50KSA+PSAwO1xuXG4gICAgICAvLyB0aGVyZSBpcyBubyBhbmltYXRpb24gYXQgdGhlIGN1cnJlbnQgbW9tZW50LCBob3dldmVyXG4gICAgICAvLyB0aGVzZSBydW5uZXIgbWV0aG9kcyB3aWxsIGdldCBsYXRlciB1cGRhdGVkIHdpdGggdGhlXG4gICAgICAvLyBtZXRob2RzIGxlYWRpbmcgaW50byB0aGUgZHJpdmVyJ3MgZW5kL2NhbmNlbCBtZXRob2RzXG4gICAgICAvLyBmb3Igbm93IHRoZXkganVzdCBzdG9wIHRoZSBhbmltYXRpb24gZnJvbSBzdGFydGluZ1xuICAgICAgdmFyIHJ1bm5lciA9IG5ldyAkJEFuaW1hdGVSdW5uZXIoe1xuICAgICAgICBlbmQ6IGZ1bmN0aW9uKCkgeyBjbG9zZSgpOyB9LFxuICAgICAgICBjYW5jZWw6IGZ1bmN0aW9uKCkgeyBjbG9zZSh0cnVlKTsgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmICghZHJpdmVycy5sZW5ndGgpIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuIHJ1bm5lcjtcbiAgICAgIH1cblxuICAgICAgc2V0UnVubmVyKGVsZW1lbnQsIHJ1bm5lcik7XG5cbiAgICAgIHZhciBjbGFzc2VzID0gbWVyZ2VDbGFzc2VzKGVsZW1lbnQuYXR0cignY2xhc3MnKSwgbWVyZ2VDbGFzc2VzKG9wdGlvbnMuYWRkQ2xhc3MsIG9wdGlvbnMucmVtb3ZlQ2xhc3MpKTtcbiAgICAgIHZhciB0ZW1wQ2xhc3NlcyA9IG9wdGlvbnMudGVtcENsYXNzZXM7XG4gICAgICBpZiAodGVtcENsYXNzZXMpIHtcbiAgICAgICAgY2xhc3NlcyArPSAnICcgKyB0ZW1wQ2xhc3NlcztcbiAgICAgICAgb3B0aW9ucy50ZW1wQ2xhc3NlcyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcmVwYXJlQ2xhc3NOYW1lO1xuICAgICAgaWYgKGlzU3RydWN0dXJhbCkge1xuICAgICAgICBwcmVwYXJlQ2xhc3NOYW1lID0gJ25nLScgKyBldmVudCArIFBSRVBBUkVfQ0xBU1NfU1VGRklYO1xuICAgICAgICAkJGpxTGl0ZS5hZGRDbGFzcyhlbGVtZW50LCBwcmVwYXJlQ2xhc3NOYW1lKTtcbiAgICAgIH1cblxuICAgICAgYW5pbWF0aW9uUXVldWUucHVzaCh7XG4gICAgICAgIC8vIHRoaXMgZGF0YSBpcyB1c2VkIGJ5IHRoZSBwb3N0RGlnZXN0IGNvZGUgYW5kIHBhc3NlZCBpbnRvXG4gICAgICAgIC8vIHRoZSBkcml2ZXIgc3RlcCBmdW5jdGlvblxuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBjbGFzc2VzOiBjbGFzc2VzLFxuICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgIHN0cnVjdHVyYWw6IGlzU3RydWN0dXJhbCxcbiAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgYmVmb3JlU3RhcnQ6IGJlZm9yZVN0YXJ0LFxuICAgICAgICBjbG9zZTogY2xvc2VcbiAgICAgIH0pO1xuXG4gICAgICBlbGVtZW50Lm9uKCckZGVzdHJveScsIGhhbmRsZURlc3Ryb3llZEVsZW1lbnQpO1xuXG4gICAgICAvLyB3ZSBvbmx5IHdhbnQgdGhlcmUgdG8gYmUgb25lIGZ1bmN0aW9uIGNhbGxlZCB3aXRoaW4gdGhlIHBvc3QgZGlnZXN0XG4gICAgICAvLyBibG9jay4gVGhpcyB3YXkgd2UgY2FuIGdyb3VwIGFuaW1hdGlvbnMgZm9yIGFsbCB0aGUgYW5pbWF0aW9ucyB0aGF0XG4gICAgICAvLyB3ZXJlIGFwYXJ0IG9mIHRoZSBzYW1lIHBvc3REaWdlc3QgZmx1c2ggY2FsbC5cbiAgICAgIGlmIChhbmltYXRpb25RdWV1ZS5sZW5ndGggPiAxKSByZXR1cm4gcnVubmVyO1xuXG4gICAgICAkcm9vdFNjb3BlLiQkcG9zdERpZ2VzdChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFuaW1hdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yRWFjaChhbmltYXRpb25RdWV1ZSwgZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgICAvLyB0aGUgZWxlbWVudCB3YXMgZGVzdHJveWVkIGVhcmx5IG9uIHdoaWNoIHJlbW92ZWQgdGhlIHJ1bm5lclxuICAgICAgICAgIC8vIGZvcm0gaXRzIHN0b3JhZ2UuIFRoaXMgbWVhbnMgd2UgY2FuJ3QgYW5pbWF0ZSB0aGlzIGVsZW1lbnRcbiAgICAgICAgICAvLyBhdCBhbGwgYW5kIGl0IGFscmVhZHkgaGFzIGJlZW4gY2xvc2VkIGR1ZSB0byBkZXN0cnVjdGlvbi5cbiAgICAgICAgICBpZiAoZ2V0UnVubmVyKGVudHJ5LmVsZW1lbnQpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25zLnB1c2goZW50cnkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbnRyeS5jbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbm93IGFueSBmdXR1cmUgYW5pbWF0aW9ucyB3aWxsIGJlIGluIGFub3RoZXIgcG9zdERpZ2VzdFxuICAgICAgICBhbmltYXRpb25RdWV1ZS5sZW5ndGggPSAwO1xuXG4gICAgICAgIHZhciBncm91cGVkQW5pbWF0aW9ucyA9IGdyb3VwQW5pbWF0aW9ucyhhbmltYXRpb25zKTtcbiAgICAgICAgdmFyIHRvQmVTb3J0ZWRBbmltYXRpb25zID0gW107XG5cbiAgICAgICAgZm9yRWFjaChncm91cGVkQW5pbWF0aW9ucywgZnVuY3Rpb24oYW5pbWF0aW9uRW50cnkpIHtcbiAgICAgICAgICB0b0JlU29ydGVkQW5pbWF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGRvbU5vZGU6IGdldERvbU5vZGUoYW5pbWF0aW9uRW50cnkuZnJvbSA/IGFuaW1hdGlvbkVudHJ5LmZyb20uZWxlbWVudCA6IGFuaW1hdGlvbkVudHJ5LmVsZW1lbnQpLFxuICAgICAgICAgICAgZm46IGZ1bmN0aW9uIHRyaWdnZXJBbmltYXRpb25TdGFydCgpIHtcbiAgICAgICAgICAgICAgLy8gaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBhcHBseSB0aGUgYG5nLWFuaW1hdGVgIENTUyBjbGFzcyBhbmQgdGhlXG4gICAgICAgICAgICAgIC8vIHRlbXBvcmFyeSBjbGFzc2VzIGJlZm9yZSB3ZSBkbyBhbnkgZHJpdmVyIGludm9raW5nIHNpbmNlIHRoZXNlXG4gICAgICAgICAgICAgIC8vIENTUyBjbGFzc2VzIG1heSBiZSByZXF1aXJlZCBmb3IgcHJvcGVyIENTUyBkZXRlY3Rpb24uXG4gICAgICAgICAgICAgIGFuaW1hdGlvbkVudHJ5LmJlZm9yZVN0YXJ0KCk7XG5cbiAgICAgICAgICAgICAgdmFyIHN0YXJ0QW5pbWF0aW9uRm4sIGNsb3NlRm4gPSBhbmltYXRpb25FbnRyeS5jbG9zZTtcblxuICAgICAgICAgICAgICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGUgZWxlbWVudCB3YXMgcmVtb3ZlZCBiZWZvcmUgdGhlIGRpZ2VzdCBydW5zIG9yXG4gICAgICAgICAgICAgIC8vIGR1cmluZyB0aGUgUkFGIHNlcXVlbmNpbmcgdGhlbiB3ZSBzaG91bGQgbm90IHRyaWdnZXIgdGhlIGFuaW1hdGlvbi5cbiAgICAgICAgICAgICAgdmFyIHRhcmdldEVsZW1lbnQgPSBhbmltYXRpb25FbnRyeS5hbmNob3JzXG4gICAgICAgICAgICAgICAgICA/IChhbmltYXRpb25FbnRyeS5mcm9tLmVsZW1lbnQgfHwgYW5pbWF0aW9uRW50cnkudG8uZWxlbWVudClcbiAgICAgICAgICAgICAgICAgIDogYW5pbWF0aW9uRW50cnkuZWxlbWVudDtcblxuICAgICAgICAgICAgICBpZiAoZ2V0UnVubmVyKHRhcmdldEVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wZXJhdGlvbiA9IGludm9rZUZpcnN0RHJpdmVyKGFuaW1hdGlvbkVudHJ5KTtcbiAgICAgICAgICAgICAgICBpZiAob3BlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICBzdGFydEFuaW1hdGlvbkZuID0gb3BlcmF0aW9uLnN0YXJ0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICghc3RhcnRBbmltYXRpb25Gbikge1xuICAgICAgICAgICAgICAgIGNsb3NlRm4oKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5pbWF0aW9uUnVubmVyID0gc3RhcnRBbmltYXRpb25GbigpO1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvblJ1bm5lci5kb25lKGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgY2xvc2VGbighc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB1cGRhdGVBbmltYXRpb25SdW5uZXJzKGFuaW1hdGlvbkVudHJ5LCBhbmltYXRpb25SdW5uZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc29ydCBlYWNoIG9mIHRoZSBhbmltYXRpb25zIGluIG9yZGVyIG9mIHBhcmVudCB0byBjaGlsZFxuICAgICAgICAvLyByZWxhdGlvbnNoaXBzLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgY2hpbGQgY2xhc3NlcyBhcmUgYXBwbGllZCBhdCB0aGVcbiAgICAgICAgLy8gcmlnaHQgdGltZS5cbiAgICAgICAgJCRyQUZTY2hlZHVsZXIoc29ydEFuaW1hdGlvbnModG9CZVNvcnRlZEFuaW1hdGlvbnMpKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcnVubmVyO1xuXG4gICAgICAvLyBUT0RPKG1hdHNrbyk6IGNoYW5nZSB0byByZWZlcmVuY2Ugbm9kZXNcbiAgICAgIGZ1bmN0aW9uIGdldEFuY2hvck5vZGVzKG5vZGUpIHtcbiAgICAgICAgdmFyIFNFTEVDVE9SID0gJ1snICsgTkdfQU5JTUFURV9SRUZfQVRUUiArICddJztcbiAgICAgICAgdmFyIGl0ZW1zID0gbm9kZS5oYXNBdHRyaWJ1dGUoTkdfQU5JTUFURV9SRUZfQVRUUilcbiAgICAgICAgICAgICAgPyBbbm9kZV1cbiAgICAgICAgICAgICAgOiBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1IpO1xuICAgICAgICB2YXIgYW5jaG9ycyA9IFtdO1xuICAgICAgICBmb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgdmFyIGF0dHIgPSBub2RlLmdldEF0dHJpYnV0ZShOR19BTklNQVRFX1JFRl9BVFRSKTtcbiAgICAgICAgICBpZiAoYXR0ciAmJiBhdHRyLmxlbmd0aCkge1xuICAgICAgICAgICAgYW5jaG9ycy5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhbmNob3JzO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBncm91cEFuaW1hdGlvbnMoYW5pbWF0aW9ucykge1xuICAgICAgICB2YXIgcHJlcGFyZWRBbmltYXRpb25zID0gW107XG4gICAgICAgIHZhciByZWZMb29rdXAgPSB7fTtcbiAgICAgICAgZm9yRWFjaChhbmltYXRpb25zLCBmdW5jdGlvbihhbmltYXRpb24sIGluZGV4KSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSBhbmltYXRpb24uZWxlbWVudDtcbiAgICAgICAgICB2YXIgbm9kZSA9IGdldERvbU5vZGUoZWxlbWVudCk7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gYW5pbWF0aW9uLmV2ZW50O1xuICAgICAgICAgIHZhciBlbnRlck9yTW92ZSA9IFsnZW50ZXInLCAnbW92ZSddLmluZGV4T2YoZXZlbnQpID49IDA7XG4gICAgICAgICAgdmFyIGFuY2hvck5vZGVzID0gYW5pbWF0aW9uLnN0cnVjdHVyYWwgPyBnZXRBbmNob3JOb2Rlcyhub2RlKSA6IFtdO1xuXG4gICAgICAgICAgaWYgKGFuY2hvck5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGVudGVyT3JNb3ZlID8gJ3RvJyA6ICdmcm9tJztcblxuICAgICAgICAgICAgZm9yRWFjaChhbmNob3JOb2RlcywgZnVuY3Rpb24oYW5jaG9yKSB7XG4gICAgICAgICAgICAgIHZhciBrZXkgPSBhbmNob3IuZ2V0QXR0cmlidXRlKE5HX0FOSU1BVEVfUkVGX0FUVFIpO1xuICAgICAgICAgICAgICByZWZMb29rdXBba2V5XSA9IHJlZkxvb2t1cFtrZXldIHx8IHt9O1xuICAgICAgICAgICAgICByZWZMb29rdXBba2V5XVtkaXJlY3Rpb25dID0ge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbklEOiBpbmRleCxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBqcUxpdGUoYW5jaG9yKVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXBhcmVkQW5pbWF0aW9ucy5wdXNoKGFuaW1hdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdXNlZEluZGljZXNMb29rdXAgPSB7fTtcbiAgICAgICAgdmFyIGFuY2hvckdyb3VwcyA9IHt9O1xuICAgICAgICBmb3JFYWNoKHJlZkxvb2t1cCwgZnVuY3Rpb24ob3BlcmF0aW9ucywga2V5KSB7XG4gICAgICAgICAgdmFyIGZyb20gPSBvcGVyYXRpb25zLmZyb207XG4gICAgICAgICAgdmFyIHRvID0gb3BlcmF0aW9ucy50bztcblxuICAgICAgICAgIGlmICghZnJvbSB8fCAhdG8pIHtcbiAgICAgICAgICAgIC8vIG9ubHkgb25lIG9mIHRoZXNlIGlzIHNldCB0aGVyZWZvcmUgd2UgY2FuJ3QgaGF2ZSBhblxuICAgICAgICAgICAgLy8gYW5jaG9yIGFuaW1hdGlvbiBzaW5jZSBhbGwgdGhyZWUgcGllY2VzIGFyZSByZXF1aXJlZFxuICAgICAgICAgICAgdmFyIGluZGV4ID0gZnJvbSA/IGZyb20uYW5pbWF0aW9uSUQgOiB0by5hbmltYXRpb25JRDtcbiAgICAgICAgICAgIHZhciBpbmRleEtleSA9IGluZGV4LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBpZiAoIXVzZWRJbmRpY2VzTG9va3VwW2luZGV4S2V5XSkge1xuICAgICAgICAgICAgICB1c2VkSW5kaWNlc0xvb2t1cFtpbmRleEtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBwcmVwYXJlZEFuaW1hdGlvbnMucHVzaChhbmltYXRpb25zW2luZGV4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGZyb21BbmltYXRpb24gPSBhbmltYXRpb25zW2Zyb20uYW5pbWF0aW9uSURdO1xuICAgICAgICAgIHZhciB0b0FuaW1hdGlvbiA9IGFuaW1hdGlvbnNbdG8uYW5pbWF0aW9uSURdO1xuICAgICAgICAgIHZhciBsb29rdXBLZXkgPSBmcm9tLmFuaW1hdGlvbklELnRvU3RyaW5nKCk7XG4gICAgICAgICAgaWYgKCFhbmNob3JHcm91cHNbbG9va3VwS2V5XSkge1xuICAgICAgICAgICAgdmFyIGdyb3VwID0gYW5jaG9yR3JvdXBzW2xvb2t1cEtleV0gPSB7XG4gICAgICAgICAgICAgIHN0cnVjdHVyYWw6IHRydWUsXG4gICAgICAgICAgICAgIGJlZm9yZVN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBmcm9tQW5pbWF0aW9uLmJlZm9yZVN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgdG9BbmltYXRpb24uYmVmb3JlU3RhcnQoKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGZyb21BbmltYXRpb24uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB0b0FuaW1hdGlvbi5jbG9zZSgpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjbGFzc2VzOiBjc3NDbGFzc2VzSW50ZXJzZWN0aW9uKGZyb21BbmltYXRpb24uY2xhc3NlcywgdG9BbmltYXRpb24uY2xhc3NlcyksXG4gICAgICAgICAgICAgIGZyb206IGZyb21BbmltYXRpb24sXG4gICAgICAgICAgICAgIHRvOiB0b0FuaW1hdGlvbixcbiAgICAgICAgICAgICAgYW5jaG9yczogW10gLy8gVE9ETyhtYXRza28pOiBjaGFuZ2UgdG8gcmVmZXJlbmNlIG5vZGVzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyB0aGUgYW5jaG9yIGFuaW1hdGlvbnMgcmVxdWlyZSB0aGF0IHRoZSBmcm9tIGFuZCB0byBlbGVtZW50cyBib3RoIGhhdmUgYXQgbGVhc3RcbiAgICAgICAgICAgIC8vIG9uZSBzaGFyZWQgQ1NTIGNsYXNzIHdoaWNoIGVmZmVjdGl2ZWx5IG1hcnJpZXMgdGhlIHR3byBlbGVtZW50cyB0b2dldGhlciB0byB1c2VcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGFuaW1hdGlvbiBkcml2ZXIgYW5kIHRvIHByb3Blcmx5IHNlcXVlbmNlIHRoZSBhbmNob3IgYW5pbWF0aW9uLlxuICAgICAgICAgICAgaWYgKGdyb3VwLmNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHByZXBhcmVkQW5pbWF0aW9ucy5wdXNoKGdyb3VwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHByZXBhcmVkQW5pbWF0aW9ucy5wdXNoKGZyb21BbmltYXRpb24pO1xuICAgICAgICAgICAgICBwcmVwYXJlZEFuaW1hdGlvbnMucHVzaCh0b0FuaW1hdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYW5jaG9yR3JvdXBzW2xvb2t1cEtleV0uYW5jaG9ycy5wdXNoKHtcbiAgICAgICAgICAgICdvdXQnOiBmcm9tLmVsZW1lbnQsICdpbic6IHRvLmVsZW1lbnRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByZXBhcmVkQW5pbWF0aW9ucztcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY3NzQ2xhc3Nlc0ludGVyc2VjdGlvbihhLGIpIHtcbiAgICAgICAgYSA9IGEuc3BsaXQoJyAnKTtcbiAgICAgICAgYiA9IGIuc3BsaXQoJyAnKTtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgYWEgPSBhW2ldO1xuICAgICAgICAgIGlmIChhYS5zdWJzdHJpbmcoMCwzKSA9PT0gJ25nLScpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBiLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoYWEgPT09IGJbal0pIHtcbiAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKGFhKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoZXMuam9pbignICcpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBpbnZva2VGaXJzdERyaXZlcihhbmltYXRpb25EZXRhaWxzKSB7XG4gICAgICAgIC8vIHdlIGxvb3AgaW4gcmV2ZXJzZSBvcmRlciBzaW5jZSB0aGUgbW9yZSBnZW5lcmFsIGRyaXZlcnMgKGxpa2UgQ1NTIGFuZCBKUylcbiAgICAgICAgLy8gbWF5IGF0dGVtcHQgbW9yZSBlbGVtZW50cywgYnV0IGN1c3RvbSBkcml2ZXJzIGFyZSBtb3JlIHBhcnRpY3VsYXJcbiAgICAgICAgZm9yICh2YXIgaSA9IGRyaXZlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICB2YXIgZHJpdmVyTmFtZSA9IGRyaXZlcnNbaV07XG4gICAgICAgICAgaWYgKCEkaW5qZWN0b3IuaGFzKGRyaXZlck5hbWUpKSBjb250aW51ZTsgLy8gVE9ETyhtYXRza28pOiByZW1vdmUgdGhpcyBjaGVja1xuXG4gICAgICAgICAgdmFyIGZhY3RvcnkgPSAkaW5qZWN0b3IuZ2V0KGRyaXZlck5hbWUpO1xuICAgICAgICAgIHZhciBkcml2ZXIgPSBmYWN0b3J5KGFuaW1hdGlvbkRldGFpbHMpO1xuICAgICAgICAgIGlmIChkcml2ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBkcml2ZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGJlZm9yZVN0YXJ0KCkge1xuICAgICAgICBlbGVtZW50LmFkZENsYXNzKE5HX0FOSU1BVEVfQ0xBU1NOQU1FKTtcbiAgICAgICAgaWYgKHRlbXBDbGFzc2VzKSB7XG4gICAgICAgICAgJCRqcUxpdGUuYWRkQ2xhc3MoZWxlbWVudCwgdGVtcENsYXNzZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmVwYXJlQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgJCRqcUxpdGUucmVtb3ZlQ2xhc3MoZWxlbWVudCwgcHJlcGFyZUNsYXNzTmFtZSk7XG4gICAgICAgICAgcHJlcGFyZUNsYXNzTmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBkYXRlQW5pbWF0aW9uUnVubmVycyhhbmltYXRpb24sIG5ld1J1bm5lcikge1xuICAgICAgICBpZiAoYW5pbWF0aW9uLmZyb20gJiYgYW5pbWF0aW9uLnRvKSB7XG4gICAgICAgICAgdXBkYXRlKGFuaW1hdGlvbi5mcm9tLmVsZW1lbnQpO1xuICAgICAgICAgIHVwZGF0ZShhbmltYXRpb24udG8uZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlKGFuaW1hdGlvbi5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZShlbGVtZW50KSB7XG4gICAgICAgICAgZ2V0UnVubmVyKGVsZW1lbnQpLnNldEhvc3QobmV3UnVubmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVEZXN0cm95ZWRFbGVtZW50KCkge1xuICAgICAgICB2YXIgcnVubmVyID0gZ2V0UnVubmVyKGVsZW1lbnQpO1xuICAgICAgICBpZiAocnVubmVyICYmIChldmVudCAhPT0gJ2xlYXZlJyB8fCAhb3B0aW9ucy4kJGRvbU9wZXJhdGlvbkZpcmVkKSkge1xuICAgICAgICAgIHJ1bm5lci5lbmQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbG9zZShyZWplY3RlZCkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgZWxlbWVudC5vZmYoJyRkZXN0cm95JywgaGFuZGxlRGVzdHJveWVkRWxlbWVudCk7XG4gICAgICAgIHJlbW92ZVJ1bm5lcihlbGVtZW50KTtcblxuICAgICAgICBhcHBseUFuaW1hdGlvbkNsYXNzZXMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgIGFwcGx5QW5pbWF0aW9uU3R5bGVzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBvcHRpb25zLmRvbU9wZXJhdGlvbigpO1xuXG4gICAgICAgIGlmICh0ZW1wQ2xhc3Nlcykge1xuICAgICAgICAgICQkanFMaXRlLnJlbW92ZUNsYXNzKGVsZW1lbnQsIHRlbXBDbGFzc2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoTkdfQU5JTUFURV9DTEFTU05BTUUpO1xuICAgICAgICBydW5uZXIuY29tcGxldGUoIXJlamVjdGVkKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XTtcbn1dO1xuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG5nQW5pbWF0ZVN3YXBcbiAqIEByZXN0cmljdCBBXG4gKiBAc2NvcGVcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBuZ0FuaW1hdGVTd2FwIGlzIGEgYW5pbWF0aW9uLW9yaWVudGVkIGRpcmVjdGl2ZSB0aGF0IGFsbG93cyBmb3IgdGhlIGNvbnRhaW5lciB0b1xuICogYmUgcmVtb3ZlZCBhbmQgZW50ZXJlZCBpbiB3aGVuZXZlciB0aGUgYXNzb2NpYXRlZCBleHByZXNzaW9uIGNoYW5nZXMuIEFcbiAqIGNvbW1vbiB1c2VjYXNlIGZvciB0aGlzIGRpcmVjdGl2ZSBpcyBhIHJvdGF0aW5nIGJhbm5lciBvciBzbGlkZXIgY29tcG9uZW50IHdoaWNoXG4gKiBjb250YWlucyBvbmUgaW1hZ2UgYmVpbmcgcHJlc2VudCBhdCBhIHRpbWUuIFdoZW4gdGhlIGFjdGl2ZSBpbWFnZSBjaGFuZ2VzXG4gKiB0aGVuIHRoZSBvbGQgaW1hZ2Ugd2lsbCBwZXJmb3JtIGEgYGxlYXZlYCBhbmltYXRpb24gYW5kIHRoZSBuZXcgZWxlbWVudFxuICogd2lsbCBiZSBpbnNlcnRlZCB2aWEgYW4gYGVudGVyYCBhbmltYXRpb24uXG4gKlxuICogQGFuaW1hdGlvbnNcbiAqIHwgQW5pbWF0aW9uICAgICAgICAgICAgICAgICAgICAgICAgfCBPY2N1cnMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gKiB8IHtAbGluayBuZy4kYW5pbWF0ZSNlbnRlciBlbnRlcn0gIHwgd2hlbiB0aGUgbmV3IGVsZW1lbnQgaXMgaW5zZXJ0ZWQgdG8gdGhlIERPTSAgfFxuICogfCB7QGxpbmsgbmcuJGFuaW1hdGUjbGVhdmUgbGVhdmV9ICB8IHdoZW4gdGhlIG9sZCBlbGVtZW50IGlzIHJlbW92ZWQgZnJvbSB0aGUgRE9NIHxcbiAqXG4gKiBAZXhhbXBsZVxuICogPGV4YW1wbGUgbmFtZT1cIm5nQW5pbWF0ZVN3YXAtZGlyZWN0aXZlXCIgbW9kdWxlPVwibmdBbmltYXRlU3dhcEV4YW1wbGVcIlxuICogICAgICAgICAgZGVwcz1cImFuZ3VsYXItYW5pbWF0ZS5qc1wiXG4gKiAgICAgICAgICBhbmltYXRpb25zPVwidHJ1ZVwiIGZpeEJhc2U9XCJ0cnVlXCI+XG4gKiAgIDxmaWxlIG5hbWU9XCJpbmRleC5odG1sXCI+XG4gKiAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiIG5nLWNvbnRyb2xsZXI9XCJBcHBDdHJsXCI+XG4gKiAgICAgICA8ZGl2IG5nLWFuaW1hdGUtc3dhcD1cIm51bWJlclwiIGNsYXNzPVwiY2VsbCBzd2FwLWFuaW1hdGlvblwiIG5nLWNsYXNzPVwiY29sb3JDbGFzcyhudW1iZXIpXCI+XG4gKiAgICAgICAgIHt7IG51bWJlciB9fVxuICogICAgICAgPC9kaXY+XG4gKiAgICAgPC9kaXY+XG4gKiAgIDwvZmlsZT5cbiAqICAgPGZpbGUgbmFtZT1cInNjcmlwdC5qc1wiPlxuICogICAgIGFuZ3VsYXIubW9kdWxlKCduZ0FuaW1hdGVTd2FwRXhhbXBsZScsIFsnbmdBbmltYXRlJ10pXG4gKiAgICAgICAuY29udHJvbGxlcignQXBwQ3RybCcsIFsnJHNjb3BlJywgJyRpbnRlcnZhbCcsIGZ1bmN0aW9uKCRzY29wZSwgJGludGVydmFsKSB7XG4gKiAgICAgICAgICRzY29wZS5udW1iZXIgPSAwO1xuICogICAgICAgICAkaW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gKiAgICAgICAgICAgJHNjb3BlLm51bWJlcisrO1xuICogICAgICAgICB9LCAxMDAwKTtcbiAqXG4gKiAgICAgICAgIHZhciBjb2xvcnMgPSBbJ3JlZCcsJ2JsdWUnLCdncmVlbicsJ3llbGxvdycsJ29yYW5nZSddO1xuICogICAgICAgICAkc2NvcGUuY29sb3JDbGFzcyA9IGZ1bmN0aW9uKG51bWJlcikge1xuICogICAgICAgICAgIHJldHVybiBjb2xvcnNbbnVtYmVyICUgY29sb3JzLmxlbmd0aF07XG4gKiAgICAgICAgIH07XG4gKiAgICAgICB9XSk7XG4gKiAgIDwvZmlsZT5cbiAqICA8ZmlsZSBuYW1lPVwiYW5pbWF0aW9ucy5jc3NcIj5cbiAqICAuY29udGFpbmVyIHtcbiAqICAgIGhlaWdodDoyNTBweDtcbiAqICAgIHdpZHRoOjI1MHB4O1xuICogICAgcG9zaXRpb246cmVsYXRpdmU7XG4gKiAgICBvdmVyZmxvdzpoaWRkZW47XG4gKiAgICBib3JkZXI6MnB4IHNvbGlkIGJsYWNrO1xuICogIH1cbiAqICAuY29udGFpbmVyIC5jZWxsIHtcbiAqICAgIGZvbnQtc2l6ZToxNTBweDtcbiAqICAgIHRleHQtYWxpZ246Y2VudGVyO1xuICogICAgbGluZS1oZWlnaHQ6MjUwcHg7XG4gKiAgICBwb3NpdGlvbjphYnNvbHV0ZTtcbiAqICAgIHRvcDowO1xuICogICAgbGVmdDowO1xuICogICAgcmlnaHQ6MDtcbiAqICAgIGJvcmRlci1ib3R0b206MnB4IHNvbGlkIGJsYWNrO1xuICogIH1cbiAqICAuc3dhcC1hbmltYXRpb24ubmctZW50ZXIsIC5zd2FwLWFuaW1hdGlvbi5uZy1sZWF2ZSB7XG4gKiAgICB0cmFuc2l0aW9uOjAuNXMgbGluZWFyIGFsbDtcbiAqICB9XG4gKiAgLnN3YXAtYW5pbWF0aW9uLm5nLWVudGVyIHtcbiAqICAgIHRvcDotMjUwcHg7XG4gKiAgfVxuICogIC5zd2FwLWFuaW1hdGlvbi5uZy1lbnRlci1hY3RpdmUge1xuICogICAgdG9wOjBweDtcbiAqICB9XG4gKiAgLnN3YXAtYW5pbWF0aW9uLm5nLWxlYXZlIHtcbiAqICAgIHRvcDowcHg7XG4gKiAgfVxuICogIC5zd2FwLWFuaW1hdGlvbi5uZy1sZWF2ZS1hY3RpdmUge1xuICogICAgdG9wOjI1MHB4O1xuICogIH1cbiAqICAucmVkIHsgYmFja2dyb3VuZDpyZWQ7IH1cbiAqICAuZ3JlZW4geyBiYWNrZ3JvdW5kOmdyZWVuOyB9XG4gKiAgLmJsdWUgeyBiYWNrZ3JvdW5kOmJsdWU7IH1cbiAqICAueWVsbG93IHsgYmFja2dyb3VuZDp5ZWxsb3c7IH1cbiAqICAub3JhbmdlIHsgYmFja2dyb3VuZDpvcmFuZ2U7IH1cbiAqICA8L2ZpbGU+XG4gKiA8L2V4YW1wbGU+XG4gKi9cbnZhciBuZ0FuaW1hdGVTd2FwRGlyZWN0aXZlID0gWyckYW5pbWF0ZScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGFuaW1hdGUsICRyb290U2NvcGUpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRyYW5zY2x1ZGU6ICdlbGVtZW50JyxcbiAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICBwcmlvcml0eTogNjAwLCAvLyB3ZSB1c2UgNjAwIGhlcmUgdG8gZW5zdXJlIHRoYXQgdGhlIGRpcmVjdGl2ZSBpcyBjYXVnaHQgYmVmb3JlIG90aGVyc1xuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCAkZWxlbWVudCwgYXR0cnMsIGN0cmwsICR0cmFuc2NsdWRlKSB7XG4gICAgICB2YXIgcHJldmlvdXNFbGVtZW50LCBwcmV2aW91c1Njb3BlO1xuICAgICAgc2NvcGUuJHdhdGNoQ29sbGVjdGlvbihhdHRycy5uZ0FuaW1hdGVTd2FwIHx8IGF0dHJzWydmb3InXSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHByZXZpb3VzRWxlbWVudCkge1xuICAgICAgICAgICRhbmltYXRlLmxlYXZlKHByZXZpb3VzRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZpb3VzU2NvcGUpIHtcbiAgICAgICAgICBwcmV2aW91c1Njb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgcHJldmlvdXNTY29wZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlIHx8IHZhbHVlID09PSAwKSB7XG4gICAgICAgICAgcHJldmlvdXNTY29wZSA9IHNjb3BlLiRuZXcoKTtcbiAgICAgICAgICAkdHJhbnNjbHVkZShwcmV2aW91c1Njb3BlLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICBwcmV2aW91c0VsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgICAgJGFuaW1hdGUuZW50ZXIoZWxlbWVudCwgbnVsbCwgJGVsZW1lbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XTtcblxuLyogZ2xvYmFsIGFuZ3VsYXJBbmltYXRlTW9kdWxlOiB0cnVlLFxuXG4gICBuZ0FuaW1hdGVTd2FwRGlyZWN0aXZlLFxuICAgJCRBbmltYXRlQXN5bmNSdW5GYWN0b3J5LFxuICAgJCRyQUZTY2hlZHVsZXJGYWN0b3J5LFxuICAgJCRBbmltYXRlQ2hpbGRyZW5EaXJlY3RpdmUsXG4gICAkJEFuaW1hdGVRdWV1ZVByb3ZpZGVyLFxuICAgJCRBbmltYXRpb25Qcm92aWRlcixcbiAgICRBbmltYXRlQ3NzUHJvdmlkZXIsXG4gICAkJEFuaW1hdGVDc3NEcml2ZXJQcm92aWRlcixcbiAgICQkQW5pbWF0ZUpzUHJvdmlkZXIsXG4gICAkJEFuaW1hdGVKc0RyaXZlclByb3ZpZGVyLFxuKi9cblxuLyoqXG4gKiBAbmdkb2MgbW9kdWxlXG4gKiBAbmFtZSBuZ0FuaW1hdGVcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRoZSBgbmdBbmltYXRlYCBtb2R1bGUgcHJvdmlkZXMgc3VwcG9ydCBmb3IgQ1NTLWJhc2VkIGFuaW1hdGlvbnMgKGtleWZyYW1lcyBhbmQgdHJhbnNpdGlvbnMpIGFzIHdlbGwgYXMgSmF2YVNjcmlwdC1iYXNlZCBhbmltYXRpb25zIHZpYVxuICogY2FsbGJhY2sgaG9va3MuIEFuaW1hdGlvbnMgYXJlIG5vdCBlbmFibGVkIGJ5IGRlZmF1bHQsIGhvd2V2ZXIsIGJ5IGluY2x1ZGluZyBgbmdBbmltYXRlYCB0aGUgYW5pbWF0aW9uIGhvb2tzIGFyZSBlbmFibGVkIGZvciBhbiBBbmd1bGFyIGFwcC5cbiAqXG4gKiA8ZGl2IGRvYy1tb2R1bGUtY29tcG9uZW50cz1cIm5nQW5pbWF0ZVwiPjwvZGl2PlxuICpcbiAqICMgVXNhZ2VcbiAqIFNpbXBseSBwdXQsIHRoZXJlIGFyZSB0d28gd2F5cyB0byBtYWtlIHVzZSBvZiBhbmltYXRpb25zIHdoZW4gbmdBbmltYXRlIGlzIHVzZWQ6IGJ5IHVzaW5nICoqQ1NTKiogYW5kICoqSmF2YVNjcmlwdCoqLiBUaGUgZm9ybWVyIHdvcmtzIHB1cmVseSBiYXNlZFxuICogdXNpbmcgQ1NTIChieSB1c2luZyBtYXRjaGluZyBDU1Mgc2VsZWN0b3JzL3N0eWxlcykgYW5kIHRoZSBsYXR0ZXIgdHJpZ2dlcnMgYW5pbWF0aW9ucyB0aGF0IGFyZSByZWdpc3RlcmVkIHZpYSBgbW9kdWxlLmFuaW1hdGlvbigpYC4gRm9yXG4gKiBib3RoIENTUyBhbmQgSlMgYW5pbWF0aW9ucyB0aGUgc29sZSByZXF1aXJlbWVudCBpcyB0byBoYXZlIGEgbWF0Y2hpbmcgYENTUyBjbGFzc2AgdGhhdCBleGlzdHMgYm90aCBpbiB0aGUgcmVnaXN0ZXJlZCBhbmltYXRpb24gYW5kIHdpdGhpblxuICogdGhlIEhUTUwgZWxlbWVudCB0aGF0IHRoZSBhbmltYXRpb24gd2lsbCBiZSB0cmlnZ2VyZWQgb24uXG4gKlxuICogIyMgRGlyZWN0aXZlIFN1cHBvcnRcbiAqIFRoZSBmb2xsb3dpbmcgZGlyZWN0aXZlcyBhcmUgXCJhbmltYXRpb24gYXdhcmVcIjpcbiAqXG4gKiB8IERpcmVjdGl2ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgU3VwcG9ydGVkIEFuaW1hdGlvbnMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuICogfCB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nUmVwZWF0I2FuaW1hdGlvbnMgbmdSZXBlYXR9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGVudGVyLCBsZWF2ZSBhbmQgbW92ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHtAbGluayBuZ1JvdXRlLmRpcmVjdGl2ZTpuZ1ZpZXcjYW5pbWF0aW9ucyBuZ1ZpZXd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgZW50ZXIgYW5kIGxlYXZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwge0BsaW5rIG5nLmRpcmVjdGl2ZTpuZ0luY2x1ZGUjYW5pbWF0aW9ucyBuZ0luY2x1ZGV9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBlbnRlciBhbmQgbGVhdmUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfCB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nU3dpdGNoI2FuaW1hdGlvbnMgbmdTd2l0Y2h9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGVudGVyIGFuZCBsZWF2ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHtAbGluayBuZy5kaXJlY3RpdmU6bmdJZiNhbmltYXRpb25zIG5nSWZ9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgZW50ZXIgYW5kIGxlYXZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwge0BsaW5rIG5nLmRpcmVjdGl2ZTpuZ0NsYXNzI2FuaW1hdGlvbnMgbmdDbGFzc30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBhZGQgYW5kIHJlbW92ZSAodGhlIENTUyBjbGFzcyhlcykgcHJlc2VudCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfCB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nU2hvdyNhbmltYXRpb25zIG5nU2hvd30gJiB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nSGlkZSNhbmltYXRpb25zIG5nSGlkZX0gICAgICAgICAgICB8IGFkZCBhbmQgcmVtb3ZlICh0aGUgbmctaGlkZSBjbGFzcyB2YWx1ZSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHtAbGluayBuZy5kaXJlY3RpdmU6Zm9ybSNhbmltYXRpb24taG9va3MgZm9ybX0gJiB7QGxpbmsgbmcuZGlyZWN0aXZlOm5nTW9kZWwjYW5pbWF0aW9uLWhvb2tzIG5nTW9kZWx9ICAgIHwgYWRkIGFuZCByZW1vdmUgKGRpcnR5LCBwcmlzdGluZSwgdmFsaWQsIGludmFsaWQgJiBhbGwgb3RoZXIgdmFsaWRhdGlvbnMpIHxcbiAqIHwge0BsaW5rIG1vZHVsZTpuZ01lc3NhZ2VzI2FuaW1hdGlvbnMgbmdNZXNzYWdlc30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBhZGQgYW5kIHJlbW92ZSAobmctYWN0aXZlICYgbmctaW5hY3RpdmUpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogfCB7QGxpbmsgbW9kdWxlOm5nTWVzc2FnZXMjYW5pbWF0aW9ucyBuZ01lc3NhZ2V9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGVudGVyIGFuZCBsZWF2ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKlxuICogKE1vcmUgaW5mb3JtYXRpb24gY2FuIGJlIGZvdW5kIGJ5IHZpc2l0aW5nIGVhY2ggdGhlIGRvY3VtZW50YXRpb24gYXNzb2NpYXRlZCB3aXRoIGVhY2ggZGlyZWN0aXZlLilcbiAqXG4gKiAjIyBDU1MtYmFzZWQgQW5pbWF0aW9uc1xuICpcbiAqIENTUy1iYXNlZCBhbmltYXRpb25zIHdpdGggbmdBbmltYXRlIGFyZSB1bmlxdWUgc2luY2UgdGhleSByZXF1aXJlIG5vIEphdmFTY3JpcHQgY29kZSBhdCBhbGwuIEJ5IHVzaW5nIGEgQ1NTIGNsYXNzIHRoYXQgd2UgcmVmZXJlbmNlIGJldHdlZW4gb3VyIEhUTUxcbiAqIGFuZCBDU1MgY29kZSB3ZSBjYW4gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aGF0IHdpbGwgYmUgcGlja2VkIHVwIGJ5IEFuZ3VsYXIgd2hlbiBhbiB0aGUgdW5kZXJseWluZyBkaXJlY3RpdmUgcGVyZm9ybXMgYW4gb3BlcmF0aW9uLlxuICpcbiAqIFRoZSBleGFtcGxlIGJlbG93IHNob3dzIGhvdyBhbiBgZW50ZXJgIGFuaW1hdGlvbiBjYW4gYmUgbWFkZSBwb3NzaWJsZSBvbiBhbiBlbGVtZW50IHVzaW5nIGBuZy1pZmA6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBuZy1pZj1cImJvb2xcIiBjbGFzcz1cImZhZGVcIj5cbiAqICAgIEZhZGUgbWUgaW4gb3V0XG4gKiA8L2Rpdj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJib29sPXRydWVcIj5GYWRlIEluITwvYnV0dG9uPlxuICogPGJ1dHRvbiBuZy1jbGljaz1cImJvb2w9ZmFsc2VcIj5GYWRlIE91dCE8L2J1dHRvbj5cbiAqIGBgYFxuICpcbiAqIE5vdGljZSB0aGUgQ1NTIGNsYXNzICoqZmFkZSoqPyBXZSBjYW4gbm93IGNyZWF0ZSB0aGUgQ1NTIHRyYW5zaXRpb24gY29kZSB0aGF0IHJlZmVyZW5jZXMgdGhpcyBjbGFzczpcbiAqXG4gKiBgYGBjc3NcbiAqIC8mIzQyOyBUaGUgc3RhcnRpbmcgQ1NTIHN0eWxlcyBmb3IgdGhlIGVudGVyIGFuaW1hdGlvbiAmIzQyOy9cbiAqIC5mYWRlLm5nLWVudGVyIHtcbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiAgIG9wYWNpdHk6MDtcbiAqIH1cbiAqXG4gKiAvJiM0MjsgVGhlIGZpbmlzaGluZyBDU1Mgc3R5bGVzIGZvciB0aGUgZW50ZXIgYW5pbWF0aW9uICYjNDI7L1xuICogLmZhZGUubmctZW50ZXIubmctZW50ZXItYWN0aXZlIHtcbiAqICAgb3BhY2l0eToxO1xuICogfVxuICogYGBgXG4gKlxuICogVGhlIGtleSB0aGluZyB0byByZW1lbWJlciBoZXJlIGlzIHRoYXQsIGRlcGVuZGluZyBvbiB0aGUgYW5pbWF0aW9uIGV2ZW50ICh3aGljaCBlYWNoIG9mIHRoZSBkaXJlY3RpdmVzIGFib3ZlIHRyaWdnZXIgZGVwZW5kaW5nIG9uIHdoYXQncyBnb2luZyBvbikgdHdvXG4gKiBnZW5lcmF0ZWQgQ1NTIGNsYXNzZXMgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50OyBpbiB0aGUgZXhhbXBsZSBhYm92ZSB3ZSBoYXZlIGAubmctZW50ZXJgIGFuZCBgLm5nLWVudGVyLWFjdGl2ZWAuIEZvciBDU1MgdHJhbnNpdGlvbnMsIHRoZSB0cmFuc2l0aW9uXG4gKiBjb2RlICoqbXVzdCoqIGJlIGRlZmluZWQgd2l0aGluIHRoZSBzdGFydGluZyBDU1MgY2xhc3MgKGluIHRoaXMgY2FzZSBgLm5nLWVudGVyYCkuIFRoZSBkZXN0aW5hdGlvbiBjbGFzcyBpcyB3aGF0IHRoZSB0cmFuc2l0aW9uIHdpbGwgYW5pbWF0ZSB0b3dhcmRzLlxuICpcbiAqIElmIGZvciBleGFtcGxlIHdlIHdhbnRlZCB0byBjcmVhdGUgYW5pbWF0aW9ucyBmb3IgYGxlYXZlYCBhbmQgYG1vdmVgIChuZ1JlcGVhdCB0cmlnZ2VycyBtb3ZlKSB0aGVuIHdlIGNhbiBkbyBzbyB1c2luZyB0aGUgc2FtZSBDU1MgbmFtaW5nIGNvbnZlbnRpb25zOlxuICpcbiAqIGBgYGNzc1xuICogLyYjNDI7IG5vdyB0aGUgZWxlbWVudCB3aWxsIGZhZGUgb3V0IGJlZm9yZSBpdCBpcyByZW1vdmVkIGZyb20gdGhlIERPTSAmIzQyOy9cbiAqIC5mYWRlLm5nLWxlYXZlIHtcbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiAgIG9wYWNpdHk6MTtcbiAqIH1cbiAqIC5mYWRlLm5nLWxlYXZlLm5nLWxlYXZlLWFjdGl2ZSB7XG4gKiAgIG9wYWNpdHk6MDtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFdlIGNhbiBhbHNvIG1ha2UgdXNlIG9mICoqQ1NTIEtleWZyYW1lcyoqIGJ5IHJlZmVyZW5jaW5nIHRoZSBrZXlmcmFtZSBhbmltYXRpb24gd2l0aGluIHRoZSBzdGFydGluZyBDU1MgY2xhc3M6XG4gKlxuICogYGBgY3NzXG4gKiAvJiM0MjsgdGhlcmUgaXMgbm8gbmVlZCB0byBkZWZpbmUgYW55dGhpbmcgaW5zaWRlIG9mIHRoZSBkZXN0aW5hdGlvblxuICogQ1NTIGNsYXNzIHNpbmNlIHRoZSBrZXlmcmFtZSB3aWxsIHRha2UgY2hhcmdlIG9mIHRoZSBhbmltYXRpb24gJiM0MjsvXG4gKiAuZmFkZS5uZy1sZWF2ZSB7XG4gKiAgIGFuaW1hdGlvbjogbXlfZmFkZV9hbmltYXRpb24gMC41cyBsaW5lYXI7XG4gKiAgIC13ZWJraXQtYW5pbWF0aW9uOiBteV9mYWRlX2FuaW1hdGlvbiAwLjVzIGxpbmVhcjtcbiAqIH1cbiAqXG4gKiBAa2V5ZnJhbWVzIG15X2ZhZGVfYW5pbWF0aW9uIHtcbiAqICAgZnJvbSB7IG9wYWNpdHk6MTsgfVxuICogICB0byB7IG9wYWNpdHk6MDsgfVxuICogfVxuICpcbiAqIEAtd2Via2l0LWtleWZyYW1lcyBteV9mYWRlX2FuaW1hdGlvbiB7XG4gKiAgIGZyb20geyBvcGFjaXR5OjE7IH1cbiAqICAgdG8geyBvcGFjaXR5OjA7IH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEZlZWwgZnJlZSBhbHNvIG1peCB0cmFuc2l0aW9ucyBhbmQga2V5ZnJhbWVzIHRvZ2V0aGVyIGFzIHdlbGwgYXMgYW55IG90aGVyIENTUyBjbGFzc2VzIG9uIHRoZSBzYW1lIGVsZW1lbnQuXG4gKlxuICogIyMjIENTUyBDbGFzcy1iYXNlZCBBbmltYXRpb25zXG4gKlxuICogQ2xhc3MtYmFzZWQgYW5pbWF0aW9ucyAoYW5pbWF0aW9ucyB0aGF0IGFyZSB0cmlnZ2VyZWQgdmlhIGBuZ0NsYXNzYCwgYG5nU2hvd2AsIGBuZ0hpZGVgIGFuZCBzb21lIG90aGVyIGRpcmVjdGl2ZXMpIGhhdmUgYSBzbGlnaHRseSBkaWZmZXJlbnRcbiAqIG5hbWluZyBjb252ZW50aW9uLiBDbGFzcy1iYXNlZCBhbmltYXRpb25zIGFyZSBiYXNpYyBlbm91Z2ggdGhhdCBhIHN0YW5kYXJkIHRyYW5zaXRpb24gb3Iga2V5ZnJhbWUgY2FuIGJlIHJlZmVyZW5jZWQgb24gdGhlIGNsYXNzIGJlaW5nIGFkZGVkXG4gKiBhbmQgcmVtb3ZlZC5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB3ZSB3YW50ZWQgdG8gZG8gYSBDU1MgYW5pbWF0aW9uIGZvciBgbmdIaWRlYCB0aGVuIHdlIHBsYWNlIGFuIGFuaW1hdGlvbiBvbiB0aGUgYC5uZy1oaWRlYCBDU1MgY2xhc3M6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBuZy1zaG93PVwiYm9vbFwiIGNsYXNzPVwiZmFkZVwiPlxuICogICBTaG93IGFuZCBoaWRlIG1lXG4gKiA8L2Rpdj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJib29sPXRydWVcIj5Ub2dnbGU8L2J1dHRvbj5cbiAqXG4gKiA8c3R5bGU+XG4gKiAuZmFkZS5uZy1oaWRlIHtcbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiAgIG9wYWNpdHk6MDtcbiAqIH1cbiAqIDwvc3R5bGU+XG4gKiBgYGBcbiAqXG4gKiBBbGwgdGhhdCBpcyBnb2luZyBvbiBoZXJlIHdpdGggbmdTaG93L25nSGlkZSBiZWhpbmQgdGhlIHNjZW5lcyBpcyB0aGUgYC5uZy1oaWRlYCBjbGFzcyBpcyBhZGRlZC9yZW1vdmVkICh3aGVuIHRoZSBoaWRkZW4gc3RhdGUgaXMgdmFsaWQpLiBTaW5jZVxuICogbmdTaG93IGFuZCBuZ0hpZGUgYXJlIGFuaW1hdGlvbiBhd2FyZSB0aGVuIHdlIGNhbiBtYXRjaCB1cCBhIHRyYW5zaXRpb24gYW5kIG5nQW5pbWF0ZSBoYW5kbGVzIHRoZSByZXN0LlxuICpcbiAqIEluIGFkZGl0aW9uIHRoZSBhZGRpdGlvbiBhbmQgcmVtb3ZhbCBvZiB0aGUgQ1NTIGNsYXNzLCBuZ0FuaW1hdGUgYWxzbyBwcm92aWRlcyB0d28gaGVscGVyIG1ldGhvZHMgdGhhdCB3ZSBjYW4gdXNlIHRvIGZ1cnRoZXIgZGVjb3JhdGUgdGhlIGFuaW1hdGlvblxuICogd2l0aCBDU1Mgc3R5bGVzLlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgbmctY2xhc3M9XCJ7b246b25PZmZ9XCIgY2xhc3M9XCJoaWdobGlnaHRcIj5cbiAqICAgSGlnaGxpZ2h0IHRoaXMgYm94XG4gKiA8L2Rpdj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJvbk9mZj0hb25PZmZcIj5Ub2dnbGU8L2J1dHRvbj5cbiAqXG4gKiA8c3R5bGU+XG4gKiAuaGlnaGxpZ2h0IHtcbiAqICAgdHJhbnNpdGlvbjowLjVzIGxpbmVhciBhbGw7XG4gKiB9XG4gKiAuaGlnaGxpZ2h0Lm9uLWFkZCB7XG4gKiAgIGJhY2tncm91bmQ6d2hpdGU7XG4gKiB9XG4gKiAuaGlnaGxpZ2h0Lm9uIHtcbiAqICAgYmFja2dyb3VuZDp5ZWxsb3c7XG4gKiB9XG4gKiAuaGlnaGxpZ2h0Lm9uLXJlbW92ZSB7XG4gKiAgIGJhY2tncm91bmQ6YmxhY2s7XG4gKiB9XG4gKiA8L3N0eWxlPlxuICogYGBgXG4gKlxuICogV2UgY2FuIGFsc28gbWFrZSB1c2Ugb2YgQ1NTIGtleWZyYW1lcyBieSBwbGFjaW5nIHRoZW0gd2l0aGluIHRoZSBDU1MgY2xhc3Nlcy5cbiAqXG4gKlxuICogIyMjIENTUyBTdGFnZ2VyaW5nIEFuaW1hdGlvbnNcbiAqIEEgU3RhZ2dlcmluZyBhbmltYXRpb24gaXMgYSBjb2xsZWN0aW9uIG9mIGFuaW1hdGlvbnMgdGhhdCBhcmUgaXNzdWVkIHdpdGggYSBzbGlnaHQgZGVsYXkgaW4gYmV0d2VlbiBlYWNoIHN1Y2Nlc3NpdmUgb3BlcmF0aW9uIHJlc3VsdGluZyBpbiBhXG4gKiBjdXJ0YWluLWxpa2UgZWZmZWN0LiBUaGUgbmdBbmltYXRlIG1vZHVsZSAodmVyc2lvbnMgPj0xLjIpIHN1cHBvcnRzIHN0YWdnZXJpbmcgYW5pbWF0aW9ucyBhbmQgdGhlIHN0YWdnZXIgZWZmZWN0IGNhbiBiZVxuICogcGVyZm9ybWVkIGJ5IGNyZWF0aW5nIGEgKipuZy1FVkVOVC1zdGFnZ2VyKiogQ1NTIGNsYXNzIGFuZCBhdHRhY2hpbmcgdGhhdCBjbGFzcyB0byB0aGUgYmFzZSBDU1MgY2xhc3MgdXNlZCBmb3JcbiAqIHRoZSBhbmltYXRpb24uIFRoZSBzdHlsZSBwcm9wZXJ0eSBleHBlY3RlZCB3aXRoaW4gdGhlIHN0YWdnZXIgY2xhc3MgY2FuIGVpdGhlciBiZSBhICoqdHJhbnNpdGlvbi1kZWxheSoqIG9yIGFuXG4gKiAqKmFuaW1hdGlvbi1kZWxheSoqIHByb3BlcnR5IChvciBib3RoIGlmIHlvdXIgYW5pbWF0aW9uIGNvbnRhaW5zIGJvdGggdHJhbnNpdGlvbnMgYW5kIGtleWZyYW1lIGFuaW1hdGlvbnMpLlxuICpcbiAqIGBgYGNzc1xuICogLm15LWFuaW1hdGlvbi5uZy1lbnRlciB7XG4gKiAgIC8mIzQyOyBzdGFuZGFyZCB0cmFuc2l0aW9uIGNvZGUgJiM0MjsvXG4gKiAgIHRyYW5zaXRpb246IDFzIGxpbmVhciBhbGw7XG4gKiAgIG9wYWNpdHk6MDtcbiAqIH1cbiAqIC5teS1hbmltYXRpb24ubmctZW50ZXItc3RhZ2dlciB7XG4gKiAgIC8mIzQyOyB0aGlzIHdpbGwgaGF2ZSBhIDEwMG1zIGRlbGF5IGJldHdlZW4gZWFjaCBzdWNjZXNzaXZlIGxlYXZlIGFuaW1hdGlvbiAmIzQyOy9cbiAqICAgdHJhbnNpdGlvbi1kZWxheTogMC4xcztcbiAqXG4gKiAgIC8mIzQyOyBBcyBvZiAxLjQuNCwgdGhpcyBtdXN0IGFsd2F5cyBiZSBzZXQ6IGl0IHNpZ25hbHMgbmdBbmltYXRlXG4gKiAgICAgdG8gbm90IGFjY2lkZW50YWxseSBpbmhlcml0IGEgZGVsYXkgcHJvcGVydHkgZnJvbSBhbm90aGVyIENTUyBjbGFzcyAmIzQyOy9cbiAqICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMHM7XG4gKiB9XG4gKiAubXktYW5pbWF0aW9uLm5nLWVudGVyLm5nLWVudGVyLWFjdGl2ZSB7XG4gKiAgIC8mIzQyOyBzdGFuZGFyZCB0cmFuc2l0aW9uIHN0eWxlcyAmIzQyOy9cbiAqICAgb3BhY2l0eToxO1xuICogfVxuICogYGBgXG4gKlxuICogU3RhZ2dlcmluZyBhbmltYXRpb25zIHdvcmsgYnkgZGVmYXVsdCBpbiBuZ1JlcGVhdCAoc28gbG9uZyBhcyB0aGUgQ1NTIGNsYXNzIGlzIGRlZmluZWQpLiBPdXRzaWRlIG9mIG5nUmVwZWF0LCB0byB1c2Ugc3RhZ2dlcmluZyBhbmltYXRpb25zXG4gKiBvbiB5b3VyIG93biwgdGhleSBjYW4gYmUgdHJpZ2dlcmVkIGJ5IGZpcmluZyBtdWx0aXBsZSBjYWxscyB0byB0aGUgc2FtZSBldmVudCBvbiAkYW5pbWF0ZS4gSG93ZXZlciwgdGhlIHJlc3RyaWN0aW9ucyBzdXJyb3VuZGluZyB0aGlzXG4gKiBhcmUgdGhhdCBlYWNoIG9mIHRoZSBlbGVtZW50cyBtdXN0IGhhdmUgdGhlIHNhbWUgQ1NTIGNsYXNzTmFtZSB2YWx1ZSBhcyB3ZWxsIGFzIHRoZSBzYW1lIHBhcmVudCBlbGVtZW50LiBBIHN0YWdnZXIgb3BlcmF0aW9uXG4gKiB3aWxsIGFsc28gYmUgcmVzZXQgaWYgb25lIG9yIG1vcmUgYW5pbWF0aW9uIGZyYW1lcyBoYXZlIHBhc3NlZCBzaW5jZSB0aGUgbXVsdGlwbGUgY2FsbHMgdG8gYCRhbmltYXRlYCB3ZXJlIGZpcmVkLlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgY29kZSB3aWxsIGlzc3VlIHRoZSAqKm5nLWxlYXZlLXN0YWdnZXIqKiBldmVudCBvbiB0aGUgZWxlbWVudCBwcm92aWRlZDpcbiAqXG4gKiBgYGBqc1xuICogdmFyIGtpZHMgPSBwYXJlbnQuY2hpbGRyZW4oKTtcbiAqXG4gKiAkYW5pbWF0ZS5sZWF2ZShraWRzWzBdKTsgLy9zdGFnZ2VyIGluZGV4PTBcbiAqICRhbmltYXRlLmxlYXZlKGtpZHNbMV0pOyAvL3N0YWdnZXIgaW5kZXg9MVxuICogJGFuaW1hdGUubGVhdmUoa2lkc1syXSk7IC8vc3RhZ2dlciBpbmRleD0yXG4gKiAkYW5pbWF0ZS5sZWF2ZShraWRzWzNdKTsgLy9zdGFnZ2VyIGluZGV4PTNcbiAqICRhbmltYXRlLmxlYXZlKGtpZHNbNF0pOyAvL3N0YWdnZXIgaW5kZXg9NFxuICpcbiAqIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gKiAgIC8vc3RhZ2dlciBoYXMgcmVzZXQgaXRzZWxmXG4gKiAgICRhbmltYXRlLmxlYXZlKGtpZHNbNV0pOyAvL3N0YWdnZXIgaW5kZXg9MFxuICogICAkYW5pbWF0ZS5sZWF2ZShraWRzWzZdKTsgLy9zdGFnZ2VyIGluZGV4PTFcbiAqXG4gKiAgICRzY29wZS4kZGlnZXN0KCk7XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIFN0YWdnZXIgYW5pbWF0aW9ucyBhcmUgY3VycmVudGx5IG9ubHkgc3VwcG9ydGVkIHdpdGhpbiBDU1MtZGVmaW5lZCBhbmltYXRpb25zLlxuICpcbiAqICMjIyBUaGUgYG5nLWFuaW1hdGVgIENTUyBjbGFzc1xuICpcbiAqIFdoZW4gbmdBbmltYXRlIGlzIGFuaW1hdGluZyBhbiBlbGVtZW50IGl0IHdpbGwgYXBwbHkgdGhlIGBuZy1hbmltYXRlYCBDU1MgY2xhc3MgdG8gdGhlIGVsZW1lbnQgZm9yIHRoZSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uLlxuICogVGhpcyBpcyBhIHRlbXBvcmFyeSBDU1MgY2xhc3MgYW5kIGl0IHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBhbmltYXRpb24gaXMgb3ZlciAoZm9yIGJvdGggSmF2YVNjcmlwdCBhbmQgQ1NTLWJhc2VkIGFuaW1hdGlvbnMpLlxuICpcbiAqIFRoZXJlZm9yZSwgYW5pbWF0aW9ucyBjYW4gYmUgYXBwbGllZCB0byBhbiBlbGVtZW50IHVzaW5nIHRoaXMgdGVtcG9yYXJ5IGNsYXNzIGRpcmVjdGx5IHZpYSBDU1MuXG4gKlxuICogYGBgY3NzXG4gKiAuemlwcGVyLm5nLWFuaW1hdGUge1xuICogICB0cmFuc2l0aW9uOjAuNXMgbGluZWFyIGFsbDtcbiAqIH1cbiAqIC56aXBwZXIubmctZW50ZXIge1xuICogICBvcGFjaXR5OjA7XG4gKiB9XG4gKiAuemlwcGVyLm5nLWVudGVyLm5nLWVudGVyLWFjdGl2ZSB7XG4gKiAgIG9wYWNpdHk6MTtcbiAqIH1cbiAqIC56aXBwZXIubmctbGVhdmUge1xuICogICBvcGFjaXR5OjE7XG4gKiB9XG4gKiAuemlwcGVyLm5nLWxlYXZlLm5nLWxlYXZlLWFjdGl2ZSB7XG4gKiAgIG9wYWNpdHk6MDtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIChOb3RlIHRoYXQgdGhlIGBuZy1hbmltYXRlYCBDU1MgY2xhc3MgaXMgcmVzZXJ2ZWQgYW5kIGl0IGNhbm5vdCBiZSBhcHBsaWVkIG9uIGFuIGVsZW1lbnQgZGlyZWN0bHkgc2luY2UgbmdBbmltYXRlIHdpbGwgYWx3YXlzIHJlbW92ZVxuICogdGhlIENTUyBjbGFzcyBvbmNlIGFuIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLilcbiAqXG4gKlxuICogIyMjIFRoZSBgbmctW2V2ZW50XS1wcmVwYXJlYCBjbGFzc1xuICpcbiAqIFRoaXMgaXMgYSBzcGVjaWFsIGNsYXNzIHRoYXQgY2FuIGJlIHVzZWQgdG8gcHJldmVudCB1bndhbnRlZCBmbGlja2VyaW5nIC8gZmxhc2ggb2YgY29udGVudCBiZWZvcmVcbiAqIHRoZSBhY3R1YWwgYW5pbWF0aW9uIHN0YXJ0cy4gVGhlIGNsYXNzIGlzIGFkZGVkIGFzIHNvb24gYXMgYW4gYW5pbWF0aW9uIGlzIGluaXRpYWxpemVkLCBidXQgcmVtb3ZlZFxuICogYmVmb3JlIHRoZSBhY3R1YWwgYW5pbWF0aW9uIHN0YXJ0cyAoYWZ0ZXIgd2FpdGluZyBmb3IgYSAkZGlnZXN0KS5cbiAqIEl0IGlzIGFsc28gb25seSBhZGRlZCBmb3IgKnN0cnVjdHVyYWwqIGFuaW1hdGlvbnMgKGBlbnRlcmAsIGBtb3ZlYCwgYW5kIGBsZWF2ZWApLlxuICpcbiAqIEluIHByYWN0aWNlLCBmbGlja2VyaW5nIGNhbiBhcHBlYXIgd2hlbiBuZXN0aW5nIGVsZW1lbnRzIHdpdGggc3RydWN0dXJhbCBhbmltYXRpb25zIHN1Y2ggYXMgYG5nSWZgXG4gKiBpbnRvIGVsZW1lbnRzIHRoYXQgaGF2ZSBjbGFzcy1iYXNlZCBhbmltYXRpb25zIHN1Y2ggYXMgYG5nQ2xhc3NgLlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgbmctY2xhc3M9XCJ7cmVkOiBteVByb3B9XCI+XG4gKiAgIDxkaXYgbmctY2xhc3M9XCJ7Ymx1ZTogbXlQcm9wfVwiPlxuICogICAgIDxkaXYgY2xhc3M9XCJtZXNzYWdlXCIgbmctaWY9XCJteVByb3BcIj48L2Rpdj5cbiAqICAgPC9kaXY+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRoYXQgZHVyaW5nIHRoZSBgZW50ZXJgIGFuaW1hdGlvbiwgdGhlIGAubWVzc2FnZWAgZGl2IHdpbGwgYmUgYnJpZWZseSB2aXNpYmxlIGJlZm9yZSBpdCBzdGFydHMgYW5pbWF0aW5nLlxuICogSW4gdGhhdCBjYXNlLCB5b3UgY2FuIGFkZCBzdHlsZXMgdG8gdGhlIENTUyB0aGF0IG1ha2Ugc3VyZSB0aGUgZWxlbWVudCBzdGF5cyBoaWRkZW4gYmVmb3JlIHRoZSBhbmltYXRpb24gc3RhcnRzOlxuICpcbiAqIGBgYGNzc1xuICogLm1lc3NhZ2UubmctZW50ZXItcHJlcGFyZSB7XG4gKiAgIG9wYWNpdHk6IDA7XG4gKiB9XG4gKlxuICogYGBgXG4gKlxuICogIyMgSmF2YVNjcmlwdC1iYXNlZCBBbmltYXRpb25zXG4gKlxuICogbmdBbmltYXRlIGFsc28gYWxsb3dzIGZvciBhbmltYXRpb25zIHRvIGJlIGNvbnN1bWVkIGJ5IEphdmFTY3JpcHQgY29kZS4gVGhlIGFwcHJvYWNoIGlzIHNpbWlsYXIgdG8gQ1NTLWJhc2VkIGFuaW1hdGlvbnMgKHdoZXJlIHRoZXJlIGlzIGEgc2hhcmVkXG4gKiBDU1MgY2xhc3MgdGhhdCBpcyByZWZlcmVuY2VkIGluIG91ciBIVE1MIGNvZGUpIGJ1dCBpbiBhZGRpdGlvbiB3ZSBuZWVkIHRvIHJlZ2lzdGVyIHRoZSBKYXZhU2NyaXB0IGFuaW1hdGlvbiBvbiB0aGUgbW9kdWxlLiBCeSBtYWtpbmcgdXNlIG9mIHRoZVxuICogYG1vZHVsZS5hbmltYXRpb24oKWAgbW9kdWxlIGZ1bmN0aW9uIHdlIGNhbiByZWdpc3RlciB0aGUgYW5pbWF0aW9uLlxuICpcbiAqIExldCdzIHNlZSBhbiBleGFtcGxlIG9mIGEgZW50ZXIvbGVhdmUgYW5pbWF0aW9uIHVzaW5nIGBuZ1JlcGVhdGA6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBuZy1yZXBlYXQ9XCJpdGVtIGluIGl0ZW1zXCIgY2xhc3M9XCJzbGlkZVwiPlxuICogICB7eyBpdGVtIH19XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFNlZSB0aGUgKipzbGlkZSoqIENTUyBjbGFzcz8gTGV0J3MgdXNlIHRoYXQgY2xhc3MgdG8gZGVmaW5lIGFuIGFuaW1hdGlvbiB0aGF0IHdlJ2xsIHN0cnVjdHVyZSBpbiBvdXIgbW9kdWxlIGNvZGUgYnkgdXNpbmcgYG1vZHVsZS5hbmltYXRpb25gOlxuICpcbiAqIGBgYGpzXG4gKiBteU1vZHVsZS5hbmltYXRpb24oJy5zbGlkZScsIFtmdW5jdGlvbigpIHtcbiAqICAgcmV0dXJuIHtcbiAqICAgICAvLyBtYWtlIG5vdGUgdGhhdCBvdGhlciBldmVudHMgKGxpa2UgYWRkQ2xhc3MvcmVtb3ZlQ2xhc3MpXG4gKiAgICAgLy8gaGF2ZSBkaWZmZXJlbnQgZnVuY3Rpb24gaW5wdXQgcGFyYW1ldGVyc1xuICogICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50LCBkb25lRm4pIHtcbiAqICAgICAgIGpRdWVyeShlbGVtZW50KS5mYWRlSW4oMTAwMCwgZG9uZUZuKTtcbiAqXG4gKiAgICAgICAvLyByZW1lbWJlciB0byBjYWxsIGRvbmVGbiBzbyB0aGF0IGFuZ3VsYXJcbiAqICAgICAgIC8vIGtub3dzIHRoYXQgdGhlIGFuaW1hdGlvbiBoYXMgY29uY2x1ZGVkXG4gKiAgICAgfSxcbiAqXG4gKiAgICAgbW92ZTogZnVuY3Rpb24oZWxlbWVudCwgZG9uZUZuKSB7XG4gKiAgICAgICBqUXVlcnkoZWxlbWVudCkuZmFkZUluKDEwMDAsIGRvbmVGbik7XG4gKiAgICAgfSxcbiAqXG4gKiAgICAgbGVhdmU6IGZ1bmN0aW9uKGVsZW1lbnQsIGRvbmVGbikge1xuICogICAgICAgalF1ZXJ5KGVsZW1lbnQpLmZhZGVPdXQoMTAwMCwgZG9uZUZuKTtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1dKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBuaWNlIHRoaW5nIGFib3V0IEpTLWJhc2VkIGFuaW1hdGlvbnMgaXMgdGhhdCB3ZSBjYW4gaW5qZWN0IG90aGVyIHNlcnZpY2VzIGFuZCBtYWtlIHVzZSBvZiBhZHZhbmNlZCBhbmltYXRpb24gbGlicmFyaWVzIHN1Y2ggYXNcbiAqIGdyZWVuc29jay5qcyBhbmQgdmVsb2NpdHkuanMuXG4gKlxuICogSWYgb3VyIGFuaW1hdGlvbiBjb2RlIGNsYXNzLWJhc2VkIChtZWFuaW5nIHRoYXQgc29tZXRoaW5nIGxpa2UgYG5nQ2xhc3NgLCBgbmdIaWRlYCBhbmQgYG5nU2hvd2AgdHJpZ2dlcnMgaXQpIHRoZW4gd2UgY2FuIHN0aWxsIGRlZmluZVxuICogb3VyIGFuaW1hdGlvbnMgaW5zaWRlIG9mIHRoZSBzYW1lIHJlZ2lzdGVyZWQgYW5pbWF0aW9uLCBob3dldmVyLCB0aGUgZnVuY3Rpb24gaW5wdXQgYXJndW1lbnRzIGFyZSBhIGJpdCBkaWZmZXJlbnQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBuZy1jbGFzcz1cImNvbG9yXCIgY2xhc3M9XCJjb2xvcmZ1bFwiPlxuICogICB0aGlzIGJveCBpcyBtb29keVxuICogPC9kaXY+XG4gKiA8YnV0dG9uIG5nLWNsaWNrPVwiY29sb3I9J3JlZCdcIj5DaGFuZ2UgdG8gcmVkPC9idXR0b24+XG4gKiA8YnV0dG9uIG5nLWNsaWNrPVwiY29sb3I9J2JsdWUnXCI+Q2hhbmdlIHRvIGJsdWU8L2J1dHRvbj5cbiAqIDxidXR0b24gbmctY2xpY2s9XCJjb2xvcj0nZ3JlZW4nXCI+Q2hhbmdlIHRvIGdyZWVuPC9idXR0b24+XG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogbXlNb2R1bGUuYW5pbWF0aW9uKCcuY29sb3JmdWwnLCBbZnVuY3Rpb24oKSB7XG4gKiAgIHJldHVybiB7XG4gKiAgICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSwgZG9uZUZuKSB7XG4gKiAgICAgICAvLyBkbyBzb21lIGNvb2wgYW5pbWF0aW9uIGFuZCBjYWxsIHRoZSBkb25lRm5cbiAqICAgICB9LFxuICogICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUsIGRvbmVGbikge1xuICogICAgICAgLy8gZG8gc29tZSBjb29sIGFuaW1hdGlvbiBhbmQgY2FsbCB0aGUgZG9uZUZuXG4gKiAgICAgfSxcbiAqICAgICBzZXRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgYWRkZWRDbGFzcywgcmVtb3ZlZENsYXNzLCBkb25lRm4pIHtcbiAqICAgICAgIC8vIGRvIHNvbWUgY29vbCBhbmltYXRpb24gYW5kIGNhbGwgdGhlIGRvbmVGblxuICogICAgIH1cbiAqICAgfVxuICogfV0pO1xuICogYGBgXG4gKlxuICogIyMgQ1NTICsgSlMgQW5pbWF0aW9ucyBUb2dldGhlclxuICpcbiAqIEFuZ3VsYXJKUyAxLjQgYW5kIGhpZ2hlciBoYXMgdGFrZW4gc3RlcHMgdG8gbWFrZSB0aGUgYW1hbGdhbWF0aW9uIG9mIENTUyBhbmQgSlMgYW5pbWF0aW9ucyBtb3JlIGZsZXhpYmxlLiBIb3dldmVyLCB1bmxpa2UgZWFybGllciB2ZXJzaW9ucyBvZiBBbmd1bGFyLFxuICogZGVmaW5pbmcgQ1NTIGFuZCBKUyBhbmltYXRpb25zIHRvIHdvcmsgb2ZmIG9mIHRoZSBzYW1lIENTUyBjbGFzcyB3aWxsIG5vdCB3b3JrIGFueW1vcmUuIFRoZXJlZm9yZSB0aGUgZXhhbXBsZSBiZWxvdyB3aWxsIG9ubHkgcmVzdWx0IGluICoqSlMgYW5pbWF0aW9ucyB0YWtpbmdcbiAqIGNoYXJnZSBvZiB0aGUgYW5pbWF0aW9uKio6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBuZy1pZj1cImJvb2xcIiBjbGFzcz1cInNsaWRlXCI+XG4gKiAgIFNsaWRlIGluIGFuZCBvdXRcbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogYGBganNcbiAqIG15TW9kdWxlLmFuaW1hdGlvbignLnNsaWRlJywgW2Z1bmN0aW9uKCkge1xuICogICByZXR1cm4ge1xuICogICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50LCBkb25lRm4pIHtcbiAqICAgICAgIGpRdWVyeShlbGVtZW50KS5zbGlkZUluKDEwMDAsIGRvbmVGbik7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XSk7XG4gKiBgYGBcbiAqXG4gKiBgYGBjc3NcbiAqIC5zbGlkZS5uZy1lbnRlciB7XG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogICB0cmFuc2Zvcm06dHJhbnNsYXRlWSgtMTAwcHgpO1xuICogfVxuICogLnNsaWRlLm5nLWVudGVyLm5nLWVudGVyLWFjdGl2ZSB7XG4gKiAgIHRyYW5zZm9ybTp0cmFuc2xhdGVZKDApO1xuICogfVxuICogYGBgXG4gKlxuICogRG9lcyB0aGlzIG1lYW4gdGhhdCBDU1MgYW5kIEpTIGFuaW1hdGlvbnMgY2Fubm90IGJlIHVzZWQgdG9nZXRoZXI/IERvIEpTLWJhc2VkIGFuaW1hdGlvbnMgYWx3YXlzIGhhdmUgaGlnaGVyIHByaW9yaXR5PyBXZSBjYW4gbWFrZSB1cCBmb3IgdGhlXG4gKiBsYWNrIG9mIENTUyBhbmltYXRpb25zIGJ5IHVzaW5nIHRoZSBgJGFuaW1hdGVDc3NgIHNlcnZpY2UgdG8gdHJpZ2dlciBvdXIgb3duIHR3ZWFrZWQtb3V0LCBDU1MtYmFzZWQgYW5pbWF0aW9ucyBkaXJlY3RseSBmcm9tXG4gKiBvdXIgb3duIEpTLWJhc2VkIGFuaW1hdGlvbiBjb2RlOlxuICpcbiAqIGBgYGpzXG4gKiBteU1vZHVsZS5hbmltYXRpb24oJy5zbGlkZScsIFsnJGFuaW1hdGVDc3MnLCBmdW5jdGlvbigkYW5pbWF0ZUNzcykge1xuICogICByZXR1cm4ge1xuICogICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XG4qICAgICAgICAvLyB0aGlzIHdpbGwgdHJpZ2dlciBgLnNsaWRlLm5nLWVudGVyYCBhbmQgYC5zbGlkZS5uZy1lbnRlci1hY3RpdmVgLlxuICogICAgICAgcmV0dXJuICRhbmltYXRlQ3NzKGVsZW1lbnQsIHtcbiAqICAgICAgICAgZXZlbnQ6ICdlbnRlcicsXG4gKiAgICAgICAgIHN0cnVjdHVyYWw6IHRydWVcbiAqICAgICAgIH0pO1xuICogICAgIH1cbiAqICAgfVxuICogfV0pO1xuICogYGBgXG4gKlxuICogVGhlIG5pY2UgdGhpbmcgaGVyZSBpcyB0aGF0IHdlIGNhbiBzYXZlIGJhbmR3aWR0aCBieSBzdGlja2luZyB0byBvdXIgQ1NTLWJhc2VkIGFuaW1hdGlvbiBjb2RlIGFuZCB3ZSBkb24ndCBuZWVkIHRvIHJlbHkgb24gYSAzcmQtcGFydHkgYW5pbWF0aW9uIGZyYW1ld29yay5cbiAqXG4gKiBUaGUgYCRhbmltYXRlQ3NzYCBzZXJ2aWNlIGlzIHZlcnkgcG93ZXJmdWwgc2luY2Ugd2UgY2FuIGZlZWQgaW4gYWxsIGtpbmRzIG9mIGV4dHJhIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIGV2YWx1YXRlZCBhbmQgZmVkIGludG8gYSBDU1MgdHJhbnNpdGlvbiBvclxuICoga2V5ZnJhbWUgYW5pbWF0aW9uLiBGb3IgZXhhbXBsZSBpZiB3ZSB3YW50ZWQgdG8gYW5pbWF0ZSB0aGUgaGVpZ2h0IG9mIGFuIGVsZW1lbnQgd2hpbGUgYWRkaW5nIGFuZCByZW1vdmluZyBjbGFzc2VzIHRoZW4gd2UgY2FuIGRvIHNvIGJ5IHByb3ZpZGluZyB0aGF0XG4gKiBkYXRhIGludG8gYCRhbmltYXRlQ3NzYCBkaXJlY3RseTpcbiAqXG4gKiBgYGBqc1xuICogbXlNb2R1bGUuYW5pbWF0aW9uKCcuc2xpZGUnLCBbJyRhbmltYXRlQ3NzJywgZnVuY3Rpb24oJGFuaW1hdGVDc3MpIHtcbiAqICAgcmV0dXJuIHtcbiAqICAgICBlbnRlcjogZnVuY3Rpb24oZWxlbWVudCkge1xuICogICAgICAgcmV0dXJuICRhbmltYXRlQ3NzKGVsZW1lbnQsIHtcbiAqICAgICAgICAgZXZlbnQ6ICdlbnRlcicsXG4gKiAgICAgICAgIHN0cnVjdHVyYWw6IHRydWUsXG4gKiAgICAgICAgIGFkZENsYXNzOiAnbWFyb29uLXNldHRpbmcnLFxuICogICAgICAgICBmcm9tOiB7IGhlaWdodDowIH0sXG4gKiAgICAgICAgIHRvOiB7IGhlaWdodDogMjAwIH1cbiAqICAgICAgIH0pO1xuICogICAgIH1cbiAqICAgfVxuICogfV0pO1xuICogYGBgXG4gKlxuICogTm93IHdlIGNhbiBmaWxsIGluIHRoZSByZXN0IHZpYSBvdXIgdHJhbnNpdGlvbiBDU1MgY29kZTpcbiAqXG4gKiBgYGBjc3NcbiAqIC8mIzQyOyB0aGUgdHJhbnNpdGlvbiB0ZWxscyBuZ0FuaW1hdGUgdG8gbWFrZSB0aGUgYW5pbWF0aW9uIGhhcHBlbiAmIzQyOy9cbiAqIC5zbGlkZS5uZy1lbnRlciB7IHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsOyB9XG4gKlxuICogLyYjNDI7IHRoaXMgZXh0cmEgQ1NTIGNsYXNzIHdpbGwgYmUgYWJzb3JiZWQgaW50byB0aGUgdHJhbnNpdGlvblxuICogc2luY2UgdGhlICRhbmltYXRlQ3NzIGNvZGUgaXMgYWRkaW5nIHRoZSBjbGFzcyAmIzQyOy9cbiAqIC5tYXJvb24tc2V0dGluZyB7IGJhY2tncm91bmQ6cmVkOyB9XG4gKiBgYGBcbiAqXG4gKiBBbmQgYCRhbmltYXRlQ3NzYCB3aWxsIGZpZ3VyZSBvdXQgdGhlIHJlc3QuIEp1c3QgbWFrZSBzdXJlIHRvIGhhdmUgdGhlIGBkb25lKClgIGNhbGxiYWNrIGZpcmUgdGhlIGBkb25lRm5gIGZ1bmN0aW9uIHRvIHNpZ25hbCB3aGVuIHRoZSBhbmltYXRpb24gaXMgb3Zlci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHdoYXQncyBwb3NzaWJsZSBiZSBzdXJlIHRvIHZpc2l0IHRoZSB7QGxpbmsgbmdBbmltYXRlLiRhbmltYXRlQ3NzICRhbmltYXRlQ3NzIHNlcnZpY2V9LlxuICpcbiAqICMjIEFuaW1hdGlvbiBBbmNob3JpbmcgKHZpYSBgbmctYW5pbWF0ZS1yZWZgKVxuICpcbiAqIG5nQW5pbWF0ZSBpbiBBbmd1bGFySlMgMS40IGNvbWVzIHBhY2tlZCB3aXRoIHRoZSBhYmlsaXR5IHRvIGNyb3NzLWFuaW1hdGUgZWxlbWVudHMgYmV0d2VlblxuICogc3RydWN0dXJhbCBhcmVhcyBvZiBhbiBhcHBsaWNhdGlvbiAobGlrZSB2aWV3cykgYnkgcGFpcmluZyB1cCBlbGVtZW50cyB1c2luZyBhbiBhdHRyaWJ1dGVcbiAqIGNhbGxlZCBgbmctYW5pbWF0ZS1yZWZgLlxuICpcbiAqIExldCdzIHNheSBmb3IgZXhhbXBsZSB3ZSBoYXZlIHR3byB2aWV3cyB0aGF0IGFyZSBtYW5hZ2VkIGJ5IGBuZy12aWV3YCBhbmQgd2Ugd2FudCB0byBzaG93XG4gKiB0aGF0IHRoZXJlIGlzIGEgcmVsYXRpb25zaGlwIGJldHdlZW4gdHdvIGNvbXBvbmVudHMgc2l0dWF0ZWQgaW4gd2l0aGluIHRoZXNlIHZpZXdzLiBCeSB1c2luZyB0aGVcbiAqIGBuZy1hbmltYXRlLXJlZmAgYXR0cmlidXRlIHdlIGNhbiBpZGVudGlmeSB0aGF0IHRoZSB0d28gY29tcG9uZW50cyBhcmUgcGFpcmVkIHRvZ2V0aGVyIGFuZCB3ZVxuICogY2FuIHRoZW4gYXR0YWNoIGFuIGFuaW1hdGlvbiwgd2hpY2ggaXMgdHJpZ2dlcmVkIHdoZW4gdGhlIHZpZXcgY2hhbmdlcy5cbiAqXG4gKiBTYXkgZm9yIGV4YW1wbGUgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgaHRtbFxuICogPCEtLSBpbmRleC5odG1sIC0tPlxuICogPGRpdiBuZy12aWV3IGNsYXNzPVwidmlldy1hbmltYXRpb25cIj5cbiAqIDwvZGl2PlxuICpcbiAqIDwhLS0gaG9tZS5odG1sIC0tPlxuICogPGEgaHJlZj1cIiMvYmFubmVyLXBhZ2VcIj5cbiAqICAgPGltZyBzcmM9XCIuL2Jhbm5lci5qcGdcIiBjbGFzcz1cImJhbm5lclwiIG5nLWFuaW1hdGUtcmVmPVwiYmFubmVyXCI+XG4gKiA8L2E+XG4gKlxuICogPCEtLSBiYW5uZXItcGFnZS5odG1sIC0tPlxuICogPGltZyBzcmM9XCIuL2Jhbm5lci5qcGdcIiBjbGFzcz1cImJhbm5lclwiIG5nLWFuaW1hdGUtcmVmPVwiYmFubmVyXCI+XG4gKiBgYGBcbiAqXG4gKiBOb3csIHdoZW4gdGhlIHZpZXcgY2hhbmdlcyAob25jZSB0aGUgbGluayBpcyBjbGlja2VkKSwgbmdBbmltYXRlIHdpbGwgZXhhbWluZSB0aGVcbiAqIEhUTUwgY29udGVudHMgdG8gc2VlIGlmIHRoZXJlIGlzIGEgbWF0Y2ggcmVmZXJlbmNlIGJldHdlZW4gYW55IGNvbXBvbmVudHMgaW4gdGhlIHZpZXdcbiAqIHRoYXQgaXMgbGVhdmluZyBhbmQgdGhlIHZpZXcgdGhhdCBpcyBlbnRlcmluZy4gSXQgd2lsbCBzY2FuIGJvdGggdGhlIHZpZXcgd2hpY2ggaXMgYmVpbmdcbiAqIHJlbW92ZWQgKGxlYXZlKSBhbmQgaW5zZXJ0ZWQgKGVudGVyKSB0byBzZWUgaWYgdGhlcmUgYXJlIGFueSBwYWlyZWQgRE9NIGVsZW1lbnRzIHRoYXRcbiAqIGNvbnRhaW4gYSBtYXRjaGluZyByZWYgdmFsdWUuXG4gKlxuICogVGhlIHR3byBpbWFnZXMgbWF0Y2ggc2luY2UgdGhleSBzaGFyZSB0aGUgc2FtZSByZWYgdmFsdWUuIG5nQW5pbWF0ZSB3aWxsIG5vdyBjcmVhdGUgYVxuICogdHJhbnNwb3J0IGVsZW1lbnQgKHdoaWNoIGlzIGEgY2xvbmUgb2YgdGhlIGZpcnN0IGltYWdlIGVsZW1lbnQpIGFuZCBpdCB3aWxsIHRoZW4gYXR0ZW1wdFxuICogdG8gYW5pbWF0ZSB0byB0aGUgcG9zaXRpb24gb2YgdGhlIHNlY29uZCBpbWFnZSBlbGVtZW50IGluIHRoZSBuZXh0IHZpZXcuIEZvciB0aGUgYW5pbWF0aW9uIHRvXG4gKiB3b3JrIGEgc3BlY2lhbCBDU1MgY2xhc3MgY2FsbGVkIGBuZy1hbmNob3JgIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHRyYW5zcG9ydGVkIGVsZW1lbnQuXG4gKlxuICogV2UgY2FuIG5vdyBhdHRhY2ggYSB0cmFuc2l0aW9uIG9udG8gdGhlIGAuYmFubmVyLm5nLWFuY2hvcmAgQ1NTIGNsYXNzIGFuZCB0aGVuXG4gKiBuZ0FuaW1hdGUgd2lsbCBoYW5kbGUgdGhlIGVudGlyZSB0cmFuc2l0aW9uIGZvciB1cyBhcyB3ZWxsIGFzIHRoZSBhZGRpdGlvbiBhbmQgcmVtb3ZhbCBvZlxuICogYW55IGNoYW5nZXMgb2YgQ1NTIGNsYXNzZXMgYmV0d2VlbiB0aGUgZWxlbWVudHM6XG4gKlxuICogYGBgY3NzXG4gKiAuYmFubmVyLm5nLWFuY2hvciB7XG4gKiAgIC8mIzQyOyB0aGlzIGFuaW1hdGlvbiB3aWxsIGxhc3QgZm9yIDEgc2Vjb25kIHNpbmNlIHRoZXJlIGFyZVxuICogICAgICAgICAgdHdvIHBoYXNlcyB0byB0aGUgYW5pbWF0aW9uIChhbiBgaW5gIGFuZCBhbiBgb3V0YCBwaGFzZSkgJiM0MjsvXG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogfVxuICogYGBgXG4gKlxuICogV2UgYWxzbyAqKm11c3QqKiBpbmNsdWRlIGFuaW1hdGlvbnMgZm9yIHRoZSB2aWV3cyB0aGF0IGFyZSBiZWluZyBlbnRlcmVkIGFuZCByZW1vdmVkXG4gKiAob3RoZXJ3aXNlIGFuY2hvcmluZyB3b3VsZG4ndCBiZSBwb3NzaWJsZSBzaW5jZSB0aGUgbmV3IHZpZXcgd291bGQgYmUgaW5zZXJ0ZWQgcmlnaHQgYXdheSkuXG4gKlxuICogYGBgY3NzXG4gKiAudmlldy1hbmltYXRpb24ubmctZW50ZXIsIC52aWV3LWFuaW1hdGlvbi5uZy1sZWF2ZSB7XG4gKiAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICogICBwb3NpdGlvbjpmaXhlZDtcbiAqICAgbGVmdDowO1xuICogICB0b3A6MDtcbiAqICAgd2lkdGg6MTAwJTtcbiAqIH1cbiAqIC52aWV3LWFuaW1hdGlvbi5uZy1lbnRlciB7XG4gKiAgIHRyYW5zZm9ybTp0cmFuc2xhdGVYKDEwMCUpO1xuICogfVxuICogLnZpZXctYW5pbWF0aW9uLm5nLWxlYXZlLFxuICogLnZpZXctYW5pbWF0aW9uLm5nLWVudGVyLm5nLWVudGVyLWFjdGl2ZSB7XG4gKiAgIHRyYW5zZm9ybTp0cmFuc2xhdGVYKDAlKTtcbiAqIH1cbiAqIC52aWV3LWFuaW1hdGlvbi5uZy1sZWF2ZS5uZy1sZWF2ZS1hY3RpdmUge1xuICogICB0cmFuc2Zvcm06dHJhbnNsYXRlWCgtMTAwJSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBOb3cgd2UgY2FuIGp1bXAgYmFjayB0byB0aGUgYW5jaG9yIGFuaW1hdGlvbi4gV2hlbiB0aGUgYW5pbWF0aW9uIGhhcHBlbnMsIHRoZXJlIGFyZSB0d28gc3RhZ2VzIHRoYXQgb2NjdXI6XG4gKiBhbiBgb3V0YCBhbmQgYW4gYGluYCBzdGFnZS4gVGhlIGBvdXRgIHN0YWdlIGhhcHBlbnMgZmlyc3QgYW5kIHRoYXQgaXMgd2hlbiB0aGUgZWxlbWVudCBpcyBhbmltYXRlZCBhd2F5XG4gKiBmcm9tIGl0cyBvcmlnaW4uIE9uY2UgdGhhdCBhbmltYXRpb24gaXMgb3ZlciB0aGVuIHRoZSBgaW5gIHN0YWdlIG9jY3VycyB3aGljaCBhbmltYXRlcyB0aGVcbiAqIGVsZW1lbnQgdG8gaXRzIGRlc3RpbmF0aW9uLiBUaGUgcmVhc29uIHdoeSB0aGVyZSBhcmUgdHdvIGFuaW1hdGlvbnMgaXMgdG8gZ2l2ZSBlbm91Z2ggdGltZVxuICogZm9yIHRoZSBlbnRlciBhbmltYXRpb24gb24gdGhlIG5ldyBlbGVtZW50IHRvIGJlIHJlYWR5LlxuICpcbiAqIFRoZSBleGFtcGxlIGFib3ZlIHNldHMgdXAgYSB0cmFuc2l0aW9uIGZvciBib3RoIHRoZSBpbiBhbmQgb3V0IHBoYXNlcywgYnV0IHdlIGNhbiBhbHNvIHRhcmdldCB0aGUgb3V0IG9yXG4gKiBpbiBwaGFzZXMgZGlyZWN0bHkgdmlhIGBuZy1hbmNob3Itb3V0YCBhbmQgYG5nLWFuY2hvci1pbmAuXG4gKlxuICogYGBgY3NzXG4gKiAuYmFubmVyLm5nLWFuY2hvci1vdXQge1xuICogICB0cmFuc2l0aW9uOiAwLjVzIGxpbmVhciBhbGw7XG4gKlxuICogICAvJiM0MjsgdGhlIHNjYWxlIHdpbGwgYmUgYXBwbGllZCBkdXJpbmcgdGhlIG91dCBhbmltYXRpb24sXG4gKiAgICAgICAgICBidXQgd2lsbCBiZSBhbmltYXRlZCBhd2F5IHdoZW4gdGhlIGluIGFuaW1hdGlvbiBydW5zICYjNDI7L1xuICogICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XG4gKiB9XG4gKlxuICogLmJhbm5lci5uZy1hbmNob3ItaW4ge1xuICogICB0cmFuc2l0aW9uOiAxcyBsaW5lYXIgYWxsO1xuICogfVxuICogYGBgXG4gKlxuICpcbiAqXG4gKlxuICogIyMjIEFuY2hvcmluZyBEZW1vXG4gKlxuICA8ZXhhbXBsZSBtb2R1bGU9XCJhbmNob3JpbmdFeGFtcGxlXCJcbiAgICAgICAgICAgbmFtZT1cImFuY2hvcmluZ0V4YW1wbGVcIlxuICAgICAgICAgICBpZD1cImFuY2hvcmluZ0V4YW1wbGVcIlxuICAgICAgICAgICBkZXBzPVwiYW5ndWxhci1hbmltYXRlLmpzO2FuZ3VsYXItcm91dGUuanNcIlxuICAgICAgICAgICBhbmltYXRpb25zPVwidHJ1ZVwiPlxuICAgIDxmaWxlIG5hbWU9XCJpbmRleC5odG1sXCI+XG4gICAgICA8YSBocmVmPVwiIy9cIj5Ib21lPC9hPlxuICAgICAgPGhyIC8+XG4gICAgICA8ZGl2IGNsYXNzPVwidmlldy1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBuZy12aWV3IGNsYXNzPVwidmlld1wiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9maWxlPlxuICAgIDxmaWxlIG5hbWU9XCJzY3JpcHQuanNcIj5cbiAgICAgIGFuZ3VsYXIubW9kdWxlKCdhbmNob3JpbmdFeGFtcGxlJywgWyduZ0FuaW1hdGUnLCAnbmdSb3V0ZSddKVxuICAgICAgICAuY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCBmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAgICAgICAgICRyb3V0ZVByb3ZpZGVyLndoZW4oJy8nLCB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2hvbWUuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXIgYXMgaG9tZSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAkcm91dGVQcm92aWRlci53aGVuKCcvcHJvZmlsZS86aWQnLCB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3Byb2ZpbGUuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnUHJvZmlsZUNvbnRyb2xsZXIgYXMgcHJvZmlsZSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfV0pXG4gICAgICAgIC5ydW4oWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xuICAgICAgICAgICRyb290U2NvcGUucmVjb3JkcyA9IFtcbiAgICAgICAgICAgIHsgaWQ6MSwgdGl0bGU6IFwiTWlzcyBCZXVsYWggUm9vYlwiIH0sXG4gICAgICAgICAgICB7IGlkOjIsIHRpdGxlOiBcIlRyZW50IE1vcmlzc2V0dGVcIiB9LFxuICAgICAgICAgICAgeyBpZDozLCB0aXRsZTogXCJNaXNzIEF2YSBQb3Vyb3NcIiB9LFxuICAgICAgICAgICAgeyBpZDo0LCB0aXRsZTogXCJSb2QgUG91cm9zXCIgfSxcbiAgICAgICAgICAgIHsgaWQ6NSwgdGl0bGU6IFwiQWJkdWwgUmljZVwiIH0sXG4gICAgICAgICAgICB7IGlkOjYsIHRpdGxlOiBcIkxhdXJpZSBSdXRoZXJmb3JkIFNyLlwiIH0sXG4gICAgICAgICAgICB7IGlkOjcsIHRpdGxlOiBcIk5ha2lhIE1jTGF1Z2hsaW5cIiB9LFxuICAgICAgICAgICAgeyBpZDo4LCB0aXRsZTogXCJKb3Jkb24gQmxhbmRhIERWTVwiIH0sXG4gICAgICAgICAgICB7IGlkOjksIHRpdGxlOiBcIlJob2RhIEhhbmRcIiB9LFxuICAgICAgICAgICAgeyBpZDoxMCwgdGl0bGU6IFwiQWxleGFuZHJlYSBTYXVlclwiIH1cbiAgICAgICAgICBdO1xuICAgICAgICB9XSlcbiAgICAgICAgLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgW2Z1bmN0aW9uKCkge1xuICAgICAgICAgIC8vZW1wdHlcbiAgICAgICAgfV0pXG4gICAgICAgIC5jb250cm9sbGVyKCdQcm9maWxlQ29udHJvbGxlcicsIFsnJHJvb3RTY29wZScsICckcm91dGVQYXJhbXMnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkcm91dGVQYXJhbXMpIHtcbiAgICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludCgkcm91dGVQYXJhbXMuaWQsIDEwKTtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gJHJvb3RTY29wZS5yZWNvcmRzW2luZGV4IC0gMV07XG5cbiAgICAgICAgICB0aGlzLnRpdGxlID0gcmVjb3JkLnRpdGxlO1xuICAgICAgICAgIHRoaXMuaWQgPSByZWNvcmQuaWQ7XG4gICAgICAgIH1dKTtcbiAgICA8L2ZpbGU+XG4gICAgPGZpbGUgbmFtZT1cImhvbWUuaHRtbFwiPlxuICAgICAgPGgyPldlbGNvbWUgdG8gdGhlIGhvbWUgcGFnZTwvaDE+XG4gICAgICA8cD5QbGVhc2UgY2xpY2sgb24gYW4gZWxlbWVudDwvcD5cbiAgICAgIDxhIGNsYXNzPVwicmVjb3JkXCJcbiAgICAgICAgIG5nLWhyZWY9XCIjL3Byb2ZpbGUve3sgcmVjb3JkLmlkIH19XCJcbiAgICAgICAgIG5nLWFuaW1hdGUtcmVmPVwie3sgcmVjb3JkLmlkIH19XCJcbiAgICAgICAgIG5nLXJlcGVhdD1cInJlY29yZCBpbiByZWNvcmRzXCI+XG4gICAgICAgIHt7IHJlY29yZC50aXRsZSB9fVxuICAgICAgPC9hPlxuICAgIDwvZmlsZT5cbiAgICA8ZmlsZSBuYW1lPVwicHJvZmlsZS5odG1sXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicHJvZmlsZSByZWNvcmRcIiBuZy1hbmltYXRlLXJlZj1cInt7IHByb2ZpbGUuaWQgfX1cIj5cbiAgICAgICAge3sgcHJvZmlsZS50aXRsZSB9fVxuICAgICAgPC9kaXY+XG4gICAgPC9maWxlPlxuICAgIDxmaWxlIG5hbWU9XCJhbmltYXRpb25zLmNzc1wiPlxuICAgICAgLnJlY29yZCB7XG4gICAgICAgIGRpc3BsYXk6YmxvY2s7XG4gICAgICAgIGZvbnQtc2l6ZToyMHB4O1xuICAgICAgfVxuICAgICAgLnByb2ZpbGUge1xuICAgICAgICBiYWNrZ3JvdW5kOmJsYWNrO1xuICAgICAgICBjb2xvcjp3aGl0ZTtcbiAgICAgICAgZm9udC1zaXplOjEwMHB4O1xuICAgICAgfVxuICAgICAgLnZpZXctY29udGFpbmVyIHtcbiAgICAgICAgcG9zaXRpb246cmVsYXRpdmU7XG4gICAgICB9XG4gICAgICAudmlldy1jb250YWluZXIgPiAudmlldy5uZy1hbmltYXRlIHtcbiAgICAgICAgcG9zaXRpb246YWJzb2x1dGU7XG4gICAgICAgIHRvcDowO1xuICAgICAgICBsZWZ0OjA7XG4gICAgICAgIHdpZHRoOjEwMCU7XG4gICAgICAgIG1pbi1oZWlnaHQ6NTAwcHg7XG4gICAgICB9XG4gICAgICAudmlldy5uZy1lbnRlciwgLnZpZXcubmctbGVhdmUsXG4gICAgICAucmVjb3JkLm5nLWFuY2hvciB7XG4gICAgICAgIHRyYW5zaXRpb246MC41cyBsaW5lYXIgYWxsO1xuICAgICAgfVxuICAgICAgLnZpZXcubmctZW50ZXIge1xuICAgICAgICB0cmFuc2Zvcm06dHJhbnNsYXRlWCgxMDAlKTtcbiAgICAgIH1cbiAgICAgIC52aWV3Lm5nLWVudGVyLm5nLWVudGVyLWFjdGl2ZSwgLnZpZXcubmctbGVhdmUge1xuICAgICAgICB0cmFuc2Zvcm06dHJhbnNsYXRlWCgwJSk7XG4gICAgICB9XG4gICAgICAudmlldy5uZy1sZWF2ZS5uZy1sZWF2ZS1hY3RpdmUge1xuICAgICAgICB0cmFuc2Zvcm06dHJhbnNsYXRlWCgtMTAwJSk7XG4gICAgICB9XG4gICAgICAucmVjb3JkLm5nLWFuY2hvci1vdXQge1xuICAgICAgICBiYWNrZ3JvdW5kOnJlZDtcbiAgICAgIH1cbiAgICA8L2ZpbGU+XG4gIDwvZXhhbXBsZT5cbiAqXG4gKiAjIyMgSG93IGlzIHRoZSBlbGVtZW50IHRyYW5zcG9ydGVkP1xuICpcbiAqIFdoZW4gYW4gYW5jaG9yIGFuaW1hdGlvbiBvY2N1cnMsIG5nQW5pbWF0ZSB3aWxsIGNsb25lIHRoZSBzdGFydGluZyBlbGVtZW50IGFuZCBwb3NpdGlvbiBpdCBleGFjdGx5IHdoZXJlIHRoZSBzdGFydGluZ1xuICogZWxlbWVudCBpcyBsb2NhdGVkIG9uIHNjcmVlbiB2aWEgYWJzb2x1dGUgcG9zaXRpb25pbmcuIFRoZSBjbG9uZWQgZWxlbWVudCB3aWxsIGJlIHBsYWNlZCBpbnNpZGUgb2YgdGhlIHJvb3QgZWxlbWVudFxuICogb2YgdGhlIGFwcGxpY2F0aW9uICh3aGVyZSBuZy1hcHAgd2FzIGRlZmluZWQpIGFuZCBhbGwgb2YgdGhlIENTUyBjbGFzc2VzIG9mIHRoZSBzdGFydGluZyBlbGVtZW50IHdpbGwgYmUgYXBwbGllZC4gVGhlXG4gKiBlbGVtZW50IHdpbGwgdGhlbiBhbmltYXRlIGludG8gdGhlIGBvdXRgIGFuZCBgaW5gIGFuaW1hdGlvbnMgYW5kIHdpbGwgZXZlbnR1YWxseSByZWFjaCB0aGUgY29vcmRpbmF0ZXMgYW5kIG1hdGNoXG4gKiB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZGVzdGluYXRpb24gZWxlbWVudC4gRHVyaW5nIHRoZSBlbnRpcmUgYW5pbWF0aW9uIGEgQ1NTIGNsYXNzIG9mIGAubmctYW5pbWF0ZS1zaGltYCB3aWxsIGJlIGFwcGxpZWRcbiAqIHRvIGJvdGggdGhlIHN0YXJ0aW5nIGFuZCBkZXN0aW5hdGlvbiBlbGVtZW50cyBpbiBvcmRlciB0byBoaWRlIHRoZW0gZnJvbSBiZWluZyB2aXNpYmxlICh0aGUgQ1NTIHN0eWxpbmcgZm9yIHRoZSBjbGFzc1xuICogaXM6IGB2aXNpYmlsaXR5OmhpZGRlbmApLiBPbmNlIHRoZSBhbmNob3IgcmVhY2hlcyBpdHMgZGVzdGluYXRpb24gdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYW5kIHRoZSBkZXN0aW5hdGlvbiBlbGVtZW50XG4gKiB3aWxsIGJlY29tZSB2aXNpYmxlIHNpbmNlIHRoZSBzaGltIGNsYXNzIHdpbGwgYmUgcmVtb3ZlZC5cbiAqXG4gKiAjIyMgSG93IGlzIHRoZSBtb3JwaGluZyBoYW5kbGVkP1xuICpcbiAqIENTUyBBbmNob3JpbmcgcmVsaWVzIG9uIHRyYW5zaXRpb25zIGFuZCBrZXlmcmFtZXMgYW5kIHRoZSBpbnRlcm5hbCBjb2RlIGlzIGludGVsbGlnZW50IGVub3VnaCB0byBmaWd1cmUgb3V0XG4gKiB3aGF0IENTUyBjbGFzc2VzIGRpZmZlciBiZXR3ZWVuIHRoZSBzdGFydGluZyBlbGVtZW50IGFuZCB0aGUgZGVzdGluYXRpb24gZWxlbWVudC4gVGhlc2UgZGlmZmVyZW50IENTUyBjbGFzc2VzXG4gKiB3aWxsIGJlIGFkZGVkL3JlbW92ZWQgb24gdGhlIGFuY2hvciBlbGVtZW50IGFuZCBhIHRyYW5zaXRpb24gd2lsbCBiZSBhcHBsaWVkICh0aGUgdHJhbnNpdGlvbiB0aGF0IGlzIHByb3ZpZGVkXG4gKiBpbiB0aGUgYW5jaG9yIGNsYXNzKS4gTG9uZyBzdG9yeSBzaG9ydCwgbmdBbmltYXRlIHdpbGwgZmlndXJlIG91dCB3aGF0IGNsYXNzZXMgdG8gYWRkIGFuZCByZW1vdmUgd2hpY2ggd2lsbFxuICogbWFrZSB0aGUgdHJhbnNpdGlvbiBvZiB0aGUgZWxlbWVudCBhcyBzbW9vdGggYW5kIGF1dG9tYXRpYyBhcyBwb3NzaWJsZS4gQmUgc3VyZSB0byB1c2Ugc2ltcGxlIENTUyBjbGFzc2VzIHRoYXRcbiAqIGRvIG5vdCByZWx5IG9uIERPTSBuZXN0aW5nIHN0cnVjdHVyZSBzbyB0aGF0IHRoZSBhbmNob3IgZWxlbWVudCBhcHBlYXJzIHRoZSBzYW1lIGFzIHRoZSBzdGFydGluZyBlbGVtZW50IChzaW5jZVxuICogdGhlIGNsb25lZCBlbGVtZW50IGlzIHBsYWNlZCBpbnNpZGUgb2Ygcm9vdCBlbGVtZW50IHdoaWNoIGlzIGxpa2VseSBjbG9zZSB0byB0aGUgYm9keSBlbGVtZW50KS5cbiAqXG4gKiBOb3RlIHRoYXQgaWYgdGhlIHJvb3QgZWxlbWVudCBpcyBvbiB0aGUgYDxodG1sPmAgZWxlbWVudCB0aGVuIHRoZSBjbG9uZWQgbm9kZSB3aWxsIGJlIHBsYWNlZCBpbnNpZGUgb2YgYm9keS5cbiAqXG4gKlxuICogIyMgVXNpbmcgJGFuaW1hdGUgaW4geW91ciBkaXJlY3RpdmUgY29kZVxuICpcbiAqIFNvIGZhciB3ZSd2ZSBleHBsb3JlZCBob3cgdG8gZmVlZCBpbiBhbmltYXRpb25zIGludG8gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiwgYnV0IGhvdyBkbyB3ZSB0cmlnZ2VyIGFuaW1hdGlvbnMgd2l0aGluIG91ciBvd24gZGlyZWN0aXZlcyBpbiBvdXIgYXBwbGljYXRpb24/XG4gKiBCeSBpbmplY3RpbmcgdGhlIGAkYW5pbWF0ZWAgc2VydmljZSBpbnRvIG91ciBkaXJlY3RpdmUgY29kZSwgd2UgY2FuIHRyaWdnZXIgc3RydWN0dXJhbCBhbmQgY2xhc3MtYmFzZWQgaG9va3Mgd2hpY2ggY2FuIHRoZW4gYmUgY29uc3VtZWQgYnkgYW5pbWF0aW9ucy4gTGV0J3NcbiAqIGltYWdpbmUgd2UgaGF2ZSBhIGdyZWV0aW5nIGJveCB0aGF0IHNob3dzIGFuZCBoaWRlcyBpdHNlbGYgd2hlbiB0aGUgZGF0YSBjaGFuZ2VzXG4gKlxuICogYGBgaHRtbFxuICogPGdyZWV0aW5nLWJveCBhY3RpdmU9XCJvbk9yT2ZmXCI+SGkgdGhlcmU8L2dyZWV0aW5nLWJveD5cbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiBuZ01vZHVsZS5kaXJlY3RpdmUoJ2dyZWV0aW5nQm94JywgWyckYW5pbWF0ZScsIGZ1bmN0aW9uKCRhbmltYXRlKSB7XG4gKiAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAqICAgICBhdHRycy4kb2JzZXJ2ZSgnYWN0aXZlJywgZnVuY3Rpb24odmFsdWUpIHtcbiAqICAgICAgIHZhbHVlID8gJGFuaW1hdGUuYWRkQ2xhc3MoZWxlbWVudCwgJ29uJykgOiAkYW5pbWF0ZS5yZW1vdmVDbGFzcyhlbGVtZW50LCAnb24nKTtcbiAqICAgICB9KTtcbiAqICAgfSk7XG4gKiB9XSk7XG4gKiBgYGBcbiAqXG4gKiBOb3cgdGhlIGBvbmAgQ1NTIGNsYXNzIGlzIGFkZGVkIGFuZCByZW1vdmVkIG9uIHRoZSBncmVldGluZyBib3ggY29tcG9uZW50LiBOb3cgaWYgd2UgYWRkIGEgQ1NTIGNsYXNzIG9uIHRvcCBvZiB0aGUgZ3JlZXRpbmcgYm94IGVsZW1lbnRcbiAqIGluIG91ciBIVE1MIGNvZGUgdGhlbiB3ZSBjYW4gdHJpZ2dlciBhIENTUyBvciBKUyBhbmltYXRpb24gdG8gaGFwcGVuLlxuICpcbiAqIGBgYGNzc1xuICogLyYjNDI7IG5vcm1hbGx5IHdlIHdvdWxkIGNyZWF0ZSBhIENTUyBjbGFzcyB0byByZWZlcmVuY2Ugb24gdGhlIGVsZW1lbnQgJiM0MjsvXG4gKiBncmVldGluZy1ib3gub24geyB0cmFuc2l0aW9uOjAuNXMgbGluZWFyIGFsbDsgYmFja2dyb3VuZDpncmVlbjsgY29sb3I6d2hpdGU7IH1cbiAqIGBgYFxuICpcbiAqIFRoZSBgJGFuaW1hdGVgIHNlcnZpY2UgY29udGFpbnMgYSB2YXJpZXR5IG9mIG90aGVyIG1ldGhvZHMgbGlrZSBgZW50ZXJgLCBgbGVhdmVgLCBgYW5pbWF0ZWAgYW5kIGBzZXRDbGFzc2AuIFRvIGxlYXJuIG1vcmUgYWJvdXQgd2hhdCdzXG4gKiBwb3NzaWJsZSBiZSBzdXJlIHRvIHZpc2l0IHRoZSB7QGxpbmsgbmcuJGFuaW1hdGUgJGFuaW1hdGUgc2VydmljZSBBUEkgcGFnZX0uXG4gKlxuICpcbiAqICMjIENhbGxiYWNrcyBhbmQgUHJvbWlzZXNcbiAqXG4gKiBXaGVuIGAkYW5pbWF0ZWAgaXMgY2FsbGVkIGl0IHJldHVybnMgYSBwcm9taXNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY2FwdHVyZSB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGVuZGVkLiBUaGVyZWZvcmUgaWYgd2Ugd2VyZSB0byB0cmlnZ2VyXG4gKiBhbiBhbmltYXRpb24gKHdpdGhpbiBvdXIgZGlyZWN0aXZlIGNvZGUpIHRoZW4gd2UgY2FuIGNvbnRpbnVlIHBlcmZvcm1pbmcgZGlyZWN0aXZlIGFuZCBzY29wZSByZWxhdGVkIGFjdGl2aXRpZXMgYWZ0ZXIgdGhlIGFuaW1hdGlvbiBoYXNcbiAqIGVuZGVkIGJ5IGNoYWluaW5nIG9udG8gdGhlIHJldHVybmVkIHByb21pc2UgdGhhdCBhbmltYXRpb24gbWV0aG9kIHJldHVybnMuXG4gKlxuICogYGBganNcbiAqIC8vIHNvbWV3aGVyZSB3aXRoaW4gdGhlIGRlcHRocyBvZiB0aGUgZGlyZWN0aXZlXG4gKiAkYW5pbWF0ZS5lbnRlcihlbGVtZW50LCBwYXJlbnQpLnRoZW4oZnVuY3Rpb24oKSB7XG4gKiAgIC8vdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIChOb3RlIHRoYXQgZWFybGllciB2ZXJzaW9ucyBvZiBBbmd1bGFyIHByaW9yIHRvIHYxLjQgcmVxdWlyZWQgdGhlIHByb21pc2UgY29kZSB0byBiZSB3cmFwcGVkIHVzaW5nIGAkc2NvcGUuJGFwcGx5KC4uLilgLiBUaGlzIGlzIG5vdCB0aGUgY2FzZVxuICogYW55bW9yZS4pXG4gKlxuICogSW4gYWRkaXRpb24gdG8gdGhlIGFuaW1hdGlvbiBwcm9taXNlLCB3ZSBjYW4gYWxzbyBtYWtlIHVzZSBvZiBhbmltYXRpb24tcmVsYXRlZCBjYWxsYmFja3Mgd2l0aGluIG91ciBkaXJlY3RpdmVzIGFuZCBjb250cm9sbGVyIGNvZGUgYnkgcmVnaXN0ZXJpbmdcbiAqIGFuIGV2ZW50IGxpc3RlbmVyIHVzaW5nIHRoZSBgJGFuaW1hdGVgIHNlcnZpY2UuIExldCdzIHNheSBmb3IgZXhhbXBsZSB0aGF0IGFuIGFuaW1hdGlvbiB3YXMgdHJpZ2dlcmVkIG9uIG91ciB2aWV3XG4gKiByb3V0aW5nIGNvbnRyb2xsZXIgdG8gaG9vayBpbnRvIHRoYXQ6XG4gKlxuICogYGBganNcbiAqIG5nTW9kdWxlLmNvbnRyb2xsZXIoJ0hvbWVQYWdlQ29udHJvbGxlcicsIFsnJGFuaW1hdGUnLCBmdW5jdGlvbigkYW5pbWF0ZSkge1xuICogICAkYW5pbWF0ZS5vbignZW50ZXInLCBuZ1ZpZXdFbGVtZW50LCBmdW5jdGlvbihlbGVtZW50KSB7XG4gKiAgICAgLy8gdGhlIGFuaW1hdGlvbiBmb3IgdGhpcyByb3V0ZSBoYXMgY29tcGxldGVkXG4gKiAgIH1dKTtcbiAqIH1dKVxuICogYGBgXG4gKlxuICogKE5vdGUgdGhhdCB5b3Ugd2lsbCBuZWVkIHRvIHRyaWdnZXIgYSBkaWdlc3Qgd2l0aGluIHRoZSBjYWxsYmFjayB0byBnZXQgYW5ndWxhciB0byBub3RpY2UgYW55IHNjb3BlLXJlbGF0ZWQgY2hhbmdlcy4pXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGFuaW1hdGVcbiAqIEBraW5kIG9iamVjdFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogVGhlIG5nQW5pbWF0ZSBgJGFuaW1hdGVgIHNlcnZpY2UgZG9jdW1lbnRhdGlvbiBpcyB0aGUgc2FtZSBmb3IgdGhlIGNvcmUgYCRhbmltYXRlYCBzZXJ2aWNlLlxuICpcbiAqIENsaWNrIGhlcmUge0BsaW5rIG5nLiRhbmltYXRlIHRvIGxlYXJuIG1vcmUgYWJvdXQgYW5pbWF0aW9ucyB3aXRoIGAkYW5pbWF0ZWB9LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbmdBbmltYXRlJywgW10pXG4gIC5kaXJlY3RpdmUoJ25nQW5pbWF0ZVN3YXAnLCBuZ0FuaW1hdGVTd2FwRGlyZWN0aXZlKVxuXG4gIC5kaXJlY3RpdmUoJ25nQW5pbWF0ZUNoaWxkcmVuJywgJCRBbmltYXRlQ2hpbGRyZW5EaXJlY3RpdmUpXG4gIC5mYWN0b3J5KCckJHJBRlNjaGVkdWxlcicsICQkckFGU2NoZWR1bGVyRmFjdG9yeSlcblxuICAucHJvdmlkZXIoJyQkYW5pbWF0ZVF1ZXVlJywgJCRBbmltYXRlUXVldWVQcm92aWRlcilcbiAgLnByb3ZpZGVyKCckJGFuaW1hdGlvbicsICQkQW5pbWF0aW9uUHJvdmlkZXIpXG5cbiAgLnByb3ZpZGVyKCckYW5pbWF0ZUNzcycsICRBbmltYXRlQ3NzUHJvdmlkZXIpXG4gIC5wcm92aWRlcignJCRhbmltYXRlQ3NzRHJpdmVyJywgJCRBbmltYXRlQ3NzRHJpdmVyUHJvdmlkZXIpXG5cbiAgLnByb3ZpZGVyKCckJGFuaW1hdGVKcycsICQkQW5pbWF0ZUpzUHJvdmlkZXIpXG4gIC5wcm92aWRlcignJCRhbmltYXRlSnNEcml2ZXInLCAkJEFuaW1hdGVKc0RyaXZlclByb3ZpZGVyKTtcblxuXG59KSh3aW5kb3csIHdpbmRvdy5hbmd1bGFyKTtcbiJdfQ==

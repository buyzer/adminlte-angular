/*!
 * Select2 4.0.3
 * https://select2.github.io
 *
 * Released under the MIT license
 * https://github.com/select2/select2/blob/master/LICENSE.md
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function (jQuery) {
  // This is needed so we can catch the AMD loader configuration and use it
  // The inner file should be wrapped (by `banner.start.js`) in a function that
  // returns the AMD loader references.
  var S2 =
(function () {
  // Restore the Select2 AMD loader so it can be used
  // Needed mostly in the language files, where the loader is not inserted
  if (jQuery && jQuery.fn && jQuery.fn.select2 && jQuery.fn.select2.amd) {
    var S2 = jQuery.fn.select2.amd;
  }
var S2;(function () { if (!S2 || !S2.requirejs) {
if (!S2) { S2 = {}; } else { require = S2; }
/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

S2.requirejs = requirejs;S2.require = require;S2.define = define;
}
}());
S2.define("almond", function(){});

/* global jQuery:false, $:false */
S2.define('jquery',[],function () {
  var _$ = jQuery || $;

  if (_$ == null && console && console.error) {
    console.error(
      'Select2: An instance of jQuery or a jQuery-compatible library was not ' +
      'found. Make sure that you are including jQuery before Select2 on your ' +
      'web page.'
    );
  }

  return _$;
});

S2.define('select2/utils',[
  'jquery'
], function ($) {
  var Utils = {};

  Utils.Extend = function (ChildClass, SuperClass) {
    var __hasProp = {}.hasOwnProperty;

    function BaseConstructor () {
      this.constructor = ChildClass;
    }

    for (var key in SuperClass) {
      if (__hasProp.call(SuperClass, key)) {
        ChildClass[key] = SuperClass[key];
      }
    }

    BaseConstructor.prototype = SuperClass.prototype;
    ChildClass.prototype = new BaseConstructor();
    ChildClass.__super__ = SuperClass.prototype;

    return ChildClass;
  };

  function getMethods (theClass) {
    var proto = theClass.prototype;

    var methods = [];

    for (var methodName in proto) {
      var m = proto[methodName];

      if (typeof m !== 'function') {
        continue;
      }

      if (methodName === 'constructor') {
        continue;
      }

      methods.push(methodName);
    }

    return methods;
  }

  Utils.Decorate = function (SuperClass, DecoratorClass) {
    var decoratedMethods = getMethods(DecoratorClass);
    var superMethods = getMethods(SuperClass);

    function DecoratedClass () {
      var unshift = Array.prototype.unshift;

      var argCount = DecoratorClass.prototype.constructor.length;

      var calledConstructor = SuperClass.prototype.constructor;

      if (argCount > 0) {
        unshift.call(arguments, SuperClass.prototype.constructor);

        calledConstructor = DecoratorClass.prototype.constructor;
      }

      calledConstructor.apply(this, arguments);
    }

    DecoratorClass.displayName = SuperClass.displayName;

    function ctr () {
      this.constructor = DecoratedClass;
    }

    DecoratedClass.prototype = new ctr();

    for (var m = 0; m < superMethods.length; m++) {
        var superMethod = superMethods[m];

        DecoratedClass.prototype[superMethod] =
          SuperClass.prototype[superMethod];
    }

    var calledMethod = function (methodName) {
      // Stub out the original method if it's not decorating an actual method
      var originalMethod = function () {};

      if (methodName in DecoratedClass.prototype) {
        originalMethod = DecoratedClass.prototype[methodName];
      }

      var decoratedMethod = DecoratorClass.prototype[methodName];

      return function () {
        var unshift = Array.prototype.unshift;

        unshift.call(arguments, originalMethod);

        return decoratedMethod.apply(this, arguments);
      };
    };

    for (var d = 0; d < decoratedMethods.length; d++) {
      var decoratedMethod = decoratedMethods[d];

      DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
    }

    return DecoratedClass;
  };

  var Observable = function () {
    this.listeners = {};
  };

  Observable.prototype.on = function (event, callback) {
    this.listeners = this.listeners || {};

    if (event in this.listeners) {
      this.listeners[event].push(callback);
    } else {
      this.listeners[event] = [callback];
    }
  };

  Observable.prototype.trigger = function (event) {
    var slice = Array.prototype.slice;
    var params = slice.call(arguments, 1);

    this.listeners = this.listeners || {};

    // Params should always come in as an array
    if (params == null) {
      params = [];
    }

    // If there are no arguments to the event, use a temporary object
    if (params.length === 0) {
      params.push({});
    }

    // Set the `_type` of the first object to the event
    params[0]._type = event;

    if (event in this.listeners) {
      this.invoke(this.listeners[event], slice.call(arguments, 1));
    }

    if ('*' in this.listeners) {
      this.invoke(this.listeners['*'], arguments);
    }
  };

  Observable.prototype.invoke = function (listeners, params) {
    for (var i = 0, len = listeners.length; i < len; i++) {
      listeners[i].apply(this, params);
    }
  };

  Utils.Observable = Observable;

  Utils.generateChars = function (length) {
    var chars = '';

    for (var i = 0; i < length; i++) {
      var randomChar = Math.floor(Math.random() * 36);
      chars += randomChar.toString(36);
    }

    return chars;
  };

  Utils.bind = function (func, context) {
    return function () {
      func.apply(context, arguments);
    };
  };

  Utils._convertData = function (data) {
    for (var originalKey in data) {
      var keys = originalKey.split('-');

      var dataLevel = data;

      if (keys.length === 1) {
        continue;
      }

      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];

        // Lowercase the first letter
        // By default, dash-separated becomes camelCase
        key = key.substring(0, 1).toLowerCase() + key.substring(1);

        if (!(key in dataLevel)) {
          dataLevel[key] = {};
        }

        if (k == keys.length - 1) {
          dataLevel[key] = data[originalKey];
        }

        dataLevel = dataLevel[key];
      }

      delete data[originalKey];
    }

    return data;
  };

  Utils.hasScroll = function (index, el) {
    // Adapted from the function created by @ShadowScripter
    // and adapted by @BillBarry on the Stack Exchange Code Review website.
    // The original code can be found at
    // http://codereview.stackexchange.com/q/13338
    // and was designed to be used with the Sizzle selector engine.

    var $el = $(el);
    var overflowX = el.style.overflowX;
    var overflowY = el.style.overflowY;

    //Check both x and y declarations
    if (overflowX === overflowY &&
        (overflowY === 'hidden' || overflowY === 'visible')) {
      return false;
    }

    if (overflowX === 'scroll' || overflowY === 'scroll') {
      return true;
    }

    return ($el.innerHeight() < el.scrollHeight ||
      $el.innerWidth() < el.scrollWidth);
  };

  Utils.escapeMarkup = function (markup) {
    var replaceMap = {
      '\\': '&#92;',
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;',
      '/': '&#47;'
    };

    // Do not try to escape the markup if it's not a string
    if (typeof markup !== 'string') {
      return markup;
    }

    return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
      return replaceMap[match];
    });
  };

  // Append an array of jQuery nodes to a given element.
  Utils.appendMany = function ($element, $nodes) {
    // jQuery 1.7.x does not support $.fn.append() with an array
    // Fall back to a jQuery object collection using $.fn.add()
    if ($.fn.jquery.substr(0, 3) === '1.7') {
      var $jqNodes = $();

      $.map($nodes, function (node) {
        $jqNodes = $jqNodes.add(node);
      });

      $nodes = $jqNodes;
    }

    $element.append($nodes);
  };

  return Utils;
});

S2.define('select2/results',[
  'jquery',
  './utils'
], function ($, Utils) {
  function Results ($element, options, dataAdapter) {
    this.$element = $element;
    this.data = dataAdapter;
    this.options = options;

    Results.__super__.constructor.call(this);
  }

  Utils.Extend(Results, Utils.Observable);

  Results.prototype.render = function () {
    var $results = $(
      '<ul class="select2-results__options" role="tree"></ul>'
    );

    if (this.options.get('multiple')) {
      $results.attr('aria-multiselectable', 'true');
    }

    this.$results = $results;

    return $results;
  };

  Results.prototype.clear = function () {
    this.$results.empty();
  };

  Results.prototype.displayMessage = function (params) {
    var escapeMarkup = this.options.get('escapeMarkup');

    this.clear();
    this.hideLoading();

    var $message = $(
      '<li role="treeitem" aria-live="assertive"' +
      ' class="select2-results__option"></li>'
    );

    var message = this.options.get('translations').get(params.message);

    $message.append(
      escapeMarkup(
        message(params.args)
      )
    );

    $message[0].className += ' select2-results__message';

    this.$results.append($message);
  };

  Results.prototype.hideMessages = function () {
    this.$results.find('.select2-results__message').remove();
  };

  Results.prototype.append = function (data) {
    this.hideLoading();

    var $options = [];

    if (data.results == null || data.results.length === 0) {
      if (this.$results.children().length === 0) {
        this.trigger('results:message', {
          message: 'noResults'
        });
      }

      return;
    }

    data.results = this.sort(data.results);

    for (var d = 0; d < data.results.length; d++) {
      var item = data.results[d];

      var $option = this.option(item);

      $options.push($option);
    }

    this.$results.append($options);
  };

  Results.prototype.position = function ($results, $dropdown) {
    var $resultsContainer = $dropdown.find('.select2-results');
    $resultsContainer.append($results);
  };

  Results.prototype.sort = function (data) {
    var sorter = this.options.get('sorter');

    return sorter(data);
  };

  Results.prototype.highlightFirstItem = function () {
    var $options = this.$results
      .find('.select2-results__option[aria-selected]');

    var $selected = $options.filter('[aria-selected=true]');

    // Check if there are any selected options
    if ($selected.length > 0) {
      // If there are selected options, highlight the first
      $selected.first().trigger('mouseenter');
    } else {
      // If there are no selected options, highlight the first option
      // in the dropdown
      $options.first().trigger('mouseenter');
    }

    this.ensureHighlightVisible();
  };

  Results.prototype.setClasses = function () {
    var self = this;

    this.data.current(function (selected) {
      var selectedIds = $.map(selected, function (s) {
        return s.id.toString();
      });

      var $options = self.$results
        .find('.select2-results__option[aria-selected]');

      $options.each(function () {
        var $option = $(this);

        var item = $.data(this, 'data');

        // id needs to be converted to a string when comparing
        var id = '' + item.id;

        if ((item.element != null && item.element.selected) ||
            (item.element == null && $.inArray(id, selectedIds) > -1)) {
          $option.attr('aria-selected', 'true');
        } else {
          $option.attr('aria-selected', 'false');
        }
      });

    });
  };

  Results.prototype.showLoading = function (params) {
    this.hideLoading();

    var loadingMore = this.options.get('translations').get('searching');

    var loading = {
      disabled: true,
      loading: true,
      text: loadingMore(params)
    };
    var $loading = this.option(loading);
    $loading.className += ' loading-results';

    this.$results.prepend($loading);
  };

  Results.prototype.hideLoading = function () {
    this.$results.find('.loading-results').remove();
  };

  Results.prototype.option = function (data) {
    var option = document.createElement('li');
    option.className = 'select2-results__option';

    var attrs = {
      'role': 'treeitem',
      'aria-selected': 'false'
    };

    if (data.disabled) {
      delete attrs['aria-selected'];
      attrs['aria-disabled'] = 'true';
    }

    if (data.id == null) {
      delete attrs['aria-selected'];
    }

    if (data._resultId != null) {
      option.id = data._resultId;
    }

    if (data.title) {
      option.title = data.title;
    }

    if (data.children) {
      attrs.role = 'group';
      attrs['aria-label'] = data.text;
      delete attrs['aria-selected'];
    }

    for (var attr in attrs) {
      var val = attrs[attr];

      option.setAttribute(attr, val);
    }

    if (data.children) {
      var $option = $(option);

      var label = document.createElement('strong');
      label.className = 'select2-results__group';

      var $label = $(label);
      this.template(data, label);

      var $children = [];

      for (var c = 0; c < data.children.length; c++) {
        var child = data.children[c];

        var $child = this.option(child);

        $children.push($child);
      }

      var $childrenContainer = $('<ul></ul>', {
        'class': 'select2-results__options select2-results__options--nested'
      });

      $childrenContainer.append($children);

      $option.append(label);
      $option.append($childrenContainer);
    } else {
      this.template(data, option);
    }

    $.data(option, 'data', data);

    return option;
  };

  Results.prototype.bind = function (container, $container) {
    var self = this;

    var id = container.id + '-results';

    this.$results.attr('id', id);

    container.on('results:all', function (params) {
      self.clear();
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
        self.highlightFirstItem();
      }
    });

    container.on('results:append', function (params) {
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
      }
    });

    container.on('query', function (params) {
      self.hideMessages();
      self.showLoading(params);
    });

    container.on('select', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();
      self.highlightFirstItem();
    });

    container.on('unselect', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();
      self.highlightFirstItem();
    });

    container.on('open', function () {
      // When the dropdown is open, aria-expended="true"
      self.$results.attr('aria-expanded', 'true');
      self.$results.attr('aria-hidden', 'false');

      self.setClasses();
      self.ensureHighlightVisible();
    });

    container.on('close', function () {
      // When the dropdown is closed, aria-expended="false"
      self.$results.attr('aria-expanded', 'false');
      self.$results.attr('aria-hidden', 'true');
      self.$results.removeAttr('aria-activedescendant');
    });

    container.on('results:toggle', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      $highlighted.trigger('mouseup');
    });

    container.on('results:select', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      var data = $highlighted.data('data');

      if ($highlighted.attr('aria-selected') == 'true') {
        self.trigger('close', {});
      } else {
        self.trigger('select', {
          data: data
        });
      }
    });

    container.on('results:previous', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      // If we are already at te top, don't move further
      if (currentIndex === 0) {
        return;
      }

      var nextIndex = currentIndex - 1;

      // If none are highlighted, highlight the first
      if ($highlighted.length === 0) {
        nextIndex = 0;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top;
      var nextTop = $next.offset().top;
      var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextTop - currentOffset < 0) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:next', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      var nextIndex = currentIndex + 1;

      // If we are at the last option, stay there
      if (nextIndex >= $options.length) {
        return;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top +
        self.$results.outerHeight(false);
      var nextBottom = $next.offset().top + $next.outerHeight(false);
      var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextBottom > currentOffset) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:focus', function (params) {
      params.element.addClass('select2-results__option--highlighted');
    });

    container.on('results:message', function (params) {
      self.displayMessage(params);
    });

    if ($.fn.mousewheel) {
      this.$results.on('mousewheel', function (e) {
        var top = self.$results.scrollTop();

        var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;

        var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
        var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

        if (isAtTop) {
          self.$results.scrollTop(0);

          e.preventDefault();
          e.stopPropagation();
        } else if (isAtBottom) {
          self.$results.scrollTop(
            self.$results.get(0).scrollHeight - self.$results.height()
          );

          e.preventDefault();
          e.stopPropagation();
        }
      });
    }

    this.$results.on('mouseup', '.select2-results__option[aria-selected]',
      function (evt) {
      var $this = $(this);

      var data = $this.data('data');

      if ($this.attr('aria-selected') === 'true') {
        if (self.options.get('multiple')) {
          self.trigger('unselect', {
            originalEvent: evt,
            data: data
          });
        } else {
          self.trigger('close', {});
        }

        return;
      }

      self.trigger('select', {
        originalEvent: evt,
        data: data
      });
    });

    this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
      function (evt) {
      var data = $(this).data('data');

      self.getHighlightedResults()
          .removeClass('select2-results__option--highlighted');

      self.trigger('results:focus', {
        data: data,
        element: $(this)
      });
    });
  };

  Results.prototype.getHighlightedResults = function () {
    var $highlighted = this.$results
    .find('.select2-results__option--highlighted');

    return $highlighted;
  };

  Results.prototype.destroy = function () {
    this.$results.remove();
  };

  Results.prototype.ensureHighlightVisible = function () {
    var $highlighted = this.getHighlightedResults();

    if ($highlighted.length === 0) {
      return;
    }

    var $options = this.$results.find('[aria-selected]');

    var currentIndex = $options.index($highlighted);

    var currentOffset = this.$results.offset().top;
    var nextTop = $highlighted.offset().top;
    var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);

    var offsetDelta = nextTop - currentOffset;
    nextOffset -= $highlighted.outerHeight(false) * 2;

    if (currentIndex <= 2) {
      this.$results.scrollTop(0);
    } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
      this.$results.scrollTop(nextOffset);
    }
  };

  Results.prototype.template = function (result, container) {
    var template = this.options.get('templateResult');
    var escapeMarkup = this.options.get('escapeMarkup');

    var content = template(result, container);

    if (content == null) {
      container.style.display = 'none';
    } else if (typeof content === 'string') {
      container.innerHTML = escapeMarkup(content);
    } else {
      $(container).append(content);
    }
  };

  return Results;
});

S2.define('select2/keys',[

], function () {
  var KEYS = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46
  };

  return KEYS;
});

S2.define('select2/selection/base',[
  'jquery',
  '../utils',
  '../keys'
], function ($, Utils, KEYS) {
  function BaseSelection ($element, options) {
    this.$element = $element;
    this.options = options;

    BaseSelection.__super__.constructor.call(this);
  }

  Utils.Extend(BaseSelection, Utils.Observable);

  BaseSelection.prototype.render = function () {
    var $selection = $(
      '<span class="select2-selection" role="combobox" ' +
      ' aria-haspopup="true" aria-expanded="false">' +
      '</span>'
    );

    this._tabindex = 0;

    if (this.$element.data('old-tabindex') != null) {
      this._tabindex = this.$element.data('old-tabindex');
    } else if (this.$element.attr('tabindex') != null) {
      this._tabindex = this.$element.attr('tabindex');
    }

    $selection.attr('title', this.$element.attr('title'));
    $selection.attr('tabindex', this._tabindex);

    this.$selection = $selection;

    return $selection;
  };

  BaseSelection.prototype.bind = function (container, $container) {
    var self = this;

    var id = container.id + '-container';
    var resultsId = container.id + '-results';

    this.container = container;

    this.$selection.on('focus', function (evt) {
      self.trigger('focus', evt);
    });

    this.$selection.on('blur', function (evt) {
      self._handleBlur(evt);
    });

    this.$selection.on('keydown', function (evt) {
      self.trigger('keypress', evt);

      if (evt.which === KEYS.SPACE) {
        evt.preventDefault();
      }
    });

    container.on('results:focus', function (params) {
      self.$selection.attr('aria-activedescendant', params.data._resultId);
    });

    container.on('selection:update', function (params) {
      self.update(params.data);
    });

    container.on('open', function () {
      // When the dropdown is open, aria-expanded="true"
      self.$selection.attr('aria-expanded', 'true');
      self.$selection.attr('aria-owns', resultsId);

      self._attachCloseHandler(container);
    });

    container.on('close', function () {
      // When the dropdown is closed, aria-expanded="false"
      self.$selection.attr('aria-expanded', 'false');
      self.$selection.removeAttr('aria-activedescendant');
      self.$selection.removeAttr('aria-owns');

      self.$selection.focus();

      self._detachCloseHandler(container);
    });

    container.on('enable', function () {
      self.$selection.attr('tabindex', self._tabindex);
    });

    container.on('disable', function () {
      self.$selection.attr('tabindex', '-1');
    });
  };

  BaseSelection.prototype._handleBlur = function (evt) {
    var self = this;

    // This needs to be delayed as the active element is the body when the tab
    // key is pressed, possibly along with others.
    window.setTimeout(function () {
      // Don't trigger `blur` if the focus is still in the selection
      if (
        (document.activeElement == self.$selection[0]) ||
        ($.contains(self.$selection[0], document.activeElement))
      ) {
        return;
      }

      self.trigger('blur', evt);
    }, 1);
  };

  BaseSelection.prototype._attachCloseHandler = function (container) {
    var self = this;

    $(document.body).on('mousedown.select2.' + container.id, function (e) {
      var $target = $(e.target);

      var $select = $target.closest('.select2');

      var $all = $('.select2.select2-container--open');

      $all.each(function () {
        var $this = $(this);

        if (this == $select[0]) {
          return;
        }

        var $element = $this.data('element');

        $element.select2('close');
      });
    });
  };

  BaseSelection.prototype._detachCloseHandler = function (container) {
    $(document.body).off('mousedown.select2.' + container.id);
  };

  BaseSelection.prototype.position = function ($selection, $container) {
    var $selectionContainer = $container.find('.selection');
    $selectionContainer.append($selection);
  };

  BaseSelection.prototype.destroy = function () {
    this._detachCloseHandler(this.container);
  };

  BaseSelection.prototype.update = function (data) {
    throw new Error('The `update` method must be defined in child classes.');
  };

  return BaseSelection;
});

S2.define('select2/selection/single',[
  'jquery',
  './base',
  '../utils',
  '../keys'
], function ($, BaseSelection, Utils, KEYS) {
  function SingleSelection () {
    SingleSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(SingleSelection, BaseSelection);

  SingleSelection.prototype.render = function () {
    var $selection = SingleSelection.__super__.render.call(this);

    $selection.addClass('select2-selection--single');

    $selection.html(
      '<span class="select2-selection__rendered"></span>' +
      '<span class="select2-selection__arrow" role="presentation">' +
        '<b role="presentation"></b>' +
      '</span>'
    );

    return $selection;
  };

  SingleSelection.prototype.bind = function (container, $container) {
    var self = this;

    SingleSelection.__super__.bind.apply(this, arguments);

    var id = container.id + '-container';

    this.$selection.find('.select2-selection__rendered').attr('id', id);
    this.$selection.attr('aria-labelledby', id);

    this.$selection.on('mousedown', function (evt) {
      // Only respond to left clicks
      if (evt.which !== 1) {
        return;
      }

      self.trigger('toggle', {
        originalEvent: evt
      });
    });

    this.$selection.on('focus', function (evt) {
      // User focuses on the container
    });

    this.$selection.on('blur', function (evt) {
      // User exits the container
    });

    container.on('focus', function (evt) {
      if (!container.isOpen()) {
        self.$selection.focus();
      }
    });

    container.on('selection:update', function (params) {
      self.update(params.data);
    });
  };

  SingleSelection.prototype.clear = function () {
    this.$selection.find('.select2-selection__rendered').empty();
  };

  SingleSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };

  SingleSelection.prototype.selectionContainer = function () {
    return $('<span></span>');
  };

  SingleSelection.prototype.update = function (data) {
    if (data.length === 0) {
      this.clear();
      return;
    }

    var selection = data[0];

    var $rendered = this.$selection.find('.select2-selection__rendered');
    var formatted = this.display(selection, $rendered);

    $rendered.empty().append(formatted);
    $rendered.prop('title', selection.title || selection.text);
  };

  return SingleSelection;
});

S2.define('select2/selection/multiple',[
  'jquery',
  './base',
  '../utils'
], function ($, BaseSelection, Utils) {
  function MultipleSelection ($element, options) {
    MultipleSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(MultipleSelection, BaseSelection);

  MultipleSelection.prototype.render = function () {
    var $selection = MultipleSelection.__super__.render.call(this);

    $selection.addClass('select2-selection--multiple');

    $selection.html(
      '<ul class="select2-selection__rendered"></ul>'
    );

    return $selection;
  };

  MultipleSelection.prototype.bind = function (container, $container) {
    var self = this;

    MultipleSelection.__super__.bind.apply(this, arguments);

    this.$selection.on('click', function (evt) {
      self.trigger('toggle', {
        originalEvent: evt
      });
    });

    this.$selection.on(
      'click',
      '.select2-selection__choice__remove',
      function (evt) {
        // Ignore the event if it is disabled
        if (self.options.get('disabled')) {
          return;
        }

        var $remove = $(this);
        var $selection = $remove.parent();

        var data = $selection.data('data');

        self.trigger('unselect', {
          originalEvent: evt,
          data: data
        });
      }
    );
  };

  MultipleSelection.prototype.clear = function () {
    this.$selection.find('.select2-selection__rendered').empty();
  };

  MultipleSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };

  MultipleSelection.prototype.selectionContainer = function () {
    var $container = $(
      '<li class="select2-selection__choice">' +
        '<span class="select2-selection__choice__remove" role="presentation">' +
          '&times;' +
        '</span>' +
      '</li>'
    );

    return $container;
  };

  MultipleSelection.prototype.update = function (data) {
    this.clear();

    if (data.length === 0) {
      return;
    }

    var $selections = [];

    for (var d = 0; d < data.length; d++) {
      var selection = data[d];

      var $selection = this.selectionContainer();
      var formatted = this.display(selection, $selection);

      $selection.append(formatted);
      $selection.prop('title', selection.title || selection.text);

      $selection.data('data', selection);

      $selections.push($selection);
    }

    var $rendered = this.$selection.find('.select2-selection__rendered');

    Utils.appendMany($rendered, $selections);
  };

  return MultipleSelection;
});

S2.define('select2/selection/placeholder',[
  '../utils'
], function (Utils) {
  function Placeholder (decorated, $element, options) {
    this.placeholder = this.normalizePlaceholder(options.get('placeholder'));

    decorated.call(this, $element, options);
  }

  Placeholder.prototype.normalizePlaceholder = function (_, placeholder) {
    if (typeof placeholder === 'string') {
      placeholder = {
        id: '',
        text: placeholder
      };
    }

    return placeholder;
  };

  Placeholder.prototype.createPlaceholder = function (decorated, placeholder) {
    var $placeholder = this.selectionContainer();

    $placeholder.html(this.display(placeholder));
    $placeholder.addClass('select2-selection__placeholder')
                .removeClass('select2-selection__choice');

    return $placeholder;
  };

  Placeholder.prototype.update = function (decorated, data) {
    var singlePlaceholder = (
      data.length == 1 && data[0].id != this.placeholder.id
    );
    var multipleSelections = data.length > 1;

    if (multipleSelections || singlePlaceholder) {
      return decorated.call(this, data);
    }

    this.clear();

    var $placeholder = this.createPlaceholder(this.placeholder);

    this.$selection.find('.select2-selection__rendered').append($placeholder);
  };

  return Placeholder;
});

S2.define('select2/selection/allowClear',[
  'jquery',
  '../keys'
], function ($, KEYS) {
  function AllowClear () { }

  AllowClear.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    if (this.placeholder == null) {
      if (this.options.get('debug') && window.console && console.error) {
        console.error(
          'Select2: The `allowClear` option should be used in combination ' +
          'with the `placeholder` option.'
        );
      }
    }

    this.$selection.on('mousedown', '.select2-selection__clear',
      function (evt) {
        self._handleClear(evt);
    });

    container.on('keypress', function (evt) {
      self._handleKeyboardClear(evt, container);
    });
  };

  AllowClear.prototype._handleClear = function (_, evt) {
    // Ignore the event if it is disabled
    if (this.options.get('disabled')) {
      return;
    }

    var $clear = this.$selection.find('.select2-selection__clear');

    // Ignore the event if nothing has been selected
    if ($clear.length === 0) {
      return;
    }

    evt.stopPropagation();

    var data = $clear.data('data');

    for (var d = 0; d < data.length; d++) {
      var unselectData = {
        data: data[d]
      };

      // Trigger the `unselect` event, so people can prevent it from being
      // cleared.
      this.trigger('unselect', unselectData);

      // If the event was prevented, don't clear it out.
      if (unselectData.prevented) {
        return;
      }
    }

    this.$element.val(this.placeholder.id).trigger('change');

    this.trigger('toggle', {});
  };

  AllowClear.prototype._handleKeyboardClear = function (_, evt, container) {
    if (container.isOpen()) {
      return;
    }

    if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
      this._handleClear(evt);
    }
  };

  AllowClear.prototype.update = function (decorated, data) {
    decorated.call(this, data);

    if (this.$selection.find('.select2-selection__placeholder').length > 0 ||
        data.length === 0) {
      return;
    }

    var $remove = $(
      '<span class="select2-selection__clear">' +
        '&times;' +
      '</span>'
    );
    $remove.data('data', data);

    this.$selection.find('.select2-selection__rendered').prepend($remove);
  };

  return AllowClear;
});

S2.define('select2/selection/search',[
  'jquery',
  '../utils',
  '../keys'
], function ($, Utils, KEYS) {
  function Search (decorated, $element, options) {
    decorated.call(this, $element, options);
  }

  Search.prototype.render = function (decorated) {
    var $search = $(
      '<li class="select2-search select2-search--inline">' +
        '<input class="select2-search__field" type="search" tabindex="-1"' +
        ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
        ' spellcheck="false" role="textbox" aria-autocomplete="list" />' +
      '</li>'
    );

    this.$searchContainer = $search;
    this.$search = $search.find('input');

    var $rendered = decorated.call(this);

    this._transferTabIndex();

    return $rendered;
  };

  Search.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('open', function () {
      self.$search.trigger('focus');
    });

    container.on('close', function () {
      self.$search.val('');
      self.$search.removeAttr('aria-activedescendant');
      self.$search.trigger('focus');
    });

    container.on('enable', function () {
      self.$search.prop('disabled', false);

      self._transferTabIndex();
    });

    container.on('disable', function () {
      self.$search.prop('disabled', true);
    });

    container.on('focus', function (evt) {
      self.$search.trigger('focus');
    });

    container.on('results:focus', function (params) {
      self.$search.attr('aria-activedescendant', params.id);
    });

    this.$selection.on('focusin', '.select2-search--inline', function (evt) {
      self.trigger('focus', evt);
    });

    this.$selection.on('focusout', '.select2-search--inline', function (evt) {
      self._handleBlur(evt);
    });

    this.$selection.on('keydown', '.select2-search--inline', function (evt) {
      evt.stopPropagation();

      self.trigger('keypress', evt);

      self._keyUpPrevented = evt.isDefaultPrevented();

      var key = evt.which;

      if (key === KEYS.BACKSPACE && self.$search.val() === '') {
        var $previousChoice = self.$searchContainer
          .prev('.select2-selection__choice');

        if ($previousChoice.length > 0) {
          var item = $previousChoice.data('data');

          self.searchRemoveChoice(item);

          evt.preventDefault();
        }
      }
    });

    // Try to detect the IE version should the `documentMode` property that
    // is stored on the document. This is only implemented in IE and is
    // slightly cleaner than doing a user agent check.
    // This property is not available in Edge, but Edge also doesn't have
    // this bug.
    var msie = document.documentMode;
    var disableInputEvents = msie && msie <= 11;

    // Workaround for browsers which do not support the `input` event
    // This will prevent double-triggering of events for browsers which support
    // both the `keyup` and `input` events.
    this.$selection.on(
      'input.searchcheck',
      '.select2-search--inline',
      function (evt) {
        // IE will trigger the `input` event when a placeholder is used on a
        // search box. To get around this issue, we are forced to ignore all
        // `input` events in IE and keep using `keyup`.
        if (disableInputEvents) {
          self.$selection.off('input.search input.searchcheck');
          return;
        }

        // Unbind the duplicated `keyup` event
        self.$selection.off('keyup.search');
      }
    );

    this.$selection.on(
      'keyup.search input.search',
      '.select2-search--inline',
      function (evt) {
        // IE will trigger the `input` event when a placeholder is used on a
        // search box. To get around this issue, we are forced to ignore all
        // `input` events in IE and keep using `keyup`.
        if (disableInputEvents && evt.type === 'input') {
          self.$selection.off('input.search input.searchcheck');
          return;
        }

        var key = evt.which;

        // We can freely ignore events from modifier keys
        if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
          return;
        }

        // Tabbing will be handled during the `keydown` phase
        if (key == KEYS.TAB) {
          return;
        }

        self.handleSearch(evt);
      }
    );
  };

  /**
   * This method will transfer the tabindex attribute from the rendered
   * selection to the search box. This allows for the search box to be used as
   * the primary focus instead of the selection container.
   *
   * @private
   */
  Search.prototype._transferTabIndex = function (decorated) {
    this.$search.attr('tabindex', this.$selection.attr('tabindex'));
    this.$selection.attr('tabindex', '-1');
  };

  Search.prototype.createPlaceholder = function (decorated, placeholder) {
    this.$search.attr('placeholder', placeholder.text);
  };

  Search.prototype.update = function (decorated, data) {
    var searchHadFocus = this.$search[0] == document.activeElement;

    this.$search.attr('placeholder', '');

    decorated.call(this, data);

    this.$selection.find('.select2-selection__rendered')
                   .append(this.$searchContainer);

    this.resizeSearch();
    if (searchHadFocus) {
      this.$search.focus();
    }
  };

  Search.prototype.handleSearch = function () {
    this.resizeSearch();

    if (!this._keyUpPrevented) {
      var input = this.$search.val();

      this.trigger('query', {
        term: input
      });
    }

    this._keyUpPrevented = false;
  };

  Search.prototype.searchRemoveChoice = function (decorated, item) {
    this.trigger('unselect', {
      data: item
    });

    this.$search.val(item.text);
    this.handleSearch();
  };

  Search.prototype.resizeSearch = function () {
    this.$search.css('width', '25px');

    var width = '';

    if (this.$search.attr('placeholder') !== '') {
      width = this.$selection.find('.select2-selection__rendered').innerWidth();
    } else {
      var minimumWidth = this.$search.val().length + 1;

      width = (minimumWidth * 0.75) + 'em';
    }

    this.$search.css('width', width);
  };

  return Search;
});

S2.define('select2/selection/eventRelay',[
  'jquery'
], function ($) {
  function EventRelay () { }

  EventRelay.prototype.bind = function (decorated, container, $container) {
    var self = this;
    var relayEvents = [
      'open', 'opening',
      'close', 'closing',
      'select', 'selecting',
      'unselect', 'unselecting'
    ];

    var preventableEvents = ['opening', 'closing', 'selecting', 'unselecting'];

    decorated.call(this, container, $container);

    container.on('*', function (name, params) {
      // Ignore events that should not be relayed
      if ($.inArray(name, relayEvents) === -1) {
        return;
      }

      // The parameters should always be an object
      params = params || {};

      // Generate the jQuery event for the Select2 event
      var evt = $.Event('select2:' + name, {
        params: params
      });

      self.$element.trigger(evt);

      // Only handle preventable events if it was one
      if ($.inArray(name, preventableEvents) === -1) {
        return;
      }

      params.prevented = evt.isDefaultPrevented();
    });
  };

  return EventRelay;
});

S2.define('select2/translation',[
  'jquery',
  'require'
], function ($, require) {
  function Translation (dict) {
    this.dict = dict || {};
  }

  Translation.prototype.all = function () {
    return this.dict;
  };

  Translation.prototype.get = function (key) {
    return this.dict[key];
  };

  Translation.prototype.extend = function (translation) {
    this.dict = $.extend({}, translation.all(), this.dict);
  };

  // Static functions

  Translation._cache = {};

  Translation.loadPath = function (path) {
    if (!(path in Translation._cache)) {
      var translations = require(path);

      Translation._cache[path] = translations;
    }

    return new Translation(Translation._cache[path]);
  };

  return Translation;
});

S2.define('select2/diacritics',[

], function () {
  var diacritics = {
    '\u24B6': 'A',
    '\uFF21': 'A',
    '\u00C0': 'A',
    '\u00C1': 'A',
    '\u00C2': 'A',
    '\u1EA6': 'A',
    '\u1EA4': 'A',
    '\u1EAA': 'A',
    '\u1EA8': 'A',
    '\u00C3': 'A',
    '\u0100': 'A',
    '\u0102': 'A',
    '\u1EB0': 'A',
    '\u1EAE': 'A',
    '\u1EB4': 'A',
    '\u1EB2': 'A',
    '\u0226': 'A',
    '\u01E0': 'A',
    '\u00C4': 'A',
    '\u01DE': 'A',
    '\u1EA2': 'A',
    '\u00C5': 'A',
    '\u01FA': 'A',
    '\u01CD': 'A',
    '\u0200': 'A',
    '\u0202': 'A',
    '\u1EA0': 'A',
    '\u1EAC': 'A',
    '\u1EB6': 'A',
    '\u1E00': 'A',
    '\u0104': 'A',
    '\u023A': 'A',
    '\u2C6F': 'A',
    '\uA732': 'AA',
    '\u00C6': 'AE',
    '\u01FC': 'AE',
    '\u01E2': 'AE',
    '\uA734': 'AO',
    '\uA736': 'AU',
    '\uA738': 'AV',
    '\uA73A': 'AV',
    '\uA73C': 'AY',
    '\u24B7': 'B',
    '\uFF22': 'B',
    '\u1E02': 'B',
    '\u1E04': 'B',
    '\u1E06': 'B',
    '\u0243': 'B',
    '\u0182': 'B',
    '\u0181': 'B',
    '\u24B8': 'C',
    '\uFF23': 'C',
    '\u0106': 'C',
    '\u0108': 'C',
    '\u010A': 'C',
    '\u010C': 'C',
    '\u00C7': 'C',
    '\u1E08': 'C',
    '\u0187': 'C',
    '\u023B': 'C',
    '\uA73E': 'C',
    '\u24B9': 'D',
    '\uFF24': 'D',
    '\u1E0A': 'D',
    '\u010E': 'D',
    '\u1E0C': 'D',
    '\u1E10': 'D',
    '\u1E12': 'D',
    '\u1E0E': 'D',
    '\u0110': 'D',
    '\u018B': 'D',
    '\u018A': 'D',
    '\u0189': 'D',
    '\uA779': 'D',
    '\u01F1': 'DZ',
    '\u01C4': 'DZ',
    '\u01F2': 'Dz',
    '\u01C5': 'Dz',
    '\u24BA': 'E',
    '\uFF25': 'E',
    '\u00C8': 'E',
    '\u00C9': 'E',
    '\u00CA': 'E',
    '\u1EC0': 'E',
    '\u1EBE': 'E',
    '\u1EC4': 'E',
    '\u1EC2': 'E',
    '\u1EBC': 'E',
    '\u0112': 'E',
    '\u1E14': 'E',
    '\u1E16': 'E',
    '\u0114': 'E',
    '\u0116': 'E',
    '\u00CB': 'E',
    '\u1EBA': 'E',
    '\u011A': 'E',
    '\u0204': 'E',
    '\u0206': 'E',
    '\u1EB8': 'E',
    '\u1EC6': 'E',
    '\u0228': 'E',
    '\u1E1C': 'E',
    '\u0118': 'E',
    '\u1E18': 'E',
    '\u1E1A': 'E',
    '\u0190': 'E',
    '\u018E': 'E',
    '\u24BB': 'F',
    '\uFF26': 'F',
    '\u1E1E': 'F',
    '\u0191': 'F',
    '\uA77B': 'F',
    '\u24BC': 'G',
    '\uFF27': 'G',
    '\u01F4': 'G',
    '\u011C': 'G',
    '\u1E20': 'G',
    '\u011E': 'G',
    '\u0120': 'G',
    '\u01E6': 'G',
    '\u0122': 'G',
    '\u01E4': 'G',
    '\u0193': 'G',
    '\uA7A0': 'G',
    '\uA77D': 'G',
    '\uA77E': 'G',
    '\u24BD': 'H',
    '\uFF28': 'H',
    '\u0124': 'H',
    '\u1E22': 'H',
    '\u1E26': 'H',
    '\u021E': 'H',
    '\u1E24': 'H',
    '\u1E28': 'H',
    '\u1E2A': 'H',
    '\u0126': 'H',
    '\u2C67': 'H',
    '\u2C75': 'H',
    '\uA78D': 'H',
    '\u24BE': 'I',
    '\uFF29': 'I',
    '\u00CC': 'I',
    '\u00CD': 'I',
    '\u00CE': 'I',
    '\u0128': 'I',
    '\u012A': 'I',
    '\u012C': 'I',
    '\u0130': 'I',
    '\u00CF': 'I',
    '\u1E2E': 'I',
    '\u1EC8': 'I',
    '\u01CF': 'I',
    '\u0208': 'I',
    '\u020A': 'I',
    '\u1ECA': 'I',
    '\u012E': 'I',
    '\u1E2C': 'I',
    '\u0197': 'I',
    '\u24BF': 'J',
    '\uFF2A': 'J',
    '\u0134': 'J',
    '\u0248': 'J',
    '\u24C0': 'K',
    '\uFF2B': 'K',
    '\u1E30': 'K',
    '\u01E8': 'K',
    '\u1E32': 'K',
    '\u0136': 'K',
    '\u1E34': 'K',
    '\u0198': 'K',
    '\u2C69': 'K',
    '\uA740': 'K',
    '\uA742': 'K',
    '\uA744': 'K',
    '\uA7A2': 'K',
    '\u24C1': 'L',
    '\uFF2C': 'L',
    '\u013F': 'L',
    '\u0139': 'L',
    '\u013D': 'L',
    '\u1E36': 'L',
    '\u1E38': 'L',
    '\u013B': 'L',
    '\u1E3C': 'L',
    '\u1E3A': 'L',
    '\u0141': 'L',
    '\u023D': 'L',
    '\u2C62': 'L',
    '\u2C60': 'L',
    '\uA748': 'L',
    '\uA746': 'L',
    '\uA780': 'L',
    '\u01C7': 'LJ',
    '\u01C8': 'Lj',
    '\u24C2': 'M',
    '\uFF2D': 'M',
    '\u1E3E': 'M',
    '\u1E40': 'M',
    '\u1E42': 'M',
    '\u2C6E': 'M',
    '\u019C': 'M',
    '\u24C3': 'N',
    '\uFF2E': 'N',
    '\u01F8': 'N',
    '\u0143': 'N',
    '\u00D1': 'N',
    '\u1E44': 'N',
    '\u0147': 'N',
    '\u1E46': 'N',
    '\u0145': 'N',
    '\u1E4A': 'N',
    '\u1E48': 'N',
    '\u0220': 'N',
    '\u019D': 'N',
    '\uA790': 'N',
    '\uA7A4': 'N',
    '\u01CA': 'NJ',
    '\u01CB': 'Nj',
    '\u24C4': 'O',
    '\uFF2F': 'O',
    '\u00D2': 'O',
    '\u00D3': 'O',
    '\u00D4': 'O',
    '\u1ED2': 'O',
    '\u1ED0': 'O',
    '\u1ED6': 'O',
    '\u1ED4': 'O',
    '\u00D5': 'O',
    '\u1E4C': 'O',
    '\u022C': 'O',
    '\u1E4E': 'O',
    '\u014C': 'O',
    '\u1E50': 'O',
    '\u1E52': 'O',
    '\u014E': 'O',
    '\u022E': 'O',
    '\u0230': 'O',
    '\u00D6': 'O',
    '\u022A': 'O',
    '\u1ECE': 'O',
    '\u0150': 'O',
    '\u01D1': 'O',
    '\u020C': 'O',
    '\u020E': 'O',
    '\u01A0': 'O',
    '\u1EDC': 'O',
    '\u1EDA': 'O',
    '\u1EE0': 'O',
    '\u1EDE': 'O',
    '\u1EE2': 'O',
    '\u1ECC': 'O',
    '\u1ED8': 'O',
    '\u01EA': 'O',
    '\u01EC': 'O',
    '\u00D8': 'O',
    '\u01FE': 'O',
    '\u0186': 'O',
    '\u019F': 'O',
    '\uA74A': 'O',
    '\uA74C': 'O',
    '\u01A2': 'OI',
    '\uA74E': 'OO',
    '\u0222': 'OU',
    '\u24C5': 'P',
    '\uFF30': 'P',
    '\u1E54': 'P',
    '\u1E56': 'P',
    '\u01A4': 'P',
    '\u2C63': 'P',
    '\uA750': 'P',
    '\uA752': 'P',
    '\uA754': 'P',
    '\u24C6': 'Q',
    '\uFF31': 'Q',
    '\uA756': 'Q',
    '\uA758': 'Q',
    '\u024A': 'Q',
    '\u24C7': 'R',
    '\uFF32': 'R',
    '\u0154': 'R',
    '\u1E58': 'R',
    '\u0158': 'R',
    '\u0210': 'R',
    '\u0212': 'R',
    '\u1E5A': 'R',
    '\u1E5C': 'R',
    '\u0156': 'R',
    '\u1E5E': 'R',
    '\u024C': 'R',
    '\u2C64': 'R',
    '\uA75A': 'R',
    '\uA7A6': 'R',
    '\uA782': 'R',
    '\u24C8': 'S',
    '\uFF33': 'S',
    '\u1E9E': 'S',
    '\u015A': 'S',
    '\u1E64': 'S',
    '\u015C': 'S',
    '\u1E60': 'S',
    '\u0160': 'S',
    '\u1E66': 'S',
    '\u1E62': 'S',
    '\u1E68': 'S',
    '\u0218': 'S',
    '\u015E': 'S',
    '\u2C7E': 'S',
    '\uA7A8': 'S',
    '\uA784': 'S',
    '\u24C9': 'T',
    '\uFF34': 'T',
    '\u1E6A': 'T',
    '\u0164': 'T',
    '\u1E6C': 'T',
    '\u021A': 'T',
    '\u0162': 'T',
    '\u1E70': 'T',
    '\u1E6E': 'T',
    '\u0166': 'T',
    '\u01AC': 'T',
    '\u01AE': 'T',
    '\u023E': 'T',
    '\uA786': 'T',
    '\uA728': 'TZ',
    '\u24CA': 'U',
    '\uFF35': 'U',
    '\u00D9': 'U',
    '\u00DA': 'U',
    '\u00DB': 'U',
    '\u0168': 'U',
    '\u1E78': 'U',
    '\u016A': 'U',
    '\u1E7A': 'U',
    '\u016C': 'U',
    '\u00DC': 'U',
    '\u01DB': 'U',
    '\u01D7': 'U',
    '\u01D5': 'U',
    '\u01D9': 'U',
    '\u1EE6': 'U',
    '\u016E': 'U',
    '\u0170': 'U',
    '\u01D3': 'U',
    '\u0214': 'U',
    '\u0216': 'U',
    '\u01AF': 'U',
    '\u1EEA': 'U',
    '\u1EE8': 'U',
    '\u1EEE': 'U',
    '\u1EEC': 'U',
    '\u1EF0': 'U',
    '\u1EE4': 'U',
    '\u1E72': 'U',
    '\u0172': 'U',
    '\u1E76': 'U',
    '\u1E74': 'U',
    '\u0244': 'U',
    '\u24CB': 'V',
    '\uFF36': 'V',
    '\u1E7C': 'V',
    '\u1E7E': 'V',
    '\u01B2': 'V',
    '\uA75E': 'V',
    '\u0245': 'V',
    '\uA760': 'VY',
    '\u24CC': 'W',
    '\uFF37': 'W',
    '\u1E80': 'W',
    '\u1E82': 'W',
    '\u0174': 'W',
    '\u1E86': 'W',
    '\u1E84': 'W',
    '\u1E88': 'W',
    '\u2C72': 'W',
    '\u24CD': 'X',
    '\uFF38': 'X',
    '\u1E8A': 'X',
    '\u1E8C': 'X',
    '\u24CE': 'Y',
    '\uFF39': 'Y',
    '\u1EF2': 'Y',
    '\u00DD': 'Y',
    '\u0176': 'Y',
    '\u1EF8': 'Y',
    '\u0232': 'Y',
    '\u1E8E': 'Y',
    '\u0178': 'Y',
    '\u1EF6': 'Y',
    '\u1EF4': 'Y',
    '\u01B3': 'Y',
    '\u024E': 'Y',
    '\u1EFE': 'Y',
    '\u24CF': 'Z',
    '\uFF3A': 'Z',
    '\u0179': 'Z',
    '\u1E90': 'Z',
    '\u017B': 'Z',
    '\u017D': 'Z',
    '\u1E92': 'Z',
    '\u1E94': 'Z',
    '\u01B5': 'Z',
    '\u0224': 'Z',
    '\u2C7F': 'Z',
    '\u2C6B': 'Z',
    '\uA762': 'Z',
    '\u24D0': 'a',
    '\uFF41': 'a',
    '\u1E9A': 'a',
    '\u00E0': 'a',
    '\u00E1': 'a',
    '\u00E2': 'a',
    '\u1EA7': 'a',
    '\u1EA5': 'a',
    '\u1EAB': 'a',
    '\u1EA9': 'a',
    '\u00E3': 'a',
    '\u0101': 'a',
    '\u0103': 'a',
    '\u1EB1': 'a',
    '\u1EAF': 'a',
    '\u1EB5': 'a',
    '\u1EB3': 'a',
    '\u0227': 'a',
    '\u01E1': 'a',
    '\u00E4': 'a',
    '\u01DF': 'a',
    '\u1EA3': 'a',
    '\u00E5': 'a',
    '\u01FB': 'a',
    '\u01CE': 'a',
    '\u0201': 'a',
    '\u0203': 'a',
    '\u1EA1': 'a',
    '\u1EAD': 'a',
    '\u1EB7': 'a',
    '\u1E01': 'a',
    '\u0105': 'a',
    '\u2C65': 'a',
    '\u0250': 'a',
    '\uA733': 'aa',
    '\u00E6': 'ae',
    '\u01FD': 'ae',
    '\u01E3': 'ae',
    '\uA735': 'ao',
    '\uA737': 'au',
    '\uA739': 'av',
    '\uA73B': 'av',
    '\uA73D': 'ay',
    '\u24D1': 'b',
    '\uFF42': 'b',
    '\u1E03': 'b',
    '\u1E05': 'b',
    '\u1E07': 'b',
    '\u0180': 'b',
    '\u0183': 'b',
    '\u0253': 'b',
    '\u24D2': 'c',
    '\uFF43': 'c',
    '\u0107': 'c',
    '\u0109': 'c',
    '\u010B': 'c',
    '\u010D': 'c',
    '\u00E7': 'c',
    '\u1E09': 'c',
    '\u0188': 'c',
    '\u023C': 'c',
    '\uA73F': 'c',
    '\u2184': 'c',
    '\u24D3': 'd',
    '\uFF44': 'd',
    '\u1E0B': 'd',
    '\u010F': 'd',
    '\u1E0D': 'd',
    '\u1E11': 'd',
    '\u1E13': 'd',
    '\u1E0F': 'd',
    '\u0111': 'd',
    '\u018C': 'd',
    '\u0256': 'd',
    '\u0257': 'd',
    '\uA77A': 'd',
    '\u01F3': 'dz',
    '\u01C6': 'dz',
    '\u24D4': 'e',
    '\uFF45': 'e',
    '\u00E8': 'e',
    '\u00E9': 'e',
    '\u00EA': 'e',
    '\u1EC1': 'e',
    '\u1EBF': 'e',
    '\u1EC5': 'e',
    '\u1EC3': 'e',
    '\u1EBD': 'e',
    '\u0113': 'e',
    '\u1E15': 'e',
    '\u1E17': 'e',
    '\u0115': 'e',
    '\u0117': 'e',
    '\u00EB': 'e',
    '\u1EBB': 'e',
    '\u011B': 'e',
    '\u0205': 'e',
    '\u0207': 'e',
    '\u1EB9': 'e',
    '\u1EC7': 'e',
    '\u0229': 'e',
    '\u1E1D': 'e',
    '\u0119': 'e',
    '\u1E19': 'e',
    '\u1E1B': 'e',
    '\u0247': 'e',
    '\u025B': 'e',
    '\u01DD': 'e',
    '\u24D5': 'f',
    '\uFF46': 'f',
    '\u1E1F': 'f',
    '\u0192': 'f',
    '\uA77C': 'f',
    '\u24D6': 'g',
    '\uFF47': 'g',
    '\u01F5': 'g',
    '\u011D': 'g',
    '\u1E21': 'g',
    '\u011F': 'g',
    '\u0121': 'g',
    '\u01E7': 'g',
    '\u0123': 'g',
    '\u01E5': 'g',
    '\u0260': 'g',
    '\uA7A1': 'g',
    '\u1D79': 'g',
    '\uA77F': 'g',
    '\u24D7': 'h',
    '\uFF48': 'h',
    '\u0125': 'h',
    '\u1E23': 'h',
    '\u1E27': 'h',
    '\u021F': 'h',
    '\u1E25': 'h',
    '\u1E29': 'h',
    '\u1E2B': 'h',
    '\u1E96': 'h',
    '\u0127': 'h',
    '\u2C68': 'h',
    '\u2C76': 'h',
    '\u0265': 'h',
    '\u0195': 'hv',
    '\u24D8': 'i',
    '\uFF49': 'i',
    '\u00EC': 'i',
    '\u00ED': 'i',
    '\u00EE': 'i',
    '\u0129': 'i',
    '\u012B': 'i',
    '\u012D': 'i',
    '\u00EF': 'i',
    '\u1E2F': 'i',
    '\u1EC9': 'i',
    '\u01D0': 'i',
    '\u0209': 'i',
    '\u020B': 'i',
    '\u1ECB': 'i',
    '\u012F': 'i',
    '\u1E2D': 'i',
    '\u0268': 'i',
    '\u0131': 'i',
    '\u24D9': 'j',
    '\uFF4A': 'j',
    '\u0135': 'j',
    '\u01F0': 'j',
    '\u0249': 'j',
    '\u24DA': 'k',
    '\uFF4B': 'k',
    '\u1E31': 'k',
    '\u01E9': 'k',
    '\u1E33': 'k',
    '\u0137': 'k',
    '\u1E35': 'k',
    '\u0199': 'k',
    '\u2C6A': 'k',
    '\uA741': 'k',
    '\uA743': 'k',
    '\uA745': 'k',
    '\uA7A3': 'k',
    '\u24DB': 'l',
    '\uFF4C': 'l',
    '\u0140': 'l',
    '\u013A': 'l',
    '\u013E': 'l',
    '\u1E37': 'l',
    '\u1E39': 'l',
    '\u013C': 'l',
    '\u1E3D': 'l',
    '\u1E3B': 'l',
    '\u017F': 'l',
    '\u0142': 'l',
    '\u019A': 'l',
    '\u026B': 'l',
    '\u2C61': 'l',
    '\uA749': 'l',
    '\uA781': 'l',
    '\uA747': 'l',
    '\u01C9': 'lj',
    '\u24DC': 'm',
    '\uFF4D': 'm',
    '\u1E3F': 'm',
    '\u1E41': 'm',
    '\u1E43': 'm',
    '\u0271': 'm',
    '\u026F': 'm',
    '\u24DD': 'n',
    '\uFF4E': 'n',
    '\u01F9': 'n',
    '\u0144': 'n',
    '\u00F1': 'n',
    '\u1E45': 'n',
    '\u0148': 'n',
    '\u1E47': 'n',
    '\u0146': 'n',
    '\u1E4B': 'n',
    '\u1E49': 'n',
    '\u019E': 'n',
    '\u0272': 'n',
    '\u0149': 'n',
    '\uA791': 'n',
    '\uA7A5': 'n',
    '\u01CC': 'nj',
    '\u24DE': 'o',
    '\uFF4F': 'o',
    '\u00F2': 'o',
    '\u00F3': 'o',
    '\u00F4': 'o',
    '\u1ED3': 'o',
    '\u1ED1': 'o',
    '\u1ED7': 'o',
    '\u1ED5': 'o',
    '\u00F5': 'o',
    '\u1E4D': 'o',
    '\u022D': 'o',
    '\u1E4F': 'o',
    '\u014D': 'o',
    '\u1E51': 'o',
    '\u1E53': 'o',
    '\u014F': 'o',
    '\u022F': 'o',
    '\u0231': 'o',
    '\u00F6': 'o',
    '\u022B': 'o',
    '\u1ECF': 'o',
    '\u0151': 'o',
    '\u01D2': 'o',
    '\u020D': 'o',
    '\u020F': 'o',
    '\u01A1': 'o',
    '\u1EDD': 'o',
    '\u1EDB': 'o',
    '\u1EE1': 'o',
    '\u1EDF': 'o',
    '\u1EE3': 'o',
    '\u1ECD': 'o',
    '\u1ED9': 'o',
    '\u01EB': 'o',
    '\u01ED': 'o',
    '\u00F8': 'o',
    '\u01FF': 'o',
    '\u0254': 'o',
    '\uA74B': 'o',
    '\uA74D': 'o',
    '\u0275': 'o',
    '\u01A3': 'oi',
    '\u0223': 'ou',
    '\uA74F': 'oo',
    '\u24DF': 'p',
    '\uFF50': 'p',
    '\u1E55': 'p',
    '\u1E57': 'p',
    '\u01A5': 'p',
    '\u1D7D': 'p',
    '\uA751': 'p',
    '\uA753': 'p',
    '\uA755': 'p',
    '\u24E0': 'q',
    '\uFF51': 'q',
    '\u024B': 'q',
    '\uA757': 'q',
    '\uA759': 'q',
    '\u24E1': 'r',
    '\uFF52': 'r',
    '\u0155': 'r',
    '\u1E59': 'r',
    '\u0159': 'r',
    '\u0211': 'r',
    '\u0213': 'r',
    '\u1E5B': 'r',
    '\u1E5D': 'r',
    '\u0157': 'r',
    '\u1E5F': 'r',
    '\u024D': 'r',
    '\u027D': 'r',
    '\uA75B': 'r',
    '\uA7A7': 'r',
    '\uA783': 'r',
    '\u24E2': 's',
    '\uFF53': 's',
    '\u00DF': 's',
    '\u015B': 's',
    '\u1E65': 's',
    '\u015D': 's',
    '\u1E61': 's',
    '\u0161': 's',
    '\u1E67': 's',
    '\u1E63': 's',
    '\u1E69': 's',
    '\u0219': 's',
    '\u015F': 's',
    '\u023F': 's',
    '\uA7A9': 's',
    '\uA785': 's',
    '\u1E9B': 's',
    '\u24E3': 't',
    '\uFF54': 't',
    '\u1E6B': 't',
    '\u1E97': 't',
    '\u0165': 't',
    '\u1E6D': 't',
    '\u021B': 't',
    '\u0163': 't',
    '\u1E71': 't',
    '\u1E6F': 't',
    '\u0167': 't',
    '\u01AD': 't',
    '\u0288': 't',
    '\u2C66': 't',
    '\uA787': 't',
    '\uA729': 'tz',
    '\u24E4': 'u',
    '\uFF55': 'u',
    '\u00F9': 'u',
    '\u00FA': 'u',
    '\u00FB': 'u',
    '\u0169': 'u',
    '\u1E79': 'u',
    '\u016B': 'u',
    '\u1E7B': 'u',
    '\u016D': 'u',
    '\u00FC': 'u',
    '\u01DC': 'u',
    '\u01D8': 'u',
    '\u01D6': 'u',
    '\u01DA': 'u',
    '\u1EE7': 'u',
    '\u016F': 'u',
    '\u0171': 'u',
    '\u01D4': 'u',
    '\u0215': 'u',
    '\u0217': 'u',
    '\u01B0': 'u',
    '\u1EEB': 'u',
    '\u1EE9': 'u',
    '\u1EEF': 'u',
    '\u1EED': 'u',
    '\u1EF1': 'u',
    '\u1EE5': 'u',
    '\u1E73': 'u',
    '\u0173': 'u',
    '\u1E77': 'u',
    '\u1E75': 'u',
    '\u0289': 'u',
    '\u24E5': 'v',
    '\uFF56': 'v',
    '\u1E7D': 'v',
    '\u1E7F': 'v',
    '\u028B': 'v',
    '\uA75F': 'v',
    '\u028C': 'v',
    '\uA761': 'vy',
    '\u24E6': 'w',
    '\uFF57': 'w',
    '\u1E81': 'w',
    '\u1E83': 'w',
    '\u0175': 'w',
    '\u1E87': 'w',
    '\u1E85': 'w',
    '\u1E98': 'w',
    '\u1E89': 'w',
    '\u2C73': 'w',
    '\u24E7': 'x',
    '\uFF58': 'x',
    '\u1E8B': 'x',
    '\u1E8D': 'x',
    '\u24E8': 'y',
    '\uFF59': 'y',
    '\u1EF3': 'y',
    '\u00FD': 'y',
    '\u0177': 'y',
    '\u1EF9': 'y',
    '\u0233': 'y',
    '\u1E8F': 'y',
    '\u00FF': 'y',
    '\u1EF7': 'y',
    '\u1E99': 'y',
    '\u1EF5': 'y',
    '\u01B4': 'y',
    '\u024F': 'y',
    '\u1EFF': 'y',
    '\u24E9': 'z',
    '\uFF5A': 'z',
    '\u017A': 'z',
    '\u1E91': 'z',
    '\u017C': 'z',
    '\u017E': 'z',
    '\u1E93': 'z',
    '\u1E95': 'z',
    '\u01B6': 'z',
    '\u0225': 'z',
    '\u0240': 'z',
    '\u2C6C': 'z',
    '\uA763': 'z',
    '\u0386': '\u0391',
    '\u0388': '\u0395',
    '\u0389': '\u0397',
    '\u038A': '\u0399',
    '\u03AA': '\u0399',
    '\u038C': '\u039F',
    '\u038E': '\u03A5',
    '\u03AB': '\u03A5',
    '\u038F': '\u03A9',
    '\u03AC': '\u03B1',
    '\u03AD': '\u03B5',
    '\u03AE': '\u03B7',
    '\u03AF': '\u03B9',
    '\u03CA': '\u03B9',
    '\u0390': '\u03B9',
    '\u03CC': '\u03BF',
    '\u03CD': '\u03C5',
    '\u03CB': '\u03C5',
    '\u03B0': '\u03C5',
    '\u03C9': '\u03C9',
    '\u03C2': '\u03C3'
  };

  return diacritics;
});

S2.define('select2/data/base',[
  '../utils'
], function (Utils) {
  function BaseAdapter ($element, options) {
    BaseAdapter.__super__.constructor.call(this);
  }

  Utils.Extend(BaseAdapter, Utils.Observable);

  BaseAdapter.prototype.current = function (callback) {
    throw new Error('The `current` method must be defined in child classes.');
  };

  BaseAdapter.prototype.query = function (params, callback) {
    throw new Error('The `query` method must be defined in child classes.');
  };

  BaseAdapter.prototype.bind = function (container, $container) {
    // Can be implemented in subclasses
  };

  BaseAdapter.prototype.destroy = function () {
    // Can be implemented in subclasses
  };

  BaseAdapter.prototype.generateResultId = function (container, data) {
    var id = container.id + '-result-';

    id += Utils.generateChars(4);

    if (data.id != null) {
      id += '-' + data.id.toString();
    } else {
      id += '-' + Utils.generateChars(4);
    }
    return id;
  };

  return BaseAdapter;
});

S2.define('select2/data/select',[
  './base',
  '../utils',
  'jquery'
], function (BaseAdapter, Utils, $) {
  function SelectAdapter ($element, options) {
    this.$element = $element;
    this.options = options;

    SelectAdapter.__super__.constructor.call(this);
  }

  Utils.Extend(SelectAdapter, BaseAdapter);

  SelectAdapter.prototype.current = function (callback) {
    var data = [];
    var self = this;

    this.$element.find(':selected').each(function () {
      var $option = $(this);

      var option = self.item($option);

      data.push(option);
    });

    callback(data);
  };

  SelectAdapter.prototype.select = function (data) {
    var self = this;

    data.selected = true;

    // If data.element is a DOM node, use it instead
    if ($(data.element).is('option')) {
      data.element.selected = true;

      this.$element.trigger('change');

      return;
    }

    if (this.$element.prop('multiple')) {
      this.current(function (currentData) {
        var val = [];

        data = [data];
        data.push.apply(data, currentData);

        for (var d = 0; d < data.length; d++) {
          var id = data[d].id;

          if ($.inArray(id, val) === -1) {
            val.push(id);
          }
        }

        self.$element.val(val);
        self.$element.trigger('change');
      });
    } else {
      var val = data.id;

      this.$element.val(val);
      this.$element.trigger('change');
    }
  };

  SelectAdapter.prototype.unselect = function (data) {
    var self = this;

    if (!this.$element.prop('multiple')) {
      return;
    }

    data.selected = false;

    if ($(data.element).is('option')) {
      data.element.selected = false;

      this.$element.trigger('change');

      return;
    }

    this.current(function (currentData) {
      var val = [];

      for (var d = 0; d < currentData.length; d++) {
        var id = currentData[d].id;

        if (id !== data.id && $.inArray(id, val) === -1) {
          val.push(id);
        }
      }

      self.$element.val(val);

      self.$element.trigger('change');
    });
  };

  SelectAdapter.prototype.bind = function (container, $container) {
    var self = this;

    this.container = container;

    container.on('select', function (params) {
      self.select(params.data);
    });

    container.on('unselect', function (params) {
      self.unselect(params.data);
    });
  };

  SelectAdapter.prototype.destroy = function () {
    // Remove anything added to child elements
    this.$element.find('*').each(function () {
      // Remove any custom data set by Select2
      $.removeData(this, 'data');
    });
  };

  SelectAdapter.prototype.query = function (params, callback) {
    var data = [];
    var self = this;

    var $options = this.$element.children();

    $options.each(function () {
      var $option = $(this);

      if (!$option.is('option') && !$option.is('optgroup')) {
        return;
      }

      var option = self.item($option);

      var matches = self.matches(params, option);

      if (matches !== null) {
        data.push(matches);
      }
    });

    callback({
      results: data
    });
  };

  SelectAdapter.prototype.addOptions = function ($options) {
    Utils.appendMany(this.$element, $options);
  };

  SelectAdapter.prototype.option = function (data) {
    var option;

    if (data.children) {
      option = document.createElement('optgroup');
      option.label = data.text;
    } else {
      option = document.createElement('option');

      if (option.textContent !== undefined) {
        option.textContent = data.text;
      } else {
        option.innerText = data.text;
      }
    }

    if (data.id) {
      option.value = data.id;
    }

    if (data.disabled) {
      option.disabled = true;
    }

    if (data.selected) {
      option.selected = true;
    }

    if (data.title) {
      option.title = data.title;
    }

    var $option = $(option);

    var normalizedData = this._normalizeItem(data);
    normalizedData.element = option;

    // Override the option's data with the combined data
    $.data(option, 'data', normalizedData);

    return $option;
  };

  SelectAdapter.prototype.item = function ($option) {
    var data = {};

    data = $.data($option[0], 'data');

    if (data != null) {
      return data;
    }

    if ($option.is('option')) {
      data = {
        id: $option.val(),
        text: $option.text(),
        disabled: $option.prop('disabled'),
        selected: $option.prop('selected'),
        title: $option.prop('title')
      };
    } else if ($option.is('optgroup')) {
      data = {
        text: $option.prop('label'),
        children: [],
        title: $option.prop('title')
      };

      var $children = $option.children('option');
      var children = [];

      for (var c = 0; c < $children.length; c++) {
        var $child = $($children[c]);

        var child = this.item($child);

        children.push(child);
      }

      data.children = children;
    }

    data = this._normalizeItem(data);
    data.element = $option[0];

    $.data($option[0], 'data', data);

    return data;
  };

  SelectAdapter.prototype._normalizeItem = function (item) {
    if (!$.isPlainObject(item)) {
      item = {
        id: item,
        text: item
      };
    }

    item = $.extend({}, {
      text: ''
    }, item);

    var defaults = {
      selected: false,
      disabled: false
    };

    if (item.id != null) {
      item.id = item.id.toString();
    }

    if (item.text != null) {
      item.text = item.text.toString();
    }

    if (item._resultId == null && item.id && this.container != null) {
      item._resultId = this.generateResultId(this.container, item);
    }

    return $.extend({}, defaults, item);
  };

  SelectAdapter.prototype.matches = function (params, data) {
    var matcher = this.options.get('matcher');

    return matcher(params, data);
  };

  return SelectAdapter;
});

S2.define('select2/data/array',[
  './select',
  '../utils',
  'jquery'
], function (SelectAdapter, Utils, $) {
  function ArrayAdapter ($element, options) {
    var data = options.get('data') || [];

    ArrayAdapter.__super__.constructor.call(this, $element, options);

    this.addOptions(this.convertToOptions(data));
  }

  Utils.Extend(ArrayAdapter, SelectAdapter);

  ArrayAdapter.prototype.select = function (data) {
    var $option = this.$element.find('option').filter(function (i, elm) {
      return elm.value == data.id.toString();
    });

    if ($option.length === 0) {
      $option = this.option(data);

      this.addOptions($option);
    }

    ArrayAdapter.__super__.select.call(this, data);
  };

  ArrayAdapter.prototype.convertToOptions = function (data) {
    var self = this;

    var $existing = this.$element.find('option');
    var existingIds = $existing.map(function () {
      return self.item($(this)).id;
    }).get();

    var $options = [];

    // Filter out all items except for the one passed in the argument
    function onlyItem (item) {
      return function () {
        return $(this).val() == item.id;
      };
    }

    for (var d = 0; d < data.length; d++) {
      var item = this._normalizeItem(data[d]);

      // Skip items which were pre-loaded, only merge the data
      if ($.inArray(item.id, existingIds) >= 0) {
        var $existingOption = $existing.filter(onlyItem(item));

        var existingData = this.item($existingOption);
        var newData = $.extend(true, {}, item, existingData);

        var $newOption = this.option(newData);

        $existingOption.replaceWith($newOption);

        continue;
      }

      var $option = this.option(item);

      if (item.children) {
        var $children = this.convertToOptions(item.children);

        Utils.appendMany($option, $children);
      }

      $options.push($option);
    }

    return $options;
  };

  return ArrayAdapter;
});

S2.define('select2/data/ajax',[
  './array',
  '../utils',
  'jquery'
], function (ArrayAdapter, Utils, $) {
  function AjaxAdapter ($element, options) {
    this.ajaxOptions = this._applyDefaults(options.get('ajax'));

    if (this.ajaxOptions.processResults != null) {
      this.processResults = this.ajaxOptions.processResults;
    }

    AjaxAdapter.__super__.constructor.call(this, $element, options);
  }

  Utils.Extend(AjaxAdapter, ArrayAdapter);

  AjaxAdapter.prototype._applyDefaults = function (options) {
    var defaults = {
      data: function (params) {
        return $.extend({}, params, {
          q: params.term
        });
      },
      transport: function (params, success, failure) {
        var $request = $.ajax(params);

        $request.then(success);
        $request.fail(failure);

        return $request;
      }
    };

    return $.extend({}, defaults, options, true);
  };

  AjaxAdapter.prototype.processResults = function (results) {
    return results;
  };

  AjaxAdapter.prototype.query = function (params, callback) {
    var matches = [];
    var self = this;

    if (this._request != null) {
      // JSONP requests cannot always be aborted
      if ($.isFunction(this._request.abort)) {
        this._request.abort();
      }

      this._request = null;
    }

    var options = $.extend({
      type: 'GET'
    }, this.ajaxOptions);

    if (typeof options.url === 'function') {
      options.url = options.url.call(this.$element, params);
    }

    if (typeof options.data === 'function') {
      options.data = options.data.call(this.$element, params);
    }

    function request () {
      var $request = options.transport(options, function (data) {
        var results = self.processResults(data, params);

        if (self.options.get('debug') && window.console && console.error) {
          // Check to make sure that the response included a `results` key.
          if (!results || !results.results || !$.isArray(results.results)) {
            console.error(
              'Select2: The AJAX results did not return an array in the ' +
              '`results` key of the response.'
            );
          }
        }

        callback(results);
      }, function () {
        // Attempt to detect if a request was aborted
        // Only works if the transport exposes a status property
        if ($request.status && $request.status === '0') {
          return;
        }

        self.trigger('results:message', {
          message: 'errorLoading'
        });
      });

      self._request = $request;
    }

    if (this.ajaxOptions.delay && params.term != null) {
      if (this._queryTimeout) {
        window.clearTimeout(this._queryTimeout);
      }

      this._queryTimeout = window.setTimeout(request, this.ajaxOptions.delay);
    } else {
      request();
    }
  };

  return AjaxAdapter;
});

S2.define('select2/data/tags',[
  'jquery'
], function ($) {
  function Tags (decorated, $element, options) {
    var tags = options.get('tags');

    var createTag = options.get('createTag');

    if (createTag !== undefined) {
      this.createTag = createTag;
    }

    var insertTag = options.get('insertTag');

    if (insertTag !== undefined) {
        this.insertTag = insertTag;
    }

    decorated.call(this, $element, options);

    if ($.isArray(tags)) {
      for (var t = 0; t < tags.length; t++) {
        var tag = tags[t];
        var item = this._normalizeItem(tag);

        var $option = this.option(item);

        this.$element.append($option);
      }
    }
  }

  Tags.prototype.query = function (decorated, params, callback) {
    var self = this;

    this._removeOldTags();

    if (params.term == null || params.page != null) {
      decorated.call(this, params, callback);
      return;
    }

    function wrapper (obj, child) {
      var data = obj.results;

      for (var i = 0; i < data.length; i++) {
        var option = data[i];

        var checkChildren = (
          option.children != null &&
          !wrapper({
            results: option.children
          }, true)
        );

        var checkText = option.text === params.term;

        if (checkText || checkChildren) {
          if (child) {
            return false;
          }

          obj.data = data;
          callback(obj);

          return;
        }
      }

      if (child) {
        return true;
      }

      var tag = self.createTag(params);

      if (tag != null) {
        var $option = self.option(tag);
        $option.attr('data-select2-tag', true);

        self.addOptions([$option]);

        self.insertTag(data, tag);
      }

      obj.results = data;

      callback(obj);
    }

    decorated.call(this, params, wrapper);
  };

  Tags.prototype.createTag = function (decorated, params) {
    var term = $.trim(params.term);

    if (term === '') {
      return null;
    }

    return {
      id: term,
      text: term
    };
  };

  Tags.prototype.insertTag = function (_, data, tag) {
    data.unshift(tag);
  };

  Tags.prototype._removeOldTags = function (_) {
    var tag = this._lastTag;

    var $options = this.$element.find('option[data-select2-tag]');

    $options.each(function () {
      if (this.selected) {
        return;
      }

      $(this).remove();
    });
  };

  return Tags;
});

S2.define('select2/data/tokenizer',[
  'jquery'
], function ($) {
  function Tokenizer (decorated, $element, options) {
    var tokenizer = options.get('tokenizer');

    if (tokenizer !== undefined) {
      this.tokenizer = tokenizer;
    }

    decorated.call(this, $element, options);
  }

  Tokenizer.prototype.bind = function (decorated, container, $container) {
    decorated.call(this, container, $container);

    this.$search =  container.dropdown.$search || container.selection.$search ||
      $container.find('.select2-search__field');
  };

  Tokenizer.prototype.query = function (decorated, params, callback) {
    var self = this;

    function createAndSelect (data) {
      // Normalize the data object so we can use it for checks
      var item = self._normalizeItem(data);

      // Check if the data object already exists as a tag
      // Select it if it doesn't
      var $existingOptions = self.$element.find('option').filter(function () {
        return $(this).val() === item.id;
      });

      // If an existing option wasn't found for it, create the option
      if (!$existingOptions.length) {
        var $option = self.option(item);
        $option.attr('data-select2-tag', true);

        self._removeOldTags();
        self.addOptions([$option]);
      }

      // Select the item, now that we know there is an option for it
      select(item);
    }

    function select (data) {
      self.trigger('select', {
        data: data
      });
    }

    params.term = params.term || '';

    var tokenData = this.tokenizer(params, this.options, createAndSelect);

    if (tokenData.term !== params.term) {
      // Replace the search term if we have the search box
      if (this.$search.length) {
        this.$search.val(tokenData.term);
        this.$search.focus();
      }

      params.term = tokenData.term;
    }

    decorated.call(this, params, callback);
  };

  Tokenizer.prototype.tokenizer = function (_, params, options, callback) {
    var separators = options.get('tokenSeparators') || [];
    var term = params.term;
    var i = 0;

    var createTag = this.createTag || function (params) {
      return {
        id: params.term,
        text: params.term
      };
    };

    while (i < term.length) {
      var termChar = term[i];

      if ($.inArray(termChar, separators) === -1) {
        i++;

        continue;
      }

      var part = term.substr(0, i);
      var partParams = $.extend({}, params, {
        term: part
      });

      var data = createTag(partParams);

      if (data == null) {
        i++;
        continue;
      }

      callback(data);

      // Reset the term to not include the tokenized portion
      term = term.substr(i + 1) || '';
      i = 0;
    }

    return {
      term: term
    };
  };

  return Tokenizer;
});

S2.define('select2/data/minimumInputLength',[

], function () {
  function MinimumInputLength (decorated, $e, options) {
    this.minimumInputLength = options.get('minimumInputLength');

    decorated.call(this, $e, options);
  }

  MinimumInputLength.prototype.query = function (decorated, params, callback) {
    params.term = params.term || '';

    if (params.term.length < this.minimumInputLength) {
      this.trigger('results:message', {
        message: 'inputTooShort',
        args: {
          minimum: this.minimumInputLength,
          input: params.term,
          params: params
        }
      });

      return;
    }

    decorated.call(this, params, callback);
  };

  return MinimumInputLength;
});

S2.define('select2/data/maximumInputLength',[

], function () {
  function MaximumInputLength (decorated, $e, options) {
    this.maximumInputLength = options.get('maximumInputLength');

    decorated.call(this, $e, options);
  }

  MaximumInputLength.prototype.query = function (decorated, params, callback) {
    params.term = params.term || '';

    if (this.maximumInputLength > 0 &&
        params.term.length > this.maximumInputLength) {
      this.trigger('results:message', {
        message: 'inputTooLong',
        args: {
          maximum: this.maximumInputLength,
          input: params.term,
          params: params
        }
      });

      return;
    }

    decorated.call(this, params, callback);
  };

  return MaximumInputLength;
});

S2.define('select2/data/maximumSelectionLength',[

], function (){
  function MaximumSelectionLength (decorated, $e, options) {
    this.maximumSelectionLength = options.get('maximumSelectionLength');

    decorated.call(this, $e, options);
  }

  MaximumSelectionLength.prototype.query =
    function (decorated, params, callback) {
      var self = this;

      this.current(function (currentData) {
        var count = currentData != null ? currentData.length : 0;
        if (self.maximumSelectionLength > 0 &&
          count >= self.maximumSelectionLength) {
          self.trigger('results:message', {
            message: 'maximumSelected',
            args: {
              maximum: self.maximumSelectionLength
            }
          });
          return;
        }
        decorated.call(self, params, callback);
      });
  };

  return MaximumSelectionLength;
});

S2.define('select2/dropdown',[
  'jquery',
  './utils'
], function ($, Utils) {
  function Dropdown ($element, options) {
    this.$element = $element;
    this.options = options;

    Dropdown.__super__.constructor.call(this);
  }

  Utils.Extend(Dropdown, Utils.Observable);

  Dropdown.prototype.render = function () {
    var $dropdown = $(
      '<span class="select2-dropdown">' +
        '<span class="select2-results"></span>' +
      '</span>'
    );

    $dropdown.attr('dir', this.options.get('dir'));

    this.$dropdown = $dropdown;

    return $dropdown;
  };

  Dropdown.prototype.bind = function () {
    // Should be implemented in subclasses
  };

  Dropdown.prototype.position = function ($dropdown, $container) {
    // Should be implmented in subclasses
  };

  Dropdown.prototype.destroy = function () {
    // Remove the dropdown from the DOM
    this.$dropdown.remove();
  };

  return Dropdown;
});

S2.define('select2/dropdown/search',[
  'jquery',
  '../utils'
], function ($, Utils) {
  function Search () { }

  Search.prototype.render = function (decorated) {
    var $rendered = decorated.call(this);

    var $search = $(
      '<span class="select2-search select2-search--dropdown">' +
        '<input class="select2-search__field" type="search" tabindex="-1"' +
        ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
        ' spellcheck="false" role="textbox" />' +
      '</span>'
    );

    this.$searchContainer = $search;
    this.$search = $search.find('input');

    $rendered.prepend($search);

    return $rendered;
  };

  Search.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    this.$search.on('keydown', function (evt) {
      self.trigger('keypress', evt);

      self._keyUpPrevented = evt.isDefaultPrevented();
    });

    // Workaround for browsers which do not support the `input` event
    // This will prevent double-triggering of events for browsers which support
    // both the `keyup` and `input` events.
    this.$search.on('input', function (evt) {
      // Unbind the duplicated `keyup` event
      $(this).off('keyup');
    });

    this.$search.on('keyup input', function (evt) {
      self.handleSearch(evt);
    });

    container.on('open', function () {
      self.$search.attr('tabindex', 0);

      self.$search.focus();

      window.setTimeout(function () {
        self.$search.focus();
      }, 0);
    });

    container.on('close', function () {
      self.$search.attr('tabindex', -1);

      self.$search.val('');
    });

    container.on('focus', function () {
      if (container.isOpen()) {
        self.$search.focus();
      }
    });

    container.on('results:all', function (params) {
      if (params.query.term == null || params.query.term === '') {
        var showSearch = self.showSearch(params);

        if (showSearch) {
          self.$searchContainer.removeClass('select2-search--hide');
        } else {
          self.$searchContainer.addClass('select2-search--hide');
        }
      }
    });
  };

  Search.prototype.handleSearch = function (evt) {
    if (!this._keyUpPrevented) {
      var input = this.$search.val();

      this.trigger('query', {
        term: input
      });
    }

    this._keyUpPrevented = false;
  };

  Search.prototype.showSearch = function (_, params) {
    return true;
  };

  return Search;
});

S2.define('select2/dropdown/hidePlaceholder',[

], function () {
  function HidePlaceholder (decorated, $element, options, dataAdapter) {
    this.placeholder = this.normalizePlaceholder(options.get('placeholder'));

    decorated.call(this, $element, options, dataAdapter);
  }

  HidePlaceholder.prototype.append = function (decorated, data) {
    data.results = this.removePlaceholder(data.results);

    decorated.call(this, data);
  };

  HidePlaceholder.prototype.normalizePlaceholder = function (_, placeholder) {
    if (typeof placeholder === 'string') {
      placeholder = {
        id: '',
        text: placeholder
      };
    }

    return placeholder;
  };

  HidePlaceholder.prototype.removePlaceholder = function (_, data) {
    var modifiedData = data.slice(0);

    for (var d = data.length - 1; d >= 0; d--) {
      var item = data[d];

      if (this.placeholder.id === item.id) {
        modifiedData.splice(d, 1);
      }
    }

    return modifiedData;
  };

  return HidePlaceholder;
});

S2.define('select2/dropdown/infiniteScroll',[
  'jquery'
], function ($) {
  function InfiniteScroll (decorated, $element, options, dataAdapter) {
    this.lastParams = {};

    decorated.call(this, $element, options, dataAdapter);

    this.$loadingMore = this.createLoadingMore();
    this.loading = false;
  }

  InfiniteScroll.prototype.append = function (decorated, data) {
    this.$loadingMore.remove();
    this.loading = false;

    decorated.call(this, data);

    if (this.showLoadingMore(data)) {
      this.$results.append(this.$loadingMore);
    }
  };

  InfiniteScroll.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('query', function (params) {
      self.lastParams = params;
      self.loading = true;
    });

    container.on('query:append', function (params) {
      self.lastParams = params;
      self.loading = true;
    });

    this.$results.on('scroll', function () {
      var isLoadMoreVisible = $.contains(
        document.documentElement,
        self.$loadingMore[0]
      );

      if (self.loading || !isLoadMoreVisible) {
        return;
      }

      var currentOffset = self.$results.offset().top +
        self.$results.outerHeight(false);
      var loadingMoreOffset = self.$loadingMore.offset().top +
        self.$loadingMore.outerHeight(false);

      if (currentOffset + 50 >= loadingMoreOffset) {
        self.loadMore();
      }
    });
  };

  InfiniteScroll.prototype.loadMore = function () {
    this.loading = true;

    var params = $.extend({}, {page: 1}, this.lastParams);

    params.page++;

    this.trigger('query:append', params);
  };

  InfiniteScroll.prototype.showLoadingMore = function (_, data) {
    return data.pagination && data.pagination.more;
  };

  InfiniteScroll.prototype.createLoadingMore = function () {
    var $option = $(
      '<li ' +
      'class="select2-results__option select2-results__option--load-more"' +
      'role="treeitem" aria-disabled="true"></li>'
    );

    var message = this.options.get('translations').get('loadingMore');

    $option.html(message(this.lastParams));

    return $option;
  };

  return InfiniteScroll;
});

S2.define('select2/dropdown/attachBody',[
  'jquery',
  '../utils'
], function ($, Utils) {
  function AttachBody (decorated, $element, options) {
    this.$dropdownParent = options.get('dropdownParent') || $(document.body);

    decorated.call(this, $element, options);
  }

  AttachBody.prototype.bind = function (decorated, container, $container) {
    var self = this;

    var setupResultsEvents = false;

    decorated.call(this, container, $container);

    container.on('open', function () {
      self._showDropdown();
      self._attachPositioningHandler(container);

      if (!setupResultsEvents) {
        setupResultsEvents = true;

        container.on('results:all', function () {
          self._positionDropdown();
          self._resizeDropdown();
        });

        container.on('results:append', function () {
          self._positionDropdown();
          self._resizeDropdown();
        });
      }
    });

    container.on('close', function () {
      self._hideDropdown();
      self._detachPositioningHandler(container);
    });

    this.$dropdownContainer.on('mousedown', function (evt) {
      evt.stopPropagation();
    });
  };

  AttachBody.prototype.destroy = function (decorated) {
    decorated.call(this);

    this.$dropdownContainer.remove();
  };

  AttachBody.prototype.position = function (decorated, $dropdown, $container) {
    // Clone all of the container classes
    $dropdown.attr('class', $container.attr('class'));

    $dropdown.removeClass('select2');
    $dropdown.addClass('select2-container--open');

    $dropdown.css({
      position: 'absolute',
      top: -999999
    });

    this.$container = $container;
  };

  AttachBody.prototype.render = function (decorated) {
    var $container = $('<span></span>');

    var $dropdown = decorated.call(this);
    $container.append($dropdown);

    this.$dropdownContainer = $container;

    return $container;
  };

  AttachBody.prototype._hideDropdown = function (decorated) {
    this.$dropdownContainer.detach();
  };

  AttachBody.prototype._attachPositioningHandler =
      function (decorated, container) {
    var self = this;

    var scrollEvent = 'scroll.select2.' + container.id;
    var resizeEvent = 'resize.select2.' + container.id;
    var orientationEvent = 'orientationchange.select2.' + container.id;

    var $watchers = this.$container.parents().filter(Utils.hasScroll);
    $watchers.each(function () {
      $(this).data('select2-scroll-position', {
        x: $(this).scrollLeft(),
        y: $(this).scrollTop()
      });
    });

    $watchers.on(scrollEvent, function (ev) {
      var position = $(this).data('select2-scroll-position');
      $(this).scrollTop(position.y);
    });

    $(window).on(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent,
      function (e) {
      self._positionDropdown();
      self._resizeDropdown();
    });
  };

  AttachBody.prototype._detachPositioningHandler =
      function (decorated, container) {
    var scrollEvent = 'scroll.select2.' + container.id;
    var resizeEvent = 'resize.select2.' + container.id;
    var orientationEvent = 'orientationchange.select2.' + container.id;

    var $watchers = this.$container.parents().filter(Utils.hasScroll);
    $watchers.off(scrollEvent);

    $(window).off(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent);
  };

  AttachBody.prototype._positionDropdown = function () {
    var $window = $(window);

    var isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
    var isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');

    var newDirection = null;

    var offset = this.$container.offset();

    offset.bottom = offset.top + this.$container.outerHeight(false);

    var container = {
      height: this.$container.outerHeight(false)
    };

    container.top = offset.top;
    container.bottom = offset.top + container.height;

    var dropdown = {
      height: this.$dropdown.outerHeight(false)
    };

    var viewport = {
      top: $window.scrollTop(),
      bottom: $window.scrollTop() + $window.height()
    };

    var enoughRoomAbove = viewport.top < (offset.top - dropdown.height);
    var enoughRoomBelow = viewport.bottom > (offset.bottom + dropdown.height);

    var css = {
      left: offset.left,
      top: container.bottom
    };

    // Determine what the parent element is to use for calciulating the offset
    var $offsetParent = this.$dropdownParent;

    // For statically positoned elements, we need to get the element
    // that is determining the offset
    if ($offsetParent.css('position') === 'static') {
      $offsetParent = $offsetParent.offsetParent();
    }

    var parentOffset = $offsetParent.offset();

    css.top -= parentOffset.top;
    css.left -= parentOffset.left;

    if (!isCurrentlyAbove && !isCurrentlyBelow) {
      newDirection = 'below';
    }

    if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
      newDirection = 'above';
    } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
      newDirection = 'below';
    }

    if (newDirection == 'above' ||
      (isCurrentlyAbove && newDirection !== 'below')) {
      css.top = container.top - parentOffset.top - dropdown.height;
    }

    if (newDirection != null) {
      this.$dropdown
        .removeClass('select2-dropdown--below select2-dropdown--above')
        .addClass('select2-dropdown--' + newDirection);
      this.$container
        .removeClass('select2-container--below select2-container--above')
        .addClass('select2-container--' + newDirection);
    }

    this.$dropdownContainer.css(css);
  };

  AttachBody.prototype._resizeDropdown = function () {
    var css = {
      width: this.$container.outerWidth(false) + 'px'
    };

    if (this.options.get('dropdownAutoWidth')) {
      css.minWidth = css.width;
      css.position = 'relative';
      css.width = 'auto';
    }

    this.$dropdown.css(css);
  };

  AttachBody.prototype._showDropdown = function (decorated) {
    this.$dropdownContainer.appendTo(this.$dropdownParent);

    this._positionDropdown();
    this._resizeDropdown();
  };

  return AttachBody;
});

S2.define('select2/dropdown/minimumResultsForSearch',[

], function () {
  function countResults (data) {
    var count = 0;

    for (var d = 0; d < data.length; d++) {
      var item = data[d];

      if (item.children) {
        count += countResults(item.children);
      } else {
        count++;
      }
    }

    return count;
  }

  function MinimumResultsForSearch (decorated, $element, options, dataAdapter) {
    this.minimumResultsForSearch = options.get('minimumResultsForSearch');

    if (this.minimumResultsForSearch < 0) {
      this.minimumResultsForSearch = Infinity;
    }

    decorated.call(this, $element, options, dataAdapter);
  }

  MinimumResultsForSearch.prototype.showSearch = function (decorated, params) {
    if (countResults(params.data.results) < this.minimumResultsForSearch) {
      return false;
    }

    return decorated.call(this, params);
  };

  return MinimumResultsForSearch;
});

S2.define('select2/dropdown/selectOnClose',[

], function () {
  function SelectOnClose () { }

  SelectOnClose.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('close', function (params) {
      self._handleSelectOnClose(params);
    });
  };

  SelectOnClose.prototype._handleSelectOnClose = function (_, params) {
    if (params && params.originalSelect2Event != null) {
      var event = params.originalSelect2Event;

      // Don't select an item if the close event was triggered from a select or
      // unselect event
      if (event._type === 'select' || event._type === 'unselect') {
        return;
      }
    }

    var $highlightedResults = this.getHighlightedResults();

    // Only select highlighted results
    if ($highlightedResults.length < 1) {
      return;
    }

    var data = $highlightedResults.data('data');

    // Don't re-select already selected resulte
    if (
      (data.element != null && data.element.selected) ||
      (data.element == null && data.selected)
    ) {
      return;
    }

    this.trigger('select', {
        data: data
    });
  };

  return SelectOnClose;
});

S2.define('select2/dropdown/closeOnSelect',[

], function () {
  function CloseOnSelect () { }

  CloseOnSelect.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('select', function (evt) {
      self._selectTriggered(evt);
    });

    container.on('unselect', function (evt) {
      self._selectTriggered(evt);
    });
  };

  CloseOnSelect.prototype._selectTriggered = function (_, evt) {
    var originalEvent = evt.originalEvent;

    // Don't close if the control key is being held
    if (originalEvent && originalEvent.ctrlKey) {
      return;
    }

    this.trigger('close', {
      originalEvent: originalEvent,
      originalSelect2Event: evt
    });
  };

  return CloseOnSelect;
});

S2.define('select2/i18n/en',[],function () {
  // English
  return {
    errorLoading: function () {
      return 'The results could not be loaded.';
    },
    inputTooLong: function (args) {
      var overChars = args.input.length - args.maximum;

      var message = 'Please delete ' + overChars + ' character';

      if (overChars != 1) {
        message += 's';
      }

      return message;
    },
    inputTooShort: function (args) {
      var remainingChars = args.minimum - args.input.length;

      var message = 'Please enter ' + remainingChars + ' or more characters';

      return message;
    },
    loadingMore: function () {
      return 'Loading more results…';
    },
    maximumSelected: function (args) {
      var message = 'You can only select ' + args.maximum + ' item';

      if (args.maximum != 1) {
        message += 's';
      }

      return message;
    },
    noResults: function () {
      return 'No results found';
    },
    searching: function () {
      return 'Searching…';
    }
  };
});

S2.define('select2/defaults',[
  'jquery',
  'require',

  './results',

  './selection/single',
  './selection/multiple',
  './selection/placeholder',
  './selection/allowClear',
  './selection/search',
  './selection/eventRelay',

  './utils',
  './translation',
  './diacritics',

  './data/select',
  './data/array',
  './data/ajax',
  './data/tags',
  './data/tokenizer',
  './data/minimumInputLength',
  './data/maximumInputLength',
  './data/maximumSelectionLength',

  './dropdown',
  './dropdown/search',
  './dropdown/hidePlaceholder',
  './dropdown/infiniteScroll',
  './dropdown/attachBody',
  './dropdown/minimumResultsForSearch',
  './dropdown/selectOnClose',
  './dropdown/closeOnSelect',

  './i18n/en'
], function ($, require,

             ResultsList,

             SingleSelection, MultipleSelection, Placeholder, AllowClear,
             SelectionSearch, EventRelay,

             Utils, Translation, DIACRITICS,

             SelectData, ArrayData, AjaxData, Tags, Tokenizer,
             MinimumInputLength, MaximumInputLength, MaximumSelectionLength,

             Dropdown, DropdownSearch, HidePlaceholder, InfiniteScroll,
             AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect,

             EnglishTranslation) {
  function Defaults () {
    this.reset();
  }

  Defaults.prototype.apply = function (options) {
    options = $.extend(true, {}, this.defaults, options);

    if (options.dataAdapter == null) {
      if (options.ajax != null) {
        options.dataAdapter = AjaxData;
      } else if (options.data != null) {
        options.dataAdapter = ArrayData;
      } else {
        options.dataAdapter = SelectData;
      }

      if (options.minimumInputLength > 0) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          MinimumInputLength
        );
      }

      if (options.maximumInputLength > 0) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          MaximumInputLength
        );
      }

      if (options.maximumSelectionLength > 0) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          MaximumSelectionLength
        );
      }

      if (options.tags) {
        options.dataAdapter = Utils.Decorate(options.dataAdapter, Tags);
      }

      if (options.tokenSeparators != null || options.tokenizer != null) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          Tokenizer
        );
      }

      if (options.query != null) {
        var Query = require(options.amdBase + 'compat/query');

        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          Query
        );
      }

      if (options.initSelection != null) {
        var InitSelection = require(options.amdBase + 'compat/initSelection');

        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          InitSelection
        );
      }
    }

    if (options.resultsAdapter == null) {
      options.resultsAdapter = ResultsList;

      if (options.ajax != null) {
        options.resultsAdapter = Utils.Decorate(
          options.resultsAdapter,
          InfiniteScroll
        );
      }

      if (options.placeholder != null) {
        options.resultsAdapter = Utils.Decorate(
          options.resultsAdapter,
          HidePlaceholder
        );
      }

      if (options.selectOnClose) {
        options.resultsAdapter = Utils.Decorate(
          options.resultsAdapter,
          SelectOnClose
        );
      }
    }

    if (options.dropdownAdapter == null) {
      if (options.multiple) {
        options.dropdownAdapter = Dropdown;
      } else {
        var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);

        options.dropdownAdapter = SearchableDropdown;
      }

      if (options.minimumResultsForSearch !== 0) {
        options.dropdownAdapter = Utils.Decorate(
          options.dropdownAdapter,
          MinimumResultsForSearch
        );
      }

      if (options.closeOnSelect) {
        options.dropdownAdapter = Utils.Decorate(
          options.dropdownAdapter,
          CloseOnSelect
        );
      }

      if (
        options.dropdownCssClass != null ||
        options.dropdownCss != null ||
        options.adaptDropdownCssClass != null
      ) {
        var DropdownCSS = require(options.amdBase + 'compat/dropdownCss');

        options.dropdownAdapter = Utils.Decorate(
          options.dropdownAdapter,
          DropdownCSS
        );
      }

      options.dropdownAdapter = Utils.Decorate(
        options.dropdownAdapter,
        AttachBody
      );
    }

    if (options.selectionAdapter == null) {
      if (options.multiple) {
        options.selectionAdapter = MultipleSelection;
      } else {
        options.selectionAdapter = SingleSelection;
      }

      // Add the placeholder mixin if a placeholder was specified
      if (options.placeholder != null) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          Placeholder
        );
      }

      if (options.allowClear) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          AllowClear
        );
      }

      if (options.multiple) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          SelectionSearch
        );
      }

      if (
        options.containerCssClass != null ||
        options.containerCss != null ||
        options.adaptContainerCssClass != null
      ) {
        var ContainerCSS = require(options.amdBase + 'compat/containerCss');

        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          ContainerCSS
        );
      }

      options.selectionAdapter = Utils.Decorate(
        options.selectionAdapter,
        EventRelay
      );
    }

    if (typeof options.language === 'string') {
      // Check if the language is specified with a region
      if (options.language.indexOf('-') > 0) {
        // Extract the region information if it is included
        var languageParts = options.language.split('-');
        var baseLanguage = languageParts[0];

        options.language = [options.language, baseLanguage];
      } else {
        options.language = [options.language];
      }
    }

    if ($.isArray(options.language)) {
      var languages = new Translation();
      options.language.push('en');

      var languageNames = options.language;

      for (var l = 0; l < languageNames.length; l++) {
        var name = languageNames[l];
        var language = {};

        try {
          // Try to load it with the original name
          language = Translation.loadPath(name);
        } catch (e) {
          try {
            // If we couldn't load it, check if it wasn't the full path
            name = this.defaults.amdLanguageBase + name;
            language = Translation.loadPath(name);
          } catch (ex) {
            // The translation could not be loaded at all. Sometimes this is
            // because of a configuration problem, other times this can be
            // because of how Select2 helps load all possible translation files.
            if (options.debug && window.console && console.warn) {
              console.warn(
                'Select2: The language file for "' + name + '" could not be ' +
                'automatically loaded. A fallback will be used instead.'
              );
            }

            continue;
          }
        }

        languages.extend(language);
      }

      options.translations = languages;
    } else {
      var baseTranslation = Translation.loadPath(
        this.defaults.amdLanguageBase + 'en'
      );
      var customTranslation = new Translation(options.language);

      customTranslation.extend(baseTranslation);

      options.translations = customTranslation;
    }

    return options;
  };

  Defaults.prototype.reset = function () {
    function stripDiacritics (text) {
      // Used 'uni range + named function' from http://jsperf.com/diacritics/18
      function match(a) {
        return DIACRITICS[a] || a;
      }

      return text.replace(/[^\u0000-\u007E]/g, match);
    }

    function matcher (params, data) {
      // Always return the object if there is nothing to compare
      if ($.trim(params.term) === '') {
        return data;
      }

      // Do a recursive check for options with children
      if (data.children && data.children.length > 0) {
        // Clone the data object if there are children
        // This is required as we modify the object to remove any non-matches
        var match = $.extend(true, {}, data);

        // Check each child of the option
        for (var c = data.children.length - 1; c >= 0; c--) {
          var child = data.children[c];

          var matches = matcher(params, child);

          // If there wasn't a match, remove the object in the array
          if (matches == null) {
            match.children.splice(c, 1);
          }
        }

        // If any children matched, return the new object
        if (match.children.length > 0) {
          return match;
        }

        // If there were no matching children, check just the plain object
        return matcher(params, match);
      }

      var original = stripDiacritics(data.text).toUpperCase();
      var term = stripDiacritics(params.term).toUpperCase();

      // Check if the text contains the term
      if (original.indexOf(term) > -1) {
        return data;
      }

      // If it doesn't contain the term, don't return anything
      return null;
    }

    this.defaults = {
      amdBase: './',
      amdLanguageBase: './i18n/',
      closeOnSelect: true,
      debug: false,
      dropdownAutoWidth: false,
      escapeMarkup: Utils.escapeMarkup,
      language: EnglishTranslation,
      matcher: matcher,
      minimumInputLength: 0,
      maximumInputLength: 0,
      maximumSelectionLength: 0,
      minimumResultsForSearch: 0,
      selectOnClose: false,
      sorter: function (data) {
        return data;
      },
      templateResult: function (result) {
        return result.text;
      },
      templateSelection: function (selection) {
        return selection.text;
      },
      theme: 'default',
      width: 'resolve'
    };
  };

  Defaults.prototype.set = function (key, value) {
    var camelKey = $.camelCase(key);

    var data = {};
    data[camelKey] = value;

    var convertedData = Utils._convertData(data);

    $.extend(this.defaults, convertedData);
  };

  var defaults = new Defaults();

  return defaults;
});

S2.define('select2/options',[
  'require',
  'jquery',
  './defaults',
  './utils'
], function (require, $, Defaults, Utils) {
  function Options (options, $element) {
    this.options = options;

    if ($element != null) {
      this.fromElement($element);
    }

    this.options = Defaults.apply(this.options);

    if ($element && $element.is('input')) {
      var InputCompat = require(this.get('amdBase') + 'compat/inputData');

      this.options.dataAdapter = Utils.Decorate(
        this.options.dataAdapter,
        InputCompat
      );
    }
  }

  Options.prototype.fromElement = function ($e) {
    var excludedData = ['select2'];

    if (this.options.multiple == null) {
      this.options.multiple = $e.prop('multiple');
    }

    if (this.options.disabled == null) {
      this.options.disabled = $e.prop('disabled');
    }

    if (this.options.language == null) {
      if ($e.prop('lang')) {
        this.options.language = $e.prop('lang').toLowerCase();
      } else if ($e.closest('[lang]').prop('lang')) {
        this.options.language = $e.closest('[lang]').prop('lang');
      }
    }

    if (this.options.dir == null) {
      if ($e.prop('dir')) {
        this.options.dir = $e.prop('dir');
      } else if ($e.closest('[dir]').prop('dir')) {
        this.options.dir = $e.closest('[dir]').prop('dir');
      } else {
        this.options.dir = 'ltr';
      }
    }

    $e.prop('disabled', this.options.disabled);
    $e.prop('multiple', this.options.multiple);

    if ($e.data('select2Tags')) {
      if (this.options.debug && window.console && console.warn) {
        console.warn(
          'Select2: The `data-select2-tags` attribute has been changed to ' +
          'use the `data-data` and `data-tags="true"` attributes and will be ' +
          'removed in future versions of Select2.'
        );
      }

      $e.data('data', $e.data('select2Tags'));
      $e.data('tags', true);
    }

    if ($e.data('ajaxUrl')) {
      if (this.options.debug && window.console && console.warn) {
        console.warn(
          'Select2: The `data-ajax-url` attribute has been changed to ' +
          '`data-ajax--url` and support for the old attribute will be removed' +
          ' in future versions of Select2.'
        );
      }

      $e.attr('ajax--url', $e.data('ajaxUrl'));
      $e.data('ajax--url', $e.data('ajaxUrl'));
    }

    var dataset = {};

    // Prefer the element's `dataset` attribute if it exists
    // jQuery 1.x does not correctly handle data attributes with multiple dashes
    if ($.fn.jquery && $.fn.jquery.substr(0, 2) == '1.' && $e[0].dataset) {
      dataset = $.extend(true, {}, $e[0].dataset, $e.data());
    } else {
      dataset = $e.data();
    }

    var data = $.extend(true, {}, dataset);

    data = Utils._convertData(data);

    for (var key in data) {
      if ($.inArray(key, excludedData) > -1) {
        continue;
      }

      if ($.isPlainObject(this.options[key])) {
        $.extend(this.options[key], data[key]);
      } else {
        this.options[key] = data[key];
      }
    }

    return this;
  };

  Options.prototype.get = function (key) {
    return this.options[key];
  };

  Options.prototype.set = function (key, val) {
    this.options[key] = val;
  };

  return Options;
});

S2.define('select2/core',[
  'jquery',
  './options',
  './utils',
  './keys'
], function ($, Options, Utils, KEYS) {
  var Select2 = function ($element, options) {
    if ($element.data('select2') != null) {
      $element.data('select2').destroy();
    }

    this.$element = $element;

    this.id = this._generateId($element);

    options = options || {};

    this.options = new Options(options, $element);

    Select2.__super__.constructor.call(this);

    // Set up the tabindex

    var tabindex = $element.attr('tabindex') || 0;
    $element.data('old-tabindex', tabindex);
    $element.attr('tabindex', '-1');

    // Set up containers and adapters

    var DataAdapter = this.options.get('dataAdapter');
    this.dataAdapter = new DataAdapter($element, this.options);

    var $container = this.render();

    this._placeContainer($container);

    var SelectionAdapter = this.options.get('selectionAdapter');
    this.selection = new SelectionAdapter($element, this.options);
    this.$selection = this.selection.render();

    this.selection.position(this.$selection, $container);

    var DropdownAdapter = this.options.get('dropdownAdapter');
    this.dropdown = new DropdownAdapter($element, this.options);
    this.$dropdown = this.dropdown.render();

    this.dropdown.position(this.$dropdown, $container);

    var ResultsAdapter = this.options.get('resultsAdapter');
    this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
    this.$results = this.results.render();

    this.results.position(this.$results, this.$dropdown);

    // Bind events

    var self = this;

    // Bind the container to all of the adapters
    this._bindAdapters();

    // Register any DOM event handlers
    this._registerDomEvents();

    // Register any internal event handlers
    this._registerDataEvents();
    this._registerSelectionEvents();
    this._registerDropdownEvents();
    this._registerResultsEvents();
    this._registerEvents();

    // Set the initial state
    this.dataAdapter.current(function (initialData) {
      self.trigger('selection:update', {
        data: initialData
      });
    });

    // Hide the original select
    $element.addClass('select2-hidden-accessible');
    $element.attr('aria-hidden', 'true');

    // Synchronize any monitored attributes
    this._syncAttributes();

    $element.data('select2', this);
  };

  Utils.Extend(Select2, Utils.Observable);

  Select2.prototype._generateId = function ($element) {
    var id = '';

    if ($element.attr('id') != null) {
      id = $element.attr('id');
    } else if ($element.attr('name') != null) {
      id = $element.attr('name') + '-' + Utils.generateChars(2);
    } else {
      id = Utils.generateChars(4);
    }

    id = id.replace(/(:|\.|\[|\]|,)/g, '');
    id = 'select2-' + id;

    return id;
  };

  Select2.prototype._placeContainer = function ($container) {
    $container.insertAfter(this.$element);

    var width = this._resolveWidth(this.$element, this.options.get('width'));

    if (width != null) {
      $container.css('width', width);
    }
  };

  Select2.prototype._resolveWidth = function ($element, method) {
    var WIDTH = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;

    if (method == 'resolve') {
      var styleWidth = this._resolveWidth($element, 'style');

      if (styleWidth != null) {
        return styleWidth;
      }

      return this._resolveWidth($element, 'element');
    }

    if (method == 'element') {
      var elementWidth = $element.outerWidth(false);

      if (elementWidth <= 0) {
        return 'auto';
      }

      return elementWidth + 'px';
    }

    if (method == 'style') {
      var style = $element.attr('style');

      if (typeof(style) !== 'string') {
        return null;
      }

      var attrs = style.split(';');

      for (var i = 0, l = attrs.length; i < l; i = i + 1) {
        var attr = attrs[i].replace(/\s/g, '');
        var matches = attr.match(WIDTH);

        if (matches !== null && matches.length >= 1) {
          return matches[1];
        }
      }

      return null;
    }

    return method;
  };

  Select2.prototype._bindAdapters = function () {
    this.dataAdapter.bind(this, this.$container);
    this.selection.bind(this, this.$container);

    this.dropdown.bind(this, this.$container);
    this.results.bind(this, this.$container);
  };

  Select2.prototype._registerDomEvents = function () {
    var self = this;

    this.$element.on('change.select2', function () {
      self.dataAdapter.current(function (data) {
        self.trigger('selection:update', {
          data: data
        });
      });
    });

    this.$element.on('focus.select2', function (evt) {
      self.trigger('focus', evt);
    });

    this._syncA = Utils.bind(this._syncAttributes, this);
    this._syncS = Utils.bind(this._syncSubtree, this);

    if (this.$element[0].attachEvent) {
      this.$element[0].attachEvent('onpropertychange', this._syncA);
    }

    var observer = window.MutationObserver ||
      window.WebKitMutationObserver ||
      window.MozMutationObserver
    ;

    if (observer != null) {
      this._observer = new observer(function (mutations) {
        $.each(mutations, self._syncA);
        $.each(mutations, self._syncS);
      });
      this._observer.observe(this.$element[0], {
        attributes: true,
        childList: true,
        subtree: false
      });
    } else if (this.$element[0].addEventListener) {
      this.$element[0].addEventListener(
        'DOMAttrModified',
        self._syncA,
        false
      );
      this.$element[0].addEventListener(
        'DOMNodeInserted',
        self._syncS,
        false
      );
      this.$element[0].addEventListener(
        'DOMNodeRemoved',
        self._syncS,
        false
      );
    }
  };

  Select2.prototype._registerDataEvents = function () {
    var self = this;

    this.dataAdapter.on('*', function (name, params) {
      self.trigger(name, params);
    });
  };

  Select2.prototype._registerSelectionEvents = function () {
    var self = this;
    var nonRelayEvents = ['toggle', 'focus'];

    this.selection.on('toggle', function () {
      self.toggleDropdown();
    });

    this.selection.on('focus', function (params) {
      self.focus(params);
    });

    this.selection.on('*', function (name, params) {
      if ($.inArray(name, nonRelayEvents) !== -1) {
        return;
      }

      self.trigger(name, params);
    });
  };

  Select2.prototype._registerDropdownEvents = function () {
    var self = this;

    this.dropdown.on('*', function (name, params) {
      self.trigger(name, params);
    });
  };

  Select2.prototype._registerResultsEvents = function () {
    var self = this;

    this.results.on('*', function (name, params) {
      self.trigger(name, params);
    });
  };

  Select2.prototype._registerEvents = function () {
    var self = this;

    this.on('open', function () {
      self.$container.addClass('select2-container--open');
    });

    this.on('close', function () {
      self.$container.removeClass('select2-container--open');
    });

    this.on('enable', function () {
      self.$container.removeClass('select2-container--disabled');
    });

    this.on('disable', function () {
      self.$container.addClass('select2-container--disabled');
    });

    this.on('blur', function () {
      self.$container.removeClass('select2-container--focus');
    });

    this.on('query', function (params) {
      if (!self.isOpen()) {
        self.trigger('open', {});
      }

      this.dataAdapter.query(params, function (data) {
        self.trigger('results:all', {
          data: data,
          query: params
        });
      });
    });

    this.on('query:append', function (params) {
      this.dataAdapter.query(params, function (data) {
        self.trigger('results:append', {
          data: data,
          query: params
        });
      });
    });

    this.on('keypress', function (evt) {
      var key = evt.which;

      if (self.isOpen()) {
        if (key === KEYS.ESC || key === KEYS.TAB ||
            (key === KEYS.UP && evt.altKey)) {
          self.close();

          evt.preventDefault();
        } else if (key === KEYS.ENTER) {
          self.trigger('results:select', {});

          evt.preventDefault();
        } else if ((key === KEYS.SPACE && evt.ctrlKey)) {
          self.trigger('results:toggle', {});

          evt.preventDefault();
        } else if (key === KEYS.UP) {
          self.trigger('results:previous', {});

          evt.preventDefault();
        } else if (key === KEYS.DOWN) {
          self.trigger('results:next', {});

          evt.preventDefault();
        }
      } else {
        if (key === KEYS.ENTER || key === KEYS.SPACE ||
            (key === KEYS.DOWN && evt.altKey)) {
          self.open();

          evt.preventDefault();
        }
      }
    });
  };

  Select2.prototype._syncAttributes = function () {
    this.options.set('disabled', this.$element.prop('disabled'));

    if (this.options.get('disabled')) {
      if (this.isOpen()) {
        this.close();
      }

      this.trigger('disable', {});
    } else {
      this.trigger('enable', {});
    }
  };

  Select2.prototype._syncSubtree = function (evt, mutations) {
    var changed = false;
    var self = this;

    // Ignore any mutation events raised for elements that aren't options or
    // optgroups. This handles the case when the select element is destroyed
    if (
      evt && evt.target && (
        evt.target.nodeName !== 'OPTION' && evt.target.nodeName !== 'OPTGROUP'
      )
    ) {
      return;
    }

    if (!mutations) {
      // If mutation events aren't supported, then we can only assume that the
      // change affected the selections
      changed = true;
    } else if (mutations.addedNodes && mutations.addedNodes.length > 0) {
      for (var n = 0; n < mutations.addedNodes.length; n++) {
        var node = mutations.addedNodes[n];

        if (node.selected) {
          changed = true;
        }
      }
    } else if (mutations.removedNodes && mutations.removedNodes.length > 0) {
      changed = true;
    }

    // Only re-pull the data if we think there is a change
    if (changed) {
      this.dataAdapter.current(function (currentData) {
        self.trigger('selection:update', {
          data: currentData
        });
      });
    }
  };

  /**
   * Override the trigger method to automatically trigger pre-events when
   * there are events that can be prevented.
   */
  Select2.prototype.trigger = function (name, args) {
    var actualTrigger = Select2.__super__.trigger;
    var preTriggerMap = {
      'open': 'opening',
      'close': 'closing',
      'select': 'selecting',
      'unselect': 'unselecting'
    };

    if (args === undefined) {
      args = {};
    }

    if (name in preTriggerMap) {
      var preTriggerName = preTriggerMap[name];
      var preTriggerArgs = {
        prevented: false,
        name: name,
        args: args
      };

      actualTrigger.call(this, preTriggerName, preTriggerArgs);

      if (preTriggerArgs.prevented) {
        args.prevented = true;

        return;
      }
    }

    actualTrigger.call(this, name, args);
  };

  Select2.prototype.toggleDropdown = function () {
    if (this.options.get('disabled')) {
      return;
    }

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  };

  Select2.prototype.open = function () {
    if (this.isOpen()) {
      return;
    }

    this.trigger('query', {});
  };

  Select2.prototype.close = function () {
    if (!this.isOpen()) {
      return;
    }

    this.trigger('close', {});
  };

  Select2.prototype.isOpen = function () {
    return this.$container.hasClass('select2-container--open');
  };

  Select2.prototype.hasFocus = function () {
    return this.$container.hasClass('select2-container--focus');
  };

  Select2.prototype.focus = function (data) {
    // No need to re-trigger focus events if we are already focused
    if (this.hasFocus()) {
      return;
    }

    this.$container.addClass('select2-container--focus');
    this.trigger('focus', {});
  };

  Select2.prototype.enable = function (args) {
    if (this.options.get('debug') && window.console && console.warn) {
      console.warn(
        'Select2: The `select2("enable")` method has been deprecated and will' +
        ' be removed in later Select2 versions. Use $element.prop("disabled")' +
        ' instead.'
      );
    }

    if (args == null || args.length === 0) {
      args = [true];
    }

    var disabled = !args[0];

    this.$element.prop('disabled', disabled);
  };

  Select2.prototype.data = function () {
    if (this.options.get('debug') &&
        arguments.length > 0 && window.console && console.warn) {
      console.warn(
        'Select2: Data can no longer be set using `select2("data")`. You ' +
        'should consider setting the value instead using `$element.val()`.'
      );
    }

    var data = [];

    this.dataAdapter.current(function (currentData) {
      data = currentData;
    });

    return data;
  };

  Select2.prototype.val = function (args) {
    if (this.options.get('debug') && window.console && console.warn) {
      console.warn(
        'Select2: The `select2("val")` method has been deprecated and will be' +
        ' removed in later Select2 versions. Use $element.val() instead.'
      );
    }

    if (args == null || args.length === 0) {
      return this.$element.val();
    }

    var newVal = args[0];

    if ($.isArray(newVal)) {
      newVal = $.map(newVal, function (obj) {
        return obj.toString();
      });
    }

    this.$element.val(newVal).trigger('change');
  };

  Select2.prototype.destroy = function () {
    this.$container.remove();

    if (this.$element[0].detachEvent) {
      this.$element[0].detachEvent('onpropertychange', this._syncA);
    }

    if (this._observer != null) {
      this._observer.disconnect();
      this._observer = null;
    } else if (this.$element[0].removeEventListener) {
      this.$element[0]
        .removeEventListener('DOMAttrModified', this._syncA, false);
      this.$element[0]
        .removeEventListener('DOMNodeInserted', this._syncS, false);
      this.$element[0]
        .removeEventListener('DOMNodeRemoved', this._syncS, false);
    }

    this._syncA = null;
    this._syncS = null;

    this.$element.off('.select2');
    this.$element.attr('tabindex', this.$element.data('old-tabindex'));

    this.$element.removeClass('select2-hidden-accessible');
    this.$element.attr('aria-hidden', 'false');
    this.$element.removeData('select2');

    this.dataAdapter.destroy();
    this.selection.destroy();
    this.dropdown.destroy();
    this.results.destroy();

    this.dataAdapter = null;
    this.selection = null;
    this.dropdown = null;
    this.results = null;
  };

  Select2.prototype.render = function () {
    var $container = $(
      '<span class="select2 select2-container">' +
        '<span class="selection"></span>' +
        '<span class="dropdown-wrapper" aria-hidden="true"></span>' +
      '</span>'
    );

    $container.attr('dir', this.options.get('dir'));

    this.$container = $container;

    this.$container.addClass('select2-container--' + this.options.get('theme'));

    $container.data('element', this.$element);

    return $container;
  };

  return Select2;
});

S2.define('select2/compat/utils',[
  'jquery'
], function ($) {
  function syncCssClasses ($dest, $src, adapter) {
    var classes, replacements = [], adapted;

    classes = $.trim($dest.attr('class'));

    if (classes) {
      classes = '' + classes; // for IE which returns object

      $(classes.split(/\s+/)).each(function () {
        // Save all Select2 classes
        if (this.indexOf('select2-') === 0) {
          replacements.push(this);
        }
      });
    }

    classes = $.trim($src.attr('class'));

    if (classes) {
      classes = '' + classes; // for IE which returns object

      $(classes.split(/\s+/)).each(function () {
        // Only adapt non-Select2 classes
        if (this.indexOf('select2-') !== 0) {
          adapted = adapter(this);

          if (adapted != null) {
            replacements.push(adapted);
          }
        }
      });
    }

    $dest.attr('class', replacements.join(' '));
  }

  return {
    syncCssClasses: syncCssClasses
  };
});

S2.define('select2/compat/containerCss',[
  'jquery',
  './utils'
], function ($, CompatUtils) {
  // No-op CSS adapter that discards all classes by default
  function _containerAdapter (clazz) {
    return null;
  }

  function ContainerCSS () { }

  ContainerCSS.prototype.render = function (decorated) {
    var $container = decorated.call(this);

    var containerCssClass = this.options.get('containerCssClass') || '';

    if ($.isFunction(containerCssClass)) {
      containerCssClass = containerCssClass(this.$element);
    }

    var containerCssAdapter = this.options.get('adaptContainerCssClass');
    containerCssAdapter = containerCssAdapter || _containerAdapter;

    if (containerCssClass.indexOf(':all:') !== -1) {
      containerCssClass = containerCssClass.replace(':all:', '');

      var _cssAdapter = containerCssAdapter;

      containerCssAdapter = function (clazz) {
        var adapted = _cssAdapter(clazz);

        if (adapted != null) {
          // Append the old one along with the adapted one
          return adapted + ' ' + clazz;
        }

        return clazz;
      };
    }

    var containerCss = this.options.get('containerCss') || {};

    if ($.isFunction(containerCss)) {
      containerCss = containerCss(this.$element);
    }

    CompatUtils.syncCssClasses($container, this.$element, containerCssAdapter);

    $container.css(containerCss);
    $container.addClass(containerCssClass);

    return $container;
  };

  return ContainerCSS;
});

S2.define('select2/compat/dropdownCss',[
  'jquery',
  './utils'
], function ($, CompatUtils) {
  // No-op CSS adapter that discards all classes by default
  function _dropdownAdapter (clazz) {
    return null;
  }

  function DropdownCSS () { }

  DropdownCSS.prototype.render = function (decorated) {
    var $dropdown = decorated.call(this);

    var dropdownCssClass = this.options.get('dropdownCssClass') || '';

    if ($.isFunction(dropdownCssClass)) {
      dropdownCssClass = dropdownCssClass(this.$element);
    }

    var dropdownCssAdapter = this.options.get('adaptDropdownCssClass');
    dropdownCssAdapter = dropdownCssAdapter || _dropdownAdapter;

    if (dropdownCssClass.indexOf(':all:') !== -1) {
      dropdownCssClass = dropdownCssClass.replace(':all:', '');

      var _cssAdapter = dropdownCssAdapter;

      dropdownCssAdapter = function (clazz) {
        var adapted = _cssAdapter(clazz);

        if (adapted != null) {
          // Append the old one along with the adapted one
          return adapted + ' ' + clazz;
        }

        return clazz;
      };
    }

    var dropdownCss = this.options.get('dropdownCss') || {};

    if ($.isFunction(dropdownCss)) {
      dropdownCss = dropdownCss(this.$element);
    }

    CompatUtils.syncCssClasses($dropdown, this.$element, dropdownCssAdapter);

    $dropdown.css(dropdownCss);
    $dropdown.addClass(dropdownCssClass);

    return $dropdown;
  };

  return DropdownCSS;
});

S2.define('select2/compat/initSelection',[
  'jquery'
], function ($) {
  function InitSelection (decorated, $element, options) {
    if (options.get('debug') && window.console && console.warn) {
      console.warn(
        'Select2: The `initSelection` option has been deprecated in favor' +
        ' of a custom data adapter that overrides the `current` method. ' +
        'This method is now called multiple times instead of a single ' +
        'time when the instance is initialized. Support will be removed ' +
        'for the `initSelection` option in future versions of Select2'
      );
    }

    this.initSelection = options.get('initSelection');
    this._isInitialized = false;

    decorated.call(this, $element, options);
  }

  InitSelection.prototype.current = function (decorated, callback) {
    var self = this;

    if (this._isInitialized) {
      decorated.call(this, callback);

      return;
    }

    this.initSelection.call(null, this.$element, function (data) {
      self._isInitialized = true;

      if (!$.isArray(data)) {
        data = [data];
      }

      callback(data);
    });
  };

  return InitSelection;
});

S2.define('select2/compat/inputData',[
  'jquery'
], function ($) {
  function InputData (decorated, $element, options) {
    this._currentData = [];
    this._valueSeparator = options.get('valueSeparator') || ',';

    if ($element.prop('type') === 'hidden') {
      if (options.get('debug') && console && console.warn) {
        console.warn(
          'Select2: Using a hidden input with Select2 is no longer ' +
          'supported and may stop working in the future. It is recommended ' +
          'to use a `<select>` element instead.'
        );
      }
    }

    decorated.call(this, $element, options);
  }

  InputData.prototype.current = function (_, callback) {
    function getSelected (data, selectedIds) {
      var selected = [];

      if (data.selected || $.inArray(data.id, selectedIds) !== -1) {
        data.selected = true;
        selected.push(data);
      } else {
        data.selected = false;
      }

      if (data.children) {
        selected.push.apply(selected, getSelected(data.children, selectedIds));
      }

      return selected;
    }

    var selected = [];

    for (var d = 0; d < this._currentData.length; d++) {
      var data = this._currentData[d];

      selected.push.apply(
        selected,
        getSelected(
          data,
          this.$element.val().split(
            this._valueSeparator
          )
        )
      );
    }

    callback(selected);
  };

  InputData.prototype.select = function (_, data) {
    if (!this.options.get('multiple')) {
      this.current(function (allData) {
        $.map(allData, function (data) {
          data.selected = false;
        });
      });

      this.$element.val(data.id);
      this.$element.trigger('change');
    } else {
      var value = this.$element.val();
      value += this._valueSeparator + data.id;

      this.$element.val(value);
      this.$element.trigger('change');
    }
  };

  InputData.prototype.unselect = function (_, data) {
    var self = this;

    data.selected = false;

    this.current(function (allData) {
      var values = [];

      for (var d = 0; d < allData.length; d++) {
        var item = allData[d];

        if (data.id == item.id) {
          continue;
        }

        values.push(item.id);
      }

      self.$element.val(values.join(self._valueSeparator));
      self.$element.trigger('change');
    });
  };

  InputData.prototype.query = function (_, params, callback) {
    var results = [];

    for (var d = 0; d < this._currentData.length; d++) {
      var data = this._currentData[d];

      var matches = this.matches(params, data);

      if (matches !== null) {
        results.push(matches);
      }
    }

    callback({
      results: results
    });
  };

  InputData.prototype.addOptions = function (_, $options) {
    var options = $.map($options, function ($option) {
      return $.data($option[0], 'data');
    });

    this._currentData.push.apply(this._currentData, options);
  };

  return InputData;
});

S2.define('select2/compat/matcher',[
  'jquery'
], function ($) {
  function oldMatcher (matcher) {
    function wrappedMatcher (params, data) {
      var match = $.extend(true, {}, data);

      if (params.term == null || $.trim(params.term) === '') {
        return match;
      }

      if (data.children) {
        for (var c = data.children.length - 1; c >= 0; c--) {
          var child = data.children[c];

          // Check if the child object matches
          // The old matcher returned a boolean true or false
          var doesMatch = matcher(params.term, child.text, child);

          // If the child didn't match, pop it off
          if (!doesMatch) {
            match.children.splice(c, 1);
          }
        }

        if (match.children.length > 0) {
          return match;
        }
      }

      if (matcher(params.term, data.text, data)) {
        return match;
      }

      return null;
    }

    return wrappedMatcher;
  }

  return oldMatcher;
});

S2.define('select2/compat/query',[

], function () {
  function Query (decorated, $element, options) {
    if (options.get('debug') && window.console && console.warn) {
      console.warn(
        'Select2: The `query` option has been deprecated in favor of a ' +
        'custom data adapter that overrides the `query` method. Support ' +
        'will be removed for the `query` option in future versions of ' +
        'Select2.'
      );
    }

    decorated.call(this, $element, options);
  }

  Query.prototype.query = function (_, params, callback) {
    params.callback = callback;

    var query = this.options.get('query');

    query.call(null, params);
  };

  return Query;
});

S2.define('select2/dropdown/attachContainer',[

], function () {
  function AttachContainer (decorated, $element, options) {
    decorated.call(this, $element, options);
  }

  AttachContainer.prototype.position =
    function (decorated, $dropdown, $container) {
    var $dropdownContainer = $container.find('.dropdown-wrapper');
    $dropdownContainer.append($dropdown);

    $dropdown.addClass('select2-dropdown--below');
    $container.addClass('select2-container--below');
  };

  return AttachContainer;
});

S2.define('select2/dropdown/stopPropagation',[

], function () {
  function StopPropagation () { }

  StopPropagation.prototype.bind = function (decorated, container, $container) {
    decorated.call(this, container, $container);

    var stoppedEvents = [
    'blur',
    'change',
    'click',
    'dblclick',
    'focus',
    'focusin',
    'focusout',
    'input',
    'keydown',
    'keyup',
    'keypress',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseover',
    'mouseup',
    'search',
    'touchend',
    'touchstart'
    ];

    this.$dropdown.on(stoppedEvents.join(' '), function (evt) {
      evt.stopPropagation();
    });
  };

  return StopPropagation;
});

S2.define('select2/selection/stopPropagation',[

], function () {
  function StopPropagation () { }

  StopPropagation.prototype.bind = function (decorated, container, $container) {
    decorated.call(this, container, $container);

    var stoppedEvents = [
      'blur',
      'change',
      'click',
      'dblclick',
      'focus',
      'focusin',
      'focusout',
      'input',
      'keydown',
      'keyup',
      'keypress',
      'mousedown',
      'mouseenter',
      'mouseleave',
      'mousemove',
      'mouseover',
      'mouseup',
      'search',
      'touchend',
      'touchstart'
    ];

    this.$selection.on(stoppedEvents.join(' '), function (evt) {
      evt.stopPropagation();
    });
  };

  return StopPropagation;
});

/*!
 * jQuery Mousewheel 3.1.13
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 */

(function (factory) {
    if ( typeof S2.define === 'function' && S2.define.amd ) {
        // AMD. Register as an anonymous module.
        S2.define('jquery-mousewheel',['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.12',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
            // Clean up the data we added to the element
            $.removeData(this, 'mousewheel-line-height');
            $.removeData(this, 'mousewheel-page-height');
        },

        getLineHeight: function(elem) {
            var $elem = $(elem),
                $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
            if (!$parent.length) {
                $parent = $('body');
            }
            return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
            normalizeOffset: true  // calls getBoundingClientRect for each event
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0,
            offsetX    = 0,
            offsetY    = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Normalise offsetX and offsetY properties
        if ( special.settings.normalizeOffset && this.getBoundingClientRect ) {
            var boundingRect = this.getBoundingClientRect();
            offsetX = event.clientX - boundingRect.left;
            offsetY = event.clientY - boundingRect.top;
        }

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));

S2.define('jquery.select2',[
  'jquery',
  'jquery-mousewheel',

  './select2/core',
  './select2/defaults'
], function ($, _, Select2, Defaults) {
  if ($.fn.select2 == null) {
    // All methods that should return the element
    var thisMethods = ['open', 'close', 'destroy'];

    $.fn.select2 = function (options) {
      options = options || {};

      if (typeof options === 'object') {
        this.each(function () {
          var instanceOptions = $.extend(true, {}, options);

          var instance = new Select2($(this), instanceOptions);
        });

        return this;
      } else if (typeof options === 'string') {
        var ret;
        var args = Array.prototype.slice.call(arguments, 1);

        this.each(function () {
          var instance = $(this).data('select2');

          if (instance == null && window.console && console.error) {
            console.error(
              'The select2(\'' + options + '\') method was called on an ' +
              'element that is not using Select2.'
            );
          }

          ret = instance[options].apply(instance, args);
        });

        // Check if we should be returning `this`
        if ($.inArray(options, thisMethods) > -1) {
          return this;
        }

        return ret;
      } else {
        throw new Error('Invalid arguments for Select2: ' + options);
      }
    };
  }

  if ($.fn.select2.defaults == null) {
    $.fn.select2.defaults = Defaults;
  }

  return Select2;
});

  // Return the AMD loader configuration so it can be used outside of this file
  return {
    define: S2.define,
    require: S2.require
  };
}());

  // Autoload the jQuery bindings
  // We know that all of the modules exist above this, so we're safe
  var select2 = S2.require('jquery.select2');

  // Hold the AMD module references on the jQuery function that was just loaded
  // This allows Select2 to use the internal loader outside of this file, such
  // as in the language files.
  jQuery.fn.select2.amd = S2;

  // Return the Select2 instance for anyone who is importing it.
  return select2;
}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdDIuZnVsbC5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwiZXhwb3J0cyIsInJlcXVpcmUiLCJqUXVlcnkiLCJTMiIsImZuIiwic2VsZWN0MiIsInJlcXVpcmVqcyIsInVuZGVmIiwiaGFzUHJvcCIsIm9iaiIsInByb3AiLCJoYXNPd24iLCJjYWxsIiwibm9ybWFsaXplIiwibmFtZSIsImJhc2VOYW1lIiwibmFtZVBhcnRzIiwibmFtZVNlZ21lbnQiLCJtYXBWYWx1ZSIsImZvdW5kTWFwIiwibGFzdEluZGV4IiwiZm91bmRJIiwiZm91bmRTdGFyTWFwIiwic3RhckkiLCJpIiwiaiIsInBhcnQiLCJiYXNlUGFydHMiLCJzcGxpdCIsIm1hcCIsImNvbmZpZyIsInN0YXJNYXAiLCJjaGFyQXQiLCJsZW5ndGgiLCJub2RlSWRDb21wYXQiLCJqc1N1ZmZpeFJlZ0V4cCIsInRlc3QiLCJyZXBsYWNlIiwic2xpY2UiLCJjb25jYXQiLCJzcGxpY2UiLCJqb2luIiwiaW5kZXhPZiIsInN1YnN0cmluZyIsIm1ha2VSZXF1aXJlIiwicmVsTmFtZSIsImZvcmNlU3luYyIsImFyZ3MiLCJhcHMiLCJhcmd1bWVudHMiLCJwdXNoIiwicmVxIiwiYXBwbHkiLCJtYWtlTm9ybWFsaXplIiwibWFrZUxvYWQiLCJkZXBOYW1lIiwidmFsdWUiLCJkZWZpbmVkIiwiY2FsbERlcCIsIndhaXRpbmciLCJkZWZpbmluZyIsIm1haW4iLCJFcnJvciIsInNwbGl0UHJlZml4IiwicHJlZml4IiwiaW5kZXgiLCJtYWtlQ29uZmlnIiwibWFrZU1hcCIsImhhbmRsZXJzIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJwbHVnaW4iLCJwYXJ0cyIsImYiLCJuIiwicHIiLCJwIiwiZSIsIm1vZHVsZSIsImlkIiwidXJpIiwiZGVwcyIsImNhbGxiYWNrIiwiY2pzTW9kdWxlIiwicmV0IiwidXNpbmdFeHBvcnRzIiwiY2FsbGJhY2tUeXBlIiwibG9hZCIsInVuZGVmaW5lZCIsImFsdCIsInNldFRpbWVvdXQiLCJjZmciLCJfZGVmaW5lZCIsIl8kIiwiJCIsImNvbnNvbGUiLCJlcnJvciIsImdldE1ldGhvZHMiLCJ0aGVDbGFzcyIsInByb3RvIiwibWV0aG9kcyIsIm1ldGhvZE5hbWUiLCJtIiwiVXRpbHMiLCJFeHRlbmQiLCJDaGlsZENsYXNzIiwiU3VwZXJDbGFzcyIsIkJhc2VDb25zdHJ1Y3RvciIsInRoaXMiLCJjb25zdHJ1Y3RvciIsIl9faGFzUHJvcCIsImtleSIsIl9fc3VwZXJfXyIsIkRlY29yYXRlIiwiRGVjb3JhdG9yQ2xhc3MiLCJEZWNvcmF0ZWRDbGFzcyIsInVuc2hpZnQiLCJBcnJheSIsImFyZ0NvdW50IiwiY2FsbGVkQ29uc3RydWN0b3IiLCJjdHIiLCJkZWNvcmF0ZWRNZXRob2RzIiwic3VwZXJNZXRob2RzIiwiZGlzcGxheU5hbWUiLCJzdXBlck1ldGhvZCIsImNhbGxlZE1ldGhvZCIsIm9yaWdpbmFsTWV0aG9kIiwiZGVjb3JhdGVkTWV0aG9kIiwiZCIsIk9ic2VydmFibGUiLCJsaXN0ZW5lcnMiLCJvbiIsImV2ZW50IiwidHJpZ2dlciIsInBhcmFtcyIsIl90eXBlIiwiaW52b2tlIiwibGVuIiwiZ2VuZXJhdGVDaGFycyIsImNoYXJzIiwicmFuZG9tQ2hhciIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsInRvU3RyaW5nIiwiYmluZCIsImZ1bmMiLCJjb250ZXh0IiwiX2NvbnZlcnREYXRhIiwiZGF0YSIsIm9yaWdpbmFsS2V5Iiwia2V5cyIsImRhdGFMZXZlbCIsImsiLCJ0b0xvd2VyQ2FzZSIsImhhc1Njcm9sbCIsImVsIiwiJGVsIiwib3ZlcmZsb3dYIiwic3R5bGUiLCJvdmVyZmxvd1kiLCJpbm5lckhlaWdodCIsInNjcm9sbEhlaWdodCIsImlubmVyV2lkdGgiLCJzY3JvbGxXaWR0aCIsImVzY2FwZU1hcmt1cCIsIm1hcmt1cCIsInJlcGxhY2VNYXAiLCJcXCIsIiYiLCI8IiwiPiIsIlwiIiwiJyIsIi8iLCJTdHJpbmciLCJtYXRjaCIsImFwcGVuZE1hbnkiLCIkZWxlbWVudCIsIiRub2RlcyIsImpxdWVyeSIsInN1YnN0ciIsIiRqcU5vZGVzIiwibm9kZSIsImFkZCIsImFwcGVuZCIsIlJlc3VsdHMiLCJvcHRpb25zIiwiZGF0YUFkYXB0ZXIiLCJyZW5kZXIiLCIkcmVzdWx0cyIsImdldCIsImF0dHIiLCJjbGVhciIsImVtcHR5IiwiZGlzcGxheU1lc3NhZ2UiLCJoaWRlTG9hZGluZyIsIiRtZXNzYWdlIiwibWVzc2FnZSIsImNsYXNzTmFtZSIsImhpZGVNZXNzYWdlcyIsImZpbmQiLCJyZW1vdmUiLCIkb3B0aW9ucyIsInJlc3VsdHMiLCJjaGlsZHJlbiIsInNvcnQiLCJpdGVtIiwiJG9wdGlvbiIsIm9wdGlvbiIsInBvc2l0aW9uIiwiJGRyb3Bkb3duIiwiJHJlc3VsdHNDb250YWluZXIiLCJzb3J0ZXIiLCJoaWdobGlnaHRGaXJzdEl0ZW0iLCIkc2VsZWN0ZWQiLCJmaWx0ZXIiLCJmaXJzdCIsImVuc3VyZUhpZ2hsaWdodFZpc2libGUiLCJzZXRDbGFzc2VzIiwic2VsZiIsImN1cnJlbnQiLCJzZWxlY3RlZCIsInNlbGVjdGVkSWRzIiwicyIsImVhY2giLCJlbGVtZW50IiwiaW5BcnJheSIsInNob3dMb2FkaW5nIiwibG9hZGluZ01vcmUiLCJsb2FkaW5nIiwiZGlzYWJsZWQiLCJ0ZXh0IiwiJGxvYWRpbmciLCJwcmVwZW5kIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiYXR0cnMiLCJyb2xlIiwiYXJpYS1zZWxlY3RlZCIsIl9yZXN1bHRJZCIsInRpdGxlIiwidmFsIiwic2V0QXR0cmlidXRlIiwibGFiZWwiLCJ0ZW1wbGF0ZSIsIiRjaGlsZHJlbiIsImMiLCJjaGlsZCIsIiRjaGlsZCIsIiRjaGlsZHJlbkNvbnRhaW5lciIsImNsYXNzIiwiY29udGFpbmVyIiwiJGNvbnRhaW5lciIsImlzT3BlbiIsInJlbW92ZUF0dHIiLCIkaGlnaGxpZ2h0ZWQiLCJnZXRIaWdobGlnaHRlZFJlc3VsdHMiLCJjdXJyZW50SW5kZXgiLCJuZXh0SW5kZXgiLCIkbmV4dCIsImVxIiwiY3VycmVudE9mZnNldCIsIm9mZnNldCIsInRvcCIsIm5leHRUb3AiLCJuZXh0T2Zmc2V0Iiwic2Nyb2xsVG9wIiwib3V0ZXJIZWlnaHQiLCJuZXh0Qm90dG9tIiwiYWRkQ2xhc3MiLCJtb3VzZXdoZWVsIiwiYm90dG9tIiwiZGVsdGFZIiwiaXNBdFRvcCIsImlzQXRCb3R0b20iLCJoZWlnaHQiLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BQcm9wYWdhdGlvbiIsImV2dCIsIiR0aGlzIiwib3JpZ2luYWxFdmVudCIsInJlbW92ZUNsYXNzIiwiZGVzdHJveSIsIm9mZnNldERlbHRhIiwicmVzdWx0IiwiY29udGVudCIsImRpc3BsYXkiLCJpbm5lckhUTUwiLCJLRVlTIiwiQkFDS1NQQUNFIiwiVEFCIiwiRU5URVIiLCJTSElGVCIsIkNUUkwiLCJBTFQiLCJFU0MiLCJTUEFDRSIsIlBBR0VfVVAiLCJQQUdFX0RPV04iLCJFTkQiLCJIT01FIiwiTEVGVCIsIlVQIiwiUklHSFQiLCJET1dOIiwiREVMRVRFIiwiQmFzZVNlbGVjdGlvbiIsIiRzZWxlY3Rpb24iLCJfdGFiaW5kZXgiLCJyZXN1bHRzSWQiLCJfaGFuZGxlQmx1ciIsIndoaWNoIiwidXBkYXRlIiwiX2F0dGFjaENsb3NlSGFuZGxlciIsImZvY3VzIiwiX2RldGFjaENsb3NlSGFuZGxlciIsIndpbmRvdyIsImFjdGl2ZUVsZW1lbnQiLCJjb250YWlucyIsImJvZHkiLCIkdGFyZ2V0IiwidGFyZ2V0IiwiJHNlbGVjdCIsImNsb3Nlc3QiLCIkYWxsIiwib2ZmIiwiJHNlbGVjdGlvbkNvbnRhaW5lciIsIlNpbmdsZVNlbGVjdGlvbiIsImh0bWwiLCJzZWxlY3Rpb25Db250YWluZXIiLCJzZWxlY3Rpb24iLCIkcmVuZGVyZWQiLCJmb3JtYXR0ZWQiLCJNdWx0aXBsZVNlbGVjdGlvbiIsIiRyZW1vdmUiLCJwYXJlbnQiLCIkc2VsZWN0aW9ucyIsIlBsYWNlaG9sZGVyIiwiZGVjb3JhdGVkIiwicGxhY2Vob2xkZXIiLCJub3JtYWxpemVQbGFjZWhvbGRlciIsIl8iLCJjcmVhdGVQbGFjZWhvbGRlciIsIiRwbGFjZWhvbGRlciIsInNpbmdsZVBsYWNlaG9sZGVyIiwibXVsdGlwbGVTZWxlY3Rpb25zIiwiQWxsb3dDbGVhciIsIl9oYW5kbGVDbGVhciIsIl9oYW5kbGVLZXlib2FyZENsZWFyIiwiJGNsZWFyIiwidW5zZWxlY3REYXRhIiwicHJldmVudGVkIiwiU2VhcmNoIiwiJHNlYXJjaCIsIiRzZWFyY2hDb250YWluZXIiLCJfdHJhbnNmZXJUYWJJbmRleCIsIl9rZXlVcFByZXZlbnRlZCIsImlzRGVmYXVsdFByZXZlbnRlZCIsIiRwcmV2aW91c0Nob2ljZSIsInByZXYiLCJzZWFyY2hSZW1vdmVDaG9pY2UiLCJtc2llIiwiZG9jdW1lbnRNb2RlIiwiZGlzYWJsZUlucHV0RXZlbnRzIiwidHlwZSIsImhhbmRsZVNlYXJjaCIsInNlYXJjaEhhZEZvY3VzIiwicmVzaXplU2VhcmNoIiwiaW5wdXQiLCJ0ZXJtIiwiY3NzIiwid2lkdGgiLCJtaW5pbXVtV2lkdGgiLCJFdmVudFJlbGF5IiwicmVsYXlFdmVudHMiLCJwcmV2ZW50YWJsZUV2ZW50cyIsIkV2ZW50IiwiVHJhbnNsYXRpb24iLCJkaWN0IiwiYWxsIiwiZXh0ZW5kIiwidHJhbnNsYXRpb24iLCJfY2FjaGUiLCJsb2FkUGF0aCIsInBhdGgiLCJ0cmFuc2xhdGlvbnMiLCJkaWFjcml0aWNzIiwi4pK2Iiwi77yhIiwiw4AiLCLDgSIsIsOCIiwi4bqmIiwi4bqkIiwi4bqqIiwi4bqoIiwiw4MiLCLEgCIsIsSCIiwi4bqwIiwi4bquIiwi4bq0Iiwi4bqyIiwiyKYiLCLHoCIsIsOEIiwix54iLCLhuqIiLCLDhSIsIse6Iiwix40iLCLIgCIsIsiCIiwi4bqgIiwi4bqsIiwi4bq2Iiwi4biAIiwixIQiLCLIuiIsIuKxryIsIuqcsiIsIsOGIiwix7wiLCLHoiIsIuqctCIsIuqctiIsIuqcuCIsIuqcuiIsIuqcvCIsIuKStyIsIu+8oiIsIuG4giIsIuG4hCIsIuG4hiIsIsmDIiwixoIiLCLGgSIsIuKSuCIsIu+8oyIsIsSGIiwixIgiLCLEiiIsIsSMIiwiw4ciLCLhuIgiLCLGhyIsIsi7Iiwi6py+Iiwi4pK5Iiwi77ykIiwi4biKIiwixI4iLCLhuIwiLCLhuJAiLCLhuJIiLCLhuI4iLCLEkCIsIsaLIiwixooiLCLGiSIsIuqduSIsIsexIiwix4QiLCLHsiIsIseFIiwi4pK6Iiwi77ylIiwiw4giLCLDiSIsIsOKIiwi4buAIiwi4bq+Iiwi4buEIiwi4buCIiwi4bq8IiwixJIiLCLhuJQiLCLhuJYiLCLElCIsIsSWIiwiw4siLCLhuroiLCLEmiIsIsiEIiwiyIYiLCLhurgiLCLhu4YiLCLIqCIsIuG4nCIsIsSYIiwi4biYIiwi4biaIiwixpAiLCLGjiIsIuKSuyIsIu+8piIsIuG4niIsIsaRIiwi6p27Iiwi4pK8Iiwi77ynIiwix7QiLCLEnCIsIuG4oCIsIsSeIiwixKAiLCLHpiIsIsSiIiwix6QiLCLGkyIsIuqeoCIsIuqdvSIsIuqdviIsIuKSvSIsIu+8qCIsIsSkIiwi4biiIiwi4bimIiwiyJ4iLCLhuKQiLCLhuKgiLCLhuKoiLCLEpiIsIuKxpyIsIuKxtSIsIuqejSIsIuKSviIsIu+8qSIsIsOMIiwiw40iLCLDjiIsIsSoIiwixKoiLCLErCIsIsSwIiwiw48iLCLhuK4iLCLhu4giLCLHjyIsIsiIIiwiyIoiLCLhu4oiLCLEriIsIuG4rCIsIsaXIiwi4pK/Iiwi77yqIiwixLQiLCLJiCIsIuKTgCIsIu+8qyIsIuG4sCIsIseoIiwi4biyIiwixLYiLCLhuLQiLCLGmCIsIuKxqSIsIuqdgCIsIuqdgiIsIuqdhCIsIuqeoiIsIuKTgSIsIu+8rCIsIsS/IiwixLkiLCLEvSIsIuG4tiIsIuG4uCIsIsS7Iiwi4bi8Iiwi4bi6IiwixYEiLCLIvSIsIuKxoiIsIuKxoCIsIuqdiCIsIuqdhiIsIuqegCIsIseHIiwix4giLCLik4IiLCLvvK0iLCLhuL4iLCLhuYAiLCLhuYIiLCLisa4iLCLGnCIsIuKTgyIsIu+8riIsIse4IiwixYMiLCLDkSIsIuG5hCIsIsWHIiwi4bmGIiwixYUiLCLhuYoiLCLhuYgiLCLIoCIsIsadIiwi6p6QIiwi6p6kIiwix4oiLCLHiyIsIuKThCIsIu+8ryIsIsOSIiwiw5MiLCLDlCIsIuG7kiIsIuG7kCIsIuG7liIsIuG7lCIsIsOVIiwi4bmMIiwiyKwiLCLhuY4iLCLFjCIsIuG5kCIsIuG5kiIsIsWOIiwiyK4iLCLIsCIsIsOWIiwiyKoiLCLhu44iLCLFkCIsIseRIiwiyIwiLCLIjiIsIsagIiwi4bucIiwi4buaIiwi4bugIiwi4bueIiwi4buiIiwi4buMIiwi4buYIiwix6oiLCLHrCIsIsOYIiwix74iLCLGhiIsIsafIiwi6p2KIiwi6p2MIiwixqIiLCLqnY4iLCLIoiIsIuKThSIsIu+8sCIsIuG5lCIsIuG5liIsIsakIiwi4rGjIiwi6p2QIiwi6p2SIiwi6p2UIiwi4pOGIiwi77yxIiwi6p2WIiwi6p2YIiwiyYoiLCLik4ciLCLvvLIiLCLFlCIsIuG5mCIsIsWYIiwiyJAiLCLIkiIsIuG5miIsIuG5nCIsIsWWIiwi4bmeIiwiyYwiLCLisaQiLCLqnZoiLCLqnqYiLCLqnoIiLCLik4giLCLvvLMiLCLhup4iLCLFmiIsIuG5pCIsIsWcIiwi4bmgIiwixaAiLCLhuaYiLCLhuaIiLCLhuagiLCLImCIsIsWeIiwi4rG+Iiwi6p6oIiwi6p6EIiwi4pOJIiwi77y0Iiwi4bmqIiwixaQiLCLhuawiLCLImiIsIsWiIiwi4bmwIiwi4bmuIiwixaYiLCLGrCIsIsauIiwiyL4iLCLqnoYiLCLqnKgiLCLik4oiLCLvvLUiLCLDmSIsIsOaIiwiw5siLCLFqCIsIuG5uCIsIsWqIiwi4bm6IiwixawiLCLDnCIsIsebIiwix5ciLCLHlSIsIseZIiwi4bumIiwixa4iLCLFsCIsIseTIiwiyJQiLCLIliIsIsavIiwi4buqIiwi4buoIiwi4buuIiwi4busIiwi4buwIiwi4bukIiwi4bmyIiwixbIiLCLhubYiLCLhubQiLCLJhCIsIuKTiyIsIu+8tiIsIuG5vCIsIuG5viIsIsayIiwi6p2eIiwiyYUiLCLqnaAiLCLik4wiLCLvvLciLCLhuoAiLCLhuoIiLCLFtCIsIuG6hiIsIuG6hCIsIuG6iCIsIuKxsiIsIuKTjSIsIu+8uCIsIuG6iiIsIuG6jCIsIuKTjiIsIu+8uSIsIuG7siIsIsOdIiwixbYiLCLhu7giLCLIsiIsIuG6jiIsIsW4Iiwi4bu2Iiwi4bu0IiwixrMiLCLJjiIsIuG7viIsIuKTjyIsIu+8uiIsIsW5Iiwi4bqQIiwixbsiLCLFvSIsIuG6kiIsIuG6lCIsIsa1IiwiyKQiLCLisb8iLCLisasiLCLqnaIiLCLik5AiLCLvvYEiLCLhupoiLCLDoCIsIsOhIiwiw6IiLCLhuqciLCLhuqUiLCLhuqsiLCLhuqkiLCLDoyIsIsSBIiwixIMiLCLhurEiLCLhuq8iLCLhurUiLCLhurMiLCLIpyIsIsehIiwiw6QiLCLHnyIsIuG6oyIsIsOlIiwix7siLCLHjiIsIsiBIiwiyIMiLCLhuqEiLCLhuq0iLCLhurciLCLhuIEiLCLEhSIsIuKxpSIsIsmQIiwi6pyzIiwiw6YiLCLHvSIsIsejIiwi6py1Iiwi6py3Iiwi6py5Iiwi6py7Iiwi6py9Iiwi4pORIiwi772CIiwi4biDIiwi4biFIiwi4biHIiwixoAiLCLGgyIsIsmTIiwi4pOSIiwi772DIiwixIciLCLEiSIsIsSLIiwixI0iLCLDpyIsIuG4iSIsIsaIIiwiyLwiLCLqnL8iLCLihoQiLCLik5MiLCLvvYQiLCLhuIsiLCLEjyIsIuG4jSIsIuG4kSIsIuG4kyIsIuG4jyIsIsSRIiwixowiLCLJliIsIsmXIiwi6p26Iiwix7MiLCLHhiIsIuKTlCIsIu+9hSIsIsOoIiwiw6kiLCLDqiIsIuG7gSIsIuG6vyIsIuG7hSIsIuG7gyIsIuG6vSIsIsSTIiwi4biVIiwi4biXIiwixJUiLCLElyIsIsOrIiwi4bq7IiwixJsiLCLIhSIsIsiHIiwi4bq5Iiwi4buHIiwiyKkiLCLhuJ0iLCLEmSIsIuG4mSIsIuG4myIsIsmHIiwiyZsiLCLHnSIsIuKTlSIsIu+9hiIsIuG4nyIsIsaSIiwi6p28Iiwi4pOWIiwi772HIiwix7UiLCLEnSIsIuG4oSIsIsSfIiwixKEiLCLHpyIsIsSjIiwix6UiLCLJoCIsIuqeoSIsIuG1uSIsIuqdvyIsIuKTlyIsIu+9iCIsIsSlIiwi4bijIiwi4binIiwiyJ8iLCLhuKUiLCLhuKkiLCLhuKsiLCLhupYiLCLEpyIsIuKxqCIsIuKxtiIsIsmlIiwixpUiLCLik5giLCLvvYkiLCLDrCIsIsOtIiwiw64iLCLEqSIsIsSrIiwixK0iLCLDryIsIuG4ryIsIuG7iSIsIseQIiwiyIkiLCLIiyIsIuG7iyIsIsSvIiwi4bitIiwiyagiLCLEsSIsIuKTmSIsIu+9iiIsIsS1Iiwix7AiLCLJiSIsIuKTmiIsIu+9iyIsIuG4sSIsIsepIiwi4bizIiwixLciLCLhuLUiLCLGmSIsIuKxqiIsIuqdgSIsIuqdgyIsIuqdhSIsIuqeoyIsIuKTmyIsIu+9jCIsIsWAIiwixLoiLCLEviIsIuG4tyIsIuG4uSIsIsS8Iiwi4bi9Iiwi4bi7Iiwixb8iLCLFgiIsIsaaIiwiyasiLCLisaEiLCLqnYkiLCLqnoEiLCLqnYciLCLHiSIsIuKTnCIsIu+9jSIsIuG4vyIsIuG5gSIsIuG5gyIsIsmxIiwiya8iLCLik50iLCLvvY4iLCLHuSIsIsWEIiwiw7EiLCLhuYUiLCLFiCIsIuG5hyIsIsWGIiwi4bmLIiwi4bmJIiwixp4iLCLJsiIsIsWJIiwi6p6RIiwi6p6lIiwix4wiLCLik54iLCLvvY8iLCLDsiIsIsOzIiwiw7QiLCLhu5MiLCLhu5EiLCLhu5ciLCLhu5UiLCLDtSIsIuG5jSIsIsitIiwi4bmPIiwixY0iLCLhuZEiLCLhuZMiLCLFjyIsIsivIiwiyLEiLCLDtiIsIsirIiwi4buPIiwixZEiLCLHkiIsIsiNIiwiyI8iLCLGoSIsIuG7nSIsIuG7myIsIuG7oSIsIuG7nyIsIuG7oyIsIuG7jSIsIuG7mSIsIserIiwix60iLCLDuCIsIse/IiwiyZQiLCLqnYsiLCLqnY0iLCLJtSIsIsajIiwiyKMiLCLqnY8iLCLik58iLCLvvZAiLCLhuZUiLCLhuZciLCLGpSIsIuG1vSIsIuqdkSIsIuqdkyIsIuqdlSIsIuKToCIsIu+9kSIsIsmLIiwi6p2XIiwi6p2ZIiwi4pOhIiwi772SIiwixZUiLCLhuZkiLCLFmSIsIsiRIiwiyJMiLCLhuZsiLCLhuZ0iLCLFlyIsIuG5nyIsIsmNIiwiyb0iLCLqnZsiLCLqnqciLCLqnoMiLCLik6IiLCLvvZMiLCLDnyIsIsWbIiwi4bmlIiwixZ0iLCLhuaEiLCLFoSIsIuG5pyIsIuG5oyIsIuG5qSIsIsiZIiwixZ8iLCLIvyIsIuqeqSIsIuqehSIsIuG6myIsIuKToyIsIu+9lCIsIuG5qyIsIuG6lyIsIsWlIiwi4bmtIiwiyJsiLCLFoyIsIuG5sSIsIuG5ryIsIsWnIiwixq0iLCLKiCIsIuKxpiIsIuqehyIsIuqcqSIsIuKTpCIsIu+9lSIsIsO5Iiwiw7oiLCLDuyIsIsWpIiwi4bm5IiwixasiLCLhubsiLCLFrSIsIsO8Iiwix5wiLCLHmCIsIseWIiwix5oiLCLhu6ciLCLFryIsIsWxIiwix5QiLCLIlSIsIsiXIiwixrAiLCLhu6siLCLhu6kiLCLhu68iLCLhu60iLCLhu7EiLCLhu6UiLCLhubMiLCLFsyIsIuG5tyIsIuG5tSIsIsqJIiwi4pOlIiwi772WIiwi4bm9Iiwi4bm/IiwiyosiLCLqnZ8iLCLKjCIsIuqdoSIsIuKTpiIsIu+9lyIsIuG6gSIsIuG6gyIsIsW1Iiwi4bqHIiwi4bqFIiwi4bqYIiwi4bqJIiwi4rGzIiwi4pOnIiwi772YIiwi4bqLIiwi4bqNIiwi4pOoIiwi772ZIiwi4buzIiwiw70iLCLFtyIsIuG7uSIsIsizIiwi4bqPIiwiw78iLCLhu7ciLCLhupkiLCLhu7UiLCLGtCIsIsmPIiwi4bu/Iiwi4pOpIiwi772aIiwixboiLCLhupEiLCLFvCIsIsW+Iiwi4bqTIiwi4bqVIiwixrYiLCLIpSIsIsmAIiwi4rGsIiwi6p2jIiwizoYiLCLOiCIsIs6JIiwizooiLCLOqiIsIs6MIiwizo4iLCLOqyIsIs6PIiwizqwiLCLOrSIsIs6uIiwizq8iLCLPiiIsIs6QIiwiz4wiLCLPjSIsIs+LIiwizrAiLCLPiSIsIs+CIiwiQmFzZUFkYXB0ZXIiLCJxdWVyeSIsImdlbmVyYXRlUmVzdWx0SWQiLCJTZWxlY3RBZGFwdGVyIiwic2VsZWN0IiwiaXMiLCJjdXJyZW50RGF0YSIsInVuc2VsZWN0IiwicmVtb3ZlRGF0YSIsIm1hdGNoZXMiLCJhZGRPcHRpb25zIiwidGV4dENvbnRlbnQiLCJpbm5lclRleHQiLCJub3JtYWxpemVkRGF0YSIsIl9ub3JtYWxpemVJdGVtIiwiaXNQbGFpbk9iamVjdCIsImRlZmF1bHRzIiwibWF0Y2hlciIsIkFycmF5QWRhcHRlciIsImNvbnZlcnRUb09wdGlvbnMiLCJlbG0iLCJvbmx5SXRlbSIsIiRleGlzdGluZyIsImV4aXN0aW5nSWRzIiwiJGV4aXN0aW5nT3B0aW9uIiwiZXhpc3RpbmdEYXRhIiwibmV3RGF0YSIsIiRuZXdPcHRpb24iLCJyZXBsYWNlV2l0aCIsIkFqYXhBZGFwdGVyIiwiYWpheE9wdGlvbnMiLCJfYXBwbHlEZWZhdWx0cyIsInByb2Nlc3NSZXN1bHRzIiwicSIsInRyYW5zcG9ydCIsInN1Y2Nlc3MiLCJmYWlsdXJlIiwiJHJlcXVlc3QiLCJhamF4IiwidGhlbiIsImZhaWwiLCJyZXF1ZXN0IiwiaXNBcnJheSIsInN0YXR1cyIsIl9yZXF1ZXN0IiwiaXNGdW5jdGlvbiIsImFib3J0IiwidXJsIiwiZGVsYXkiLCJfcXVlcnlUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiVGFncyIsInRhZ3MiLCJjcmVhdGVUYWciLCJpbnNlcnRUYWciLCJ0IiwidGFnIiwid3JhcHBlciIsImNoZWNrQ2hpbGRyZW4iLCJjaGVja1RleHQiLCJfcmVtb3ZlT2xkVGFncyIsInBhZ2UiLCJ0cmltIiwiX2xhc3RUYWciLCJUb2tlbml6ZXIiLCJ0b2tlbml6ZXIiLCJkcm9wZG93biIsImNyZWF0ZUFuZFNlbGVjdCIsIiRleGlzdGluZ09wdGlvbnMiLCJ0b2tlbkRhdGEiLCJzZXBhcmF0b3JzIiwidGVybUNoYXIiLCJwYXJ0UGFyYW1zIiwiTWluaW11bUlucHV0TGVuZ3RoIiwiJGUiLCJtaW5pbXVtSW5wdXRMZW5ndGgiLCJtaW5pbXVtIiwiTWF4aW11bUlucHV0TGVuZ3RoIiwibWF4aW11bUlucHV0TGVuZ3RoIiwibWF4aW11bSIsIk1heGltdW1TZWxlY3Rpb25MZW5ndGgiLCJtYXhpbXVtU2VsZWN0aW9uTGVuZ3RoIiwiY291bnQiLCJEcm9wZG93biIsInNob3dTZWFyY2giLCJIaWRlUGxhY2Vob2xkZXIiLCJyZW1vdmVQbGFjZWhvbGRlciIsIm1vZGlmaWVkRGF0YSIsIkluZmluaXRlU2Nyb2xsIiwibGFzdFBhcmFtcyIsIiRsb2FkaW5nTW9yZSIsImNyZWF0ZUxvYWRpbmdNb3JlIiwic2hvd0xvYWRpbmdNb3JlIiwiaXNMb2FkTW9yZVZpc2libGUiLCJkb2N1bWVudEVsZW1lbnQiLCJsb2FkaW5nTW9yZU9mZnNldCIsImxvYWRNb3JlIiwicGFnaW5hdGlvbiIsIm1vcmUiLCJBdHRhY2hCb2R5IiwiJGRyb3Bkb3duUGFyZW50Iiwic2V0dXBSZXN1bHRzRXZlbnRzIiwiX3Nob3dEcm9wZG93biIsIl9hdHRhY2hQb3NpdGlvbmluZ0hhbmRsZXIiLCJfcG9zaXRpb25Ecm9wZG93biIsIl9yZXNpemVEcm9wZG93biIsIl9oaWRlRHJvcGRvd24iLCJfZGV0YWNoUG9zaXRpb25pbmdIYW5kbGVyIiwiJGRyb3Bkb3duQ29udGFpbmVyIiwiZGV0YWNoIiwic2Nyb2xsRXZlbnQiLCJyZXNpemVFdmVudCIsIm9yaWVudGF0aW9uRXZlbnQiLCIkd2F0Y2hlcnMiLCJwYXJlbnRzIiwieCIsInNjcm9sbExlZnQiLCJ5IiwiZXYiLCIkd2luZG93IiwiaXNDdXJyZW50bHlBYm92ZSIsImhhc0NsYXNzIiwiaXNDdXJyZW50bHlCZWxvdyIsIm5ld0RpcmVjdGlvbiIsInZpZXdwb3J0IiwiZW5vdWdoUm9vbUFib3ZlIiwiZW5vdWdoUm9vbUJlbG93IiwibGVmdCIsIiRvZmZzZXRQYXJlbnQiLCJvZmZzZXRQYXJlbnQiLCJwYXJlbnRPZmZzZXQiLCJvdXRlcldpZHRoIiwibWluV2lkdGgiLCJhcHBlbmRUbyIsImNvdW50UmVzdWx0cyIsIk1pbmltdW1SZXN1bHRzRm9yU2VhcmNoIiwibWluaW11bVJlc3VsdHNGb3JTZWFyY2giLCJJbmZpbml0eSIsIlNlbGVjdE9uQ2xvc2UiLCJfaGFuZGxlU2VsZWN0T25DbG9zZSIsIm9yaWdpbmFsU2VsZWN0MkV2ZW50IiwiJGhpZ2hsaWdodGVkUmVzdWx0cyIsIkNsb3NlT25TZWxlY3QiLCJfc2VsZWN0VHJpZ2dlcmVkIiwiY3RybEtleSIsImVycm9yTG9hZGluZyIsImlucHV0VG9vTG9uZyIsIm92ZXJDaGFycyIsImlucHV0VG9vU2hvcnQiLCJyZW1haW5pbmdDaGFycyIsIm1heGltdW1TZWxlY3RlZCIsIm5vUmVzdWx0cyIsInNlYXJjaGluZyIsIlJlc3VsdHNMaXN0IiwiU2VsZWN0aW9uU2VhcmNoIiwiRElBQ1JJVElDUyIsIlNlbGVjdERhdGEiLCJBcnJheURhdGEiLCJBamF4RGF0YSIsIkRyb3Bkb3duU2VhcmNoIiwiRW5nbGlzaFRyYW5zbGF0aW9uIiwiRGVmYXVsdHMiLCJyZXNldCIsInRva2VuU2VwYXJhdG9ycyIsIlF1ZXJ5IiwiYW1kQmFzZSIsImluaXRTZWxlY3Rpb24iLCJJbml0U2VsZWN0aW9uIiwicmVzdWx0c0FkYXB0ZXIiLCJzZWxlY3RPbkNsb3NlIiwiZHJvcGRvd25BZGFwdGVyIiwibXVsdGlwbGUiLCJTZWFyY2hhYmxlRHJvcGRvd24iLCJjbG9zZU9uU2VsZWN0IiwiZHJvcGRvd25Dc3NDbGFzcyIsImRyb3Bkb3duQ3NzIiwiYWRhcHREcm9wZG93bkNzc0NsYXNzIiwiRHJvcGRvd25DU1MiLCJzZWxlY3Rpb25BZGFwdGVyIiwiYWxsb3dDbGVhciIsImNvbnRhaW5lckNzc0NsYXNzIiwiY29udGFpbmVyQ3NzIiwiYWRhcHRDb250YWluZXJDc3NDbGFzcyIsIkNvbnRhaW5lckNTUyIsImxhbmd1YWdlIiwibGFuZ3VhZ2VQYXJ0cyIsImJhc2VMYW5ndWFnZSIsImxhbmd1YWdlcyIsImxhbmd1YWdlTmFtZXMiLCJsIiwiYW1kTGFuZ3VhZ2VCYXNlIiwiZXgiLCJkZWJ1ZyIsIndhcm4iLCJiYXNlVHJhbnNsYXRpb24iLCJjdXN0b21UcmFuc2xhdGlvbiIsInN0cmlwRGlhY3JpdGljcyIsImEiLCJvcmlnaW5hbCIsInRvVXBwZXJDYXNlIiwiZHJvcGRvd25BdXRvV2lkdGgiLCJ0ZW1wbGF0ZVJlc3VsdCIsInRlbXBsYXRlU2VsZWN0aW9uIiwidGhlbWUiLCJzZXQiLCJjYW1lbEtleSIsImNhbWVsQ2FzZSIsImNvbnZlcnRlZERhdGEiLCJPcHRpb25zIiwiZnJvbUVsZW1lbnQiLCJJbnB1dENvbXBhdCIsImV4Y2x1ZGVkRGF0YSIsImRpciIsImRhdGFzZXQiLCJTZWxlY3QyIiwiX2dlbmVyYXRlSWQiLCJ0YWJpbmRleCIsIkRhdGFBZGFwdGVyIiwiX3BsYWNlQ29udGFpbmVyIiwiU2VsZWN0aW9uQWRhcHRlciIsIkRyb3Bkb3duQWRhcHRlciIsIlJlc3VsdHNBZGFwdGVyIiwiX2JpbmRBZGFwdGVycyIsIl9yZWdpc3RlckRvbUV2ZW50cyIsIl9yZWdpc3RlckRhdGFFdmVudHMiLCJfcmVnaXN0ZXJTZWxlY3Rpb25FdmVudHMiLCJfcmVnaXN0ZXJEcm9wZG93bkV2ZW50cyIsIl9yZWdpc3RlclJlc3VsdHNFdmVudHMiLCJfcmVnaXN0ZXJFdmVudHMiLCJpbml0aWFsRGF0YSIsIl9zeW5jQXR0cmlidXRlcyIsImluc2VydEFmdGVyIiwiX3Jlc29sdmVXaWR0aCIsIm1ldGhvZCIsIldJRFRIIiwic3R5bGVXaWR0aCIsImVsZW1lbnRXaWR0aCIsIl9zeW5jQSIsIl9zeW5jUyIsIl9zeW5jU3VidHJlZSIsImF0dGFjaEV2ZW50Iiwib2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwiV2ViS2l0TXV0YXRpb25PYnNlcnZlciIsIk1vek11dGF0aW9uT2JzZXJ2ZXIiLCJfb2JzZXJ2ZXIiLCJtdXRhdGlvbnMiLCJvYnNlcnZlIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsInN1YnRyZWUiLCJhZGRFdmVudExpc3RlbmVyIiwibm9uUmVsYXlFdmVudHMiLCJ0b2dnbGVEcm9wZG93biIsImFsdEtleSIsImNsb3NlIiwib3BlbiIsImNoYW5nZWQiLCJub2RlTmFtZSIsImFkZGVkTm9kZXMiLCJyZW1vdmVkTm9kZXMiLCJhY3R1YWxUcmlnZ2VyIiwicHJlVHJpZ2dlck1hcCIsInByZVRyaWdnZXJOYW1lIiwicHJlVHJpZ2dlckFyZ3MiLCJoYXNGb2N1cyIsImVuYWJsZSIsIm5ld1ZhbCIsImRldGFjaEV2ZW50IiwiZGlzY29ubmVjdCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJzeW5jQ3NzQ2xhc3NlcyIsIiRkZXN0IiwiJHNyYyIsImFkYXB0ZXIiLCJjbGFzc2VzIiwiYWRhcHRlZCIsInJlcGxhY2VtZW50cyIsIkNvbXBhdFV0aWxzIiwiX2NvbnRhaW5lckFkYXB0ZXIiLCJjbGF6eiIsImNvbnRhaW5lckNzc0FkYXB0ZXIiLCJfY3NzQWRhcHRlciIsIl9kcm9wZG93bkFkYXB0ZXIiLCJkcm9wZG93bkNzc0FkYXB0ZXIiLCJfaXNJbml0aWFsaXplZCIsIklucHV0RGF0YSIsIl9jdXJyZW50RGF0YSIsIl92YWx1ZVNlcGFyYXRvciIsImdldFNlbGVjdGVkIiwiYWxsRGF0YSIsInZhbHVlcyIsIm9sZE1hdGNoZXIiLCJ3cmFwcGVkTWF0Y2hlciIsImRvZXNNYXRjaCIsIkF0dGFjaENvbnRhaW5lciIsIlN0b3BQcm9wYWdhdGlvbiIsInN0b3BwZWRFdmVudHMiLCJoYW5kbGVyIiwib3JnRXZlbnQiLCJkZWx0YSIsImRlbHRhWCIsImFic0RlbHRhIiwib2Zmc2V0WCIsIm9mZnNldFkiLCJmaXgiLCJkZXRhaWwiLCJ3aGVlbERlbHRhIiwid2hlZWxEZWx0YVkiLCJ3aGVlbERlbHRhWCIsImF4aXMiLCJIT1JJWk9OVEFMX0FYSVMiLCJkZWx0YU1vZGUiLCJsaW5lSGVpZ2h0IiwicGFnZUhlaWdodCIsIm1heCIsImFicyIsImxvd2VzdERlbHRhIiwic2hvdWxkQWRqdXN0T2xkRGVsdGFzIiwic3BlY2lhbCIsInNldHRpbmdzIiwibm9ybWFsaXplT2Zmc2V0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiYm91bmRpbmdSZWN0IiwiY2xpZW50WCIsImNsaWVudFkiLCJkZWx0YUZhY3RvciIsIm51bGxMb3dlc3REZWx0YVRpbWVvdXQiLCJudWxsTG93ZXN0RGVsdGEiLCJkaXNwYXRjaCIsImhhbmRsZSIsImFkanVzdE9sZERlbHRhcyIsInRvRml4IiwidG9CaW5kIiwiZml4SG9va3MiLCJtb3VzZUhvb2tzIiwidmVyc2lvbiIsInNldHVwIiwib25tb3VzZXdoZWVsIiwiZ2V0TGluZUhlaWdodCIsImdldFBhZ2VIZWlnaHQiLCJ0ZWFyZG93biIsImVsZW0iLCIkZWxlbSIsIiRwYXJlbnQiLCJwYXJzZUludCIsInVubW91c2V3aGVlbCIsInVuYmluZCIsInRoaXNNZXRob2RzIiwiaW5zdGFuY2VPcHRpb25zIiwiaW5zdGFuY2UiXSwibWFwcGluZ3MiOiJDQU9DLFNBQVVBLEdBQ2Esa0JBQVhDLFNBQXlCQSxPQUFPQyxJQUV6Q0QsUUFBUSxVQUFXRCxHQUduQkEsRUFGNEIsZ0JBQVpHLFNBRVJDLFFBQVEsVUFHUkMsU0FFVixTQUFVQSxHQUlWLEdBQUlDLEdBQ0wsV0FHQyxHQUFJRCxHQUFVQSxFQUFPRSxJQUFNRixFQUFPRSxHQUFHQyxTQUFXSCxFQUFPRSxHQUFHQyxRQUFRTixJQUNoRSxHQUFJSSxHQUFLRCxFQUFPRSxHQUFHQyxRQUFRTixHQUUvQixJQUFJSSxFQXF2TUYsT0Fydk1NLFlBQWMsSUFBS0EsSUFBT0EsRUFBR0csVUFBVyxDQUMzQ0gsRUFBd0JGLEVBQVVFLEVBQTVCQSxJQVdYLElBQUlHLEdBQVdMLEVBQVNILEdBQ3ZCLFNBQVVTLEdBVVAsUUFBU0MsR0FBUUMsRUFBS0MsR0FDbEIsTUFBT0MsR0FBT0MsS0FBS0gsRUFBS0MsR0FXNUIsUUFBU0csR0FBVUMsRUFBTUMsR0FDckIsR0FBSUMsR0FBV0MsRUFBYUMsRUFBVUMsRUFBVUMsRUFDNUNDLEVBQVFDLEVBQWNDLEVBQU9DLEVBQUdDLEVBQUdDLEVBQ25DQyxFQUFZWixHQUFZQSxFQUFTYSxNQUFNLEtBQ3ZDQyxFQUFNQyxFQUFPRCxJQUNiRSxFQUFXRixHQUFPQSxFQUFJLFFBRzFCLElBQUlmLEdBQTJCLE1BQW5CQSxFQUFLa0IsT0FBTyxHQUlwQixHQUFJakIsRUFBVSxDQWdCVixJQWZBRCxFQUFPQSxFQUFLYyxN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QVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLEtBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxLQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxLQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxLQUNWQyxJQUFVLEtBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsS0FDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLEtBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBQ1ZDLElBQVUsSUFDVkMsSUFBVSxJQUNWQyxJQUFVLElBR1osT0FBT3YwQixLQUdUalksRUFBR0wsT0FBTyxxQkFDUixZQUNDLFNBQVUwRyxHQUNYLFFBQVNvbUMsR0FBYXpoQyxFQUFVUyxHQUM5QmdoQyxFQUFZM2xDLFVBQVVILFlBQVlsRyxLQUFLaUcsTUFrQ3pDLE1BL0JBTCxHQUFNQyxPQUFPbW1DLEVBQWFwbUMsRUFBTTBCLFlBRWhDMGtDLEVBQVl0b0MsVUFBVXdKLFFBQVUsU0FBVTNJLEdBQ3hDLEtBQU0sSUFBSXJCLE9BQU0sMkRBR2xCOG9DLEVBQVl0b0MsVUFBVXVvQyxNQUFRLFNBQVV0a0MsRUFBUXBELEdBQzlDLEtBQU0sSUFBSXJCLE9BQU0seURBR2xCOG9DLEVBQVl0b0MsVUFBVTRFLEtBQU8sU0FBVTJHLEVBQVdDLEtBSWxEODhCLEVBQVl0b0MsVUFBVXNOLFFBQVUsYUFJaENnN0IsRUFBWXRvQyxVQUFVd29DLGlCQUFtQixTQUFVajlCLEVBQVd2RyxHQUM1RCxHQUFJdEUsR0FBSzZLLEVBQVU3SyxHQUFLLFVBU3hCLE9BUEFBLElBQU13QixFQUFNbUMsY0FBYyxHQUd4QjNELEdBRGEsTUFBWHNFLEVBQUt0RSxHQUNELElBQU1zRSxFQUFLdEUsR0FBR2lFLFdBRWQsSUFBTXpDLEVBQU1tQyxjQUFjLElBSzdCaWtDLElBR1R6c0MsRUFBR0wsT0FBTyx1QkFDUixTQUNBLFdBQ0EsVUFDQyxTQUFVOHNDLEVBQWFwbUMsRUFBT1QsR0FDL0IsUUFBU2duQyxHQUFlNWhDLEVBQVVTLEdBQ2hDL0UsS0FBS3NFLFNBQVdBLEVBQ2hCdEUsS0FBSytFLFFBQVVBLEVBRWZtaEMsRUFBYzlsQyxVQUFVSCxZQUFZbEcsS0FBS2lHLE1Ba1IzQyxNQS9RQUwsR0FBTUMsT0FBT3NtQyxFQUFlSCxHQUU1QkcsRUFBY3pvQyxVQUFVd0osUUFBVSxTQUFVM0ksR0FDMUMsR0FBSW1FLE1BQ0F1RSxFQUFPaEgsSUFFWEEsTUFBS3NFLFNBQVN1QixLQUFLLGFBQWF3QixLQUFLLFdBQ25DLEdBQUlqQixHQUFVbEgsRUFBRWMsTUFFWnFHLEVBQVNXLEVBQUtiLEtBQUtDLEVBRXZCM0QsR0FBS3BHLEtBQUtnSyxLQUdaL0gsRUFBU21FLElBR1h5akMsRUFBY3pvQyxVQUFVMG9DLE9BQVMsU0FBVTFqQyxHQUN6QyxHQUFJdUUsR0FBT2hILElBS1gsSUFIQXlDLEVBQUt5RSxVQUFXLEVBR1poSSxFQUFFdUQsRUFBSzZFLFNBQVM4K0IsR0FBRyxVQUtyQixNQUpBM2pDLEdBQUs2RSxRQUFRSixVQUFXLE1BRXhCbEgsTUFBS3NFLFNBQVM3QyxRQUFRO0FBS3hCLEdBQUl6QixLQUFLc0UsU0FBU3pLLEtBQUssWUFDckJtRyxLQUFLaUgsUUFBUSxTQUFVby9CLEdBQ3JCLEdBQUkvOUIsS0FFSjdGLElBQVFBLEdBQ1JBLEVBQUtwRyxLQUFLRSxNQUFNa0csRUFBTTRqQyxFQUV0QixLQUFLLEdBQUlqbEMsR0FBSSxFQUFHQSxFQUFJcUIsRUFBS3JILE9BQVFnRyxJQUFLLENBQ3BDLEdBQUlqRCxHQUFLc0UsRUFBS3JCLEdBQUdqRCxFQUViZSxHQUFFcUksUUFBUXBKLEVBQUltSyxNQUFTLEdBQ3pCQSxFQUFJak0sS0FBSzhCLEdBSWI2SSxFQUFLMUMsU0FBU2dFLElBQUlBLEdBQ2xCdEIsRUFBSzFDLFNBQVM3QyxRQUFRLGdCQUVuQixDQUNMLEdBQUk2RyxHQUFNN0YsRUFBS3RFLEVBRWY2QixNQUFLc0UsU0FBU2dFLElBQUlBLEdBQ2xCdEksS0FBS3NFLFNBQVM3QyxRQUFRLFlBSTFCeWtDLEVBQWN6b0MsVUFBVTZvQyxTQUFXLFNBQVU3akMsR0FDM0MsR0FBSXVFLEdBQU9oSCxJQUVYLElBQUtBLEtBQUtzRSxTQUFTekssS0FBSyxZQU14QixNQUZBNEksR0FBS3lFLFVBQVcsRUFFWmhJLEVBQUV1RCxFQUFLNkUsU0FBUzgrQixHQUFHLFdBQ3JCM2pDLEVBQUs2RSxRQUFRSixVQUFXLE1BRXhCbEgsTUFBS3NFLFNBQVM3QyxRQUFRLGVBS3hCekIsTUFBS2lILFFBQVEsU0FBVW8vQixHQUdyQixJQUFLLEdBRkQvOUIsTUFFS2xILEVBQUksRUFBR0EsRUFBSWlsQyxFQUFZanJDLE9BQVFnRyxJQUFLLENBQzNDLEdBQUlqRCxHQUFLa29DLEVBQVlqbEMsR0FBR2pELEVBRXBCQSxLQUFPc0UsRUFBS3RFLElBQU1lLEVBQUVxSSxRQUFRcEosRUFBSW1LLE1BQVMsR0FDM0NBLEVBQUlqTSxLQUFLOEIsR0FJYjZJLEVBQUsxQyxTQUFTZ0UsSUFBSUEsR0FFbEJ0QixFQUFLMUMsU0FBUzdDLFFBQVEsYUFJMUJ5a0MsRUFBY3pvQyxVQUFVNEUsS0FBTyxTQUFVMkcsRUFBV0MsR0FDbEQsR0FBSWpDLEdBQU9oSCxJQUVYQSxNQUFLZ0osVUFBWUEsRUFFakJBLEVBQVV6SCxHQUFHLFNBQVUsU0FBVUcsR0FDL0JzRixFQUFLbS9CLE9BQU96a0MsRUFBT2UsUUFHckJ1RyxFQUFVekgsR0FBRyxXQUFZLFNBQVVHLEdBQ2pDc0YsRUFBS3MvQixTQUFTNWtDLEVBQU9lLFNBSXpCeWpDLEVBQWN6b0MsVUFBVXNOLFFBQVUsV0FFaEMvSyxLQUFLc0UsU0FBU3VCLEtBQUssS0FBS3dCLEtBQUssV0FFM0JuSSxFQUFFcW5DLFdBQVd2bUMsS0FBTSxXQUl2QmttQyxFQUFjem9DLFVBQVV1b0MsTUFBUSxTQUFVdGtDLEVBQVFwRCxHQUNoRCxHQUFJbUUsTUFDQXVFLEVBQU9oSCxLQUVQK0YsRUFBVy9GLEtBQUtzRSxTQUFTMkIsVUFFN0JGLEdBQVNzQixLQUFLLFdBQ1osR0FBSWpCLEdBQVVsSCxFQUFFYyxLQUVoQixJQUFLb0csRUFBUWdnQyxHQUFHLFdBQWNoZ0MsRUFBUWdnQyxHQUFHLFlBQXpDLENBSUEsR0FBSS8vQixHQUFTVyxFQUFLYixLQUFLQyxHQUVuQm9nQyxFQUFVeC9CLEVBQUt3L0IsUUFBUTlrQyxFQUFRMkUsRUFFbkIsUUFBWm1nQyxHQUNGL2pDLEVBQUtwRyxLQUFLbXFDLE1BSWRsb0MsR0FDRTBILFFBQVN2RCxLQUlieWpDLEVBQWN6b0MsVUFBVWdwQyxXQUFhLFNBQVUxZ0MsR0FDN0NwRyxFQUFNMEUsV0FBV3JFLEtBQUtzRSxTQUFVeUIsSUFHbENtZ0MsRUFBY3pvQyxVQUFVNEksT0FBUyxTQUFVNUQsR0FDekMsR0FBSTRELEVBRUE1RCxHQUFLd0QsVUFDUEksRUFBUzBCLFNBQVNDLGNBQWMsWUFDaEMzQixFQUFPbUMsTUFBUS9GLEVBQUttRixPQUVwQnZCLEVBQVMwQixTQUFTQyxjQUFjLFVBRUxwSixTQUF2QnlILEVBQU9xZ0MsWUFDVHJnQyxFQUFPcWdDLFlBQWNqa0MsRUFBS21GLEtBRTFCdkIsRUFBT3NnQyxVQUFZbGtDLEVBQUttRixNQUl4Qm5GLEVBQUt0RSxLQUNQa0ksRUFBTzFKLE1BQVE4RixFQUFLdEUsSUFHbEJzRSxFQUFLa0YsV0FDUHRCLEVBQU9zQixVQUFXLEdBR2hCbEYsRUFBS3lFLFdBQ1BiLEVBQU9hLFVBQVcsR0FHaEJ6RSxFQUFLNEYsUUFDUGhDLEVBQU9nQyxNQUFRNUYsRUFBSzRGLE1BR3RCLElBQUlqQyxHQUFVbEgsRUFBRW1ILEdBRVp1Z0MsRUFBaUI1bUMsS0FBSzZtQyxlQUFlcGtDLEVBTXpDLE9BTEFta0MsR0FBZXQvQixRQUFVakIsRUFHekJuSCxFQUFFdUQsS0FBSzRELEVBQVEsT0FBUXVnQyxHQUVoQnhnQyxHQUdUOC9CLEVBQWN6b0MsVUFBVTBJLEtBQU8sU0FBVUMsR0FDdkMsR0FBSTNELEtBSUosSUFGQUEsRUFBT3ZELEVBQUV1RCxLQUFLMkQsRUFBUSxHQUFJLFFBRWQsTUFBUjNELEVBQ0YsTUFBT0EsRUFHVCxJQUFJMkQsRUFBUWdnQyxHQUFHLFVBQ2IzakMsR0FDRXRFLEdBQUlpSSxFQUFRa0MsTUFDWlYsS0FBTXhCLEVBQVF3QixPQUNkRCxTQUFVdkIsRUFBUXZNLEtBQUssWUFDdkJxTixTQUFVZCxFQUFRdk0sS0FBSyxZQUN2QndPLE1BQU9qQyxFQUFRdk0sS0FBSyxjQUVqQixJQUFJdU0sRUFBUWdnQyxHQUFHLFlBQWEsQ0FDakMzakMsR0FDRW1GLEtBQU14QixFQUFRdk0sS0FBSyxTQUNuQm9NLFlBQ0FvQyxNQUFPakMsRUFBUXZNLEtBQUssU0FNdEIsS0FBSyxHQUhENk8sR0FBWXRDLEVBQVFILFNBQVMsVUFDN0JBLEtBRUswQyxFQUFJLEVBQUdBLEVBQUlELEVBQVV0TixPQUFRdU4sSUFBSyxDQUN6QyxHQUFJRSxHQUFTM0osRUFBRXdKLEVBQVVDLElBRXJCQyxFQUFRNUksS0FBS21HLEtBQUswQyxFQUV0QjVDLEdBQVM1SixLQUFLdU0sR0FHaEJuRyxFQUFLd0QsU0FBV0EsRUFRbEIsTUFMQXhELEdBQU96QyxLQUFLNm1DLGVBQWVwa0MsR0FDM0JBLEVBQUs2RSxRQUFVbEIsRUFBUSxHQUV2QmxILEVBQUV1RCxLQUFLMkQsRUFBUSxHQUFJLE9BQVEzRCxHQUVwQkEsR0FHVHlqQyxFQUFjem9DLFVBQVVvcEMsZUFBaUIsU0FBVTFnQyxHQUM1Q2pILEVBQUU0bkMsY0FBYzNnQyxLQUNuQkEsR0FDRWhJLEdBQUlnSSxFQUNKeUIsS0FBTXpCLElBSVZBLEVBQU9qSCxFQUFFK1IsV0FDUHJKLEtBQU0sSUFDTHpCLEVBRUgsSUFBSTRnQyxJQUNGNy9CLFVBQVUsRUFDVlMsVUFBVSxFQWVaLE9BWmUsT0FBWHhCLEVBQUtoSSxLQUNQZ0ksRUFBS2hJLEdBQUtnSSxFQUFLaEksR0FBR2lFLFlBR0gsTUFBYitELEVBQUt5QixPQUNQekIsRUFBS3lCLEtBQU96QixFQUFLeUIsS0FBS3hGLFlBR0YsTUFBbEIrRCxFQUFLaUMsV0FBcUJqQyxFQUFLaEksSUFBd0IsTUFBbEI2QixLQUFLZ0osWUFDNUM3QyxFQUFLaUMsVUFBWXBJLEtBQUtpbUMsaUJBQWlCam1DLEtBQUtnSixVQUFXN0MsSUFHbERqSCxFQUFFK1IsVUFBVzgxQixFQUFVNWdDLElBR2hDKy9CLEVBQWN6b0MsVUFBVStvQyxRQUFVLFNBQVU5a0MsRUFBUWUsR0FDbEQsR0FBSXVrQyxHQUFVaG5DLEtBQUsrRSxRQUFRSSxJQUFJLFVBRS9CLE9BQU82aEMsR0FBUXRsQyxFQUFRZSxJQUdsQnlqQyxJQUdUNXNDLEVBQUdMLE9BQU8sc0JBQ1IsV0FDQSxXQUNBLFVBQ0MsU0FBVWl0QyxFQUFldm1DLEVBQU9ULEdBQ2pDLFFBQVMrbkMsR0FBYzNpQyxFQUFVUyxHQUMvQixHQUFJdEMsR0FBT3NDLEVBQVFJLElBQUksV0FFdkI4aEMsR0FBYTdtQyxVQUFVSCxZQUFZbEcsS0FBS2lHLEtBQU1zRSxFQUFVUyxHQUV4RC9FLEtBQUt5bUMsV0FBV3ptQyxLQUFLa25DLGlCQUFpQnprQyxJQW1FeEMsTUFoRUE5QyxHQUFNQyxPQUFPcW5DLEVBQWNmLEdBRTNCZSxFQUFheHBDLFVBQVUwb0MsT0FBUyxTQUFVMWpDLEdBQ3hDLEdBQUkyRCxHQUFVcEcsS0FBS3NFLFNBQVN1QixLQUFLLFVBQVVlLE9BQU8sU0FBVWpNLEVBQUd3c0MsR0FDN0QsTUFBT0EsR0FBSXhxQyxPQUFTOEYsRUFBS3RFLEdBQUdpRSxZQUdQLEtBQW5CZ0UsRUFBUWhMLFNBQ1ZnTCxFQUFVcEcsS0FBS3FHLE9BQU81RCxHQUV0QnpDLEtBQUt5bUMsV0FBV3JnQyxJQUdsQjZnQyxFQUFhN21DLFVBQVUrbEMsT0FBT3BzQyxLQUFLaUcsS0FBTXlDLElBRzNDd2tDLEVBQWF4cEMsVUFBVXlwQyxpQkFBbUIsU0FBVXprQyxHQVdsRCxRQUFTMmtDLEdBQVVqaEMsR0FDakIsTUFBTyxZQUNMLE1BQU9qSCxHQUFFYyxNQUFNc0ksT0FBU25DLEVBQUtoSSxJQUlqQyxJQUFLLEdBaEJENkksR0FBT2hILEtBRVBxbkMsRUFBWXJuQyxLQUFLc0UsU0FBU3VCLEtBQUssVUFDL0J5aEMsRUFBY0QsRUFBVXJzQyxJQUFJLFdBQzlCLE1BQU9nTSxHQUFLYixLQUFLakgsRUFBRWMsT0FBTzdCLEtBQ3pCZ0gsTUFFQ1ksS0FTSzNFLEVBQUksRUFBR0EsRUFBSXFCLEVBQUtySCxPQUFRZ0csSUFBSyxDQUNwQyxHQUFJK0UsR0FBT25HLEtBQUs2bUMsZUFBZXBrQyxFQUFLckIsR0FHcEMsSUFBSWxDLEVBQUVxSSxRQUFRcEIsRUFBS2hJLEdBQUltcEMsSUFBZ0IsRUFBdkMsQ0FDRSxHQUFJQyxHQUFrQkYsRUFBVXpnQyxPQUFPd2dDLEVBQVNqaEMsSUFFNUNxaEMsRUFBZXhuQyxLQUFLbUcsS0FBS29oQyxHQUN6QkUsRUFBVXZvQyxFQUFFK1IsUUFBTyxLQUFVOUssRUFBTXFoQyxHQUVuQ0UsRUFBYTFuQyxLQUFLcUcsT0FBT29oQyxFQUU3QkYsR0FBZ0JJLFlBQVlELE9BUjlCLENBYUEsR0FBSXRoQyxHQUFVcEcsS0FBS3FHLE9BQU9GLEVBRTFCLElBQUlBLEVBQUtGLFNBQVUsQ0FDakIsR0FBSXlDLEdBQVkxSSxLQUFLa25DLGlCQUFpQi9nQyxFQUFLRixTQUUzQ3RHLEdBQU0wRSxXQUFXK0IsRUFBU3NDLEdBRzVCM0MsRUFBUzFKLEtBQUsrSixJQUdoQixNQUFPTCxJQUdGa2hDLElBR1QzdEMsRUFBR0wsT0FBTyxxQkFDUixVQUNBLFdBQ0EsVUFDQyxTQUFVZ3VDLEVBQWN0bkMsRUFBT1QsR0FDaEMsUUFBUzBvQyxHQUFhdGpDLEVBQVVTLEdBQzlCL0UsS0FBSzZuQyxZQUFjN25DLEtBQUs4bkMsZUFBZS9pQyxFQUFRSSxJQUFJLFNBRVosTUFBbkNuRixLQUFLNm5DLFlBQVlFLGlCQUNuQi9uQyxLQUFLK25DLGVBQWlCL25DLEtBQUs2bkMsWUFBWUUsZ0JBR3pDSCxFQUFZeG5DLFVBQVVILFlBQVlsRyxLQUFLaUcsS0FBTXNFLEVBQVVTLEdBK0Z6RCxNQTVGQXBGLEdBQU1DLE9BQU9nb0MsRUFBYVgsR0FFMUJXLEVBQVlucUMsVUFBVXFxQyxlQUFpQixTQUFVL2lDLEdBQy9DLEdBQUlnaUMsSUFDRnRrQyxLQUFNLFNBQVVmLEdBQ2QsTUFBT3hDLEdBQUUrUixVQUFXdlAsR0FDbEJzbUMsRUFBR3RtQyxFQUFPNE8sUUFHZDIzQixVQUFXLFNBQVV2bUMsRUFBUXdtQyxFQUFTQyxHQUNwQyxHQUFJQyxHQUFXbHBDLEVBQUVtcEMsS0FBSzNtQyxFQUt0QixPQUhBMG1DLEdBQVNFLEtBQUtKLEdBQ2RFLEVBQVNHLEtBQUtKLEdBRVBDLEdBSVgsT0FBT2xwQyxHQUFFK1IsVUFBVzgxQixFQUFVaGlDLEdBQVMsSUFHekM2aUMsRUFBWW5xQyxVQUFVc3FDLGVBQWlCLFNBQVUvaEMsR0FDL0MsTUFBT0EsSUFHVDRoQyxFQUFZbnFDLFVBQVV1b0MsTUFBUSxTQUFVdGtDLEVBQVFwRCxHQXlCOUMsUUFBU2txQyxLQUNQLEdBQUlKLEdBQVdyakMsRUFBUWtqQyxVQUFVbGpDLEVBQVMsU0FBVXRDLEdBQ2xELEdBQUl1RCxHQUFVZ0IsRUFBSytnQyxlQUFldGxDLEVBQU1mLEVBRXBDc0YsR0FBS2pDLFFBQVFJLElBQUksVUFBWThILE9BQU85TixTQUFXQSxRQUFRQyxRQUVwRDRHLEdBQVlBLEVBQVFBLFNBQVk5RyxFQUFFdXBDLFFBQVF6aUMsRUFBUUEsVUFDckQ3RyxRQUFRQyxNQUNOLDRGQU1OZCxFQUFTMEgsSUFDUixXQUdHb2lDLEVBQVNNLFFBQThCLE1BQXBCTixFQUFTTSxRQUloQzFoQyxFQUFLdkYsUUFBUSxtQkFDWGlFLFFBQVMsa0JBSWJzQixHQUFLMmhDLFNBQVdQLEVBbkRsQixHQUNJcGhDLEdBQU9oSCxJQUVVLE9BQWpCQSxLQUFLMm9DLFdBRUh6cEMsRUFBRTBwQyxXQUFXNW9DLEtBQUsyb0MsU0FBU0UsUUFDN0I3b0MsS0FBSzJvQyxTQUFTRSxRQUdoQjdvQyxLQUFLMm9DLFNBQVcsS0FHbEIsSUFBSTVqQyxHQUFVN0YsRUFBRStSLFFBQ2RoQixLQUFNLE9BQ0xqUSxLQUFLNm5DLFlBRW1CLG1CQUFoQjlpQyxHQUFRK2pDLE1BQ2pCL2pDLEVBQVErakMsSUFBTS9qQyxFQUFRK2pDLElBQUkvdUMsS0FBS2lHLEtBQUtzRSxTQUFVNUMsSUFHcEIsa0JBQWpCcUQsR0FBUXRDLE9BQ2pCc0MsRUFBUXRDLEtBQU9zQyxFQUFRdEMsS0FBSzFJLEtBQUtpRyxLQUFLc0UsU0FBVTVDLElBaUM5QzFCLEtBQUs2bkMsWUFBWWtCLE9BQXdCLE1BQWZybkMsRUFBTzRPLE1BQy9CdFEsS0FBS2dwQyxlQUNQLzdCLE9BQU9nOEIsYUFBYWpwQyxLQUFLZ3BDLGVBRzNCaHBDLEtBQUtncEMsY0FBZ0IvN0IsT0FBT25PLFdBQVcwcEMsRUFBU3hvQyxLQUFLNm5DLFlBQVlrQixRQUVqRVAsS0FJR1osSUFHVHR1QyxFQUFHTCxPQUFPLHFCQUNSLFVBQ0MsU0FBVWlHLEdBQ1gsUUFBU2dxQyxHQUFNMzZCLEVBQVdqSyxFQUFVUyxHQUNsQyxHQUFJb2tDLEdBQU9wa0MsRUFBUUksSUFBSSxRQUVuQmlrQyxFQUFZcmtDLEVBQVFJLElBQUksWUFFVnZHLFVBQWR3cUMsSUFDRnBwQyxLQUFLb3BDLFVBQVlBLEVBR25CLElBQUlDLEdBQVl0a0MsRUFBUUksSUFBSSxZQVE1QixJQU5rQnZHLFNBQWR5cUMsSUFDQXJwQyxLQUFLcXBDLFVBQVlBLEdBR3JCOTZCLEVBQVV4VSxLQUFLaUcsS0FBTXNFLEVBQVVTLEdBRTNCN0YsRUFBRXVwQyxRQUFRVSxHQUNaLElBQUssR0FBSUcsR0FBSSxFQUFHQSxFQUFJSCxFQUFLL3RDLE9BQVFrdUMsSUFBSyxDQUNwQyxHQUFJQyxHQUFNSixFQUFLRyxHQUNYbmpDLEVBQU9uRyxLQUFLNm1DLGVBQWUwQyxHQUUzQm5qQyxFQUFVcEcsS0FBS3FHLE9BQU9GLEVBRTFCbkcsTUFBS3NFLFNBQVNPLE9BQU91QixJQWdHM0IsTUEzRkE4aUMsR0FBS3pyQyxVQUFVdW9DLE1BQVEsU0FBVXozQixFQUFXN00sRUFBUXBELEdBVWxELFFBQVNrckMsR0FBUzV2QyxFQUFLZ1AsR0FHckIsSUFBSyxHQUZEbkcsR0FBTzdJLEVBQUlvTSxRQUVOckwsRUFBSSxFQUFHQSxFQUFJOEgsRUFBS3JILE9BQVFULElBQUssQ0FDcEMsR0FBSTBMLEdBQVM1RCxFQUFLOUgsR0FFZDh1QyxFQUNpQixNQUFuQnBqQyxFQUFPSixXQUNOdWpDLEdBQ0N4akMsUUFBU0ssRUFBT0osV0FDZixHQUdEeWpDLEVBQVlyakMsRUFBT3VCLE9BQVNsRyxFQUFPNE8sSUFFdkMsSUFBSW81QixHQUFhRCxFQUNmLE9BQUk3Z0MsSUFJSmhQLEVBQUk2SSxLQUFPQSxNQUNYbkUsR0FBUzFFLElBTWIsR0FBSWdQLEVBQ0YsT0FBTyxDQUdULElBQUkyZ0MsR0FBTXZpQyxFQUFLb2lDLFVBQVUxbkMsRUFFekIsSUFBVyxNQUFQNm5DLEVBQWEsQ0FDZixHQUFJbmpDLEdBQVVZLEVBQUtYLE9BQU9rakMsRUFDMUJuakMsR0FBUWhCLEtBQUssb0JBQW9CLEdBRWpDNEIsRUFBS3kvQixZQUFZcmdDLElBRWpCWSxFQUFLcWlDLFVBQVU1bUMsRUFBTThtQyxHQUd2QjN2QyxFQUFJb00sUUFBVXZELEVBRWRuRSxFQUFTMUUsR0FyRFgsR0FBSW9OLEdBQU9oSCxJQUlYLE9BRkFBLE1BQUsycEMsaUJBRWMsTUFBZmpvQyxFQUFPNE8sTUFBK0IsTUFBZjVPLEVBQU9rb0MsU0FDaENyN0IsR0FBVXhVLEtBQUtpRyxLQUFNMEIsRUFBUXBELE9BbUQvQmlRLEdBQVV4VSxLQUFLaUcsS0FBTTBCLEVBQVE4bkMsSUFHL0JOLEVBQUt6ckMsVUFBVTJyQyxVQUFZLFNBQVU3NkIsRUFBVzdNLEdBQzlDLEdBQUk0TyxHQUFPcFIsRUFBRTJxQyxLQUFLbm9DLEVBQU80TyxLQUV6QixPQUFhLEtBQVRBLEVBQ0ssTUFJUG5TLEdBQUltUyxFQUNKMUksS0FBTTBJLElBSVY0NEIsRUFBS3pyQyxVQUFVNHJDLFVBQVksU0FBVTM2QixFQUFHak0sRUFBTThtQyxHQUM1QzltQyxFQUFLakMsUUFBUStvQyxJQUdmTCxFQUFLenJDLFVBQVVrc0MsZUFBaUIsU0FBVWo3QixHQUN4QyxHQUVJM0ksSUFGTS9GLEtBQUs4cEMsU0FFQTlwQyxLQUFLc0UsU0FBU3VCLEtBQUssNEJBRWxDRSxHQUFTc0IsS0FBSyxXQUNSckgsS0FBS2tILFVBSVRoSSxFQUFFYyxNQUFNOEYsWUFJTG9qQyxJQUdUNXZDLEVBQUdMLE9BQU8sMEJBQ1IsVUFDQyxTQUFVaUcsR0FDWCxRQUFTNnFDLEdBQVd4N0IsRUFBV2pLLEVBQVVTLEdBQ3ZDLEdBQUlpbEMsR0FBWWpsQyxFQUFRSSxJQUFJLFlBRVZ2RyxVQUFkb3JDLElBQ0ZocUMsS0FBS2dxQyxVQUFZQSxHQUduQno3QixFQUFVeFUsS0FBS2lHLEtBQU1zRSxFQUFVUyxHQXdHakMsTUFyR0FnbEMsR0FBVXRzQyxVQUFVNEUsS0FBTyxTQUFVa00sRUFBV3ZGLEVBQVdDLEdBQ3pEc0YsRUFBVXhVLEtBQUtpRyxLQUFNZ0osRUFBV0MsR0FFaENqSixLQUFLc1AsUUFBV3RHLEVBQVVpaEMsU0FBUzM2QixTQUFXdEcsRUFBVStFLFVBQVV1QixTQUNoRXJHLEVBQVdwRCxLQUFLLDJCQUdwQmtrQyxFQUFVdHNDLFVBQVV1b0MsTUFBUSxTQUFVejNCLEVBQVc3TSxFQUFRcEQsR0FHdkQsUUFBUzRyQyxHQUFpQnpuQyxHQUV4QixHQUFJMEQsR0FBT2EsRUFBSzYvQixlQUFlcGtDLEdBSTNCMG5DLEVBQW1CbmpDLEVBQUsxQyxTQUFTdUIsS0FBSyxVQUFVZSxPQUFPLFdBQ3pELE1BQU8xSCxHQUFFYyxNQUFNc0ksUUFBVW5DLEVBQUtoSSxJQUloQyxLQUFLZ3NDLEVBQWlCL3VDLE9BQVEsQ0FDNUIsR0FBSWdMLEdBQVVZLEVBQUtYLE9BQU9GLEVBQzFCQyxHQUFRaEIsS0FBSyxvQkFBb0IsR0FFakM0QixFQUFLMmlDLGlCQUNMM2lDLEVBQUt5L0IsWUFBWXJnQyxJQUluQisvQixFQUFPaGdDLEdBR1QsUUFBU2dnQyxHQUFRMWpDLEdBQ2Z1RSxFQUFLdkYsUUFBUSxVQUNYZ0IsS0FBTUEsSUEzQlYsR0FBSXVFLEdBQU9oSCxJQStCWDBCLEdBQU80TyxLQUFPNU8sRUFBTzRPLE1BQVEsRUFFN0IsSUFBSTg1QixHQUFZcHFDLEtBQUtncUMsVUFBVXRvQyxFQUFRMUIsS0FBSytFLFFBQVNtbEMsRUFFakRFLEdBQVU5NUIsT0FBUzVPLEVBQU80TyxPQUV4QnRRLEtBQUtzUCxRQUFRbFUsU0FDZjRFLEtBQUtzUCxRQUFRaEgsSUFBSThoQyxFQUFVOTVCLE1BQzNCdFEsS0FBS3NQLFFBQVF2QyxTQUdmckwsRUFBTzRPLEtBQU84NUIsRUFBVTk1QixNQUcxQi9CLEVBQVV4VSxLQUFLaUcsS0FBTTBCLEVBQVFwRCxJQUcvQnlyQyxFQUFVdHNDLFVBQVV1c0MsVUFBWSxTQUFVdDdCLEVBQUdoTixFQUFRcUQsRUFBU3pHLEdBWTVELElBWEEsR0FBSStyQyxHQUFhdGxDLEVBQVFJLElBQUksdUJBQ3pCbUwsRUFBTzVPLEVBQU80TyxLQUNkM1YsRUFBSSxFQUVKeXVDLEVBQVlwcEMsS0FBS29wQyxXQUFhLFNBQVUxbkMsR0FDMUMsT0FDRXZELEdBQUl1RCxFQUFPNE8sS0FDWDFJLEtBQU1sRyxFQUFPNE8sT0FJVjNWLEVBQUkyVixFQUFLbFYsUUFBUSxDQUN0QixHQUFJa3ZDLEdBQVdoNkIsRUFBSzNWLEVBRXBCLElBQUl1RSxFQUFFcUksUUFBUStpQyxFQUFVRCxNQUFnQixFQUF4QyxDQU1BLEdBQUl4dkMsR0FBT3lWLEVBQUs3TCxPQUFPLEVBQUc5SixHQUN0QjR2QyxFQUFhcnJDLEVBQUUrUixVQUFXdlAsR0FDNUI0TyxLQUFNelYsSUFHSjRILEVBQU8ybUMsRUFBVW1CLEVBRVQsT0FBUjluQyxHQUtKbkUsRUFBU21FLEdBR1Q2TixFQUFPQSxFQUFLN0wsT0FBTzlKLEVBQUksSUFBTSxHQUM3QkEsRUFBSSxHQVJGQSxRQWJBQSxLQXdCSixPQUNFMlYsS0FBTUEsSUFJSHk1QixJQUdUendDLEVBQUdMLE9BQU8scUNBRVAsV0FDRCxRQUFTdXhDLEdBQW9CajhCLEVBQVdrOEIsRUFBSTFsQyxHQUMxQy9FLEtBQUswcUMsbUJBQXFCM2xDLEVBQVFJLElBQUksc0JBRXRDb0osRUFBVXhVLEtBQUtpRyxLQUFNeXFDLEVBQUkxbEMsR0FzQjNCLE1BbkJBeWxDLEdBQW1CL3NDLFVBQVV1b0MsTUFBUSxTQUFVejNCLEVBQVc3TSxFQUFRcEQsR0FHaEUsTUFGQW9ELEdBQU80TyxLQUFPNU8sRUFBTzRPLE1BQVEsR0FFekI1TyxFQUFPNE8sS0FBS2xWLE9BQVM0RSxLQUFLMHFDLHVCQUM1QjFxQyxNQUFLeUIsUUFBUSxtQkFDWGlFLFFBQVMsZ0JBQ1R4SixNQUNFeXVDLFFBQVMzcUMsS0FBSzBxQyxtQkFDZHI2QixNQUFPM08sRUFBTzRPLEtBQ2Q1TyxPQUFRQSxTQU9kNk0sR0FBVXhVLEtBQUtpRyxLQUFNMEIsRUFBUXBELElBR3hCa3NDLElBR1RseEMsRUFBR0wsT0FBTyxxQ0FFUCxXQUNELFFBQVMyeEMsR0FBb0JyOEIsRUFBV2s4QixFQUFJMWxDLEdBQzFDL0UsS0FBSzZxQyxtQkFBcUI5bEMsRUFBUUksSUFBSSxzQkFFdENvSixFQUFVeFUsS0FBS2lHLEtBQU15cUMsRUFBSTFsQyxHQXVCM0IsTUFwQkE2bEMsR0FBbUJudEMsVUFBVXVvQyxNQUFRLFNBQVV6M0IsRUFBVzdNLEVBQVFwRCxHQUdoRSxNQUZBb0QsR0FBTzRPLEtBQU81TyxFQUFPNE8sTUFBUSxHQUV6QnRRLEtBQUs2cUMsbUJBQXFCLEdBQzFCbnBDLEVBQU80TyxLQUFLbFYsT0FBUzRFLEtBQUs2cUMsdUJBQzVCN3FDLE1BQUt5QixRQUFRLG1CQUNYaUUsUUFBUyxlQUNUeEosTUFDRTR1QyxRQUFTOXFDLEtBQUs2cUMsbUJBQ2R4NkIsTUFBTzNPLEVBQU80TyxLQUNkNU8sT0FBUUEsU0FPZDZNLEdBQVV4VSxLQUFLaUcsS0FBTTBCLEVBQVFwRCxJQUd4QnNzQyxJQUdUdHhDLEVBQUdMLE9BQU8seUNBRVAsV0FDRCxRQUFTOHhDLEdBQXdCeDhCLEVBQVdrOEIsRUFBSTFsQyxHQUM5Qy9FLEtBQUtnckMsdUJBQXlCam1DLEVBQVFJLElBQUksMEJBRTFDb0osRUFBVXhVLEtBQUtpRyxLQUFNeXFDLEVBQUkxbEMsR0F1QjNCLE1BcEJBZ21DLEdBQXVCdHRDLFVBQVV1b0MsTUFDL0IsU0FBVXozQixFQUFXN00sRUFBUXBELEdBQzNCLEdBQUkwSSxHQUFPaEgsSUFFWEEsTUFBS2lILFFBQVEsU0FBVW8vQixHQUNyQixHQUFJNEUsR0FBdUIsTUFBZjVFLEVBQXNCQSxFQUFZanJDLE9BQVMsQ0FDdkQsT0FBSTRMLEdBQUtna0MsdUJBQXlCLEdBQ2hDQyxHQUFTamtDLEVBQUtna0MsMkJBQ2Roa0MsR0FBS3ZGLFFBQVEsbUJBQ1hpRSxRQUFTLGtCQUNUeEosTUFDRTR1QyxRQUFTOWpDLEVBQUtna0MsOEJBS3BCejhCLEdBQVV4VSxLQUFLaU4sRUFBTXRGLEVBQVFwRCxNQUk1QnlzQyxJQUdUenhDLEVBQUdMLE9BQU8sb0JBQ1IsU0FDQSxXQUNDLFNBQVVpRyxFQUFHUyxHQUNkLFFBQVN1ckMsR0FBVTVtQyxFQUFVUyxHQUMzQi9FLEtBQUtzRSxTQUFXQSxFQUNoQnRFLEtBQUsrRSxRQUFVQSxFQUVmbW1DLEVBQVM5cUMsVUFBVUgsWUFBWWxHLEtBQUtpRyxNQWdDdEMsTUE3QkFMLEdBQU1DLE9BQU9zckMsRUFBVXZyQyxFQUFNMEIsWUFFN0I2cEMsRUFBU3p0QyxVQUFVd0gsT0FBUyxXQUMxQixHQUFJc0IsR0FBWXJILEVBQ2QsOEVBU0YsT0FKQXFILEdBQVVuQixLQUFLLE1BQU9wRixLQUFLK0UsUUFBUUksSUFBSSxRQUV2Q25GLEtBQUt1RyxVQUFZQSxFQUVWQSxHQUdUMmtDLEVBQVN6dEMsVUFBVTRFLEtBQU8sYUFJMUI2b0MsRUFBU3p0QyxVQUFVNkksU0FBVyxTQUFVQyxFQUFXMEMsS0FJbkRpaUMsRUFBU3p0QyxVQUFVc04sUUFBVSxXQUUzQi9LLEtBQUt1RyxVQUFVVCxVQUdWb2xDLElBR1Q1eEMsRUFBR0wsT0FBTywyQkFDUixTQUNBLFlBQ0MsU0FBVWlHLEVBQUdTLEdBQ2QsUUFBUzBQLE1BK0ZULE1BN0ZBQSxHQUFPNVIsVUFBVXdILE9BQVMsU0FBVXNKLEdBQ2xDLEdBQUlQLEdBQVlPLEVBQVV4VSxLQUFLaUcsTUFFM0JzUCxFQUFVcFEsRUFDWiwrTkFZRixPQUxBYyxNQUFLdVAsaUJBQW1CRCxFQUN4QnRQLEtBQUtzUCxRQUFVQSxFQUFRekosS0FBSyxTQUU1Qm1JLEVBQVVsRyxRQUFRd0gsR0FFWHRCLEdBR1RxQixFQUFPNVIsVUFBVTRFLEtBQU8sU0FBVWtNLEVBQVd2RixFQUFXQyxHQUN0RCxHQUFJakMsR0FBT2hILElBRVh1TyxHQUFVeFUsS0FBS2lHLEtBQU1nSixFQUFXQyxHQUVoQ2pKLEtBQUtzUCxRQUFRL04sR0FBRyxVQUFXLFNBQVVvSixHQUNuQzNELEVBQUt2RixRQUFRLFdBQVlrSixHQUV6QjNELEVBQUt5SSxnQkFBa0I5RSxFQUFJK0UsdUJBTTdCMVAsS0FBS3NQLFFBQVEvTixHQUFHLFFBQVMsU0FBVW9KLEdBRWpDekwsRUFBRWMsTUFBTTBOLElBQUksV0FHZDFOLEtBQUtzUCxRQUFRL04sR0FBRyxjQUFlLFNBQVVvSixHQUN2QzNELEVBQUtrSixhQUFhdkYsS0FHcEIzQixFQUFVekgsR0FBRyxPQUFRLFdBQ25CeUYsRUFBS3NJLFFBQVFsSyxLQUFLLFdBQVksR0FFOUI0QixFQUFLc0ksUUFBUXZDLFFBRWJFLE9BQU9uTyxXQUFXLFdBQ2hCa0ksRUFBS3NJLFFBQVF2QyxTQUNaLEtBR0wvRCxFQUFVekgsR0FBRyxRQUFTLFdBQ3BCeUYsRUFBS3NJLFFBQVFsSyxLQUFLLFlBQVksR0FFOUI0QixFQUFLc0ksUUFBUWhILElBQUksTUFHbkJVLEVBQVV6SCxHQUFHLFFBQVMsV0FDaEJ5SCxFQUFVRSxVQUNabEMsRUFBS3NJLFFBQVF2QyxVQUlqQi9ELEVBQVV6SCxHQUFHLGNBQWUsU0FBVUcsR0FDcEMsR0FBeUIsTUFBckJBLEVBQU9za0MsTUFBTTExQixNQUFzQyxLQUF0QjVPLEVBQU9za0MsTUFBTTExQixLQUFhLENBQ3pELEdBQUk2NkIsR0FBYW5rQyxFQUFLbWtDLFdBQVd6cEMsRUFFN0J5cEMsR0FDRm5rQyxFQUFLdUksaUJBQWlCekUsWUFBWSx3QkFFbEM5RCxFQUFLdUksaUJBQWlCckYsU0FBUyw0QkFNdkNtRixFQUFPNVIsVUFBVXlTLGFBQWUsU0FBVXZGLEdBQ3hDLElBQUszSyxLQUFLeVAsZ0JBQWlCLENBQ3pCLEdBQUlZLEdBQVFyUSxLQUFLc1AsUUFBUWhILEtBRXpCdEksTUFBS3lCLFFBQVEsU0FDWDZPLEtBQU1ELElBSVZyUSxLQUFLeVAsaUJBQWtCLEdBR3pCSixFQUFPNVIsVUFBVTB0QyxXQUFhLFNBQVV6OEIsRUFBR2hOLEdBQ3pDLE9BQU8sR0FHRjJOLElBR1QvVixFQUFHTCxPQUFPLHNDQUVQLFdBQ0QsUUFBU215QyxHQUFpQjc4QixFQUFXakssRUFBVVMsRUFBU0MsR0FDdERoRixLQUFLd08sWUFBY3hPLEtBQUt5TyxxQkFBcUIxSixFQUFRSSxJQUFJLGdCQUV6RG9KLEVBQVV4VSxLQUFLaUcsS0FBTXNFLEVBQVVTLEVBQVNDLEdBa0MxQyxNQS9CQW9tQyxHQUFnQjN0QyxVQUFVb0gsT0FBUyxTQUFVMEosRUFBVzlMLEdBQ3REQSxFQUFLdUQsUUFBVWhHLEtBQUtxckMsa0JBQWtCNW9DLEVBQUt1RCxTQUUzQ3VJLEVBQVV4VSxLQUFLaUcsS0FBTXlDLElBR3ZCMm9DLEVBQWdCM3RDLFVBQVVnUixxQkFBdUIsU0FBVUMsRUFBR0YsR0FRNUQsTUFQMkIsZ0JBQWhCQSxLQUNUQSxHQUNFclEsR0FBSSxHQUNKeUosS0FBTTRHLElBSUhBLEdBR1Q0OEIsRUFBZ0IzdEMsVUFBVTR0QyxrQkFBb0IsU0FBVTM4QixFQUFHak0sR0FHekQsSUFBSyxHQUZENm9DLEdBQWU3b0MsRUFBS2hILE1BQU0sR0FFckIyRixFQUFJcUIsRUFBS3JILE9BQVMsRUFBR2dHLEdBQUssRUFBR0EsSUFBSyxDQUN6QyxHQUFJK0UsR0FBTzFELEVBQUtyQixFQUVacEIsTUFBS3dPLFlBQVlyUSxLQUFPZ0ksRUFBS2hJLElBQy9CbXRDLEVBQWEzdkMsT0FBT3lGLEVBQUcsR0FJM0IsTUFBT2txQyxJQUdGRixJQUdUOXhDLEVBQUdMLE9BQU8sbUNBQ1IsVUFDQyxTQUFVaUcsR0FDWCxRQUFTcXNDLEdBQWdCaDlCLEVBQVdqSyxFQUFVUyxFQUFTQyxHQUNyRGhGLEtBQUt3ckMsY0FFTGo5QixFQUFVeFUsS0FBS2lHLEtBQU1zRSxFQUFVUyxFQUFTQyxHQUV4Q2hGLEtBQUt5ckMsYUFBZXpyQyxLQUFLMHJDLG9CQUN6QjFyQyxLQUFLMEgsU0FBVSxFQThFakIsTUEzRUE2akMsR0FBZTl0QyxVQUFVb0gsT0FBUyxTQUFVMEosRUFBVzlMLEdBQ3JEekMsS0FBS3lyQyxhQUFhM2xDLFNBQ2xCOUYsS0FBSzBILFNBQVUsRUFFZjZHLEVBQVV4VSxLQUFLaUcsS0FBTXlDLEdBRWpCekMsS0FBSzJyQyxnQkFBZ0JscEMsSUFDdkJ6QyxLQUFLa0YsU0FBU0wsT0FBTzdFLEtBQUt5ckMsZUFJOUJGLEVBQWU5dEMsVUFBVTRFLEtBQU8sU0FBVWtNLEVBQVd2RixFQUFXQyxHQUM5RCxHQUFJakMsR0FBT2hILElBRVh1TyxHQUFVeFUsS0FBS2lHLEtBQU1nSixFQUFXQyxHQUVoQ0QsRUFBVXpILEdBQUcsUUFBUyxTQUFVRyxHQUM5QnNGLEVBQUt3a0MsV0FBYTlwQyxFQUNsQnNGLEVBQUtVLFNBQVUsSUFHakJzQixFQUFVekgsR0FBRyxlQUFnQixTQUFVRyxHQUNyQ3NGLEVBQUt3a0MsV0FBYTlwQyxFQUNsQnNGLEVBQUtVLFNBQVUsSUFHakIxSCxLQUFLa0YsU0FBUzNELEdBQUcsU0FBVSxXQUN6QixHQUFJcXFDLEdBQW9CMXNDLEVBQUVpTyxTQUN4QnBGLFNBQVM4akMsZ0JBQ1Q3a0MsRUFBS3lrQyxhQUFhLEdBR3BCLEtBQUl6a0MsRUFBS1UsU0FBWWtrQyxFQUFyQixDQUlBLEdBQUlsaUMsR0FBZ0IxQyxFQUFLOUIsU0FBU3lFLFNBQVNDLElBQ3pDNUMsRUFBSzlCLFNBQVM4RSxhQUFZLEdBQ3hCOGhDLEVBQW9COWtDLEVBQUt5a0MsYUFBYTloQyxTQUFTQyxJQUNqRDVDLEVBQUt5a0MsYUFBYXpoQyxhQUFZLEVBRTVCTixHQUFnQixJQUFNb2lDLEdBQ3hCOWtDLEVBQUsra0MsZUFLWFIsRUFBZTl0QyxVQUFVc3VDLFNBQVcsV0FDbEMvckMsS0FBSzBILFNBQVUsQ0FFZixJQUFJaEcsR0FBU3hDLEVBQUUrUixXQUFZMjRCLEtBQU0sR0FBSTVwQyxLQUFLd3JDLFdBRTFDOXBDLEdBQU9rb0MsT0FFUDVwQyxLQUFLeUIsUUFBUSxlQUFnQkMsSUFHL0I2cEMsRUFBZTl0QyxVQUFVa3VDLGdCQUFrQixTQUFVajlCLEVBQUdqTSxHQUN0RCxNQUFPQSxHQUFLdXBDLFlBQWN2cEMsRUFBS3VwQyxXQUFXQyxNQUc1Q1YsRUFBZTl0QyxVQUFVaXVDLGtCQUFvQixXQUMzQyxHQUFJdGxDLEdBQVVsSCxFQUNaLG9IQUtFd0csRUFBVTFGLEtBQUsrRSxRQUFRSSxJQUFJLGdCQUFnQkEsSUFBSSxjQUluRCxPQUZBaUIsR0FBUXlILEtBQUtuSSxFQUFRMUYsS0FBS3dyQyxhQUVuQnBsQyxHQUdGbWxDLElBR1RqeUMsRUFBR0wsT0FBTywrQkFDUixTQUNBLFlBQ0MsU0FBVWlHLEVBQUdTLEdBQ2QsUUFBU3VzQyxHQUFZMzlCLEVBQVdqSyxFQUFVUyxHQUN4Qy9FLEtBQUttc0MsZ0JBQWtCcG5DLEVBQVFJLElBQUksbUJBQXFCakcsRUFBRTZJLFNBQVNxRixNQUVuRW1CLEVBQVV4VSxLQUFLaUcsS0FBTXNFLEVBQVVTLEdBcU5qQyxNQWxOQW1uQyxHQUFXenVDLFVBQVU0RSxLQUFPLFNBQVVrTSxFQUFXdkYsRUFBV0MsR0FDMUQsR0FBSWpDLEdBQU9oSCxLQUVQb3NDLEdBQXFCLENBRXpCNzlCLEdBQVV4VSxLQUFLaUcsS0FBTWdKLEVBQVdDLEdBRWhDRCxFQUFVekgsR0FBRyxPQUFRLFdBQ25CeUYsRUFBS3FsQyxnQkFDTHJsQyxFQUFLc2xDLDBCQUEwQnRqQyxHQUUxQm9qQyxJQUNIQSxHQUFxQixFQUVyQnBqQyxFQUFVekgsR0FBRyxjQUFlLFdBQzFCeUYsRUFBS3VsQyxvQkFDTHZsQyxFQUFLd2xDLG9CQUdQeGpDLEVBQVV6SCxHQUFHLGlCQUFrQixXQUM3QnlGLEVBQUt1bEMsb0JBQ0x2bEMsRUFBS3dsQyx1QkFLWHhqQyxFQUFVekgsR0FBRyxRQUFTLFdBQ3BCeUYsRUFBS3lsQyxnQkFDTHpsQyxFQUFLMGxDLDBCQUEwQjFqQyxLQUdqQ2hKLEtBQUsyc0MsbUJBQW1CcHJDLEdBQUcsWUFBYSxTQUFVb0osR0FDaERBLEVBQUlELHFCQUlSd2hDLEVBQVd6dUMsVUFBVXNOLFFBQVUsU0FBVXdELEdBQ3ZDQSxFQUFVeFUsS0FBS2lHLE1BRWZBLEtBQUsyc0MsbUJBQW1CN21DLFVBRzFCb21DLEVBQVd6dUMsVUFBVTZJLFNBQVcsU0FBVWlJLEVBQVdoSSxFQUFXMEMsR0FFOUQxQyxFQUFVbkIsS0FBSyxRQUFTNkQsRUFBVzdELEtBQUssVUFFeENtQixFQUFVdUUsWUFBWSxXQUN0QnZFLEVBQVUyRCxTQUFTLDJCQUVuQjNELEVBQVVnSyxLQUNSakssU0FBVSxXQUNWc0QsS0FBSyxTQUdQNUosS0FBS2lKLFdBQWFBLEdBR3BCaWpDLEVBQVd6dUMsVUFBVXdILE9BQVMsU0FBVXNKLEdBQ3RDLEdBQUl0RixHQUFhL0osRUFBRSxpQkFFZnFILEVBQVlnSSxFQUFVeFUsS0FBS2lHLEtBSy9CLE9BSkFpSixHQUFXcEUsT0FBTzBCLEdBRWxCdkcsS0FBSzJzQyxtQkFBcUIxakMsRUFFbkJBLEdBR1RpakMsRUFBV3p1QyxVQUFVZ3ZDLGNBQWdCLFNBQVVsK0IsR0FDN0N2TyxLQUFLMnNDLG1CQUFtQkMsVUFHMUJWLEVBQVd6dUMsVUFBVTZ1QywwQkFDakIsU0FBVS85QixFQUFXdkYsR0FDdkIsR0FBSWhDLEdBQU9oSCxLQUVQNnNDLEVBQWMsa0JBQW9CN2pDLEVBQVU3SyxHQUM1QzJ1QyxFQUFjLGtCQUFvQjlqQyxFQUFVN0ssR0FDNUM0dUMsRUFBbUIsNkJBQStCL2pDLEVBQVU3SyxHQUU1RDZ1QyxFQUFZaHRDLEtBQUtpSixXQUFXZ2tDLFVBQVVybUMsT0FBT2pILEVBQU1vRCxVQUN2RGlxQyxHQUFVM2xDLEtBQUssV0FDYm5JLEVBQUVjLE1BQU15QyxLQUFLLDJCQUNYeXFDLEVBQUdodUMsRUFBRWMsTUFBTW10QyxhQUNYQyxFQUFHbHVDLEVBQUVjLE1BQU0rSixnQkFJZmlqQyxFQUFVenJDLEdBQUdzckMsRUFBYSxTQUFVUSxHQUNsQyxHQUFJL21DLEdBQVdwSCxFQUFFYyxNQUFNeUMsS0FBSywwQkFDNUJ2RCxHQUFFYyxNQUFNK0osVUFBVXpELEVBQVM4bUMsS0FHN0JsdUMsRUFBRStOLFFBQVExTCxHQUFHc3JDLEVBQWMsSUFBTUMsRUFBYyxJQUFNQyxFQUNuRCxTQUFVOXVDLEdBQ1YrSSxFQUFLdWxDLG9CQUNMdmxDLEVBQUt3bEMscUJBSVROLEVBQVd6dUMsVUFBVWl2QywwQkFDakIsU0FBVW4rQixFQUFXdkYsR0FDdkIsR0FBSTZqQyxHQUFjLGtCQUFvQjdqQyxFQUFVN0ssR0FDNUMydUMsRUFBYyxrQkFBb0I5akMsRUFBVTdLLEdBQzVDNHVDLEVBQW1CLDZCQUErQi9qQyxFQUFVN0ssR0FFNUQ2dUMsRUFBWWh0QyxLQUFLaUosV0FBV2drQyxVQUFVcm1DLE9BQU9qSCxFQUFNb0QsVUFDdkRpcUMsR0FBVXQvQixJQUFJbS9CLEdBRWQzdEMsRUFBRStOLFFBQVFTLElBQUltL0IsRUFBYyxJQUFNQyxFQUFjLElBQU1DLElBR3hEYixFQUFXenVDLFVBQVU4dUMsa0JBQW9CLFdBQ3ZDLEdBQUllLEdBQVVwdUMsRUFBRStOLFFBRVpzZ0MsRUFBbUJ2dEMsS0FBS3VHLFVBQVVpbkMsU0FBUywyQkFDM0NDLEVBQW1CenRDLEtBQUt1RyxVQUFVaW5DLFNBQVMsMkJBRTNDRSxFQUFlLEtBRWYvakMsRUFBUzNKLEtBQUtpSixXQUFXVSxRQUU3QkEsR0FBT1MsT0FBU1QsRUFBT0MsSUFBTTVKLEtBQUtpSixXQUFXZSxhQUFZLEVBRXpELElBQUloQixJQUNGd0IsT0FBUXhLLEtBQUtpSixXQUFXZSxhQUFZLEdBR3RDaEIsR0FBVVksSUFBTUQsRUFBT0MsSUFDdkJaLEVBQVVvQixPQUFTVCxFQUFPQyxJQUFNWixFQUFVd0IsTUFFMUMsSUFBSXkvQixJQUNGei9CLE9BQVF4SyxLQUFLdUcsVUFBVXlELGFBQVksSUFHakMyakMsR0FDRi9qQyxJQUFLMGpDLEVBQVF2akMsWUFDYkssT0FBUWtqQyxFQUFRdmpDLFlBQWN1akMsRUFBUTlpQyxVQUdwQ29qQyxFQUFrQkQsRUFBUy9qQyxJQUFPRCxFQUFPQyxJQUFNcWdDLEVBQVN6L0IsT0FDeERxakMsRUFBa0JGLEVBQVN2akMsT0FBVVQsRUFBT1MsT0FBUzYvQixFQUFTei9CLE9BRTlEK0YsR0FDRnU5QixLQUFNbmtDLEVBQU9ta0MsS0FDYmxrQyxJQUFLWixFQUFVb0IsUUFJYjJqQyxFQUFnQi90QyxLQUFLbXNDLGVBSWEsWUFBbEM0QixFQUFjeDlCLElBQUksY0FDcEJ3OUIsRUFBZ0JBLEVBQWNDLGVBR2hDLElBQUlDLEdBQWVGLEVBQWNwa0MsUUFFakM0RyxHQUFJM0csS0FBT3FrQyxFQUFhcmtDLElBQ3hCMkcsRUFBSXU5QixNQUFRRyxFQUFhSCxLQUVwQlAsR0FBcUJFLElBQ3hCQyxFQUFlLFNBR1pHLElBQW1CRCxHQUFvQkwsR0FFaENLLEdBQW1CQyxHQUFtQk4sSUFDaERHLEVBQWUsU0FGZkEsRUFBZSxTQUtHLFNBQWhCQSxHQUNESCxHQUFxQyxVQUFqQkcsS0FDckJuOUIsRUFBSTNHLElBQU1aLEVBQVVZLElBQU1xa0MsRUFBYXJrQyxJQUFNcWdDLEVBQVN6L0IsUUFHcEMsTUFBaEJrakMsSUFDRjF0QyxLQUFLdUcsVUFDRnVFLFlBQVksbURBQ1paLFNBQVMscUJBQXVCd2pDLEdBQ25DMXRDLEtBQUtpSixXQUNGNkIsWUFBWSxxREFDWlosU0FBUyxzQkFBd0J3akMsSUFHdEMxdEMsS0FBSzJzQyxtQkFBbUJwOEIsSUFBSUEsSUFHOUIyN0IsRUFBV3p1QyxVQUFVK3VDLGdCQUFrQixXQUNyQyxHQUFJajhCLElBQ0ZDLE1BQU94USxLQUFLaUosV0FBV2lsQyxZQUFXLEdBQVMsS0FHekNsdUMsTUFBSytFLFFBQVFJLElBQUksdUJBQ25Cb0wsRUFBSTQ5QixTQUFXNTlCLEVBQUlDLE1BQ25CRCxFQUFJakssU0FBVyxXQUNmaUssRUFBSUMsTUFBUSxRQUdkeFEsS0FBS3VHLFVBQVVnSyxJQUFJQSxJQUdyQjI3QixFQUFXenVDLFVBQVU0dUMsY0FBZ0IsU0FBVTk5QixHQUM3Q3ZPLEtBQUsyc0MsbUJBQW1CeUIsU0FBU3B1QyxLQUFLbXNDLGlCQUV0Q25zQyxLQUFLdXNDLG9CQUNMdnNDLEtBQUt3c0MsbUJBR0FOLElBR1Q1eUMsRUFBR0wsT0FBTyw4Q0FFUCxXQUNELFFBQVNvMUMsR0FBYzVyQyxHQUdyQixJQUFLLEdBRkR3b0MsR0FBUSxFQUVIN3BDLEVBQUksRUFBR0EsRUFBSXFCLEVBQUtySCxPQUFRZ0csSUFBSyxDQUNwQyxHQUFJK0UsR0FBTzFELEVBQUtyQixFQUVaK0UsR0FBS0YsU0FDUGdsQyxHQUFTb0QsRUFBYWxvQyxFQUFLRixVQUUzQmdsQyxJQUlKLE1BQU9BLEdBR1QsUUFBU3FELEdBQXlCLy9CLEVBQVdqSyxFQUFVUyxFQUFTQyxHQUM5RGhGLEtBQUt1dUMsd0JBQTBCeHBDLEVBQVFJLElBQUksMkJBRXZDbkYsS0FBS3V1Qyx3QkFBMEIsSUFDakN2dUMsS0FBS3V1Qyx3QkFBMEJDLEVBQUFBLEdBR2pDamdDLEVBQVV4VSxLQUFLaUcsS0FBTXNFLEVBQVVTLEVBQVNDLEdBVzFDLE1BUkFzcEMsR0FBd0I3d0MsVUFBVTB0QyxXQUFhLFNBQVU1OEIsRUFBVzdNLEdBQ2xFLFFBQUkyc0MsRUFBYTNzQyxFQUFPZSxLQUFLdUQsU0FBV2hHLEtBQUt1dUMsMEJBSXRDaGdDLEVBQVV4VSxLQUFLaUcsS0FBTTBCLElBR3ZCNHNDLElBR1RoMUMsRUFBR0wsT0FBTyxvQ0FFUCxXQUNELFFBQVN3MUMsTUE2Q1QsTUEzQ0FBLEdBQWNoeEMsVUFBVTRFLEtBQU8sU0FBVWtNLEVBQVd2RixFQUFXQyxHQUM3RCxHQUFJakMsR0FBT2hILElBRVh1TyxHQUFVeFUsS0FBS2lHLEtBQU1nSixFQUFXQyxHQUVoQ0QsRUFBVXpILEdBQUcsUUFBUyxTQUFVRyxHQUM5QnNGLEVBQUswbkMscUJBQXFCaHRDLE1BSTlCK3NDLEVBQWNoeEMsVUFBVWl4QyxxQkFBdUIsU0FBVWhnQyxFQUFHaE4sR0FDMUQsR0FBSUEsR0FBeUMsTUFBL0JBLEVBQU9pdEMscUJBQThCLENBQ2pELEdBQUludEMsR0FBUUUsRUFBT2l0QyxvQkFJbkIsSUFBb0IsV0FBaEJudEMsRUFBTUcsT0FBc0MsYUFBaEJILEVBQU1HLE1BQ3BDLE9BSUosR0FBSWl0QyxHQUFzQjV1QyxLQUFLcUosdUJBRy9CLE1BQUl1bEMsRUFBb0J4ekMsT0FBUyxHQUFqQyxDQUlBLEdBQUlxSCxHQUFPbXNDLEVBQW9CbnNDLEtBQUssT0FJakIsT0FBaEJBLEVBQUs2RSxTQUFtQjdFLEVBQUs2RSxRQUFRSixVQUNyQixNQUFoQnpFLEVBQUs2RSxTQUFtQjdFLEVBQUt5RSxVQUtoQ2xILEtBQUt5QixRQUFRLFVBQ1RnQixLQUFNQSxNQUlMZ3NDLElBR1RuMUMsRUFBR0wsT0FBTyxvQ0FFUCxXQUNELFFBQVM0MUMsTUE4QlQsTUE1QkFBLEdBQWNweEMsVUFBVTRFLEtBQU8sU0FBVWtNLEVBQVd2RixFQUFXQyxHQUM3RCxHQUFJakMsR0FBT2hILElBRVh1TyxHQUFVeFUsS0FBS2lHLEtBQU1nSixFQUFXQyxHQUVoQ0QsRUFBVXpILEdBQUcsU0FBVSxTQUFVb0osR0FDL0IzRCxFQUFLOG5DLGlCQUFpQm5rQyxLQUd4QjNCLEVBQVV6SCxHQUFHLFdBQVksU0FBVW9KLEdBQ2pDM0QsRUFBSzhuQyxpQkFBaUJua0MsTUFJMUJra0MsRUFBY3B4QyxVQUFVcXhDLGlCQUFtQixTQUFVcGdDLEVBQUcvRCxHQUN0RCxHQUFJRSxHQUFnQkYsRUFBSUUsYUFHcEJBLElBQWlCQSxFQUFja2tDLFNBSW5DL3VDLEtBQUt5QixRQUFRLFNBQ1hvSixjQUFlQSxFQUNmOGpDLHFCQUFzQmhrQyxLQUluQmtrQyxJQUdUdjFDLEVBQUdMLE9BQU8scUJBQXFCLFdBRTdCLE9BQ0UrMUMsYUFBYyxXQUNaLE1BQU8sb0NBRVRDLGFBQWMsU0FBVS95QyxHQUN0QixHQUFJZ3pDLEdBQVloekMsRUFBS21VLE1BQU1qVixPQUFTYyxFQUFLNHVDLFFBRXJDcGxDLEVBQVUsaUJBQW1Cd3BDLEVBQVksWUFNN0MsT0FKaUIsSUFBYkEsSUFDRnhwQyxHQUFXLEtBR05BLEdBRVR5cEMsY0FBZSxTQUFVanpDLEdBQ3ZCLEdBQUlrekMsR0FBaUJsekMsRUFBS3l1QyxRQUFVenVDLEVBQUttVSxNQUFNalYsT0FFM0NzSyxFQUFVLGdCQUFrQjBwQyxFQUFpQixxQkFFakQsT0FBTzFwQyxJQUVUK0IsWUFBYSxXQUNYLE1BQU8seUJBRVQ0bkMsZ0JBQWlCLFNBQVVuekMsR0FDekIsR0FBSXdKLEdBQVUsdUJBQXlCeEosRUFBSzR1QyxRQUFVLE9BTXRELE9BSm9CLElBQWhCNXVDLEVBQUs0dUMsVUFDUHBsQyxHQUFXLEtBR05BLEdBRVQ0cEMsVUFBVyxXQUNULE1BQU8sb0JBRVRDLFVBQVcsV0FDVCxNQUFPLGlCQUtiajJDLEVBQUdMLE9BQU8sb0JBQ1IsU0FDQSxVQUVBLFlBRUEscUJBQ0EsdUJBQ0EsMEJBQ0EseUJBQ0EscUJBQ0EseUJBRUEsVUFDQSxnQkFDQSxlQUVBLGdCQUNBLGVBQ0EsY0FDQSxjQUNBLG1CQUNBLDRCQUNBLDRCQUNBLGdDQUVBLGFBQ0Esb0JBQ0EsNkJBQ0EsNEJBQ0Esd0JBQ0EscUNBQ0EsMkJBQ0EsMkJBRUEsYUFDQyxTQUFVaUcsRUFBRzlGLEVBRUhvMkMsRUFFQTVoQyxFQUFpQk0sRUFBbUJJLEVBQWFTLEVBQ2pEMGdDLEVBQWlCLytCLEVBRWpCL1EsRUFBT21SLEVBQWE0K0IsRUFFcEJDLEVBQVlDLEVBQVdDLEVBQVUzRyxFQUFNYSxFQUN2Q1MsRUFBb0JJLEVBQW9CRyxFQUV4Q0csRUFBVTRFLEVBQWdCMUUsRUFBaUJHLEVBQzNDVyxFQUFZb0MsRUFBeUJHLEVBQWVJLEVBRXBEa0IsR0FDWCxRQUFTQyxLQUNQaHdDLEtBQUtpd0MsUUFHUEQsRUFBU3Z5QyxVQUFVbEIsTUFBUSxTQUFVd0ksR0FHbkMsR0FGQUEsRUFBVTdGLEVBQUUrUixRQUFPLEtBQVVqUixLQUFLK21DLFNBQVVoaUMsR0FFakIsTUFBdkJBLEVBQVFDLFlBQXFCLENBeUMvQixHQXhDb0IsTUFBaEJELEVBQVFzakMsS0FDVnRqQyxFQUFRQyxZQUFjNnFDLEVBQ0csTUFBaEI5cUMsRUFBUXRDLEtBQ2pCc0MsRUFBUUMsWUFBYzRxQyxFQUV0QjdxQyxFQUFRQyxZQUFjMnFDLEVBR3BCNXFDLEVBQVEybEMsbUJBQXFCLElBQy9CM2xDLEVBQVFDLFlBQWNyRixFQUFNVSxTQUMxQjBFLEVBQVFDLFlBQ1J3bEMsSUFJQXpsQyxFQUFROGxDLG1CQUFxQixJQUMvQjlsQyxFQUFRQyxZQUFjckYsRUFBTVUsU0FDMUIwRSxFQUFRQyxZQUNSNGxDLElBSUE3bEMsRUFBUWltQyx1QkFBeUIsSUFDbkNqbUMsRUFBUUMsWUFBY3JGLEVBQU1VLFNBQzFCMEUsRUFBUUMsWUFDUitsQyxJQUlBaG1DLEVBQVFva0MsT0FDVnBrQyxFQUFRQyxZQUFjckYsRUFBTVUsU0FBUzBFLEVBQVFDLFlBQWFra0MsSUFHN0IsTUFBM0Jua0MsRUFBUW1yQyxpQkFBZ0QsTUFBckJuckMsRUFBUWlsQyxZQUM3Q2psQyxFQUFRQyxZQUFjckYsRUFBTVUsU0FDMUIwRSxFQUFRQyxZQUNSK2tDLElBSWlCLE1BQWpCaGxDLEVBQVFpaEMsTUFBZSxDQUN6QixHQUFJbUssR0FBUS8yQyxFQUFRMkwsRUFBUXFyQyxRQUFVLGVBRXRDcnJDLEdBQVFDLFlBQWNyRixFQUFNVSxTQUMxQjBFLEVBQVFDLFlBQ1JtckMsR0FJSixHQUE2QixNQUF6QnByQyxFQUFRc3JDLGNBQXVCLENBQ2pDLEdBQUlDLEdBQWdCbDNDLEVBQVEyTCxFQUFRcXJDLFFBQVUsdUJBRTlDcnJDLEdBQVFDLFlBQWNyRixFQUFNVSxTQUMxQjBFLEVBQVFDLFlBQ1JzckMsSUE4Qk4sR0F6QjhCLE1BQTFCdnJDLEVBQVF3ckMsaUJBQ1Z4ckMsRUFBUXdyQyxlQUFpQmYsRUFFTCxNQUFoQnpxQyxFQUFRc2pDLE9BQ1Z0akMsRUFBUXdyQyxlQUFpQjV3QyxFQUFNVSxTQUM3QjBFLEVBQVF3ckMsZUFDUmhGLElBSXVCLE1BQXZCeG1DLEVBQVF5SixjQUNWekosRUFBUXdyQyxlQUFpQjV3QyxFQUFNVSxTQUM3QjBFLEVBQVF3ckMsZUFDUm5GLElBSUFybUMsRUFBUXlyQyxnQkFDVnpyQyxFQUFRd3JDLGVBQWlCNXdDLEVBQU1VLFNBQzdCMEUsRUFBUXdyQyxlQUNSOUIsS0FLeUIsTUFBM0IxcEMsRUFBUTByQyxnQkFBeUIsQ0FDbkMsR0FBSTFyQyxFQUFRMnJDLFNBQ1YzckMsRUFBUTByQyxnQkFBa0J2RixNQUNyQixDQUNMLEdBQUl5RixHQUFxQmh4QyxFQUFNVSxTQUFTNnFDLEVBQVU0RSxFQUVsRC9xQyxHQUFRMHJDLGdCQUFrQkUsRUFpQjVCLEdBZHdDLElBQXBDNXJDLEVBQVF3cEMsMEJBQ1Z4cEMsRUFBUTByQyxnQkFBa0I5d0MsRUFBTVUsU0FDOUIwRSxFQUFRMHJDLGdCQUNSbkMsSUFJQXZwQyxFQUFRNnJDLGdCQUNWN3JDLEVBQVEwckMsZ0JBQWtCOXdDLEVBQU1VLFNBQzlCMEUsRUFBUTByQyxnQkFDUjVCLElBSzBCLE1BQTVCOXBDLEVBQVE4ckMsa0JBQ2UsTUFBdkI5ckMsRUFBUStyQyxhQUN5QixNQUFqQy9yQyxFQUFRZ3NDLHNCQUNSLENBQ0EsR0FBSUMsR0FBYzUzQyxFQUFRMkwsRUFBUXFyQyxRQUFVLHFCQUU1Q3JyQyxHQUFRMHJDLGdCQUFrQjl3QyxFQUFNVSxTQUM5QjBFLEVBQVEwckMsZ0JBQ1JPLEdBSUpqc0MsRUFBUTByQyxnQkFBa0I5d0MsRUFBTVUsU0FDOUIwRSxFQUFRMHJDLGdCQUNSdkUsR0FJSixHQUFnQyxNQUE1Qm5uQyxFQUFRa3NDLGlCQUEwQixDQTZCcEMsR0E1Qklsc0MsRUFBUTJyQyxTQUNWM3JDLEVBQVFrc0MsaUJBQW1CL2lDLEVBRTNCbkosRUFBUWtzQyxpQkFBbUJyakMsRUFJRixNQUF2QjdJLEVBQVF5SixjQUNWekosRUFBUWtzQyxpQkFBbUJ0eEMsRUFBTVUsU0FDL0IwRSxFQUFRa3NDLGlCQUNSM2lDLElBSUF2SixFQUFRbXNDLGFBQ1Zuc0MsRUFBUWtzQyxpQkFBbUJ0eEMsRUFBTVUsU0FDL0IwRSxFQUFRa3NDLGlCQUNSbGlDLElBSUFoSyxFQUFRMnJDLFdBQ1YzckMsRUFBUWtzQyxpQkFBbUJ0eEMsRUFBTVUsU0FDL0IwRSxFQUFRa3NDLGlCQUNSeEIsSUFLMkIsTUFBN0IxcUMsRUFBUW9zQyxtQkFDZ0IsTUFBeEJwc0MsRUFBUXFzQyxjQUMwQixNQUFsQ3JzQyxFQUFRc3NDLHVCQUNSLENBQ0EsR0FBSUMsR0FBZWw0QyxFQUFRMkwsRUFBUXFyQyxRQUFVLHNCQUU3Q3JyQyxHQUFRa3NDLGlCQUFtQnR4QyxFQUFNVSxTQUMvQjBFLEVBQVFrc0MsaUJBQ1JLLEdBSUp2c0MsRUFBUWtzQyxpQkFBbUJ0eEMsRUFBTVUsU0FDL0IwRSxFQUFRa3NDLGlCQUNSdmdDLEdBSUosR0FBZ0MsZ0JBQXJCM0wsR0FBUXdzQyxTQUVqQixHQUFJeHNDLEVBQVF3c0MsU0FBUzExQyxRQUFRLEtBQU8sRUFBRyxDQUVyQyxHQUFJMjFDLEdBQWdCenNDLEVBQVF3c0MsU0FBU3gyQyxNQUFNLEtBQ3ZDMDJDLEVBQWVELEVBQWMsRUFFakN6c0MsR0FBUXdzQyxVQUFZeHNDLEVBQVF3c0MsU0FBVUUsT0FFdEMxc0MsR0FBUXdzQyxVQUFZeHNDLEVBQVF3c0MsU0FJaEMsSUFBSXJ5QyxFQUFFdXBDLFFBQVExakMsRUFBUXdzQyxVQUFXLENBQy9CLEdBQUlHLEdBQVksR0FBSTVnQyxFQUNwQi9MLEdBQVF3c0MsU0FBU2wxQyxLQUFLLEtBSXRCLEtBQUssR0FGRHMxQyxHQUFnQjVzQyxFQUFRd3NDLFNBRW5CSyxFQUFJLEVBQUdBLEVBQUlELEVBQWN2MkMsT0FBUXcyQyxJQUFLLENBQzdDLEdBQUkzM0MsR0FBTzAzQyxFQUFjQyxHQUNyQkwsSUFFSixLQUVFQSxFQUFXemdDLEVBQVlNLFNBQVNuWCxHQUNoQyxNQUFPZ0UsR0FDUCxJQUVFaEUsRUFBTytGLEtBQUsrbUMsU0FBUzhLLGdCQUFrQjUzQyxFQUN2Q3MzQyxFQUFXemdDLEVBQVlNLFNBQVNuWCxHQUNoQyxNQUFPNjNDLEdBSUgvc0MsRUFBUWd0QyxPQUFTOWtDLE9BQU85TixTQUFXQSxRQUFRNnlDLE1BQzdDN3lDLFFBQVE2eUMsS0FDTixtQ0FBcUMvM0MsRUFBTyx3RUFLaEQsV0FJSnkzQyxFQUFVemdDLE9BQU9zZ0MsR0FHbkJ4c0MsRUFBUXVNLGFBQWVvZ0MsTUFDbEIsQ0FDTCxHQUFJTyxHQUFrQm5oQyxFQUFZTSxTQUNoQ3BSLEtBQUsrbUMsU0FBUzhLLGdCQUFrQixNQUU5QkssRUFBb0IsR0FBSXBoQyxHQUFZL0wsRUFBUXdzQyxTQUVoRFcsR0FBa0JqaEMsT0FBT2doQyxHQUV6Qmx0QyxFQUFRdU0sYUFBZTRnQyxFQUd6QixNQUFPbnRDLElBR1RpckMsRUFBU3Z5QyxVQUFVd3lDLE1BQVEsV0FDekIsUUFBU2tDLEdBQWlCdnFDLEdBRXhCLFFBQVN4RCxHQUFNZ3VDLEdBQ2IsTUFBTzFDLEdBQVcwQyxJQUFNQSxFQUcxQixNQUFPeHFDLEdBQUtwTSxRQUFRLG9CQUFxQjRJLEdBRzNDLFFBQVM0aUMsR0FBU3RsQyxFQUFRZSxHQUV4QixHQUE0QixLQUF4QnZELEVBQUUycUMsS0FBS25vQyxFQUFPNE8sTUFDaEIsTUFBTzdOLEVBSVQsSUFBSUEsRUFBS3dELFVBQVl4RCxFQUFLd0QsU0FBUzdLLE9BQVMsRUFBRyxDQU03QyxJQUFLLEdBSERnSixHQUFRbEYsRUFBRStSLFFBQU8sS0FBVXhPLEdBR3RCa0csRUFBSWxHLEVBQUt3RCxTQUFTN0ssT0FBUyxFQUFHdU4sR0FBSyxFQUFHQSxJQUFLLENBQ2xELEdBQUlDLEdBQVFuRyxFQUFLd0QsU0FBUzBDLEdBRXRCNjlCLEVBQVVRLEVBQVF0bEMsRUFBUWtILEVBR2YsT0FBWDQ5QixHQUNGcGlDLEVBQU02QixTQUFTdEssT0FBT2dOLEVBQUcsR0FLN0IsTUFBSXZFLEdBQU02QixTQUFTN0ssT0FBUyxFQUNuQmdKLEVBSUY0aUMsRUFBUXRsQyxFQUFRMEMsR0FHekIsR0FBSWl1QyxHQUFXRixFQUFnQjF2QyxFQUFLbUYsTUFBTTBxQyxjQUN0Q2hpQyxFQUFPNmhDLEVBQWdCendDLEVBQU80TyxNQUFNZ2lDLGFBR3hDLE9BQUlELEdBQVN4MkMsUUFBUXlVLElBQVEsRUFDcEI3TixFQUlGLEtBR1R6QyxLQUFLK21DLFVBQ0hxSixRQUFTLEtBQ1R5QixnQkFBaUIsVUFDakJqQixlQUFlLEVBQ2ZtQixPQUFPLEVBQ1BRLG1CQUFtQixFQUNuQjl1QyxhQUFjOUQsRUFBTThELGFBQ3BCOHRDLFNBQVV4QixFQUNWL0ksUUFBU0EsRUFDVDBELG1CQUFvQixFQUNwQkcsbUJBQW9CLEVBQ3BCRyx1QkFBd0IsRUFDeEJ1RCx3QkFBeUIsRUFDekJpQyxlQUFlLEVBQ2YvcEMsT0FBUSxTQUFVaEUsR0FDaEIsTUFBT0EsSUFFVCt2QyxlQUFnQixTQUFVdm5DLEdBQ3hCLE1BQU9BLEdBQU9yRCxNQUVoQjZxQyxrQkFBbUIsU0FBVTFrQyxHQUMzQixNQUFPQSxHQUFVbkcsTUFFbkI4cUMsTUFBTyxVQUNQbGlDLE1BQU8sWUFJWHcvQixFQUFTdnlDLFVBQVVrMUMsSUFBTSxTQUFVeHlDLEVBQUt4RCxHQUN0QyxHQUFJaTJDLEdBQVcxekMsRUFBRTJ6QyxVQUFVMXlDLEdBRXZCc0MsSUFDSkEsR0FBS213QyxHQUFZajJDLENBRWpCLElBQUltMkMsR0FBZ0JuekMsRUFBTTZDLGFBQWFDLEVBRXZDdkQsR0FBRStSLE9BQU9qUixLQUFLK21DLFNBQVUrTCxHQUcxQixJQUFJL0wsR0FBVyxHQUFJaUosRUFFbkIsT0FBT2pKLEtBR1R6dEMsRUFBR0wsT0FBTyxtQkFDUixVQUNBLFNBQ0EsYUFDQSxXQUNDLFNBQVVHLEVBQVM4RixFQUFHOHdDLEVBQVVyd0MsR0FDakMsUUFBU296QyxHQUFTaHVDLEVBQVNULEdBU3pCLEdBUkF0RSxLQUFLK0UsUUFBVUEsRUFFQyxNQUFaVCxHQUNGdEUsS0FBS2d6QyxZQUFZMXVDLEdBR25CdEUsS0FBSytFLFFBQVVpckMsRUFBU3p6QyxNQUFNeUQsS0FBSytFLFNBRS9CVCxHQUFZQSxFQUFTOGhDLEdBQUcsU0FBVSxDQUNwQyxHQUFJNk0sR0FBYzc1QyxFQUFRNEcsS0FBS21GLElBQUksV0FBYSxtQkFFaERuRixNQUFLK0UsUUFBUUMsWUFBY3JGLEVBQU1VLFNBQy9CTCxLQUFLK0UsUUFBUUMsWUFDYml1QyxJQW9HTixNQS9GQUYsR0FBUXQxQyxVQUFVdTFDLFlBQWMsU0FBVXZJLEdBQ3hDLEdBQUl5SSxJQUFnQixVQUVTLE9BQXpCbHpDLEtBQUsrRSxRQUFRMnJDLFdBQ2Yxd0MsS0FBSytFLFFBQVEyckMsU0FBV2pHLEVBQUc1d0MsS0FBSyxhQUdMLE1BQXpCbUcsS0FBSytFLFFBQVE0QyxXQUNmM0gsS0FBSytFLFFBQVE0QyxTQUFXOGlDLEVBQUc1d0MsS0FBSyxhQUdMLE1BQXpCbUcsS0FBSytFLFFBQVF3c0MsV0FDWDlHLEVBQUc1d0MsS0FBSyxRQUNWbUcsS0FBSytFLFFBQVF3c0MsU0FBVzlHLEVBQUc1d0MsS0FBSyxRQUFRaUosY0FDL0IybkMsRUFBR2o5QixRQUFRLFVBQVUzVCxLQUFLLFVBQ25DbUcsS0FBSytFLFFBQVF3c0MsU0FBVzlHLEVBQUdqOUIsUUFBUSxVQUFVM1QsS0FBSyxVQUk5QixNQUFwQm1HLEtBQUsrRSxRQUFRb3VDLE1BQ1gxSSxFQUFHNXdDLEtBQUssT0FDVm1HLEtBQUsrRSxRQUFRb3VDLElBQU0xSSxFQUFHNXdDLEtBQUssT0FDbEI0d0MsRUFBR2o5QixRQUFRLFNBQVMzVCxLQUFLLE9BQ2xDbUcsS0FBSytFLFFBQVFvdUMsSUFBTTFJLEVBQUdqOUIsUUFBUSxTQUFTM1QsS0FBSyxPQUU1Q21HLEtBQUsrRSxRQUFRb3VDLElBQU0sT0FJdkIxSSxFQUFHNXdDLEtBQUssV0FBWW1HLEtBQUsrRSxRQUFRNEMsVUFDakM4aUMsRUFBRzV3QyxLQUFLLFdBQVltRyxLQUFLK0UsUUFBUTJyQyxVQUU3QmpHLEVBQUdob0MsS0FBSyxpQkFDTnpDLEtBQUsrRSxRQUFRZ3RDLE9BQVM5a0MsT0FBTzlOLFNBQVdBLFFBQVE2eUMsTUFDbEQ3eUMsUUFBUTZ5QyxLQUNOLDJLQU1KdkgsRUFBR2hvQyxLQUFLLE9BQVFnb0MsRUFBR2hvQyxLQUFLLGdCQUN4QmdvQyxFQUFHaG9DLEtBQUssUUFBUSxJQUdkZ29DLEVBQUdob0MsS0FBSyxhQUNOekMsS0FBSytFLFFBQVFndEMsT0FBUzlrQyxPQUFPOU4sU0FBV0EsUUFBUTZ5QyxNQUNsRDd5QyxRQUFRNnlDLEtBQ04sZ0tBTUp2SCxFQUFHcmxDLEtBQUssWUFBYXFsQyxFQUFHaG9DLEtBQUssWUFDN0Jnb0MsRUFBR2hvQyxLQUFLLFlBQWFnb0MsRUFBR2hvQyxLQUFLLFlBRy9CLElBQUkyd0MsS0FLRkEsR0FERWwwQyxFQUFFM0YsR0FBR2lMLFFBQXNDLE1BQTVCdEYsRUFBRTNGLEdBQUdpTCxPQUFPQyxPQUFPLEVBQUcsSUFBY2dtQyxFQUFHLEdBQUcySSxRQUNqRGwwQyxFQUFFK1IsUUFBTyxLQUFVdzVCLEVBQUcsR0FBRzJJLFFBQVMzSSxFQUFHaG9DLFFBRXJDZ29DLEVBQUdob0MsTUFHZixJQUFJQSxHQUFPdkQsRUFBRStSLFFBQU8sS0FBVW1pQyxFQUU5QjN3QyxHQUFPOUMsRUFBTTZDLGFBQWFDLEVBRTFCLEtBQUssR0FBSXRDLEtBQU9zQyxHQUNWdkQsRUFBRXFJLFFBQVFwSCxFQUFLK3lDLElBQWdCLElBSS9CaDBDLEVBQUU0bkMsY0FBYzltQyxLQUFLK0UsUUFBUTVFLElBQy9CakIsRUFBRStSLE9BQU9qUixLQUFLK0UsUUFBUTVFLEdBQU1zQyxFQUFLdEMsSUFFakNILEtBQUsrRSxRQUFRNUUsR0FBT3NDLEVBQUt0QyxHQUk3QixPQUFPSCxPQUdUK3lDLEVBQVF0MUMsVUFBVTBILElBQU0sU0FBVWhGLEdBQ2hDLE1BQU9ILE1BQUsrRSxRQUFRNUUsSUFHdEI0eUMsRUFBUXQxQyxVQUFVazFDLElBQU0sU0FBVXh5QyxFQUFLbUksR0FDckN0SSxLQUFLK0UsUUFBUTVFLEdBQU9tSSxHQUdmeXFDLElBR1R6NUMsRUFBR0wsT0FBTyxnQkFDUixTQUNBLFlBQ0EsVUFDQSxVQUNDLFNBQVVpRyxFQUFHNnpDLEVBQVNwekMsRUFBTzBMLEdBQzlCLEdBQUlnb0MsR0FBVSxTQUFVL3VDLEVBQVVTLEdBQ0EsTUFBNUJULEVBQVM3QixLQUFLLFlBQ2hCNkIsRUFBUzdCLEtBQUssV0FBV3NJLFVBRzNCL0ssS0FBS3NFLFNBQVdBLEVBRWhCdEUsS0FBSzdCLEdBQUs2QixLQUFLc3pDLFlBQVlodkMsR0FFM0JTLEVBQVVBLE1BRVYvRSxLQUFLK0UsUUFBVSxHQUFJZ3VDLEdBQVFodUMsRUFBU1QsR0FFcEMrdUMsRUFBUWp6QyxVQUFVSCxZQUFZbEcsS0FBS2lHLEtBSW5DLElBQUl1ekMsR0FBV2p2QyxFQUFTYyxLQUFLLGFBQWUsQ0FDNUNkLEdBQVM3QixLQUFLLGVBQWdCOHdDLEdBQzlCanZDLEVBQVNjLEtBQUssV0FBWSxLQUkxQixJQUFJb3VDLEdBQWN4ekMsS0FBSytFLFFBQVFJLElBQUksY0FDbkNuRixNQUFLZ0YsWUFBYyxHQUFJd3VDLEdBQVlsdkMsRUFBVXRFLEtBQUsrRSxRQUVsRCxJQUFJa0UsR0FBYWpKLEtBQUtpRixRQUV0QmpGLE1BQUt5ekMsZ0JBQWdCeHFDLEVBRXJCLElBQUl5cUMsR0FBbUIxekMsS0FBSytFLFFBQVFJLElBQUksbUJBQ3hDbkYsTUFBSytOLFVBQVksR0FBSTJsQyxHQUFpQnB2QyxFQUFVdEUsS0FBSytFLFNBQ3JEL0UsS0FBS3dNLFdBQWF4TSxLQUFLK04sVUFBVTlJLFNBRWpDakYsS0FBSytOLFVBQVV6SCxTQUFTdEcsS0FBS3dNLFdBQVl2RCxFQUV6QyxJQUFJMHFDLEdBQWtCM3pDLEtBQUsrRSxRQUFRSSxJQUFJLGtCQUN2Q25GLE1BQUtpcUMsU0FBVyxHQUFJMEosR0FBZ0JydkMsRUFBVXRFLEtBQUsrRSxTQUNuRC9FLEtBQUt1RyxVQUFZdkcsS0FBS2lxQyxTQUFTaGxDLFNBRS9CakYsS0FBS2lxQyxTQUFTM2pDLFNBQVN0RyxLQUFLdUcsVUFBVzBDLEVBRXZDLElBQUkycUMsR0FBaUI1ekMsS0FBSytFLFFBQVFJLElBQUksaUJBQ3RDbkYsTUFBS2dHLFFBQVUsR0FBSTR0QyxHQUFldHZDLEVBQVV0RSxLQUFLK0UsUUFBUy9FLEtBQUtnRixhQUMvRGhGLEtBQUtrRixTQUFXbEYsS0FBS2dHLFFBQVFmLFNBRTdCakYsS0FBS2dHLFFBQVFNLFNBQVN0RyxLQUFLa0YsU0FBVWxGLEtBQUt1RyxVQUkxQyxJQUFJUyxHQUFPaEgsSUFHWEEsTUFBSzZ6QyxnQkFHTDd6QyxLQUFLOHpDLHFCQUdMOXpDLEtBQUsrekMsc0JBQ0wvekMsS0FBS2cwQywyQkFDTGgwQyxLQUFLaTBDLDBCQUNMajBDLEtBQUtrMEMseUJBQ0xsMEMsS0FBS20wQyxrQkFHTG4wQyxLQUFLZ0YsWUFBWWlDLFFBQVEsU0FBVW10QyxHQUNqQ3B0QyxFQUFLdkYsUUFBUSxvQkFDWGdCLEtBQU0yeEMsTUFLVjl2QyxFQUFTNEYsU0FBUyw2QkFDbEI1RixFQUFTYyxLQUFLLGNBQWUsUUFHN0JwRixLQUFLcTBDLGtCQUVML3ZDLEVBQVM3QixLQUFLLFVBQVd6QyxNQTZnQjNCLE9BMWdCQUwsR0FBTUMsT0FBT3l6QyxFQUFTMXpDLEVBQU0wQixZQUU1Qmd5QyxFQUFRNTFDLFVBQVU2MUMsWUFBYyxTQUFVaHZDLEdBQ3hDLEdBQUluRyxHQUFLLEVBYVQsT0FWRUEsR0FEeUIsTUFBdkJtRyxFQUFTYyxLQUFLLE1BQ1hkLEVBQVNjLEtBQUssTUFDZSxNQUF6QmQsRUFBU2MsS0FBSyxRQUNsQmQsRUFBU2MsS0FBSyxRQUFVLElBQU16RixFQUFNbUMsY0FBYyxHQUVsRG5DLEVBQU1tQyxjQUFjLEdBRzNCM0QsRUFBS0EsRUFBRzNDLFFBQVEsa0JBQW1CLElBQ25DMkMsRUFBSyxXQUFhQSxHQUtwQmsxQyxFQUFRNTFDLFVBQVVnMkMsZ0JBQWtCLFNBQVV4cUMsR0FDNUNBLEVBQVdxckMsWUFBWXQwQyxLQUFLc0UsU0FFNUIsSUFBSWtNLEdBQVF4USxLQUFLdTBDLGNBQWN2MEMsS0FBS3NFLFNBQVV0RSxLQUFLK0UsUUFBUUksSUFBSSxTQUVsRCxPQUFUcUwsR0FDRnZILEVBQVdzSCxJQUFJLFFBQVNDLElBSTVCNmlDLEVBQVE1MUMsVUFBVTgyQyxjQUFnQixTQUFVandDLEVBQVVrd0MsR0FDcEQsR0FBSUMsR0FBUSwrREFFWixJQUFjLFdBQVZELEVBQXFCLENBQ3ZCLEdBQUlFLEdBQWExMEMsS0FBS3UwQyxjQUFjandDLEVBQVUsUUFFOUMsT0FBa0IsT0FBZG93QyxFQUNLQSxFQUdGMTBDLEtBQUt1MEMsY0FBY2p3QyxFQUFVLFdBR3RDLEdBQWMsV0FBVmt3QyxFQUFxQixDQUN2QixHQUFJRyxHQUFlcndDLEVBQVM0cEMsWUFBVyxFQUV2QyxPQUFJeUcsSUFBZ0IsRUFDWCxPQUdGQSxFQUFlLEtBR3hCLEdBQWMsU0FBVkgsRUFBbUIsQ0FDckIsR0FBSXJ4QyxHQUFRbUIsRUFBU2MsS0FBSyxRQUUxQixJQUFzQixnQkFBWixHQUNSLE1BQU8sS0FLVCxLQUFLLEdBRkQ2QyxHQUFROUUsRUFBTXBJLE1BQU0sS0FFZkosRUFBSSxFQUFHaTNDLEVBQUkzcEMsRUFBTTdNLE9BQVFULEVBQUlpM0MsRUFBR2ozQyxHQUFRLEVBQUcsQ0FDbEQsR0FBSXlLLEdBQU82QyxFQUFNdE4sR0FBR2EsUUFBUSxNQUFPLElBQy9CZ3JDLEVBQVVwaEMsRUFBS2hCLE1BQU1xd0MsRUFFekIsSUFBZ0IsT0FBWmpPLEdBQW9CQSxFQUFRcHJDLFFBQVUsRUFDeEMsTUFBT29yQyxHQUFRLEdBSW5CLE1BQU8sTUFHVCxNQUFPZ08sSUFHVG5CLEVBQVE1MUMsVUFBVW8yQyxjQUFnQixXQUNoQzd6QyxLQUFLZ0YsWUFBWTNDLEtBQUtyQyxLQUFNQSxLQUFLaUosWUFDakNqSixLQUFLK04sVUFBVTFMLEtBQUtyQyxLQUFNQSxLQUFLaUosWUFFL0JqSixLQUFLaXFDLFNBQVM1bkMsS0FBS3JDLEtBQU1BLEtBQUtpSixZQUM5QmpKLEtBQUtnRyxRQUFRM0QsS0FBS3JDLEtBQU1BLEtBQUtpSixhQUcvQm9xQyxFQUFRNTFDLFVBQVVxMkMsbUJBQXFCLFdBQ3JDLEdBQUk5c0MsR0FBT2hILElBRVhBLE1BQUtzRSxTQUFTL0MsR0FBRyxpQkFBa0IsV0FDakN5RixFQUFLaEMsWUFBWWlDLFFBQVEsU0FBVXhFLEdBQ2pDdUUsRUFBS3ZGLFFBQVEsb0JBQ1hnQixLQUFNQSxRQUtaekMsS0FBS3NFLFNBQVMvQyxHQUFHLGdCQUFpQixTQUFVb0osR0FDMUMzRCxFQUFLdkYsUUFBUSxRQUFTa0osS0FHeEIzSyxLQUFLNDBDLE9BQVNqMUMsRUFBTTBDLEtBQUtyQyxLQUFLcTBDLGdCQUFpQnIwQyxNQUMvQ0EsS0FBSzYwQyxPQUFTbDFDLEVBQU0wQyxLQUFLckMsS0FBSzgwQyxhQUFjOTBDLE1BRXhDQSxLQUFLc0UsU0FBUyxHQUFHeXdDLGFBQ25CLzBDLEtBQUtzRSxTQUFTLEdBQUd5d0MsWUFBWSxtQkFBb0IvMEMsS0FBSzQwQyxPQUd4RCxJQUFJSSxHQUFXL25DLE9BQU9nb0Msa0JBQ3BCaG9DLE9BQU9pb0Msd0JBQ1Bqb0MsT0FBT2tvQyxtQkFHTyxPQUFaSCxHQUNGaDFDLEtBQUtvMUMsVUFBWSxHQUFJSixHQUFTLFNBQVVLLEdBQ3RDbjJDLEVBQUVtSSxLQUFLZ3VDLEVBQVdydUMsRUFBSzR0QyxRQUN2QjExQyxFQUFFbUksS0FBS2d1QyxFQUFXcnVDLEVBQUs2dEMsVUFFekI3MEMsS0FBS28xQyxVQUFVRSxRQUFRdDFDLEtBQUtzRSxTQUFTLElBQ25DaXhDLFlBQVksRUFDWkMsV0FBVyxFQUNYQyxTQUFTLEtBRUZ6MUMsS0FBS3NFLFNBQVMsR0FBR294QyxtQkFDMUIxMUMsS0FBS3NFLFNBQVMsR0FBR294QyxpQkFDZixrQkFDQTF1QyxFQUFLNHRDLFFBQ0wsR0FFRjUwQyxLQUFLc0UsU0FBUyxHQUFHb3hDLGlCQUNmLGtCQUNBMXVDLEVBQUs2dEMsUUFDTCxHQUVGNzBDLEtBQUtzRSxTQUFTLEdBQUdveEMsaUJBQ2YsaUJBQ0ExdUMsRUFBSzZ0QyxRQUNMLEtBS054QixFQUFRNTFDLFVBQVVzMkMsb0JBQXNCLFdBQ3RDLEdBQUkvc0MsR0FBT2hILElBRVhBLE1BQUtnRixZQUFZekQsR0FBRyxJQUFLLFNBQVV0SCxFQUFNeUgsR0FDdkNzRixFQUFLdkYsUUFBUXhILEVBQU15SCxNQUl2QjJ4QyxFQUFRNTFDLFVBQVV1MkMseUJBQTJCLFdBQzNDLEdBQUlodEMsR0FBT2hILEtBQ1AyMUMsR0FBa0IsU0FBVSxRQUVoQzMxQyxNQUFLK04sVUFBVXhNLEdBQUcsU0FBVSxXQUMxQnlGLEVBQUs0dUMsbUJBR1A1MUMsS0FBSytOLFVBQVV4TSxHQUFHLFFBQVMsU0FBVUcsR0FDbkNzRixFQUFLK0YsTUFBTXJMLEtBR2IxQixLQUFLK04sVUFBVXhNLEdBQUcsSUFBSyxTQUFVdEgsRUFBTXlILEdBQ2pDeEMsRUFBRXFJLFFBQVF0TixFQUFNMDdDLE1BQW9CLEdBSXhDM3VDLEVBQUt2RixRQUFReEgsRUFBTXlILE1BSXZCMnhDLEVBQVE1MUMsVUFBVXcyQyx3QkFBMEIsV0FDMUMsR0FBSWp0QyxHQUFPaEgsSUFFWEEsTUFBS2lxQyxTQUFTMW9DLEdBQUcsSUFBSyxTQUFVdEgsRUFBTXlILEdBQ3BDc0YsRUFBS3ZGLFFBQVF4SCxFQUFNeUgsTUFJdkIyeEMsRUFBUTUxQyxVQUFVeTJDLHVCQUF5QixXQUN6QyxHQUFJbHRDLEdBQU9oSCxJQUVYQSxNQUFLZ0csUUFBUXpFLEdBQUcsSUFBSyxTQUFVdEgsRUFBTXlILEdBQ25Dc0YsRUFBS3ZGLFFBQVF4SCxFQUFNeUgsTUFJdkIyeEMsRUFBUTUxQyxVQUFVMDJDLGdCQUFrQixXQUNsQyxHQUFJbnRDLEdBQU9oSCxJQUVYQSxNQUFLdUIsR0FBRyxPQUFRLFdBQ2R5RixFQUFLaUMsV0FBV2lCLFNBQVMsNkJBRzNCbEssS0FBS3VCLEdBQUcsUUFBUyxXQUNmeUYsRUFBS2lDLFdBQVc2QixZQUFZLDZCQUc5QjlLLEtBQUt1QixHQUFHLFNBQVUsV0FDaEJ5RixFQUFLaUMsV0FBVzZCLFlBQVksaUNBRzlCOUssS0FBS3VCLEdBQUcsVUFBVyxXQUNqQnlGLEVBQUtpQyxXQUFXaUIsU0FBUyxpQ0FHM0JsSyxLQUFLdUIsR0FBRyxPQUFRLFdBQ2R5RixFQUFLaUMsV0FBVzZCLFlBQVksOEJBRzlCOUssS0FBS3VCLEdBQUcsUUFBUyxTQUFVRyxHQUNwQnNGLEVBQUtrQyxVQUNSbEMsRUFBS3ZGLFFBQVEsV0FHZnpCLEtBQUtnRixZQUFZZ2hDLE1BQU10a0MsRUFBUSxTQUFVZSxHQUN2Q3VFLEVBQUt2RixRQUFRLGVBQ1hnQixLQUFNQSxFQUNOdWpDLE1BQU90a0MsUUFLYjFCLEtBQUt1QixHQUFHLGVBQWdCLFNBQVVHLEdBQ2hDMUIsS0FBS2dGLFlBQVlnaEMsTUFBTXRrQyxFQUFRLFNBQVVlLEdBQ3ZDdUUsRUFBS3ZGLFFBQVEsa0JBQ1hnQixLQUFNQSxFQUNOdWpDLE1BQU90a0MsUUFLYjFCLEtBQUt1QixHQUFHLFdBQVksU0FBVW9KLEdBQzVCLEdBQUl4SyxHQUFNd0ssRUFBSWlDLEtBRVY1RixHQUFLa0MsU0FDSC9JLElBQVFrTCxFQUFLTyxLQUFPekwsSUFBUWtMLEVBQUtFLEtBQ2hDcEwsSUFBUWtMLEVBQUtjLElBQU14QixFQUFJa3JDLFFBQzFCN3VDLEVBQUs4dUMsUUFFTG5yQyxFQUFJRixrQkFDS3RLLElBQVFrTCxFQUFLRyxPQUN0QnhFLEVBQUt2RixRQUFRLHFCQUVia0osRUFBSUYsa0JBQ010SyxJQUFRa0wsRUFBS1EsT0FBU2xCLEVBQUlva0MsU0FDcEMvbkMsRUFBS3ZGLFFBQVEscUJBRWJrSixFQUFJRixrQkFDS3RLLElBQVFrTCxFQUFLYyxJQUN0Qm5GLEVBQUt2RixRQUFRLHVCQUVia0osRUFBSUYsa0JBQ0t0SyxJQUFRa0wsRUFBS2dCLE9BQ3RCckYsRUFBS3ZGLFFBQVEsbUJBRWJrSixFQUFJRixtQkFHRnRLLElBQVFrTCxFQUFLRyxPQUFTckwsSUFBUWtMLEVBQUtRLE9BQ2xDMUwsSUFBUWtMLEVBQUtnQixNQUFRMUIsRUFBSWtyQyxVQUM1Qjd1QyxFQUFLK3VDLE9BRUxwckMsRUFBSUYscUJBTVo0b0MsRUFBUTUxQyxVQUFVNDJDLGdCQUFrQixXQUNsQ3IwQyxLQUFLK0UsUUFBUTR0QyxJQUFJLFdBQVkzeUMsS0FBS3NFLFNBQVN6SyxLQUFLLGFBRTVDbUcsS0FBSytFLFFBQVFJLElBQUksYUFDZm5GLEtBQUtrSixVQUNQbEosS0FBSzgxQyxRQUdQOTFDLEtBQUt5QixRQUFRLGVBRWJ6QixLQUFLeUIsUUFBUSxjQUlqQjR4QyxFQUFRNTFDLFVBQVVxM0MsYUFBZSxTQUFVbnFDLEVBQUswcUMsR0FDOUMsR0FBSVcsSUFBVSxFQUNWaHZDLEVBQU9oSCxJQUlYLEtBQ0UySyxJQUFPQSxFQUFJMkMsUUFDZSxXQUF4QjNDLEVBQUkyQyxPQUFPMm9DLFVBQWlELGFBQXhCdHJDLEVBQUkyQyxPQUFPMm9DLFNBRm5ELENBUUEsR0FBS1osRUFJRSxHQUFJQSxFQUFVYSxZQUFjYixFQUFVYSxXQUFXOTZDLE9BQVMsRUFDL0QsSUFBSyxHQUFJMEMsR0FBSSxFQUFHQSxFQUFJdTNDLEVBQVVhLFdBQVc5NkMsT0FBUTBDLElBQUssQ0FDcEQsR0FBSTZHLEdBQU8wd0MsRUFBVWEsV0FBV3A0QyxFQUU1QjZHLEdBQUt1QyxXQUNQOHVDLEdBQVUsT0FHTFgsR0FBVWMsY0FBZ0JkLEVBQVVjLGFBQWEvNkMsT0FBUyxJQUNuRTQ2QyxHQUFVLE9BVlZBLElBQVUsQ0FjUkEsSUFDRmgyQyxLQUFLZ0YsWUFBWWlDLFFBQVEsU0FBVW8vQixHQUNqQ3IvQixFQUFLdkYsUUFBUSxvQkFDWGdCLEtBQU00akMsUUFVZGdOLEVBQVE1MUMsVUFBVWdFLFFBQVUsU0FBVXhILEVBQU1pQyxHQUMxQyxHQUFJazZDLEdBQWdCL0MsRUFBUWp6QyxVQUFVcUIsUUFDbEM0MEMsR0FDRk4sS0FBUSxVQUNSRCxNQUFTLFVBQ1QzUCxPQUFVLFlBQ1ZHLFNBQVksY0FPZCxJQUphMW5DLFNBQVQxQyxJQUNGQSxNQUdFakMsSUFBUW84QyxHQUFlLENBQ3pCLEdBQUlDLEdBQWlCRCxFQUFjcDhDLEdBQy9CczhDLEdBQ0ZubkMsV0FBVyxFQUNYblYsS0FBTUEsRUFDTmlDLEtBQU1BLEVBS1IsSUFGQWs2QyxFQUFjcjhDLEtBQUtpRyxLQUFNczJDLEVBQWdCQyxHQUVyQ0EsRUFBZW5uQyxVQUdqQixZQUZBbFQsRUFBS2tULFdBQVksR0FNckJnbkMsRUFBY3I4QyxLQUFLaUcsS0FBTS9GLEVBQU1pQyxJQUdqQ20zQyxFQUFRNTFDLFVBQVVtNEMsZUFBaUIsV0FDN0I1MUMsS0FBSytFLFFBQVFJLElBQUksY0FJakJuRixLQUFLa0osU0FDUGxKLEtBQUs4MUMsUUFFTDkxQyxLQUFLKzFDLFNBSVQxQyxFQUFRNTFDLFVBQVVzNEMsS0FBTyxXQUNuQi8xQyxLQUFLa0osVUFJVGxKLEtBQUt5QixRQUFRLGFBR2Y0eEMsRUFBUTUxQyxVQUFVcTRDLE1BQVEsV0FDbkI5MUMsS0FBS2tKLFVBSVZsSixLQUFLeUIsUUFBUSxhQUdmNHhDLEVBQVE1MUMsVUFBVXlMLE9BQVMsV0FDekIsTUFBT2xKLE1BQUtpSixXQUFXdWtDLFNBQVMsNEJBR2xDNkYsRUFBUTUxQyxVQUFVKzRDLFNBQVcsV0FDM0IsTUFBT3gyQyxNQUFLaUosV0FBV3VrQyxTQUFTLDZCQUdsQzZGLEVBQVE1MUMsVUFBVXNQLE1BQVEsU0FBVXRLLEdBRTlCekMsS0FBS3cyQyxhQUlUeDJDLEtBQUtpSixXQUFXaUIsU0FBUyw0QkFDekJsSyxLQUFLeUIsUUFBUSxjQUdmNHhDLEVBQVE1MUMsVUFBVWc1QyxPQUFTLFNBQVV2NkMsR0FDL0I4RCxLQUFLK0UsUUFBUUksSUFBSSxVQUFZOEgsT0FBTzlOLFNBQVdBLFFBQVE2eUMsTUFDekQ3eUMsUUFBUTZ5QyxLQUNOLHFKQU1RLE1BQVI5MUMsR0FBZ0MsSUFBaEJBLEVBQUtkLFNBQ3ZCYyxJQUFRLEdBR1YsSUFBSXlMLElBQVl6TCxFQUFLLEVBRXJCOEQsTUFBS3NFLFNBQVN6SyxLQUFLLFdBQVk4TixJQUdqQzByQyxFQUFRNTFDLFVBQVVnRixLQUFPLFdBQ25CekMsS0FBSytFLFFBQVFJLElBQUksVUFDakIvSSxVQUFVaEIsT0FBUyxHQUFLNlIsT0FBTzlOLFNBQVdBLFFBQVE2eUMsTUFDcEQ3eUMsUUFBUTZ5QyxLQUNOLG9JQUtKLElBQUl2dkMsS0FNSixPQUpBekMsTUFBS2dGLFlBQVlpQyxRQUFRLFNBQVVvL0IsR0FDakM1akMsRUFBTzRqQyxJQUdGNWpDLEdBR1Q0d0MsRUFBUTUxQyxVQUFVNkssSUFBTSxTQUFVcE0sR0FRaEMsR0FQSThELEtBQUsrRSxRQUFRSSxJQUFJLFVBQVk4SCxPQUFPOU4sU0FBV0EsUUFBUTZ5QyxNQUN6RDd5QyxRQUFRNnlDLEtBQ04sdUlBS1EsTUFBUjkxQyxHQUFnQyxJQUFoQkEsRUFBS2QsT0FDdkIsTUFBTzRFLE1BQUtzRSxTQUFTZ0UsS0FHdkIsSUFBSW91QyxHQUFTeDZDLEVBQUssRUFFZGdELEdBQUV1cEMsUUFBUWlPLEtBQ1pBLEVBQVN4M0MsRUFBRWxFLElBQUkwN0MsRUFBUSxTQUFVOThDLEdBQy9CLE1BQU9BLEdBQUl3SSxjQUlmcEMsS0FBS3NFLFNBQVNnRSxJQUFJb3VDLEdBQVFqMUMsUUFBUSxXQUdwQzR4QyxFQUFRNTFDLFVBQVVzTixRQUFVLFdBQzFCL0ssS0FBS2lKLFdBQVduRCxTQUVaOUYsS0FBS3NFLFNBQVMsR0FBR3F5QyxhQUNuQjMyQyxLQUFLc0UsU0FBUyxHQUFHcXlDLFlBQVksbUJBQW9CMzJDLEtBQUs0MEMsUUFHbEMsTUFBbEI1MEMsS0FBS28xQyxXQUNQcDFDLEtBQUtvMUMsVUFBVXdCLGFBQ2Y1MkMsS0FBS28xQyxVQUFZLE1BQ1JwMUMsS0FBS3NFLFNBQVMsR0FBR3V5QyxzQkFDMUI3MkMsS0FBS3NFLFNBQVMsR0FDWHV5QyxvQkFBb0Isa0JBQW1CNzJDLEtBQUs0MEMsUUFBUSxHQUN2RDUwQyxLQUFLc0UsU0FBUyxHQUNYdXlDLG9CQUFvQixrQkFBbUI3MkMsS0FBSzYwQyxRQUFRLEdBQ3ZENzBDLEtBQUtzRSxTQUFTLEdBQ1h1eUMsb0JBQW9CLGlCQUFrQjcyQyxLQUFLNjBDLFFBQVEsSUFHeEQ3MEMsS0FBSzQwQyxPQUFTLEtBQ2Q1MEMsS0FBSzYwQyxPQUFTLEtBRWQ3MEMsS0FBS3NFLFNBQVNvSixJQUFJLFlBQ2xCMU4sS0FBS3NFLFNBQVNjLEtBQUssV0FBWXBGLEtBQUtzRSxTQUFTN0IsS0FBSyxpQkFFbER6QyxLQUFLc0UsU0FBU3dHLFlBQVksNkJBQzFCOUssS0FBS3NFLFNBQVNjLEtBQUssY0FBZSxTQUNsQ3BGLEtBQUtzRSxTQUFTaWlDLFdBQVcsV0FFekJ2bUMsS0FBS2dGLFlBQVkrRixVQUNqQi9LLEtBQUsrTixVQUFVaEQsVUFDZi9LLEtBQUtpcUMsU0FBU2wvQixVQUNkL0ssS0FBS2dHLFFBQVErRSxVQUViL0ssS0FBS2dGLFlBQWMsS0FDbkJoRixLQUFLK04sVUFBWSxLQUNqQi9OLEtBQUtpcUMsU0FBVyxLQUNoQmpxQyxLQUFLZ0csUUFBVSxNQUdqQnF0QyxFQUFRNTFDLFVBQVV3SCxPQUFTO0FBQ3pCLEdBQUlnRSxHQUFhL0osRUFDZiwwSUFjRixPQVJBK0osR0FBVzdELEtBQUssTUFBT3BGLEtBQUsrRSxRQUFRSSxJQUFJLFFBRXhDbkYsS0FBS2lKLFdBQWFBLEVBRWxCakosS0FBS2lKLFdBQVdpQixTQUFTLHNCQUF3QmxLLEtBQUsrRSxRQUFRSSxJQUFJLFVBRWxFOEQsRUFBV3hHLEtBQUssVUFBV3pDLEtBQUtzRSxVQUV6QjJFLEdBR0ZvcUMsSUFHVC81QyxFQUFHTCxPQUFPLHdCQUNSLFVBQ0MsU0FBVWlHLEdBQ1gsUUFBUzQzQyxHQUFnQkMsRUFBT0MsRUFBTUMsR0FDcEMsR0FBSUMsR0FBNEJDLEVBQW5CQyxJQUViRixHQUFVaDRDLEVBQUUycUMsS0FBS2tOLEVBQU0zeEMsS0FBSyxVQUV4Qjh4QyxJQUNGQSxFQUFVLEdBQUtBLEVBRWZoNEMsRUFBRWc0QyxFQUFRbjhDLE1BQU0sUUFBUXNNLEtBQUssV0FFTSxJQUE3QnJILEtBQUtuRSxRQUFRLGFBQ2Z1N0MsRUFBYS82QyxLQUFLMkQsU0FLeEJrM0MsRUFBVWg0QyxFQUFFMnFDLEtBQUttTixFQUFLNXhDLEtBQUssVUFFdkI4eEMsSUFDRkEsRUFBVSxHQUFLQSxFQUVmaDRDLEVBQUVnNEMsRUFBUW44QyxNQUFNLFFBQVFzTSxLQUFLLFdBRU0sSUFBN0JySCxLQUFLbkUsUUFBUSxjQUNmczdDLEVBQVVGLEVBQVFqM0MsTUFFSCxNQUFYbTNDLEdBQ0ZDLEVBQWEvNkMsS0FBSzg2QyxPQU0xQkosRUFBTTN4QyxLQUFLLFFBQVNneUMsRUFBYXg3QyxLQUFLLE1BR3hDLE9BQ0VrN0MsZUFBZ0JBLEtBSXBCeDlDLEVBQUdMLE9BQU8sK0JBQ1IsU0FDQSxXQUNDLFNBQVVpRyxFQUFHbTRDLEdBRWQsUUFBU0MsR0FBbUJDLEdBQzFCLE1BQU8sTUFHVCxRQUFTakcsTUE2Q1QsTUEzQ0FBLEdBQWE3ekMsVUFBVXdILE9BQVMsU0FBVXNKLEdBQ3hDLEdBQUl0RixHQUFhc0YsRUFBVXhVLEtBQUtpRyxNQUU1Qm14QyxFQUFvQm54QyxLQUFLK0UsUUFBUUksSUFBSSxzQkFBd0IsRUFFN0RqRyxHQUFFMHBDLFdBQVd1SSxLQUNmQSxFQUFvQkEsRUFBa0JueEMsS0FBS3NFLFVBRzdDLElBQUlrekMsR0FBc0J4M0MsS0FBSytFLFFBQVFJLElBQUkseUJBRzNDLElBRkFxeUMsRUFBc0JBLEdBQXVCRixFQUV6Q25HLEVBQWtCdDFDLFFBQVEsWUFBYSxFQUFJLENBQzdDczFDLEVBQW9CQSxFQUFrQjMxQyxRQUFRLFFBQVMsR0FFdkQsSUFBSWk4QyxHQUFjRCxDQUVsQkEsR0FBc0IsU0FBVUQsR0FDOUIsR0FBSUosR0FBVU0sRUFBWUYsRUFFMUIsT0FBZSxPQUFYSixFQUVLQSxFQUFVLElBQU1JLEVBR2xCQSxHQUlYLEdBQUluRyxHQUFlcHhDLEtBQUsrRSxRQUFRSSxJQUFJLG1CQVdwQyxPQVRJakcsR0FBRTBwQyxXQUFXd0ksS0FDZkEsRUFBZUEsRUFBYXB4QyxLQUFLc0UsV0FHbkMreUMsRUFBWVAsZUFBZTd0QyxFQUFZakosS0FBS3NFLFNBQVVrekMsR0FFdER2dUMsRUFBV3NILElBQUk2Z0MsR0FDZm5vQyxFQUFXaUIsU0FBU2luQyxHQUVibG9DLEdBR0Zxb0MsSUFHVGg0QyxFQUFHTCxPQUFPLDhCQUNSLFNBQ0EsV0FDQyxTQUFVaUcsRUFBR200QyxHQUVkLFFBQVNLLEdBQWtCSCxHQUN6QixNQUFPLE1BR1QsUUFBU3ZHLE1BNkNULE1BM0NBQSxHQUFZdnpDLFVBQVV3SCxPQUFTLFNBQVVzSixHQUN2QyxHQUFJaEksR0FBWWdJLEVBQVV4VSxLQUFLaUcsTUFFM0I2d0MsRUFBbUI3d0MsS0FBSytFLFFBQVFJLElBQUkscUJBQXVCLEVBRTNEakcsR0FBRTBwQyxXQUFXaUksS0FDZkEsRUFBbUJBLEVBQWlCN3dDLEtBQUtzRSxVQUczQyxJQUFJcXpDLEdBQXFCMzNDLEtBQUsrRSxRQUFRSSxJQUFJLHdCQUcxQyxJQUZBd3lDLEVBQXFCQSxHQUFzQkQsRUFFdkM3RyxFQUFpQmgxQyxRQUFRLFlBQWEsRUFBSSxDQUM1Q2cxQyxFQUFtQkEsRUFBaUJyMUMsUUFBUSxRQUFTLEdBRXJELElBQUlpOEMsR0FBY0UsQ0FFbEJBLEdBQXFCLFNBQVVKLEdBQzdCLEdBQUlKLEdBQVVNLEVBQVlGLEVBRTFCLE9BQWUsT0FBWEosRUFFS0EsRUFBVSxJQUFNSSxFQUdsQkEsR0FJWCxHQUFJekcsR0FBYzl3QyxLQUFLK0UsUUFBUUksSUFBSSxrQkFXbkMsT0FUSWpHLEdBQUUwcEMsV0FBV2tJLEtBQ2ZBLEVBQWNBLEVBQVk5d0MsS0FBS3NFLFdBR2pDK3lDLEVBQVlQLGVBQWV2d0MsRUFBV3ZHLEtBQUtzRSxTQUFVcXpDLEdBRXJEcHhDLEVBQVVnSyxJQUFJdWdDLEdBQ2R2cUMsRUFBVTJELFNBQVMybUMsR0FFWnRxQyxHQUdGeXFDLElBR1QxM0MsRUFBR0wsT0FBTyxnQ0FDUixVQUNDLFNBQVVpRyxHQUNYLFFBQVNveEMsR0FBZS9oQyxFQUFXakssRUFBVVMsR0FDdkNBLEVBQVFJLElBQUksVUFBWThILE9BQU85TixTQUFXQSxRQUFRNnlDLE1BQ3BEN3lDLFFBQVE2eUMsS0FDTiwyVEFRSmh5QyxLQUFLcXdDLGNBQWdCdHJDLEVBQVFJLElBQUksaUJBQ2pDbkYsS0FBSzQzQyxnQkFBaUIsRUFFdEJycEMsRUFBVXhVLEtBQUtpRyxLQUFNc0UsRUFBVVMsR0F1QmpDLE1BcEJBdXJDLEdBQWM3eUMsVUFBVXdKLFFBQVUsU0FBVXNILEVBQVdqUSxHQUNyRCxHQUFJMEksR0FBT2hILElBRVgsT0FBSUEsTUFBSzQzQyxtQkFDUHJwQyxHQUFVeFUsS0FBS2lHLEtBQU0xQixPQUt2QjBCLE1BQUtxd0MsY0FBY3QyQyxLQUFLLEtBQU1pRyxLQUFLc0UsU0FBVSxTQUFVN0IsR0FDckR1RSxFQUFLNHdDLGdCQUFpQixFQUVqQjE0QyxFQUFFdXBDLFFBQVFobUMsS0FDYkEsR0FBUUEsSUFHVm5FLEVBQVNtRSxNQUlONnRDLElBR1RoM0MsRUFBR0wsT0FBTyw0QkFDUixVQUNDLFNBQVVpRyxHQUNYLFFBQVMyNEMsR0FBV3RwQyxFQUFXakssRUFBVVMsR0FDdkMvRSxLQUFLODNDLGdCQUNMOTNDLEtBQUsrM0MsZ0JBQWtCaHpDLEVBQVFJLElBQUksbUJBQXFCLElBRTFCLFdBQTFCYixFQUFTekssS0FBSyxTQUNaa0wsRUFBUUksSUFBSSxVQUFZaEcsU0FBV0EsUUFBUTZ5QyxNQUM3Qzd5QyxRQUFRNnlDLEtBQ04sZ0tBT056akMsRUFBVXhVLEtBQUtpRyxLQUFNc0UsRUFBVVMsR0E0R2pDLE1BekdBOHlDLEdBQVVwNkMsVUFBVXdKLFFBQVUsU0FBVXlILEVBQUdwUSxHQUN6QyxRQUFTMDVDLEdBQWF2MUMsRUFBTTBFLEdBQzFCLEdBQUlELEtBYUosT0FYSXpFLEdBQUt5RSxVQUFZaEksRUFBRXFJLFFBQVE5RSxFQUFLdEUsR0FBSWdKLE1BQWlCLEdBQ3ZEMUUsRUFBS3lFLFVBQVcsRUFDaEJBLEVBQVM3SyxLQUFLb0csSUFFZEEsRUFBS3lFLFVBQVcsRUFHZHpFLEVBQUt3RCxVQUNQaUIsRUFBUzdLLEtBQUtFLE1BQU0ySyxFQUFVOHdDLEVBQVl2MUMsRUFBS3dELFNBQVVrQixJQUdwREQsRUFLVCxJQUFLLEdBRkRBLE1BRUs5RixFQUFJLEVBQUdBLEVBQUlwQixLQUFLODNDLGFBQWExOEMsT0FBUWdHLElBQUssQ0FDakQsR0FBSXFCLEdBQU96QyxLQUFLODNDLGFBQWExMkMsRUFFN0I4RixHQUFTN0ssS0FBS0UsTUFDWjJLLEVBQ0E4d0MsRUFDRXYxQyxFQUNBekMsS0FBS3NFLFNBQVNnRSxNQUFNdk4sTUFDbEJpRixLQUFLKzNDLG1CQU1iejVDLEVBQVM0SSxJQUdYMndDLEVBQVVwNkMsVUFBVTBvQyxPQUFTLFNBQVV6M0IsRUFBR2pNLEdBQ3hDLEdBQUt6QyxLQUFLK0UsUUFBUUksSUFBSSxZQVNmLENBQ0wsR0FBSXhJLEdBQVFxRCxLQUFLc0UsU0FBU2dFLEtBQzFCM0wsSUFBU3FELEtBQUsrM0MsZ0JBQWtCdDFDLEVBQUt0RSxHQUVyQzZCLEtBQUtzRSxTQUFTZ0UsSUFBSTNMLEdBQ2xCcUQsS0FBS3NFLFNBQVM3QyxRQUFRLGNBYnRCekIsTUFBS2lILFFBQVEsU0FBVWd4QyxHQUNyQi80QyxFQUFFbEUsSUFBSWk5QyxFQUFTLFNBQVV4MUMsR0FDdkJBLEVBQUt5RSxVQUFXLE1BSXBCbEgsS0FBS3NFLFNBQVNnRSxJQUFJN0YsRUFBS3RFLElBQ3ZCNkIsS0FBS3NFLFNBQVM3QyxRQUFRLFdBVTFCbzJDLEVBQVVwNkMsVUFBVTZvQyxTQUFXLFNBQVU1M0IsRUFBR2pNLEdBQzFDLEdBQUl1RSxHQUFPaEgsSUFFWHlDLEdBQUt5RSxVQUFXLEVBRWhCbEgsS0FBS2lILFFBQVEsU0FBVWd4QyxHQUdyQixJQUFLLEdBRkRDLE1BRUs5MkMsRUFBSSxFQUFHQSxFQUFJNjJDLEVBQVE3OEMsT0FBUWdHLElBQUssQ0FDdkMsR0FBSStFLEdBQU84eEMsRUFBUTcyQyxFQUVmcUIsR0FBS3RFLElBQU1nSSxFQUFLaEksSUFJcEIrNUMsRUFBTzc3QyxLQUFLOEosRUFBS2hJLElBR25CNkksRUFBSzFDLFNBQVNnRSxJQUFJNHZDLEVBQU90OEMsS0FBS29MLEVBQUsrd0Msa0JBQ25DL3dDLEVBQUsxQyxTQUFTN0MsUUFBUSxhQUkxQm8yQyxFQUFVcDZDLFVBQVV1b0MsTUFBUSxTQUFVdDNCLEVBQUdoTixFQUFRcEQsR0FHL0MsSUFBSyxHQUZEMEgsTUFFSzVFLEVBQUksRUFBR0EsRUFBSXBCLEtBQUs4M0MsYUFBYTE4QyxPQUFRZ0csSUFBSyxDQUNqRCxHQUFJcUIsR0FBT3pDLEtBQUs4M0MsYUFBYTEyQyxHQUV6Qm9sQyxFQUFVeG1DLEtBQUt3bUMsUUFBUTlrQyxFQUFRZSxFQUVuQixRQUFaK2pDLEdBQ0Z4Z0MsRUFBUTNKLEtBQUttcUMsR0FJakJsb0MsR0FDRTBILFFBQVNBLEtBSWI2eEMsRUFBVXA2QyxVQUFVZ3BDLFdBQWEsU0FBVS8zQixFQUFHM0ksR0FDNUMsR0FBSWhCLEdBQVU3RixFQUFFbEUsSUFBSStLLEVBQVUsU0FBVUssR0FDdEMsTUFBT2xILEdBQUV1RCxLQUFLMkQsRUFBUSxHQUFJLFNBRzVCcEcsTUFBSzgzQyxhQUFhejdDLEtBQUtFLE1BQU15RCxLQUFLODNDLGFBQWMveUMsSUFHM0M4eUMsSUFHVHYrQyxFQUFHTCxPQUFPLDBCQUNSLFVBQ0MsU0FBVWlHLEdBQ1gsUUFBU2k1QyxHQUFZblIsR0FDbkIsUUFBU29SLEdBQWdCMTJDLEVBQVFlLEdBQy9CLEdBQUkyQixHQUFRbEYsRUFBRStSLFFBQU8sS0FBVXhPLEVBRS9CLElBQW1CLE1BQWZmLEVBQU80TyxNQUF3QyxLQUF4QnBSLEVBQUUycUMsS0FBS25vQyxFQUFPNE8sTUFDdkMsTUFBT2xNLEVBR1QsSUFBSTNCLEVBQUt3RCxTQUFVLENBQ2pCLElBQUssR0FBSTBDLEdBQUlsRyxFQUFLd0QsU0FBUzdLLE9BQVMsRUFBR3VOLEdBQUssRUFBR0EsSUFBSyxDQUNsRCxHQUFJQyxHQUFRbkcsRUFBS3dELFNBQVMwQyxHQUl0QjB2QyxFQUFZclIsRUFBUXRsQyxFQUFPNE8sS0FBTTFILEVBQU1oQixLQUFNZ0IsRUFHNUN5dkMsSUFDSGowQyxFQUFNNkIsU0FBU3RLLE9BQU9nTixFQUFHLEdBSTdCLEdBQUl2RSxFQUFNNkIsU0FBUzdLLE9BQVMsRUFDMUIsTUFBT2dKLEdBSVgsTUFBSTRpQyxHQUFRdGxDLEVBQU80TyxLQUFNN04sRUFBS21GLEtBQU1uRixHQUMzQjJCLEVBR0YsS0FHVCxNQUFPZzBDLEdBR1QsTUFBT0QsS0FHVDcrQyxFQUFHTCxPQUFPLDBCQUVQLFdBQ0QsUUFBU2szQyxHQUFPNWhDLEVBQVdqSyxFQUFVUyxHQUMvQkEsRUFBUUksSUFBSSxVQUFZOEgsT0FBTzlOLFNBQVdBLFFBQVE2eUMsTUFDcEQ3eUMsUUFBUTZ5QyxLQUNOLHNNQU9KempDLEVBQVV4VSxLQUFLaUcsS0FBTXNFLEVBQVVTLEdBV2pDLE1BUkFvckMsR0FBTTF5QyxVQUFVdW9DLE1BQVEsU0FBVXQzQixFQUFHaE4sRUFBUXBELEdBQzNDb0QsRUFBT3BELFNBQVdBLENBRWxCLElBQUkwbkMsR0FBUWhtQyxLQUFLK0UsUUFBUUksSUFBSSxRQUU3QjZnQyxHQUFNanNDLEtBQUssS0FBTTJILElBR1p5dUMsSUFHVDcyQyxFQUFHTCxPQUFPLHNDQUVQLFdBQ0QsUUFBU3EvQyxHQUFpQi9wQyxFQUFXakssRUFBVVMsR0FDN0N3SixFQUFVeFUsS0FBS2lHLEtBQU1zRSxFQUFVUyxHQVlqQyxNQVRBdXpDLEdBQWdCNzZDLFVBQVU2SSxTQUN4QixTQUFVaUksRUFBV2hJLEVBQVcwQyxHQUNoQyxHQUFJMGpDLEdBQXFCMWpDLEVBQVdwRCxLQUFLLG9CQUN6QzhtQyxHQUFtQjluQyxPQUFPMEIsR0FFMUJBLEVBQVUyRCxTQUFTLDJCQUNuQmpCLEVBQVdpQixTQUFTLDZCQUdmb3VDLElBR1RoL0MsRUFBR0wsT0FBTyxzQ0FFUCxXQUNELFFBQVNzL0MsTUFpQ1QsTUEvQkFBLEdBQWdCOTZDLFVBQVU0RSxLQUFPLFNBQVVrTSxFQUFXdkYsRUFBV0MsR0FDL0RzRixFQUFVeFUsS0FBS2lHLEtBQU1nSixFQUFXQyxFQUVoQyxJQUFJdXZDLElBQ0osT0FDQSxTQUNBLFFBQ0EsV0FDQSxRQUNBLFVBQ0EsV0FDQSxRQUNBLFVBQ0EsUUFDQSxXQUNBLFlBQ0EsYUFDQSxhQUNBLFlBQ0EsWUFDQSxVQUNBLFNBQ0EsV0FDQSxhQUdBeDRDLE1BQUt1RyxVQUFVaEYsR0FBR2kzQyxFQUFjNThDLEtBQUssS0FBTSxTQUFVK08sR0FDbkRBLEVBQUlELHFCQUlENnRDLElBR1RqL0MsRUFBR0wsT0FBTyx1Q0FFUCxXQUNELFFBQVNzL0MsTUFpQ1QsTUEvQkFBLEdBQWdCOTZDLFVBQVU0RSxLQUFPLFNBQVVrTSxFQUFXdkYsRUFBV0MsR0FDL0RzRixFQUFVeFUsS0FBS2lHLEtBQU1nSixFQUFXQyxFQUVoQyxJQUFJdXZDLElBQ0YsT0FDQSxTQUNBLFFBQ0EsV0FDQSxRQUNBLFVBQ0EsV0FDQSxRQUNBLFVBQ0EsUUFDQSxXQUNBLFlBQ0EsYUFDQSxhQUNBLFlBQ0EsWUFDQSxVQUNBLFNBQ0EsV0FDQSxhQUdGeDRDLE1BQUt3TSxXQUFXakwsR0FBR2kzQyxFQUFjNThDLEtBQUssS0FBTSxTQUFVK08sR0FDcERBLEVBQUlELHFCQUlENnRDLElBV1IsU0FBVXYvQyxHQUNtQixrQkFBZE0sR0FBR0wsUUFBeUJLLEVBQUdMLE9BQU9DLElBRTlDSSxFQUFHTCxPQUFPLHFCQUFxQixVQUFXRCxHQUNoQixnQkFBWkcsU0FFZCtFLE9BQU8vRSxRQUFVSCxFQUdqQkEsRUFBUUssSUFFZCxTQUFVNkYsR0F5RVIsUUFBU3U1QyxHQUFRajNDLEdBQ2IsR0FBSWszQyxHQUFhbDNDLEdBQVN5TCxPQUFPekwsTUFDN0J0RixFQUFhVCxFQUFNMUIsS0FBS3FDLFVBQVcsR0FDbkN1OEMsRUFBYSxFQUNiQyxFQUFhLEVBQ2J2dUMsRUFBYSxFQUNid3VDLEVBQWEsRUFDYkMsRUFBYSxFQUNiQyxFQUFhLENBOEJqQixJQTdCQXYzQyxFQUFRdEMsRUFBRXNDLE1BQU13M0MsSUFBSU4sR0FDcEJsM0MsRUFBTXlPLEtBQU8sYUFHUixVQUFpQnlvQyxLQUFhcnVDLEVBQVNxdUMsRUFBU08sUUFBUyxHQUN6RCxjQUFpQlAsS0FBYXJ1QyxFQUFTcXVDLEVBQVNRLFlBQ2hELGVBQWlCUixLQUFhcnVDLEVBQVNxdUMsRUFBU1MsYUFDaEQsZUFBaUJULEtBQWFFLEVBQVNGLEVBQVNVLGFBQWMsR0FHOUQsUUFBVVYsSUFBWUEsRUFBU1csT0FBU1gsRUFBU1ksa0JBQ2xEVixFQUFTdnVDLEdBQVMsRUFDbEJBLEVBQVMsR0FJYnN1QyxFQUFtQixJQUFYdHVDLEVBQWV1dUMsRUFBU3Z1QyxFQUczQixVQUFZcXVDLEtBQ2JydUMsRUFBU3F1QyxFQUFTcnVDLFFBQVMsRUFDM0JzdUMsRUFBU3R1QyxHQUVSLFVBQVlxdUMsS0FDYkUsRUFBU0YsRUFBU0UsT0FDRixJQUFYdnVDLElBQWlCc3VDLEVBQVNDLEdBQVMsSUFJNUIsSUFBWHZ1QyxHQUEyQixJQUFYdXVDLEVBQXJCLENBT0EsR0FBNEIsSUFBdkJGLEVBQVNhLFVBQWtCLENBQzVCLEdBQUlDLEdBQWF0NkMsRUFBRXVELEtBQUt6QyxLQUFNLHlCQUM5QjI0QyxJQUFVYSxFQUNWbnZDLEdBQVVtdkMsRUFDVlosR0FBVVksTUFDUCxJQUE0QixJQUF2QmQsRUFBU2EsVUFBa0IsQ0FDbkMsR0FBSUUsR0FBYXY2QyxFQUFFdUQsS0FBS3pDLEtBQU0seUJBQzlCMjRDLElBQVVjLEVBQ1ZwdkMsR0FBVW92QyxFQUNWYixHQUFVYSxFQTZCZCxHQXpCQVosRUFBVzUyQyxLQUFLeTNDLElBQUt6M0MsS0FBSzAzQyxJQUFJdHZDLEdBQVNwSSxLQUFLMDNDLElBQUlmLE1BRTFDZ0IsR0FBZWYsRUFBV2UsS0FDNUJBLEVBQWNmLEVBR1RnQixFQUFzQm5CLEVBQVVHLEtBQ2pDZSxHQUFlLEtBS2xCQyxFQUFzQm5CLEVBQVVHLEtBRWpDRixHQUFVLEdBQ1ZDLEdBQVUsR0FDVnZ1QyxHQUFVLElBSWRzdUMsRUFBUzEyQyxLQUFNMDJDLEdBQVUsRUFBSSxRQUFVLFFBQVNBLEVBQVNpQixHQUN6RGhCLEVBQVMzMkMsS0FBTTIyQyxHQUFVLEVBQUksUUFBVSxRQUFTQSxFQUFTZ0IsR0FDekR2dkMsRUFBU3BJLEtBQU1vSSxHQUFVLEVBQUksUUFBVSxRQUFTQSxFQUFTdXZDLEdBR3BERSxFQUFRQyxTQUFTQyxpQkFBbUJoNkMsS0FBS2k2QyxzQkFBd0IsQ0FDbEUsR0FBSUMsR0FBZWw2QyxLQUFLaTZDLHVCQUN4Qm5CLEdBQVV0M0MsRUFBTTI0QyxRQUFVRCxFQUFhcE0sS0FDdkNpTCxFQUFVdjNDLEVBQU00NEMsUUFBVUYsRUFBYXR3QyxJQXdCM0MsTUFwQkFwSSxHQUFNbzNDLE9BQVNBLEVBQ2ZwM0MsRUFBTTZJLE9BQVNBLEVBQ2Y3SSxFQUFNNjRDLFlBQWNULEVBQ3BCcDRDLEVBQU1zM0MsUUFBVUEsRUFDaEJ0M0MsRUFBTXUzQyxRQUFVQSxFQUloQnYzQyxFQUFNKzNDLFVBQVksRUFHbEJyOUMsRUFBS3NFLFFBQVFnQixFQUFPbTNDLEVBQU9DLEVBQVF2dUMsR0FNL0Jpd0MsR0FBMEJyUixhQUFhcVIsR0FDM0NBLEVBQXlCeDdDLFdBQVd5N0MsRUFBaUIsTUFFN0NyN0MsRUFBRXNDLE1BQU1nNUMsVUFBWXQ3QyxFQUFFc0MsTUFBTWk1QyxRQUFRbCtDLE1BQU15RCxLQUFNOUQsSUFHNUQsUUFBU3ErQyxLQUNMWCxFQUFjLEtBR2xCLFFBQVNDLEdBQXNCbkIsRUFBVUcsR0FRckMsTUFBT2lCLEdBQVFDLFNBQVNXLGlCQUFxQyxlQUFsQmhDLEVBQVN6b0MsTUFBeUI0b0MsRUFBVyxNQUFRLEVBcE1wRyxHQUlJeUIsR0FBd0JWLEVBSnhCZSxHQUFVLFFBQVMsYUFBYyxpQkFBa0IsdUJBQ25EQyxFQUFXLFdBQWE3eUMsV0FBWUEsU0FBU2dJLGNBQWdCLEdBQ2hELFVBQVksYUFBYyxpQkFBa0IsdUJBQ3pEdFUsRUFBU2dGLE1BQU1oRCxVQUFVaEMsS0FHN0IsSUFBS3lELEVBQUVzQyxNQUFNcTVDLFNBQ1QsSUFBTSxHQUFJbGdELEdBQUlnZ0QsRUFBTXYvQyxPQUFRVCxHQUN4QnVFLEVBQUVzQyxNQUFNcTVDLFNBQVVGLElBQVFoZ0QsSUFBT3VFLEVBQUVzQyxNQUFNczVDLFVBSWpELElBQUloQixHQUFVNTZDLEVBQUVzQyxNQUFNczRDLFFBQVEzdkMsWUFDMUI0d0MsUUFBUyxTQUVUQyxNQUFPLFdBQ0gsR0FBS2g3QyxLQUFLMDFDLGlCQUNOLElBQU0sR0FBSS82QyxHQUFJaWdELEVBQU94L0MsT0FBUVQsR0FDekJxRixLQUFLMDFDLGlCQUFrQmtGLElBQVNqZ0QsR0FBSTg5QyxHQUFTLE9BR2pEejRDLE1BQUtpN0MsYUFBZXhDLENBR3hCdjVDLEdBQUV1RCxLQUFLekMsS0FBTSx5QkFBMEI4NUMsRUFBUW9CLGNBQWNsN0MsT0FDN0RkLEVBQUV1RCxLQUFLekMsS0FBTSx5QkFBMEI4NUMsRUFBUXFCLGNBQWNuN0MsUUFHakVvN0MsU0FBVSxXQUNOLEdBQUtwN0MsS0FBSzYyQyxvQkFDTixJQUFNLEdBQUlsOEMsR0FBSWlnRCxFQUFPeC9DLE9BQVFULEdBQ3pCcUYsS0FBSzYyQyxvQkFBcUIrRCxJQUFTamdELEdBQUk4OUMsR0FBUyxPQUdwRHo0QyxNQUFLaTdDLGFBQWUsSUFHeEIvN0MsR0FBRXFuQyxXQUFXdm1DLEtBQU0sMEJBQ25CZCxFQUFFcW5DLFdBQVd2bUMsS0FBTSwyQkFHdkJrN0MsY0FBZSxTQUFTRyxHQUNwQixHQUFJQyxHQUFRcDhDLEVBQUVtOEMsR0FDVkUsRUFBVUQsRUFBTSxnQkFBa0JwOEMsR0FBRTNGLEdBQUssZUFBaUIsV0FJOUQsT0FIS2dpRCxHQUFRbmdELFNBQ1RtZ0QsRUFBVXI4QyxFQUFFLFNBRVRzOEMsU0FBU0QsRUFBUWhyQyxJQUFJLFlBQWEsS0FBT2lyQyxTQUFTRixFQUFNL3FDLElBQUksWUFBYSxLQUFPLElBRzNGNHFDLGNBQWUsU0FBU0UsR0FDcEIsTUFBT244QyxHQUFFbThDLEdBQU03d0MsVUFHbkJ1dkMsVUFDSVcsaUJBQWlCLEVBQ2pCVixpQkFBaUIsR0FJekI5NkMsR0FBRTNGLEdBQUcwWCxRQUNEOUcsV0FBWSxTQUFTNVEsR0FDakIsTUFBT0EsR0FBS3lHLEtBQUtxQyxLQUFLLGFBQWM5SSxHQUFNeUcsS0FBS3lCLFFBQVEsZUFHM0RnNkMsYUFBYyxTQUFTbGlELEdBQ25CLE1BQU95RyxNQUFLMDdDLE9BQU8sYUFBY25pRCxRQXVJN0NELEVBQUdMLE9BQU8sa0JBQ1IsU0FDQSxvQkFFQSxpQkFDQSxzQkFDQyxTQUFVaUcsRUFBR3dQLEVBQUcya0MsRUFBU3JELEdBQzFCLEdBQW9CLE1BQWhCOXdDLEVBQUUzRixHQUFHQyxRQUFpQixDQUV4QixHQUFJbWlELElBQWUsT0FBUSxRQUFTLFVBRXBDejhDLEdBQUUzRixHQUFHQyxRQUFVLFNBQVV1TCxHQUd2QixHQUZBQSxFQUFVQSxNQUVhLGdCQUFaQSxHQU9ULE1BTkEvRSxNQUFLcUgsS0FBSyxXQUNSLEdBQUl1MEMsR0FBa0IxOEMsRUFBRStSLFFBQU8sS0FBVWxNLEVBRTFCLElBQUlzdUMsR0FBUW4wQyxFQUFFYyxNQUFPNDdDLEtBRy9CNTdDLElBQ0YsSUFBdUIsZ0JBQVorRSxHQUFzQixDQUN0QyxHQUFJdkcsR0FDQXRDLEVBQU91RSxNQUFNaEQsVUFBVWhDLE1BQU0xQixLQUFLcUMsVUFBVyxFQWdCakQsT0FkQTRELE1BQUtxSCxLQUFLLFdBQ1IsR0FBSXcwQyxHQUFXMzhDLEVBQUVjLE1BQU15QyxLQUFLLFVBRVosT0FBWm81QyxHQUFvQjV1QyxPQUFPOU4sU0FBV0EsUUFBUUMsT0FDaERELFFBQVFDLE1BQ04sZ0JBQW1CMkYsRUFBVSxpRUFLakN2RyxFQUFNcTlDLEVBQVM5MkMsR0FBU3hJLE1BQU1zL0MsRUFBVTMvQyxLQUl0Q2dELEVBQUVxSSxRQUFReEMsRUFBUzQyQyxJQUFlLEVBQzdCMzdDLEtBR0Z4QixFQUVQLEtBQU0sSUFBSXZCLE9BQU0sa0NBQW9DOEgsSUFTMUQsTUFKNkIsT0FBekI3RixFQUFFM0YsR0FBR0MsUUFBUXV0QyxXQUNmN25DLEVBQUUzRixHQUFHQyxRQUFRdXRDLFNBQVdpSixHQUduQnFELEtBS0xwNkMsT0FBUUssRUFBR0wsT0FDWEcsUUFBU0UsRUFBR0YsWUFNVkksRUFBVUYsRUFBR0YsUUFBUSxpQkFRekIsT0FIQUMsR0FBT0UsR0FBR0MsUUFBUU4sSUFBTUksRUFHakJFIiwiZmlsZSI6InNlbGVjdDIuZnVsbC1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogU2VsZWN0MiA0LjAuM1xuICogaHR0cHM6Ly9zZWxlY3QyLmdpdGh1Yi5pb1xuICpcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL3NlbGVjdDIvc2VsZWN0Mi9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBOb2RlL0NvbW1vbkpTXG4gICAgZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzXG4gICAgZmFjdG9yeShqUXVlcnkpO1xuICB9XG59KGZ1bmN0aW9uIChqUXVlcnkpIHtcbiAgLy8gVGhpcyBpcyBuZWVkZWQgc28gd2UgY2FuIGNhdGNoIHRoZSBBTUQgbG9hZGVyIGNvbmZpZ3VyYXRpb24gYW5kIHVzZSBpdFxuICAvLyBUaGUgaW5uZXIgZmlsZSBzaG91bGQgYmUgd3JhcHBlZCAoYnkgYGJhbm5lci5zdGFydC5qc2ApIGluIGEgZnVuY3Rpb24gdGhhdFxuICAvLyByZXR1cm5zIHRoZSBBTUQgbG9hZGVyIHJlZmVyZW5jZXMuXG4gIHZhciBTMiA9XG4oZnVuY3Rpb24gKCkge1xuICAvLyBSZXN0b3JlIHRoZSBTZWxlY3QyIEFNRCBsb2FkZXIgc28gaXQgY2FuIGJlIHVzZWRcbiAgLy8gTmVlZGVkIG1vc3RseSBpbiB0aGUgbGFuZ3VhZ2UgZmlsZXMsIHdoZXJlIHRoZSBsb2FkZXIgaXMgbm90IGluc2VydGVkXG4gIGlmIChqUXVlcnkgJiYgalF1ZXJ5LmZuICYmIGpRdWVyeS5mbi5zZWxlY3QyICYmIGpRdWVyeS5mbi5zZWxlY3QyLmFtZCkge1xuICAgIHZhciBTMiA9IGpRdWVyeS5mbi5zZWxlY3QyLmFtZDtcbiAgfVxudmFyIFMyOyhmdW5jdGlvbiAoKSB7IGlmICghUzIgfHwgIVMyLnJlcXVpcmVqcykge1xuaWYgKCFTMikgeyBTMiA9IHt9OyB9IGVsc2UgeyByZXF1aXJlID0gUzI7IH1cbi8qKlxuICogQGxpY2Vuc2UgYWxtb25kIDAuMy4xIENvcHlyaWdodCAoYykgMjAxMS0yMDE0LCBUaGUgRG9qbyBGb3VuZGF0aW9uIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBBdmFpbGFibGUgdmlhIHRoZSBNSVQgb3IgbmV3IEJTRCBsaWNlbnNlLlxuICogc2VlOiBodHRwOi8vZ2l0aHViLmNvbS9qcmJ1cmtlL2FsbW9uZCBmb3IgZGV0YWlsc1xuICovXG4vL0dvaW5nIHNsb3BweSB0byBhdm9pZCAndXNlIHN0cmljdCcgc3RyaW5nIGNvc3QsIGJ1dCBzdHJpY3QgcHJhY3RpY2VzIHNob3VsZFxuLy9iZSBmb2xsb3dlZC5cbi8qanNsaW50IHNsb3BweTogdHJ1ZSAqL1xuLypnbG9iYWwgc2V0VGltZW91dDogZmFsc2UgKi9cblxudmFyIHJlcXVpcmVqcywgcmVxdWlyZSwgZGVmaW5lO1xuKGZ1bmN0aW9uICh1bmRlZikge1xuICAgIHZhciBtYWluLCByZXEsIG1ha2VNYXAsIGhhbmRsZXJzLFxuICAgICAgICBkZWZpbmVkID0ge30sXG4gICAgICAgIHdhaXRpbmcgPSB7fSxcbiAgICAgICAgY29uZmlnID0ge30sXG4gICAgICAgIGRlZmluaW5nID0ge30sXG4gICAgICAgIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICAgIGFwcyA9IFtdLnNsaWNlLFxuICAgICAgICBqc1N1ZmZpeFJlZ0V4cCA9IC9cXC5qcyQvO1xuXG4gICAgZnVuY3Rpb24gaGFzUHJvcChvYmosIHByb3ApIHtcbiAgICAgICAgcmV0dXJuIGhhc093bi5jYWxsKG9iaiwgcHJvcCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSByZWxhdGl2ZSBtb2R1bGUgbmFtZSwgbGlrZSAuL3NvbWV0aGluZywgbm9ybWFsaXplIGl0IHRvXG4gICAgICogYSByZWFsIG5hbWUgdGhhdCBjYW4gYmUgbWFwcGVkIHRvIGEgcGF0aC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgcmVsYXRpdmUgbmFtZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBiYXNlTmFtZSBhIHJlYWwgbmFtZSB0aGF0IHRoZSBuYW1lIGFyZyBpcyByZWxhdGl2ZVxuICAgICAqIHRvLlxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IG5vcm1hbGl6ZWQgbmFtZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCBiYXNlTmFtZSkge1xuICAgICAgICB2YXIgbmFtZVBhcnRzLCBuYW1lU2VnbWVudCwgbWFwVmFsdWUsIGZvdW5kTWFwLCBsYXN0SW5kZXgsXG4gICAgICAgICAgICBmb3VuZEksIGZvdW5kU3Rhck1hcCwgc3RhckksIGksIGosIHBhcnQsXG4gICAgICAgICAgICBiYXNlUGFydHMgPSBiYXNlTmFtZSAmJiBiYXNlTmFtZS5zcGxpdChcIi9cIiksXG4gICAgICAgICAgICBtYXAgPSBjb25maWcubWFwLFxuICAgICAgICAgICAgc3Rhck1hcCA9IChtYXAgJiYgbWFwWycqJ10pIHx8IHt9O1xuXG4gICAgICAgIC8vQWRqdXN0IGFueSByZWxhdGl2ZSBwYXRocy5cbiAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5jaGFyQXQoMCkgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAvL0lmIGhhdmUgYSBiYXNlIG5hbWUsIHRyeSB0byBub3JtYWxpemUgYWdhaW5zdCBpdCxcbiAgICAgICAgICAgIC8vb3RoZXJ3aXNlLCBhc3N1bWUgaXQgaXMgYSB0b3AtbGV2ZWwgcmVxdWlyZSB0aGF0IHdpbGxcbiAgICAgICAgICAgIC8vYmUgcmVsYXRpdmUgdG8gYmFzZVVybCBpbiB0aGUgZW5kLlxuICAgICAgICAgICAgaWYgKGJhc2VOYW1lKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICBsYXN0SW5kZXggPSBuYW1lLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgICAgICAgICAvLyBOb2RlIC5qcyBhbGxvd2FuY2U6XG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5ub2RlSWRDb21wYXQgJiYganNTdWZmaXhSZWdFeHAudGVzdChuYW1lW2xhc3RJbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVbbGFzdEluZGV4XSA9IG5hbWVbbGFzdEluZGV4XS5yZXBsYWNlKGpzU3VmZml4UmVnRXhwLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9Mb3Agb2ZmIHRoZSBsYXN0IHBhcnQgb2YgYmFzZVBhcnRzLCBzbyB0aGF0IC4gbWF0Y2hlcyB0aGVcbiAgICAgICAgICAgICAgICAvL1wiZGlyZWN0b3J5XCIgYW5kIG5vdCBuYW1lIG9mIHRoZSBiYXNlTmFtZSdzIG1vZHVsZS4gRm9yIGluc3RhbmNlLFxuICAgICAgICAgICAgICAgIC8vYmFzZU5hbWUgb2YgXCJvbmUvdHdvL3RocmVlXCIsIG1hcHMgdG8gXCJvbmUvdHdvL3RocmVlLmpzXCIsIGJ1dCB3ZVxuICAgICAgICAgICAgICAgIC8vd2FudCB0aGUgZGlyZWN0b3J5LCBcIm9uZS90d29cIiBmb3IgdGhpcyBub3JtYWxpemF0aW9uLlxuICAgICAgICAgICAgICAgIG5hbWUgPSBiYXNlUGFydHMuc2xpY2UoMCwgYmFzZVBhcnRzLmxlbmd0aCAtIDEpLmNvbmNhdChuYW1lKTtcblxuICAgICAgICAgICAgICAgIC8vc3RhcnQgdHJpbURvdHNcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbmFtZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gbmFtZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnQgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJ0ID09PSBcIi4uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAxICYmIChuYW1lWzJdID09PSAnLi4nIHx8IG5hbWVbMF0gPT09ICcuLicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9FbmQgb2YgdGhlIGxpbmUuIEtlZXAgYXQgbGVhc3Qgb25lIG5vbi1kb3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3BhdGggc2VnbWVudCBhdCB0aGUgZnJvbnQgc28gaXQgY2FuIGJlIG1hcHBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29ycmVjdGx5IHRvIGRpc2suIE90aGVyd2lzZSwgdGhlcmUgaXMgbGlrZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9ubyBwYXRoIG1hcHBpbmcgZm9yIGEgcGF0aCBzdGFydGluZyB3aXRoICcuLicuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9UaGlzIGNhbiBzdGlsbCBmYWlsLCBidXQgY2F0Y2hlcyB0aGUgbW9zdCByZWFzb25hYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91c2VzIG9mIC4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZS5zcGxpY2UoaSAtIDEsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2VuZCB0cmltRG90c1xuXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuam9pbihcIi9cIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUuaW5kZXhPZignLi8nKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIE5vIGJhc2VOYW1lLCBzbyB0aGlzIGlzIElEIGlzIHJlc29sdmVkIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgLy8gdG8gYmFzZVVybCwgcHVsbCBvZmYgdGhlIGxlYWRpbmcgZG90LlxuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vQXBwbHkgbWFwIGNvbmZpZyBpZiBhdmFpbGFibGUuXG4gICAgICAgIGlmICgoYmFzZVBhcnRzIHx8IHN0YXJNYXApICYmIG1hcCkge1xuICAgICAgICAgICAgbmFtZVBhcnRzID0gbmFtZS5zcGxpdCgnLycpO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSBuYW1lUGFydHMubGVuZ3RoOyBpID4gMDsgaSAtPSAxKSB7XG4gICAgICAgICAgICAgICAgbmFtZVNlZ21lbnQgPSBuYW1lUGFydHMuc2xpY2UoMCwgaSkuam9pbihcIi9cIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoYmFzZVBhcnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vRmluZCB0aGUgbG9uZ2VzdCBiYXNlTmFtZSBzZWdtZW50IG1hdGNoIGluIHRoZSBjb25maWcuXG4gICAgICAgICAgICAgICAgICAgIC8vU28sIGRvIGpvaW5zIG9uIHRoZSBiaWdnZXN0IHRvIHNtYWxsZXN0IGxlbmd0aHMgb2YgYmFzZVBhcnRzLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSBiYXNlUGFydHMubGVuZ3RoOyBqID4gMDsgaiAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBWYWx1ZSA9IG1hcFtiYXNlUGFydHMuc2xpY2UoMCwgaikuam9pbignLycpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9iYXNlTmFtZSBzZWdtZW50IGhhcyAgY29uZmlnLCBmaW5kIGlmIGl0IGhhcyBvbmUgZm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMgbmFtZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXBWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcFZhbHVlID0gbWFwVmFsdWVbbmFtZVNlZ21lbnRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXBWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL01hdGNoLCB1cGRhdGUgbmFtZSB0byB0aGUgbmV3IHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZE1hcCA9IG1hcFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEkgPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXApIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9DaGVjayBmb3IgYSBzdGFyIG1hcCBtYXRjaCwgYnV0IGp1c3QgaG9sZCBvbiB0byBpdCxcbiAgICAgICAgICAgICAgICAvL2lmIHRoZXJlIGlzIGEgc2hvcnRlciBzZWdtZW50IG1hdGNoIGxhdGVyIGluIGEgbWF0Y2hpbmdcbiAgICAgICAgICAgICAgICAvL2NvbmZpZywgdGhlbiBmYXZvciBvdmVyIHRoaXMgc3RhciBtYXAuXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZFN0YXJNYXAgJiYgc3Rhck1hcCAmJiBzdGFyTWFwW25hbWVTZWdtZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZFN0YXJNYXAgPSBzdGFyTWFwW25hbWVTZWdtZW50XTtcbiAgICAgICAgICAgICAgICAgICAgc3RhckkgPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFmb3VuZE1hcCAmJiBmb3VuZFN0YXJNYXApIHtcbiAgICAgICAgICAgICAgICBmb3VuZE1hcCA9IGZvdW5kU3Rhck1hcDtcbiAgICAgICAgICAgICAgICBmb3VuZEkgPSBzdGFySTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvdW5kTWFwKSB7XG4gICAgICAgICAgICAgICAgbmFtZVBhcnRzLnNwbGljZSgwLCBmb3VuZEksIGZvdW5kTWFwKTtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZVBhcnRzLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VSZXF1aXJlKHJlbE5hbWUsIGZvcmNlU3luYykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9BIHZlcnNpb24gb2YgYSByZXF1aXJlIGZ1bmN0aW9uIHRoYXQgcGFzc2VzIGEgbW9kdWxlTmFtZVxuICAgICAgICAgICAgLy92YWx1ZSBmb3IgaXRlbXMgdGhhdCBtYXkgbmVlZCB0b1xuICAgICAgICAgICAgLy9sb29rIHVwIHBhdGhzIHJlbGF0aXZlIHRvIHRoZSBtb2R1bGVOYW1lXG4gICAgICAgICAgICB2YXIgYXJncyA9IGFwcy5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgICAgIC8vSWYgZmlyc3QgYXJnIGlzIG5vdCByZXF1aXJlKCdzdHJpbmcnKSwgYW5kIHRoZXJlIGlzIG9ubHlcbiAgICAgICAgICAgIC8vb25lIGFyZywgaXQgaXMgdGhlIGFycmF5IGZvcm0gd2l0aG91dCBhIGNhbGxiYWNrLiBJbnNlcnRcbiAgICAgICAgICAgIC8vYSBudWxsIHNvIHRoYXQgdGhlIGZvbGxvd2luZyBjb25jYXQgaXMgY29ycmVjdC5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJnc1swXSAhPT0gJ3N0cmluZycgJiYgYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVxLmFwcGx5KHVuZGVmLCBhcmdzLmNvbmNhdChbcmVsTmFtZSwgZm9yY2VTeW5jXSkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VOb3JtYWxpemUocmVsTmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemUobmFtZSwgcmVsTmFtZSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUxvYWQoZGVwTmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBkZWZpbmVkW2RlcE5hbWVdID0gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbERlcChuYW1lKSB7XG4gICAgICAgIGlmIChoYXNQcm9wKHdhaXRpbmcsIG5hbWUpKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHdhaXRpbmdbbmFtZV07XG4gICAgICAgICAgICBkZWxldGUgd2FpdGluZ1tuYW1lXTtcbiAgICAgICAgICAgIGRlZmluaW5nW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgIG1haW4uYXBwbHkodW5kZWYsIGFyZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoYXNQcm9wKGRlZmluZWQsIG5hbWUpICYmICFoYXNQcm9wKGRlZmluaW5nLCBuYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyAnICsgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmluZWRbbmFtZV07XG4gICAgfVxuXG4gICAgLy9UdXJucyBhIHBsdWdpbiFyZXNvdXJjZSB0byBbcGx1Z2luLCByZXNvdXJjZV1cbiAgICAvL3dpdGggdGhlIHBsdWdpbiBiZWluZyB1bmRlZmluZWQgaWYgdGhlIG5hbWVcbiAgICAvL2RpZCBub3QgaGF2ZSBhIHBsdWdpbiBwcmVmaXguXG4gICAgZnVuY3Rpb24gc3BsaXRQcmVmaXgobmFtZSkge1xuICAgICAgICB2YXIgcHJlZml4LFxuICAgICAgICAgICAgaW5kZXggPSBuYW1lID8gbmFtZS5pbmRleE9mKCchJykgOiAtMTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHByZWZpeCA9IG5hbWUuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cmluZyhpbmRleCArIDEsIG5hbWUubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3ByZWZpeCwgbmFtZV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFrZXMgYSBuYW1lIG1hcCwgbm9ybWFsaXppbmcgdGhlIG5hbWUsIGFuZCB1c2luZyBhIHBsdWdpblxuICAgICAqIGZvciBub3JtYWxpemF0aW9uIGlmIG5lY2Vzc2FyeS4gR3JhYnMgYSByZWYgdG8gcGx1Z2luXG4gICAgICogdG9vLCBhcyBhbiBvcHRpbWl6YXRpb24uXG4gICAgICovXG4gICAgbWFrZU1hcCA9IGZ1bmN0aW9uIChuYW1lLCByZWxOYW1lKSB7XG4gICAgICAgIHZhciBwbHVnaW4sXG4gICAgICAgICAgICBwYXJ0cyA9IHNwbGl0UHJlZml4KG5hbWUpLFxuICAgICAgICAgICAgcHJlZml4ID0gcGFydHNbMF07XG5cbiAgICAgICAgbmFtZSA9IHBhcnRzWzFdO1xuXG4gICAgICAgIGlmIChwcmVmaXgpIHtcbiAgICAgICAgICAgIHByZWZpeCA9IG5vcm1hbGl6ZShwcmVmaXgsIHJlbE5hbWUpO1xuICAgICAgICAgICAgcGx1Z2luID0gY2FsbERlcChwcmVmaXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9Ob3JtYWxpemUgYWNjb3JkaW5nXG4gICAgICAgIGlmIChwcmVmaXgpIHtcbiAgICAgICAgICAgIGlmIChwbHVnaW4gJiYgcGx1Z2luLm5vcm1hbGl6ZSkge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwbHVnaW4ubm9ybWFsaXplKG5hbWUsIG1ha2VOb3JtYWxpemUocmVsTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gbm9ybWFsaXplKG5hbWUsIHJlbE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZShuYW1lLCByZWxOYW1lKTtcbiAgICAgICAgICAgIHBhcnRzID0gc3BsaXRQcmVmaXgobmFtZSk7XG4gICAgICAgICAgICBwcmVmaXggPSBwYXJ0c1swXTtcbiAgICAgICAgICAgIG5hbWUgPSBwYXJ0c1sxXTtcbiAgICAgICAgICAgIGlmIChwcmVmaXgpIHtcbiAgICAgICAgICAgICAgICBwbHVnaW4gPSBjYWxsRGVwKHByZWZpeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL1VzaW5nIHJpZGljdWxvdXMgcHJvcGVydHkgbmFtZXMgZm9yIHNwYWNlIHJlYXNvbnNcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGY6IHByZWZpeCA/IHByZWZpeCArICchJyArIG5hbWUgOiBuYW1lLCAvL2Z1bGxOYW1lXG4gICAgICAgICAgICBuOiBuYW1lLFxuICAgICAgICAgICAgcHI6IHByZWZpeCxcbiAgICAgICAgICAgIHA6IHBsdWdpblxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBtYWtlQ29uZmlnKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoY29uZmlnICYmIGNvbmZpZy5jb25maWcgJiYgY29uZmlnLmNvbmZpZ1tuYW1lXSkgfHwge307XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaGFuZGxlcnMgPSB7XG4gICAgICAgIHJlcXVpcmU6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFrZVJlcXVpcmUobmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydHM6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICB2YXIgZSA9IGRlZmluZWRbbmFtZV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZGVmaW5lZFtuYW1lXSA9IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbW9kdWxlOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogbmFtZSxcbiAgICAgICAgICAgICAgICB1cmk6ICcnLFxuICAgICAgICAgICAgICAgIGV4cG9ydHM6IGRlZmluZWRbbmFtZV0sXG4gICAgICAgICAgICAgICAgY29uZmlnOiBtYWtlQ29uZmlnKG5hbWUpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1haW4gPSBmdW5jdGlvbiAobmFtZSwgZGVwcywgY2FsbGJhY2ssIHJlbE5hbWUpIHtcbiAgICAgICAgdmFyIGNqc01vZHVsZSwgZGVwTmFtZSwgcmV0LCBtYXAsIGksXG4gICAgICAgICAgICBhcmdzID0gW10sXG4gICAgICAgICAgICBjYWxsYmFja1R5cGUgPSB0eXBlb2YgY2FsbGJhY2ssXG4gICAgICAgICAgICB1c2luZ0V4cG9ydHM7XG5cbiAgICAgICAgLy9Vc2UgbmFtZSBpZiBubyByZWxOYW1lXG4gICAgICAgIHJlbE5hbWUgPSByZWxOYW1lIHx8IG5hbWU7XG5cbiAgICAgICAgLy9DYWxsIHRoZSBjYWxsYmFjayB0byBkZWZpbmUgdGhlIG1vZHVsZSwgaWYgbmVjZXNzYXJ5LlxuICAgICAgICBpZiAoY2FsbGJhY2tUeXBlID09PSAndW5kZWZpbmVkJyB8fCBjYWxsYmFja1R5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vUHVsbCBvdXQgdGhlIGRlZmluZWQgZGVwZW5kZW5jaWVzIGFuZCBwYXNzIHRoZSBvcmRlcmVkXG4gICAgICAgICAgICAvL3ZhbHVlcyB0byB0aGUgY2FsbGJhY2suXG4gICAgICAgICAgICAvL0RlZmF1bHQgdG8gW3JlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZV0gaWYgbm8gZGVwc1xuICAgICAgICAgICAgZGVwcyA9ICFkZXBzLmxlbmd0aCAmJiBjYWxsYmFjay5sZW5ndGggPyBbJ3JlcXVpcmUnLCAnZXhwb3J0cycsICdtb2R1bGUnXSA6IGRlcHM7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZGVwcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIG1hcCA9IG1ha2VNYXAoZGVwc1tpXSwgcmVsTmFtZSk7XG4gICAgICAgICAgICAgICAgZGVwTmFtZSA9IG1hcC5mO1xuXG4gICAgICAgICAgICAgICAgLy9GYXN0IHBhdGggQ29tbW9uSlMgc3RhbmRhcmQgZGVwZW5kZW5jaWVzLlxuICAgICAgICAgICAgICAgIGlmIChkZXBOYW1lID09PSBcInJlcXVpcmVcIikge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW2ldID0gaGFuZGxlcnMucmVxdWlyZShuYW1lKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlcE5hbWUgPT09IFwiZXhwb3J0c1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vQ29tbW9uSlMgbW9kdWxlIHNwZWMgMS4xXG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbaV0gPSBoYW5kbGVycy5leHBvcnRzKG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB1c2luZ0V4cG9ydHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVwTmFtZSA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgICAgICAgICAvL0NvbW1vbkpTIG1vZHVsZSBzcGVjIDEuMVxuICAgICAgICAgICAgICAgICAgICBjanNNb2R1bGUgPSBhcmdzW2ldID0gaGFuZGxlcnMubW9kdWxlKG5hbWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzUHJvcChkZWZpbmVkLCBkZXBOYW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzUHJvcCh3YWl0aW5nLCBkZXBOYW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzUHJvcChkZWZpbmluZywgZGVwTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tpXSA9IGNhbGxEZXAoZGVwTmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXAucCkge1xuICAgICAgICAgICAgICAgICAgICBtYXAucC5sb2FkKG1hcC5uLCBtYWtlUmVxdWlyZShyZWxOYW1lLCB0cnVlKSwgbWFrZUxvYWQoZGVwTmFtZSksIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tpXSA9IGRlZmluZWRbZGVwTmFtZV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG5hbWUgKyAnIG1pc3NpbmcgJyArIGRlcE5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0ID0gY2FsbGJhY2sgPyBjYWxsYmFjay5hcHBseShkZWZpbmVkW25hbWVdLCBhcmdzKSA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAvL0lmIHNldHRpbmcgZXhwb3J0cyB2aWEgXCJtb2R1bGVcIiBpcyBpbiBwbGF5LFxuICAgICAgICAgICAgICAgIC8vZmF2b3IgdGhhdCBvdmVyIHJldHVybiB2YWx1ZSBhbmQgZXhwb3J0cy4gQWZ0ZXIgdGhhdCxcbiAgICAgICAgICAgICAgICAvL2Zhdm9yIGEgbm9uLXVuZGVmaW5lZCByZXR1cm4gdmFsdWUgb3ZlciBleHBvcnRzIHVzZS5cbiAgICAgICAgICAgICAgICBpZiAoY2pzTW9kdWxlICYmIGNqc01vZHVsZS5leHBvcnRzICE9PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY2pzTW9kdWxlLmV4cG9ydHMgIT09IGRlZmluZWRbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lZFtuYW1lXSA9IGNqc01vZHVsZS5leHBvcnRzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmV0ICE9PSB1bmRlZiB8fCAhdXNpbmdFeHBvcnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vVXNlIHRoZSByZXR1cm4gdmFsdWUgZnJvbSB0aGUgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIGRlZmluZWRbbmFtZV0gPSByZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgIC8vTWF5IGp1c3QgYmUgYW4gb2JqZWN0IGRlZmluaXRpb24gZm9yIHRoZSBtb2R1bGUuIE9ubHlcbiAgICAgICAgICAgIC8vd29ycnkgYWJvdXQgZGVmaW5pbmcgaWYgaGF2ZSBhIG1vZHVsZSBuYW1lLlxuICAgICAgICAgICAgZGVmaW5lZFtuYW1lXSA9IGNhbGxiYWNrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJlcXVpcmVqcyA9IHJlcXVpcmUgPSByZXEgPSBmdW5jdGlvbiAoZGVwcywgY2FsbGJhY2ssIHJlbE5hbWUsIGZvcmNlU3luYywgYWx0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGVwcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKGhhbmRsZXJzW2RlcHNdKSB7XG4gICAgICAgICAgICAgICAgLy9jYWxsYmFjayBpbiB0aGlzIGNhc2UgaXMgcmVhbGx5IHJlbE5hbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlcnNbZGVwc10oY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9KdXN0IHJldHVybiB0aGUgbW9kdWxlIHdhbnRlZC4gSW4gdGhpcyBzY2VuYXJpbywgdGhlXG4gICAgICAgICAgICAvL2RlcHMgYXJnIGlzIHRoZSBtb2R1bGUgbmFtZSwgYW5kIHNlY29uZCBhcmcgKGlmIHBhc3NlZClcbiAgICAgICAgICAgIC8vaXMganVzdCB0aGUgcmVsTmFtZS5cbiAgICAgICAgICAgIC8vTm9ybWFsaXplIG1vZHVsZSBuYW1lLCBpZiBpdCBjb250YWlucyAuIG9yIC4uXG4gICAgICAgICAgICByZXR1cm4gY2FsbERlcChtYWtlTWFwKGRlcHMsIGNhbGxiYWNrKS5mKTtcbiAgICAgICAgfSBlbHNlIGlmICghZGVwcy5zcGxpY2UpIHtcbiAgICAgICAgICAgIC8vZGVwcyBpcyBhIGNvbmZpZyBvYmplY3QsIG5vdCBhbiBhcnJheS5cbiAgICAgICAgICAgIGNvbmZpZyA9IGRlcHM7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmRlcHMpIHtcbiAgICAgICAgICAgICAgICByZXEoY29uZmlnLmRlcHMsIGNvbmZpZy5jYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2suc3BsaWNlKSB7XG4gICAgICAgICAgICAgICAgLy9jYWxsYmFjayBpcyBhbiBhcnJheSwgd2hpY2ggbWVhbnMgaXQgaXMgYSBkZXBlbmRlbmN5IGxpc3QuXG4gICAgICAgICAgICAgICAgLy9BZGp1c3QgYXJncyBpZiB0aGVyZSBhcmUgZGVwZW5kZW5jaWVzXG4gICAgICAgICAgICAgICAgZGVwcyA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcmVsTmFtZTtcbiAgICAgICAgICAgICAgICByZWxOYW1lID0gbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVwcyA9IHVuZGVmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9TdXBwb3J0IHJlcXVpcmUoWydhJ10pXG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG5cbiAgICAgICAgLy9JZiByZWxOYW1lIGlzIGEgZnVuY3Rpb24sIGl0IGlzIGFuIGVycmJhY2sgaGFuZGxlcixcbiAgICAgICAgLy9zbyByZW1vdmUgaXQuXG4gICAgICAgIGlmICh0eXBlb2YgcmVsTmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmVsTmFtZSA9IGZvcmNlU3luYztcbiAgICAgICAgICAgIGZvcmNlU3luYyA9IGFsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vU2ltdWxhdGUgYXN5bmMgY2FsbGJhY2s7XG4gICAgICAgIGlmIChmb3JjZVN5bmMpIHtcbiAgICAgICAgICAgIG1haW4odW5kZWYsIGRlcHMsIGNhbGxiYWNrLCByZWxOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vVXNpbmcgYSBub24temVybyB2YWx1ZSBiZWNhdXNlIG9mIGNvbmNlcm4gZm9yIHdoYXQgb2xkIGJyb3dzZXJzXG4gICAgICAgICAgICAvL2RvLCBhbmQgbGF0ZXN0IGJyb3dzZXJzIFwidXBncmFkZVwiIHRvIDQgaWYgbG93ZXIgdmFsdWUgaXMgdXNlZDpcbiAgICAgICAgICAgIC8vaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdGltZXJzLmh0bWwjZG9tLXdpbmRvd3RpbWVycy1zZXR0aW1lb3V0OlxuICAgICAgICAgICAgLy9JZiB3YW50IGEgdmFsdWUgaW1tZWRpYXRlbHksIHVzZSByZXF1aXJlKCdpZCcpIGluc3RlYWQgLS0gc29tZXRoaW5nXG4gICAgICAgICAgICAvL3RoYXQgd29ya3MgaW4gYWxtb25kIG9uIHRoZSBnbG9iYWwgbGV2ZWwsIGJ1dCBub3QgZ3VhcmFudGVlZCBhbmRcbiAgICAgICAgICAgIC8vdW5saWtlbHkgdG8gd29yayBpbiBvdGhlciBBTUQgaW1wbGVtZW50YXRpb25zLlxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbWFpbih1bmRlZiwgZGVwcywgY2FsbGJhY2ssIHJlbE5hbWUpO1xuICAgICAgICAgICAgfSwgNCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVxO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBKdXN0IGRyb3BzIHRoZSBjb25maWcgb24gdGhlIGZsb29yLCBidXQgcmV0dXJucyByZXEgaW4gY2FzZVxuICAgICAqIHRoZSBjb25maWcgcmV0dXJuIHZhbHVlIGlzIHVzZWQuXG4gICAgICovXG4gICAgcmVxLmNvbmZpZyA9IGZ1bmN0aW9uIChjZmcpIHtcbiAgICAgICAgcmV0dXJuIHJlcShjZmcpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFeHBvc2UgbW9kdWxlIHJlZ2lzdHJ5IGZvciBkZWJ1Z2dpbmcgYW5kIHRvb2xpbmdcbiAgICAgKi9cbiAgICByZXF1aXJlanMuX2RlZmluZWQgPSBkZWZpbmVkO1xuXG4gICAgZGVmaW5lID0gZnVuY3Rpb24gKG5hbWUsIGRlcHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU2VlIGFsbW9uZCBSRUFETUU6IGluY29ycmVjdCBtb2R1bGUgYnVpbGQsIG5vIG1vZHVsZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvL1RoaXMgbW9kdWxlIG1heSBub3QgaGF2ZSBkZXBlbmRlbmNpZXNcbiAgICAgICAgaWYgKCFkZXBzLnNwbGljZSkge1xuICAgICAgICAgICAgLy9kZXBzIGlzIG5vdCBhbiBhcnJheSwgc28gcHJvYmFibHkgbWVhbnNcbiAgICAgICAgICAgIC8vYW4gb2JqZWN0IGxpdGVyYWwgb3IgZmFjdG9yeSBmdW5jdGlvbiBmb3JcbiAgICAgICAgICAgIC8vdGhlIHZhbHVlLiBBZGp1c3QgYXJncy5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gZGVwcztcbiAgICAgICAgICAgIGRlcHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGFzUHJvcChkZWZpbmVkLCBuYW1lKSAmJiAhaGFzUHJvcCh3YWl0aW5nLCBuYW1lKSkge1xuICAgICAgICAgICAgd2FpdGluZ1tuYW1lXSA9IFtuYW1lLCBkZXBzLCBjYWxsYmFja107XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZGVmaW5lLmFtZCA9IHtcbiAgICAgICAgalF1ZXJ5OiB0cnVlXG4gICAgfTtcbn0oKSk7XG5cblMyLnJlcXVpcmVqcyA9IHJlcXVpcmVqcztTMi5yZXF1aXJlID0gcmVxdWlyZTtTMi5kZWZpbmUgPSBkZWZpbmU7XG59XG59KCkpO1xuUzIuZGVmaW5lKFwiYWxtb25kXCIsIGZ1bmN0aW9uKCl7fSk7XG5cbi8qIGdsb2JhbCBqUXVlcnk6ZmFsc2UsICQ6ZmFsc2UgKi9cblMyLmRlZmluZSgnanF1ZXJ5JyxbXSxmdW5jdGlvbiAoKSB7XG4gIHZhciBfJCA9IGpRdWVyeSB8fCAkO1xuXG4gIGlmIChfJCA9PSBudWxsICYmIGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAnU2VsZWN0MjogQW4gaW5zdGFuY2Ugb2YgalF1ZXJ5IG9yIGEgalF1ZXJ5LWNvbXBhdGlibGUgbGlicmFyeSB3YXMgbm90ICcgK1xuICAgICAgJ2ZvdW5kLiBNYWtlIHN1cmUgdGhhdCB5b3UgYXJlIGluY2x1ZGluZyBqUXVlcnkgYmVmb3JlIFNlbGVjdDIgb24geW91ciAnICtcbiAgICAgICd3ZWIgcGFnZS4nXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBfJDtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvdXRpbHMnLFtcbiAgJ2pxdWVyeSdcbl0sIGZ1bmN0aW9uICgkKSB7XG4gIHZhciBVdGlscyA9IHt9O1xuXG4gIFV0aWxzLkV4dGVuZCA9IGZ1bmN0aW9uIChDaGlsZENsYXNzLCBTdXBlckNsYXNzKSB7XG4gICAgdmFyIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gICAgZnVuY3Rpb24gQmFzZUNvbnN0cnVjdG9yICgpIHtcbiAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBDaGlsZENsYXNzO1xuICAgIH1cblxuICAgIGZvciAodmFyIGtleSBpbiBTdXBlckNsYXNzKSB7XG4gICAgICBpZiAoX19oYXNQcm9wLmNhbGwoU3VwZXJDbGFzcywga2V5KSkge1xuICAgICAgICBDaGlsZENsYXNzW2tleV0gPSBTdXBlckNsYXNzW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgQmFzZUNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IFN1cGVyQ2xhc3MucHJvdG90eXBlO1xuICAgIENoaWxkQ2xhc3MucHJvdG90eXBlID0gbmV3IEJhc2VDb25zdHJ1Y3RvcigpO1xuICAgIENoaWxkQ2xhc3MuX19zdXBlcl9fID0gU3VwZXJDbGFzcy5wcm90b3R5cGU7XG5cbiAgICByZXR1cm4gQ2hpbGRDbGFzcztcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRNZXRob2RzICh0aGVDbGFzcykge1xuICAgIHZhciBwcm90byA9IHRoZUNsYXNzLnByb3RvdHlwZTtcblxuICAgIHZhciBtZXRob2RzID0gW107XG5cbiAgICBmb3IgKHZhciBtZXRob2ROYW1lIGluIHByb3RvKSB7XG4gICAgICB2YXIgbSA9IHByb3RvW21ldGhvZE5hbWVdO1xuXG4gICAgICBpZiAodHlwZW9mIG0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChtZXRob2ROYW1lID09PSAnY29uc3RydWN0b3InKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBtZXRob2RzLnB1c2gobWV0aG9kTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1ldGhvZHM7XG4gIH1cblxuICBVdGlscy5EZWNvcmF0ZSA9IGZ1bmN0aW9uIChTdXBlckNsYXNzLCBEZWNvcmF0b3JDbGFzcykge1xuICAgIHZhciBkZWNvcmF0ZWRNZXRob2RzID0gZ2V0TWV0aG9kcyhEZWNvcmF0b3JDbGFzcyk7XG4gICAgdmFyIHN1cGVyTWV0aG9kcyA9IGdldE1ldGhvZHMoU3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBEZWNvcmF0ZWRDbGFzcyAoKSB7XG4gICAgICB2YXIgdW5zaGlmdCA9IEFycmF5LnByb3RvdHlwZS51bnNoaWZ0O1xuXG4gICAgICB2YXIgYXJnQ291bnQgPSBEZWNvcmF0b3JDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IubGVuZ3RoO1xuXG4gICAgICB2YXIgY2FsbGVkQ29uc3RydWN0b3IgPSBTdXBlckNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuICAgICAgaWYgKGFyZ0NvdW50ID4gMCkge1xuICAgICAgICB1bnNoaWZ0LmNhbGwoYXJndW1lbnRzLCBTdXBlckNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcik7XG5cbiAgICAgICAgY2FsbGVkQ29uc3RydWN0b3IgPSBEZWNvcmF0b3JDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3I7XG4gICAgICB9XG5cbiAgICAgIGNhbGxlZENvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgRGVjb3JhdG9yQ2xhc3MuZGlzcGxheU5hbWUgPSBTdXBlckNsYXNzLmRpc3BsYXlOYW1lO1xuXG4gICAgZnVuY3Rpb24gY3RyICgpIHtcbiAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBEZWNvcmF0ZWRDbGFzcztcbiAgICB9XG5cbiAgICBEZWNvcmF0ZWRDbGFzcy5wcm90b3R5cGUgPSBuZXcgY3RyKCk7XG5cbiAgICBmb3IgKHZhciBtID0gMDsgbSA8IHN1cGVyTWV0aG9kcy5sZW5ndGg7IG0rKykge1xuICAgICAgICB2YXIgc3VwZXJNZXRob2QgPSBzdXBlck1ldGhvZHNbbV07XG5cbiAgICAgICAgRGVjb3JhdGVkQ2xhc3MucHJvdG90eXBlW3N1cGVyTWV0aG9kXSA9XG4gICAgICAgICAgU3VwZXJDbGFzcy5wcm90b3R5cGVbc3VwZXJNZXRob2RdO1xuICAgIH1cblxuICAgIHZhciBjYWxsZWRNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kTmFtZSkge1xuICAgICAgLy8gU3R1YiBvdXQgdGhlIG9yaWdpbmFsIG1ldGhvZCBpZiBpdCdzIG5vdCBkZWNvcmF0aW5nIGFuIGFjdHVhbCBtZXRob2RcbiAgICAgIHZhciBvcmlnaW5hbE1ldGhvZCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgICBpZiAobWV0aG9kTmFtZSBpbiBEZWNvcmF0ZWRDbGFzcy5wcm90b3R5cGUpIHtcbiAgICAgICAgb3JpZ2luYWxNZXRob2QgPSBEZWNvcmF0ZWRDbGFzcy5wcm90b3R5cGVbbWV0aG9kTmFtZV07XG4gICAgICB9XG5cbiAgICAgIHZhciBkZWNvcmF0ZWRNZXRob2QgPSBEZWNvcmF0b3JDbGFzcy5wcm90b3R5cGVbbWV0aG9kTmFtZV07XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1bnNoaWZ0ID0gQXJyYXkucHJvdG90eXBlLnVuc2hpZnQ7XG5cbiAgICAgICAgdW5zaGlmdC5jYWxsKGFyZ3VtZW50cywgb3JpZ2luYWxNZXRob2QpO1xuXG4gICAgICAgIHJldHVybiBkZWNvcmF0ZWRNZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGZvciAodmFyIGQgPSAwOyBkIDwgZGVjb3JhdGVkTWV0aG9kcy5sZW5ndGg7IGQrKykge1xuICAgICAgdmFyIGRlY29yYXRlZE1ldGhvZCA9IGRlY29yYXRlZE1ldGhvZHNbZF07XG5cbiAgICAgIERlY29yYXRlZENsYXNzLnByb3RvdHlwZVtkZWNvcmF0ZWRNZXRob2RdID0gY2FsbGVkTWV0aG9kKGRlY29yYXRlZE1ldGhvZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIERlY29yYXRlZENsYXNzO1xuICB9O1xuXG4gIHZhciBPYnNlcnZhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0ge307XG4gIH07XG5cbiAgT2JzZXJ2YWJsZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycyB8fCB7fTtcblxuICAgIGlmIChldmVudCBpbiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbZXZlbnRdLnB1c2goY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RlbmVyc1tldmVudF0gPSBbY2FsbGJhY2tdO1xuICAgIH1cbiAgfTtcblxuICBPYnNlcnZhYmxlLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuICAgIHZhciBwYXJhbXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzIHx8IHt9O1xuXG4gICAgLy8gUGFyYW1zIHNob3VsZCBhbHdheXMgY29tZSBpbiBhcyBhbiBhcnJheVxuICAgIGlmIChwYXJhbXMgPT0gbnVsbCkge1xuICAgICAgcGFyYW1zID0gW107XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYXJlIG5vIGFyZ3VtZW50cyB0byB0aGUgZXZlbnQsIHVzZSBhIHRlbXBvcmFyeSBvYmplY3RcbiAgICBpZiAocGFyYW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcGFyYW1zLnB1c2goe30pO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgYF90eXBlYCBvZiB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBldmVudFxuICAgIHBhcmFtc1swXS5fdHlwZSA9IGV2ZW50O1xuXG4gICAgaWYgKGV2ZW50IGluIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0aGlzLmludm9rZSh0aGlzLmxpc3RlbmVyc1tldmVudF0sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgfVxuXG4gICAgaWYgKCcqJyBpbiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdGhpcy5pbnZva2UodGhpcy5saXN0ZW5lcnNbJyonXSwgYXJndW1lbnRzKTtcbiAgICB9XG4gIH07XG5cbiAgT2JzZXJ2YWJsZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKGxpc3RlbmVycywgcGFyYW1zKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIHBhcmFtcyk7XG4gICAgfVxuICB9O1xuXG4gIFV0aWxzLk9ic2VydmFibGUgPSBPYnNlcnZhYmxlO1xuXG4gIFV0aWxzLmdlbmVyYXRlQ2hhcnMgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gICAgdmFyIGNoYXJzID0gJyc7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFuZG9tQ2hhciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDM2KTtcbiAgICAgIGNoYXJzICs9IHJhbmRvbUNoYXIudG9TdHJpbmcoMzYpO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFycztcbiAgfTtcblxuICBVdGlscy5iaW5kID0gZnVuY3Rpb24gKGZ1bmMsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgZnVuYy5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH07XG5cbiAgVXRpbHMuX2NvbnZlcnREYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBmb3IgKHZhciBvcmlnaW5hbEtleSBpbiBkYXRhKSB7XG4gICAgICB2YXIga2V5cyA9IG9yaWdpbmFsS2V5LnNwbGl0KCctJyk7XG5cbiAgICAgIHZhciBkYXRhTGV2ZWwgPSBkYXRhO1xuXG4gICAgICBpZiAoa2V5cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwga2V5cy5sZW5ndGg7IGsrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1trXTtcblxuICAgICAgICAvLyBMb3dlcmNhc2UgdGhlIGZpcnN0IGxldHRlclxuICAgICAgICAvLyBCeSBkZWZhdWx0LCBkYXNoLXNlcGFyYXRlZCBiZWNvbWVzIGNhbWVsQ2FzZVxuICAgICAgICBrZXkgPSBrZXkuc3Vic3RyaW5nKDAsIDEpLnRvTG93ZXJDYXNlKCkgKyBrZXkuc3Vic3RyaW5nKDEpO1xuXG4gICAgICAgIGlmICghKGtleSBpbiBkYXRhTGV2ZWwpKSB7XG4gICAgICAgICAgZGF0YUxldmVsW2tleV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrID09IGtleXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIGRhdGFMZXZlbFtrZXldID0gZGF0YVtvcmlnaW5hbEtleV07XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhTGV2ZWwgPSBkYXRhTGV2ZWxba2V5XTtcbiAgICAgIH1cblxuICAgICAgZGVsZXRlIGRhdGFbb3JpZ2luYWxLZXldO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIFV0aWxzLmhhc1Njcm9sbCA9IGZ1bmN0aW9uIChpbmRleCwgZWwpIHtcbiAgICAvLyBBZGFwdGVkIGZyb20gdGhlIGZ1bmN0aW9uIGNyZWF0ZWQgYnkgQFNoYWRvd1NjcmlwdGVyXG4gICAgLy8gYW5kIGFkYXB0ZWQgYnkgQEJpbGxCYXJyeSBvbiB0aGUgU3RhY2sgRXhjaGFuZ2UgQ29kZSBSZXZpZXcgd2Vic2l0ZS5cbiAgICAvLyBUaGUgb3JpZ2luYWwgY29kZSBjYW4gYmUgZm91bmQgYXRcbiAgICAvLyBodHRwOi8vY29kZXJldmlldy5zdGFja2V4Y2hhbmdlLmNvbS9xLzEzMzM4XG4gICAgLy8gYW5kIHdhcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGggdGhlIFNpenpsZSBzZWxlY3RvciBlbmdpbmUuXG5cbiAgICB2YXIgJGVsID0gJChlbCk7XG4gICAgdmFyIG92ZXJmbG93WCA9IGVsLnN0eWxlLm92ZXJmbG93WDtcbiAgICB2YXIgb3ZlcmZsb3dZID0gZWwuc3R5bGUub3ZlcmZsb3dZO1xuXG4gICAgLy9DaGVjayBib3RoIHggYW5kIHkgZGVjbGFyYXRpb25zXG4gICAgaWYgKG92ZXJmbG93WCA9PT0gb3ZlcmZsb3dZICYmXG4gICAgICAgIChvdmVyZmxvd1kgPT09ICdoaWRkZW4nIHx8IG92ZXJmbG93WSA9PT0gJ3Zpc2libGUnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvdmVyZmxvd1ggPT09ICdzY3JvbGwnIHx8IG92ZXJmbG93WSA9PT0gJ3Njcm9sbCcpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiAoJGVsLmlubmVySGVpZ2h0KCkgPCBlbC5zY3JvbGxIZWlnaHQgfHxcbiAgICAgICRlbC5pbm5lcldpZHRoKCkgPCBlbC5zY3JvbGxXaWR0aCk7XG4gIH07XG5cbiAgVXRpbHMuZXNjYXBlTWFya3VwID0gZnVuY3Rpb24gKG1hcmt1cCkge1xuICAgIHZhciByZXBsYWNlTWFwID0ge1xuICAgICAgJ1xcXFwnOiAnJiM5MjsnLFxuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgJ1xcJyc6ICcmIzM5OycsXG4gICAgICAnLyc6ICcmIzQ3OydcbiAgICB9O1xuXG4gICAgLy8gRG8gbm90IHRyeSB0byBlc2NhcGUgdGhlIG1hcmt1cCBpZiBpdCdzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgbWFya3VwICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIG1hcmt1cDtcbiAgICB9XG5cbiAgICByZXR1cm4gU3RyaW5nKG1hcmt1cCkucmVwbGFjZSgvWyY8PlwiJ1xcL1xcXFxdL2csIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgcmV0dXJuIHJlcGxhY2VNYXBbbWF0Y2hdO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEFwcGVuZCBhbiBhcnJheSBvZiBqUXVlcnkgbm9kZXMgdG8gYSBnaXZlbiBlbGVtZW50LlxuICBVdGlscy5hcHBlbmRNYW55ID0gZnVuY3Rpb24gKCRlbGVtZW50LCAkbm9kZXMpIHtcbiAgICAvLyBqUXVlcnkgMS43LnggZG9lcyBub3Qgc3VwcG9ydCAkLmZuLmFwcGVuZCgpIHdpdGggYW4gYXJyYXlcbiAgICAvLyBGYWxsIGJhY2sgdG8gYSBqUXVlcnkgb2JqZWN0IGNvbGxlY3Rpb24gdXNpbmcgJC5mbi5hZGQoKVxuICAgIGlmICgkLmZuLmpxdWVyeS5zdWJzdHIoMCwgMykgPT09ICcxLjcnKSB7XG4gICAgICB2YXIgJGpxTm9kZXMgPSAkKCk7XG5cbiAgICAgICQubWFwKCRub2RlcywgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgJGpxTm9kZXMgPSAkanFOb2Rlcy5hZGQobm9kZSk7XG4gICAgICB9KTtcblxuICAgICAgJG5vZGVzID0gJGpxTm9kZXM7XG4gICAgfVxuXG4gICAgJGVsZW1lbnQuYXBwZW5kKCRub2Rlcyk7XG4gIH07XG5cbiAgcmV0dXJuIFV0aWxzO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9yZXN1bHRzJyxbXG4gICdqcXVlcnknLFxuICAnLi91dGlscydcbl0sIGZ1bmN0aW9uICgkLCBVdGlscykge1xuICBmdW5jdGlvbiBSZXN1bHRzICgkZWxlbWVudCwgb3B0aW9ucywgZGF0YUFkYXB0ZXIpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgdGhpcy5kYXRhID0gZGF0YUFkYXB0ZXI7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIFJlc3VsdHMuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcyk7XG4gIH1cblxuICBVdGlscy5FeHRlbmQoUmVzdWx0cywgVXRpbHMuT2JzZXJ2YWJsZSk7XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkcmVzdWx0cyA9ICQoXG4gICAgICAnPHVsIGNsYXNzPVwic2VsZWN0Mi1yZXN1bHRzX19vcHRpb25zXCIgcm9sZT1cInRyZWVcIj48L3VsPidcbiAgICApO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5nZXQoJ211bHRpcGxlJykpIHtcbiAgICAgICRyZXN1bHRzLmF0dHIoJ2FyaWEtbXVsdGlzZWxlY3RhYmxlJywgJ3RydWUnKTtcbiAgICB9XG5cbiAgICB0aGlzLiRyZXN1bHRzID0gJHJlc3VsdHM7XG5cbiAgICByZXR1cm4gJHJlc3VsdHM7XG4gIH07XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kcmVzdWx0cy5lbXB0eSgpO1xuICB9O1xuXG4gIFJlc3VsdHMucHJvdG90eXBlLmRpc3BsYXlNZXNzYWdlID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIHZhciBlc2NhcGVNYXJrdXAgPSB0aGlzLm9wdGlvbnMuZ2V0KCdlc2NhcGVNYXJrdXAnKTtcblxuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLmhpZGVMb2FkaW5nKCk7XG5cbiAgICB2YXIgJG1lc3NhZ2UgPSAkKFxuICAgICAgJzxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLWxpdmU9XCJhc3NlcnRpdmVcIicgK1xuICAgICAgJyBjbGFzcz1cInNlbGVjdDItcmVzdWx0c19fb3B0aW9uXCI+PC9saT4nXG4gICAgKTtcblxuICAgIHZhciBtZXNzYWdlID0gdGhpcy5vcHRpb25zLmdldCgndHJhbnNsYXRpb25zJykuZ2V0KHBhcmFtcy5tZXNzYWdlKTtcblxuICAgICRtZXNzYWdlLmFwcGVuZChcbiAgICAgIGVzY2FwZU1hcmt1cChcbiAgICAgICAgbWVzc2FnZShwYXJhbXMuYXJncylcbiAgICAgIClcbiAgICApO1xuXG4gICAgJG1lc3NhZ2VbMF0uY2xhc3NOYW1lICs9ICcgc2VsZWN0Mi1yZXN1bHRzX19tZXNzYWdlJztcblxuICAgIHRoaXMuJHJlc3VsdHMuYXBwZW5kKCRtZXNzYWdlKTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5oaWRlTWVzc2FnZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kcmVzdWx0cy5maW5kKCcuc2VsZWN0Mi1yZXN1bHRzX19tZXNzYWdlJykucmVtb3ZlKCk7XG4gIH07XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLmhpZGVMb2FkaW5nKCk7XG5cbiAgICB2YXIgJG9wdGlvbnMgPSBbXTtcblxuICAgIGlmIChkYXRhLnJlc3VsdHMgPT0gbnVsbCB8fCBkYXRhLnJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAodGhpcy4kcmVzdWx0cy5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ3Jlc3VsdHM6bWVzc2FnZScsIHtcbiAgICAgICAgICBtZXNzYWdlOiAnbm9SZXN1bHRzJ1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRhdGEucmVzdWx0cyA9IHRoaXMuc29ydChkYXRhLnJlc3VsdHMpO1xuXG4gICAgZm9yICh2YXIgZCA9IDA7IGQgPCBkYXRhLnJlc3VsdHMubGVuZ3RoOyBkKyspIHtcbiAgICAgIHZhciBpdGVtID0gZGF0YS5yZXN1bHRzW2RdO1xuXG4gICAgICB2YXIgJG9wdGlvbiA9IHRoaXMub3B0aW9uKGl0ZW0pO1xuXG4gICAgICAkb3B0aW9ucy5wdXNoKCRvcHRpb24pO1xuICAgIH1cblxuICAgIHRoaXMuJHJlc3VsdHMuYXBwZW5kKCRvcHRpb25zKTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uICgkcmVzdWx0cywgJGRyb3Bkb3duKSB7XG4gICAgdmFyICRyZXN1bHRzQ29udGFpbmVyID0gJGRyb3Bkb3duLmZpbmQoJy5zZWxlY3QyLXJlc3VsdHMnKTtcbiAgICAkcmVzdWx0c0NvbnRhaW5lci5hcHBlbmQoJHJlc3VsdHMpO1xuICB9O1xuXG4gIFJlc3VsdHMucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBzb3J0ZXIgPSB0aGlzLm9wdGlvbnMuZ2V0KCdzb3J0ZXInKTtcblxuICAgIHJldHVybiBzb3J0ZXIoZGF0YSk7XG4gIH07XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUuaGlnaGxpZ2h0Rmlyc3RJdGVtID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkb3B0aW9ucyA9IHRoaXMuJHJlc3VsdHNcbiAgICAgIC5maW5kKCcuc2VsZWN0Mi1yZXN1bHRzX19vcHRpb25bYXJpYS1zZWxlY3RlZF0nKTtcblxuICAgIHZhciAkc2VsZWN0ZWQgPSAkb3B0aW9ucy5maWx0ZXIoJ1thcmlhLXNlbGVjdGVkPXRydWVdJyk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgYW55IHNlbGVjdGVkIG9wdGlvbnNcbiAgICBpZiAoJHNlbGVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIElmIHRoZXJlIGFyZSBzZWxlY3RlZCBvcHRpb25zLCBoaWdobGlnaHQgdGhlIGZpcnN0XG4gICAgICAkc2VsZWN0ZWQuZmlyc3QoKS50cmlnZ2VyKCdtb3VzZWVudGVyJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBzZWxlY3RlZCBvcHRpb25zLCBoaWdobGlnaHQgdGhlIGZpcnN0IG9wdGlvblxuICAgICAgLy8gaW4gdGhlIGRyb3Bkb3duXG4gICAgICAkb3B0aW9ucy5maXJzdCgpLnRyaWdnZXIoJ21vdXNlZW50ZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLmVuc3VyZUhpZ2hsaWdodFZpc2libGUoKTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5zZXRDbGFzc2VzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuZGF0YS5jdXJyZW50KGZ1bmN0aW9uIChzZWxlY3RlZCkge1xuICAgICAgdmFyIHNlbGVjdGVkSWRzID0gJC5tYXAoc2VsZWN0ZWQsIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiBzLmlkLnRvU3RyaW5nKCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyICRvcHRpb25zID0gc2VsZi4kcmVzdWx0c1xuICAgICAgICAuZmluZCgnLnNlbGVjdDItcmVzdWx0c19fb3B0aW9uW2FyaWEtc2VsZWN0ZWRdJyk7XG5cbiAgICAgICRvcHRpb25zLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgJG9wdGlvbiA9ICQodGhpcyk7XG5cbiAgICAgICAgdmFyIGl0ZW0gPSAkLmRhdGEodGhpcywgJ2RhdGEnKTtcblxuICAgICAgICAvLyBpZCBuZWVkcyB0byBiZSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcgd2hlbiBjb21wYXJpbmdcbiAgICAgICAgdmFyIGlkID0gJycgKyBpdGVtLmlkO1xuXG4gICAgICAgIGlmICgoaXRlbS5lbGVtZW50ICE9IG51bGwgJiYgaXRlbS5lbGVtZW50LnNlbGVjdGVkKSB8fFxuICAgICAgICAgICAgKGl0ZW0uZWxlbWVudCA9PSBudWxsICYmICQuaW5BcnJheShpZCwgc2VsZWN0ZWRJZHMpID4gLTEpKSB7XG4gICAgICAgICAgJG9wdGlvbi5hdHRyKCdhcmlhLXNlbGVjdGVkJywgJ3RydWUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkb3B0aW9uLmF0dHIoJ2FyaWEtc2VsZWN0ZWQnLCAnZmFsc2UnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5zaG93TG9hZGluZyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICB0aGlzLmhpZGVMb2FkaW5nKCk7XG5cbiAgICB2YXIgbG9hZGluZ01vcmUgPSB0aGlzLm9wdGlvbnMuZ2V0KCd0cmFuc2xhdGlvbnMnKS5nZXQoJ3NlYXJjaGluZycpO1xuXG4gICAgdmFyIGxvYWRpbmcgPSB7XG4gICAgICBkaXNhYmxlZDogdHJ1ZSxcbiAgICAgIGxvYWRpbmc6IHRydWUsXG4gICAgICB0ZXh0OiBsb2FkaW5nTW9yZShwYXJhbXMpXG4gICAgfTtcbiAgICB2YXIgJGxvYWRpbmcgPSB0aGlzLm9wdGlvbihsb2FkaW5nKTtcbiAgICAkbG9hZGluZy5jbGFzc05hbWUgKz0gJyBsb2FkaW5nLXJlc3VsdHMnO1xuXG4gICAgdGhpcy4kcmVzdWx0cy5wcmVwZW5kKCRsb2FkaW5nKTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5oaWRlTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRyZXN1bHRzLmZpbmQoJy5sb2FkaW5nLXJlc3VsdHMnKS5yZW1vdmUoKTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5vcHRpb24gPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIG9wdGlvbi5jbGFzc05hbWUgPSAnc2VsZWN0Mi1yZXN1bHRzX19vcHRpb24nO1xuXG4gICAgdmFyIGF0dHJzID0ge1xuICAgICAgJ3JvbGUnOiAndHJlZWl0ZW0nLFxuICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiAnZmFsc2UnXG4gICAgfTtcblxuICAgIGlmIChkYXRhLmRpc2FibGVkKSB7XG4gICAgICBkZWxldGUgYXR0cnNbJ2FyaWEtc2VsZWN0ZWQnXTtcbiAgICAgIGF0dHJzWydhcmlhLWRpc2FibGVkJ10gPSAndHJ1ZSc7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuaWQgPT0gbnVsbCkge1xuICAgICAgZGVsZXRlIGF0dHJzWydhcmlhLXNlbGVjdGVkJ107XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuX3Jlc3VsdElkICE9IG51bGwpIHtcbiAgICAgIG9wdGlvbi5pZCA9IGRhdGEuX3Jlc3VsdElkO1xuICAgIH1cblxuICAgIGlmIChkYXRhLnRpdGxlKSB7XG4gICAgICBvcHRpb24udGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7XG4gICAgICBhdHRycy5yb2xlID0gJ2dyb3VwJztcbiAgICAgIGF0dHJzWydhcmlhLWxhYmVsJ10gPSBkYXRhLnRleHQ7XG4gICAgICBkZWxldGUgYXR0cnNbJ2FyaWEtc2VsZWN0ZWQnXTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBhdHRyIGluIGF0dHJzKSB7XG4gICAgICB2YXIgdmFsID0gYXR0cnNbYXR0cl07XG5cbiAgICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsKTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgdmFyICRvcHRpb24gPSAkKG9wdGlvbik7XG5cbiAgICAgIHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0cm9uZycpO1xuICAgICAgbGFiZWwuY2xhc3NOYW1lID0gJ3NlbGVjdDItcmVzdWx0c19fZ3JvdXAnO1xuXG4gICAgICB2YXIgJGxhYmVsID0gJChsYWJlbCk7XG4gICAgICB0aGlzLnRlbXBsYXRlKGRhdGEsIGxhYmVsKTtcblxuICAgICAgdmFyICRjaGlsZHJlbiA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBjID0gMDsgYyA8IGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBjKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gZGF0YS5jaGlsZHJlbltjXTtcblxuICAgICAgICB2YXIgJGNoaWxkID0gdGhpcy5vcHRpb24oY2hpbGQpO1xuXG4gICAgICAgICRjaGlsZHJlbi5wdXNoKCRjaGlsZCk7XG4gICAgICB9XG5cbiAgICAgIHZhciAkY2hpbGRyZW5Db250YWluZXIgPSAkKCc8dWw+PC91bD4nLCB7XG4gICAgICAgICdjbGFzcyc6ICdzZWxlY3QyLXJlc3VsdHNfX29wdGlvbnMgc2VsZWN0Mi1yZXN1bHRzX19vcHRpb25zLS1uZXN0ZWQnXG4gICAgICB9KTtcblxuICAgICAgJGNoaWxkcmVuQ29udGFpbmVyLmFwcGVuZCgkY2hpbGRyZW4pO1xuXG4gICAgICAkb3B0aW9uLmFwcGVuZChsYWJlbCk7XG4gICAgICAkb3B0aW9uLmFwcGVuZCgkY2hpbGRyZW5Db250YWluZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRlbXBsYXRlKGRhdGEsIG9wdGlvbik7XG4gICAgfVxuXG4gICAgJC5kYXRhKG9wdGlvbiwgJ2RhdGEnLCBkYXRhKTtcblxuICAgIHJldHVybiBvcHRpb247XG4gIH07XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChjb250YWluZXIsICRjb250YWluZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgaWQgPSBjb250YWluZXIuaWQgKyAnLXJlc3VsdHMnO1xuXG4gICAgdGhpcy4kcmVzdWx0cy5hdHRyKCdpZCcsIGlkKTtcblxuICAgIGNvbnRhaW5lci5vbigncmVzdWx0czphbGwnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICBzZWxmLmNsZWFyKCk7XG4gICAgICBzZWxmLmFwcGVuZChwYXJhbXMuZGF0YSk7XG5cbiAgICAgIGlmIChjb250YWluZXIuaXNPcGVuKCkpIHtcbiAgICAgICAgc2VsZi5zZXRDbGFzc2VzKCk7XG4gICAgICAgIHNlbGYuaGlnaGxpZ2h0Rmlyc3RJdGVtKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ3Jlc3VsdHM6YXBwZW5kJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi5hcHBlbmQocGFyYW1zLmRhdGEpO1xuXG4gICAgICBpZiAoY29udGFpbmVyLmlzT3BlbigpKSB7XG4gICAgICAgIHNlbGYuc2V0Q2xhc3NlcygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdxdWVyeScsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgIHNlbGYuaGlkZU1lc3NhZ2VzKCk7XG4gICAgICBzZWxmLnNob3dMb2FkaW5nKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ3NlbGVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghY29udGFpbmVyLmlzT3BlbigpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi5zZXRDbGFzc2VzKCk7XG4gICAgICBzZWxmLmhpZ2hsaWdodEZpcnN0SXRlbSgpO1xuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCd1bnNlbGVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghY29udGFpbmVyLmlzT3BlbigpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi5zZXRDbGFzc2VzKCk7XG4gICAgICBzZWxmLmhpZ2hsaWdodEZpcnN0SXRlbSgpO1xuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdvcGVuJywgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gV2hlbiB0aGUgZHJvcGRvd24gaXMgb3BlbiwgYXJpYS1leHBlbmRlZD1cInRydWVcIlxuICAgICAgc2VsZi4kcmVzdWx0cy5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICAgIHNlbGYuJHJlc3VsdHMuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcblxuICAgICAgc2VsZi5zZXRDbGFzc2VzKCk7XG4gICAgICBzZWxmLmVuc3VyZUhpZ2hsaWdodFZpc2libGUoKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBXaGVuIHRoZSBkcm9wZG93biBpcyBjbG9zZWQsIGFyaWEtZXhwZW5kZWQ9XCJmYWxzZVwiXG4gICAgICBzZWxmLiRyZXN1bHRzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICAgIHNlbGYuJHJlc3VsdHMuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgc2VsZi4kcmVzdWx0cy5yZW1vdmVBdHRyKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbigncmVzdWx0czp0b2dnbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJGhpZ2hsaWdodGVkID0gc2VsZi5nZXRIaWdobGlnaHRlZFJlc3VsdHMoKTtcblxuICAgICAgaWYgKCRoaWdobGlnaHRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAkaGlnaGxpZ2h0ZWQudHJpZ2dlcignbW91c2V1cCcpO1xuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdyZXN1bHRzOnNlbGVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkaGlnaGxpZ2h0ZWQgPSBzZWxmLmdldEhpZ2hsaWdodGVkUmVzdWx0cygpO1xuXG4gICAgICBpZiAoJGhpZ2hsaWdodGVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBkYXRhID0gJGhpZ2hsaWdodGVkLmRhdGEoJ2RhdGEnKTtcblxuICAgICAgaWYgKCRoaWdobGlnaHRlZC5hdHRyKCdhcmlhLXNlbGVjdGVkJykgPT0gJ3RydWUnKSB7XG4gICAgICAgIHNlbGYudHJpZ2dlcignY2xvc2UnLCB7fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnRyaWdnZXIoJ3NlbGVjdCcsIHtcbiAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdyZXN1bHRzOnByZXZpb3VzJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICRoaWdobGlnaHRlZCA9IHNlbGYuZ2V0SGlnaGxpZ2h0ZWRSZXN1bHRzKCk7XG5cbiAgICAgIHZhciAkb3B0aW9ucyA9IHNlbGYuJHJlc3VsdHMuZmluZCgnW2FyaWEtc2VsZWN0ZWRdJyk7XG5cbiAgICAgIHZhciBjdXJyZW50SW5kZXggPSAkb3B0aW9ucy5pbmRleCgkaGlnaGxpZ2h0ZWQpO1xuXG4gICAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBhdCB0ZSB0b3AsIGRvbid0IG1vdmUgZnVydGhlclxuICAgICAgaWYgKGN1cnJlbnRJbmRleCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBuZXh0SW5kZXggPSBjdXJyZW50SW5kZXggLSAxO1xuXG4gICAgICAvLyBJZiBub25lIGFyZSBoaWdobGlnaHRlZCwgaGlnaGxpZ2h0IHRoZSBmaXJzdFxuICAgICAgaWYgKCRoaWdobGlnaHRlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbmV4dEluZGV4ID0gMDtcbiAgICAgIH1cblxuICAgICAgdmFyICRuZXh0ID0gJG9wdGlvbnMuZXEobmV4dEluZGV4KTtcblxuICAgICAgJG5leHQudHJpZ2dlcignbW91c2VlbnRlcicpO1xuXG4gICAgICB2YXIgY3VycmVudE9mZnNldCA9IHNlbGYuJHJlc3VsdHMub2Zmc2V0KCkudG9wO1xuICAgICAgdmFyIG5leHRUb3AgPSAkbmV4dC5vZmZzZXQoKS50b3A7XG4gICAgICB2YXIgbmV4dE9mZnNldCA9IHNlbGYuJHJlc3VsdHMuc2Nyb2xsVG9wKCkgKyAobmV4dFRvcCAtIGN1cnJlbnRPZmZzZXQpO1xuXG4gICAgICBpZiAobmV4dEluZGV4ID09PSAwKSB7XG4gICAgICAgIHNlbGYuJHJlc3VsdHMuc2Nyb2xsVG9wKDApO1xuICAgICAgfSBlbHNlIGlmIChuZXh0VG9wIC0gY3VycmVudE9mZnNldCA8IDApIHtcbiAgICAgICAgc2VsZi4kcmVzdWx0cy5zY3JvbGxUb3AobmV4dE9mZnNldCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ3Jlc3VsdHM6bmV4dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkaGlnaGxpZ2h0ZWQgPSBzZWxmLmdldEhpZ2hsaWdodGVkUmVzdWx0cygpO1xuXG4gICAgICB2YXIgJG9wdGlvbnMgPSBzZWxmLiRyZXN1bHRzLmZpbmQoJ1thcmlhLXNlbGVjdGVkXScpO1xuXG4gICAgICB2YXIgY3VycmVudEluZGV4ID0gJG9wdGlvbnMuaW5kZXgoJGhpZ2hsaWdodGVkKTtcblxuICAgICAgdmFyIG5leHRJbmRleCA9IGN1cnJlbnRJbmRleCArIDE7XG5cbiAgICAgIC8vIElmIHdlIGFyZSBhdCB0aGUgbGFzdCBvcHRpb24sIHN0YXkgdGhlcmVcbiAgICAgIGlmIChuZXh0SW5kZXggPj0gJG9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyICRuZXh0ID0gJG9wdGlvbnMuZXEobmV4dEluZGV4KTtcblxuICAgICAgJG5leHQudHJpZ2dlcignbW91c2VlbnRlcicpO1xuXG4gICAgICB2YXIgY3VycmVudE9mZnNldCA9IHNlbGYuJHJlc3VsdHMub2Zmc2V0KCkudG9wICtcbiAgICAgICAgc2VsZi4kcmVzdWx0cy5vdXRlckhlaWdodChmYWxzZSk7XG4gICAgICB2YXIgbmV4dEJvdHRvbSA9ICRuZXh0Lm9mZnNldCgpLnRvcCArICRuZXh0Lm91dGVySGVpZ2h0KGZhbHNlKTtcbiAgICAgIHZhciBuZXh0T2Zmc2V0ID0gc2VsZi4kcmVzdWx0cy5zY3JvbGxUb3AoKSArIG5leHRCb3R0b20gLSBjdXJyZW50T2Zmc2V0O1xuXG4gICAgICBpZiAobmV4dEluZGV4ID09PSAwKSB7XG4gICAgICAgIHNlbGYuJHJlc3VsdHMuc2Nyb2xsVG9wKDApO1xuICAgICAgfSBlbHNlIGlmIChuZXh0Qm90dG9tID4gY3VycmVudE9mZnNldCkge1xuICAgICAgICBzZWxmLiRyZXN1bHRzLnNjcm9sbFRvcChuZXh0T2Zmc2V0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbigncmVzdWx0czpmb2N1cycsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgIHBhcmFtcy5lbGVtZW50LmFkZENsYXNzKCdzZWxlY3QyLXJlc3VsdHNfX29wdGlvbi0taGlnaGxpZ2h0ZWQnKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbigncmVzdWx0czptZXNzYWdlJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi5kaXNwbGF5TWVzc2FnZShwYXJhbXMpO1xuICAgIH0pO1xuXG4gICAgaWYgKCQuZm4ubW91c2V3aGVlbCkge1xuICAgICAgdGhpcy4kcmVzdWx0cy5vbignbW91c2V3aGVlbCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB0b3AgPSBzZWxmLiRyZXN1bHRzLnNjcm9sbFRvcCgpO1xuXG4gICAgICAgIHZhciBib3R0b20gPSBzZWxmLiRyZXN1bHRzLmdldCgwKS5zY3JvbGxIZWlnaHQgLSB0b3AgKyBlLmRlbHRhWTtcblxuICAgICAgICB2YXIgaXNBdFRvcCA9IGUuZGVsdGFZID4gMCAmJiB0b3AgLSBlLmRlbHRhWSA8PSAwO1xuICAgICAgICB2YXIgaXNBdEJvdHRvbSA9IGUuZGVsdGFZIDwgMCAmJiBib3R0b20gPD0gc2VsZi4kcmVzdWx0cy5oZWlnaHQoKTtcblxuICAgICAgICBpZiAoaXNBdFRvcCkge1xuICAgICAgICAgIHNlbGYuJHJlc3VsdHMuc2Nyb2xsVG9wKDApO1xuXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBdEJvdHRvbSkge1xuICAgICAgICAgIHNlbGYuJHJlc3VsdHMuc2Nyb2xsVG9wKFxuICAgICAgICAgICAgc2VsZi4kcmVzdWx0cy5nZXQoMCkuc2Nyb2xsSGVpZ2h0IC0gc2VsZi4kcmVzdWx0cy5oZWlnaHQoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy4kcmVzdWx0cy5vbignbW91c2V1cCcsICcuc2VsZWN0Mi1yZXN1bHRzX19vcHRpb25bYXJpYS1zZWxlY3RlZF0nLFxuICAgICAgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcblxuICAgICAgdmFyIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRhJyk7XG5cbiAgICAgIGlmICgkdGhpcy5hdHRyKCdhcmlhLXNlbGVjdGVkJykgPT09ICd0cnVlJykge1xuICAgICAgICBpZiAoc2VsZi5vcHRpb25zLmdldCgnbXVsdGlwbGUnKSkge1xuICAgICAgICAgIHNlbGYudHJpZ2dlcigndW5zZWxlY3QnLCB7XG4gICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnQsXG4gICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi50cmlnZ2VyKCdjbG9zZScsIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi50cmlnZ2VyKCdzZWxlY3QnLCB7XG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dCxcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRyZXN1bHRzLm9uKCdtb3VzZWVudGVyJywgJy5zZWxlY3QyLXJlc3VsdHNfX29wdGlvblthcmlhLXNlbGVjdGVkXScsXG4gICAgICBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICB2YXIgZGF0YSA9ICQodGhpcykuZGF0YSgnZGF0YScpO1xuXG4gICAgICBzZWxmLmdldEhpZ2hsaWdodGVkUmVzdWx0cygpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdzZWxlY3QyLXJlc3VsdHNfX29wdGlvbi0taGlnaGxpZ2h0ZWQnKTtcblxuICAgICAgc2VsZi50cmlnZ2VyKCdyZXN1bHRzOmZvY3VzJywge1xuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICBlbGVtZW50OiAkKHRoaXMpXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5nZXRIaWdobGlnaHRlZFJlc3VsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRoaWdobGlnaHRlZCA9IHRoaXMuJHJlc3VsdHNcbiAgICAuZmluZCgnLnNlbGVjdDItcmVzdWx0c19fb3B0aW9uLS1oaWdobGlnaHRlZCcpO1xuXG4gICAgcmV0dXJuICRoaWdobGlnaHRlZDtcbiAgfTtcblxuICBSZXN1bHRzLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJHJlc3VsdHMucmVtb3ZlKCk7XG4gIH07XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUuZW5zdXJlSGlnaGxpZ2h0VmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGhpZ2hsaWdodGVkID0gdGhpcy5nZXRIaWdobGlnaHRlZFJlc3VsdHMoKTtcblxuICAgIGlmICgkaGlnaGxpZ2h0ZWQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyICRvcHRpb25zID0gdGhpcy4kcmVzdWx0cy5maW5kKCdbYXJpYS1zZWxlY3RlZF0nKTtcblxuICAgIHZhciBjdXJyZW50SW5kZXggPSAkb3B0aW9ucy5pbmRleCgkaGlnaGxpZ2h0ZWQpO1xuXG4gICAgdmFyIGN1cnJlbnRPZmZzZXQgPSB0aGlzLiRyZXN1bHRzLm9mZnNldCgpLnRvcDtcbiAgICB2YXIgbmV4dFRvcCA9ICRoaWdobGlnaHRlZC5vZmZzZXQoKS50b3A7XG4gICAgdmFyIG5leHRPZmZzZXQgPSB0aGlzLiRyZXN1bHRzLnNjcm9sbFRvcCgpICsgKG5leHRUb3AgLSBjdXJyZW50T2Zmc2V0KTtcblxuICAgIHZhciBvZmZzZXREZWx0YSA9IG5leHRUb3AgLSBjdXJyZW50T2Zmc2V0O1xuICAgIG5leHRPZmZzZXQgLT0gJGhpZ2hsaWdodGVkLm91dGVySGVpZ2h0KGZhbHNlKSAqIDI7XG5cbiAgICBpZiAoY3VycmVudEluZGV4IDw9IDIpIHtcbiAgICAgIHRoaXMuJHJlc3VsdHMuc2Nyb2xsVG9wKDApO1xuICAgIH0gZWxzZSBpZiAob2Zmc2V0RGVsdGEgPiB0aGlzLiRyZXN1bHRzLm91dGVySGVpZ2h0KCkgfHwgb2Zmc2V0RGVsdGEgPCAwKSB7XG4gICAgICB0aGlzLiRyZXN1bHRzLnNjcm9sbFRvcChuZXh0T2Zmc2V0KTtcbiAgICB9XG4gIH07XG5cbiAgUmVzdWx0cy5wcm90b3R5cGUudGVtcGxhdGUgPSBmdW5jdGlvbiAocmVzdWx0LCBjb250YWluZXIpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLm9wdGlvbnMuZ2V0KCd0ZW1wbGF0ZVJlc3VsdCcpO1xuICAgIHZhciBlc2NhcGVNYXJrdXAgPSB0aGlzLm9wdGlvbnMuZ2V0KCdlc2NhcGVNYXJrdXAnKTtcblxuICAgIHZhciBjb250ZW50ID0gdGVtcGxhdGUocmVzdWx0LCBjb250YWluZXIpO1xuXG4gICAgaWYgKGNvbnRlbnQgPT0gbnVsbCkge1xuICAgICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBlc2NhcGVNYXJrdXAoY29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoY29udGFpbmVyKS5hcHBlbmQoY29udGVudCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBSZXN1bHRzO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9rZXlzJyxbXG5cbl0sIGZ1bmN0aW9uICgpIHtcbiAgdmFyIEtFWVMgPSB7XG4gICAgQkFDS1NQQUNFOiA4LFxuICAgIFRBQjogOSxcbiAgICBFTlRFUjogMTMsXG4gICAgU0hJRlQ6IDE2LFxuICAgIENUUkw6IDE3LFxuICAgIEFMVDogMTgsXG4gICAgRVNDOiAyNyxcbiAgICBTUEFDRTogMzIsXG4gICAgUEFHRV9VUDogMzMsXG4gICAgUEFHRV9ET1dOOiAzNCxcbiAgICBFTkQ6IDM1LFxuICAgIEhPTUU6IDM2LFxuICAgIExFRlQ6IDM3LFxuICAgIFVQOiAzOCxcbiAgICBSSUdIVDogMzksXG4gICAgRE9XTjogNDAsXG4gICAgREVMRVRFOiA0NlxuICB9O1xuXG4gIHJldHVybiBLRVlTO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9zZWxlY3Rpb24vYmFzZScsW1xuICAnanF1ZXJ5JyxcbiAgJy4uL3V0aWxzJyxcbiAgJy4uL2tleXMnXG5dLCBmdW5jdGlvbiAoJCwgVXRpbHMsIEtFWVMpIHtcbiAgZnVuY3Rpb24gQmFzZVNlbGVjdGlvbiAoJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIEJhc2VTZWxlY3Rpb24uX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcyk7XG4gIH1cblxuICBVdGlscy5FeHRlbmQoQmFzZVNlbGVjdGlvbiwgVXRpbHMuT2JzZXJ2YWJsZSk7XG5cbiAgQmFzZVNlbGVjdGlvbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkc2VsZWN0aW9uID0gJChcbiAgICAgICc8c3BhbiBjbGFzcz1cInNlbGVjdDItc2VsZWN0aW9uXCIgcm9sZT1cImNvbWJvYm94XCIgJyArXG4gICAgICAnIGFyaWEtaGFzcG9wdXA9XCJ0cnVlXCIgYXJpYS1leHBhbmRlZD1cImZhbHNlXCI+JyArXG4gICAgICAnPC9zcGFuPidcbiAgICApO1xuXG4gICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuZGF0YSgnb2xkLXRhYmluZGV4JykgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fdGFiaW5kZXggPSB0aGlzLiRlbGVtZW50LmRhdGEoJ29sZC10YWJpbmRleCcpO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcpICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3RhYmluZGV4ID0gdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcpO1xuICAgIH1cblxuICAgICRzZWxlY3Rpb24uYXR0cigndGl0bGUnLCB0aGlzLiRlbGVtZW50LmF0dHIoJ3RpdGxlJykpO1xuICAgICRzZWxlY3Rpb24uYXR0cigndGFiaW5kZXgnLCB0aGlzLl90YWJpbmRleCk7XG5cbiAgICB0aGlzLiRzZWxlY3Rpb24gPSAkc2VsZWN0aW9uO1xuXG4gICAgcmV0dXJuICRzZWxlY3Rpb247XG4gIH07XG5cbiAgQmFzZVNlbGVjdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChjb250YWluZXIsICRjb250YWluZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgaWQgPSBjb250YWluZXIuaWQgKyAnLWNvbnRhaW5lcic7XG4gICAgdmFyIHJlc3VsdHNJZCA9IGNvbnRhaW5lci5pZCArICctcmVzdWx0cyc7XG5cbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5vbignZm9jdXMnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICBzZWxmLnRyaWdnZXIoJ2ZvY3VzJywgZXZ0KTtcbiAgICB9KTtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5vbignYmx1cicsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIHNlbGYuX2hhbmRsZUJsdXIoZXZ0KTtcbiAgICB9KTtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIHNlbGYudHJpZ2dlcigna2V5cHJlc3MnLCBldnQpO1xuXG4gICAgICBpZiAoZXZ0LndoaWNoID09PSBLRVlTLlNQQUNFKSB7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdyZXN1bHRzOmZvY3VzJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi4kc2VsZWN0aW9uLmF0dHIoJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcsIHBhcmFtcy5kYXRhLl9yZXN1bHRJZCk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ3NlbGVjdGlvbjp1cGRhdGUnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICBzZWxmLnVwZGF0ZShwYXJhbXMuZGF0YSk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ29wZW4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBXaGVuIHRoZSBkcm9wZG93biBpcyBvcGVuLCBhcmlhLWV4cGFuZGVkPVwidHJ1ZVwiXG4gICAgICBzZWxmLiRzZWxlY3Rpb24uYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICBzZWxmLiRzZWxlY3Rpb24uYXR0cignYXJpYS1vd25zJywgcmVzdWx0c0lkKTtcblxuICAgICAgc2VsZi5fYXR0YWNoQ2xvc2VIYW5kbGVyKGNvbnRhaW5lcik7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gV2hlbiB0aGUgZHJvcGRvd24gaXMgY2xvc2VkLCBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIlxuICAgICAgc2VsZi4kc2VsZWN0aW9uLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICAgIHNlbGYuJHNlbGVjdGlvbi5yZW1vdmVBdHRyKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnKTtcbiAgICAgIHNlbGYuJHNlbGVjdGlvbi5yZW1vdmVBdHRyKCdhcmlhLW93bnMnKTtcblxuICAgICAgc2VsZi4kc2VsZWN0aW9uLmZvY3VzKCk7XG5cbiAgICAgIHNlbGYuX2RldGFjaENsb3NlSGFuZGxlcihjb250YWluZXIpO1xuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdlbmFibGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLiRzZWxlY3Rpb24uYXR0cigndGFiaW5kZXgnLCBzZWxmLl90YWJpbmRleCk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2Rpc2FibGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLiRzZWxlY3Rpb24uYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICB9KTtcbiAgfTtcblxuICBCYXNlU2VsZWN0aW9uLnByb3RvdHlwZS5faGFuZGxlQmx1ciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBUaGlzIG5lZWRzIHRvIGJlIGRlbGF5ZWQgYXMgdGhlIGFjdGl2ZSBlbGVtZW50IGlzIHRoZSBib2R5IHdoZW4gdGhlIHRhYlxuICAgIC8vIGtleSBpcyBwcmVzc2VkLCBwb3NzaWJseSBhbG9uZyB3aXRoIG90aGVycy5cbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBEb24ndCB0cmlnZ2VyIGBibHVyYCBpZiB0aGUgZm9jdXMgaXMgc3RpbGwgaW4gdGhlIHNlbGVjdGlvblxuICAgICAgaWYgKFxuICAgICAgICAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBzZWxmLiRzZWxlY3Rpb25bMF0pIHx8XG4gICAgICAgICgkLmNvbnRhaW5zKHNlbGYuJHNlbGVjdGlvblswXSwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnRyaWdnZXIoJ2JsdXInLCBldnQpO1xuICAgIH0sIDEpO1xuICB9O1xuXG4gIEJhc2VTZWxlY3Rpb24ucHJvdG90eXBlLl9hdHRhY2hDbG9zZUhhbmRsZXIgPSBmdW5jdGlvbiAoY29udGFpbmVyKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgJChkb2N1bWVudC5ib2R5KS5vbignbW91c2Vkb3duLnNlbGVjdDIuJyArIGNvbnRhaW5lci5pZCwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJChlLnRhcmdldCk7XG5cbiAgICAgIHZhciAkc2VsZWN0ID0gJHRhcmdldC5jbG9zZXN0KCcuc2VsZWN0MicpO1xuXG4gICAgICB2YXIgJGFsbCA9ICQoJy5zZWxlY3QyLnNlbGVjdDItY29udGFpbmVyLS1vcGVuJyk7XG5cbiAgICAgICRhbGwuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMgPT0gJHNlbGVjdFswXSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZWxlbWVudCA9ICR0aGlzLmRhdGEoJ2VsZW1lbnQnKTtcblxuICAgICAgICAkZWxlbWVudC5zZWxlY3QyKCdjbG9zZScpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQmFzZVNlbGVjdGlvbi5wcm90b3R5cGUuX2RldGFjaENsb3NlSGFuZGxlciA9IGZ1bmN0aW9uIChjb250YWluZXIpIHtcbiAgICAkKGRvY3VtZW50LmJvZHkpLm9mZignbW91c2Vkb3duLnNlbGVjdDIuJyArIGNvbnRhaW5lci5pZCk7XG4gIH07XG5cbiAgQmFzZVNlbGVjdGlvbi5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbiAoJHNlbGVjdGlvbiwgJGNvbnRhaW5lcikge1xuICAgIHZhciAkc2VsZWN0aW9uQ29udGFpbmVyID0gJGNvbnRhaW5lci5maW5kKCcuc2VsZWN0aW9uJyk7XG4gICAgJHNlbGVjdGlvbkNvbnRhaW5lci5hcHBlbmQoJHNlbGVjdGlvbik7XG4gIH07XG5cbiAgQmFzZVNlbGVjdGlvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZXRhY2hDbG9zZUhhbmRsZXIodGhpcy5jb250YWluZXIpO1xuICB9O1xuXG4gIEJhc2VTZWxlY3Rpb24ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgYHVwZGF0ZWAgbWV0aG9kIG11c3QgYmUgZGVmaW5lZCBpbiBjaGlsZCBjbGFzc2VzLicpO1xuICB9O1xuXG4gIHJldHVybiBCYXNlU2VsZWN0aW9uO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9zZWxlY3Rpb24vc2luZ2xlJyxbXG4gICdqcXVlcnknLFxuICAnLi9iYXNlJyxcbiAgJy4uL3V0aWxzJyxcbiAgJy4uL2tleXMnXG5dLCBmdW5jdGlvbiAoJCwgQmFzZVNlbGVjdGlvbiwgVXRpbHMsIEtFWVMpIHtcbiAgZnVuY3Rpb24gU2luZ2xlU2VsZWN0aW9uICgpIHtcbiAgICBTaW5nbGVTZWxlY3Rpb24uX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBVdGlscy5FeHRlbmQoU2luZ2xlU2VsZWN0aW9uLCBCYXNlU2VsZWN0aW9uKTtcblxuICBTaW5nbGVTZWxlY3Rpb24ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHNlbGVjdGlvbiA9IFNpbmdsZVNlbGVjdGlvbi5fX3N1cGVyX18ucmVuZGVyLmNhbGwodGhpcyk7XG5cbiAgICAkc2VsZWN0aW9uLmFkZENsYXNzKCdzZWxlY3QyLXNlbGVjdGlvbi0tc2luZ2xlJyk7XG5cbiAgICAkc2VsZWN0aW9uLmh0bWwoXG4gICAgICAnPHNwYW4gY2xhc3M9XCJzZWxlY3QyLXNlbGVjdGlvbl9fcmVuZGVyZWRcIj48L3NwYW4+JyArXG4gICAgICAnPHNwYW4gY2xhc3M9XCJzZWxlY3QyLXNlbGVjdGlvbl9fYXJyb3dcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+JyArXG4gICAgICAgICc8YiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9iPicgK1xuICAgICAgJzwvc3Bhbj4nXG4gICAgKTtcblxuICAgIHJldHVybiAkc2VsZWN0aW9uO1xuICB9O1xuXG4gIFNpbmdsZVNlbGVjdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChjb250YWluZXIsICRjb250YWluZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBTaW5nbGVTZWxlY3Rpb24uX19zdXBlcl9fLmJpbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHZhciBpZCA9IGNvbnRhaW5lci5pZCArICctY29udGFpbmVyJztcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5maW5kKCcuc2VsZWN0Mi1zZWxlY3Rpb25fX3JlbmRlcmVkJykuYXR0cignaWQnLCBpZCk7XG4gICAgdGhpcy4kc2VsZWN0aW9uLmF0dHIoJ2FyaWEtbGFiZWxsZWRieScsIGlkKTtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5vbignbW91c2Vkb3duJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgLy8gT25seSByZXNwb25kIHRvIGxlZnQgY2xpY2tzXG4gICAgICBpZiAoZXZ0LndoaWNoICE9PSAxKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi50cmlnZ2VyKCd0b2dnbGUnLCB7XG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRzZWxlY3Rpb24ub24oJ2ZvY3VzJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgLy8gVXNlciBmb2N1c2VzIG9uIHRoZSBjb250YWluZXJcbiAgICB9KTtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5vbignYmx1cicsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIC8vIFVzZXIgZXhpdHMgdGhlIGNvbnRhaW5lclxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdmb2N1cycsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIGlmICghY29udGFpbmVyLmlzT3BlbigpKSB7XG4gICAgICAgIHNlbGYuJHNlbGVjdGlvbi5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdzZWxlY3Rpb246dXBkYXRlJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi51cGRhdGUocGFyYW1zLmRhdGEpO1xuICAgIH0pO1xuICB9O1xuXG4gIFNpbmdsZVNlbGVjdGlvbi5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kc2VsZWN0aW9uLmZpbmQoJy5zZWxlY3QyLXNlbGVjdGlvbl9fcmVuZGVyZWQnKS5lbXB0eSgpO1xuICB9O1xuXG4gIFNpbmdsZVNlbGVjdGlvbi5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uIChkYXRhLCBjb250YWluZXIpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLm9wdGlvbnMuZ2V0KCd0ZW1wbGF0ZVNlbGVjdGlvbicpO1xuICAgIHZhciBlc2NhcGVNYXJrdXAgPSB0aGlzLm9wdGlvbnMuZ2V0KCdlc2NhcGVNYXJrdXAnKTtcblxuICAgIHJldHVybiBlc2NhcGVNYXJrdXAodGVtcGxhdGUoZGF0YSwgY29udGFpbmVyKSk7XG4gIH07XG5cbiAgU2luZ2xlU2VsZWN0aW9uLnByb3RvdHlwZS5zZWxlY3Rpb25Db250YWluZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICQoJzxzcGFuPjwvc3Bhbj4nKTtcbiAgfTtcblxuICBTaW5nbGVTZWxlY3Rpb24ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNlbGVjdGlvbiA9IGRhdGFbMF07XG5cbiAgICB2YXIgJHJlbmRlcmVkID0gdGhpcy4kc2VsZWN0aW9uLmZpbmQoJy5zZWxlY3QyLXNlbGVjdGlvbl9fcmVuZGVyZWQnKTtcbiAgICB2YXIgZm9ybWF0dGVkID0gdGhpcy5kaXNwbGF5KHNlbGVjdGlvbiwgJHJlbmRlcmVkKTtcblxuICAgICRyZW5kZXJlZC5lbXB0eSgpLmFwcGVuZChmb3JtYXR0ZWQpO1xuICAgICRyZW5kZXJlZC5wcm9wKCd0aXRsZScsIHNlbGVjdGlvbi50aXRsZSB8fCBzZWxlY3Rpb24udGV4dCk7XG4gIH07XG5cbiAgcmV0dXJuIFNpbmdsZVNlbGVjdGlvbjtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvc2VsZWN0aW9uL211bHRpcGxlJyxbXG4gICdqcXVlcnknLFxuICAnLi9iYXNlJyxcbiAgJy4uL3V0aWxzJ1xuXSwgZnVuY3Rpb24gKCQsIEJhc2VTZWxlY3Rpb24sIFV0aWxzKSB7XG4gIGZ1bmN0aW9uIE11bHRpcGxlU2VsZWN0aW9uICgkZWxlbWVudCwgb3B0aW9ucykge1xuICAgIE11bHRpcGxlU2VsZWN0aW9uLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgVXRpbHMuRXh0ZW5kKE11bHRpcGxlU2VsZWN0aW9uLCBCYXNlU2VsZWN0aW9uKTtcblxuICBNdWx0aXBsZVNlbGVjdGlvbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkc2VsZWN0aW9uID0gTXVsdGlwbGVTZWxlY3Rpb24uX19zdXBlcl9fLnJlbmRlci5jYWxsKHRoaXMpO1xuXG4gICAgJHNlbGVjdGlvbi5hZGRDbGFzcygnc2VsZWN0Mi1zZWxlY3Rpb24tLW11bHRpcGxlJyk7XG5cbiAgICAkc2VsZWN0aW9uLmh0bWwoXG4gICAgICAnPHVsIGNsYXNzPVwic2VsZWN0Mi1zZWxlY3Rpb25fX3JlbmRlcmVkXCI+PC91bD4nXG4gICAgKTtcblxuICAgIHJldHVybiAkc2VsZWN0aW9uO1xuICB9O1xuXG4gIE11bHRpcGxlU2VsZWN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgJGNvbnRhaW5lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIE11bHRpcGxlU2VsZWN0aW9uLl9fc3VwZXJfXy5iaW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLiRzZWxlY3Rpb24ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi50cmlnZ2VyKCd0b2dnbGUnLCB7XG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRzZWxlY3Rpb24ub24oXG4gICAgICAnY2xpY2snLFxuICAgICAgJy5zZWxlY3QyLXNlbGVjdGlvbl9fY2hvaWNlX19yZW1vdmUnLFxuICAgICAgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAvLyBJZ25vcmUgdGhlIGV2ZW50IGlmIGl0IGlzIGRpc2FibGVkXG4gICAgICAgIGlmIChzZWxmLm9wdGlvbnMuZ2V0KCdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRyZW1vdmUgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgJHNlbGVjdGlvbiA9ICRyZW1vdmUucGFyZW50KCk7XG5cbiAgICAgICAgdmFyIGRhdGEgPSAkc2VsZWN0aW9uLmRhdGEoJ2RhdGEnKTtcblxuICAgICAgICBzZWxmLnRyaWdnZXIoJ3Vuc2VsZWN0Jywge1xuICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dCxcbiAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgTXVsdGlwbGVTZWxlY3Rpb24ucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJHNlbGVjdGlvbi5maW5kKCcuc2VsZWN0Mi1zZWxlY3Rpb25fX3JlbmRlcmVkJykuZW1wdHkoKTtcbiAgfTtcblxuICBNdWx0aXBsZVNlbGVjdGlvbi5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uIChkYXRhLCBjb250YWluZXIpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLm9wdGlvbnMuZ2V0KCd0ZW1wbGF0ZVNlbGVjdGlvbicpO1xuICAgIHZhciBlc2NhcGVNYXJrdXAgPSB0aGlzLm9wdGlvbnMuZ2V0KCdlc2NhcGVNYXJrdXAnKTtcblxuICAgIHJldHVybiBlc2NhcGVNYXJrdXAodGVtcGxhdGUoZGF0YSwgY29udGFpbmVyKSk7XG4gIH07XG5cbiAgTXVsdGlwbGVTZWxlY3Rpb24ucHJvdG90eXBlLnNlbGVjdGlvbkNvbnRhaW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGNvbnRhaW5lciA9ICQoXG4gICAgICAnPGxpIGNsYXNzPVwic2VsZWN0Mi1zZWxlY3Rpb25fX2Nob2ljZVwiPicgK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJzZWxlY3QyLXNlbGVjdGlvbl9fY2hvaWNlX19yZW1vdmVcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+JyArXG4gICAgICAgICAgJyZ0aW1lczsnICtcbiAgICAgICAgJzwvc3Bhbj4nICtcbiAgICAgICc8L2xpPidcbiAgICApO1xuXG4gICAgcmV0dXJuICRjb250YWluZXI7XG4gIH07XG5cbiAgTXVsdGlwbGVTZWxlY3Rpb24ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy5jbGVhcigpO1xuXG4gICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyICRzZWxlY3Rpb25zID0gW107XG5cbiAgICBmb3IgKHZhciBkID0gMDsgZCA8IGRhdGEubGVuZ3RoOyBkKyspIHtcbiAgICAgIHZhciBzZWxlY3Rpb24gPSBkYXRhW2RdO1xuXG4gICAgICB2YXIgJHNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0aW9uQ29udGFpbmVyKCk7XG4gICAgICB2YXIgZm9ybWF0dGVkID0gdGhpcy5kaXNwbGF5KHNlbGVjdGlvbiwgJHNlbGVjdGlvbik7XG5cbiAgICAgICRzZWxlY3Rpb24uYXBwZW5kKGZvcm1hdHRlZCk7XG4gICAgICAkc2VsZWN0aW9uLnByb3AoJ3RpdGxlJywgc2VsZWN0aW9uLnRpdGxlIHx8IHNlbGVjdGlvbi50ZXh0KTtcblxuICAgICAgJHNlbGVjdGlvbi5kYXRhKCdkYXRhJywgc2VsZWN0aW9uKTtcblxuICAgICAgJHNlbGVjdGlvbnMucHVzaCgkc2VsZWN0aW9uKTtcbiAgICB9XG5cbiAgICB2YXIgJHJlbmRlcmVkID0gdGhpcy4kc2VsZWN0aW9uLmZpbmQoJy5zZWxlY3QyLXNlbGVjdGlvbl9fcmVuZGVyZWQnKTtcblxuICAgIFV0aWxzLmFwcGVuZE1hbnkoJHJlbmRlcmVkLCAkc2VsZWN0aW9ucyk7XG4gIH07XG5cbiAgcmV0dXJuIE11bHRpcGxlU2VsZWN0aW9uO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9zZWxlY3Rpb24vcGxhY2Vob2xkZXInLFtcbiAgJy4uL3V0aWxzJ1xuXSwgZnVuY3Rpb24gKFV0aWxzKSB7XG4gIGZ1bmN0aW9uIFBsYWNlaG9sZGVyIChkZWNvcmF0ZWQsICRlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5wbGFjZWhvbGRlciA9IHRoaXMubm9ybWFsaXplUGxhY2Vob2xkZXIob3B0aW9ucy5nZXQoJ3BsYWNlaG9sZGVyJykpO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgJGVsZW1lbnQsIG9wdGlvbnMpO1xuICB9XG5cbiAgUGxhY2Vob2xkZXIucHJvdG90eXBlLm5vcm1hbGl6ZVBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKF8sIHBsYWNlaG9sZGVyKSB7XG4gICAgaWYgKHR5cGVvZiBwbGFjZWhvbGRlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsYWNlaG9sZGVyID0ge1xuICAgICAgICBpZDogJycsXG4gICAgICAgIHRleHQ6IHBsYWNlaG9sZGVyXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBwbGFjZWhvbGRlcjtcbiAgfTtcblxuICBQbGFjZWhvbGRlci5wcm90b3R5cGUuY3JlYXRlUGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBwbGFjZWhvbGRlcikge1xuICAgIHZhciAkcGxhY2Vob2xkZXIgPSB0aGlzLnNlbGVjdGlvbkNvbnRhaW5lcigpO1xuXG4gICAgJHBsYWNlaG9sZGVyLmh0bWwodGhpcy5kaXNwbGF5KHBsYWNlaG9sZGVyKSk7XG4gICAgJHBsYWNlaG9sZGVyLmFkZENsYXNzKCdzZWxlY3QyLXNlbGVjdGlvbl9fcGxhY2Vob2xkZXInKVxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2VsZWN0Mi1zZWxlY3Rpb25fX2Nob2ljZScpO1xuXG4gICAgcmV0dXJuICRwbGFjZWhvbGRlcjtcbiAgfTtcblxuICBQbGFjZWhvbGRlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgZGF0YSkge1xuICAgIHZhciBzaW5nbGVQbGFjZWhvbGRlciA9IChcbiAgICAgIGRhdGEubGVuZ3RoID09IDEgJiYgZGF0YVswXS5pZCAhPSB0aGlzLnBsYWNlaG9sZGVyLmlkXG4gICAgKTtcbiAgICB2YXIgbXVsdGlwbGVTZWxlY3Rpb25zID0gZGF0YS5sZW5ndGggPiAxO1xuXG4gICAgaWYgKG11bHRpcGxlU2VsZWN0aW9ucyB8fCBzaW5nbGVQbGFjZWhvbGRlcikge1xuICAgICAgcmV0dXJuIGRlY29yYXRlZC5jYWxsKHRoaXMsIGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXIoKTtcblxuICAgIHZhciAkcGxhY2Vob2xkZXIgPSB0aGlzLmNyZWF0ZVBsYWNlaG9sZGVyKHRoaXMucGxhY2Vob2xkZXIpO1xuXG4gICAgdGhpcy4kc2VsZWN0aW9uLmZpbmQoJy5zZWxlY3QyLXNlbGVjdGlvbl9fcmVuZGVyZWQnKS5hcHBlbmQoJHBsYWNlaG9sZGVyKTtcbiAgfTtcblxuICByZXR1cm4gUGxhY2Vob2xkZXI7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL3NlbGVjdGlvbi9hbGxvd0NsZWFyJyxbXG4gICdqcXVlcnknLFxuICAnLi4va2V5cydcbl0sIGZ1bmN0aW9uICgkLCBLRVlTKSB7XG4gIGZ1bmN0aW9uIEFsbG93Q2xlYXIgKCkgeyB9XG5cbiAgQWxsb3dDbGVhci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIGNvbnRhaW5lciwgJGNvbnRhaW5lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIGNvbnRhaW5lciwgJGNvbnRhaW5lcik7XG5cbiAgICBpZiAodGhpcy5wbGFjZWhvbGRlciA9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmdldCgnZGVidWcnKSAmJiB3aW5kb3cuY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgJ1NlbGVjdDI6IFRoZSBgYWxsb3dDbGVhcmAgb3B0aW9uIHNob3VsZCBiZSB1c2VkIGluIGNvbWJpbmF0aW9uICcgK1xuICAgICAgICAgICd3aXRoIHRoZSBgcGxhY2Vob2xkZXJgIG9wdGlvbi4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy4kc2VsZWN0aW9uLm9uKCdtb3VzZWRvd24nLCAnLnNlbGVjdDItc2VsZWN0aW9uX19jbGVhcicsXG4gICAgICBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHNlbGYuX2hhbmRsZUNsZWFyKGV2dCk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi5faGFuZGxlS2V5Ym9hcmRDbGVhcihldnQsIGNvbnRhaW5lcik7XG4gICAgfSk7XG4gIH07XG5cbiAgQWxsb3dDbGVhci5wcm90b3R5cGUuX2hhbmRsZUNsZWFyID0gZnVuY3Rpb24gKF8sIGV2dCkge1xuICAgIC8vIElnbm9yZSB0aGUgZXZlbnQgaWYgaXQgaXMgZGlzYWJsZWRcbiAgICBpZiAodGhpcy5vcHRpb25zLmdldCgnZGlzYWJsZWQnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciAkY2xlYXIgPSB0aGlzLiRzZWxlY3Rpb24uZmluZCgnLnNlbGVjdDItc2VsZWN0aW9uX19jbGVhcicpO1xuXG4gICAgLy8gSWdub3JlIHRoZSBldmVudCBpZiBub3RoaW5nIGhhcyBiZWVuIHNlbGVjdGVkXG4gICAgaWYgKCRjbGVhci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICB2YXIgZGF0YSA9ICRjbGVhci5kYXRhKCdkYXRhJyk7XG5cbiAgICBmb3IgKHZhciBkID0gMDsgZCA8IGRhdGEubGVuZ3RoOyBkKyspIHtcbiAgICAgIHZhciB1bnNlbGVjdERhdGEgPSB7XG4gICAgICAgIGRhdGE6IGRhdGFbZF1cbiAgICAgIH07XG5cbiAgICAgIC8vIFRyaWdnZXIgdGhlIGB1bnNlbGVjdGAgZXZlbnQsIHNvIHBlb3BsZSBjYW4gcHJldmVudCBpdCBmcm9tIGJlaW5nXG4gICAgICAvLyBjbGVhcmVkLlxuICAgICAgdGhpcy50cmlnZ2VyKCd1bnNlbGVjdCcsIHVuc2VsZWN0RGF0YSk7XG5cbiAgICAgIC8vIElmIHRoZSBldmVudCB3YXMgcHJldmVudGVkLCBkb24ndCBjbGVhciBpdCBvdXQuXG4gICAgICBpZiAodW5zZWxlY3REYXRhLnByZXZlbnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC52YWwodGhpcy5wbGFjZWhvbGRlci5pZCkudHJpZ2dlcignY2hhbmdlJyk7XG5cbiAgICB0aGlzLnRyaWdnZXIoJ3RvZ2dsZScsIHt9KTtcbiAgfTtcblxuICBBbGxvd0NsZWFyLnByb3RvdHlwZS5faGFuZGxlS2V5Ym9hcmRDbGVhciA9IGZ1bmN0aW9uIChfLCBldnQsIGNvbnRhaW5lcikge1xuICAgIGlmIChjb250YWluZXIuaXNPcGVuKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXZ0LndoaWNoID09IEtFWVMuREVMRVRFIHx8IGV2dC53aGljaCA9PSBLRVlTLkJBQ0tTUEFDRSkge1xuICAgICAgdGhpcy5faGFuZGxlQ2xlYXIoZXZ0KTtcbiAgICB9XG4gIH07XG5cbiAgQWxsb3dDbGVhci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgZGF0YSkge1xuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIGRhdGEpO1xuXG4gICAgaWYgKHRoaXMuJHNlbGVjdGlvbi5maW5kKCcuc2VsZWN0Mi1zZWxlY3Rpb25fX3BsYWNlaG9sZGVyJykubGVuZ3RoID4gMCB8fFxuICAgICAgICBkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciAkcmVtb3ZlID0gJChcbiAgICAgICc8c3BhbiBjbGFzcz1cInNlbGVjdDItc2VsZWN0aW9uX19jbGVhclwiPicgK1xuICAgICAgICAnJnRpbWVzOycgK1xuICAgICAgJzwvc3Bhbj4nXG4gICAgKTtcbiAgICAkcmVtb3ZlLmRhdGEoJ2RhdGEnLCBkYXRhKTtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5maW5kKCcuc2VsZWN0Mi1zZWxlY3Rpb25fX3JlbmRlcmVkJykucHJlcGVuZCgkcmVtb3ZlKTtcbiAgfTtcblxuICByZXR1cm4gQWxsb3dDbGVhcjtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvc2VsZWN0aW9uL3NlYXJjaCcsW1xuICAnanF1ZXJ5JyxcbiAgJy4uL3V0aWxzJyxcbiAgJy4uL2tleXMnXG5dLCBmdW5jdGlvbiAoJCwgVXRpbHMsIEtFWVMpIHtcbiAgZnVuY3Rpb24gU2VhcmNoIChkZWNvcmF0ZWQsICRlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgJGVsZW1lbnQsIG9wdGlvbnMpO1xuICB9XG5cbiAgU2VhcmNoLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoZGVjb3JhdGVkKSB7XG4gICAgdmFyICRzZWFyY2ggPSAkKFxuICAgICAgJzxsaSBjbGFzcz1cInNlbGVjdDItc2VhcmNoIHNlbGVjdDItc2VhcmNoLS1pbmxpbmVcIj4nICtcbiAgICAgICAgJzxpbnB1dCBjbGFzcz1cInNlbGVjdDItc2VhcmNoX19maWVsZFwiIHR5cGU9XCJzZWFyY2hcIiB0YWJpbmRleD1cIi0xXCInICtcbiAgICAgICAgJyBhdXRvY29tcGxldGU9XCJvZmZcIiBhdXRvY29ycmVjdD1cIm9mZlwiIGF1dG9jYXBpdGFsaXplPVwib2ZmXCInICtcbiAgICAgICAgJyBzcGVsbGNoZWNrPVwiZmFsc2VcIiByb2xlPVwidGV4dGJveFwiIGFyaWEtYXV0b2NvbXBsZXRlPVwibGlzdFwiIC8+JyArXG4gICAgICAnPC9saT4nXG4gICAgKTtcblxuICAgIHRoaXMuJHNlYXJjaENvbnRhaW5lciA9ICRzZWFyY2g7XG4gICAgdGhpcy4kc2VhcmNoID0gJHNlYXJjaC5maW5kKCdpbnB1dCcpO1xuXG4gICAgdmFyICRyZW5kZXJlZCA9IGRlY29yYXRlZC5jYWxsKHRoaXMpO1xuXG4gICAgdGhpcy5fdHJhbnNmZXJUYWJJbmRleCgpO1xuXG4gICAgcmV0dXJuICRyZW5kZXJlZDtcbiAgfTtcblxuICBTZWFyY2gucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBjb250YWluZXIsICRjb250YWluZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCBjb250YWluZXIsICRjb250YWluZXIpO1xuXG4gICAgY29udGFpbmVyLm9uKCdvcGVuJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi4kc2VhcmNoLnRyaWdnZXIoJ2ZvY3VzJyk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi4kc2VhcmNoLnZhbCgnJyk7XG4gICAgICBzZWxmLiRzZWFyY2gucmVtb3ZlQXR0cignYXJpYS1hY3RpdmVkZXNjZW5kYW50Jyk7XG4gICAgICBzZWxmLiRzZWFyY2gudHJpZ2dlcignZm9jdXMnKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbignZW5hYmxlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi4kc2VhcmNoLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXG4gICAgICBzZWxmLl90cmFuc2ZlclRhYkluZGV4KCk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2Rpc2FibGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLiRzZWFyY2gucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbignZm9jdXMnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICBzZWxmLiRzZWFyY2gudHJpZ2dlcignZm9jdXMnKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbigncmVzdWx0czpmb2N1cycsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgIHNlbGYuJHNlYXJjaC5hdHRyKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnLCBwYXJhbXMuaWQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy4kc2VsZWN0aW9uLm9uKCdmb2N1c2luJywgJy5zZWxlY3QyLXNlYXJjaC0taW5saW5lJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi50cmlnZ2VyKCdmb2N1cycsIGV2dCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRzZWxlY3Rpb24ub24oJ2ZvY3Vzb3V0JywgJy5zZWxlY3QyLXNlYXJjaC0taW5saW5lJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi5faGFuZGxlQmx1cihldnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy4kc2VsZWN0aW9uLm9uKCdrZXlkb3duJywgJy5zZWxlY3QyLXNlYXJjaC0taW5saW5lJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICBzZWxmLnRyaWdnZXIoJ2tleXByZXNzJywgZXZ0KTtcblxuICAgICAgc2VsZi5fa2V5VXBQcmV2ZW50ZWQgPSBldnQuaXNEZWZhdWx0UHJldmVudGVkKCk7XG5cbiAgICAgIHZhciBrZXkgPSBldnQud2hpY2g7XG5cbiAgICAgIGlmIChrZXkgPT09IEtFWVMuQkFDS1NQQUNFICYmIHNlbGYuJHNlYXJjaC52YWwoKSA9PT0gJycpIHtcbiAgICAgICAgdmFyICRwcmV2aW91c0Nob2ljZSA9IHNlbGYuJHNlYXJjaENvbnRhaW5lclxuICAgICAgICAgIC5wcmV2KCcuc2VsZWN0Mi1zZWxlY3Rpb25fX2Nob2ljZScpO1xuXG4gICAgICAgIGlmICgkcHJldmlvdXNDaG9pY2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHZhciBpdGVtID0gJHByZXZpb3VzQ2hvaWNlLmRhdGEoJ2RhdGEnKTtcblxuICAgICAgICAgIHNlbGYuc2VhcmNoUmVtb3ZlQ2hvaWNlKGl0ZW0pO1xuXG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRyeSB0byBkZXRlY3QgdGhlIElFIHZlcnNpb24gc2hvdWxkIHRoZSBgZG9jdW1lbnRNb2RlYCBwcm9wZXJ0eSB0aGF0XG4gICAgLy8gaXMgc3RvcmVkIG9uIHRoZSBkb2N1bWVudC4gVGhpcyBpcyBvbmx5IGltcGxlbWVudGVkIGluIElFIGFuZCBpc1xuICAgIC8vIHNsaWdodGx5IGNsZWFuZXIgdGhhbiBkb2luZyBhIHVzZXIgYWdlbnQgY2hlY2suXG4gICAgLy8gVGhpcyBwcm9wZXJ0eSBpcyBub3QgYXZhaWxhYmxlIGluIEVkZ2UsIGJ1dCBFZGdlIGFsc28gZG9lc24ndCBoYXZlXG4gICAgLy8gdGhpcyBidWcuXG4gICAgdmFyIG1zaWUgPSBkb2N1bWVudC5kb2N1bWVudE1vZGU7XG4gICAgdmFyIGRpc2FibGVJbnB1dEV2ZW50cyA9IG1zaWUgJiYgbXNpZSA8PSAxMTtcblxuICAgIC8vIFdvcmthcm91bmQgZm9yIGJyb3dzZXJzIHdoaWNoIGRvIG5vdCBzdXBwb3J0IHRoZSBgaW5wdXRgIGV2ZW50XG4gICAgLy8gVGhpcyB3aWxsIHByZXZlbnQgZG91YmxlLXRyaWdnZXJpbmcgb2YgZXZlbnRzIGZvciBicm93c2VycyB3aGljaCBzdXBwb3J0XG4gICAgLy8gYm90aCB0aGUgYGtleXVwYCBhbmQgYGlucHV0YCBldmVudHMuXG4gICAgdGhpcy4kc2VsZWN0aW9uLm9uKFxuICAgICAgJ2lucHV0LnNlYXJjaGNoZWNrJyxcbiAgICAgICcuc2VsZWN0Mi1zZWFyY2gtLWlubGluZScsXG4gICAgICBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIC8vIElFIHdpbGwgdHJpZ2dlciB0aGUgYGlucHV0YCBldmVudCB3aGVuIGEgcGxhY2Vob2xkZXIgaXMgdXNlZCBvbiBhXG4gICAgICAgIC8vIHNlYXJjaCBib3guIFRvIGdldCBhcm91bmQgdGhpcyBpc3N1ZSwgd2UgYXJlIGZvcmNlZCB0byBpZ25vcmUgYWxsXG4gICAgICAgIC8vIGBpbnB1dGAgZXZlbnRzIGluIElFIGFuZCBrZWVwIHVzaW5nIGBrZXl1cGAuXG4gICAgICAgIGlmIChkaXNhYmxlSW5wdXRFdmVudHMpIHtcbiAgICAgICAgICBzZWxmLiRzZWxlY3Rpb24ub2ZmKCdpbnB1dC5zZWFyY2ggaW5wdXQuc2VhcmNoY2hlY2snKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVbmJpbmQgdGhlIGR1cGxpY2F0ZWQgYGtleXVwYCBldmVudFxuICAgICAgICBzZWxmLiRzZWxlY3Rpb24ub2ZmKCdrZXl1cC5zZWFyY2gnKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgdGhpcy4kc2VsZWN0aW9uLm9uKFxuICAgICAgJ2tleXVwLnNlYXJjaCBpbnB1dC5zZWFyY2gnLFxuICAgICAgJy5zZWxlY3QyLXNlYXJjaC0taW5saW5lJyxcbiAgICAgIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgLy8gSUUgd2lsbCB0cmlnZ2VyIHRoZSBgaW5wdXRgIGV2ZW50IHdoZW4gYSBwbGFjZWhvbGRlciBpcyB1c2VkIG9uIGFcbiAgICAgICAgLy8gc2VhcmNoIGJveC4gVG8gZ2V0IGFyb3VuZCB0aGlzIGlzc3VlLCB3ZSBhcmUgZm9yY2VkIHRvIGlnbm9yZSBhbGxcbiAgICAgICAgLy8gYGlucHV0YCBldmVudHMgaW4gSUUgYW5kIGtlZXAgdXNpbmcgYGtleXVwYC5cbiAgICAgICAgaWYgKGRpc2FibGVJbnB1dEV2ZW50cyAmJiBldnQudHlwZSA9PT0gJ2lucHV0Jykge1xuICAgICAgICAgIHNlbGYuJHNlbGVjdGlvbi5vZmYoJ2lucHV0LnNlYXJjaCBpbnB1dC5zZWFyY2hjaGVjaycpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXkgPSBldnQud2hpY2g7XG5cbiAgICAgICAgLy8gV2UgY2FuIGZyZWVseSBpZ25vcmUgZXZlbnRzIGZyb20gbW9kaWZpZXIga2V5c1xuICAgICAgICBpZiAoa2V5ID09IEtFWVMuU0hJRlQgfHwga2V5ID09IEtFWVMuQ1RSTCB8fCBrZXkgPT0gS0VZUy5BTFQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWJiaW5nIHdpbGwgYmUgaGFuZGxlZCBkdXJpbmcgdGhlIGBrZXlkb3duYCBwaGFzZVxuICAgICAgICBpZiAoa2V5ID09IEtFWVMuVEFCKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5oYW5kbGVTZWFyY2goZXZ0KTtcbiAgICAgIH1cbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCB3aWxsIHRyYW5zZmVyIHRoZSB0YWJpbmRleCBhdHRyaWJ1dGUgZnJvbSB0aGUgcmVuZGVyZWRcbiAgICogc2VsZWN0aW9uIHRvIHRoZSBzZWFyY2ggYm94LiBUaGlzIGFsbG93cyBmb3IgdGhlIHNlYXJjaCBib3ggdG8gYmUgdXNlZCBhc1xuICAgKiB0aGUgcHJpbWFyeSBmb2N1cyBpbnN0ZWFkIG9mIHRoZSBzZWxlY3Rpb24gY29udGFpbmVyLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgU2VhcmNoLnByb3RvdHlwZS5fdHJhbnNmZXJUYWJJbmRleCA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQpIHtcbiAgICB0aGlzLiRzZWFyY2guYXR0cigndGFiaW5kZXgnLCB0aGlzLiRzZWxlY3Rpb24uYXR0cigndGFiaW5kZXgnKSk7XG4gICAgdGhpcy4kc2VsZWN0aW9uLmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG4gIH07XG5cbiAgU2VhcmNoLnByb3RvdHlwZS5jcmVhdGVQbGFjZWhvbGRlciA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIHBsYWNlaG9sZGVyKSB7XG4gICAgdGhpcy4kc2VhcmNoLmF0dHIoJ3BsYWNlaG9sZGVyJywgcGxhY2Vob2xkZXIudGV4dCk7XG4gIH07XG5cbiAgU2VhcmNoLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBkYXRhKSB7XG4gICAgdmFyIHNlYXJjaEhhZEZvY3VzID0gdGhpcy4kc2VhcmNoWzBdID09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICB0aGlzLiRzZWFyY2guYXR0cigncGxhY2Vob2xkZXInLCAnJyk7XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCBkYXRhKTtcblxuICAgIHRoaXMuJHNlbGVjdGlvbi5maW5kKCcuc2VsZWN0Mi1zZWxlY3Rpb25fX3JlbmRlcmVkJylcbiAgICAgICAgICAgICAgICAgICAuYXBwZW5kKHRoaXMuJHNlYXJjaENvbnRhaW5lcik7XG5cbiAgICB0aGlzLnJlc2l6ZVNlYXJjaCgpO1xuICAgIGlmIChzZWFyY2hIYWRGb2N1cykge1xuICAgICAgdGhpcy4kc2VhcmNoLmZvY3VzKCk7XG4gICAgfVxuICB9O1xuXG4gIFNlYXJjaC5wcm90b3R5cGUuaGFuZGxlU2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVzaXplU2VhcmNoKCk7XG5cbiAgICBpZiAoIXRoaXMuX2tleVVwUHJldmVudGVkKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiRzZWFyY2gudmFsKCk7XG5cbiAgICAgIHRoaXMudHJpZ2dlcigncXVlcnknLCB7XG4gICAgICAgIHRlcm06IGlucHV0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9rZXlVcFByZXZlbnRlZCA9IGZhbHNlO1xuICB9O1xuXG4gIFNlYXJjaC5wcm90b3R5cGUuc2VhcmNoUmVtb3ZlQ2hvaWNlID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgaXRlbSkge1xuICAgIHRoaXMudHJpZ2dlcigndW5zZWxlY3QnLCB7XG4gICAgICBkYXRhOiBpdGVtXG4gICAgfSk7XG5cbiAgICB0aGlzLiRzZWFyY2gudmFsKGl0ZW0udGV4dCk7XG4gICAgdGhpcy5oYW5kbGVTZWFyY2goKTtcbiAgfTtcblxuICBTZWFyY2gucHJvdG90eXBlLnJlc2l6ZVNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRzZWFyY2guY3NzKCd3aWR0aCcsICcyNXB4Jyk7XG5cbiAgICB2YXIgd2lkdGggPSAnJztcblxuICAgIGlmICh0aGlzLiRzZWFyY2guYXR0cigncGxhY2Vob2xkZXInKSAhPT0gJycpIHtcbiAgICAgIHdpZHRoID0gdGhpcy4kc2VsZWN0aW9uLmZpbmQoJy5zZWxlY3QyLXNlbGVjdGlvbl9fcmVuZGVyZWQnKS5pbm5lcldpZHRoKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtaW5pbXVtV2lkdGggPSB0aGlzLiRzZWFyY2gudmFsKCkubGVuZ3RoICsgMTtcblxuICAgICAgd2lkdGggPSAobWluaW11bVdpZHRoICogMC43NSkgKyAnZW0nO1xuICAgIH1cblxuICAgIHRoaXMuJHNlYXJjaC5jc3MoJ3dpZHRoJywgd2lkdGgpO1xuICB9O1xuXG4gIHJldHVybiBTZWFyY2g7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL3NlbGVjdGlvbi9ldmVudFJlbGF5JyxbXG4gICdqcXVlcnknXG5dLCBmdW5jdGlvbiAoJCkge1xuICBmdW5jdGlvbiBFdmVudFJlbGF5ICgpIHsgfVxuXG4gIEV2ZW50UmVsYXkucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBjb250YWluZXIsICRjb250YWluZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHJlbGF5RXZlbnRzID0gW1xuICAgICAgJ29wZW4nLCAnb3BlbmluZycsXG4gICAgICAnY2xvc2UnLCAnY2xvc2luZycsXG4gICAgICAnc2VsZWN0JywgJ3NlbGVjdGluZycsXG4gICAgICAndW5zZWxlY3QnLCAndW5zZWxlY3RpbmcnXG4gICAgXTtcblxuICAgIHZhciBwcmV2ZW50YWJsZUV2ZW50cyA9IFsnb3BlbmluZycsICdjbG9zaW5nJywgJ3NlbGVjdGluZycsICd1bnNlbGVjdGluZyddO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY29udGFpbmVyLCAkY29udGFpbmVyKTtcblxuICAgIGNvbnRhaW5lci5vbignKicsIGZ1bmN0aW9uIChuYW1lLCBwYXJhbXMpIHtcbiAgICAgIC8vIElnbm9yZSBldmVudHMgdGhhdCBzaG91bGQgbm90IGJlIHJlbGF5ZWRcbiAgICAgIGlmICgkLmluQXJyYXkobmFtZSwgcmVsYXlFdmVudHMpID09PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBwYXJhbWV0ZXJzIHNob3VsZCBhbHdheXMgYmUgYW4gb2JqZWN0XG4gICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG5cbiAgICAgIC8vIEdlbmVyYXRlIHRoZSBqUXVlcnkgZXZlbnQgZm9yIHRoZSBTZWxlY3QyIGV2ZW50XG4gICAgICB2YXIgZXZ0ID0gJC5FdmVudCgnc2VsZWN0MjonICsgbmFtZSwge1xuICAgICAgICBwYXJhbXM6IHBhcmFtc1xuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuJGVsZW1lbnQudHJpZ2dlcihldnQpO1xuXG4gICAgICAvLyBPbmx5IGhhbmRsZSBwcmV2ZW50YWJsZSBldmVudHMgaWYgaXQgd2FzIG9uZVxuICAgICAgaWYgKCQuaW5BcnJheShuYW1lLCBwcmV2ZW50YWJsZUV2ZW50cykgPT09IC0xKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcGFyYW1zLnByZXZlbnRlZCA9IGV2dC5pc0RlZmF1bHRQcmV2ZW50ZWQoKTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gRXZlbnRSZWxheTtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvdHJhbnNsYXRpb24nLFtcbiAgJ2pxdWVyeScsXG4gICdyZXF1aXJlJ1xuXSwgZnVuY3Rpb24gKCQsIHJlcXVpcmUpIHtcbiAgZnVuY3Rpb24gVHJhbnNsYXRpb24gKGRpY3QpIHtcbiAgICB0aGlzLmRpY3QgPSBkaWN0IHx8IHt9O1xuICB9XG5cbiAgVHJhbnNsYXRpb24ucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaWN0O1xuICB9O1xuXG4gIFRyYW5zbGF0aW9uLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGljdFtrZXldO1xuICB9O1xuXG4gIFRyYW5zbGF0aW9uLnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbiAodHJhbnNsYXRpb24pIHtcbiAgICB0aGlzLmRpY3QgPSAkLmV4dGVuZCh7fSwgdHJhbnNsYXRpb24uYWxsKCksIHRoaXMuZGljdCk7XG4gIH07XG5cbiAgLy8gU3RhdGljIGZ1bmN0aW9uc1xuXG4gIFRyYW5zbGF0aW9uLl9jYWNoZSA9IHt9O1xuXG4gIFRyYW5zbGF0aW9uLmxvYWRQYXRoID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICBpZiAoIShwYXRoIGluIFRyYW5zbGF0aW9uLl9jYWNoZSkpIHtcbiAgICAgIHZhciB0cmFuc2xhdGlvbnMgPSByZXF1aXJlKHBhdGgpO1xuXG4gICAgICBUcmFuc2xhdGlvbi5fY2FjaGVbcGF0aF0gPSB0cmFuc2xhdGlvbnM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUcmFuc2xhdGlvbihUcmFuc2xhdGlvbi5fY2FjaGVbcGF0aF0pO1xuICB9O1xuXG4gIHJldHVybiBUcmFuc2xhdGlvbjtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvZGlhY3JpdGljcycsW1xuXG5dLCBmdW5jdGlvbiAoKSB7XG4gIHZhciBkaWFjcml0aWNzID0ge1xuICAgICdcXHUyNEI2JzogJ0EnLFxuICAgICdcXHVGRjIxJzogJ0EnLFxuICAgICdcXHUwMEMwJzogJ0EnLFxuICAgICdcXHUwMEMxJzogJ0EnLFxuICAgICdcXHUwMEMyJzogJ0EnLFxuICAgICdcXHUxRUE2JzogJ0EnLFxuICAgICdcXHUxRUE0JzogJ0EnLFxuICAgICdcXHUxRUFBJzogJ0EnLFxuICAgICdcXHUxRUE4JzogJ0EnLFxuICAgICdcXHUwMEMzJzogJ0EnLFxuICAgICdcXHUwMTAwJzogJ0EnLFxuICAgICdcXHUwMTAyJzogJ0EnLFxuICAgICdcXHUxRUIwJzogJ0EnLFxuICAgICdcXHUxRUFFJzogJ0EnLFxuICAgICdcXHUxRUI0JzogJ0EnLFxuICAgICdcXHUxRUIyJzogJ0EnLFxuICAgICdcXHUwMjI2JzogJ0EnLFxuICAgICdcXHUwMUUwJzogJ0EnLFxuICAgICdcXHUwMEM0JzogJ0EnLFxuICAgICdcXHUwMURFJzogJ0EnLFxuICAgICdcXHUxRUEyJzogJ0EnLFxuICAgICdcXHUwMEM1JzogJ0EnLFxuICAgICdcXHUwMUZBJzogJ0EnLFxuICAgICdcXHUwMUNEJzogJ0EnLFxuICAgICdcXHUwMjAwJzogJ0EnLFxuICAgICdcXHUwMjAyJzogJ0EnLFxuICAgICdcXHUxRUEwJzogJ0EnLFxuICAgICdcXHUxRUFDJzogJ0EnLFxuICAgICdcXHUxRUI2JzogJ0EnLFxuICAgICdcXHUxRTAwJzogJ0EnLFxuICAgICdcXHUwMTA0JzogJ0EnLFxuICAgICdcXHUwMjNBJzogJ0EnLFxuICAgICdcXHUyQzZGJzogJ0EnLFxuICAgICdcXHVBNzMyJzogJ0FBJyxcbiAgICAnXFx1MDBDNic6ICdBRScsXG4gICAgJ1xcdTAxRkMnOiAnQUUnLFxuICAgICdcXHUwMUUyJzogJ0FFJyxcbiAgICAnXFx1QTczNCc6ICdBTycsXG4gICAgJ1xcdUE3MzYnOiAnQVUnLFxuICAgICdcXHVBNzM4JzogJ0FWJyxcbiAgICAnXFx1QTczQSc6ICdBVicsXG4gICAgJ1xcdUE3M0MnOiAnQVknLFxuICAgICdcXHUyNEI3JzogJ0InLFxuICAgICdcXHVGRjIyJzogJ0InLFxuICAgICdcXHUxRTAyJzogJ0InLFxuICAgICdcXHUxRTA0JzogJ0InLFxuICAgICdcXHUxRTA2JzogJ0InLFxuICAgICdcXHUwMjQzJzogJ0InLFxuICAgICdcXHUwMTgyJzogJ0InLFxuICAgICdcXHUwMTgxJzogJ0InLFxuICAgICdcXHUyNEI4JzogJ0MnLFxuICAgICdcXHVGRjIzJzogJ0MnLFxuICAgICdcXHUwMTA2JzogJ0MnLFxuICAgICdcXHUwMTA4JzogJ0MnLFxuICAgICdcXHUwMTBBJzogJ0MnLFxuICAgICdcXHUwMTBDJzogJ0MnLFxuICAgICdcXHUwMEM3JzogJ0MnLFxuICAgICdcXHUxRTA4JzogJ0MnLFxuICAgICdcXHUwMTg3JzogJ0MnLFxuICAgICdcXHUwMjNCJzogJ0MnLFxuICAgICdcXHVBNzNFJzogJ0MnLFxuICAgICdcXHUyNEI5JzogJ0QnLFxuICAgICdcXHVGRjI0JzogJ0QnLFxuICAgICdcXHUxRTBBJzogJ0QnLFxuICAgICdcXHUwMTBFJzogJ0QnLFxuICAgICdcXHUxRTBDJzogJ0QnLFxuICAgICdcXHUxRTEwJzogJ0QnLFxuICAgICdcXHUxRTEyJzogJ0QnLFxuICAgICdcXHUxRTBFJzogJ0QnLFxuICAgICdcXHUwMTEwJzogJ0QnLFxuICAgICdcXHUwMThCJzogJ0QnLFxuICAgICdcXHUwMThBJzogJ0QnLFxuICAgICdcXHUwMTg5JzogJ0QnLFxuICAgICdcXHVBNzc5JzogJ0QnLFxuICAgICdcXHUwMUYxJzogJ0RaJyxcbiAgICAnXFx1MDFDNCc6ICdEWicsXG4gICAgJ1xcdTAxRjInOiAnRHonLFxuICAgICdcXHUwMUM1JzogJ0R6JyxcbiAgICAnXFx1MjRCQSc6ICdFJyxcbiAgICAnXFx1RkYyNSc6ICdFJyxcbiAgICAnXFx1MDBDOCc6ICdFJyxcbiAgICAnXFx1MDBDOSc6ICdFJyxcbiAgICAnXFx1MDBDQSc6ICdFJyxcbiAgICAnXFx1MUVDMCc6ICdFJyxcbiAgICAnXFx1MUVCRSc6ICdFJyxcbiAgICAnXFx1MUVDNCc6ICdFJyxcbiAgICAnXFx1MUVDMic6ICdFJyxcbiAgICAnXFx1MUVCQyc6ICdFJyxcbiAgICAnXFx1MDExMic6ICdFJyxcbiAgICAnXFx1MUUxNCc6ICdFJyxcbiAgICAnXFx1MUUxNic6ICdFJyxcbiAgICAnXFx1MDExNCc6ICdFJyxcbiAgICAnXFx1MDExNic6ICdFJyxcbiAgICAnXFx1MDBDQic6ICdFJyxcbiAgICAnXFx1MUVCQSc6ICdFJyxcbiAgICAnXFx1MDExQSc6ICdFJyxcbiAgICAnXFx1MDIwNCc6ICdFJyxcbiAgICAnXFx1MDIwNic6ICdFJyxcbiAgICAnXFx1MUVCOCc6ICdFJyxcbiAgICAnXFx1MUVDNic6ICdFJyxcbiAgICAnXFx1MDIyOCc6ICdFJyxcbiAgICAnXFx1MUUxQyc6ICdFJyxcbiAgICAnXFx1MDExOCc6ICdFJyxcbiAgICAnXFx1MUUxOCc6ICdFJyxcbiAgICAnXFx1MUUxQSc6ICdFJyxcbiAgICAnXFx1MDE5MCc6ICdFJyxcbiAgICAnXFx1MDE4RSc6ICdFJyxcbiAgICAnXFx1MjRCQic6ICdGJyxcbiAgICAnXFx1RkYyNic6ICdGJyxcbiAgICAnXFx1MUUxRSc6ICdGJyxcbiAgICAnXFx1MDE5MSc6ICdGJyxcbiAgICAnXFx1QTc3Qic6ICdGJyxcbiAgICAnXFx1MjRCQyc6ICdHJyxcbiAgICAnXFx1RkYyNyc6ICdHJyxcbiAgICAnXFx1MDFGNCc6ICdHJyxcbiAgICAnXFx1MDExQyc6ICdHJyxcbiAgICAnXFx1MUUyMCc6ICdHJyxcbiAgICAnXFx1MDExRSc6ICdHJyxcbiAgICAnXFx1MDEyMCc6ICdHJyxcbiAgICAnXFx1MDFFNic6ICdHJyxcbiAgICAnXFx1MDEyMic6ICdHJyxcbiAgICAnXFx1MDFFNCc6ICdHJyxcbiAgICAnXFx1MDE5Myc6ICdHJyxcbiAgICAnXFx1QTdBMCc6ICdHJyxcbiAgICAnXFx1QTc3RCc6ICdHJyxcbiAgICAnXFx1QTc3RSc6ICdHJyxcbiAgICAnXFx1MjRCRCc6ICdIJyxcbiAgICAnXFx1RkYyOCc6ICdIJyxcbiAgICAnXFx1MDEyNCc6ICdIJyxcbiAgICAnXFx1MUUyMic6ICdIJyxcbiAgICAnXFx1MUUyNic6ICdIJyxcbiAgICAnXFx1MDIxRSc6ICdIJyxcbiAgICAnXFx1MUUyNCc6ICdIJyxcbiAgICAnXFx1MUUyOCc6ICdIJyxcbiAgICAnXFx1MUUyQSc6ICdIJyxcbiAgICAnXFx1MDEyNic6ICdIJyxcbiAgICAnXFx1MkM2Nyc6ICdIJyxcbiAgICAnXFx1MkM3NSc6ICdIJyxcbiAgICAnXFx1QTc4RCc6ICdIJyxcbiAgICAnXFx1MjRCRSc6ICdJJyxcbiAgICAnXFx1RkYyOSc6ICdJJyxcbiAgICAnXFx1MDBDQyc6ICdJJyxcbiAgICAnXFx1MDBDRCc6ICdJJyxcbiAgICAnXFx1MDBDRSc6ICdJJyxcbiAgICAnXFx1MDEyOCc6ICdJJyxcbiAgICAnXFx1MDEyQSc6ICdJJyxcbiAgICAnXFx1MDEyQyc6ICdJJyxcbiAgICAnXFx1MDEzMCc6ICdJJyxcbiAgICAnXFx1MDBDRic6ICdJJyxcbiAgICAnXFx1MUUyRSc6ICdJJyxcbiAgICAnXFx1MUVDOCc6ICdJJyxcbiAgICAnXFx1MDFDRic6ICdJJyxcbiAgICAnXFx1MDIwOCc6ICdJJyxcbiAgICAnXFx1MDIwQSc6ICdJJyxcbiAgICAnXFx1MUVDQSc6ICdJJyxcbiAgICAnXFx1MDEyRSc6ICdJJyxcbiAgICAnXFx1MUUyQyc6ICdJJyxcbiAgICAnXFx1MDE5Nyc6ICdJJyxcbiAgICAnXFx1MjRCRic6ICdKJyxcbiAgICAnXFx1RkYyQSc6ICdKJyxcbiAgICAnXFx1MDEzNCc6ICdKJyxcbiAgICAnXFx1MDI0OCc6ICdKJyxcbiAgICAnXFx1MjRDMCc6ICdLJyxcbiAgICAnXFx1RkYyQic6ICdLJyxcbiAgICAnXFx1MUUzMCc6ICdLJyxcbiAgICAnXFx1MDFFOCc6ICdLJyxcbiAgICAnXFx1MUUzMic6ICdLJyxcbiAgICAnXFx1MDEzNic6ICdLJyxcbiAgICAnXFx1MUUzNCc6ICdLJyxcbiAgICAnXFx1MDE5OCc6ICdLJyxcbiAgICAnXFx1MkM2OSc6ICdLJyxcbiAgICAnXFx1QTc0MCc6ICdLJyxcbiAgICAnXFx1QTc0Mic6ICdLJyxcbiAgICAnXFx1QTc0NCc6ICdLJyxcbiAgICAnXFx1QTdBMic6ICdLJyxcbiAgICAnXFx1MjRDMSc6ICdMJyxcbiAgICAnXFx1RkYyQyc6ICdMJyxcbiAgICAnXFx1MDEzRic6ICdMJyxcbiAgICAnXFx1MDEzOSc6ICdMJyxcbiAgICAnXFx1MDEzRCc6ICdMJyxcbiAgICAnXFx1MUUzNic6ICdMJyxcbiAgICAnXFx1MUUzOCc6ICdMJyxcbiAgICAnXFx1MDEzQic6ICdMJyxcbiAgICAnXFx1MUUzQyc6ICdMJyxcbiAgICAnXFx1MUUzQSc6ICdMJyxcbiAgICAnXFx1MDE0MSc6ICdMJyxcbiAgICAnXFx1MDIzRCc6ICdMJyxcbiAgICAnXFx1MkM2Mic6ICdMJyxcbiAgICAnXFx1MkM2MCc6ICdMJyxcbiAgICAnXFx1QTc0OCc6ICdMJyxcbiAgICAnXFx1QTc0Nic6ICdMJyxcbiAgICAnXFx1QTc4MCc6ICdMJyxcbiAgICAnXFx1MDFDNyc6ICdMSicsXG4gICAgJ1xcdTAxQzgnOiAnTGonLFxuICAgICdcXHUyNEMyJzogJ00nLFxuICAgICdcXHVGRjJEJzogJ00nLFxuICAgICdcXHUxRTNFJzogJ00nLFxuICAgICdcXHUxRTQwJzogJ00nLFxuICAgICdcXHUxRTQyJzogJ00nLFxuICAgICdcXHUyQzZFJzogJ00nLFxuICAgICdcXHUwMTlDJzogJ00nLFxuICAgICdcXHUyNEMzJzogJ04nLFxuICAgICdcXHVGRjJFJzogJ04nLFxuICAgICdcXHUwMUY4JzogJ04nLFxuICAgICdcXHUwMTQzJzogJ04nLFxuICAgICdcXHUwMEQxJzogJ04nLFxuICAgICdcXHUxRTQ0JzogJ04nLFxuICAgICdcXHUwMTQ3JzogJ04nLFxuICAgICdcXHUxRTQ2JzogJ04nLFxuICAgICdcXHUwMTQ1JzogJ04nLFxuICAgICdcXHUxRTRBJzogJ04nLFxuICAgICdcXHUxRTQ4JzogJ04nLFxuICAgICdcXHUwMjIwJzogJ04nLFxuICAgICdcXHUwMTlEJzogJ04nLFxuICAgICdcXHVBNzkwJzogJ04nLFxuICAgICdcXHVBN0E0JzogJ04nLFxuICAgICdcXHUwMUNBJzogJ05KJyxcbiAgICAnXFx1MDFDQic6ICdOaicsXG4gICAgJ1xcdTI0QzQnOiAnTycsXG4gICAgJ1xcdUZGMkYnOiAnTycsXG4gICAgJ1xcdTAwRDInOiAnTycsXG4gICAgJ1xcdTAwRDMnOiAnTycsXG4gICAgJ1xcdTAwRDQnOiAnTycsXG4gICAgJ1xcdTFFRDInOiAnTycsXG4gICAgJ1xcdTFFRDAnOiAnTycsXG4gICAgJ1xcdTFFRDYnOiAnTycsXG4gICAgJ1xcdTFFRDQnOiAnTycsXG4gICAgJ1xcdTAwRDUnOiAnTycsXG4gICAgJ1xcdTFFNEMnOiAnTycsXG4gICAgJ1xcdTAyMkMnOiAnTycsXG4gICAgJ1xcdTFFNEUnOiAnTycsXG4gICAgJ1xcdTAxNEMnOiAnTycsXG4gICAgJ1xcdTFFNTAnOiAnTycsXG4gICAgJ1xcdTFFNTInOiAnTycsXG4gICAgJ1xcdTAxNEUnOiAnTycsXG4gICAgJ1xcdTAyMkUnOiAnTycsXG4gICAgJ1xcdTAyMzAnOiAnTycsXG4gICAgJ1xcdTAwRDYnOiAnTycsXG4gICAgJ1xcdTAyMkEnOiAnTycsXG4gICAgJ1xcdTFFQ0UnOiAnTycsXG4gICAgJ1xcdTAxNTAnOiAnTycsXG4gICAgJ1xcdTAxRDEnOiAnTycsXG4gICAgJ1xcdTAyMEMnOiAnTycsXG4gICAgJ1xcdTAyMEUnOiAnTycsXG4gICAgJ1xcdTAxQTAnOiAnTycsXG4gICAgJ1xcdTFFREMnOiAnTycsXG4gICAgJ1xcdTFFREEnOiAnTycsXG4gICAgJ1xcdTFFRTAnOiAnTycsXG4gICAgJ1xcdTFFREUnOiAnTycsXG4gICAgJ1xcdTFFRTInOiAnTycsXG4gICAgJ1xcdTFFQ0MnOiAnTycsXG4gICAgJ1xcdTFFRDgnOiAnTycsXG4gICAgJ1xcdTAxRUEnOiAnTycsXG4gICAgJ1xcdTAxRUMnOiAnTycsXG4gICAgJ1xcdTAwRDgnOiAnTycsXG4gICAgJ1xcdTAxRkUnOiAnTycsXG4gICAgJ1xcdTAxODYnOiAnTycsXG4gICAgJ1xcdTAxOUYnOiAnTycsXG4gICAgJ1xcdUE3NEEnOiAnTycsXG4gICAgJ1xcdUE3NEMnOiAnTycsXG4gICAgJ1xcdTAxQTInOiAnT0knLFxuICAgICdcXHVBNzRFJzogJ09PJyxcbiAgICAnXFx1MDIyMic6ICdPVScsXG4gICAgJ1xcdTI0QzUnOiAnUCcsXG4gICAgJ1xcdUZGMzAnOiAnUCcsXG4gICAgJ1xcdTFFNTQnOiAnUCcsXG4gICAgJ1xcdTFFNTYnOiAnUCcsXG4gICAgJ1xcdTAxQTQnOiAnUCcsXG4gICAgJ1xcdTJDNjMnOiAnUCcsXG4gICAgJ1xcdUE3NTAnOiAnUCcsXG4gICAgJ1xcdUE3NTInOiAnUCcsXG4gICAgJ1xcdUE3NTQnOiAnUCcsXG4gICAgJ1xcdTI0QzYnOiAnUScsXG4gICAgJ1xcdUZGMzEnOiAnUScsXG4gICAgJ1xcdUE3NTYnOiAnUScsXG4gICAgJ1xcdUE3NTgnOiAnUScsXG4gICAgJ1xcdTAyNEEnOiAnUScsXG4gICAgJ1xcdTI0QzcnOiAnUicsXG4gICAgJ1xcdUZGMzInOiAnUicsXG4gICAgJ1xcdTAxNTQnOiAnUicsXG4gICAgJ1xcdTFFNTgnOiAnUicsXG4gICAgJ1xcdTAxNTgnOiAnUicsXG4gICAgJ1xcdTAyMTAnOiAnUicsXG4gICAgJ1xcdTAyMTInOiAnUicsXG4gICAgJ1xcdTFFNUEnOiAnUicsXG4gICAgJ1xcdTFFNUMnOiAnUicsXG4gICAgJ1xcdTAxNTYnOiAnUicsXG4gICAgJ1xcdTFFNUUnOiAnUicsXG4gICAgJ1xcdTAyNEMnOiAnUicsXG4gICAgJ1xcdTJDNjQnOiAnUicsXG4gICAgJ1xcdUE3NUEnOiAnUicsXG4gICAgJ1xcdUE3QTYnOiAnUicsXG4gICAgJ1xcdUE3ODInOiAnUicsXG4gICAgJ1xcdTI0QzgnOiAnUycsXG4gICAgJ1xcdUZGMzMnOiAnUycsXG4gICAgJ1xcdTFFOUUnOiAnUycsXG4gICAgJ1xcdTAxNUEnOiAnUycsXG4gICAgJ1xcdTFFNjQnOiAnUycsXG4gICAgJ1xcdTAxNUMnOiAnUycsXG4gICAgJ1xcdTFFNjAnOiAnUycsXG4gICAgJ1xcdTAxNjAnOiAnUycsXG4gICAgJ1xcdTFFNjYnOiAnUycsXG4gICAgJ1xcdTFFNjInOiAnUycsXG4gICAgJ1xcdTFFNjgnOiAnUycsXG4gICAgJ1xcdTAyMTgnOiAnUycsXG4gICAgJ1xcdTAxNUUnOiAnUycsXG4gICAgJ1xcdTJDN0UnOiAnUycsXG4gICAgJ1xcdUE3QTgnOiAnUycsXG4gICAgJ1xcdUE3ODQnOiAnUycsXG4gICAgJ1xcdTI0QzknOiAnVCcsXG4gICAgJ1xcdUZGMzQnOiAnVCcsXG4gICAgJ1xcdTFFNkEnOiAnVCcsXG4gICAgJ1xcdTAxNjQnOiAnVCcsXG4gICAgJ1xcdTFFNkMnOiAnVCcsXG4gICAgJ1xcdTAyMUEnOiAnVCcsXG4gICAgJ1xcdTAxNjInOiAnVCcsXG4gICAgJ1xcdTFFNzAnOiAnVCcsXG4gICAgJ1xcdTFFNkUnOiAnVCcsXG4gICAgJ1xcdTAxNjYnOiAnVCcsXG4gICAgJ1xcdTAxQUMnOiAnVCcsXG4gICAgJ1xcdTAxQUUnOiAnVCcsXG4gICAgJ1xcdTAyM0UnOiAnVCcsXG4gICAgJ1xcdUE3ODYnOiAnVCcsXG4gICAgJ1xcdUE3MjgnOiAnVFonLFxuICAgICdcXHUyNENBJzogJ1UnLFxuICAgICdcXHVGRjM1JzogJ1UnLFxuICAgICdcXHUwMEQ5JzogJ1UnLFxuICAgICdcXHUwMERBJzogJ1UnLFxuICAgICdcXHUwMERCJzogJ1UnLFxuICAgICdcXHUwMTY4JzogJ1UnLFxuICAgICdcXHUxRTc4JzogJ1UnLFxuICAgICdcXHUwMTZBJzogJ1UnLFxuICAgICdcXHUxRTdBJzogJ1UnLFxuICAgICdcXHUwMTZDJzogJ1UnLFxuICAgICdcXHUwMERDJzogJ1UnLFxuICAgICdcXHUwMURCJzogJ1UnLFxuICAgICdcXHUwMUQ3JzogJ1UnLFxuICAgICdcXHUwMUQ1JzogJ1UnLFxuICAgICdcXHUwMUQ5JzogJ1UnLFxuICAgICdcXHUxRUU2JzogJ1UnLFxuICAgICdcXHUwMTZFJzogJ1UnLFxuICAgICdcXHUwMTcwJzogJ1UnLFxuICAgICdcXHUwMUQzJzogJ1UnLFxuICAgICdcXHUwMjE0JzogJ1UnLFxuICAgICdcXHUwMjE2JzogJ1UnLFxuICAgICdcXHUwMUFGJzogJ1UnLFxuICAgICdcXHUxRUVBJzogJ1UnLFxuICAgICdcXHUxRUU4JzogJ1UnLFxuICAgICdcXHUxRUVFJzogJ1UnLFxuICAgICdcXHUxRUVDJzogJ1UnLFxuICAgICdcXHUxRUYwJzogJ1UnLFxuICAgICdcXHUxRUU0JzogJ1UnLFxuICAgICdcXHUxRTcyJzogJ1UnLFxuICAgICdcXHUwMTcyJzogJ1UnLFxuICAgICdcXHUxRTc2JzogJ1UnLFxuICAgICdcXHUxRTc0JzogJ1UnLFxuICAgICdcXHUwMjQ0JzogJ1UnLFxuICAgICdcXHUyNENCJzogJ1YnLFxuICAgICdcXHVGRjM2JzogJ1YnLFxuICAgICdcXHUxRTdDJzogJ1YnLFxuICAgICdcXHUxRTdFJzogJ1YnLFxuICAgICdcXHUwMUIyJzogJ1YnLFxuICAgICdcXHVBNzVFJzogJ1YnLFxuICAgICdcXHUwMjQ1JzogJ1YnLFxuICAgICdcXHVBNzYwJzogJ1ZZJyxcbiAgICAnXFx1MjRDQyc6ICdXJyxcbiAgICAnXFx1RkYzNyc6ICdXJyxcbiAgICAnXFx1MUU4MCc6ICdXJyxcbiAgICAnXFx1MUU4Mic6ICdXJyxcbiAgICAnXFx1MDE3NCc6ICdXJyxcbiAgICAnXFx1MUU4Nic6ICdXJyxcbiAgICAnXFx1MUU4NCc6ICdXJyxcbiAgICAnXFx1MUU4OCc6ICdXJyxcbiAgICAnXFx1MkM3Mic6ICdXJyxcbiAgICAnXFx1MjRDRCc6ICdYJyxcbiAgICAnXFx1RkYzOCc6ICdYJyxcbiAgICAnXFx1MUU4QSc6ICdYJyxcbiAgICAnXFx1MUU4Qyc6ICdYJyxcbiAgICAnXFx1MjRDRSc6ICdZJyxcbiAgICAnXFx1RkYzOSc6ICdZJyxcbiAgICAnXFx1MUVGMic6ICdZJyxcbiAgICAnXFx1MDBERCc6ICdZJyxcbiAgICAnXFx1MDE3Nic6ICdZJyxcbiAgICAnXFx1MUVGOCc6ICdZJyxcbiAgICAnXFx1MDIzMic6ICdZJyxcbiAgICAnXFx1MUU4RSc6ICdZJyxcbiAgICAnXFx1MDE3OCc6ICdZJyxcbiAgICAnXFx1MUVGNic6ICdZJyxcbiAgICAnXFx1MUVGNCc6ICdZJyxcbiAgICAnXFx1MDFCMyc6ICdZJyxcbiAgICAnXFx1MDI0RSc6ICdZJyxcbiAgICAnXFx1MUVGRSc6ICdZJyxcbiAgICAnXFx1MjRDRic6ICdaJyxcbiAgICAnXFx1RkYzQSc6ICdaJyxcbiAgICAnXFx1MDE3OSc6ICdaJyxcbiAgICAnXFx1MUU5MCc6ICdaJyxcbiAgICAnXFx1MDE3Qic6ICdaJyxcbiAgICAnXFx1MDE3RCc6ICdaJyxcbiAgICAnXFx1MUU5Mic6ICdaJyxcbiAgICAnXFx1MUU5NCc6ICdaJyxcbiAgICAnXFx1MDFCNSc6ICdaJyxcbiAgICAnXFx1MDIyNCc6ICdaJyxcbiAgICAnXFx1MkM3Ric6ICdaJyxcbiAgICAnXFx1MkM2Qic6ICdaJyxcbiAgICAnXFx1QTc2Mic6ICdaJyxcbiAgICAnXFx1MjREMCc6ICdhJyxcbiAgICAnXFx1RkY0MSc6ICdhJyxcbiAgICAnXFx1MUU5QSc6ICdhJyxcbiAgICAnXFx1MDBFMCc6ICdhJyxcbiAgICAnXFx1MDBFMSc6ICdhJyxcbiAgICAnXFx1MDBFMic6ICdhJyxcbiAgICAnXFx1MUVBNyc6ICdhJyxcbiAgICAnXFx1MUVBNSc6ICdhJyxcbiAgICAnXFx1MUVBQic6ICdhJyxcbiAgICAnXFx1MUVBOSc6ICdhJyxcbiAgICAnXFx1MDBFMyc6ICdhJyxcbiAgICAnXFx1MDEwMSc6ICdhJyxcbiAgICAnXFx1MDEwMyc6ICdhJyxcbiAgICAnXFx1MUVCMSc6ICdhJyxcbiAgICAnXFx1MUVBRic6ICdhJyxcbiAgICAnXFx1MUVCNSc6ICdhJyxcbiAgICAnXFx1MUVCMyc6ICdhJyxcbiAgICAnXFx1MDIyNyc6ICdhJyxcbiAgICAnXFx1MDFFMSc6ICdhJyxcbiAgICAnXFx1MDBFNCc6ICdhJyxcbiAgICAnXFx1MDFERic6ICdhJyxcbiAgICAnXFx1MUVBMyc6ICdhJyxcbiAgICAnXFx1MDBFNSc6ICdhJyxcbiAgICAnXFx1MDFGQic6ICdhJyxcbiAgICAnXFx1MDFDRSc6ICdhJyxcbiAgICAnXFx1MDIwMSc6ICdhJyxcbiAgICAnXFx1MDIwMyc6ICdhJyxcbiAgICAnXFx1MUVBMSc6ICdhJyxcbiAgICAnXFx1MUVBRCc6ICdhJyxcbiAgICAnXFx1MUVCNyc6ICdhJyxcbiAgICAnXFx1MUUwMSc6ICdhJyxcbiAgICAnXFx1MDEwNSc6ICdhJyxcbiAgICAnXFx1MkM2NSc6ICdhJyxcbiAgICAnXFx1MDI1MCc6ICdhJyxcbiAgICAnXFx1QTczMyc6ICdhYScsXG4gICAgJ1xcdTAwRTYnOiAnYWUnLFxuICAgICdcXHUwMUZEJzogJ2FlJyxcbiAgICAnXFx1MDFFMyc6ICdhZScsXG4gICAgJ1xcdUE3MzUnOiAnYW8nLFxuICAgICdcXHVBNzM3JzogJ2F1JyxcbiAgICAnXFx1QTczOSc6ICdhdicsXG4gICAgJ1xcdUE3M0InOiAnYXYnLFxuICAgICdcXHVBNzNEJzogJ2F5JyxcbiAgICAnXFx1MjREMSc6ICdiJyxcbiAgICAnXFx1RkY0Mic6ICdiJyxcbiAgICAnXFx1MUUwMyc6ICdiJyxcbiAgICAnXFx1MUUwNSc6ICdiJyxcbiAgICAnXFx1MUUwNyc6ICdiJyxcbiAgICAnXFx1MDE4MCc6ICdiJyxcbiAgICAnXFx1MDE4Myc6ICdiJyxcbiAgICAnXFx1MDI1Myc6ICdiJyxcbiAgICAnXFx1MjREMic6ICdjJyxcbiAgICAnXFx1RkY0Myc6ICdjJyxcbiAgICAnXFx1MDEwNyc6ICdjJyxcbiAgICAnXFx1MDEwOSc6ICdjJyxcbiAgICAnXFx1MDEwQic6ICdjJyxcbiAgICAnXFx1MDEwRCc6ICdjJyxcbiAgICAnXFx1MDBFNyc6ICdjJyxcbiAgICAnXFx1MUUwOSc6ICdjJyxcbiAgICAnXFx1MDE4OCc6ICdjJyxcbiAgICAnXFx1MDIzQyc6ICdjJyxcbiAgICAnXFx1QTczRic6ICdjJyxcbiAgICAnXFx1MjE4NCc6ICdjJyxcbiAgICAnXFx1MjREMyc6ICdkJyxcbiAgICAnXFx1RkY0NCc6ICdkJyxcbiAgICAnXFx1MUUwQic6ICdkJyxcbiAgICAnXFx1MDEwRic6ICdkJyxcbiAgICAnXFx1MUUwRCc6ICdkJyxcbiAgICAnXFx1MUUxMSc6ICdkJyxcbiAgICAnXFx1MUUxMyc6ICdkJyxcbiAgICAnXFx1MUUwRic6ICdkJyxcbiAgICAnXFx1MDExMSc6ICdkJyxcbiAgICAnXFx1MDE4Qyc6ICdkJyxcbiAgICAnXFx1MDI1Nic6ICdkJyxcbiAgICAnXFx1MDI1Nyc6ICdkJyxcbiAgICAnXFx1QTc3QSc6ICdkJyxcbiAgICAnXFx1MDFGMyc6ICdkeicsXG4gICAgJ1xcdTAxQzYnOiAnZHonLFxuICAgICdcXHUyNEQ0JzogJ2UnLFxuICAgICdcXHVGRjQ1JzogJ2UnLFxuICAgICdcXHUwMEU4JzogJ2UnLFxuICAgICdcXHUwMEU5JzogJ2UnLFxuICAgICdcXHUwMEVBJzogJ2UnLFxuICAgICdcXHUxRUMxJzogJ2UnLFxuICAgICdcXHUxRUJGJzogJ2UnLFxuICAgICdcXHUxRUM1JzogJ2UnLFxuICAgICdcXHUxRUMzJzogJ2UnLFxuICAgICdcXHUxRUJEJzogJ2UnLFxuICAgICdcXHUwMTEzJzogJ2UnLFxuICAgICdcXHUxRTE1JzogJ2UnLFxuICAgICdcXHUxRTE3JzogJ2UnLFxuICAgICdcXHUwMTE1JzogJ2UnLFxuICAgICdcXHUwMTE3JzogJ2UnLFxuICAgICdcXHUwMEVCJzogJ2UnLFxuICAgICdcXHUxRUJCJzogJ2UnLFxuICAgICdcXHUwMTFCJzogJ2UnLFxuICAgICdcXHUwMjA1JzogJ2UnLFxuICAgICdcXHUwMjA3JzogJ2UnLFxuICAgICdcXHUxRUI5JzogJ2UnLFxuICAgICdcXHUxRUM3JzogJ2UnLFxuICAgICdcXHUwMjI5JzogJ2UnLFxuICAgICdcXHUxRTFEJzogJ2UnLFxuICAgICdcXHUwMTE5JzogJ2UnLFxuICAgICdcXHUxRTE5JzogJ2UnLFxuICAgICdcXHUxRTFCJzogJ2UnLFxuICAgICdcXHUwMjQ3JzogJ2UnLFxuICAgICdcXHUwMjVCJzogJ2UnLFxuICAgICdcXHUwMUREJzogJ2UnLFxuICAgICdcXHUyNEQ1JzogJ2YnLFxuICAgICdcXHVGRjQ2JzogJ2YnLFxuICAgICdcXHUxRTFGJzogJ2YnLFxuICAgICdcXHUwMTkyJzogJ2YnLFxuICAgICdcXHVBNzdDJzogJ2YnLFxuICAgICdcXHUyNEQ2JzogJ2cnLFxuICAgICdcXHVGRjQ3JzogJ2cnLFxuICAgICdcXHUwMUY1JzogJ2cnLFxuICAgICdcXHUwMTFEJzogJ2cnLFxuICAgICdcXHUxRTIxJzogJ2cnLFxuICAgICdcXHUwMTFGJzogJ2cnLFxuICAgICdcXHUwMTIxJzogJ2cnLFxuICAgICdcXHUwMUU3JzogJ2cnLFxuICAgICdcXHUwMTIzJzogJ2cnLFxuICAgICdcXHUwMUU1JzogJ2cnLFxuICAgICdcXHUwMjYwJzogJ2cnLFxuICAgICdcXHVBN0ExJzogJ2cnLFxuICAgICdcXHUxRDc5JzogJ2cnLFxuICAgICdcXHVBNzdGJzogJ2cnLFxuICAgICdcXHUyNEQ3JzogJ2gnLFxuICAgICdcXHVGRjQ4JzogJ2gnLFxuICAgICdcXHUwMTI1JzogJ2gnLFxuICAgICdcXHUxRTIzJzogJ2gnLFxuICAgICdcXHUxRTI3JzogJ2gnLFxuICAgICdcXHUwMjFGJzogJ2gnLFxuICAgICdcXHUxRTI1JzogJ2gnLFxuICAgICdcXHUxRTI5JzogJ2gnLFxuICAgICdcXHUxRTJCJzogJ2gnLFxuICAgICdcXHUxRTk2JzogJ2gnLFxuICAgICdcXHUwMTI3JzogJ2gnLFxuICAgICdcXHUyQzY4JzogJ2gnLFxuICAgICdcXHUyQzc2JzogJ2gnLFxuICAgICdcXHUwMjY1JzogJ2gnLFxuICAgICdcXHUwMTk1JzogJ2h2JyxcbiAgICAnXFx1MjREOCc6ICdpJyxcbiAgICAnXFx1RkY0OSc6ICdpJyxcbiAgICAnXFx1MDBFQyc6ICdpJyxcbiAgICAnXFx1MDBFRCc6ICdpJyxcbiAgICAnXFx1MDBFRSc6ICdpJyxcbiAgICAnXFx1MDEyOSc6ICdpJyxcbiAgICAnXFx1MDEyQic6ICdpJyxcbiAgICAnXFx1MDEyRCc6ICdpJyxcbiAgICAnXFx1MDBFRic6ICdpJyxcbiAgICAnXFx1MUUyRic6ICdpJyxcbiAgICAnXFx1MUVDOSc6ICdpJyxcbiAgICAnXFx1MDFEMCc6ICdpJyxcbiAgICAnXFx1MDIwOSc6ICdpJyxcbiAgICAnXFx1MDIwQic6ICdpJyxcbiAgICAnXFx1MUVDQic6ICdpJyxcbiAgICAnXFx1MDEyRic6ICdpJyxcbiAgICAnXFx1MUUyRCc6ICdpJyxcbiAgICAnXFx1MDI2OCc6ICdpJyxcbiAgICAnXFx1MDEzMSc6ICdpJyxcbiAgICAnXFx1MjREOSc6ICdqJyxcbiAgICAnXFx1RkY0QSc6ICdqJyxcbiAgICAnXFx1MDEzNSc6ICdqJyxcbiAgICAnXFx1MDFGMCc6ICdqJyxcbiAgICAnXFx1MDI0OSc6ICdqJyxcbiAgICAnXFx1MjREQSc6ICdrJyxcbiAgICAnXFx1RkY0Qic6ICdrJyxcbiAgICAnXFx1MUUzMSc6ICdrJyxcbiAgICAnXFx1MDFFOSc6ICdrJyxcbiAgICAnXFx1MUUzMyc6ICdrJyxcbiAgICAnXFx1MDEzNyc6ICdrJyxcbiAgICAnXFx1MUUzNSc6ICdrJyxcbiAgICAnXFx1MDE5OSc6ICdrJyxcbiAgICAnXFx1MkM2QSc6ICdrJyxcbiAgICAnXFx1QTc0MSc6ICdrJyxcbiAgICAnXFx1QTc0Myc6ICdrJyxcbiAgICAnXFx1QTc0NSc6ICdrJyxcbiAgICAnXFx1QTdBMyc6ICdrJyxcbiAgICAnXFx1MjREQic6ICdsJyxcbiAgICAnXFx1RkY0Qyc6ICdsJyxcbiAgICAnXFx1MDE0MCc6ICdsJyxcbiAgICAnXFx1MDEzQSc6ICdsJyxcbiAgICAnXFx1MDEzRSc6ICdsJyxcbiAgICAnXFx1MUUzNyc6ICdsJyxcbiAgICAnXFx1MUUzOSc6ICdsJyxcbiAgICAnXFx1MDEzQyc6ICdsJyxcbiAgICAnXFx1MUUzRCc6ICdsJyxcbiAgICAnXFx1MUUzQic6ICdsJyxcbiAgICAnXFx1MDE3Ric6ICdsJyxcbiAgICAnXFx1MDE0Mic6ICdsJyxcbiAgICAnXFx1MDE5QSc6ICdsJyxcbiAgICAnXFx1MDI2Qic6ICdsJyxcbiAgICAnXFx1MkM2MSc6ICdsJyxcbiAgICAnXFx1QTc0OSc6ICdsJyxcbiAgICAnXFx1QTc4MSc6ICdsJyxcbiAgICAnXFx1QTc0Nyc6ICdsJyxcbiAgICAnXFx1MDFDOSc6ICdsaicsXG4gICAgJ1xcdTI0REMnOiAnbScsXG4gICAgJ1xcdUZGNEQnOiAnbScsXG4gICAgJ1xcdTFFM0YnOiAnbScsXG4gICAgJ1xcdTFFNDEnOiAnbScsXG4gICAgJ1xcdTFFNDMnOiAnbScsXG4gICAgJ1xcdTAyNzEnOiAnbScsXG4gICAgJ1xcdTAyNkYnOiAnbScsXG4gICAgJ1xcdTI0REQnOiAnbicsXG4gICAgJ1xcdUZGNEUnOiAnbicsXG4gICAgJ1xcdTAxRjknOiAnbicsXG4gICAgJ1xcdTAxNDQnOiAnbicsXG4gICAgJ1xcdTAwRjEnOiAnbicsXG4gICAgJ1xcdTFFNDUnOiAnbicsXG4gICAgJ1xcdTAxNDgnOiAnbicsXG4gICAgJ1xcdTFFNDcnOiAnbicsXG4gICAgJ1xcdTAxNDYnOiAnbicsXG4gICAgJ1xcdTFFNEInOiAnbicsXG4gICAgJ1xcdTFFNDknOiAnbicsXG4gICAgJ1xcdTAxOUUnOiAnbicsXG4gICAgJ1xcdTAyNzInOiAnbicsXG4gICAgJ1xcdTAxNDknOiAnbicsXG4gICAgJ1xcdUE3OTEnOiAnbicsXG4gICAgJ1xcdUE3QTUnOiAnbicsXG4gICAgJ1xcdTAxQ0MnOiAnbmonLFxuICAgICdcXHUyNERFJzogJ28nLFxuICAgICdcXHVGRjRGJzogJ28nLFxuICAgICdcXHUwMEYyJzogJ28nLFxuICAgICdcXHUwMEYzJzogJ28nLFxuICAgICdcXHUwMEY0JzogJ28nLFxuICAgICdcXHUxRUQzJzogJ28nLFxuICAgICdcXHUxRUQxJzogJ28nLFxuICAgICdcXHUxRUQ3JzogJ28nLFxuICAgICdcXHUxRUQ1JzogJ28nLFxuICAgICdcXHUwMEY1JzogJ28nLFxuICAgICdcXHUxRTREJzogJ28nLFxuICAgICdcXHUwMjJEJzogJ28nLFxuICAgICdcXHUxRTRGJzogJ28nLFxuICAgICdcXHUwMTREJzogJ28nLFxuICAgICdcXHUxRTUxJzogJ28nLFxuICAgICdcXHUxRTUzJzogJ28nLFxuICAgICdcXHUwMTRGJzogJ28nLFxuICAgICdcXHUwMjJGJzogJ28nLFxuICAgICdcXHUwMjMxJzogJ28nLFxuICAgICdcXHUwMEY2JzogJ28nLFxuICAgICdcXHUwMjJCJzogJ28nLFxuICAgICdcXHUxRUNGJzogJ28nLFxuICAgICdcXHUwMTUxJzogJ28nLFxuICAgICdcXHUwMUQyJzogJ28nLFxuICAgICdcXHUwMjBEJzogJ28nLFxuICAgICdcXHUwMjBGJzogJ28nLFxuICAgICdcXHUwMUExJzogJ28nLFxuICAgICdcXHUxRUREJzogJ28nLFxuICAgICdcXHUxRURCJzogJ28nLFxuICAgICdcXHUxRUUxJzogJ28nLFxuICAgICdcXHUxRURGJzogJ28nLFxuICAgICdcXHUxRUUzJzogJ28nLFxuICAgICdcXHUxRUNEJzogJ28nLFxuICAgICdcXHUxRUQ5JzogJ28nLFxuICAgICdcXHUwMUVCJzogJ28nLFxuICAgICdcXHUwMUVEJzogJ28nLFxuICAgICdcXHUwMEY4JzogJ28nLFxuICAgICdcXHUwMUZGJzogJ28nLFxuICAgICdcXHUwMjU0JzogJ28nLFxuICAgICdcXHVBNzRCJzogJ28nLFxuICAgICdcXHVBNzREJzogJ28nLFxuICAgICdcXHUwMjc1JzogJ28nLFxuICAgICdcXHUwMUEzJzogJ29pJyxcbiAgICAnXFx1MDIyMyc6ICdvdScsXG4gICAgJ1xcdUE3NEYnOiAnb28nLFxuICAgICdcXHUyNERGJzogJ3AnLFxuICAgICdcXHVGRjUwJzogJ3AnLFxuICAgICdcXHUxRTU1JzogJ3AnLFxuICAgICdcXHUxRTU3JzogJ3AnLFxuICAgICdcXHUwMUE1JzogJ3AnLFxuICAgICdcXHUxRDdEJzogJ3AnLFxuICAgICdcXHVBNzUxJzogJ3AnLFxuICAgICdcXHVBNzUzJzogJ3AnLFxuICAgICdcXHVBNzU1JzogJ3AnLFxuICAgICdcXHUyNEUwJzogJ3EnLFxuICAgICdcXHVGRjUxJzogJ3EnLFxuICAgICdcXHUwMjRCJzogJ3EnLFxuICAgICdcXHVBNzU3JzogJ3EnLFxuICAgICdcXHVBNzU5JzogJ3EnLFxuICAgICdcXHUyNEUxJzogJ3InLFxuICAgICdcXHVGRjUyJzogJ3InLFxuICAgICdcXHUwMTU1JzogJ3InLFxuICAgICdcXHUxRTU5JzogJ3InLFxuICAgICdcXHUwMTU5JzogJ3InLFxuICAgICdcXHUwMjExJzogJ3InLFxuICAgICdcXHUwMjEzJzogJ3InLFxuICAgICdcXHUxRTVCJzogJ3InLFxuICAgICdcXHUxRTVEJzogJ3InLFxuICAgICdcXHUwMTU3JzogJ3InLFxuICAgICdcXHUxRTVGJzogJ3InLFxuICAgICdcXHUwMjREJzogJ3InLFxuICAgICdcXHUwMjdEJzogJ3InLFxuICAgICdcXHVBNzVCJzogJ3InLFxuICAgICdcXHVBN0E3JzogJ3InLFxuICAgICdcXHVBNzgzJzogJ3InLFxuICAgICdcXHUyNEUyJzogJ3MnLFxuICAgICdcXHVGRjUzJzogJ3MnLFxuICAgICdcXHUwMERGJzogJ3MnLFxuICAgICdcXHUwMTVCJzogJ3MnLFxuICAgICdcXHUxRTY1JzogJ3MnLFxuICAgICdcXHUwMTVEJzogJ3MnLFxuICAgICdcXHUxRTYxJzogJ3MnLFxuICAgICdcXHUwMTYxJzogJ3MnLFxuICAgICdcXHUxRTY3JzogJ3MnLFxuICAgICdcXHUxRTYzJzogJ3MnLFxuICAgICdcXHUxRTY5JzogJ3MnLFxuICAgICdcXHUwMjE5JzogJ3MnLFxuICAgICdcXHUwMTVGJzogJ3MnLFxuICAgICdcXHUwMjNGJzogJ3MnLFxuICAgICdcXHVBN0E5JzogJ3MnLFxuICAgICdcXHVBNzg1JzogJ3MnLFxuICAgICdcXHUxRTlCJzogJ3MnLFxuICAgICdcXHUyNEUzJzogJ3QnLFxuICAgICdcXHVGRjU0JzogJ3QnLFxuICAgICdcXHUxRTZCJzogJ3QnLFxuICAgICdcXHUxRTk3JzogJ3QnLFxuICAgICdcXHUwMTY1JzogJ3QnLFxuICAgICdcXHUxRTZEJzogJ3QnLFxuICAgICdcXHUwMjFCJzogJ3QnLFxuICAgICdcXHUwMTYzJzogJ3QnLFxuICAgICdcXHUxRTcxJzogJ3QnLFxuICAgICdcXHUxRTZGJzogJ3QnLFxuICAgICdcXHUwMTY3JzogJ3QnLFxuICAgICdcXHUwMUFEJzogJ3QnLFxuICAgICdcXHUwMjg4JzogJ3QnLFxuICAgICdcXHUyQzY2JzogJ3QnLFxuICAgICdcXHVBNzg3JzogJ3QnLFxuICAgICdcXHVBNzI5JzogJ3R6JyxcbiAgICAnXFx1MjRFNCc6ICd1JyxcbiAgICAnXFx1RkY1NSc6ICd1JyxcbiAgICAnXFx1MDBGOSc6ICd1JyxcbiAgICAnXFx1MDBGQSc6ICd1JyxcbiAgICAnXFx1MDBGQic6ICd1JyxcbiAgICAnXFx1MDE2OSc6ICd1JyxcbiAgICAnXFx1MUU3OSc6ICd1JyxcbiAgICAnXFx1MDE2Qic6ICd1JyxcbiAgICAnXFx1MUU3Qic6ICd1JyxcbiAgICAnXFx1MDE2RCc6ICd1JyxcbiAgICAnXFx1MDBGQyc6ICd1JyxcbiAgICAnXFx1MDFEQyc6ICd1JyxcbiAgICAnXFx1MDFEOCc6ICd1JyxcbiAgICAnXFx1MDFENic6ICd1JyxcbiAgICAnXFx1MDFEQSc6ICd1JyxcbiAgICAnXFx1MUVFNyc6ICd1JyxcbiAgICAnXFx1MDE2Ric6ICd1JyxcbiAgICAnXFx1MDE3MSc6ICd1JyxcbiAgICAnXFx1MDFENCc6ICd1JyxcbiAgICAnXFx1MDIxNSc6ICd1JyxcbiAgICAnXFx1MDIxNyc6ICd1JyxcbiAgICAnXFx1MDFCMCc6ICd1JyxcbiAgICAnXFx1MUVFQic6ICd1JyxcbiAgICAnXFx1MUVFOSc6ICd1JyxcbiAgICAnXFx1MUVFRic6ICd1JyxcbiAgICAnXFx1MUVFRCc6ICd1JyxcbiAgICAnXFx1MUVGMSc6ICd1JyxcbiAgICAnXFx1MUVFNSc6ICd1JyxcbiAgICAnXFx1MUU3Myc6ICd1JyxcbiAgICAnXFx1MDE3Myc6ICd1JyxcbiAgICAnXFx1MUU3Nyc6ICd1JyxcbiAgICAnXFx1MUU3NSc6ICd1JyxcbiAgICAnXFx1MDI4OSc6ICd1JyxcbiAgICAnXFx1MjRFNSc6ICd2JyxcbiAgICAnXFx1RkY1Nic6ICd2JyxcbiAgICAnXFx1MUU3RCc6ICd2JyxcbiAgICAnXFx1MUU3Ric6ICd2JyxcbiAgICAnXFx1MDI4Qic6ICd2JyxcbiAgICAnXFx1QTc1Ric6ICd2JyxcbiAgICAnXFx1MDI4Qyc6ICd2JyxcbiAgICAnXFx1QTc2MSc6ICd2eScsXG4gICAgJ1xcdTI0RTYnOiAndycsXG4gICAgJ1xcdUZGNTcnOiAndycsXG4gICAgJ1xcdTFFODEnOiAndycsXG4gICAgJ1xcdTFFODMnOiAndycsXG4gICAgJ1xcdTAxNzUnOiAndycsXG4gICAgJ1xcdTFFODcnOiAndycsXG4gICAgJ1xcdTFFODUnOiAndycsXG4gICAgJ1xcdTFFOTgnOiAndycsXG4gICAgJ1xcdTFFODknOiAndycsXG4gICAgJ1xcdTJDNzMnOiAndycsXG4gICAgJ1xcdTI0RTcnOiAneCcsXG4gICAgJ1xcdUZGNTgnOiAneCcsXG4gICAgJ1xcdTFFOEInOiAneCcsXG4gICAgJ1xcdTFFOEQnOiAneCcsXG4gICAgJ1xcdTI0RTgnOiAneScsXG4gICAgJ1xcdUZGNTknOiAneScsXG4gICAgJ1xcdTFFRjMnOiAneScsXG4gICAgJ1xcdTAwRkQnOiAneScsXG4gICAgJ1xcdTAxNzcnOiAneScsXG4gICAgJ1xcdTFFRjknOiAneScsXG4gICAgJ1xcdTAyMzMnOiAneScsXG4gICAgJ1xcdTFFOEYnOiAneScsXG4gICAgJ1xcdTAwRkYnOiAneScsXG4gICAgJ1xcdTFFRjcnOiAneScsXG4gICAgJ1xcdTFFOTknOiAneScsXG4gICAgJ1xcdTFFRjUnOiAneScsXG4gICAgJ1xcdTAxQjQnOiAneScsXG4gICAgJ1xcdTAyNEYnOiAneScsXG4gICAgJ1xcdTFFRkYnOiAneScsXG4gICAgJ1xcdTI0RTknOiAneicsXG4gICAgJ1xcdUZGNUEnOiAneicsXG4gICAgJ1xcdTAxN0EnOiAneicsXG4gICAgJ1xcdTFFOTEnOiAneicsXG4gICAgJ1xcdTAxN0MnOiAneicsXG4gICAgJ1xcdTAxN0UnOiAneicsXG4gICAgJ1xcdTFFOTMnOiAneicsXG4gICAgJ1xcdTFFOTUnOiAneicsXG4gICAgJ1xcdTAxQjYnOiAneicsXG4gICAgJ1xcdTAyMjUnOiAneicsXG4gICAgJ1xcdTAyNDAnOiAneicsXG4gICAgJ1xcdTJDNkMnOiAneicsXG4gICAgJ1xcdUE3NjMnOiAneicsXG4gICAgJ1xcdTAzODYnOiAnXFx1MDM5MScsXG4gICAgJ1xcdTAzODgnOiAnXFx1MDM5NScsXG4gICAgJ1xcdTAzODknOiAnXFx1MDM5NycsXG4gICAgJ1xcdTAzOEEnOiAnXFx1MDM5OScsXG4gICAgJ1xcdTAzQUEnOiAnXFx1MDM5OScsXG4gICAgJ1xcdTAzOEMnOiAnXFx1MDM5RicsXG4gICAgJ1xcdTAzOEUnOiAnXFx1MDNBNScsXG4gICAgJ1xcdTAzQUInOiAnXFx1MDNBNScsXG4gICAgJ1xcdTAzOEYnOiAnXFx1MDNBOScsXG4gICAgJ1xcdTAzQUMnOiAnXFx1MDNCMScsXG4gICAgJ1xcdTAzQUQnOiAnXFx1MDNCNScsXG4gICAgJ1xcdTAzQUUnOiAnXFx1MDNCNycsXG4gICAgJ1xcdTAzQUYnOiAnXFx1MDNCOScsXG4gICAgJ1xcdTAzQ0EnOiAnXFx1MDNCOScsXG4gICAgJ1xcdTAzOTAnOiAnXFx1MDNCOScsXG4gICAgJ1xcdTAzQ0MnOiAnXFx1MDNCRicsXG4gICAgJ1xcdTAzQ0QnOiAnXFx1MDNDNScsXG4gICAgJ1xcdTAzQ0InOiAnXFx1MDNDNScsXG4gICAgJ1xcdTAzQjAnOiAnXFx1MDNDNScsXG4gICAgJ1xcdTAzQzknOiAnXFx1MDNDOScsXG4gICAgJ1xcdTAzQzInOiAnXFx1MDNDMydcbiAgfTtcblxuICByZXR1cm4gZGlhY3JpdGljcztcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvZGF0YS9iYXNlJyxbXG4gICcuLi91dGlscydcbl0sIGZ1bmN0aW9uIChVdGlscykge1xuICBmdW5jdGlvbiBCYXNlQWRhcHRlciAoJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBCYXNlQWRhcHRlci5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzKTtcbiAgfVxuXG4gIFV0aWxzLkV4dGVuZChCYXNlQWRhcHRlciwgVXRpbHMuT2JzZXJ2YWJsZSk7XG5cbiAgQmFzZUFkYXB0ZXIucHJvdG90eXBlLmN1cnJlbnQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBgY3VycmVudGAgbWV0aG9kIG11c3QgYmUgZGVmaW5lZCBpbiBjaGlsZCBjbGFzc2VzLicpO1xuICB9O1xuXG4gIEJhc2VBZGFwdGVyLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMsIGNhbGxiYWNrKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgYHF1ZXJ5YCBtZXRob2QgbXVzdCBiZSBkZWZpbmVkIGluIGNoaWxkIGNsYXNzZXMuJyk7XG4gIH07XG5cbiAgQmFzZUFkYXB0ZXIucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoY29udGFpbmVyLCAkY29udGFpbmVyKSB7XG4gICAgLy8gQ2FuIGJlIGltcGxlbWVudGVkIGluIHN1YmNsYXNzZXNcbiAgfTtcblxuICBCYXNlQWRhcHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBDYW4gYmUgaW1wbGVtZW50ZWQgaW4gc3ViY2xhc3Nlc1xuICB9O1xuXG4gIEJhc2VBZGFwdGVyLnByb3RvdHlwZS5nZW5lcmF0ZVJlc3VsdElkID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgZGF0YSkge1xuICAgIHZhciBpZCA9IGNvbnRhaW5lci5pZCArICctcmVzdWx0LSc7XG5cbiAgICBpZCArPSBVdGlscy5nZW5lcmF0ZUNoYXJzKDQpO1xuXG4gICAgaWYgKGRhdGEuaWQgIT0gbnVsbCkge1xuICAgICAgaWQgKz0gJy0nICsgZGF0YS5pZC50b1N0cmluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZCArPSAnLScgKyBVdGlscy5nZW5lcmF0ZUNoYXJzKDQpO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH07XG5cbiAgcmV0dXJuIEJhc2VBZGFwdGVyO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kYXRhL3NlbGVjdCcsW1xuICAnLi9iYXNlJyxcbiAgJy4uL3V0aWxzJyxcbiAgJ2pxdWVyeSdcbl0sIGZ1bmN0aW9uIChCYXNlQWRhcHRlciwgVXRpbHMsICQpIHtcbiAgZnVuY3Rpb24gU2VsZWN0QWRhcHRlciAoJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIFNlbGVjdEFkYXB0ZXIuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcyk7XG4gIH1cblxuICBVdGlscy5FeHRlbmQoU2VsZWN0QWRhcHRlciwgQmFzZUFkYXB0ZXIpO1xuXG4gIFNlbGVjdEFkYXB0ZXIucHJvdG90eXBlLmN1cnJlbnQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgZGF0YSA9IFtdO1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnOnNlbGVjdGVkJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJG9wdGlvbiA9ICQodGhpcyk7XG5cbiAgICAgIHZhciBvcHRpb24gPSBzZWxmLml0ZW0oJG9wdGlvbik7XG5cbiAgICAgIGRhdGEucHVzaChvcHRpb24pO1xuICAgIH0pO1xuXG4gICAgY2FsbGJhY2soZGF0YSk7XG4gIH07XG5cbiAgU2VsZWN0QWRhcHRlci5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBkYXRhLnNlbGVjdGVkID0gdHJ1ZTtcblxuICAgIC8vIElmIGRhdGEuZWxlbWVudCBpcyBhIERPTSBub2RlLCB1c2UgaXQgaW5zdGVhZFxuICAgIGlmICgkKGRhdGEuZWxlbWVudCkuaXMoJ29wdGlvbicpKSB7XG4gICAgICBkYXRhLmVsZW1lbnQuc2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2NoYW5nZScpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQucHJvcCgnbXVsdGlwbGUnKSkge1xuICAgICAgdGhpcy5jdXJyZW50KGZ1bmN0aW9uIChjdXJyZW50RGF0YSkge1xuICAgICAgICB2YXIgdmFsID0gW107XG5cbiAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgZGF0YS5wdXNoLmFwcGx5KGRhdGEsIGN1cnJlbnREYXRhKTtcblxuICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IGRhdGEubGVuZ3RoOyBkKyspIHtcbiAgICAgICAgICB2YXIgaWQgPSBkYXRhW2RdLmlkO1xuXG4gICAgICAgICAgaWYgKCQuaW5BcnJheShpZCwgdmFsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHZhbC5wdXNoKGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRlbGVtZW50LnZhbCh2YWwpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB2YWwgPSBkYXRhLmlkO1xuXG4gICAgICB0aGlzLiRlbGVtZW50LnZhbCh2YWwpO1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICB9XG4gIH07XG5cbiAgU2VsZWN0QWRhcHRlci5wcm90b3R5cGUudW5zZWxlY3QgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICghdGhpcy4kZWxlbWVudC5wcm9wKCdtdWx0aXBsZScpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGF0YS5zZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgaWYgKCQoZGF0YS5lbGVtZW50KS5pcygnb3B0aW9uJykpIHtcbiAgICAgIGRhdGEuZWxlbWVudC5zZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2NoYW5nZScpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50KGZ1bmN0aW9uIChjdXJyZW50RGF0YSkge1xuICAgICAgdmFyIHZhbCA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBkID0gMDsgZCA8IGN1cnJlbnREYXRhLmxlbmd0aDsgZCsrKSB7XG4gICAgICAgIHZhciBpZCA9IGN1cnJlbnREYXRhW2RdLmlkO1xuXG4gICAgICAgIGlmIChpZCAhPT0gZGF0YS5pZCAmJiAkLmluQXJyYXkoaWQsIHZhbCkgPT09IC0xKSB7XG4gICAgICAgICAgdmFsLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYuJGVsZW1lbnQudmFsKHZhbCk7XG5cbiAgICAgIHNlbGYuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgfSk7XG4gIH07XG5cbiAgU2VsZWN0QWRhcHRlci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChjb250YWluZXIsICRjb250YWluZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgIGNvbnRhaW5lci5vbignc2VsZWN0JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi5zZWxlY3QocGFyYW1zLmRhdGEpO1xuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCd1bnNlbGVjdCcsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgIHNlbGYudW5zZWxlY3QocGFyYW1zLmRhdGEpO1xuICAgIH0pO1xuICB9O1xuXG4gIFNlbGVjdEFkYXB0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gUmVtb3ZlIGFueXRoaW5nIGFkZGVkIHRvIGNoaWxkIGVsZW1lbnRzXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCcqJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBSZW1vdmUgYW55IGN1c3RvbSBkYXRhIHNldCBieSBTZWxlY3QyXG4gICAgICAkLnJlbW92ZURhdGEodGhpcywgJ2RhdGEnKTtcbiAgICB9KTtcbiAgfTtcblxuICBTZWxlY3RBZGFwdGVyLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGRhdGEgPSBbXTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgJG9wdGlvbnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCk7XG5cbiAgICAkb3B0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkb3B0aW9uID0gJCh0aGlzKTtcblxuICAgICAgaWYgKCEkb3B0aW9uLmlzKCdvcHRpb24nKSAmJiAhJG9wdGlvbi5pcygnb3B0Z3JvdXAnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBvcHRpb24gPSBzZWxmLml0ZW0oJG9wdGlvbik7XG5cbiAgICAgIHZhciBtYXRjaGVzID0gc2VsZi5tYXRjaGVzKHBhcmFtcywgb3B0aW9uKTtcblxuICAgICAgaWYgKG1hdGNoZXMgIT09IG51bGwpIHtcbiAgICAgICAgZGF0YS5wdXNoKG1hdGNoZXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY2FsbGJhY2soe1xuICAgICAgcmVzdWx0czogZGF0YVxuICAgIH0pO1xuICB9O1xuXG4gIFNlbGVjdEFkYXB0ZXIucHJvdG90eXBlLmFkZE9wdGlvbnMgPSBmdW5jdGlvbiAoJG9wdGlvbnMpIHtcbiAgICBVdGlscy5hcHBlbmRNYW55KHRoaXMuJGVsZW1lbnQsICRvcHRpb25zKTtcbiAgfTtcblxuICBTZWxlY3RBZGFwdGVyLnByb3RvdHlwZS5vcHRpb24gPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBvcHRpb247XG5cbiAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0Z3JvdXAnKTtcbiAgICAgIG9wdGlvbi5sYWJlbCA9IGRhdGEudGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG5cbiAgICAgIGlmIChvcHRpb24udGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSBkYXRhLnRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb24uaW5uZXJUZXh0ID0gZGF0YS50ZXh0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkYXRhLmlkKSB7XG4gICAgICBvcHRpb24udmFsdWUgPSBkYXRhLmlkO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmRpc2FibGVkKSB7XG4gICAgICBvcHRpb24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkYXRhLnNlbGVjdGVkKSB7XG4gICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkYXRhLnRpdGxlKSB7XG4gICAgICBvcHRpb24udGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgIH1cblxuICAgIHZhciAkb3B0aW9uID0gJChvcHRpb24pO1xuXG4gICAgdmFyIG5vcm1hbGl6ZWREYXRhID0gdGhpcy5fbm9ybWFsaXplSXRlbShkYXRhKTtcbiAgICBub3JtYWxpemVkRGF0YS5lbGVtZW50ID0gb3B0aW9uO1xuXG4gICAgLy8gT3ZlcnJpZGUgdGhlIG9wdGlvbidzIGRhdGEgd2l0aCB0aGUgY29tYmluZWQgZGF0YVxuICAgICQuZGF0YShvcHRpb24sICdkYXRhJywgbm9ybWFsaXplZERhdGEpO1xuXG4gICAgcmV0dXJuICRvcHRpb247XG4gIH07XG5cbiAgU2VsZWN0QWRhcHRlci5wcm90b3R5cGUuaXRlbSA9IGZ1bmN0aW9uICgkb3B0aW9uKSB7XG4gICAgdmFyIGRhdGEgPSB7fTtcblxuICAgIGRhdGEgPSAkLmRhdGEoJG9wdGlvblswXSwgJ2RhdGEnKTtcblxuICAgIGlmIChkYXRhICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIGlmICgkb3B0aW9uLmlzKCdvcHRpb24nKSkge1xuICAgICAgZGF0YSA9IHtcbiAgICAgICAgaWQ6ICRvcHRpb24udmFsKCksXG4gICAgICAgIHRleHQ6ICRvcHRpb24udGV4dCgpLFxuICAgICAgICBkaXNhYmxlZDogJG9wdGlvbi5wcm9wKCdkaXNhYmxlZCcpLFxuICAgICAgICBzZWxlY3RlZDogJG9wdGlvbi5wcm9wKCdzZWxlY3RlZCcpLFxuICAgICAgICB0aXRsZTogJG9wdGlvbi5wcm9wKCd0aXRsZScpXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoJG9wdGlvbi5pcygnb3B0Z3JvdXAnKSkge1xuICAgICAgZGF0YSA9IHtcbiAgICAgICAgdGV4dDogJG9wdGlvbi5wcm9wKCdsYWJlbCcpLFxuICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgIHRpdGxlOiAkb3B0aW9uLnByb3AoJ3RpdGxlJylcbiAgICAgIH07XG5cbiAgICAgIHZhciAkY2hpbGRyZW4gPSAkb3B0aW9uLmNoaWxkcmVuKCdvcHRpb24nKTtcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBjID0gMDsgYyA8ICRjaGlsZHJlbi5sZW5ndGg7IGMrKykge1xuICAgICAgICB2YXIgJGNoaWxkID0gJCgkY2hpbGRyZW5bY10pO1xuXG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuaXRlbSgkY2hpbGQpO1xuXG4gICAgICAgIGNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgfVxuXG4gICAgICBkYXRhLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgfVxuXG4gICAgZGF0YSA9IHRoaXMuX25vcm1hbGl6ZUl0ZW0oZGF0YSk7XG4gICAgZGF0YS5lbGVtZW50ID0gJG9wdGlvblswXTtcblxuICAgICQuZGF0YSgkb3B0aW9uWzBdLCAnZGF0YScsIGRhdGEpO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgU2VsZWN0QWRhcHRlci5wcm90b3R5cGUuX25vcm1hbGl6ZUl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgIGlmICghJC5pc1BsYWluT2JqZWN0KGl0ZW0pKSB7XG4gICAgICBpdGVtID0ge1xuICAgICAgICBpZDogaXRlbSxcbiAgICAgICAgdGV4dDogaXRlbVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpdGVtID0gJC5leHRlbmQoe30sIHtcbiAgICAgIHRleHQ6ICcnXG4gICAgfSwgaXRlbSk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICBzZWxlY3RlZDogZmFsc2UsXG4gICAgICBkaXNhYmxlZDogZmFsc2VcbiAgICB9O1xuXG4gICAgaWYgKGl0ZW0uaWQgIT0gbnVsbCkge1xuICAgICAgaXRlbS5pZCA9IGl0ZW0uaWQudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoaXRlbS50ZXh0ICE9IG51bGwpIHtcbiAgICAgIGl0ZW0udGV4dCA9IGl0ZW0udGV4dC50b1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChpdGVtLl9yZXN1bHRJZCA9PSBudWxsICYmIGl0ZW0uaWQgJiYgdGhpcy5jb250YWluZXIgIT0gbnVsbCkge1xuICAgICAgaXRlbS5fcmVzdWx0SWQgPSB0aGlzLmdlbmVyYXRlUmVzdWx0SWQodGhpcy5jb250YWluZXIsIGl0ZW0pO1xuICAgIH1cblxuICAgIHJldHVybiAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGl0ZW0pO1xuICB9O1xuXG4gIFNlbGVjdEFkYXB0ZXIucHJvdG90eXBlLm1hdGNoZXMgPSBmdW5jdGlvbiAocGFyYW1zLCBkYXRhKSB7XG4gICAgdmFyIG1hdGNoZXIgPSB0aGlzLm9wdGlvbnMuZ2V0KCdtYXRjaGVyJyk7XG5cbiAgICByZXR1cm4gbWF0Y2hlcihwYXJhbXMsIGRhdGEpO1xuICB9O1xuXG4gIHJldHVybiBTZWxlY3RBZGFwdGVyO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kYXRhL2FycmF5JyxbXG4gICcuL3NlbGVjdCcsXG4gICcuLi91dGlscycsXG4gICdqcXVlcnknXG5dLCBmdW5jdGlvbiAoU2VsZWN0QWRhcHRlciwgVXRpbHMsICQpIHtcbiAgZnVuY3Rpb24gQXJyYXlBZGFwdGVyICgkZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHZhciBkYXRhID0gb3B0aW9ucy5nZXQoJ2RhdGEnKSB8fCBbXTtcblxuICAgIEFycmF5QWRhcHRlci5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCAkZWxlbWVudCwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbnModGhpcy5jb252ZXJ0VG9PcHRpb25zKGRhdGEpKTtcbiAgfVxuXG4gIFV0aWxzLkV4dGVuZChBcnJheUFkYXB0ZXIsIFNlbGVjdEFkYXB0ZXIpO1xuXG4gIEFycmF5QWRhcHRlci5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgJG9wdGlvbiA9IHRoaXMuJGVsZW1lbnQuZmluZCgnb3B0aW9uJykuZmlsdGVyKGZ1bmN0aW9uIChpLCBlbG0pIHtcbiAgICAgIHJldHVybiBlbG0udmFsdWUgPT0gZGF0YS5pZC50b1N0cmluZygpO1xuICAgIH0pO1xuXG4gICAgaWYgKCRvcHRpb24ubGVuZ3RoID09PSAwKSB7XG4gICAgICAkb3B0aW9uID0gdGhpcy5vcHRpb24oZGF0YSk7XG5cbiAgICAgIHRoaXMuYWRkT3B0aW9ucygkb3B0aW9uKTtcbiAgICB9XG5cbiAgICBBcnJheUFkYXB0ZXIuX19zdXBlcl9fLnNlbGVjdC5jYWxsKHRoaXMsIGRhdGEpO1xuICB9O1xuXG4gIEFycmF5QWRhcHRlci5wcm90b3R5cGUuY29udmVydFRvT3B0aW9ucyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyICRleGlzdGluZyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnb3B0aW9uJyk7XG4gICAgdmFyIGV4aXN0aW5nSWRzID0gJGV4aXN0aW5nLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc2VsZi5pdGVtKCQodGhpcykpLmlkO1xuICAgIH0pLmdldCgpO1xuXG4gICAgdmFyICRvcHRpb25zID0gW107XG5cbiAgICAvLyBGaWx0ZXIgb3V0IGFsbCBpdGVtcyBleGNlcHQgZm9yIHRoZSBvbmUgcGFzc2VkIGluIHRoZSBhcmd1bWVudFxuICAgIGZ1bmN0aW9uIG9ubHlJdGVtIChpdGVtKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS52YWwoKSA9PSBpdGVtLmlkO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBkID0gMDsgZCA8IGRhdGEubGVuZ3RoOyBkKyspIHtcbiAgICAgIHZhciBpdGVtID0gdGhpcy5fbm9ybWFsaXplSXRlbShkYXRhW2RdKTtcblxuICAgICAgLy8gU2tpcCBpdGVtcyB3aGljaCB3ZXJlIHByZS1sb2FkZWQsIG9ubHkgbWVyZ2UgdGhlIGRhdGFcbiAgICAgIGlmICgkLmluQXJyYXkoaXRlbS5pZCwgZXhpc3RpbmdJZHMpID49IDApIHtcbiAgICAgICAgdmFyICRleGlzdGluZ09wdGlvbiA9ICRleGlzdGluZy5maWx0ZXIob25seUl0ZW0oaXRlbSkpO1xuXG4gICAgICAgIHZhciBleGlzdGluZ0RhdGEgPSB0aGlzLml0ZW0oJGV4aXN0aW5nT3B0aW9uKTtcbiAgICAgICAgdmFyIG5ld0RhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaXRlbSwgZXhpc3RpbmdEYXRhKTtcblxuICAgICAgICB2YXIgJG5ld09wdGlvbiA9IHRoaXMub3B0aW9uKG5ld0RhdGEpO1xuXG4gICAgICAgICRleGlzdGluZ09wdGlvbi5yZXBsYWNlV2l0aCgkbmV3T3B0aW9uKTtcblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyICRvcHRpb24gPSB0aGlzLm9wdGlvbihpdGVtKTtcblxuICAgICAgaWYgKGl0ZW0uY2hpbGRyZW4pIHtcbiAgICAgICAgdmFyICRjaGlsZHJlbiA9IHRoaXMuY29udmVydFRvT3B0aW9ucyhpdGVtLmNoaWxkcmVuKTtcblxuICAgICAgICBVdGlscy5hcHBlbmRNYW55KCRvcHRpb24sICRjaGlsZHJlbik7XG4gICAgICB9XG5cbiAgICAgICRvcHRpb25zLnB1c2goJG9wdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuICRvcHRpb25zO1xuICB9O1xuXG4gIHJldHVybiBBcnJheUFkYXB0ZXI7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2RhdGEvYWpheCcsW1xuICAnLi9hcnJheScsXG4gICcuLi91dGlscycsXG4gICdqcXVlcnknXG5dLCBmdW5jdGlvbiAoQXJyYXlBZGFwdGVyLCBVdGlscywgJCkge1xuICBmdW5jdGlvbiBBamF4QWRhcHRlciAoJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmFqYXhPcHRpb25zID0gdGhpcy5fYXBwbHlEZWZhdWx0cyhvcHRpb25zLmdldCgnYWpheCcpKTtcblxuICAgIGlmICh0aGlzLmFqYXhPcHRpb25zLnByb2Nlc3NSZXN1bHRzICE9IG51bGwpIHtcbiAgICAgIHRoaXMucHJvY2Vzc1Jlc3VsdHMgPSB0aGlzLmFqYXhPcHRpb25zLnByb2Nlc3NSZXN1bHRzO1xuICAgIH1cblxuICAgIEFqYXhBZGFwdGVyLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsICRlbGVtZW50LCBvcHRpb25zKTtcbiAgfVxuXG4gIFV0aWxzLkV4dGVuZChBamF4QWRhcHRlciwgQXJyYXlBZGFwdGVyKTtcblxuICBBamF4QWRhcHRlci5wcm90b3R5cGUuX2FwcGx5RGVmYXVsdHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgIGRhdGE6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHt9LCBwYXJhbXMsIHtcbiAgICAgICAgICBxOiBwYXJhbXMudGVybVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICB0cmFuc3BvcnQ6IGZ1bmN0aW9uIChwYXJhbXMsIHN1Y2Nlc3MsIGZhaWx1cmUpIHtcbiAgICAgICAgdmFyICRyZXF1ZXN0ID0gJC5hamF4KHBhcmFtcyk7XG5cbiAgICAgICAgJHJlcXVlc3QudGhlbihzdWNjZXNzKTtcbiAgICAgICAgJHJlcXVlc3QuZmFpbChmYWlsdXJlKTtcblxuICAgICAgICByZXR1cm4gJHJlcXVlc3Q7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMsIHRydWUpO1xuICB9O1xuXG4gIEFqYXhBZGFwdGVyLnByb3RvdHlwZS5wcm9jZXNzUmVzdWx0cyA9IGZ1bmN0aW9uIChyZXN1bHRzKSB7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgQWpheEFkYXB0ZXIucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKHBhcmFtcywgY2FsbGJhY2spIHtcbiAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0aGlzLl9yZXF1ZXN0ICE9IG51bGwpIHtcbiAgICAgIC8vIEpTT05QIHJlcXVlc3RzIGNhbm5vdCBhbHdheXMgYmUgYWJvcnRlZFxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLl9yZXF1ZXN0LmFib3J0KSkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0LmFib3J0KCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3JlcXVlc3QgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe1xuICAgICAgdHlwZTogJ0dFVCdcbiAgICB9LCB0aGlzLmFqYXhPcHRpb25zKTtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy51cmwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMudXJsID0gb3B0aW9ucy51cmwuY2FsbCh0aGlzLiRlbGVtZW50LCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5kYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLmRhdGEgPSBvcHRpb25zLmRhdGEuY2FsbCh0aGlzLiRlbGVtZW50LCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcXVlc3QgKCkge1xuICAgICAgdmFyICRyZXF1ZXN0ID0gb3B0aW9ucy50cmFuc3BvcnQob3B0aW9ucywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBzZWxmLnByb2Nlc3NSZXN1bHRzKGRhdGEsIHBhcmFtcyk7XG5cbiAgICAgICAgaWYgKHNlbGYub3B0aW9ucy5nZXQoJ2RlYnVnJykgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikge1xuICAgICAgICAgIC8vIENoZWNrIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSByZXNwb25zZSBpbmNsdWRlZCBhIGByZXN1bHRzYCBrZXkuXG4gICAgICAgICAgaWYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLnJlc3VsdHMgfHwgISQuaXNBcnJheShyZXN1bHRzLnJlc3VsdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAnU2VsZWN0MjogVGhlIEFKQVggcmVzdWx0cyBkaWQgbm90IHJldHVybiBhbiBhcnJheSBpbiB0aGUgJyArXG4gICAgICAgICAgICAgICdgcmVzdWx0c2Aga2V5IG9mIHRoZSByZXNwb25zZS4nXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdHMpO1xuICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBBdHRlbXB0IHRvIGRldGVjdCBpZiBhIHJlcXVlc3Qgd2FzIGFib3J0ZWRcbiAgICAgICAgLy8gT25seSB3b3JrcyBpZiB0aGUgdHJhbnNwb3J0IGV4cG9zZXMgYSBzdGF0dXMgcHJvcGVydHlcbiAgICAgICAgaWYgKCRyZXF1ZXN0LnN0YXR1cyAmJiAkcmVxdWVzdC5zdGF0dXMgPT09ICcwJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYudHJpZ2dlcigncmVzdWx0czptZXNzYWdlJywge1xuICAgICAgICAgIG1lc3NhZ2U6ICdlcnJvckxvYWRpbmcnXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuX3JlcXVlc3QgPSAkcmVxdWVzdDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hamF4T3B0aW9ucy5kZWxheSAmJiBwYXJhbXMudGVybSAhPSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5fcXVlcnlUaW1lb3V0KSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcXVlcnlUaW1lb3V0KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcXVlcnlUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQocmVxdWVzdCwgdGhpcy5hamF4T3B0aW9ucy5kZWxheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcXVlc3QoKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEFqYXhBZGFwdGVyO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kYXRhL3RhZ3MnLFtcbiAgJ2pxdWVyeSdcbl0sIGZ1bmN0aW9uICgkKSB7XG4gIGZ1bmN0aW9uIFRhZ3MgKGRlY29yYXRlZCwgJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB2YXIgdGFncyA9IG9wdGlvbnMuZ2V0KCd0YWdzJyk7XG5cbiAgICB2YXIgY3JlYXRlVGFnID0gb3B0aW9ucy5nZXQoJ2NyZWF0ZVRhZycpO1xuXG4gICAgaWYgKGNyZWF0ZVRhZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNyZWF0ZVRhZyA9IGNyZWF0ZVRhZztcbiAgICB9XG5cbiAgICB2YXIgaW5zZXJ0VGFnID0gb3B0aW9ucy5nZXQoJ2luc2VydFRhZycpO1xuXG4gICAgaWYgKGluc2VydFRhZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0VGFnID0gaW5zZXJ0VGFnO1xuICAgIH1cblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsICRlbGVtZW50LCBvcHRpb25zKTtcblxuICAgIGlmICgkLmlzQXJyYXkodGFncykpIHtcbiAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgdGFncy5sZW5ndGg7IHQrKykge1xuICAgICAgICB2YXIgdGFnID0gdGFnc1t0XTtcbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLl9ub3JtYWxpemVJdGVtKHRhZyk7XG5cbiAgICAgICAgdmFyICRvcHRpb24gPSB0aGlzLm9wdGlvbihpdGVtKTtcblxuICAgICAgICB0aGlzLiRlbGVtZW50LmFwcGVuZCgkb3B0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBUYWdzLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIHBhcmFtcywgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLl9yZW1vdmVPbGRUYWdzKCk7XG5cbiAgICBpZiAocGFyYW1zLnRlcm0gPT0gbnVsbCB8fCBwYXJhbXMucGFnZSAhPSBudWxsKSB7XG4gICAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCBwYXJhbXMsIGNhbGxiYWNrKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3cmFwcGVyIChvYmosIGNoaWxkKSB7XG4gICAgICB2YXIgZGF0YSA9IG9iai5yZXN1bHRzO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG9wdGlvbiA9IGRhdGFbaV07XG5cbiAgICAgICAgdmFyIGNoZWNrQ2hpbGRyZW4gPSAoXG4gICAgICAgICAgb3B0aW9uLmNoaWxkcmVuICE9IG51bGwgJiZcbiAgICAgICAgICAhd3JhcHBlcih7XG4gICAgICAgICAgICByZXN1bHRzOiBvcHRpb24uY2hpbGRyZW5cbiAgICAgICAgICB9LCB0cnVlKVxuICAgICAgICApO1xuXG4gICAgICAgIHZhciBjaGVja1RleHQgPSBvcHRpb24udGV4dCA9PT0gcGFyYW1zLnRlcm07XG5cbiAgICAgICAgaWYgKGNoZWNrVGV4dCB8fCBjaGVja0NoaWxkcmVuKSB7XG4gICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIGNhbGxiYWNrKG9iaik7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgdGFnID0gc2VsZi5jcmVhdGVUYWcocGFyYW1zKTtcblxuICAgICAgaWYgKHRhZyAhPSBudWxsKSB7XG4gICAgICAgIHZhciAkb3B0aW9uID0gc2VsZi5vcHRpb24odGFnKTtcbiAgICAgICAgJG9wdGlvbi5hdHRyKCdkYXRhLXNlbGVjdDItdGFnJywgdHJ1ZSk7XG5cbiAgICAgICAgc2VsZi5hZGRPcHRpb25zKFskb3B0aW9uXSk7XG5cbiAgICAgICAgc2VsZi5pbnNlcnRUYWcoZGF0YSwgdGFnKTtcbiAgICAgIH1cblxuICAgICAgb2JqLnJlc3VsdHMgPSBkYXRhO1xuXG4gICAgICBjYWxsYmFjayhvYmopO1xuICAgIH1cblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIHBhcmFtcywgd3JhcHBlcik7XG4gIH07XG5cbiAgVGFncy5wcm90b3R5cGUuY3JlYXRlVGFnID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgcGFyYW1zKSB7XG4gICAgdmFyIHRlcm0gPSAkLnRyaW0ocGFyYW1zLnRlcm0pO1xuXG4gICAgaWYgKHRlcm0gPT09ICcnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRlcm0sXG4gICAgICB0ZXh0OiB0ZXJtXG4gICAgfTtcbiAgfTtcblxuICBUYWdzLnByb3RvdHlwZS5pbnNlcnRUYWcgPSBmdW5jdGlvbiAoXywgZGF0YSwgdGFnKSB7XG4gICAgZGF0YS51bnNoaWZ0KHRhZyk7XG4gIH07XG5cbiAgVGFncy5wcm90b3R5cGUuX3JlbW92ZU9sZFRhZ3MgPSBmdW5jdGlvbiAoXykge1xuICAgIHZhciB0YWcgPSB0aGlzLl9sYXN0VGFnO1xuXG4gICAgdmFyICRvcHRpb25zID0gdGhpcy4kZWxlbWVudC5maW5kKCdvcHRpb25bZGF0YS1zZWxlY3QyLXRhZ10nKTtcblxuICAgICRvcHRpb25zLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBUYWdzO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kYXRhL3Rva2VuaXplcicsW1xuICAnanF1ZXJ5J1xuXSwgZnVuY3Rpb24gKCQpIHtcbiAgZnVuY3Rpb24gVG9rZW5pemVyIChkZWNvcmF0ZWQsICRlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdmFyIHRva2VuaXplciA9IG9wdGlvbnMuZ2V0KCd0b2tlbml6ZXInKTtcblxuICAgIGlmICh0b2tlbml6ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy50b2tlbml6ZXIgPSB0b2tlbml6ZXI7XG4gICAgfVxuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgJGVsZW1lbnQsIG9wdGlvbnMpO1xuICB9XG5cbiAgVG9rZW5pemVyLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgY29udGFpbmVyLCAkY29udGFpbmVyKSB7XG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY29udGFpbmVyLCAkY29udGFpbmVyKTtcblxuICAgIHRoaXMuJHNlYXJjaCA9ICBjb250YWluZXIuZHJvcGRvd24uJHNlYXJjaCB8fCBjb250YWluZXIuc2VsZWN0aW9uLiRzZWFyY2ggfHxcbiAgICAgICRjb250YWluZXIuZmluZCgnLnNlbGVjdDItc2VhcmNoX19maWVsZCcpO1xuICB9O1xuXG4gIFRva2VuaXplci5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBwYXJhbXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlQW5kU2VsZWN0IChkYXRhKSB7XG4gICAgICAvLyBOb3JtYWxpemUgdGhlIGRhdGEgb2JqZWN0IHNvIHdlIGNhbiB1c2UgaXQgZm9yIGNoZWNrc1xuICAgICAgdmFyIGl0ZW0gPSBzZWxmLl9ub3JtYWxpemVJdGVtKGRhdGEpO1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgZGF0YSBvYmplY3QgYWxyZWFkeSBleGlzdHMgYXMgYSB0YWdcbiAgICAgIC8vIFNlbGVjdCBpdCBpZiBpdCBkb2Vzbid0XG4gICAgICB2YXIgJGV4aXN0aW5nT3B0aW9ucyA9IHNlbGYuJGVsZW1lbnQuZmluZCgnb3B0aW9uJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICQodGhpcykudmFsKCkgPT09IGl0ZW0uaWQ7XG4gICAgICB9KTtcblxuICAgICAgLy8gSWYgYW4gZXhpc3Rpbmcgb3B0aW9uIHdhc24ndCBmb3VuZCBmb3IgaXQsIGNyZWF0ZSB0aGUgb3B0aW9uXG4gICAgICBpZiAoISRleGlzdGluZ09wdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHZhciAkb3B0aW9uID0gc2VsZi5vcHRpb24oaXRlbSk7XG4gICAgICAgICRvcHRpb24uYXR0cignZGF0YS1zZWxlY3QyLXRhZycsIHRydWUpO1xuXG4gICAgICAgIHNlbGYuX3JlbW92ZU9sZFRhZ3MoKTtcbiAgICAgICAgc2VsZi5hZGRPcHRpb25zKFskb3B0aW9uXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbGVjdCB0aGUgaXRlbSwgbm93IHRoYXQgd2Uga25vdyB0aGVyZSBpcyBhbiBvcHRpb24gZm9yIGl0XG4gICAgICBzZWxlY3QoaXRlbSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VsZWN0IChkYXRhKSB7XG4gICAgICBzZWxmLnRyaWdnZXIoJ3NlbGVjdCcsIHtcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcGFyYW1zLnRlcm0gPSBwYXJhbXMudGVybSB8fCAnJztcblxuICAgIHZhciB0b2tlbkRhdGEgPSB0aGlzLnRva2VuaXplcihwYXJhbXMsIHRoaXMub3B0aW9ucywgY3JlYXRlQW5kU2VsZWN0KTtcblxuICAgIGlmICh0b2tlbkRhdGEudGVybSAhPT0gcGFyYW1zLnRlcm0pIHtcbiAgICAgIC8vIFJlcGxhY2UgdGhlIHNlYXJjaCB0ZXJtIGlmIHdlIGhhdmUgdGhlIHNlYXJjaCBib3hcbiAgICAgIGlmICh0aGlzLiRzZWFyY2gubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuJHNlYXJjaC52YWwodG9rZW5EYXRhLnRlcm0pO1xuICAgICAgICB0aGlzLiRzZWFyY2guZm9jdXMoKTtcbiAgICAgIH1cblxuICAgICAgcGFyYW1zLnRlcm0gPSB0b2tlbkRhdGEudGVybTtcbiAgICB9XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCBwYXJhbXMsIGNhbGxiYWNrKTtcbiAgfTtcblxuICBUb2tlbml6ZXIucHJvdG90eXBlLnRva2VuaXplciA9IGZ1bmN0aW9uIChfLCBwYXJhbXMsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlcGFyYXRvcnMgPSBvcHRpb25zLmdldCgndG9rZW5TZXBhcmF0b3JzJykgfHwgW107XG4gICAgdmFyIHRlcm0gPSBwYXJhbXMudGVybTtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB2YXIgY3JlYXRlVGFnID0gdGhpcy5jcmVhdGVUYWcgfHwgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IHBhcmFtcy50ZXJtLFxuICAgICAgICB0ZXh0OiBwYXJhbXMudGVybVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgd2hpbGUgKGkgPCB0ZXJtLmxlbmd0aCkge1xuICAgICAgdmFyIHRlcm1DaGFyID0gdGVybVtpXTtcblxuICAgICAgaWYgKCQuaW5BcnJheSh0ZXJtQ2hhciwgc2VwYXJhdG9ycykgPT09IC0xKSB7XG4gICAgICAgIGkrKztcblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHBhcnQgPSB0ZXJtLnN1YnN0cigwLCBpKTtcbiAgICAgIHZhciBwYXJ0UGFyYW1zID0gJC5leHRlbmQoe30sIHBhcmFtcywge1xuICAgICAgICB0ZXJtOiBwYXJ0XG4gICAgICB9KTtcblxuICAgICAgdmFyIGRhdGEgPSBjcmVhdGVUYWcocGFydFBhcmFtcyk7XG5cbiAgICAgIGlmIChkYXRhID09IG51bGwpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2soZGF0YSk7XG5cbiAgICAgIC8vIFJlc2V0IHRoZSB0ZXJtIHRvIG5vdCBpbmNsdWRlIHRoZSB0b2tlbml6ZWQgcG9ydGlvblxuICAgICAgdGVybSA9IHRlcm0uc3Vic3RyKGkgKyAxKSB8fCAnJztcbiAgICAgIGkgPSAwO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0ZXJtOiB0ZXJtXG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4gVG9rZW5pemVyO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kYXRhL21pbmltdW1JbnB1dExlbmd0aCcsW1xuXG5dLCBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIE1pbmltdW1JbnB1dExlbmd0aCAoZGVjb3JhdGVkLCAkZSwgb3B0aW9ucykge1xuICAgIHRoaXMubWluaW11bUlucHV0TGVuZ3RoID0gb3B0aW9ucy5nZXQoJ21pbmltdW1JbnB1dExlbmd0aCcpO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgJGUsIG9wdGlvbnMpO1xuICB9XG5cbiAgTWluaW11bUlucHV0TGVuZ3RoLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIHBhcmFtcywgY2FsbGJhY2spIHtcbiAgICBwYXJhbXMudGVybSA9IHBhcmFtcy50ZXJtIHx8ICcnO1xuXG4gICAgaWYgKHBhcmFtcy50ZXJtLmxlbmd0aCA8IHRoaXMubWluaW11bUlucHV0TGVuZ3RoKSB7XG4gICAgICB0aGlzLnRyaWdnZXIoJ3Jlc3VsdHM6bWVzc2FnZScsIHtcbiAgICAgICAgbWVzc2FnZTogJ2lucHV0VG9vU2hvcnQnLFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgbWluaW11bTogdGhpcy5taW5pbXVtSW5wdXRMZW5ndGgsXG4gICAgICAgICAgaW5wdXQ6IHBhcmFtcy50ZXJtLFxuICAgICAgICAgIHBhcmFtczogcGFyYW1zXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgcGFyYW1zLCBjYWxsYmFjayk7XG4gIH07XG5cbiAgcmV0dXJuIE1pbmltdW1JbnB1dExlbmd0aDtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvZGF0YS9tYXhpbXVtSW5wdXRMZW5ndGgnLFtcblxuXSwgZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBNYXhpbXVtSW5wdXRMZW5ndGggKGRlY29yYXRlZCwgJGUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm1heGltdW1JbnB1dExlbmd0aCA9IG9wdGlvbnMuZ2V0KCdtYXhpbXVtSW5wdXRMZW5ndGgnKTtcblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsICRlLCBvcHRpb25zKTtcbiAgfVxuXG4gIE1heGltdW1JbnB1dExlbmd0aC5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBwYXJhbXMsIGNhbGxiYWNrKSB7XG4gICAgcGFyYW1zLnRlcm0gPSBwYXJhbXMudGVybSB8fCAnJztcblxuICAgIGlmICh0aGlzLm1heGltdW1JbnB1dExlbmd0aCA+IDAgJiZcbiAgICAgICAgcGFyYW1zLnRlcm0ubGVuZ3RoID4gdGhpcy5tYXhpbXVtSW5wdXRMZW5ndGgpIHtcbiAgICAgIHRoaXMudHJpZ2dlcigncmVzdWx0czptZXNzYWdlJywge1xuICAgICAgICBtZXNzYWdlOiAnaW5wdXRUb29Mb25nJyxcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgIG1heGltdW06IHRoaXMubWF4aW11bUlucHV0TGVuZ3RoLFxuICAgICAgICAgIGlucHV0OiBwYXJhbXMudGVybSxcbiAgICAgICAgICBwYXJhbXM6IHBhcmFtc1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIHBhcmFtcywgY2FsbGJhY2spO1xuICB9O1xuXG4gIHJldHVybiBNYXhpbXVtSW5wdXRMZW5ndGg7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2RhdGEvbWF4aW11bVNlbGVjdGlvbkxlbmd0aCcsW1xuXG5dLCBmdW5jdGlvbiAoKXtcbiAgZnVuY3Rpb24gTWF4aW11bVNlbGVjdGlvbkxlbmd0aCAoZGVjb3JhdGVkLCAkZSwgb3B0aW9ucykge1xuICAgIHRoaXMubWF4aW11bVNlbGVjdGlvbkxlbmd0aCA9IG9wdGlvbnMuZ2V0KCdtYXhpbXVtU2VsZWN0aW9uTGVuZ3RoJyk7XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCAkZSwgb3B0aW9ucyk7XG4gIH1cblxuICBNYXhpbXVtU2VsZWN0aW9uTGVuZ3RoLnByb3RvdHlwZS5xdWVyeSA9XG4gICAgZnVuY3Rpb24gKGRlY29yYXRlZCwgcGFyYW1zLCBjYWxsYmFjaykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICB0aGlzLmN1cnJlbnQoZnVuY3Rpb24gKGN1cnJlbnREYXRhKSB7XG4gICAgICAgIHZhciBjb3VudCA9IGN1cnJlbnREYXRhICE9IG51bGwgPyBjdXJyZW50RGF0YS5sZW5ndGggOiAwO1xuICAgICAgICBpZiAoc2VsZi5tYXhpbXVtU2VsZWN0aW9uTGVuZ3RoID4gMCAmJlxuICAgICAgICAgIGNvdW50ID49IHNlbGYubWF4aW11bVNlbGVjdGlvbkxlbmd0aCkge1xuICAgICAgICAgIHNlbGYudHJpZ2dlcigncmVzdWx0czptZXNzYWdlJywge1xuICAgICAgICAgICAgbWVzc2FnZTogJ21heGltdW1TZWxlY3RlZCcsXG4gICAgICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICAgIG1heGltdW06IHNlbGYubWF4aW11bVNlbGVjdGlvbkxlbmd0aFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZWNvcmF0ZWQuY2FsbChzZWxmLCBwYXJhbXMsIGNhbGxiYWNrKTtcbiAgICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBNYXhpbXVtU2VsZWN0aW9uTGVuZ3RoO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bicsW1xuICAnanF1ZXJ5JyxcbiAgJy4vdXRpbHMnXG5dLCBmdW5jdGlvbiAoJCwgVXRpbHMpIHtcbiAgZnVuY3Rpb24gRHJvcGRvd24gKCRlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICRlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICBEcm9wZG93bi5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzKTtcbiAgfVxuXG4gIFV0aWxzLkV4dGVuZChEcm9wZG93biwgVXRpbHMuT2JzZXJ2YWJsZSk7XG5cbiAgRHJvcGRvd24ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGRyb3Bkb3duID0gJChcbiAgICAgICc8c3BhbiBjbGFzcz1cInNlbGVjdDItZHJvcGRvd25cIj4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwic2VsZWN0Mi1yZXN1bHRzXCI+PC9zcGFuPicgK1xuICAgICAgJzwvc3Bhbj4nXG4gICAgKTtcblxuICAgICRkcm9wZG93bi5hdHRyKCdkaXInLCB0aGlzLm9wdGlvbnMuZ2V0KCdkaXInKSk7XG5cbiAgICB0aGlzLiRkcm9wZG93biA9ICRkcm9wZG93bjtcblxuICAgIHJldHVybiAkZHJvcGRvd247XG4gIH07XG5cbiAgRHJvcGRvd24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gU2hvdWxkIGJlIGltcGxlbWVudGVkIGluIHN1YmNsYXNzZXNcbiAgfTtcblxuICBEcm9wZG93bi5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbiAoJGRyb3Bkb3duLCAkY29udGFpbmVyKSB7XG4gICAgLy8gU2hvdWxkIGJlIGltcGxtZW50ZWQgaW4gc3ViY2xhc3Nlc1xuICB9O1xuXG4gIERyb3Bkb3duLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFJlbW92ZSB0aGUgZHJvcGRvd24gZnJvbSB0aGUgRE9NXG4gICAgdGhpcy4kZHJvcGRvd24ucmVtb3ZlKCk7XG4gIH07XG5cbiAgcmV0dXJuIERyb3Bkb3duO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bi9zZWFyY2gnLFtcbiAgJ2pxdWVyeScsXG4gICcuLi91dGlscydcbl0sIGZ1bmN0aW9uICgkLCBVdGlscykge1xuICBmdW5jdGlvbiBTZWFyY2ggKCkgeyB9XG5cbiAgU2VhcmNoLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoZGVjb3JhdGVkKSB7XG4gICAgdmFyICRyZW5kZXJlZCA9IGRlY29yYXRlZC5jYWxsKHRoaXMpO1xuXG4gICAgdmFyICRzZWFyY2ggPSAkKFxuICAgICAgJzxzcGFuIGNsYXNzPVwic2VsZWN0Mi1zZWFyY2ggc2VsZWN0Mi1zZWFyY2gtLWRyb3Bkb3duXCI+JyArXG4gICAgICAgICc8aW5wdXQgY2xhc3M9XCJzZWxlY3QyLXNlYXJjaF9fZmllbGRcIiB0eXBlPVwic2VhcmNoXCIgdGFiaW5kZXg9XCItMVwiJyArXG4gICAgICAgICcgYXV0b2NvbXBsZXRlPVwib2ZmXCIgYXV0b2NvcnJlY3Q9XCJvZmZcIiBhdXRvY2FwaXRhbGl6ZT1cIm9mZlwiJyArXG4gICAgICAgICcgc3BlbGxjaGVjaz1cImZhbHNlXCIgcm9sZT1cInRleHRib3hcIiAvPicgK1xuICAgICAgJzwvc3Bhbj4nXG4gICAgKTtcblxuICAgIHRoaXMuJHNlYXJjaENvbnRhaW5lciA9ICRzZWFyY2g7XG4gICAgdGhpcy4kc2VhcmNoID0gJHNlYXJjaC5maW5kKCdpbnB1dCcpO1xuXG4gICAgJHJlbmRlcmVkLnByZXBlbmQoJHNlYXJjaCk7XG5cbiAgICByZXR1cm4gJHJlbmRlcmVkO1xuICB9O1xuXG4gIFNlYXJjaC5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIGNvbnRhaW5lciwgJGNvbnRhaW5lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIGNvbnRhaW5lciwgJGNvbnRhaW5lcik7XG5cbiAgICB0aGlzLiRzZWFyY2gub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICBzZWxmLnRyaWdnZXIoJ2tleXByZXNzJywgZXZ0KTtcblxuICAgICAgc2VsZi5fa2V5VXBQcmV2ZW50ZWQgPSBldnQuaXNEZWZhdWx0UHJldmVudGVkKCk7XG4gICAgfSk7XG5cbiAgICAvLyBXb3JrYXJvdW5kIGZvciBicm93c2VycyB3aGljaCBkbyBub3Qgc3VwcG9ydCB0aGUgYGlucHV0YCBldmVudFxuICAgIC8vIFRoaXMgd2lsbCBwcmV2ZW50IGRvdWJsZS10cmlnZ2VyaW5nIG9mIGV2ZW50cyBmb3IgYnJvd3NlcnMgd2hpY2ggc3VwcG9ydFxuICAgIC8vIGJvdGggdGhlIGBrZXl1cGAgYW5kIGBpbnB1dGAgZXZlbnRzLlxuICAgIHRoaXMuJHNlYXJjaC5vbignaW5wdXQnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAvLyBVbmJpbmQgdGhlIGR1cGxpY2F0ZWQgYGtleXVwYCBldmVudFxuICAgICAgJCh0aGlzKS5vZmYoJ2tleXVwJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRzZWFyY2gub24oJ2tleXVwIGlucHV0JywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi5oYW5kbGVTZWFyY2goZXZ0KTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbignb3BlbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuJHNlYXJjaC5hdHRyKCd0YWJpbmRleCcsIDApO1xuXG4gICAgICBzZWxmLiRzZWFyY2guZm9jdXMoKTtcblxuICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLiRzZWFyY2guZm9jdXMoKTtcbiAgICAgIH0sIDApO1xuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuJHNlYXJjaC5hdHRyKCd0YWJpbmRleCcsIC0xKTtcblxuICAgICAgc2VsZi4kc2VhcmNoLnZhbCgnJyk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvbnRhaW5lci5pc09wZW4oKSkge1xuICAgICAgICBzZWxmLiRzZWFyY2guZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbigncmVzdWx0czphbGwnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICBpZiAocGFyYW1zLnF1ZXJ5LnRlcm0gPT0gbnVsbCB8fCBwYXJhbXMucXVlcnkudGVybSA9PT0gJycpIHtcbiAgICAgICAgdmFyIHNob3dTZWFyY2ggPSBzZWxmLnNob3dTZWFyY2gocGFyYW1zKTtcblxuICAgICAgICBpZiAoc2hvd1NlYXJjaCkge1xuICAgICAgICAgIHNlbGYuJHNlYXJjaENvbnRhaW5lci5yZW1vdmVDbGFzcygnc2VsZWN0Mi1zZWFyY2gtLWhpZGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLiRzZWFyY2hDb250YWluZXIuYWRkQ2xhc3MoJ3NlbGVjdDItc2VhcmNoLS1oaWRlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBTZWFyY2gucHJvdG90eXBlLmhhbmRsZVNlYXJjaCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoIXRoaXMuX2tleVVwUHJldmVudGVkKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiRzZWFyY2gudmFsKCk7XG5cbiAgICAgIHRoaXMudHJpZ2dlcigncXVlcnknLCB7XG4gICAgICAgIHRlcm06IGlucHV0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9rZXlVcFByZXZlbnRlZCA9IGZhbHNlO1xuICB9O1xuXG4gIFNlYXJjaC5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChfLCBwYXJhbXMpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICByZXR1cm4gU2VhcmNoO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bi9oaWRlUGxhY2Vob2xkZXInLFtcblxuXSwgZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBIaWRlUGxhY2Vob2xkZXIgKGRlY29yYXRlZCwgJGVsZW1lbnQsIG9wdGlvbnMsIGRhdGFBZGFwdGVyKSB7XG4gICAgdGhpcy5wbGFjZWhvbGRlciA9IHRoaXMubm9ybWFsaXplUGxhY2Vob2xkZXIob3B0aW9ucy5nZXQoJ3BsYWNlaG9sZGVyJykpO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgJGVsZW1lbnQsIG9wdGlvbnMsIGRhdGFBZGFwdGVyKTtcbiAgfVxuXG4gIEhpZGVQbGFjZWhvbGRlci5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgZGF0YSkge1xuICAgIGRhdGEucmVzdWx0cyA9IHRoaXMucmVtb3ZlUGxhY2Vob2xkZXIoZGF0YS5yZXN1bHRzKTtcblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIGRhdGEpO1xuICB9O1xuXG4gIEhpZGVQbGFjZWhvbGRlci5wcm90b3R5cGUubm9ybWFsaXplUGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoXywgcGxhY2Vob2xkZXIpIHtcbiAgICBpZiAodHlwZW9mIHBsYWNlaG9sZGVyID09PSAnc3RyaW5nJykge1xuICAgICAgcGxhY2Vob2xkZXIgPSB7XG4gICAgICAgIGlkOiAnJyxcbiAgICAgICAgdGV4dDogcGxhY2Vob2xkZXJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICB9O1xuXG4gIEhpZGVQbGFjZWhvbGRlci5wcm90b3R5cGUucmVtb3ZlUGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoXywgZGF0YSkge1xuICAgIHZhciBtb2RpZmllZERhdGEgPSBkYXRhLnNsaWNlKDApO1xuXG4gICAgZm9yICh2YXIgZCA9IGRhdGEubGVuZ3RoIC0gMTsgZCA+PSAwOyBkLS0pIHtcbiAgICAgIHZhciBpdGVtID0gZGF0YVtkXTtcblxuICAgICAgaWYgKHRoaXMucGxhY2Vob2xkZXIuaWQgPT09IGl0ZW0uaWQpIHtcbiAgICAgICAgbW9kaWZpZWREYXRhLnNwbGljZShkLCAxKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9kaWZpZWREYXRhO1xuICB9O1xuXG4gIHJldHVybiBIaWRlUGxhY2Vob2xkZXI7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2Ryb3Bkb3duL2luZmluaXRlU2Nyb2xsJyxbXG4gICdqcXVlcnknXG5dLCBmdW5jdGlvbiAoJCkge1xuICBmdW5jdGlvbiBJbmZpbml0ZVNjcm9sbCAoZGVjb3JhdGVkLCAkZWxlbWVudCwgb3B0aW9ucywgZGF0YUFkYXB0ZXIpIHtcbiAgICB0aGlzLmxhc3RQYXJhbXMgPSB7fTtcblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsICRlbGVtZW50LCBvcHRpb25zLCBkYXRhQWRhcHRlcik7XG5cbiAgICB0aGlzLiRsb2FkaW5nTW9yZSA9IHRoaXMuY3JlYXRlTG9hZGluZ01vcmUoKTtcbiAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIEluZmluaXRlU2Nyb2xsLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbiAoZGVjb3JhdGVkLCBkYXRhKSB7XG4gICAgdGhpcy4kbG9hZGluZ01vcmUucmVtb3ZlKCk7XG4gICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCBkYXRhKTtcblxuICAgIGlmICh0aGlzLnNob3dMb2FkaW5nTW9yZShkYXRhKSkge1xuICAgICAgdGhpcy4kcmVzdWx0cy5hcHBlbmQodGhpcy4kbG9hZGluZ01vcmUpO1xuICAgIH1cbiAgfTtcblxuICBJbmZpbml0ZVNjcm9sbC5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIGNvbnRhaW5lciwgJGNvbnRhaW5lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIGNvbnRhaW5lciwgJGNvbnRhaW5lcik7XG5cbiAgICBjb250YWluZXIub24oJ3F1ZXJ5JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi5sYXN0UGFyYW1zID0gcGFyYW1zO1xuICAgICAgc2VsZi5sb2FkaW5nID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5vbigncXVlcnk6YXBwZW5kJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgc2VsZi5sYXN0UGFyYW1zID0gcGFyYW1zO1xuICAgICAgc2VsZi5sb2FkaW5nID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuJHJlc3VsdHMub24oJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBpc0xvYWRNb3JlVmlzaWJsZSA9ICQuY29udGFpbnMoXG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgc2VsZi4kbG9hZGluZ01vcmVbMF1cbiAgICAgICk7XG5cbiAgICAgIGlmIChzZWxmLmxvYWRpbmcgfHwgIWlzTG9hZE1vcmVWaXNpYmxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGN1cnJlbnRPZmZzZXQgPSBzZWxmLiRyZXN1bHRzLm9mZnNldCgpLnRvcCArXG4gICAgICAgIHNlbGYuJHJlc3VsdHMub3V0ZXJIZWlnaHQoZmFsc2UpO1xuICAgICAgdmFyIGxvYWRpbmdNb3JlT2Zmc2V0ID0gc2VsZi4kbG9hZGluZ01vcmUub2Zmc2V0KCkudG9wICtcbiAgICAgICAgc2VsZi4kbG9hZGluZ01vcmUub3V0ZXJIZWlnaHQoZmFsc2UpO1xuXG4gICAgICBpZiAoY3VycmVudE9mZnNldCArIDUwID49IGxvYWRpbmdNb3JlT2Zmc2V0KSB7XG4gICAgICAgIHNlbGYubG9hZE1vcmUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBJbmZpbml0ZVNjcm9sbC5wcm90b3R5cGUubG9hZE1vcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcblxuICAgIHZhciBwYXJhbXMgPSAkLmV4dGVuZCh7fSwge3BhZ2U6IDF9LCB0aGlzLmxhc3RQYXJhbXMpO1xuXG4gICAgcGFyYW1zLnBhZ2UrKztcblxuICAgIHRoaXMudHJpZ2dlcigncXVlcnk6YXBwZW5kJywgcGFyYW1zKTtcbiAgfTtcblxuICBJbmZpbml0ZVNjcm9sbC5wcm90b3R5cGUuc2hvd0xvYWRpbmdNb3JlID0gZnVuY3Rpb24gKF8sIGRhdGEpIHtcbiAgICByZXR1cm4gZGF0YS5wYWdpbmF0aW9uICYmIGRhdGEucGFnaW5hdGlvbi5tb3JlO1xuICB9O1xuXG4gIEluZmluaXRlU2Nyb2xsLnByb3RvdHlwZS5jcmVhdGVMb2FkaW5nTW9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJG9wdGlvbiA9ICQoXG4gICAgICAnPGxpICcgK1xuICAgICAgJ2NsYXNzPVwic2VsZWN0Mi1yZXN1bHRzX19vcHRpb24gc2VsZWN0Mi1yZXN1bHRzX19vcHRpb24tLWxvYWQtbW9yZVwiJyArXG4gICAgICAncm9sZT1cInRyZWVpdGVtXCIgYXJpYS1kaXNhYmxlZD1cInRydWVcIj48L2xpPidcbiAgICApO1xuXG4gICAgdmFyIG1lc3NhZ2UgPSB0aGlzLm9wdGlvbnMuZ2V0KCd0cmFuc2xhdGlvbnMnKS5nZXQoJ2xvYWRpbmdNb3JlJyk7XG5cbiAgICAkb3B0aW9uLmh0bWwobWVzc2FnZSh0aGlzLmxhc3RQYXJhbXMpKTtcblxuICAgIHJldHVybiAkb3B0aW9uO1xuICB9O1xuXG4gIHJldHVybiBJbmZpbml0ZVNjcm9sbDtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvZHJvcGRvd24vYXR0YWNoQm9keScsW1xuICAnanF1ZXJ5JyxcbiAgJy4uL3V0aWxzJ1xuXSwgZnVuY3Rpb24gKCQsIFV0aWxzKSB7XG4gIGZ1bmN0aW9uIEF0dGFjaEJvZHkgKGRlY29yYXRlZCwgJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRkcm9wZG93blBhcmVudCA9IG9wdGlvbnMuZ2V0KCdkcm9wZG93blBhcmVudCcpIHx8ICQoZG9jdW1lbnQuYm9keSk7XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCAkZWxlbWVudCwgb3B0aW9ucyk7XG4gIH1cblxuICBBdHRhY2hCb2R5LnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgY29udGFpbmVyLCAkY29udGFpbmVyKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHNldHVwUmVzdWx0c0V2ZW50cyA9IGZhbHNlO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY29udGFpbmVyLCAkY29udGFpbmVyKTtcblxuICAgIGNvbnRhaW5lci5vbignb3BlbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuX3Nob3dEcm9wZG93bigpO1xuICAgICAgc2VsZi5fYXR0YWNoUG9zaXRpb25pbmdIYW5kbGVyKGNvbnRhaW5lcik7XG5cbiAgICAgIGlmICghc2V0dXBSZXN1bHRzRXZlbnRzKSB7XG4gICAgICAgIHNldHVwUmVzdWx0c0V2ZW50cyA9IHRydWU7XG5cbiAgICAgICAgY29udGFpbmVyLm9uKCdyZXN1bHRzOmFsbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLl9wb3NpdGlvbkRyb3Bkb3duKCk7XG4gICAgICAgICAgc2VsZi5fcmVzaXplRHJvcGRvd24oKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGFpbmVyLm9uKCdyZXN1bHRzOmFwcGVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLl9wb3NpdGlvbkRyb3Bkb3duKCk7XG4gICAgICAgICAgc2VsZi5fcmVzaXplRHJvcGRvd24oKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5faGlkZURyb3Bkb3duKCk7XG4gICAgICBzZWxmLl9kZXRhY2hQb3NpdGlvbmluZ0hhbmRsZXIoY29udGFpbmVyKTtcbiAgICB9KTtcblxuICAgIHRoaXMuJGRyb3Bkb3duQ29udGFpbmVyLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgQXR0YWNoQm9keS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQpIHtcbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMuJGRyb3Bkb3duQ29udGFpbmVyLnJlbW92ZSgpO1xuICB9O1xuXG4gIEF0dGFjaEJvZHkucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgJGRyb3Bkb3duLCAkY29udGFpbmVyKSB7XG4gICAgLy8gQ2xvbmUgYWxsIG9mIHRoZSBjb250YWluZXIgY2xhc3Nlc1xuICAgICRkcm9wZG93bi5hdHRyKCdjbGFzcycsICRjb250YWluZXIuYXR0cignY2xhc3MnKSk7XG5cbiAgICAkZHJvcGRvd24ucmVtb3ZlQ2xhc3MoJ3NlbGVjdDInKTtcbiAgICAkZHJvcGRvd24uYWRkQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS1vcGVuJyk7XG5cbiAgICAkZHJvcGRvd24uY3NzKHtcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdG9wOiAtOTk5OTk5XG4gICAgfSk7XG5cbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICB9O1xuXG4gIEF0dGFjaEJvZHkucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQpIHtcbiAgICB2YXIgJGNvbnRhaW5lciA9ICQoJzxzcGFuPjwvc3Bhbj4nKTtcblxuICAgIHZhciAkZHJvcGRvd24gPSBkZWNvcmF0ZWQuY2FsbCh0aGlzKTtcbiAgICAkY29udGFpbmVyLmFwcGVuZCgkZHJvcGRvd24pO1xuXG4gICAgdGhpcy4kZHJvcGRvd25Db250YWluZXIgPSAkY29udGFpbmVyO1xuXG4gICAgcmV0dXJuICRjb250YWluZXI7XG4gIH07XG5cbiAgQXR0YWNoQm9keS5wcm90b3R5cGUuX2hpZGVEcm9wZG93biA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQpIHtcbiAgICB0aGlzLiRkcm9wZG93bkNvbnRhaW5lci5kZXRhY2goKTtcbiAgfTtcblxuICBBdHRhY2hCb2R5LnByb3RvdHlwZS5fYXR0YWNoUG9zaXRpb25pbmdIYW5kbGVyID1cbiAgICAgIGZ1bmN0aW9uIChkZWNvcmF0ZWQsIGNvbnRhaW5lcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBzY3JvbGxFdmVudCA9ICdzY3JvbGwuc2VsZWN0Mi4nICsgY29udGFpbmVyLmlkO1xuICAgIHZhciByZXNpemVFdmVudCA9ICdyZXNpemUuc2VsZWN0Mi4nICsgY29udGFpbmVyLmlkO1xuICAgIHZhciBvcmllbnRhdGlvbkV2ZW50ID0gJ29yaWVudGF0aW9uY2hhbmdlLnNlbGVjdDIuJyArIGNvbnRhaW5lci5pZDtcblxuICAgIHZhciAkd2F0Y2hlcnMgPSB0aGlzLiRjb250YWluZXIucGFyZW50cygpLmZpbHRlcihVdGlscy5oYXNTY3JvbGwpO1xuICAgICR3YXRjaGVycy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICQodGhpcykuZGF0YSgnc2VsZWN0Mi1zY3JvbGwtcG9zaXRpb24nLCB7XG4gICAgICAgIHg6ICQodGhpcykuc2Nyb2xsTGVmdCgpLFxuICAgICAgICB5OiAkKHRoaXMpLnNjcm9sbFRvcCgpXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgICR3YXRjaGVycy5vbihzY3JvbGxFdmVudCwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICB2YXIgcG9zaXRpb24gPSAkKHRoaXMpLmRhdGEoJ3NlbGVjdDItc2Nyb2xsLXBvc2l0aW9uJyk7XG4gICAgICAkKHRoaXMpLnNjcm9sbFRvcChwb3NpdGlvbi55KTtcbiAgICB9KTtcblxuICAgICQod2luZG93KS5vbihzY3JvbGxFdmVudCArICcgJyArIHJlc2l6ZUV2ZW50ICsgJyAnICsgb3JpZW50YXRpb25FdmVudCxcbiAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICBzZWxmLl9wb3NpdGlvbkRyb3Bkb3duKCk7XG4gICAgICBzZWxmLl9yZXNpemVEcm9wZG93bigpO1xuICAgIH0pO1xuICB9O1xuXG4gIEF0dGFjaEJvZHkucHJvdG90eXBlLl9kZXRhY2hQb3NpdGlvbmluZ0hhbmRsZXIgPVxuICAgICAgZnVuY3Rpb24gKGRlY29yYXRlZCwgY29udGFpbmVyKSB7XG4gICAgdmFyIHNjcm9sbEV2ZW50ID0gJ3Njcm9sbC5zZWxlY3QyLicgKyBjb250YWluZXIuaWQ7XG4gICAgdmFyIHJlc2l6ZUV2ZW50ID0gJ3Jlc2l6ZS5zZWxlY3QyLicgKyBjb250YWluZXIuaWQ7XG4gICAgdmFyIG9yaWVudGF0aW9uRXZlbnQgPSAnb3JpZW50YXRpb25jaGFuZ2Uuc2VsZWN0Mi4nICsgY29udGFpbmVyLmlkO1xuXG4gICAgdmFyICR3YXRjaGVycyA9IHRoaXMuJGNvbnRhaW5lci5wYXJlbnRzKCkuZmlsdGVyKFV0aWxzLmhhc1Njcm9sbCk7XG4gICAgJHdhdGNoZXJzLm9mZihzY3JvbGxFdmVudCk7XG5cbiAgICAkKHdpbmRvdykub2ZmKHNjcm9sbEV2ZW50ICsgJyAnICsgcmVzaXplRXZlbnQgKyAnICcgKyBvcmllbnRhdGlvbkV2ZW50KTtcbiAgfTtcblxuICBBdHRhY2hCb2R5LnByb3RvdHlwZS5fcG9zaXRpb25Ecm9wZG93biA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHdpbmRvdyA9ICQod2luZG93KTtcblxuICAgIHZhciBpc0N1cnJlbnRseUFib3ZlID0gdGhpcy4kZHJvcGRvd24uaGFzQ2xhc3MoJ3NlbGVjdDItZHJvcGRvd24tLWFib3ZlJyk7XG4gICAgdmFyIGlzQ3VycmVudGx5QmVsb3cgPSB0aGlzLiRkcm9wZG93bi5oYXNDbGFzcygnc2VsZWN0Mi1kcm9wZG93bi0tYmVsb3cnKTtcblxuICAgIHZhciBuZXdEaXJlY3Rpb24gPSBudWxsO1xuXG4gICAgdmFyIG9mZnNldCA9IHRoaXMuJGNvbnRhaW5lci5vZmZzZXQoKTtcblxuICAgIG9mZnNldC5ib3R0b20gPSBvZmZzZXQudG9wICsgdGhpcy4kY29udGFpbmVyLm91dGVySGVpZ2h0KGZhbHNlKTtcblxuICAgIHZhciBjb250YWluZXIgPSB7XG4gICAgICBoZWlnaHQ6IHRoaXMuJGNvbnRhaW5lci5vdXRlckhlaWdodChmYWxzZSlcbiAgICB9O1xuXG4gICAgY29udGFpbmVyLnRvcCA9IG9mZnNldC50b3A7XG4gICAgY29udGFpbmVyLmJvdHRvbSA9IG9mZnNldC50b3AgKyBjb250YWluZXIuaGVpZ2h0O1xuXG4gICAgdmFyIGRyb3Bkb3duID0ge1xuICAgICAgaGVpZ2h0OiB0aGlzLiRkcm9wZG93bi5vdXRlckhlaWdodChmYWxzZSlcbiAgICB9O1xuXG4gICAgdmFyIHZpZXdwb3J0ID0ge1xuICAgICAgdG9wOiAkd2luZG93LnNjcm9sbFRvcCgpLFxuICAgICAgYm90dG9tOiAkd2luZG93LnNjcm9sbFRvcCgpICsgJHdpbmRvdy5oZWlnaHQoKVxuICAgIH07XG5cbiAgICB2YXIgZW5vdWdoUm9vbUFib3ZlID0gdmlld3BvcnQudG9wIDwgKG9mZnNldC50b3AgLSBkcm9wZG93bi5oZWlnaHQpO1xuICAgIHZhciBlbm91Z2hSb29tQmVsb3cgPSB2aWV3cG9ydC5ib3R0b20gPiAob2Zmc2V0LmJvdHRvbSArIGRyb3Bkb3duLmhlaWdodCk7XG5cbiAgICB2YXIgY3NzID0ge1xuICAgICAgbGVmdDogb2Zmc2V0LmxlZnQsXG4gICAgICB0b3A6IGNvbnRhaW5lci5ib3R0b21cbiAgICB9O1xuXG4gICAgLy8gRGV0ZXJtaW5lIHdoYXQgdGhlIHBhcmVudCBlbGVtZW50IGlzIHRvIHVzZSBmb3IgY2FsY2l1bGF0aW5nIHRoZSBvZmZzZXRcbiAgICB2YXIgJG9mZnNldFBhcmVudCA9IHRoaXMuJGRyb3Bkb3duUGFyZW50O1xuXG4gICAgLy8gRm9yIHN0YXRpY2FsbHkgcG9zaXRvbmVkIGVsZW1lbnRzLCB3ZSBuZWVkIHRvIGdldCB0aGUgZWxlbWVudFxuICAgIC8vIHRoYXQgaXMgZGV0ZXJtaW5pbmcgdGhlIG9mZnNldFxuICAgIGlmICgkb2Zmc2V0UGFyZW50LmNzcygncG9zaXRpb24nKSA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICRvZmZzZXRQYXJlbnQgPSAkb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudCgpO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnRPZmZzZXQgPSAkb2Zmc2V0UGFyZW50Lm9mZnNldCgpO1xuXG4gICAgY3NzLnRvcCAtPSBwYXJlbnRPZmZzZXQudG9wO1xuICAgIGNzcy5sZWZ0IC09IHBhcmVudE9mZnNldC5sZWZ0O1xuXG4gICAgaWYgKCFpc0N1cnJlbnRseUFib3ZlICYmICFpc0N1cnJlbnRseUJlbG93KSB7XG4gICAgICBuZXdEaXJlY3Rpb24gPSAnYmVsb3cnO1xuICAgIH1cblxuICAgIGlmICghZW5vdWdoUm9vbUJlbG93ICYmIGVub3VnaFJvb21BYm92ZSAmJiAhaXNDdXJyZW50bHlBYm92ZSkge1xuICAgICAgbmV3RGlyZWN0aW9uID0gJ2Fib3ZlJztcbiAgICB9IGVsc2UgaWYgKCFlbm91Z2hSb29tQWJvdmUgJiYgZW5vdWdoUm9vbUJlbG93ICYmIGlzQ3VycmVudGx5QWJvdmUpIHtcbiAgICAgIG5ld0RpcmVjdGlvbiA9ICdiZWxvdyc7XG4gICAgfVxuXG4gICAgaWYgKG5ld0RpcmVjdGlvbiA9PSAnYWJvdmUnIHx8XG4gICAgICAoaXNDdXJyZW50bHlBYm92ZSAmJiBuZXdEaXJlY3Rpb24gIT09ICdiZWxvdycpKSB7XG4gICAgICBjc3MudG9wID0gY29udGFpbmVyLnRvcCAtIHBhcmVudE9mZnNldC50b3AgLSBkcm9wZG93bi5oZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKG5ld0RpcmVjdGlvbiAhPSBudWxsKSB7XG4gICAgICB0aGlzLiRkcm9wZG93blxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NlbGVjdDItZHJvcGRvd24tLWJlbG93IHNlbGVjdDItZHJvcGRvd24tLWFib3ZlJylcbiAgICAgICAgLmFkZENsYXNzKCdzZWxlY3QyLWRyb3Bkb3duLS0nICsgbmV3RGlyZWN0aW9uKTtcbiAgICAgIHRoaXMuJGNvbnRhaW5lclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS1iZWxvdyBzZWxlY3QyLWNvbnRhaW5lci0tYWJvdmUnKVxuICAgICAgICAuYWRkQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS0nICsgbmV3RGlyZWN0aW9uKTtcbiAgICB9XG5cbiAgICB0aGlzLiRkcm9wZG93bkNvbnRhaW5lci5jc3MoY3NzKTtcbiAgfTtcblxuICBBdHRhY2hCb2R5LnByb3RvdHlwZS5fcmVzaXplRHJvcGRvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNzcyA9IHtcbiAgICAgIHdpZHRoOiB0aGlzLiRjb250YWluZXIub3V0ZXJXaWR0aChmYWxzZSkgKyAncHgnXG4gICAgfTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZ2V0KCdkcm9wZG93bkF1dG9XaWR0aCcpKSB7XG4gICAgICBjc3MubWluV2lkdGggPSBjc3Mud2lkdGg7XG4gICAgICBjc3MucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgY3NzLndpZHRoID0gJ2F1dG8nO1xuICAgIH1cblxuICAgIHRoaXMuJGRyb3Bkb3duLmNzcyhjc3MpO1xuICB9O1xuXG4gIEF0dGFjaEJvZHkucHJvdG90eXBlLl9zaG93RHJvcGRvd24gPSBmdW5jdGlvbiAoZGVjb3JhdGVkKSB7XG4gICAgdGhpcy4kZHJvcGRvd25Db250YWluZXIuYXBwZW5kVG8odGhpcy4kZHJvcGRvd25QYXJlbnQpO1xuXG4gICAgdGhpcy5fcG9zaXRpb25Ecm9wZG93bigpO1xuICAgIHRoaXMuX3Jlc2l6ZURyb3Bkb3duKCk7XG4gIH07XG5cbiAgcmV0dXJuIEF0dGFjaEJvZHk7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2Ryb3Bkb3duL21pbmltdW1SZXN1bHRzRm9yU2VhcmNoJyxbXG5cbl0sIGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gY291bnRSZXN1bHRzIChkYXRhKSB7XG4gICAgdmFyIGNvdW50ID0gMDtcblxuICAgIGZvciAodmFyIGQgPSAwOyBkIDwgZGF0YS5sZW5ndGg7IGQrKykge1xuICAgICAgdmFyIGl0ZW0gPSBkYXRhW2RdO1xuXG4gICAgICBpZiAoaXRlbS5jaGlsZHJlbikge1xuICAgICAgICBjb3VudCArPSBjb3VudFJlc3VsdHMoaXRlbS5jaGlsZHJlbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIE1pbmltdW1SZXN1bHRzRm9yU2VhcmNoIChkZWNvcmF0ZWQsICRlbGVtZW50LCBvcHRpb25zLCBkYXRhQWRhcHRlcikge1xuICAgIHRoaXMubWluaW11bVJlc3VsdHNGb3JTZWFyY2ggPSBvcHRpb25zLmdldCgnbWluaW11bVJlc3VsdHNGb3JTZWFyY2gnKTtcblxuICAgIGlmICh0aGlzLm1pbmltdW1SZXN1bHRzRm9yU2VhcmNoIDwgMCkge1xuICAgICAgdGhpcy5taW5pbXVtUmVzdWx0c0ZvclNlYXJjaCA9IEluZmluaXR5O1xuICAgIH1cblxuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsICRlbGVtZW50LCBvcHRpb25zLCBkYXRhQWRhcHRlcik7XG4gIH1cblxuICBNaW5pbXVtUmVzdWx0c0ZvclNlYXJjaC5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIHBhcmFtcykge1xuICAgIGlmIChjb3VudFJlc3VsdHMocGFyYW1zLmRhdGEucmVzdWx0cykgPCB0aGlzLm1pbmltdW1SZXN1bHRzRm9yU2VhcmNoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29yYXRlZC5jYWxsKHRoaXMsIHBhcmFtcyk7XG4gIH07XG5cbiAgcmV0dXJuIE1pbmltdW1SZXN1bHRzRm9yU2VhcmNoO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bi9zZWxlY3RPbkNsb3NlJyxbXG5cbl0sIGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gU2VsZWN0T25DbG9zZSAoKSB7IH1cblxuICBTZWxlY3RPbkNsb3NlLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgY29udGFpbmVyLCAkY29udGFpbmVyKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY29udGFpbmVyLCAkY29udGFpbmVyKTtcblxuICAgIGNvbnRhaW5lci5vbignY2xvc2UnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICBzZWxmLl9oYW5kbGVTZWxlY3RPbkNsb3NlKHBhcmFtcyk7XG4gICAgfSk7XG4gIH07XG5cbiAgU2VsZWN0T25DbG9zZS5wcm90b3R5cGUuX2hhbmRsZVNlbGVjdE9uQ2xvc2UgPSBmdW5jdGlvbiAoXywgcGFyYW1zKSB7XG4gICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMub3JpZ2luYWxTZWxlY3QyRXZlbnQgIT0gbnVsbCkge1xuICAgICAgdmFyIGV2ZW50ID0gcGFyYW1zLm9yaWdpbmFsU2VsZWN0MkV2ZW50O1xuXG4gICAgICAvLyBEb24ndCBzZWxlY3QgYW4gaXRlbSBpZiB0aGUgY2xvc2UgZXZlbnQgd2FzIHRyaWdnZXJlZCBmcm9tIGEgc2VsZWN0IG9yXG4gICAgICAvLyB1bnNlbGVjdCBldmVudFxuICAgICAgaWYgKGV2ZW50Ll90eXBlID09PSAnc2VsZWN0JyB8fCBldmVudC5fdHlwZSA9PT0gJ3Vuc2VsZWN0Jykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyICRoaWdobGlnaHRlZFJlc3VsdHMgPSB0aGlzLmdldEhpZ2hsaWdodGVkUmVzdWx0cygpO1xuXG4gICAgLy8gT25seSBzZWxlY3QgaGlnaGxpZ2h0ZWQgcmVzdWx0c1xuICAgIGlmICgkaGlnaGxpZ2h0ZWRSZXN1bHRzLmxlbmd0aCA8IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGF0YSA9ICRoaWdobGlnaHRlZFJlc3VsdHMuZGF0YSgnZGF0YScpO1xuXG4gICAgLy8gRG9uJ3QgcmUtc2VsZWN0IGFscmVhZHkgc2VsZWN0ZWQgcmVzdWx0ZVxuICAgIGlmIChcbiAgICAgIChkYXRhLmVsZW1lbnQgIT0gbnVsbCAmJiBkYXRhLmVsZW1lbnQuc2VsZWN0ZWQpIHx8XG4gICAgICAoZGF0YS5lbGVtZW50ID09IG51bGwgJiYgZGF0YS5zZWxlY3RlZClcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnRyaWdnZXIoJ3NlbGVjdCcsIHtcbiAgICAgICAgZGF0YTogZGF0YVxuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBTZWxlY3RPbkNsb3NlO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bi9jbG9zZU9uU2VsZWN0JyxbXG5cbl0sIGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQ2xvc2VPblNlbGVjdCAoKSB7IH1cblxuICBDbG9zZU9uU2VsZWN0LnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgY29udGFpbmVyLCAkY29udGFpbmVyKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY29udGFpbmVyLCAkY29udGFpbmVyKTtcblxuICAgIGNvbnRhaW5lci5vbignc2VsZWN0JywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi5fc2VsZWN0VHJpZ2dlcmVkKGV2dCk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIub24oJ3Vuc2VsZWN0JywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgc2VsZi5fc2VsZWN0VHJpZ2dlcmVkKGV2dCk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ2xvc2VPblNlbGVjdC5wcm90b3R5cGUuX3NlbGVjdFRyaWdnZXJlZCA9IGZ1bmN0aW9uIChfLCBldnQpIHtcbiAgICB2YXIgb3JpZ2luYWxFdmVudCA9IGV2dC5vcmlnaW5hbEV2ZW50O1xuXG4gICAgLy8gRG9uJ3QgY2xvc2UgaWYgdGhlIGNvbnRyb2wga2V5IGlzIGJlaW5nIGhlbGRcbiAgICBpZiAob3JpZ2luYWxFdmVudCAmJiBvcmlnaW5hbEV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnRyaWdnZXIoJ2Nsb3NlJywge1xuICAgICAgb3JpZ2luYWxFdmVudDogb3JpZ2luYWxFdmVudCxcbiAgICAgIG9yaWdpbmFsU2VsZWN0MkV2ZW50OiBldnRcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gQ2xvc2VPblNlbGVjdDtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvaTE4bi9lbicsW10sZnVuY3Rpb24gKCkge1xuICAvLyBFbmdsaXNoXG4gIHJldHVybiB7XG4gICAgZXJyb3JMb2FkaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gJ1RoZSByZXN1bHRzIGNvdWxkIG5vdCBiZSBsb2FkZWQuJztcbiAgICB9LFxuICAgIGlucHV0VG9vTG9uZzogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgIHZhciBvdmVyQ2hhcnMgPSBhcmdzLmlucHV0Lmxlbmd0aCAtIGFyZ3MubWF4aW11bTtcblxuICAgICAgdmFyIG1lc3NhZ2UgPSAnUGxlYXNlIGRlbGV0ZSAnICsgb3ZlckNoYXJzICsgJyBjaGFyYWN0ZXInO1xuXG4gICAgICBpZiAob3ZlckNoYXJzICE9IDEpIHtcbiAgICAgICAgbWVzc2FnZSArPSAncyc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgIH0sXG4gICAgaW5wdXRUb29TaG9ydDogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgIHZhciByZW1haW5pbmdDaGFycyA9IGFyZ3MubWluaW11bSAtIGFyZ3MuaW5wdXQubGVuZ3RoO1xuXG4gICAgICB2YXIgbWVzc2FnZSA9ICdQbGVhc2UgZW50ZXIgJyArIHJlbWFpbmluZ0NoYXJzICsgJyBvciBtb3JlIGNoYXJhY3RlcnMnO1xuXG4gICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICB9LFxuICAgIGxvYWRpbmdNb3JlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gJ0xvYWRpbmcgbW9yZSByZXN1bHRz4oCmJztcbiAgICB9LFxuICAgIG1heGltdW1TZWxlY3RlZDogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgIHZhciBtZXNzYWdlID0gJ1lvdSBjYW4gb25seSBzZWxlY3QgJyArIGFyZ3MubWF4aW11bSArICcgaXRlbSc7XG5cbiAgICAgIGlmIChhcmdzLm1heGltdW0gIT0gMSkge1xuICAgICAgICBtZXNzYWdlICs9ICdzJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgfSxcbiAgICBub1Jlc3VsdHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAnTm8gcmVzdWx0cyBmb3VuZCc7XG4gICAgfSxcbiAgICBzZWFyY2hpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAnU2VhcmNoaW5n4oCmJztcbiAgICB9XG4gIH07XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2RlZmF1bHRzJyxbXG4gICdqcXVlcnknLFxuICAncmVxdWlyZScsXG5cbiAgJy4vcmVzdWx0cycsXG5cbiAgJy4vc2VsZWN0aW9uL3NpbmdsZScsXG4gICcuL3NlbGVjdGlvbi9tdWx0aXBsZScsXG4gICcuL3NlbGVjdGlvbi9wbGFjZWhvbGRlcicsXG4gICcuL3NlbGVjdGlvbi9hbGxvd0NsZWFyJyxcbiAgJy4vc2VsZWN0aW9uL3NlYXJjaCcsXG4gICcuL3NlbGVjdGlvbi9ldmVudFJlbGF5JyxcblxuICAnLi91dGlscycsXG4gICcuL3RyYW5zbGF0aW9uJyxcbiAgJy4vZGlhY3JpdGljcycsXG5cbiAgJy4vZGF0YS9zZWxlY3QnLFxuICAnLi9kYXRhL2FycmF5JyxcbiAgJy4vZGF0YS9hamF4JyxcbiAgJy4vZGF0YS90YWdzJyxcbiAgJy4vZGF0YS90b2tlbml6ZXInLFxuICAnLi9kYXRhL21pbmltdW1JbnB1dExlbmd0aCcsXG4gICcuL2RhdGEvbWF4aW11bUlucHV0TGVuZ3RoJyxcbiAgJy4vZGF0YS9tYXhpbXVtU2VsZWN0aW9uTGVuZ3RoJyxcblxuICAnLi9kcm9wZG93bicsXG4gICcuL2Ryb3Bkb3duL3NlYXJjaCcsXG4gICcuL2Ryb3Bkb3duL2hpZGVQbGFjZWhvbGRlcicsXG4gICcuL2Ryb3Bkb3duL2luZmluaXRlU2Nyb2xsJyxcbiAgJy4vZHJvcGRvd24vYXR0YWNoQm9keScsXG4gICcuL2Ryb3Bkb3duL21pbmltdW1SZXN1bHRzRm9yU2VhcmNoJyxcbiAgJy4vZHJvcGRvd24vc2VsZWN0T25DbG9zZScsXG4gICcuL2Ryb3Bkb3duL2Nsb3NlT25TZWxlY3QnLFxuXG4gICcuL2kxOG4vZW4nXG5dLCBmdW5jdGlvbiAoJCwgcmVxdWlyZSxcblxuICAgICAgICAgICAgIFJlc3VsdHNMaXN0LFxuXG4gICAgICAgICAgICAgU2luZ2xlU2VsZWN0aW9uLCBNdWx0aXBsZVNlbGVjdGlvbiwgUGxhY2Vob2xkZXIsIEFsbG93Q2xlYXIsXG4gICAgICAgICAgICAgU2VsZWN0aW9uU2VhcmNoLCBFdmVudFJlbGF5LFxuXG4gICAgICAgICAgICAgVXRpbHMsIFRyYW5zbGF0aW9uLCBESUFDUklUSUNTLFxuXG4gICAgICAgICAgICAgU2VsZWN0RGF0YSwgQXJyYXlEYXRhLCBBamF4RGF0YSwgVGFncywgVG9rZW5pemVyLFxuICAgICAgICAgICAgIE1pbmltdW1JbnB1dExlbmd0aCwgTWF4aW11bUlucHV0TGVuZ3RoLCBNYXhpbXVtU2VsZWN0aW9uTGVuZ3RoLFxuXG4gICAgICAgICAgICAgRHJvcGRvd24sIERyb3Bkb3duU2VhcmNoLCBIaWRlUGxhY2Vob2xkZXIsIEluZmluaXRlU2Nyb2xsLFxuICAgICAgICAgICAgIEF0dGFjaEJvZHksIE1pbmltdW1SZXN1bHRzRm9yU2VhcmNoLCBTZWxlY3RPbkNsb3NlLCBDbG9zZU9uU2VsZWN0LFxuXG4gICAgICAgICAgICAgRW5nbGlzaFRyYW5zbGF0aW9uKSB7XG4gIGZ1bmN0aW9uIERlZmF1bHRzICgpIHtcbiAgICB0aGlzLnJlc2V0KCk7XG4gIH1cblxuICBEZWZhdWx0cy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhQWRhcHRlciA9PSBudWxsKSB7XG4gICAgICBpZiAob3B0aW9ucy5hamF4ICE9IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlciA9IEFqYXhEYXRhO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmRhdGEgIT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zLmRhdGFBZGFwdGVyID0gQXJyYXlEYXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlciA9IFNlbGVjdERhdGE7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm1pbmltdW1JbnB1dExlbmd0aCA+IDApIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICAgIG9wdGlvbnMuZGF0YUFkYXB0ZXIsXG4gICAgICAgICAgTWluaW11bUlucHV0TGVuZ3RoXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm1heGltdW1JbnB1dExlbmd0aCA+IDApIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICAgIG9wdGlvbnMuZGF0YUFkYXB0ZXIsXG4gICAgICAgICAgTWF4aW11bUlucHV0TGVuZ3RoXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm1heGltdW1TZWxlY3Rpb25MZW5ndGggPiAwKSB7XG4gICAgICAgIG9wdGlvbnMuZGF0YUFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgICBvcHRpb25zLmRhdGFBZGFwdGVyLFxuICAgICAgICAgIE1heGltdW1TZWxlY3Rpb25MZW5ndGhcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMudGFncykge1xuICAgICAgICBvcHRpb25zLmRhdGFBZGFwdGVyID0gVXRpbHMuRGVjb3JhdGUob3B0aW9ucy5kYXRhQWRhcHRlciwgVGFncyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnRva2VuU2VwYXJhdG9ycyAhPSBudWxsIHx8IG9wdGlvbnMudG9rZW5pemVyICE9IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICAgIG9wdGlvbnMuZGF0YUFkYXB0ZXIsXG4gICAgICAgICAgVG9rZW5pemVyXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnF1ZXJ5ICE9IG51bGwpIHtcbiAgICAgICAgdmFyIFF1ZXJ5ID0gcmVxdWlyZShvcHRpb25zLmFtZEJhc2UgKyAnY29tcGF0L3F1ZXJ5Jyk7XG5cbiAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICAgIG9wdGlvbnMuZGF0YUFkYXB0ZXIsXG4gICAgICAgICAgUXVlcnlcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuaW5pdFNlbGVjdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHZhciBJbml0U2VsZWN0aW9uID0gcmVxdWlyZShvcHRpb25zLmFtZEJhc2UgKyAnY29tcGF0L2luaXRTZWxlY3Rpb24nKTtcblxuICAgICAgICBvcHRpb25zLmRhdGFBZGFwdGVyID0gVXRpbHMuRGVjb3JhdGUoXG4gICAgICAgICAgb3B0aW9ucy5kYXRhQWRhcHRlcixcbiAgICAgICAgICBJbml0U2VsZWN0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucmVzdWx0c0FkYXB0ZXIgPT0gbnVsbCkge1xuICAgICAgb3B0aW9ucy5yZXN1bHRzQWRhcHRlciA9IFJlc3VsdHNMaXN0O1xuXG4gICAgICBpZiAob3B0aW9ucy5hamF4ICE9IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucy5yZXN1bHRzQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICAgIG9wdGlvbnMucmVzdWx0c0FkYXB0ZXIsXG4gICAgICAgICAgSW5maW5pdGVTY3JvbGxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMucGxhY2Vob2xkZXIgIT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zLnJlc3VsdHNBZGFwdGVyID0gVXRpbHMuRGVjb3JhdGUoXG4gICAgICAgICAgb3B0aW9ucy5yZXN1bHRzQWRhcHRlcixcbiAgICAgICAgICBIaWRlUGxhY2Vob2xkZXJcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuc2VsZWN0T25DbG9zZSkge1xuICAgICAgICBvcHRpb25zLnJlc3VsdHNBZGFwdGVyID0gVXRpbHMuRGVjb3JhdGUoXG4gICAgICAgICAgb3B0aW9ucy5yZXN1bHRzQWRhcHRlcixcbiAgICAgICAgICBTZWxlY3RPbkNsb3NlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZHJvcGRvd25BZGFwdGVyID09IG51bGwpIHtcbiAgICAgIGlmIChvcHRpb25zLm11bHRpcGxlKSB7XG4gICAgICAgIG9wdGlvbnMuZHJvcGRvd25BZGFwdGVyID0gRHJvcGRvd247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgU2VhcmNoYWJsZURyb3Bkb3duID0gVXRpbHMuRGVjb3JhdGUoRHJvcGRvd24sIERyb3Bkb3duU2VhcmNoKTtcblxuICAgICAgICBvcHRpb25zLmRyb3Bkb3duQWRhcHRlciA9IFNlYXJjaGFibGVEcm9wZG93bjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMubWluaW11bVJlc3VsdHNGb3JTZWFyY2ggIT09IDApIHtcbiAgICAgICAgb3B0aW9ucy5kcm9wZG93bkFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgICBvcHRpb25zLmRyb3Bkb3duQWRhcHRlcixcbiAgICAgICAgICBNaW5pbXVtUmVzdWx0c0ZvclNlYXJjaFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5jbG9zZU9uU2VsZWN0KSB7XG4gICAgICAgIG9wdGlvbnMuZHJvcGRvd25BZGFwdGVyID0gVXRpbHMuRGVjb3JhdGUoXG4gICAgICAgICAgb3B0aW9ucy5kcm9wZG93bkFkYXB0ZXIsXG4gICAgICAgICAgQ2xvc2VPblNlbGVjdFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIG9wdGlvbnMuZHJvcGRvd25Dc3NDbGFzcyAhPSBudWxsIHx8XG4gICAgICAgIG9wdGlvbnMuZHJvcGRvd25Dc3MgIT0gbnVsbCB8fFxuICAgICAgICBvcHRpb25zLmFkYXB0RHJvcGRvd25Dc3NDbGFzcyAhPSBudWxsXG4gICAgICApIHtcbiAgICAgICAgdmFyIERyb3Bkb3duQ1NTID0gcmVxdWlyZShvcHRpb25zLmFtZEJhc2UgKyAnY29tcGF0L2Ryb3Bkb3duQ3NzJyk7XG5cbiAgICAgICAgb3B0aW9ucy5kcm9wZG93bkFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgICBvcHRpb25zLmRyb3Bkb3duQWRhcHRlcixcbiAgICAgICAgICBEcm9wZG93bkNTU1xuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zLmRyb3Bkb3duQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICBvcHRpb25zLmRyb3Bkb3duQWRhcHRlcixcbiAgICAgICAgQXR0YWNoQm9keVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5zZWxlY3Rpb25BZGFwdGVyID09IG51bGwpIHtcbiAgICAgIGlmIChvcHRpb25zLm11bHRpcGxlKSB7XG4gICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uQWRhcHRlciA9IE11bHRpcGxlU2VsZWN0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5zZWxlY3Rpb25BZGFwdGVyID0gU2luZ2xlU2VsZWN0aW9uO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgdGhlIHBsYWNlaG9sZGVyIG1peGluIGlmIGEgcGxhY2Vob2xkZXIgd2FzIHNwZWNpZmllZFxuICAgICAgaWYgKG9wdGlvbnMucGxhY2Vob2xkZXIgIT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zLnNlbGVjdGlvbkFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgICBvcHRpb25zLnNlbGVjdGlvbkFkYXB0ZXIsXG4gICAgICAgICAgUGxhY2Vob2xkZXJcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuYWxsb3dDbGVhcikge1xuICAgICAgICBvcHRpb25zLnNlbGVjdGlvbkFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgICBvcHRpb25zLnNlbGVjdGlvbkFkYXB0ZXIsXG4gICAgICAgICAgQWxsb3dDbGVhclxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5tdWx0aXBsZSkge1xuICAgICAgICBvcHRpb25zLnNlbGVjdGlvbkFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgICBvcHRpb25zLnNlbGVjdGlvbkFkYXB0ZXIsXG4gICAgICAgICAgU2VsZWN0aW9uU2VhcmNoXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgb3B0aW9ucy5jb250YWluZXJDc3NDbGFzcyAhPSBudWxsIHx8XG4gICAgICAgIG9wdGlvbnMuY29udGFpbmVyQ3NzICE9IG51bGwgfHxcbiAgICAgICAgb3B0aW9ucy5hZGFwdENvbnRhaW5lckNzc0NsYXNzICE9IG51bGxcbiAgICAgICkge1xuICAgICAgICB2YXIgQ29udGFpbmVyQ1NTID0gcmVxdWlyZShvcHRpb25zLmFtZEJhc2UgKyAnY29tcGF0L2NvbnRhaW5lckNzcycpO1xuXG4gICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uQWRhcHRlciA9IFV0aWxzLkRlY29yYXRlKFxuICAgICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uQWRhcHRlcixcbiAgICAgICAgICBDb250YWluZXJDU1NcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucy5zZWxlY3Rpb25BZGFwdGVyID0gVXRpbHMuRGVjb3JhdGUoXG4gICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uQWRhcHRlcixcbiAgICAgICAgRXZlbnRSZWxheVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMubGFuZ3VhZ2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgbGFuZ3VhZ2UgaXMgc3BlY2lmaWVkIHdpdGggYSByZWdpb25cbiAgICAgIGlmIChvcHRpb25zLmxhbmd1YWdlLmluZGV4T2YoJy0nKSA+IDApIHtcbiAgICAgICAgLy8gRXh0cmFjdCB0aGUgcmVnaW9uIGluZm9ybWF0aW9uIGlmIGl0IGlzIGluY2x1ZGVkXG4gICAgICAgIHZhciBsYW5ndWFnZVBhcnRzID0gb3B0aW9ucy5sYW5ndWFnZS5zcGxpdCgnLScpO1xuICAgICAgICB2YXIgYmFzZUxhbmd1YWdlID0gbGFuZ3VhZ2VQYXJ0c1swXTtcblxuICAgICAgICBvcHRpb25zLmxhbmd1YWdlID0gW29wdGlvbnMubGFuZ3VhZ2UsIGJhc2VMYW5ndWFnZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLmxhbmd1YWdlID0gW29wdGlvbnMubGFuZ3VhZ2VdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkLmlzQXJyYXkob3B0aW9ucy5sYW5ndWFnZSkpIHtcbiAgICAgIHZhciBsYW5ndWFnZXMgPSBuZXcgVHJhbnNsYXRpb24oKTtcbiAgICAgIG9wdGlvbnMubGFuZ3VhZ2UucHVzaCgnZW4nKTtcblxuICAgICAgdmFyIGxhbmd1YWdlTmFtZXMgPSBvcHRpb25zLmxhbmd1YWdlO1xuXG4gICAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxhbmd1YWdlTmFtZXMubGVuZ3RoOyBsKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBsYW5ndWFnZU5hbWVzW2xdO1xuICAgICAgICB2YXIgbGFuZ3VhZ2UgPSB7fTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFRyeSB0byBsb2FkIGl0IHdpdGggdGhlIG9yaWdpbmFsIG5hbWVcbiAgICAgICAgICBsYW5ndWFnZSA9IFRyYW5zbGF0aW9uLmxvYWRQYXRoKG5hbWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIElmIHdlIGNvdWxkbid0IGxvYWQgaXQsIGNoZWNrIGlmIGl0IHdhc24ndCB0aGUgZnVsbCBwYXRoXG4gICAgICAgICAgICBuYW1lID0gdGhpcy5kZWZhdWx0cy5hbWRMYW5ndWFnZUJhc2UgKyBuYW1lO1xuICAgICAgICAgICAgbGFuZ3VhZ2UgPSBUcmFuc2xhdGlvbi5sb2FkUGF0aChuYW1lKTtcbiAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgLy8gVGhlIHRyYW5zbGF0aW9uIGNvdWxkIG5vdCBiZSBsb2FkZWQgYXQgYWxsLiBTb21ldGltZXMgdGhpcyBpc1xuICAgICAgICAgICAgLy8gYmVjYXVzZSBvZiBhIGNvbmZpZ3VyYXRpb24gcHJvYmxlbSwgb3RoZXIgdGltZXMgdGhpcyBjYW4gYmVcbiAgICAgICAgICAgIC8vIGJlY2F1c2Ugb2YgaG93IFNlbGVjdDIgaGVscHMgbG9hZCBhbGwgcG9zc2libGUgdHJhbnNsYXRpb24gZmlsZXMuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kZWJ1ZyAmJiB3aW5kb3cuY29uc29sZSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICdTZWxlY3QyOiBUaGUgbGFuZ3VhZ2UgZmlsZSBmb3IgXCInICsgbmFtZSArICdcIiBjb3VsZCBub3QgYmUgJyArXG4gICAgICAgICAgICAgICAgJ2F1dG9tYXRpY2FsbHkgbG9hZGVkLiBBIGZhbGxiYWNrIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLidcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGFuZ3VhZ2VzLmV4dGVuZChsYW5ndWFnZSk7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMudHJhbnNsYXRpb25zID0gbGFuZ3VhZ2VzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYmFzZVRyYW5zbGF0aW9uID0gVHJhbnNsYXRpb24ubG9hZFBhdGgoXG4gICAgICAgIHRoaXMuZGVmYXVsdHMuYW1kTGFuZ3VhZ2VCYXNlICsgJ2VuJ1xuICAgICAgKTtcbiAgICAgIHZhciBjdXN0b21UcmFuc2xhdGlvbiA9IG5ldyBUcmFuc2xhdGlvbihvcHRpb25zLmxhbmd1YWdlKTtcblxuICAgICAgY3VzdG9tVHJhbnNsYXRpb24uZXh0ZW5kKGJhc2VUcmFuc2xhdGlvbik7XG5cbiAgICAgIG9wdGlvbnMudHJhbnNsYXRpb25zID0gY3VzdG9tVHJhbnNsYXRpb247XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH07XG5cbiAgRGVmYXVsdHMucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHN0cmlwRGlhY3JpdGljcyAodGV4dCkge1xuICAgICAgLy8gVXNlZCAndW5pIHJhbmdlICsgbmFtZWQgZnVuY3Rpb24nIGZyb20gaHR0cDovL2pzcGVyZi5jb20vZGlhY3JpdGljcy8xOFxuICAgICAgZnVuY3Rpb24gbWF0Y2goYSkge1xuICAgICAgICByZXR1cm4gRElBQ1JJVElDU1thXSB8fCBhO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bXlxcdTAwMDAtXFx1MDA3RV0vZywgbWF0Y2gpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoZXIgKHBhcmFtcywgZGF0YSkge1xuICAgICAgLy8gQWx3YXlzIHJldHVybiB0aGUgb2JqZWN0IGlmIHRoZXJlIGlzIG5vdGhpbmcgdG8gY29tcGFyZVxuICAgICAgaWYgKCQudHJpbShwYXJhbXMudGVybSkgPT09ICcnKSB7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgfVxuXG4gICAgICAvLyBEbyBhIHJlY3Vyc2l2ZSBjaGVjayBmb3Igb3B0aW9ucyB3aXRoIGNoaWxkcmVuXG4gICAgICBpZiAoZGF0YS5jaGlsZHJlbiAmJiBkYXRhLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQ2xvbmUgdGhlIGRhdGEgb2JqZWN0IGlmIHRoZXJlIGFyZSBjaGlsZHJlblxuICAgICAgICAvLyBUaGlzIGlzIHJlcXVpcmVkIGFzIHdlIG1vZGlmeSB0aGUgb2JqZWN0IHRvIHJlbW92ZSBhbnkgbm9uLW1hdGNoZXNcbiAgICAgICAgdmFyIG1hdGNoID0gJC5leHRlbmQodHJ1ZSwge30sIGRhdGEpO1xuXG4gICAgICAgIC8vIENoZWNrIGVhY2ggY2hpbGQgb2YgdGhlIG9wdGlvblxuICAgICAgICBmb3IgKHZhciBjID0gZGF0YS5jaGlsZHJlbi5sZW5ndGggLSAxOyBjID49IDA7IGMtLSkge1xuICAgICAgICAgIHZhciBjaGlsZCA9IGRhdGEuY2hpbGRyZW5bY107XG5cbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IG1hdGNoZXIocGFyYW1zLCBjaGlsZCk7XG5cbiAgICAgICAgICAvLyBJZiB0aGVyZSB3YXNuJ3QgYSBtYXRjaCwgcmVtb3ZlIHRoZSBvYmplY3QgaW4gdGhlIGFycmF5XG4gICAgICAgICAgaWYgKG1hdGNoZXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgbWF0Y2guY2hpbGRyZW4uc3BsaWNlKGMsIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGFueSBjaGlsZHJlbiBtYXRjaGVkLCByZXR1cm4gdGhlIG5ldyBvYmplY3RcbiAgICAgICAgaWYgKG1hdGNoLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGVyZSB3ZXJlIG5vIG1hdGNoaW5nIGNoaWxkcmVuLCBjaGVjayBqdXN0IHRoZSBwbGFpbiBvYmplY3RcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIocGFyYW1zLCBtYXRjaCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBvcmlnaW5hbCA9IHN0cmlwRGlhY3JpdGljcyhkYXRhLnRleHQpLnRvVXBwZXJDYXNlKCk7XG4gICAgICB2YXIgdGVybSA9IHN0cmlwRGlhY3JpdGljcyhwYXJhbXMudGVybSkudG9VcHBlckNhc2UoKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHRleHQgY29udGFpbnMgdGhlIHRlcm1cbiAgICAgIGlmIChvcmlnaW5hbC5pbmRleE9mKHRlcm0pID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0IGRvZXNuJ3QgY29udGFpbiB0aGUgdGVybSwgZG9uJ3QgcmV0dXJuIGFueXRoaW5nXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLmRlZmF1bHRzID0ge1xuICAgICAgYW1kQmFzZTogJy4vJyxcbiAgICAgIGFtZExhbmd1YWdlQmFzZTogJy4vaTE4bi8nLFxuICAgICAgY2xvc2VPblNlbGVjdDogdHJ1ZSxcbiAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgIGRyb3Bkb3duQXV0b1dpZHRoOiBmYWxzZSxcbiAgICAgIGVzY2FwZU1hcmt1cDogVXRpbHMuZXNjYXBlTWFya3VwLFxuICAgICAgbGFuZ3VhZ2U6IEVuZ2xpc2hUcmFuc2xhdGlvbixcbiAgICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgICBtaW5pbXVtSW5wdXRMZW5ndGg6IDAsXG4gICAgICBtYXhpbXVtSW5wdXRMZW5ndGg6IDAsXG4gICAgICBtYXhpbXVtU2VsZWN0aW9uTGVuZ3RoOiAwLFxuICAgICAgbWluaW11bVJlc3VsdHNGb3JTZWFyY2g6IDAsXG4gICAgICBzZWxlY3RPbkNsb3NlOiBmYWxzZSxcbiAgICAgIHNvcnRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICB9LFxuICAgICAgdGVtcGxhdGVSZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC50ZXh0O1xuICAgICAgfSxcbiAgICAgIHRlbXBsYXRlU2VsZWN0aW9uOiBmdW5jdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBzZWxlY3Rpb24udGV4dDtcbiAgICAgIH0sXG4gICAgICB0aGVtZTogJ2RlZmF1bHQnLFxuICAgICAgd2lkdGg6ICdyZXNvbHZlJ1xuICAgIH07XG4gIH07XG5cbiAgRGVmYXVsdHMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGNhbWVsS2V5ID0gJC5jYW1lbENhc2Uoa2V5KTtcblxuICAgIHZhciBkYXRhID0ge307XG4gICAgZGF0YVtjYW1lbEtleV0gPSB2YWx1ZTtcblxuICAgIHZhciBjb252ZXJ0ZWREYXRhID0gVXRpbHMuX2NvbnZlcnREYXRhKGRhdGEpO1xuXG4gICAgJC5leHRlbmQodGhpcy5kZWZhdWx0cywgY29udmVydGVkRGF0YSk7XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRzID0gbmV3IERlZmF1bHRzKCk7XG5cbiAgcmV0dXJuIGRlZmF1bHRzO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9vcHRpb25zJyxbXG4gICdyZXF1aXJlJyxcbiAgJ2pxdWVyeScsXG4gICcuL2RlZmF1bHRzJyxcbiAgJy4vdXRpbHMnXG5dLCBmdW5jdGlvbiAocmVxdWlyZSwgJCwgRGVmYXVsdHMsIFV0aWxzKSB7XG4gIGZ1bmN0aW9uIE9wdGlvbnMgKG9wdGlvbnMsICRlbGVtZW50KSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIGlmICgkZWxlbWVudCAhPSBudWxsKSB7XG4gICAgICB0aGlzLmZyb21FbGVtZW50KCRlbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBEZWZhdWx0cy5hcHBseSh0aGlzLm9wdGlvbnMpO1xuXG4gICAgaWYgKCRlbGVtZW50ICYmICRlbGVtZW50LmlzKCdpbnB1dCcpKSB7XG4gICAgICB2YXIgSW5wdXRDb21wYXQgPSByZXF1aXJlKHRoaXMuZ2V0KCdhbWRCYXNlJykgKyAnY29tcGF0L2lucHV0RGF0YScpO1xuXG4gICAgICB0aGlzLm9wdGlvbnMuZGF0YUFkYXB0ZXIgPSBVdGlscy5EZWNvcmF0ZShcbiAgICAgICAgdGhpcy5vcHRpb25zLmRhdGFBZGFwdGVyLFxuICAgICAgICBJbnB1dENvbXBhdFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBPcHRpb25zLnByb3RvdHlwZS5mcm9tRWxlbWVudCA9IGZ1bmN0aW9uICgkZSkge1xuICAgIHZhciBleGNsdWRlZERhdGEgPSBbJ3NlbGVjdDInXTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlwbGUgPT0gbnVsbCkge1xuICAgICAgdGhpcy5vcHRpb25zLm11bHRpcGxlID0gJGUucHJvcCgnbXVsdGlwbGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVkID09IG51bGwpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kaXNhYmxlZCA9ICRlLnByb3AoJ2Rpc2FibGVkJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sYW5ndWFnZSA9PSBudWxsKSB7XG4gICAgICBpZiAoJGUucHJvcCgnbGFuZycpKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5sYW5ndWFnZSA9ICRlLnByb3AoJ2xhbmcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgfSBlbHNlIGlmICgkZS5jbG9zZXN0KCdbbGFuZ10nKS5wcm9wKCdsYW5nJykpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmxhbmd1YWdlID0gJGUuY2xvc2VzdCgnW2xhbmddJykucHJvcCgnbGFuZycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyID09IG51bGwpIHtcbiAgICAgIGlmICgkZS5wcm9wKCdkaXInKSkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuZGlyID0gJGUucHJvcCgnZGlyJyk7XG4gICAgICB9IGVsc2UgaWYgKCRlLmNsb3Nlc3QoJ1tkaXJdJykucHJvcCgnZGlyJykpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmRpciA9ICRlLmNsb3Nlc3QoJ1tkaXJdJykucHJvcCgnZGlyJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9wdGlvbnMuZGlyID0gJ2x0cic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgJGUucHJvcCgnZGlzYWJsZWQnLCB0aGlzLm9wdGlvbnMuZGlzYWJsZWQpO1xuICAgICRlLnByb3AoJ211bHRpcGxlJywgdGhpcy5vcHRpb25zLm11bHRpcGxlKTtcblxuICAgIGlmICgkZS5kYXRhKCdzZWxlY3QyVGFncycpKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgJ1NlbGVjdDI6IFRoZSBgZGF0YS1zZWxlY3QyLXRhZ3NgIGF0dHJpYnV0ZSBoYXMgYmVlbiBjaGFuZ2VkIHRvICcgK1xuICAgICAgICAgICd1c2UgdGhlIGBkYXRhLWRhdGFgIGFuZCBgZGF0YS10YWdzPVwidHJ1ZVwiYCBhdHRyaWJ1dGVzIGFuZCB3aWxsIGJlICcgK1xuICAgICAgICAgICdyZW1vdmVkIGluIGZ1dHVyZSB2ZXJzaW9ucyBvZiBTZWxlY3QyLidcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgJGUuZGF0YSgnZGF0YScsICRlLmRhdGEoJ3NlbGVjdDJUYWdzJykpO1xuICAgICAgJGUuZGF0YSgndGFncycsIHRydWUpO1xuICAgIH1cblxuICAgIGlmICgkZS5kYXRhKCdhamF4VXJsJykpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnU2VsZWN0MjogVGhlIGBkYXRhLWFqYXgtdXJsYCBhdHRyaWJ1dGUgaGFzIGJlZW4gY2hhbmdlZCB0byAnICtcbiAgICAgICAgICAnYGRhdGEtYWpheC0tdXJsYCBhbmQgc3VwcG9ydCBmb3IgdGhlIG9sZCBhdHRyaWJ1dGUgd2lsbCBiZSByZW1vdmVkJyArXG4gICAgICAgICAgJyBpbiBmdXR1cmUgdmVyc2lvbnMgb2YgU2VsZWN0Mi4nXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgICRlLmF0dHIoJ2FqYXgtLXVybCcsICRlLmRhdGEoJ2FqYXhVcmwnKSk7XG4gICAgICAkZS5kYXRhKCdhamF4LS11cmwnLCAkZS5kYXRhKCdhamF4VXJsJykpO1xuICAgIH1cblxuICAgIHZhciBkYXRhc2V0ID0ge307XG5cbiAgICAvLyBQcmVmZXIgdGhlIGVsZW1lbnQncyBgZGF0YXNldGAgYXR0cmlidXRlIGlmIGl0IGV4aXN0c1xuICAgIC8vIGpRdWVyeSAxLnggZG9lcyBub3QgY29ycmVjdGx5IGhhbmRsZSBkYXRhIGF0dHJpYnV0ZXMgd2l0aCBtdWx0aXBsZSBkYXNoZXNcbiAgICBpZiAoJC5mbi5qcXVlcnkgJiYgJC5mbi5qcXVlcnkuc3Vic3RyKDAsIDIpID09ICcxLicgJiYgJGVbMF0uZGF0YXNldCkge1xuICAgICAgZGF0YXNldCA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkZVswXS5kYXRhc2V0LCAkZS5kYXRhKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkYXRhc2V0ID0gJGUuZGF0YSgpO1xuICAgIH1cblxuICAgIHZhciBkYXRhID0gJC5leHRlbmQodHJ1ZSwge30sIGRhdGFzZXQpO1xuXG4gICAgZGF0YSA9IFV0aWxzLl9jb252ZXJ0RGF0YShkYXRhKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICBpZiAoJC5pbkFycmF5KGtleSwgZXhjbHVkZWREYXRhKSA+IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRoaXMub3B0aW9uc1trZXldKSkge1xuICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnNba2V5XSwgZGF0YVtrZXldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gZGF0YVtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIE9wdGlvbnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zW2tleV07XG4gIH07XG5cbiAgT3B0aW9ucy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG4gICAgdGhpcy5vcHRpb25zW2tleV0gPSB2YWw7XG4gIH07XG5cbiAgcmV0dXJuIE9wdGlvbnM7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2NvcmUnLFtcbiAgJ2pxdWVyeScsXG4gICcuL29wdGlvbnMnLFxuICAnLi91dGlscycsXG4gICcuL2tleXMnXG5dLCBmdW5jdGlvbiAoJCwgT3B0aW9ucywgVXRpbHMsIEtFWVMpIHtcbiAgdmFyIFNlbGVjdDIgPSBmdW5jdGlvbiAoJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBpZiAoJGVsZW1lbnQuZGF0YSgnc2VsZWN0MicpICE9IG51bGwpIHtcbiAgICAgICRlbGVtZW50LmRhdGEoJ3NlbGVjdDInKS5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudCA9ICRlbGVtZW50O1xuXG4gICAgdGhpcy5pZCA9IHRoaXMuX2dlbmVyYXRlSWQoJGVsZW1lbnQpO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBuZXcgT3B0aW9ucyhvcHRpb25zLCAkZWxlbWVudCk7XG5cbiAgICBTZWxlY3QyLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMpO1xuXG4gICAgLy8gU2V0IHVwIHRoZSB0YWJpbmRleFxuXG4gICAgdmFyIHRhYmluZGV4ID0gJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnKSB8fCAwO1xuICAgICRlbGVtZW50LmRhdGEoJ29sZC10YWJpbmRleCcsIHRhYmluZGV4KTtcbiAgICAkZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuXG4gICAgLy8gU2V0IHVwIGNvbnRhaW5lcnMgYW5kIGFkYXB0ZXJzXG5cbiAgICB2YXIgRGF0YUFkYXB0ZXIgPSB0aGlzLm9wdGlvbnMuZ2V0KCdkYXRhQWRhcHRlcicpO1xuICAgIHRoaXMuZGF0YUFkYXB0ZXIgPSBuZXcgRGF0YUFkYXB0ZXIoJGVsZW1lbnQsIHRoaXMub3B0aW9ucyk7XG5cbiAgICB2YXIgJGNvbnRhaW5lciA9IHRoaXMucmVuZGVyKCk7XG5cbiAgICB0aGlzLl9wbGFjZUNvbnRhaW5lcigkY29udGFpbmVyKTtcblxuICAgIHZhciBTZWxlY3Rpb25BZGFwdGVyID0gdGhpcy5vcHRpb25zLmdldCgnc2VsZWN0aW9uQWRhcHRlcicpO1xuICAgIHRoaXMuc2VsZWN0aW9uID0gbmV3IFNlbGVjdGlvbkFkYXB0ZXIoJGVsZW1lbnQsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy4kc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb24ucmVuZGVyKCk7XG5cbiAgICB0aGlzLnNlbGVjdGlvbi5wb3NpdGlvbih0aGlzLiRzZWxlY3Rpb24sICRjb250YWluZXIpO1xuXG4gICAgdmFyIERyb3Bkb3duQWRhcHRlciA9IHRoaXMub3B0aW9ucy5nZXQoJ2Ryb3Bkb3duQWRhcHRlcicpO1xuICAgIHRoaXMuZHJvcGRvd24gPSBuZXcgRHJvcGRvd25BZGFwdGVyKCRlbGVtZW50LCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuJGRyb3Bkb3duID0gdGhpcy5kcm9wZG93bi5yZW5kZXIoKTtcblxuICAgIHRoaXMuZHJvcGRvd24ucG9zaXRpb24odGhpcy4kZHJvcGRvd24sICRjb250YWluZXIpO1xuXG4gICAgdmFyIFJlc3VsdHNBZGFwdGVyID0gdGhpcy5vcHRpb25zLmdldCgncmVzdWx0c0FkYXB0ZXInKTtcbiAgICB0aGlzLnJlc3VsdHMgPSBuZXcgUmVzdWx0c0FkYXB0ZXIoJGVsZW1lbnQsIHRoaXMub3B0aW9ucywgdGhpcy5kYXRhQWRhcHRlcik7XG4gICAgdGhpcy4kcmVzdWx0cyA9IHRoaXMucmVzdWx0cy5yZW5kZXIoKTtcblxuICAgIHRoaXMucmVzdWx0cy5wb3NpdGlvbih0aGlzLiRyZXN1bHRzLCB0aGlzLiRkcm9wZG93bik7XG5cbiAgICAvLyBCaW5kIGV2ZW50c1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gQmluZCB0aGUgY29udGFpbmVyIHRvIGFsbCBvZiB0aGUgYWRhcHRlcnNcbiAgICB0aGlzLl9iaW5kQWRhcHRlcnMoKTtcblxuICAgIC8vIFJlZ2lzdGVyIGFueSBET00gZXZlbnQgaGFuZGxlcnNcbiAgICB0aGlzLl9yZWdpc3RlckRvbUV2ZW50cygpO1xuXG4gICAgLy8gUmVnaXN0ZXIgYW55IGludGVybmFsIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy5fcmVnaXN0ZXJEYXRhRXZlbnRzKCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJTZWxlY3Rpb25FdmVudHMoKTtcbiAgICB0aGlzLl9yZWdpc3RlckRyb3Bkb3duRXZlbnRzKCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJSZXN1bHRzRXZlbnRzKCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJFdmVudHMoKTtcblxuICAgIC8vIFNldCB0aGUgaW5pdGlhbCBzdGF0ZVxuICAgIHRoaXMuZGF0YUFkYXB0ZXIuY3VycmVudChmdW5jdGlvbiAoaW5pdGlhbERhdGEpIHtcbiAgICAgIHNlbGYudHJpZ2dlcignc2VsZWN0aW9uOnVwZGF0ZScsIHtcbiAgICAgICAgZGF0YTogaW5pdGlhbERhdGFcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gSGlkZSB0aGUgb3JpZ2luYWwgc2VsZWN0XG4gICAgJGVsZW1lbnQuYWRkQ2xhc3MoJ3NlbGVjdDItaGlkZGVuLWFjY2Vzc2libGUnKTtcbiAgICAkZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAvLyBTeW5jaHJvbml6ZSBhbnkgbW9uaXRvcmVkIGF0dHJpYnV0ZXNcbiAgICB0aGlzLl9zeW5jQXR0cmlidXRlcygpO1xuXG4gICAgJGVsZW1lbnQuZGF0YSgnc2VsZWN0MicsIHRoaXMpO1xuICB9O1xuXG4gIFV0aWxzLkV4dGVuZChTZWxlY3QyLCBVdGlscy5PYnNlcnZhYmxlKTtcblxuICBTZWxlY3QyLnByb3RvdHlwZS5fZ2VuZXJhdGVJZCA9IGZ1bmN0aW9uICgkZWxlbWVudCkge1xuICAgIHZhciBpZCA9ICcnO1xuXG4gICAgaWYgKCRlbGVtZW50LmF0dHIoJ2lkJykgIT0gbnVsbCkge1xuICAgICAgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgIH0gZWxzZSBpZiAoJGVsZW1lbnQuYXR0cignbmFtZScpICE9IG51bGwpIHtcbiAgICAgIGlkID0gJGVsZW1lbnQuYXR0cignbmFtZScpICsgJy0nICsgVXRpbHMuZ2VuZXJhdGVDaGFycygyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWQgPSBVdGlscy5nZW5lcmF0ZUNoYXJzKDQpO1xuICAgIH1cblxuICAgIGlkID0gaWQucmVwbGFjZSgvKDp8XFwufFxcW3xcXF18LCkvZywgJycpO1xuICAgIGlkID0gJ3NlbGVjdDItJyArIGlkO1xuXG4gICAgcmV0dXJuIGlkO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLl9wbGFjZUNvbnRhaW5lciA9IGZ1bmN0aW9uICgkY29udGFpbmVyKSB7XG4gICAgJGNvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLiRlbGVtZW50KTtcblxuICAgIHZhciB3aWR0aCA9IHRoaXMuX3Jlc29sdmVXaWR0aCh0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuZ2V0KCd3aWR0aCcpKTtcblxuICAgIGlmICh3aWR0aCAhPSBudWxsKSB7XG4gICAgICAkY29udGFpbmVyLmNzcygnd2lkdGgnLCB3aWR0aCk7XG4gICAgfVxuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLl9yZXNvbHZlV2lkdGggPSBmdW5jdGlvbiAoJGVsZW1lbnQsIG1ldGhvZCkge1xuICAgIHZhciBXSURUSCA9IC9ed2lkdGg6KChbLStdPyhbMC05XSpcXC4pP1swLTldKykocHh8ZW18ZXh8JXxpbnxjbXxtbXxwdHxwYykpL2k7XG5cbiAgICBpZiAobWV0aG9kID09ICdyZXNvbHZlJykge1xuICAgICAgdmFyIHN0eWxlV2lkdGggPSB0aGlzLl9yZXNvbHZlV2lkdGgoJGVsZW1lbnQsICdzdHlsZScpO1xuXG4gICAgICBpZiAoc3R5bGVXaWR0aCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBzdHlsZVdpZHRoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZVdpZHRoKCRlbGVtZW50LCAnZWxlbWVudCcpO1xuICAgIH1cblxuICAgIGlmIChtZXRob2QgPT0gJ2VsZW1lbnQnKSB7XG4gICAgICB2YXIgZWxlbWVudFdpZHRoID0gJGVsZW1lbnQub3V0ZXJXaWR0aChmYWxzZSk7XG5cbiAgICAgIGlmIChlbGVtZW50V2lkdGggPD0gMCkge1xuICAgICAgICByZXR1cm4gJ2F1dG8nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZWxlbWVudFdpZHRoICsgJ3B4JztcbiAgICB9XG5cbiAgICBpZiAobWV0aG9kID09ICdzdHlsZScpIHtcbiAgICAgIHZhciBzdHlsZSA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG5cbiAgICAgIGlmICh0eXBlb2Yoc3R5bGUpICE9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgdmFyIGF0dHJzID0gc3R5bGUuc3BsaXQoJzsnKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdHRycy5sZW5ndGg7IGkgPCBsOyBpID0gaSArIDEpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBhdHRyc1tpXS5yZXBsYWNlKC9cXHMvZywgJycpO1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IGF0dHIubWF0Y2goV0lEVEgpO1xuXG4gICAgICAgIGlmIChtYXRjaGVzICE9PSBudWxsICYmIG1hdGNoZXMubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2hlc1sxXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbWV0aG9kO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLl9iaW5kQWRhcHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kYXRhQWRhcHRlci5iaW5kKHRoaXMsIHRoaXMuJGNvbnRhaW5lcik7XG4gICAgdGhpcy5zZWxlY3Rpb24uYmluZCh0aGlzLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgdGhpcy5kcm9wZG93bi5iaW5kKHRoaXMsIHRoaXMuJGNvbnRhaW5lcik7XG4gICAgdGhpcy5yZXN1bHRzLmJpbmQodGhpcywgdGhpcy4kY29udGFpbmVyKTtcbiAgfTtcblxuICBTZWxlY3QyLnByb3RvdHlwZS5fcmVnaXN0ZXJEb21FdmVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudC5vbignY2hhbmdlLnNlbGVjdDInLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmRhdGFBZGFwdGVyLmN1cnJlbnQoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgc2VsZi50cmlnZ2VyKCdzZWxlY3Rpb246dXBkYXRlJywge1xuICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuJGVsZW1lbnQub24oJ2ZvY3VzLnNlbGVjdDInLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICBzZWxmLnRyaWdnZXIoJ2ZvY3VzJywgZXZ0KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX3N5bmNBID0gVXRpbHMuYmluZCh0aGlzLl9zeW5jQXR0cmlidXRlcywgdGhpcyk7XG4gICAgdGhpcy5fc3luY1MgPSBVdGlscy5iaW5kKHRoaXMuX3N5bmNTdWJ0cmVlLCB0aGlzKTtcblxuICAgIGlmICh0aGlzLiRlbGVtZW50WzBdLmF0dGFjaEV2ZW50KSB7XG4gICAgICB0aGlzLiRlbGVtZW50WzBdLmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgdGhpcy5fc3luY0EpO1xuICAgIH1cblxuICAgIHZhciBvYnNlcnZlciA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyIHx8XG4gICAgICB3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlciB8fFxuICAgICAgd2luZG93Lk1vek11dGF0aW9uT2JzZXJ2ZXJcbiAgICA7XG5cbiAgICBpZiAob2JzZXJ2ZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSBuZXcgb2JzZXJ2ZXIoZnVuY3Rpb24gKG11dGF0aW9ucykge1xuICAgICAgICAkLmVhY2gobXV0YXRpb25zLCBzZWxmLl9zeW5jQSk7XG4gICAgICAgICQuZWFjaChtdXRhdGlvbnMsIHNlbGYuX3N5bmNTKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fb2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLiRlbGVtZW50WzBdLCB7XG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgc3VidHJlZTogZmFsc2VcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZWxlbWVudFswXS5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICB0aGlzLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdET01BdHRyTW9kaWZpZWQnLFxuICAgICAgICBzZWxmLl9zeW5jQSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICB0aGlzLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdET01Ob2RlSW5zZXJ0ZWQnLFxuICAgICAgICBzZWxmLl9zeW5jUyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICB0aGlzLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdET01Ob2RlUmVtb3ZlZCcsXG4gICAgICAgIHNlbGYuX3N5bmNTLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgU2VsZWN0Mi5wcm90b3R5cGUuX3JlZ2lzdGVyRGF0YUV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmRhdGFBZGFwdGVyLm9uKCcqJywgZnVuY3Rpb24gKG5hbWUsIHBhcmFtcykge1xuICAgICAgc2VsZi50cmlnZ2VyKG5hbWUsIHBhcmFtcyk7XG4gICAgfSk7XG4gIH07XG5cbiAgU2VsZWN0Mi5wcm90b3R5cGUuX3JlZ2lzdGVyU2VsZWN0aW9uRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9uUmVsYXlFdmVudHMgPSBbJ3RvZ2dsZScsICdmb2N1cyddO1xuXG4gICAgdGhpcy5zZWxlY3Rpb24ub24oJ3RvZ2dsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYudG9nZ2xlRHJvcGRvd24oKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2VsZWN0aW9uLm9uKCdmb2N1cycsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgIHNlbGYuZm9jdXMocGFyYW1zKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2VsZWN0aW9uLm9uKCcqJywgZnVuY3Rpb24gKG5hbWUsIHBhcmFtcykge1xuICAgICAgaWYgKCQuaW5BcnJheShuYW1lLCBub25SZWxheUV2ZW50cykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi50cmlnZ2VyKG5hbWUsIHBhcmFtcyk7XG4gICAgfSk7XG4gIH07XG5cbiAgU2VsZWN0Mi5wcm90b3R5cGUuX3JlZ2lzdGVyRHJvcGRvd25FdmVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5kcm9wZG93bi5vbignKicsIGZ1bmN0aW9uIChuYW1lLCBwYXJhbXMpIHtcbiAgICAgIHNlbGYudHJpZ2dlcihuYW1lLCBwYXJhbXMpO1xuICAgIH0pO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLl9yZWdpc3RlclJlc3VsdHNFdmVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5yZXN1bHRzLm9uKCcqJywgZnVuY3Rpb24gKG5hbWUsIHBhcmFtcykge1xuICAgICAgc2VsZi50cmlnZ2VyKG5hbWUsIHBhcmFtcyk7XG4gICAgfSk7XG4gIH07XG5cbiAgU2VsZWN0Mi5wcm90b3R5cGUuX3JlZ2lzdGVyRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMub24oJ29wZW4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLiRjb250YWluZXIuYWRkQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS1vcGVuJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuJGNvbnRhaW5lci5yZW1vdmVDbGFzcygnc2VsZWN0Mi1jb250YWluZXItLW9wZW4nKTtcbiAgICB9KTtcblxuICAgIHRoaXMub24oJ2VuYWJsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuJGNvbnRhaW5lci5yZW1vdmVDbGFzcygnc2VsZWN0Mi1jb250YWluZXItLWRpc2FibGVkJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm9uKCdkaXNhYmxlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi4kY29udGFpbmVyLmFkZENsYXNzKCdzZWxlY3QyLWNvbnRhaW5lci0tZGlzYWJsZWQnKTtcbiAgICB9KTtcblxuICAgIHRoaXMub24oJ2JsdXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLiRjb250YWluZXIucmVtb3ZlQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS1mb2N1cycpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vbigncXVlcnknLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICBpZiAoIXNlbGYuaXNPcGVuKCkpIHtcbiAgICAgICAgc2VsZi50cmlnZ2VyKCdvcGVuJywge30pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRhdGFBZGFwdGVyLnF1ZXJ5KHBhcmFtcywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgc2VsZi50cmlnZ2VyKCdyZXN1bHRzOmFsbCcsIHtcbiAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgIHF1ZXJ5OiBwYXJhbXNcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMub24oJ3F1ZXJ5OmFwcGVuZCcsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgIHRoaXMuZGF0YUFkYXB0ZXIucXVlcnkocGFyYW1zLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBzZWxmLnRyaWdnZXIoJ3Jlc3VsdHM6YXBwZW5kJywge1xuICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgcXVlcnk6IHBhcmFtc1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICB2YXIga2V5ID0gZXZ0LndoaWNoO1xuXG4gICAgICBpZiAoc2VsZi5pc09wZW4oKSkge1xuICAgICAgICBpZiAoa2V5ID09PSBLRVlTLkVTQyB8fCBrZXkgPT09IEtFWVMuVEFCIHx8XG4gICAgICAgICAgICAoa2V5ID09PSBLRVlTLlVQICYmIGV2dC5hbHRLZXkpKSB7XG4gICAgICAgICAgc2VsZi5jbG9zZSgpO1xuXG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBLRVlTLkVOVEVSKSB7XG4gICAgICAgICAgc2VsZi50cmlnZ2VyKCdyZXN1bHRzOnNlbGVjdCcsIHt9KTtcblxuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKChrZXkgPT09IEtFWVMuU1BBQ0UgJiYgZXZ0LmN0cmxLZXkpKSB7XG4gICAgICAgICAgc2VsZi50cmlnZ2VyKCdyZXN1bHRzOnRvZ2dsZScsIHt9KTtcblxuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gS0VZUy5VUCkge1xuICAgICAgICAgIHNlbGYudHJpZ2dlcigncmVzdWx0czpwcmV2aW91cycsIHt9KTtcblxuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gS0VZUy5ET1dOKSB7XG4gICAgICAgICAgc2VsZi50cmlnZ2VyKCdyZXN1bHRzOm5leHQnLCB7fSk7XG5cbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGtleSA9PT0gS0VZUy5FTlRFUiB8fCBrZXkgPT09IEtFWVMuU1BBQ0UgfHxcbiAgICAgICAgICAgIChrZXkgPT09IEtFWVMuRE9XTiAmJiBldnQuYWx0S2V5KSkge1xuICAgICAgICAgIHNlbGYub3BlbigpO1xuXG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBTZWxlY3QyLnByb3RvdHlwZS5fc3luY0F0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vcHRpb25zLnNldCgnZGlzYWJsZWQnLCB0aGlzLiRlbGVtZW50LnByb3AoJ2Rpc2FibGVkJykpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5nZXQoJ2Rpc2FibGVkJykpIHtcbiAgICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50cmlnZ2VyKCdkaXNhYmxlJywge30pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRyaWdnZXIoJ2VuYWJsZScsIHt9KTtcbiAgICB9XG4gIH07XG5cbiAgU2VsZWN0Mi5wcm90b3R5cGUuX3N5bmNTdWJ0cmVlID0gZnVuY3Rpb24gKGV2dCwgbXV0YXRpb25zKSB7XG4gICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBJZ25vcmUgYW55IG11dGF0aW9uIGV2ZW50cyByYWlzZWQgZm9yIGVsZW1lbnRzIHRoYXQgYXJlbid0IG9wdGlvbnMgb3JcbiAgICAvLyBvcHRncm91cHMuIFRoaXMgaGFuZGxlcyB0aGUgY2FzZSB3aGVuIHRoZSBzZWxlY3QgZWxlbWVudCBpcyBkZXN0cm95ZWRcbiAgICBpZiAoXG4gICAgICBldnQgJiYgZXZ0LnRhcmdldCAmJiAoXG4gICAgICAgIGV2dC50YXJnZXQubm9kZU5hbWUgIT09ICdPUFRJT04nICYmIGV2dC50YXJnZXQubm9kZU5hbWUgIT09ICdPUFRHUk9VUCdcbiAgICAgIClcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIW11dGF0aW9ucykge1xuICAgICAgLy8gSWYgbXV0YXRpb24gZXZlbnRzIGFyZW4ndCBzdXBwb3J0ZWQsIHRoZW4gd2UgY2FuIG9ubHkgYXNzdW1lIHRoYXQgdGhlXG4gICAgICAvLyBjaGFuZ2UgYWZmZWN0ZWQgdGhlIHNlbGVjdGlvbnNcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAobXV0YXRpb25zLmFkZGVkTm9kZXMgJiYgbXV0YXRpb25zLmFkZGVkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBtdXRhdGlvbnMuYWRkZWROb2Rlcy5sZW5ndGg7IG4rKykge1xuICAgICAgICB2YXIgbm9kZSA9IG11dGF0aW9ucy5hZGRlZE5vZGVzW25dO1xuXG4gICAgICAgIGlmIChub2RlLnNlbGVjdGVkKSB7XG4gICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG11dGF0aW9ucy5yZW1vdmVkTm9kZXMgJiYgbXV0YXRpb25zLnJlbW92ZWROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IHJlLXB1bGwgdGhlIGRhdGEgaWYgd2UgdGhpbmsgdGhlcmUgaXMgYSBjaGFuZ2VcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy5kYXRhQWRhcHRlci5jdXJyZW50KGZ1bmN0aW9uIChjdXJyZW50RGF0YSkge1xuICAgICAgICBzZWxmLnRyaWdnZXIoJ3NlbGVjdGlvbjp1cGRhdGUnLCB7XG4gICAgICAgICAgZGF0YTogY3VycmVudERhdGFcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlIHRoZSB0cmlnZ2VyIG1ldGhvZCB0byBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgcHJlLWV2ZW50cyB3aGVuXG4gICAqIHRoZXJlIGFyZSBldmVudHMgdGhhdCBjYW4gYmUgcHJldmVudGVkLlxuICAgKi9cbiAgU2VsZWN0Mi5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIGFjdHVhbFRyaWdnZXIgPSBTZWxlY3QyLl9fc3VwZXJfXy50cmlnZ2VyO1xuICAgIHZhciBwcmVUcmlnZ2VyTWFwID0ge1xuICAgICAgJ29wZW4nOiAnb3BlbmluZycsXG4gICAgICAnY2xvc2UnOiAnY2xvc2luZycsXG4gICAgICAnc2VsZWN0JzogJ3NlbGVjdGluZycsXG4gICAgICAndW5zZWxlY3QnOiAndW5zZWxlY3RpbmcnXG4gICAgfTtcblxuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAobmFtZSBpbiBwcmVUcmlnZ2VyTWFwKSB7XG4gICAgICB2YXIgcHJlVHJpZ2dlck5hbWUgPSBwcmVUcmlnZ2VyTWFwW25hbWVdO1xuICAgICAgdmFyIHByZVRyaWdnZXJBcmdzID0ge1xuICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBhcmdzOiBhcmdzXG4gICAgICB9O1xuXG4gICAgICBhY3R1YWxUcmlnZ2VyLmNhbGwodGhpcywgcHJlVHJpZ2dlck5hbWUsIHByZVRyaWdnZXJBcmdzKTtcblxuICAgICAgaWYgKHByZVRyaWdnZXJBcmdzLnByZXZlbnRlZCkge1xuICAgICAgICBhcmdzLnByZXZlbnRlZCA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFjdHVhbFRyaWdnZXIuY2FsbCh0aGlzLCBuYW1lLCBhcmdzKTtcbiAgfTtcblxuICBTZWxlY3QyLnByb3RvdHlwZS50b2dnbGVEcm9wZG93biA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmdldCgnZGlzYWJsZWQnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfTtcblxuICBTZWxlY3QyLnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy50cmlnZ2VyKCdxdWVyeScsIHt9KTtcbiAgfTtcblxuICBTZWxlY3QyLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNPcGVuKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnRyaWdnZXIoJ2Nsb3NlJywge30pO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLmlzT3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udGFpbmVyLmhhc0NsYXNzKCdzZWxlY3QyLWNvbnRhaW5lci0tb3BlbicpO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLmhhc0ZvY3VzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLiRjb250YWluZXIuaGFzQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS1mb2N1cycpO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLmZvY3VzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAvLyBObyBuZWVkIHRvIHJlLXRyaWdnZXIgZm9jdXMgZXZlbnRzIGlmIHdlIGFyZSBhbHJlYWR5IGZvY3VzZWRcbiAgICBpZiAodGhpcy5oYXNGb2N1cygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdzZWxlY3QyLWNvbnRhaW5lci0tZm9jdXMnKTtcbiAgICB0aGlzLnRyaWdnZXIoJ2ZvY3VzJywge30pO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5nZXQoJ2RlYnVnJykgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICdTZWxlY3QyOiBUaGUgYHNlbGVjdDIoXCJlbmFibGVcIilgIG1ldGhvZCBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsJyArXG4gICAgICAgICcgYmUgcmVtb3ZlZCBpbiBsYXRlciBTZWxlY3QyIHZlcnNpb25zLiBVc2UgJGVsZW1lbnQucHJvcChcImRpc2FibGVkXCIpJyArXG4gICAgICAgICcgaW5zdGVhZC4nXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChhcmdzID09IG51bGwgfHwgYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgIGFyZ3MgPSBbdHJ1ZV07XG4gICAgfVxuXG4gICAgdmFyIGRpc2FibGVkID0gIWFyZ3NbMF07XG5cbiAgICB0aGlzLiRlbGVtZW50LnByb3AoJ2Rpc2FibGVkJywgZGlzYWJsZWQpO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5nZXQoJ2RlYnVnJykgJiZcbiAgICAgICAgYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICdTZWxlY3QyOiBEYXRhIGNhbiBubyBsb25nZXIgYmUgc2V0IHVzaW5nIGBzZWxlY3QyKFwiZGF0YVwiKWAuIFlvdSAnICtcbiAgICAgICAgJ3Nob3VsZCBjb25zaWRlciBzZXR0aW5nIHRoZSB2YWx1ZSBpbnN0ZWFkIHVzaW5nIGAkZWxlbWVudC52YWwoKWAuJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgZGF0YSA9IFtdO1xuXG4gICAgdGhpcy5kYXRhQWRhcHRlci5jdXJyZW50KGZ1bmN0aW9uIChjdXJyZW50RGF0YSkge1xuICAgICAgZGF0YSA9IGN1cnJlbnREYXRhO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgU2VsZWN0Mi5wcm90b3R5cGUudmFsID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmdldCgnZGVidWcnKSAmJiB3aW5kb3cuY29uc29sZSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgJ1NlbGVjdDI6IFRoZSBgc2VsZWN0MihcInZhbFwiKWAgbWV0aG9kIGhhcyBiZWVuIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUnICtcbiAgICAgICAgJyByZW1vdmVkIGluIGxhdGVyIFNlbGVjdDIgdmVyc2lvbnMuIFVzZSAkZWxlbWVudC52YWwoKSBpbnN0ZWFkLidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3MgPT0gbnVsbCB8fCBhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuJGVsZW1lbnQudmFsKCk7XG4gICAgfVxuXG4gICAgdmFyIG5ld1ZhbCA9IGFyZ3NbMF07XG5cbiAgICBpZiAoJC5pc0FycmF5KG5ld1ZhbCkpIHtcbiAgICAgIG5ld1ZhbCA9ICQubWFwKG5ld1ZhbCwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqLnRvU3RyaW5nKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LnZhbChuZXdWYWwpLnRyaWdnZXIoJ2NoYW5nZScpO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kY29udGFpbmVyLnJlbW92ZSgpO1xuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0uZGV0YWNoRXZlbnQpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRbMF0uZGV0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCB0aGlzLl9zeW5jQSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX29ic2VydmVyICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX29ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIHRoaXMuX29ic2VydmVyID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgdGhpcy4kZWxlbWVudFswXVxuICAgICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NQXR0ck1vZGlmaWVkJywgdGhpcy5fc3luY0EsIGZhbHNlKTtcbiAgICAgIHRoaXMuJGVsZW1lbnRbMF1cbiAgICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTU5vZGVJbnNlcnRlZCcsIHRoaXMuX3N5bmNTLCBmYWxzZSk7XG4gICAgICB0aGlzLiRlbGVtZW50WzBdXG4gICAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Ob2RlUmVtb3ZlZCcsIHRoaXMuX3N5bmNTLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3luY0EgPSBudWxsO1xuICAgIHRoaXMuX3N5bmNTID0gbnVsbDtcblxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuc2VsZWN0MicpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCB0aGlzLiRlbGVtZW50LmRhdGEoJ29sZC10YWJpbmRleCcpKTtcblxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3NlbGVjdDItaGlkZGVuLWFjY2Vzc2libGUnKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVEYXRhKCdzZWxlY3QyJyk7XG5cbiAgICB0aGlzLmRhdGFBZGFwdGVyLmRlc3Ryb3koKTtcbiAgICB0aGlzLnNlbGVjdGlvbi5kZXN0cm95KCk7XG4gICAgdGhpcy5kcm9wZG93bi5kZXN0cm95KCk7XG4gICAgdGhpcy5yZXN1bHRzLmRlc3Ryb3koKTtcblxuICAgIHRoaXMuZGF0YUFkYXB0ZXIgPSBudWxsO1xuICAgIHRoaXMuc2VsZWN0aW9uID0gbnVsbDtcbiAgICB0aGlzLmRyb3Bkb3duID0gbnVsbDtcbiAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICB9O1xuXG4gIFNlbGVjdDIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGNvbnRhaW5lciA9ICQoXG4gICAgICAnPHNwYW4gY2xhc3M9XCJzZWxlY3QyIHNlbGVjdDItY29udGFpbmVyXCI+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cInNlbGVjdGlvblwiPjwvc3Bhbj4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZHJvcGRvd24td3JhcHBlclwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcbiAgICAgICc8L3NwYW4+J1xuICAgICk7XG5cbiAgICAkY29udGFpbmVyLmF0dHIoJ2RpcicsIHRoaXMub3B0aW9ucy5nZXQoJ2RpcicpKTtcblxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG5cbiAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3MoJ3NlbGVjdDItY29udGFpbmVyLS0nICsgdGhpcy5vcHRpb25zLmdldCgndGhlbWUnKSk7XG5cbiAgICAkY29udGFpbmVyLmRhdGEoJ2VsZW1lbnQnLCB0aGlzLiRlbGVtZW50KTtcblxuICAgIHJldHVybiAkY29udGFpbmVyO1xuICB9O1xuXG4gIHJldHVybiBTZWxlY3QyO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9jb21wYXQvdXRpbHMnLFtcbiAgJ2pxdWVyeSdcbl0sIGZ1bmN0aW9uICgkKSB7XG4gIGZ1bmN0aW9uIHN5bmNDc3NDbGFzc2VzICgkZGVzdCwgJHNyYywgYWRhcHRlcikge1xuICAgIHZhciBjbGFzc2VzLCByZXBsYWNlbWVudHMgPSBbXSwgYWRhcHRlZDtcblxuICAgIGNsYXNzZXMgPSAkLnRyaW0oJGRlc3QuYXR0cignY2xhc3MnKSk7XG5cbiAgICBpZiAoY2xhc3Nlcykge1xuICAgICAgY2xhc3NlcyA9ICcnICsgY2xhc3NlczsgLy8gZm9yIElFIHdoaWNoIHJldHVybnMgb2JqZWN0XG5cbiAgICAgICQoY2xhc3Nlcy5zcGxpdCgvXFxzKy8pKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gU2F2ZSBhbGwgU2VsZWN0MiBjbGFzc2VzXG4gICAgICAgIGlmICh0aGlzLmluZGV4T2YoJ3NlbGVjdDItJykgPT09IDApIHtcbiAgICAgICAgICByZXBsYWNlbWVudHMucHVzaCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY2xhc3NlcyA9ICQudHJpbSgkc3JjLmF0dHIoJ2NsYXNzJykpO1xuXG4gICAgaWYgKGNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSAnJyArIGNsYXNzZXM7IC8vIGZvciBJRSB3aGljaCByZXR1cm5zIG9iamVjdFxuXG4gICAgICAkKGNsYXNzZXMuc3BsaXQoL1xccysvKSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIE9ubHkgYWRhcHQgbm9uLVNlbGVjdDIgY2xhc3Nlc1xuICAgICAgICBpZiAodGhpcy5pbmRleE9mKCdzZWxlY3QyLScpICE9PSAwKSB7XG4gICAgICAgICAgYWRhcHRlZCA9IGFkYXB0ZXIodGhpcyk7XG5cbiAgICAgICAgICBpZiAoYWRhcHRlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXBsYWNlbWVudHMucHVzaChhZGFwdGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgICRkZXN0LmF0dHIoJ2NsYXNzJywgcmVwbGFjZW1lbnRzLmpvaW4oJyAnKSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN5bmNDc3NDbGFzc2VzOiBzeW5jQ3NzQ2xhc3Nlc1xuICB9O1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9jb21wYXQvY29udGFpbmVyQ3NzJyxbXG4gICdqcXVlcnknLFxuICAnLi91dGlscydcbl0sIGZ1bmN0aW9uICgkLCBDb21wYXRVdGlscykge1xuICAvLyBOby1vcCBDU1MgYWRhcHRlciB0aGF0IGRpc2NhcmRzIGFsbCBjbGFzc2VzIGJ5IGRlZmF1bHRcbiAgZnVuY3Rpb24gX2NvbnRhaW5lckFkYXB0ZXIgKGNsYXp6KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBDb250YWluZXJDU1MgKCkgeyB9XG5cbiAgQ29udGFpbmVyQ1NTLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoZGVjb3JhdGVkKSB7XG4gICAgdmFyICRjb250YWluZXIgPSBkZWNvcmF0ZWQuY2FsbCh0aGlzKTtcblxuICAgIHZhciBjb250YWluZXJDc3NDbGFzcyA9IHRoaXMub3B0aW9ucy5nZXQoJ2NvbnRhaW5lckNzc0NsYXNzJykgfHwgJyc7XG5cbiAgICBpZiAoJC5pc0Z1bmN0aW9uKGNvbnRhaW5lckNzc0NsYXNzKSkge1xuICAgICAgY29udGFpbmVyQ3NzQ2xhc3MgPSBjb250YWluZXJDc3NDbGFzcyh0aGlzLiRlbGVtZW50KTtcbiAgICB9XG5cbiAgICB2YXIgY29udGFpbmVyQ3NzQWRhcHRlciA9IHRoaXMub3B0aW9ucy5nZXQoJ2FkYXB0Q29udGFpbmVyQ3NzQ2xhc3MnKTtcbiAgICBjb250YWluZXJDc3NBZGFwdGVyID0gY29udGFpbmVyQ3NzQWRhcHRlciB8fCBfY29udGFpbmVyQWRhcHRlcjtcblxuICAgIGlmIChjb250YWluZXJDc3NDbGFzcy5pbmRleE9mKCc6YWxsOicpICE9PSAtMSkge1xuICAgICAgY29udGFpbmVyQ3NzQ2xhc3MgPSBjb250YWluZXJDc3NDbGFzcy5yZXBsYWNlKCc6YWxsOicsICcnKTtcblxuICAgICAgdmFyIF9jc3NBZGFwdGVyID0gY29udGFpbmVyQ3NzQWRhcHRlcjtcblxuICAgICAgY29udGFpbmVyQ3NzQWRhcHRlciA9IGZ1bmN0aW9uIChjbGF6eikge1xuICAgICAgICB2YXIgYWRhcHRlZCA9IF9jc3NBZGFwdGVyKGNsYXp6KTtcblxuICAgICAgICBpZiAoYWRhcHRlZCAhPSBudWxsKSB7XG4gICAgICAgICAgLy8gQXBwZW5kIHRoZSBvbGQgb25lIGFsb25nIHdpdGggdGhlIGFkYXB0ZWQgb25lXG4gICAgICAgICAgcmV0dXJuIGFkYXB0ZWQgKyAnICcgKyBjbGF6ejtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjbGF6ejtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGNvbnRhaW5lckNzcyA9IHRoaXMub3B0aW9ucy5nZXQoJ2NvbnRhaW5lckNzcycpIHx8IHt9O1xuXG4gICAgaWYgKCQuaXNGdW5jdGlvbihjb250YWluZXJDc3MpKSB7XG4gICAgICBjb250YWluZXJDc3MgPSBjb250YWluZXJDc3ModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuXG4gICAgQ29tcGF0VXRpbHMuc3luY0Nzc0NsYXNzZXMoJGNvbnRhaW5lciwgdGhpcy4kZWxlbWVudCwgY29udGFpbmVyQ3NzQWRhcHRlcik7XG5cbiAgICAkY29udGFpbmVyLmNzcyhjb250YWluZXJDc3MpO1xuICAgICRjb250YWluZXIuYWRkQ2xhc3MoY29udGFpbmVyQ3NzQ2xhc3MpO1xuXG4gICAgcmV0dXJuICRjb250YWluZXI7XG4gIH07XG5cbiAgcmV0dXJuIENvbnRhaW5lckNTUztcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvY29tcGF0L2Ryb3Bkb3duQ3NzJyxbXG4gICdqcXVlcnknLFxuICAnLi91dGlscydcbl0sIGZ1bmN0aW9uICgkLCBDb21wYXRVdGlscykge1xuICAvLyBOby1vcCBDU1MgYWRhcHRlciB0aGF0IGRpc2NhcmRzIGFsbCBjbGFzc2VzIGJ5IGRlZmF1bHRcbiAgZnVuY3Rpb24gX2Ryb3Bkb3duQWRhcHRlciAoY2xhenopIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIERyb3Bkb3duQ1NTICgpIHsgfVxuXG4gIERyb3Bkb3duQ1NTLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoZGVjb3JhdGVkKSB7XG4gICAgdmFyICRkcm9wZG93biA9IGRlY29yYXRlZC5jYWxsKHRoaXMpO1xuXG4gICAgdmFyIGRyb3Bkb3duQ3NzQ2xhc3MgPSB0aGlzLm9wdGlvbnMuZ2V0KCdkcm9wZG93bkNzc0NsYXNzJykgfHwgJyc7XG5cbiAgICBpZiAoJC5pc0Z1bmN0aW9uKGRyb3Bkb3duQ3NzQ2xhc3MpKSB7XG4gICAgICBkcm9wZG93bkNzc0NsYXNzID0gZHJvcGRvd25Dc3NDbGFzcyh0aGlzLiRlbGVtZW50KTtcbiAgICB9XG5cbiAgICB2YXIgZHJvcGRvd25Dc3NBZGFwdGVyID0gdGhpcy5vcHRpb25zLmdldCgnYWRhcHREcm9wZG93bkNzc0NsYXNzJyk7XG4gICAgZHJvcGRvd25Dc3NBZGFwdGVyID0gZHJvcGRvd25Dc3NBZGFwdGVyIHx8IF9kcm9wZG93bkFkYXB0ZXI7XG5cbiAgICBpZiAoZHJvcGRvd25Dc3NDbGFzcy5pbmRleE9mKCc6YWxsOicpICE9PSAtMSkge1xuICAgICAgZHJvcGRvd25Dc3NDbGFzcyA9IGRyb3Bkb3duQ3NzQ2xhc3MucmVwbGFjZSgnOmFsbDonLCAnJyk7XG5cbiAgICAgIHZhciBfY3NzQWRhcHRlciA9IGRyb3Bkb3duQ3NzQWRhcHRlcjtcblxuICAgICAgZHJvcGRvd25Dc3NBZGFwdGVyID0gZnVuY3Rpb24gKGNsYXp6KSB7XG4gICAgICAgIHZhciBhZGFwdGVkID0gX2Nzc0FkYXB0ZXIoY2xhenopO1xuXG4gICAgICAgIGlmIChhZGFwdGVkICE9IG51bGwpIHtcbiAgICAgICAgICAvLyBBcHBlbmQgdGhlIG9sZCBvbmUgYWxvbmcgd2l0aCB0aGUgYWRhcHRlZCBvbmVcbiAgICAgICAgICByZXR1cm4gYWRhcHRlZCArICcgJyArIGNsYXp6O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNsYXp6O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgZHJvcGRvd25Dc3MgPSB0aGlzLm9wdGlvbnMuZ2V0KCdkcm9wZG93bkNzcycpIHx8IHt9O1xuXG4gICAgaWYgKCQuaXNGdW5jdGlvbihkcm9wZG93bkNzcykpIHtcbiAgICAgIGRyb3Bkb3duQ3NzID0gZHJvcGRvd25Dc3ModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuXG4gICAgQ29tcGF0VXRpbHMuc3luY0Nzc0NsYXNzZXMoJGRyb3Bkb3duLCB0aGlzLiRlbGVtZW50LCBkcm9wZG93bkNzc0FkYXB0ZXIpO1xuXG4gICAgJGRyb3Bkb3duLmNzcyhkcm9wZG93bkNzcyk7XG4gICAgJGRyb3Bkb3duLmFkZENsYXNzKGRyb3Bkb3duQ3NzQ2xhc3MpO1xuXG4gICAgcmV0dXJuICRkcm9wZG93bjtcbiAgfTtcblxuICByZXR1cm4gRHJvcGRvd25DU1M7XG59KTtcblxuUzIuZGVmaW5lKCdzZWxlY3QyL2NvbXBhdC9pbml0U2VsZWN0aW9uJyxbXG4gICdqcXVlcnknXG5dLCBmdW5jdGlvbiAoJCkge1xuICBmdW5jdGlvbiBJbml0U2VsZWN0aW9uIChkZWNvcmF0ZWQsICRlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuZ2V0KCdkZWJ1ZycpICYmIHdpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAnU2VsZWN0MjogVGhlIGBpbml0U2VsZWN0aW9uYCBvcHRpb24gaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiBmYXZvcicgK1xuICAgICAgICAnIG9mIGEgY3VzdG9tIGRhdGEgYWRhcHRlciB0aGF0IG92ZXJyaWRlcyB0aGUgYGN1cnJlbnRgIG1ldGhvZC4gJyArXG4gICAgICAgICdUaGlzIG1ldGhvZCBpcyBub3cgY2FsbGVkIG11bHRpcGxlIHRpbWVzIGluc3RlYWQgb2YgYSBzaW5nbGUgJyArXG4gICAgICAgICd0aW1lIHdoZW4gdGhlIGluc3RhbmNlIGlzIGluaXRpYWxpemVkLiBTdXBwb3J0IHdpbGwgYmUgcmVtb3ZlZCAnICtcbiAgICAgICAgJ2ZvciB0aGUgYGluaXRTZWxlY3Rpb25gIG9wdGlvbiBpbiBmdXR1cmUgdmVyc2lvbnMgb2YgU2VsZWN0MidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0U2VsZWN0aW9uID0gb3B0aW9ucy5nZXQoJ2luaXRTZWxlY3Rpb24nKTtcbiAgICB0aGlzLl9pc0luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCAkZWxlbWVudCwgb3B0aW9ucyk7XG4gIH1cblxuICBJbml0U2VsZWN0aW9uLnByb3RvdHlwZS5jdXJyZW50ID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy5faXNJbml0aWFsaXplZCkge1xuICAgICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY2FsbGJhY2spO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbml0U2VsZWN0aW9uLmNhbGwobnVsbCwgdGhpcy4kZWxlbWVudCwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHNlbGYuX2lzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgICBpZiAoISQuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gSW5pdFNlbGVjdGlvbjtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvY29tcGF0L2lucHV0RGF0YScsW1xuICAnanF1ZXJ5J1xuXSwgZnVuY3Rpb24gKCQpIHtcbiAgZnVuY3Rpb24gSW5wdXREYXRhIChkZWNvcmF0ZWQsICRlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fY3VycmVudERhdGEgPSBbXTtcbiAgICB0aGlzLl92YWx1ZVNlcGFyYXRvciA9IG9wdGlvbnMuZ2V0KCd2YWx1ZVNlcGFyYXRvcicpIHx8ICcsJztcblxuICAgIGlmICgkZWxlbWVudC5wcm9wKCd0eXBlJykgPT09ICdoaWRkZW4nKSB7XG4gICAgICBpZiAob3B0aW9ucy5nZXQoJ2RlYnVnJykgJiYgY29uc29sZSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICdTZWxlY3QyOiBVc2luZyBhIGhpZGRlbiBpbnB1dCB3aXRoIFNlbGVjdDIgaXMgbm8gbG9uZ2VyICcgK1xuICAgICAgICAgICdzdXBwb3J0ZWQgYW5kIG1heSBzdG9wIHdvcmtpbmcgaW4gdGhlIGZ1dHVyZS4gSXQgaXMgcmVjb21tZW5kZWQgJyArXG4gICAgICAgICAgJ3RvIHVzZSBhIGA8c2VsZWN0PmAgZWxlbWVudCBpbnN0ZWFkLidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCAkZWxlbWVudCwgb3B0aW9ucyk7XG4gIH1cblxuICBJbnB1dERhdGEucHJvdG90eXBlLmN1cnJlbnQgPSBmdW5jdGlvbiAoXywgY2FsbGJhY2spIHtcbiAgICBmdW5jdGlvbiBnZXRTZWxlY3RlZCAoZGF0YSwgc2VsZWN0ZWRJZHMpIHtcbiAgICAgIHZhciBzZWxlY3RlZCA9IFtdO1xuXG4gICAgICBpZiAoZGF0YS5zZWxlY3RlZCB8fCAkLmluQXJyYXkoZGF0YS5pZCwgc2VsZWN0ZWRJZHMpICE9PSAtMSkge1xuICAgICAgICBkYXRhLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgc2VsZWN0ZWQucHVzaChkYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGEuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHtcbiAgICAgICAgc2VsZWN0ZWQucHVzaC5hcHBseShzZWxlY3RlZCwgZ2V0U2VsZWN0ZWQoZGF0YS5jaGlsZHJlbiwgc2VsZWN0ZWRJZHMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGVjdGVkO1xuICAgIH1cblxuICAgIHZhciBzZWxlY3RlZCA9IFtdO1xuXG4gICAgZm9yICh2YXIgZCA9IDA7IGQgPCB0aGlzLl9jdXJyZW50RGF0YS5sZW5ndGg7IGQrKykge1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9jdXJyZW50RGF0YVtkXTtcblxuICAgICAgc2VsZWN0ZWQucHVzaC5hcHBseShcbiAgICAgICAgc2VsZWN0ZWQsXG4gICAgICAgIGdldFNlbGVjdGVkKFxuICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC52YWwoKS5zcGxpdChcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlU2VwYXJhdG9yXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cblxuICAgIGNhbGxiYWNrKHNlbGVjdGVkKTtcbiAgfTtcblxuICBJbnB1dERhdGEucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChfLCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZ2V0KCdtdWx0aXBsZScpKSB7XG4gICAgICB0aGlzLmN1cnJlbnQoZnVuY3Rpb24gKGFsbERhdGEpIHtcbiAgICAgICAgJC5tYXAoYWxsRGF0YSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBkYXRhLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuJGVsZW1lbnQudmFsKGRhdGEuaWQpO1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHZhbHVlID0gdGhpcy4kZWxlbWVudC52YWwoKTtcbiAgICAgIHZhbHVlICs9IHRoaXMuX3ZhbHVlU2VwYXJhdG9yICsgZGF0YS5pZDtcblxuICAgICAgdGhpcy4kZWxlbWVudC52YWwodmFsdWUpO1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICB9XG4gIH07XG5cbiAgSW5wdXREYXRhLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uIChfLCBkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZGF0YS5zZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5jdXJyZW50KGZ1bmN0aW9uIChhbGxEYXRhKSB7XG4gICAgICB2YXIgdmFsdWVzID0gW107XG5cbiAgICAgIGZvciAodmFyIGQgPSAwOyBkIDwgYWxsRGF0YS5sZW5ndGg7IGQrKykge1xuICAgICAgICB2YXIgaXRlbSA9IGFsbERhdGFbZF07XG5cbiAgICAgICAgaWYgKGRhdGEuaWQgPT0gaXRlbS5pZCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWVzLnB1c2goaXRlbS5pZCk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuJGVsZW1lbnQudmFsKHZhbHVlcy5qb2luKHNlbGYuX3ZhbHVlU2VwYXJhdG9yKSk7XG4gICAgICBzZWxmLiRlbGVtZW50LnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgIH0pO1xuICB9O1xuXG4gIElucHV0RGF0YS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoXywgcGFyYW1zLCBjYWxsYmFjaykge1xuICAgIHZhciByZXN1bHRzID0gW107XG5cbiAgICBmb3IgKHZhciBkID0gMDsgZCA8IHRoaXMuX2N1cnJlbnREYXRhLmxlbmd0aDsgZCsrKSB7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2N1cnJlbnREYXRhW2RdO1xuXG4gICAgICB2YXIgbWF0Y2hlcyA9IHRoaXMubWF0Y2hlcyhwYXJhbXMsIGRhdGEpO1xuXG4gICAgICBpZiAobWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgICAgICByZXN1bHRzLnB1c2gobWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY2FsbGJhY2soe1xuICAgICAgcmVzdWx0czogcmVzdWx0c1xuICAgIH0pO1xuICB9O1xuXG4gIElucHV0RGF0YS5wcm90b3R5cGUuYWRkT3B0aW9ucyA9IGZ1bmN0aW9uIChfLCAkb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0gJC5tYXAoJG9wdGlvbnMsIGZ1bmN0aW9uICgkb3B0aW9uKSB7XG4gICAgICByZXR1cm4gJC5kYXRhKCRvcHRpb25bMF0sICdkYXRhJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9jdXJyZW50RGF0YS5wdXNoLmFwcGx5KHRoaXMuX2N1cnJlbnREYXRhLCBvcHRpb25zKTtcbiAgfTtcblxuICByZXR1cm4gSW5wdXREYXRhO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9jb21wYXQvbWF0Y2hlcicsW1xuICAnanF1ZXJ5J1xuXSwgZnVuY3Rpb24gKCQpIHtcbiAgZnVuY3Rpb24gb2xkTWF0Y2hlciAobWF0Y2hlcikge1xuICAgIGZ1bmN0aW9uIHdyYXBwZWRNYXRjaGVyIChwYXJhbXMsIGRhdGEpIHtcbiAgICAgIHZhciBtYXRjaCA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkYXRhKTtcblxuICAgICAgaWYgKHBhcmFtcy50ZXJtID09IG51bGwgfHwgJC50cmltKHBhcmFtcy50ZXJtKSA9PT0gJycpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgICBmb3IgKHZhciBjID0gZGF0YS5jaGlsZHJlbi5sZW5ndGggLSAxOyBjID49IDA7IGMtLSkge1xuICAgICAgICAgIHZhciBjaGlsZCA9IGRhdGEuY2hpbGRyZW5bY107XG5cbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY2hpbGQgb2JqZWN0IG1hdGNoZXNcbiAgICAgICAgICAvLyBUaGUgb2xkIG1hdGNoZXIgcmV0dXJuZWQgYSBib29sZWFuIHRydWUgb3IgZmFsc2VcbiAgICAgICAgICB2YXIgZG9lc01hdGNoID0gbWF0Y2hlcihwYXJhbXMudGVybSwgY2hpbGQudGV4dCwgY2hpbGQpO1xuXG4gICAgICAgICAgLy8gSWYgdGhlIGNoaWxkIGRpZG4ndCBtYXRjaCwgcG9wIGl0IG9mZlxuICAgICAgICAgIGlmICghZG9lc01hdGNoKSB7XG4gICAgICAgICAgICBtYXRjaC5jaGlsZHJlbi5zcGxpY2UoYywgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG1hdGNoZXIocGFyYW1zLnRlcm0sIGRhdGEudGV4dCwgZGF0YSkpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcHBlZE1hdGNoZXI7XG4gIH1cblxuICByZXR1cm4gb2xkTWF0Y2hlcjtcbn0pO1xuXG5TMi5kZWZpbmUoJ3NlbGVjdDIvY29tcGF0L3F1ZXJ5JyxbXG5cbl0sIGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gUXVlcnkgKGRlY29yYXRlZCwgJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5nZXQoJ2RlYnVnJykgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICdTZWxlY3QyOiBUaGUgYHF1ZXJ5YCBvcHRpb24gaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBhICcgK1xuICAgICAgICAnY3VzdG9tIGRhdGEgYWRhcHRlciB0aGF0IG92ZXJyaWRlcyB0aGUgYHF1ZXJ5YCBtZXRob2QuIFN1cHBvcnQgJyArXG4gICAgICAgICd3aWxsIGJlIHJlbW92ZWQgZm9yIHRoZSBgcXVlcnlgIG9wdGlvbiBpbiBmdXR1cmUgdmVyc2lvbnMgb2YgJyArXG4gICAgICAgICdTZWxlY3QyLidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgJGVsZW1lbnQsIG9wdGlvbnMpO1xuICB9XG5cbiAgUXVlcnkucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKF8sIHBhcmFtcywgY2FsbGJhY2spIHtcbiAgICBwYXJhbXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcblxuICAgIHZhciBxdWVyeSA9IHRoaXMub3B0aW9ucy5nZXQoJ3F1ZXJ5Jyk7XG5cbiAgICBxdWVyeS5jYWxsKG51bGwsIHBhcmFtcyk7XG4gIH07XG5cbiAgcmV0dXJuIFF1ZXJ5O1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bi9hdHRhY2hDb250YWluZXInLFtcblxuXSwgZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBBdHRhY2hDb250YWluZXIgKGRlY29yYXRlZCwgJGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBkZWNvcmF0ZWQuY2FsbCh0aGlzLCAkZWxlbWVudCwgb3B0aW9ucyk7XG4gIH1cblxuICBBdHRhY2hDb250YWluZXIucHJvdG90eXBlLnBvc2l0aW9uID1cbiAgICBmdW5jdGlvbiAoZGVjb3JhdGVkLCAkZHJvcGRvd24sICRjb250YWluZXIpIHtcbiAgICB2YXIgJGRyb3Bkb3duQ29udGFpbmVyID0gJGNvbnRhaW5lci5maW5kKCcuZHJvcGRvd24td3JhcHBlcicpO1xuICAgICRkcm9wZG93bkNvbnRhaW5lci5hcHBlbmQoJGRyb3Bkb3duKTtcblxuICAgICRkcm9wZG93bi5hZGRDbGFzcygnc2VsZWN0Mi1kcm9wZG93bi0tYmVsb3cnKTtcbiAgICAkY29udGFpbmVyLmFkZENsYXNzKCdzZWxlY3QyLWNvbnRhaW5lci0tYmVsb3cnKTtcbiAgfTtcblxuICByZXR1cm4gQXR0YWNoQ29udGFpbmVyO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9kcm9wZG93bi9zdG9wUHJvcGFnYXRpb24nLFtcblxuXSwgZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBTdG9wUHJvcGFnYXRpb24gKCkgeyB9XG5cbiAgU3RvcFByb3BhZ2F0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGRlY29yYXRlZCwgY29udGFpbmVyLCAkY29udGFpbmVyKSB7XG4gICAgZGVjb3JhdGVkLmNhbGwodGhpcywgY29udGFpbmVyLCAkY29udGFpbmVyKTtcblxuICAgIHZhciBzdG9wcGVkRXZlbnRzID0gW1xuICAgICdibHVyJyxcbiAgICAnY2hhbmdlJyxcbiAgICAnY2xpY2snLFxuICAgICdkYmxjbGljaycsXG4gICAgJ2ZvY3VzJyxcbiAgICAnZm9jdXNpbicsXG4gICAgJ2ZvY3Vzb3V0JyxcbiAgICAnaW5wdXQnLFxuICAgICdrZXlkb3duJyxcbiAgICAna2V5dXAnLFxuICAgICdrZXlwcmVzcycsXG4gICAgJ21vdXNlZG93bicsXG4gICAgJ21vdXNlZW50ZXInLFxuICAgICdtb3VzZWxlYXZlJyxcbiAgICAnbW91c2Vtb3ZlJyxcbiAgICAnbW91c2VvdmVyJyxcbiAgICAnbW91c2V1cCcsXG4gICAgJ3NlYXJjaCcsXG4gICAgJ3RvdWNoZW5kJyxcbiAgICAndG91Y2hzdGFydCdcbiAgICBdO1xuXG4gICAgdGhpcy4kZHJvcGRvd24ub24oc3RvcHBlZEV2ZW50cy5qb2luKCcgJyksIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gU3RvcFByb3BhZ2F0aW9uO1xufSk7XG5cblMyLmRlZmluZSgnc2VsZWN0Mi9zZWxlY3Rpb24vc3RvcFByb3BhZ2F0aW9uJyxbXG5cbl0sIGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gU3RvcFByb3BhZ2F0aW9uICgpIHsgfVxuXG4gIFN0b3BQcm9wYWdhdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChkZWNvcmF0ZWQsIGNvbnRhaW5lciwgJGNvbnRhaW5lcikge1xuICAgIGRlY29yYXRlZC5jYWxsKHRoaXMsIGNvbnRhaW5lciwgJGNvbnRhaW5lcik7XG5cbiAgICB2YXIgc3RvcHBlZEV2ZW50cyA9IFtcbiAgICAgICdibHVyJyxcbiAgICAgICdjaGFuZ2UnLFxuICAgICAgJ2NsaWNrJyxcbiAgICAgICdkYmxjbGljaycsXG4gICAgICAnZm9jdXMnLFxuICAgICAgJ2ZvY3VzaW4nLFxuICAgICAgJ2ZvY3Vzb3V0JyxcbiAgICAgICdpbnB1dCcsXG4gICAgICAna2V5ZG93bicsXG4gICAgICAna2V5dXAnLFxuICAgICAgJ2tleXByZXNzJyxcbiAgICAgICdtb3VzZWRvd24nLFxuICAgICAgJ21vdXNlZW50ZXInLFxuICAgICAgJ21vdXNlbGVhdmUnLFxuICAgICAgJ21vdXNlbW92ZScsXG4gICAgICAnbW91c2VvdmVyJyxcbiAgICAgICdtb3VzZXVwJyxcbiAgICAgICdzZWFyY2gnLFxuICAgICAgJ3RvdWNoZW5kJyxcbiAgICAgICd0b3VjaHN0YXJ0J1xuICAgIF07XG5cbiAgICB0aGlzLiRzZWxlY3Rpb24ub24oc3RvcHBlZEV2ZW50cy5qb2luKCcgJyksIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gU3RvcFByb3BhZ2F0aW9uO1xufSk7XG5cbi8qIVxuICogalF1ZXJ5IE1vdXNld2hlZWwgMy4xLjEzXG4gKlxuICogQ29weXJpZ2h0IGpRdWVyeSBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cDovL2pxdWVyeS5vcmcvbGljZW5zZVxuICovXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICggdHlwZW9mIFMyLmRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBTMi5kZWZpbmUuYW1kICkge1xuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgICAgIFMyLmRlZmluZSgnanF1ZXJ5LW1vdXNld2hlZWwnLFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIE5vZGUvQ29tbW9uSlMgc3R5bGUgZm9yIEJyb3dzZXJpZnlcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFsc1xuICAgICAgICBmYWN0b3J5KGpRdWVyeSk7XG4gICAgfVxufShmdW5jdGlvbiAoJCkge1xuXG4gICAgdmFyIHRvRml4ICA9IFsnd2hlZWwnLCAnbW91c2V3aGVlbCcsICdET01Nb3VzZVNjcm9sbCcsICdNb3pNb3VzZVBpeGVsU2Nyb2xsJ10sXG4gICAgICAgIHRvQmluZCA9ICggJ29ud2hlZWwnIGluIGRvY3VtZW50IHx8IGRvY3VtZW50LmRvY3VtZW50TW9kZSA+PSA5ICkgP1xuICAgICAgICAgICAgICAgICAgICBbJ3doZWVsJ10gOiBbJ21vdXNld2hlZWwnLCAnRG9tTW91c2VTY3JvbGwnLCAnTW96TW91c2VQaXhlbFNjcm9sbCddLFxuICAgICAgICBzbGljZSAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICAgIG51bGxMb3dlc3REZWx0YVRpbWVvdXQsIGxvd2VzdERlbHRhO1xuXG4gICAgaWYgKCAkLmV2ZW50LmZpeEhvb2tzICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IHRvRml4Lmxlbmd0aDsgaTsgKSB7XG4gICAgICAgICAgICAkLmV2ZW50LmZpeEhvb2tzWyB0b0ZpeFstLWldIF0gPSAkLmV2ZW50Lm1vdXNlSG9va3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc3BlY2lhbCA9ICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsID0ge1xuICAgICAgICB2ZXJzaW9uOiAnMy4xLjEyJyxcblxuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IHRvQmluZC5sZW5ndGg7IGk7ICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIHRvQmluZFstLWldLCBoYW5kbGVyLCBmYWxzZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBoYW5kbGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RvcmUgdGhlIGxpbmUgaGVpZ2h0IGFuZCBwYWdlIGhlaWdodCBmb3IgdGhpcyBwYXJ0aWN1bGFyIGVsZW1lbnRcbiAgICAgICAgICAgICQuZGF0YSh0aGlzLCAnbW91c2V3aGVlbC1saW5lLWhlaWdodCcsIHNwZWNpYWwuZ2V0TGluZUhlaWdodCh0aGlzKSk7XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ21vdXNld2hlZWwtcGFnZS1oZWlnaHQnLCBzcGVjaWFsLmdldFBhZ2VIZWlnaHQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gdG9CaW5kLmxlbmd0aDsgaTsgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciggdG9CaW5kWy0taV0sIGhhbmRsZXIsIGZhbHNlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDbGVhbiB1cCB0aGUgZGF0YSB3ZSBhZGRlZCB0byB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJC5yZW1vdmVEYXRhKHRoaXMsICdtb3VzZXdoZWVsLWxpbmUtaGVpZ2h0Jyk7XG4gICAgICAgICAgICAkLnJlbW92ZURhdGEodGhpcywgJ21vdXNld2hlZWwtcGFnZS1oZWlnaHQnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMaW5lSGVpZ2h0OiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW0gPSAkKGVsZW0pLFxuICAgICAgICAgICAgICAgICRwYXJlbnQgPSAkZWxlbVsnb2Zmc2V0UGFyZW50JyBpbiAkLmZuID8gJ29mZnNldFBhcmVudCcgOiAncGFyZW50J10oKTtcbiAgICAgICAgICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkcGFyZW50ID0gJCgnYm9keScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KCRwYXJlbnQuY3NzKCdmb250U2l6ZScpLCAxMCkgfHwgcGFyc2VJbnQoJGVsZW0uY3NzKCdmb250U2l6ZScpLCAxMCkgfHwgMTY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0UGFnZUhlaWdodDogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgcmV0dXJuICQoZWxlbSkuaGVpZ2h0KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIGFkanVzdE9sZERlbHRhczogdHJ1ZSwgLy8gc2VlIHNob3VsZEFkanVzdE9sZERlbHRhcygpIGJlbG93XG4gICAgICAgICAgICBub3JtYWxpemVPZmZzZXQ6IHRydWUgIC8vIGNhbGxzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBmb3IgZWFjaCBldmVudFxuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZm4uZXh0ZW5kKHtcbiAgICAgICAgbW91c2V3aGVlbDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBmbiA/IHRoaXMuYmluZCgnbW91c2V3aGVlbCcsIGZuKSA6IHRoaXMudHJpZ2dlcignbW91c2V3aGVlbCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVubW91c2V3aGVlbDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVuYmluZCgnbW91c2V3aGVlbCcsIGZuKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgICAgIHZhciBvcmdFdmVudCAgID0gZXZlbnQgfHwgd2luZG93LmV2ZW50LFxuICAgICAgICAgICAgYXJncyAgICAgICA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIGRlbHRhICAgICAgPSAwLFxuICAgICAgICAgICAgZGVsdGFYICAgICA9IDAsXG4gICAgICAgICAgICBkZWx0YVkgICAgID0gMCxcbiAgICAgICAgICAgIGFic0RlbHRhICAgPSAwLFxuICAgICAgICAgICAgb2Zmc2V0WCAgICA9IDAsXG4gICAgICAgICAgICBvZmZzZXRZICAgID0gMDtcbiAgICAgICAgZXZlbnQgPSAkLmV2ZW50LmZpeChvcmdFdmVudCk7XG4gICAgICAgIGV2ZW50LnR5cGUgPSAnbW91c2V3aGVlbCc7XG5cbiAgICAgICAgLy8gT2xkIHNjaG9vbCBzY3JvbGx3aGVlbCBkZWx0YVxuICAgICAgICBpZiAoICdkZXRhaWwnICAgICAgaW4gb3JnRXZlbnQgKSB7IGRlbHRhWSA9IG9yZ0V2ZW50LmRldGFpbCAqIC0xOyAgICAgIH1cbiAgICAgICAgaWYgKCAnd2hlZWxEZWx0YScgIGluIG9yZ0V2ZW50ICkgeyBkZWx0YVkgPSBvcmdFdmVudC53aGVlbERlbHRhOyAgICAgICB9XG4gICAgICAgIGlmICggJ3doZWVsRGVsdGFZJyBpbiBvcmdFdmVudCApIHsgZGVsdGFZID0gb3JnRXZlbnQud2hlZWxEZWx0YVk7ICAgICAgfVxuICAgICAgICBpZiAoICd3aGVlbERlbHRhWCcgaW4gb3JnRXZlbnQgKSB7IGRlbHRhWCA9IG9yZ0V2ZW50LndoZWVsRGVsdGFYICogLTE7IH1cblxuICAgICAgICAvLyBGaXJlZm94IDwgMTcgaG9yaXpvbnRhbCBzY3JvbGxpbmcgcmVsYXRlZCB0byBET01Nb3VzZVNjcm9sbCBldmVudFxuICAgICAgICBpZiAoICdheGlzJyBpbiBvcmdFdmVudCAmJiBvcmdFdmVudC5heGlzID09PSBvcmdFdmVudC5IT1JJWk9OVEFMX0FYSVMgKSB7XG4gICAgICAgICAgICBkZWx0YVggPSBkZWx0YVkgKiAtMTtcbiAgICAgICAgICAgIGRlbHRhWSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgZGVsdGEgdG8gYmUgZGVsdGFZIG9yIGRlbHRhWCBpZiBkZWx0YVkgaXMgMCBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdGl5XG4gICAgICAgIGRlbHRhID0gZGVsdGFZID09PSAwID8gZGVsdGFYIDogZGVsdGFZO1xuXG4gICAgICAgIC8vIE5ldyBzY2hvb2wgd2hlZWwgZGVsdGEgKHdoZWVsIGV2ZW50KVxuICAgICAgICBpZiAoICdkZWx0YVknIGluIG9yZ0V2ZW50ICkge1xuICAgICAgICAgICAgZGVsdGFZID0gb3JnRXZlbnQuZGVsdGFZICogLTE7XG4gICAgICAgICAgICBkZWx0YSAgPSBkZWx0YVk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAnZGVsdGFYJyBpbiBvcmdFdmVudCApIHtcbiAgICAgICAgICAgIGRlbHRhWCA9IG9yZ0V2ZW50LmRlbHRhWDtcbiAgICAgICAgICAgIGlmICggZGVsdGFZID09PSAwICkgeyBkZWx0YSAgPSBkZWx0YVggKiAtMTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm8gY2hhbmdlIGFjdHVhbGx5IGhhcHBlbmVkLCBubyByZWFzb24gdG8gZ28gYW55IGZ1cnRoZXJcbiAgICAgICAgaWYgKCBkZWx0YVkgPT09IDAgJiYgZGVsdGFYID09PSAwICkgeyByZXR1cm47IH1cblxuICAgICAgICAvLyBOZWVkIHRvIGNvbnZlcnQgbGluZXMgYW5kIHBhZ2VzIHRvIHBpeGVscyBpZiB3ZSBhcmVuJ3QgYWxyZWFkeSBpbiBwaXhlbHNcbiAgICAgICAgLy8gVGhlcmUgYXJlIHRocmVlIGRlbHRhIG1vZGVzOlxuICAgICAgICAvLyAgICogZGVsdGFNb2RlIDAgaXMgYnkgcGl4ZWxzLCBub3RoaW5nIHRvIGRvXG4gICAgICAgIC8vICAgKiBkZWx0YU1vZGUgMSBpcyBieSBsaW5lc1xuICAgICAgICAvLyAgICogZGVsdGFNb2RlIDIgaXMgYnkgcGFnZXNcbiAgICAgICAgaWYgKCBvcmdFdmVudC5kZWx0YU1vZGUgPT09IDEgKSB7XG4gICAgICAgICAgICB2YXIgbGluZUhlaWdodCA9ICQuZGF0YSh0aGlzLCAnbW91c2V3aGVlbC1saW5lLWhlaWdodCcpO1xuICAgICAgICAgICAgZGVsdGEgICo9IGxpbmVIZWlnaHQ7XG4gICAgICAgICAgICBkZWx0YVkgKj0gbGluZUhlaWdodDtcbiAgICAgICAgICAgIGRlbHRhWCAqPSBsaW5lSGVpZ2h0O1xuICAgICAgICB9IGVsc2UgaWYgKCBvcmdFdmVudC5kZWx0YU1vZGUgPT09IDIgKSB7XG4gICAgICAgICAgICB2YXIgcGFnZUhlaWdodCA9ICQuZGF0YSh0aGlzLCAnbW91c2V3aGVlbC1wYWdlLWhlaWdodCcpO1xuICAgICAgICAgICAgZGVsdGEgICo9IHBhZ2VIZWlnaHQ7XG4gICAgICAgICAgICBkZWx0YVkgKj0gcGFnZUhlaWdodDtcbiAgICAgICAgICAgIGRlbHRhWCAqPSBwYWdlSGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmUgbG93ZXN0IGFic29sdXRlIGRlbHRhIHRvIG5vcm1hbGl6ZSB0aGUgZGVsdGEgdmFsdWVzXG4gICAgICAgIGFic0RlbHRhID0gTWF0aC5tYXgoIE1hdGguYWJzKGRlbHRhWSksIE1hdGguYWJzKGRlbHRhWCkgKTtcblxuICAgICAgICBpZiAoICFsb3dlc3REZWx0YSB8fCBhYnNEZWx0YSA8IGxvd2VzdERlbHRhICkge1xuICAgICAgICAgICAgbG93ZXN0RGVsdGEgPSBhYnNEZWx0YTtcblxuICAgICAgICAgICAgLy8gQWRqdXN0IG9sZGVyIGRlbHRhcyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIGlmICggc2hvdWxkQWRqdXN0T2xkRGVsdGFzKG9yZ0V2ZW50LCBhYnNEZWx0YSkgKSB7XG4gICAgICAgICAgICAgICAgbG93ZXN0RGVsdGEgLz0gNDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGp1c3Qgb2xkZXIgZGVsdGFzIGlmIG5lY2Vzc2FyeVxuICAgICAgICBpZiAoIHNob3VsZEFkanVzdE9sZERlbHRhcyhvcmdFdmVudCwgYWJzRGVsdGEpICkge1xuICAgICAgICAgICAgLy8gRGl2aWRlIGFsbCB0aGUgdGhpbmdzIGJ5IDQwIVxuICAgICAgICAgICAgZGVsdGEgIC89IDQwO1xuICAgICAgICAgICAgZGVsdGFYIC89IDQwO1xuICAgICAgICAgICAgZGVsdGFZIC89IDQwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGEgd2hvbGUsIG5vcm1hbGl6ZWQgdmFsdWUgZm9yIHRoZSBkZWx0YXNcbiAgICAgICAgZGVsdGEgID0gTWF0aFsgZGVsdGEgID49IDEgPyAnZmxvb3InIDogJ2NlaWwnIF0oZGVsdGEgIC8gbG93ZXN0RGVsdGEpO1xuICAgICAgICBkZWx0YVggPSBNYXRoWyBkZWx0YVggPj0gMSA/ICdmbG9vcicgOiAnY2VpbCcgXShkZWx0YVggLyBsb3dlc3REZWx0YSk7XG4gICAgICAgIGRlbHRhWSA9IE1hdGhbIGRlbHRhWSA+PSAxID8gJ2Zsb29yJyA6ICdjZWlsJyBdKGRlbHRhWSAvIGxvd2VzdERlbHRhKTtcblxuICAgICAgICAvLyBOb3JtYWxpc2Ugb2Zmc2V0WCBhbmQgb2Zmc2V0WSBwcm9wZXJ0aWVzXG4gICAgICAgIGlmICggc3BlY2lhbC5zZXR0aW5ncy5ub3JtYWxpemVPZmZzZXQgJiYgdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QgKSB7XG4gICAgICAgICAgICB2YXIgYm91bmRpbmdSZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIG9mZnNldFggPSBldmVudC5jbGllbnRYIC0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgICAgICAgICBvZmZzZXRZID0gZXZlbnQuY2xpZW50WSAtIGJvdW5kaW5nUmVjdC50b3A7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgaW5mb3JtYXRpb24gdG8gdGhlIGV2ZW50IG9iamVjdFxuICAgICAgICBldmVudC5kZWx0YVggPSBkZWx0YVg7XG4gICAgICAgIGV2ZW50LmRlbHRhWSA9IGRlbHRhWTtcbiAgICAgICAgZXZlbnQuZGVsdGFGYWN0b3IgPSBsb3dlc3REZWx0YTtcbiAgICAgICAgZXZlbnQub2Zmc2V0WCA9IG9mZnNldFg7XG4gICAgICAgIGV2ZW50Lm9mZnNldFkgPSBvZmZzZXRZO1xuICAgICAgICAvLyBHbyBhaGVhZCBhbmQgc2V0IGRlbHRhTW9kZSB0byAwIHNpbmNlIHdlIGNvbnZlcnRlZCB0byBwaXhlbHNcbiAgICAgICAgLy8gQWx0aG91Z2ggdGhpcyBpcyBhIGxpdHRsZSBvZGQgc2luY2Ugd2Ugb3ZlcndyaXRlIHRoZSBkZWx0YVgvWVxuICAgICAgICAvLyBwcm9wZXJ0aWVzIHdpdGggbm9ybWFsaXplZCBkZWx0YXMuXG4gICAgICAgIGV2ZW50LmRlbHRhTW9kZSA9IDA7XG5cbiAgICAgICAgLy8gQWRkIGV2ZW50IGFuZCBkZWx0YSB0byB0aGUgZnJvbnQgb2YgdGhlIGFyZ3VtZW50c1xuICAgICAgICBhcmdzLnVuc2hpZnQoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgLy8gQ2xlYXJvdXQgbG93ZXN0RGVsdGEgYWZ0ZXIgc29tZXRpbWUgdG8gYmV0dGVyXG4gICAgICAgIC8vIGhhbmRsZSBtdWx0aXBsZSBkZXZpY2UgdHlwZXMgdGhhdCBnaXZlIGRpZmZlcmVudFxuICAgICAgICAvLyBhIGRpZmZlcmVudCBsb3dlc3REZWx0YVxuICAgICAgICAvLyBFeDogdHJhY2twYWQgPSAzIGFuZCBtb3VzZSB3aGVlbCA9IDEyMFxuICAgICAgICBpZiAobnVsbExvd2VzdERlbHRhVGltZW91dCkgeyBjbGVhclRpbWVvdXQobnVsbExvd2VzdERlbHRhVGltZW91dCk7IH1cbiAgICAgICAgbnVsbExvd2VzdERlbHRhVGltZW91dCA9IHNldFRpbWVvdXQobnVsbExvd2VzdERlbHRhLCAyMDApO1xuXG4gICAgICAgIHJldHVybiAoJC5ldmVudC5kaXNwYXRjaCB8fCAkLmV2ZW50LmhhbmRsZSkuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbnVsbExvd2VzdERlbHRhKCkge1xuICAgICAgICBsb3dlc3REZWx0YSA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvdWxkQWRqdXN0T2xkRGVsdGFzKG9yZ0V2ZW50LCBhYnNEZWx0YSkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIGFuIG9sZGVyIGV2ZW50IGFuZCB0aGUgZGVsdGEgaXMgZGl2aXNhYmxlIGJ5IDEyMCxcbiAgICAgICAgLy8gdGhlbiB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB0aGUgYnJvd3NlciBpcyB0cmVhdGluZyB0aGlzIGFzIGFuXG4gICAgICAgIC8vIG9sZGVyIG1vdXNlIHdoZWVsIGV2ZW50IGFuZCB0aGF0IHdlIHNob3VsZCBkaXZpZGUgdGhlIGRlbHRhc1xuICAgICAgICAvLyBieSA0MCB0byB0cnkgYW5kIGdldCBhIG1vcmUgdXNhYmxlIGRlbHRhRmFjdG9yLlxuICAgICAgICAvLyBTaWRlIG5vdGUsIHRoaXMgYWN0dWFsbHkgaW1wYWN0cyB0aGUgcmVwb3J0ZWQgc2Nyb2xsIGRpc3RhbmNlXG4gICAgICAgIC8vIGluIG9sZGVyIGJyb3dzZXJzIGFuZCBjYW4gY2F1c2Ugc2Nyb2xsaW5nIHRvIGJlIHNsb3dlciB0aGFuIG5hdGl2ZS5cbiAgICAgICAgLy8gVHVybiB0aGlzIG9mZiBieSBzZXR0aW5nICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsLnNldHRpbmdzLmFkanVzdE9sZERlbHRhcyB0byBmYWxzZS5cbiAgICAgICAgcmV0dXJuIHNwZWNpYWwuc2V0dGluZ3MuYWRqdXN0T2xkRGVsdGFzICYmIG9yZ0V2ZW50LnR5cGUgPT09ICdtb3VzZXdoZWVsJyAmJiBhYnNEZWx0YSAlIDEyMCA9PT0gMDtcbiAgICB9XG5cbn0pKTtcblxuUzIuZGVmaW5lKCdqcXVlcnkuc2VsZWN0MicsW1xuICAnanF1ZXJ5JyxcbiAgJ2pxdWVyeS1tb3VzZXdoZWVsJyxcblxuICAnLi9zZWxlY3QyL2NvcmUnLFxuICAnLi9zZWxlY3QyL2RlZmF1bHRzJ1xuXSwgZnVuY3Rpb24gKCQsIF8sIFNlbGVjdDIsIERlZmF1bHRzKSB7XG4gIGlmICgkLmZuLnNlbGVjdDIgPT0gbnVsbCkge1xuICAgIC8vIEFsbCBtZXRob2RzIHRoYXQgc2hvdWxkIHJldHVybiB0aGUgZWxlbWVudFxuICAgIHZhciB0aGlzTWV0aG9kcyA9IFsnb3BlbicsICdjbG9zZScsICdkZXN0cm95J107XG5cbiAgICAkLmZuLnNlbGVjdDIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIG9wdGlvbnMpO1xuXG4gICAgICAgICAgdmFyIGluc3RhbmNlID0gbmV3IFNlbGVjdDIoJCh0aGlzKSwgaW5zdGFuY2VPcHRpb25zKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgcmV0O1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgaW5zdGFuY2UgPSAkKHRoaXMpLmRhdGEoJ3NlbGVjdDInKTtcblxuICAgICAgICAgIGlmIChpbnN0YW5jZSA9PSBudWxsICYmIHdpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICdUaGUgc2VsZWN0MihcXCcnICsgb3B0aW9ucyArICdcXCcpIG1ldGhvZCB3YXMgY2FsbGVkIG9uIGFuICcgK1xuICAgICAgICAgICAgICAnZWxlbWVudCB0aGF0IGlzIG5vdCB1c2luZyBTZWxlY3QyLidcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0ID0gaW5zdGFuY2Vbb3B0aW9uc10uYXBwbHkoaW5zdGFuY2UsIGFyZ3MpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaGVjayBpZiB3ZSBzaG91bGQgYmUgcmV0dXJuaW5nIGB0aGlzYFxuICAgICAgICBpZiAoJC5pbkFycmF5KG9wdGlvbnMsIHRoaXNNZXRob2RzKSA+IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50cyBmb3IgU2VsZWN0MjogJyArIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBpZiAoJC5mbi5zZWxlY3QyLmRlZmF1bHRzID09IG51bGwpIHtcbiAgICAkLmZuLnNlbGVjdDIuZGVmYXVsdHMgPSBEZWZhdWx0cztcbiAgfVxuXG4gIHJldHVybiBTZWxlY3QyO1xufSk7XG5cbiAgLy8gUmV0dXJuIHRoZSBBTUQgbG9hZGVyIGNvbmZpZ3VyYXRpb24gc28gaXQgY2FuIGJlIHVzZWQgb3V0c2lkZSBvZiB0aGlzIGZpbGVcbiAgcmV0dXJuIHtcbiAgICBkZWZpbmU6IFMyLmRlZmluZSxcbiAgICByZXF1aXJlOiBTMi5yZXF1aXJlXG4gIH07XG59KCkpO1xuXG4gIC8vIEF1dG9sb2FkIHRoZSBqUXVlcnkgYmluZGluZ3NcbiAgLy8gV2Uga25vdyB0aGF0IGFsbCBvZiB0aGUgbW9kdWxlcyBleGlzdCBhYm92ZSB0aGlzLCBzbyB3ZSdyZSBzYWZlXG4gIHZhciBzZWxlY3QyID0gUzIucmVxdWlyZSgnanF1ZXJ5LnNlbGVjdDInKTtcblxuICAvLyBIb2xkIHRoZSBBTUQgbW9kdWxlIHJlZmVyZW5jZXMgb24gdGhlIGpRdWVyeSBmdW5jdGlvbiB0aGF0IHdhcyBqdXN0IGxvYWRlZFxuICAvLyBUaGlzIGFsbG93cyBTZWxlY3QyIHRvIHVzZSB0aGUgaW50ZXJuYWwgbG9hZGVyIG91dHNpZGUgb2YgdGhpcyBmaWxlLCBzdWNoXG4gIC8vIGFzIGluIHRoZSBsYW5ndWFnZSBmaWxlcy5cbiAgalF1ZXJ5LmZuLnNlbGVjdDIuYW1kID0gUzI7XG5cbiAgLy8gUmV0dXJuIHRoZSBTZWxlY3QyIGluc3RhbmNlIGZvciBhbnlvbmUgd2hvIGlzIGltcG9ydGluZyBpdC5cbiAgcmV0dXJuIHNlbGVjdDI7XG59KSk7XG4iXX0=

/**
 * State-based routing for AngularJS
 * @version v0.2.18
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
  module.exports = 'ui.router';
}

(function (window, angular, undefined) {
/*jshint globalstrict:true*/
/*global angular:false*/
'use strict';

var isDefined = angular.isDefined,
    isFunction = angular.isFunction,
    isString = angular.isString,
    isObject = angular.isObject,
    isArray = angular.isArray,
    forEach = angular.forEach,
    extend = angular.extend,
    copy = angular.copy,
    toJson = angular.toJson;

function inherit(parent, extra) {
  return extend(new (extend(function() {}, { prototype: parent }))(), extra);
}

function merge(dst) {
  forEach(arguments, function(obj) {
    if (obj !== dst) {
      forEach(obj, function(value, key) {
        if (!dst.hasOwnProperty(key)) dst[key] = value;
      });
    }
  });
  return dst;
}

/**
 * Finds the common ancestor path between two states.
 *
 * @param {Object} first The first state.
 * @param {Object} second The second state.
 * @return {Array} Returns an array of state names in descending order, not including the root.
 */
function ancestors(first, second) {
  var path = [];

  for (var n in first.path) {
    if (first.path[n] !== second.path[n]) break;
    path.push(first.path[n]);
  }
  return path;
}

/**
 * IE8-safe wrapper for `Object.keys()`.
 *
 * @param {Object} object A JavaScript object.
 * @return {Array} Returns the keys of the object as an array.
 */
function objectKeys(object) {
  if (Object.keys) {
    return Object.keys(object);
  }
  var result = [];

  forEach(object, function(val, key) {
    result.push(key);
  });
  return result;
}

/**
 * IE8-safe wrapper for `Array.prototype.indexOf()`.
 *
 * @param {Array} array A JavaScript array.
 * @param {*} value A value to search the array for.
 * @return {Number} Returns the array index value of `value`, or `-1` if not present.
 */
function indexOf(array, value) {
  if (Array.prototype.indexOf) {
    return array.indexOf(value, Number(arguments[2]) || 0);
  }
  var len = array.length >>> 0, from = Number(arguments[2]) || 0;
  from = (from < 0) ? Math.ceil(from) : Math.floor(from);

  if (from < 0) from += len;

  for (; from < len; from++) {
    if (from in array && array[from] === value) return from;
  }
  return -1;
}

/**
 * Merges a set of parameters with all parameters inherited between the common parents of the
 * current state and a given destination state.
 *
 * @param {Object} currentParams The value of the current state parameters ($stateParams).
 * @param {Object} newParams The set of parameters which will be composited with inherited params.
 * @param {Object} $current Internal definition of object representing the current state.
 * @param {Object} $to Internal definition of object representing state to transition to.
 */
function inheritParams(currentParams, newParams, $current, $to) {
  var parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

  for (var i in parents) {
    if (!parents[i] || !parents[i].params) continue;
    parentParams = objectKeys(parents[i].params);
    if (!parentParams.length) continue;

    for (var j in parentParams) {
      if (indexOf(inheritList, parentParams[j]) >= 0) continue;
      inheritList.push(parentParams[j]);
      inherited[parentParams[j]] = currentParams[parentParams[j]];
    }
  }
  return extend({}, inherited, newParams);
}

/**
 * Performs a non-strict comparison of the subset of two objects, defined by a list of keys.
 *
 * @param {Object} a The first object.
 * @param {Object} b The second object.
 * @param {Array} keys The list of keys within each object to compare. If the list is empty or not specified,
 *                     it defaults to the list of keys in `a`.
 * @return {Boolean} Returns `true` if the keys match, otherwise `false`.
 */
function equalForKeys(a, b, keys) {
  if (!keys) {
    keys = [];
    for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
  }

  for (var i=0; i<keys.length; i++) {
    var k = keys[i];
    if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
  }
  return true;
}

/**
 * Returns the subset of an object, based on a list of keys.
 *
 * @param {Array} keys
 * @param {Object} values
 * @return {Boolean} Returns a subset of `values`.
 */
function filterByKeys(keys, values) {
  var filtered = {};

  forEach(keys, function (name) {
    filtered[name] = values[name];
  });
  return filtered;
}

// like _.indexBy
// when you know that your index values will be unique, or you want last-one-in to win
function indexBy(array, propName) {
  var result = {};
  forEach(array, function(item) {
    result[item[propName]] = item;
  });
  return result;
}

// extracted from underscore.js
// Return a copy of the object only containing the whitelisted properties.
function pick(obj) {
  var copy = {};
  var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
  forEach(keys, function(key) {
    if (key in obj) copy[key] = obj[key];
  });
  return copy;
}

// extracted from underscore.js
// Return a copy of the object omitting the blacklisted properties.
function omit(obj) {
  var copy = {};
  var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
  for (var key in obj) {
    if (indexOf(keys, key) == -1) copy[key] = obj[key];
  }
  return copy;
}

function pluck(collection, key) {
  var result = isArray(collection) ? [] : {};

  forEach(collection, function(val, i) {
    result[i] = isFunction(key) ? key(val) : val[key];
  });
  return result;
}

function filter(collection, callback) {
  var array = isArray(collection);
  var result = array ? [] : {};
  forEach(collection, function(val, i) {
    if (callback(val, i)) {
      result[array ? result.length : i] = val;
    }
  });
  return result;
}

function map(collection, callback) {
  var result = isArray(collection) ? [] : {};

  forEach(collection, function(val, i) {
    result[i] = callback(val, i);
  });
  return result;
}

/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng']);

/**
 * @ngdoc overview
 * @name ui.router.router
 * 
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router.state
 * 
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 * 
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 * 
 * ## The main module for ui.router 
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes. 
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router - 
 * 
 * *You'll need to include **only** this module as the dependency within your angular app.*
 * 
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.state']);

angular.module('ui.router.compat', ['ui.router']);

/**
 * @ngdoc object
 * @name ui.router.util.$resolve
 *
 * @requires $q
 * @requires $injector
 *
 * @description
 * Manages resolution of (acyclic) graphs of promises.
 */
$Resolve.$inject = ['$q', '$injector'];
function $Resolve(  $q,    $injector) {
  
  var VISIT_IN_PROGRESS = 1,
      VISIT_DONE = 2,
      NOTHING = {},
      NO_DEPENDENCIES = [],
      NO_LOCALS = NOTHING,
      NO_PARENT = extend($q.when(NOTHING), { $$promises: NOTHING, $$values: NOTHING });
  

  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#study
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Studies a set of invocables that are likely to be used multiple times.
   * <pre>
   * $resolve.study(invocables)(locals, parent, self)
   * </pre>
   * is equivalent to
   * <pre>
   * $resolve.resolve(invocables, locals, parent, self)
   * </pre>
   * but the former is more efficient (in fact `resolve` just calls `study` 
   * internally).
   *
   * @param {object} invocables Invocable objects
   * @return {function} a function to pass in locals, parent and self
   */
  this.study = function (invocables) {
    if (!isObject(invocables)) throw new Error("'invocables' must be an object");
    var invocableKeys = objectKeys(invocables || {});
    
    // Perform a topological sort of invocables to build an ordered plan
    var plan = [], cycle = [], visited = {};
    function visit(value, key) {
      if (visited[key] === VISIT_DONE) return;
      
      cycle.push(key);
      if (visited[key] === VISIT_IN_PROGRESS) {
        cycle.splice(0, indexOf(cycle, key));
        throw new Error("Cyclic dependency: " + cycle.join(" -> "));
      }
      visited[key] = VISIT_IN_PROGRESS;
      
      if (isString(value)) {
        plan.push(key, [ function() { return $injector.get(value); }], NO_DEPENDENCIES);
      } else {
        var params = $injector.annotate(value);
        forEach(params, function (param) {
          if (param !== key && invocables.hasOwnProperty(param)) visit(invocables[param], param);
        });
        plan.push(key, value, params);
      }
      
      cycle.pop();
      visited[key] = VISIT_DONE;
    }
    forEach(invocables, visit);
    invocables = cycle = visited = null; // plan is all that's required
    
    function isResolve(value) {
      return isObject(value) && value.then && value.$$promises;
    }
    
    return function (locals, parent, self) {
      if (isResolve(locals) && self === undefined) {
        self = parent; parent = locals; locals = null;
      }
      if (!locals) locals = NO_LOCALS;
      else if (!isObject(locals)) {
        throw new Error("'locals' must be an object");
      }       
      if (!parent) parent = NO_PARENT;
      else if (!isResolve(parent)) {
        throw new Error("'parent' must be a promise returned by $resolve.resolve()");
      }
      
      // To complete the overall resolution, we have to wait for the parent
      // promise and for the promise for each invokable in our plan.
      var resolution = $q.defer(),
          result = resolution.promise,
          promises = result.$$promises = {},
          values = extend({}, locals),
          wait = 1 + plan.length/3,
          merged = false;
          
      function done() {
        // Merge parent values we haven't got yet and publish our own $$values
        if (!--wait) {
          if (!merged) merge(values, parent.$$values); 
          result.$$values = values;
          result.$$promises = result.$$promises || true; // keep for isResolve()
          delete result.$$inheritedValues;
          resolution.resolve(values);
        }
      }
      
      function fail(reason) {
        result.$$failure = reason;
        resolution.reject(reason);
      }

      // Short-circuit if parent has already failed
      if (isDefined(parent.$$failure)) {
        fail(parent.$$failure);
        return result;
      }
      
      if (parent.$$inheritedValues) {
        merge(values, omit(parent.$$inheritedValues, invocableKeys));
      }

      // Merge parent values if the parent has already resolved, or merge
      // parent promises and wait if the parent resolve is still in progress.
      extend(promises, parent.$$promises);
      if (parent.$$values) {
        merged = merge(values, omit(parent.$$values, invocableKeys));
        result.$$inheritedValues = omit(parent.$$values, invocableKeys);
        done();
      } else {
        if (parent.$$inheritedValues) {
          result.$$inheritedValues = omit(parent.$$inheritedValues, invocableKeys);
        }        
        parent.then(done, fail);
      }
      
      // Process each invocable in the plan, but ignore any where a local of the same name exists.
      for (var i=0, ii=plan.length; i<ii; i+=3) {
        if (locals.hasOwnProperty(plan[i])) done();
        else invoke(plan[i], plan[i+1], plan[i+2]);
      }
      
      function invoke(key, invocable, params) {
        // Create a deferred for this invocation. Failures will propagate to the resolution as well.
        var invocation = $q.defer(), waitParams = 0;
        function onfailure(reason) {
          invocation.reject(reason);
          fail(reason);
        }
        // Wait for any parameter that we have a promise for (either from parent or from this
        // resolve; in that case study() will have made sure it's ordered before us in the plan).
        forEach(params, function (dep) {
          if (promises.hasOwnProperty(dep) && !locals.hasOwnProperty(dep)) {
            waitParams++;
            promises[dep].then(function (result) {
              values[dep] = result;
              if (!(--waitParams)) proceed();
            }, onfailure);
          }
        });
        if (!waitParams) proceed();
        function proceed() {
          if (isDefined(result.$$failure)) return;
          try {
            invocation.resolve($injector.invoke(invocable, self, values));
            invocation.promise.then(function (result) {
              values[key] = result;
              done();
            }, onfailure);
          } catch (e) {
            onfailure(e);
          }
        }
        // Publish promise synchronously; invocations further down in the plan may depend on it.
        promises[key] = invocation.promise;
      }
      
      return result;
    };
  };
  
  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#resolve
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Resolves a set of invocables. An invocable is a function to be invoked via 
   * `$injector.invoke()`, and can have an arbitrary number of dependencies. 
   * An invocable can either return a value directly,
   * or a `$q` promise. If a promise is returned it will be resolved and the 
   * resulting value will be used instead. Dependencies of invocables are resolved 
   * (in this order of precedence)
   *
   * - from the specified `locals`
   * - from another invocable that is part of this `$resolve` call
   * - from an invocable that is inherited from a `parent` call to `$resolve` 
   *   (or recursively
   * - from any ancestor `$resolve` of that parent).
   *
   * The return value of `$resolve` is a promise for an object that contains 
   * (in this order of precedence)
   *
   * - any `locals` (if specified)
   * - the resolved return values of all injectables
   * - any values inherited from a `parent` call to `$resolve` (if specified)
   *
   * The promise will resolve after the `parent` promise (if any) and all promises 
   * returned by injectables have been resolved. If any invocable 
   * (or `$injector.invoke`) throws an exception, or if a promise returned by an 
   * invocable is rejected, the `$resolve` promise is immediately rejected with the 
   * same error. A rejection of a `parent` promise (if specified) will likewise be 
   * propagated immediately. Once the `$resolve` promise has been rejected, no 
   * further invocables will be called.
   * 
   * Cyclic dependencies between invocables are not permitted and will cause `$resolve`
   * to throw an error. As a special case, an injectable can depend on a parameter 
   * with the same name as the injectable, which will be fulfilled from the `parent` 
   * injectable of the same name. This allows inherited values to be decorated. 
   * Note that in this case any other injectable in the same `$resolve` with the same
   * dependency would see the decorated value, not the inherited value.
   *
   * Note that missing dependencies -- unlike cyclic dependencies -- will cause an 
   * (asynchronous) rejection of the `$resolve` promise rather than a (synchronous) 
   * exception.
   *
   * Invocables are invoked eagerly as soon as all dependencies are available. 
   * This is true even for dependencies inherited from a `parent` call to `$resolve`.
   *
   * As a special case, an invocable can be a string, in which case it is taken to 
   * be a service name to be passed to `$injector.get()`. This is supported primarily 
   * for backwards-compatibility with the `resolve` property of `$routeProvider` 
   * routes.
   *
   * @param {object} invocables functions to invoke or 
   * `$injector` services to fetch.
   * @param {object} locals  values to make available to the injectables
   * @param {object} parent  a promise returned by another call to `$resolve`.
   * @param {object} self  the `this` for the invoked methods
   * @return {object} Promise for an object that contains the resolved return value
   * of all invocables, as well as any inherited and local values.
   */
  this.resolve = function (invocables, locals, parent, self) {
    return this.study(invocables)(locals, parent, self);
  };
}

angular.module('ui.router.util').service('$resolve', $Resolve);


/**
 * @ngdoc object
 * @name ui.router.util.$templateFactory
 *
 * @requires $http
 * @requires $templateCache
 * @requires $injector
 *
 * @description
 * Service. Manages loading of templates.
 */
$TemplateFactory.$inject = ['$http', '$templateCache', '$injector'];
function $TemplateFactory(  $http,   $templateCache,   $injector) {

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromConfig
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template from a configuration object. 
   *
   * @param {object} config Configuration object for which to load a template. 
   * The following properties are search in the specified order, and the first one 
   * that is defined is used to create the template:
   *
   * @param {string|object} config.template html string template or function to 
   * load via {@link ui.router.util.$templateFactory#fromString fromString}.
   * @param {string|object} config.templateUrl url to load or a function returning 
   * the url to load via {@link ui.router.util.$templateFactory#fromUrl fromUrl}.
   * @param {Function} config.templateProvider function to invoke via 
   * {@link ui.router.util.$templateFactory#fromProvider fromProvider}.
   * @param {object} params  Parameters to pass to the template function.
   * @param {object} locals Locals to pass to `invoke` if the template is loaded 
   * via a `templateProvider`. Defaults to `{ params: params }`.
   *
   * @return {string|object}  The template html as a string, or a promise for 
   * that string,or `null` if no template is configured.
   */
  this.fromConfig = function (config, params, locals) {
    return (
      isDefined(config.template) ? this.fromString(config.template, params) :
      isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
      isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, locals) :
      null
    );
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromString
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template from a string or a function returning a string.
   *
   * @param {string|object} template html template as a string or function that 
   * returns an html template as a string.
   * @param {object} params Parameters to pass to the template function.
   *
   * @return {string|object} The template html as a string, or a promise for that 
   * string.
   */
  this.fromString = function (template, params) {
    return isFunction(template) ? template(params) : template;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromUrl
   * @methodOf ui.router.util.$templateFactory
   * 
   * @description
   * Loads a template from the a URL via `$http` and `$templateCache`.
   *
   * @param {string|Function} url url of the template to load, or a function 
   * that returns a url.
   * @param {Object} params Parameters to pass to the url function.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  this.fromUrl = function (url, params) {
    if (isFunction(url)) url = url(params);
    if (url == null) return null;
    else return $http
        .get(url, { cache: $templateCache, headers: { Accept: 'text/html' }})
        .then(function(response) { return response.data; });
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromProvider
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template by invoking an injectable provider function.
   *
   * @param {Function} provider Function to invoke via `$injector.invoke`
   * @param {Object} params Parameters for the template.
   * @param {Object} locals Locals to pass to `invoke`. Defaults to 
   * `{ params: params }`.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  this.fromProvider = function (provider, params, locals) {
    return $injector.invoke(provider, null, locals || { params: params });
  };
}

angular.module('ui.router.util').service('$templateFactory', $TemplateFactory);

var $$UMFP; // reference to $UrlMatcherFactoryProvider

/**
 * @ngdoc object
 * @name ui.router.util.type:UrlMatcher
 *
 * @description
 * Matches URLs against patterns and extracts named parameters from the path or the search
 * part of the URL. A URL pattern consists of a path pattern, optionally followed by '?' and a list
 * of search parameters. Multiple search parameter names are separated by '&'. Search parameters
 * do not influence whether or not a URL is matched, but their values are passed through into
 * the matched parameters returned by {@link ui.router.util.type:UrlMatcher#methods_exec exec}.
 *
 * Path parameter placeholders can be specified using simple colon/catch-all syntax or curly brace
 * syntax, which optionally allows a regular expression for the parameter to be specified:
 *
 * * `':'` name - colon placeholder
 * * `'*'` name - catch-all placeholder
 * * `'{' name '}'` - curly placeholder
 * * `'{' name ':' regexp|type '}'` - curly placeholder with regexp or type name. Should the
 *   regexp itself contain curly braces, they must be in matched pairs or escaped with a backslash.
 *
 * Parameter names may contain only word characters (latin letters, digits, and underscore) and
 * must be unique within the pattern (across both path and search parameters). For colon
 * placeholders or curly placeholders without an explicit regexp, a path parameter matches any
 * number of characters other than '/'. For catch-all placeholders the path parameter matches
 * any number of characters.
 *
 * Examples:
 *
 * * `'/hello/'` - Matches only if the path is exactly '/hello/'. There is no special treatment for
 *   trailing slashes, and patterns have to match the entire path, not just a prefix.
 * * `'/user/:id'` - Matches '/user/bob' or '/user/1234!!!' or even '/user/' but not '/user' or
 *   '/user/bob/details'. The second path segment will be captured as the parameter 'id'.
 * * `'/user/{id}'` - Same as the previous example, but using curly brace syntax.
 * * `'/user/{id:[^/]*}'` - Same as the previous example.
 * * `'/user/{id:[0-9a-fA-F]{1,8}}'` - Similar to the previous example, but only matches if the id
 *   parameter consists of 1 to 8 hex digits.
 * * `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
 *   path into the parameter 'path'.
 * * `'/files/*path'` - ditto.
 * * `'/calendar/{start:date}'` - Matches "/calendar/2014-11-12" (because the pattern defined
 *   in the built-in  `date` Type matches `2014-11-12`) and provides a Date object in $stateParams.start
 *
 * @param {string} pattern  The pattern to compile into a matcher.
 * @param {Object} config  A configuration object hash:
 * @param {Object=} parentMatcher Used to concatenate the pattern/config onto
 *   an existing UrlMatcher
 *
 * * `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
 * * `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
 *
 * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
 *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
 *   non-null) will start with this prefix.
 *
 * @property {string} source  The pattern that was passed into the constructor
 *
 * @property {string} sourcePath  The path portion of the source property
 *
 * @property {string} sourceSearch  The search portion of the source property
 *
 * @property {string} regex  The constructed regex that will be used to match against the url when
 *   it is time to determine which url will match.
 *
 * @returns {Object}  New `UrlMatcher` object
 */
function UrlMatcher(pattern, config, parentMatcher) {
  config = extend({ params: {} }, isObject(config) ? config : {});

  // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
  //   '*' name
  //   ':' name
  //   '{' name '}'
  //   '{' name ':' regexp '}'
  // The regular expression is somewhat complicated due to the need to allow curly braces
  // inside the regular expression. The placeholder regexp breaks down as follows:
  //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
  //    \{([\w\[\]]+)(?:\:\s*( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
  //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
  //    [^{}\\]+                       - anything other than curly braces or backslash
  //    \\.                            - a backslash escape
  //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
  var placeholder       = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
      searchPlaceholder = /([:]?)([\w\[\].-]+)|\{([\w\[\].-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
      compiled = '^', last = 0, m,
      segments = this.segments = [],
      parentParams = parentMatcher ? parentMatcher.params : {},
      params = this.params = parentMatcher ? parentMatcher.params.$$new() : new $$UMFP.ParamSet(),
      paramNames = [];

  function addParameter(id, type, config, location) {
    paramNames.push(id);
    if (parentParams[id]) return parentParams[id];
    if (!/^\w+([-.]+\w+)*(?:\[\])?$/.test(id)) throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
    if (params[id]) throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
    params[id] = new $$UMFP.Param(id, type, config, location);
    return params[id];
  }

  function quoteRegExp(string, pattern, squash, optional) {
    var surroundPattern = ['',''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
    if (!pattern) return result;
    switch(squash) {
      case false: surroundPattern = ['(', ')' + (optional ? "?" : "")]; break;
      case true:
        result = result.replace(/\/$/, '');
        surroundPattern = ['(?:\/(', ')|\/)?'];
      break;
      default:    surroundPattern = ['(' + squash + "|", ')?']; break;
    }
    return result + surroundPattern[0] + pattern + surroundPattern[1];
  }

  this.source = pattern;

  // Split into static segments separated by path parameter placeholders.
  // The number of segments is always 1 more than the number of parameters.
  function matchDetails(m, isSearch) {
    var id, regexp, segment, type, cfg, arrayMode;
    id          = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
    cfg         = config.params[id];
    segment     = pattern.substring(last, m.index);
    regexp      = isSearch ? m[4] : m[4] || (m[1] == '*' ? '.*' : null);

    if (regexp) {
      type      = $$UMFP.type(regexp) || inherit($$UMFP.type("string"), { pattern: new RegExp(regexp, config.caseInsensitive ? 'i' : undefined) });
    }

    return {
      id: id, regexp: regexp, segment: segment, type: type, cfg: cfg
    };
  }

  var p, param, segment;
  while ((m = placeholder.exec(pattern))) {
    p = matchDetails(m, false);
    if (p.segment.indexOf('?') >= 0) break; // we're into the search part

    param = addParameter(p.id, p.type, p.cfg, "path");
    compiled += quoteRegExp(p.segment, param.type.pattern.source, param.squash, param.isOptional);
    segments.push(p.segment);
    last = placeholder.lastIndex;
  }
  segment = pattern.substring(last);

  // Find any search parameter names and remove them from the last segment
  var i = segment.indexOf('?');

  if (i >= 0) {
    var search = this.sourceSearch = segment.substring(i);
    segment = segment.substring(0, i);
    this.sourcePath = pattern.substring(0, last + i);

    if (search.length > 0) {
      last = 0;
      while ((m = searchPlaceholder.exec(search))) {
        p = matchDetails(m, true);
        param = addParameter(p.id, p.type, p.cfg, "search");
        last = placeholder.lastIndex;
        // check if ?&
      }
    }
  } else {
    this.sourcePath = pattern;
    this.sourceSearch = '';
  }

  compiled += quoteRegExp(segment) + (config.strict === false ? '\/?' : '') + '$';
  segments.push(segment);

  this.regexp = new RegExp(compiled, config.caseInsensitive ? 'i' : undefined);
  this.prefix = segments[0];
  this.$$paramNames = paramNames;
}

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#concat
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Returns a new matcher for a pattern constructed by appending the path part and adding the
 * search parameters of the specified pattern to this pattern. The current pattern is not
 * modified. This can be understood as creating a pattern for URLs that are relative to (or
 * suffixes of) the current pattern.
 *
 * @example
 * The following two matchers are equivalent:
 * <pre>
 * new UrlMatcher('/user/{id}?q').concat('/details?date');
 * new UrlMatcher('/user/{id}/details?q&date');
 * </pre>
 *
 * @param {string} pattern  The pattern to append.
 * @param {Object} config  An object hash of the configuration for the matcher.
 * @returns {UrlMatcher}  A matcher for the concatenated pattern.
 */
UrlMatcher.prototype.concat = function (pattern, config) {
  // Because order of search parameters is irrelevant, we can add our own search
  // parameters to the end of the new pattern. Parse the new pattern by itself
  // and then join the bits together, but it's much easier to do this on a string level.
  var defaultConfig = {
    caseInsensitive: $$UMFP.caseInsensitive(),
    strict: $$UMFP.strictMode(),
    squash: $$UMFP.defaultSquashPolicy()
  };
  return new UrlMatcher(this.sourcePath + pattern + this.sourceSearch, extend(defaultConfig, config), this);
};

UrlMatcher.prototype.toString = function () {
  return this.source;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#exec
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Tests the specified path against this matcher, and returns an object containing the captured
 * parameter values, or null if the path does not match. The returned object contains the values
 * of any search parameters that are mentioned in the pattern, but their value may be null if
 * they are not present in `searchParams`. This means that search parameters are always treated
 * as optional.
 *
 * @example
 * <pre>
 * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', {
 *   x: '1', q: 'hello'
 * });
 * // returns { id: 'bob', q: 'hello', r: null }
 * </pre>
 *
 * @param {string} path  The URL path to match, e.g. `$location.path()`.
 * @param {Object} searchParams  URL search parameters, e.g. `$location.search()`.
 * @returns {Object}  The captured parameter values.
 */
UrlMatcher.prototype.exec = function (path, searchParams) {
  var m = this.regexp.exec(path);
  if (!m) return null;
  searchParams = searchParams || {};

  var paramNames = this.parameters(), nTotal = paramNames.length,
    nPath = this.segments.length - 1,
    values = {}, i, j, cfg, paramName;

  if (nPath !== m.length - 1) throw new Error("Unbalanced capture group in route '" + this.source + "'");

  function decodePathArray(string) {
    function reverseString(str) { return str.split("").reverse().join(""); }
    function unquoteDashes(str) { return str.replace(/\\-/g, "-"); }

    var split = reverseString(string).split(/-(?!\\)/);
    var allReversed = map(split, reverseString);
    return map(allReversed, unquoteDashes).reverse();
  }

  var param, paramVal;
  for (i = 0; i < nPath; i++) {
    paramName = paramNames[i];
    param = this.params[paramName];
    paramVal = m[i+1];
    // if the param value matches a pre-replace pair, replace the value before decoding.
    for (j = 0; j < param.replace.length; j++) {
      if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
    }
    if (paramVal && param.array === true) paramVal = decodePathArray(paramVal);
    if (isDefined(paramVal)) paramVal = param.type.decode(paramVal);
    values[paramName] = param.value(paramVal);
  }
  for (/**/; i < nTotal; i++) {
    paramName = paramNames[i];
    values[paramName] = this.params[paramName].value(searchParams[paramName]);
    param = this.params[paramName];
    paramVal = searchParams[paramName];
    for (j = 0; j < param.replace.length; j++) {
      if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
    }
    if (isDefined(paramVal)) paramVal = param.type.decode(paramVal);
    values[paramName] = param.value(paramVal);
  }

  return values;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#parameters
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Returns the names of all path and search parameters of this pattern in an unspecified order.
 *
 * @returns {Array.<string>}  An array of parameter names. Must be treated as read-only. If the
 *    pattern has no parameters, an empty array is returned.
 */
UrlMatcher.prototype.parameters = function (param) {
  if (!isDefined(param)) return this.$$paramNames;
  return this.params[param] || null;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#validates
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Checks an object hash of parameters to validate their correctness according to the parameter
 * types of this `UrlMatcher`.
 *
 * @param {Object} params The object hash of parameters to validate.
 * @returns {boolean} Returns `true` if `params` validates, otherwise `false`.
 */
UrlMatcher.prototype.validates = function (params) {
  return this.params.$$validates(params);
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#format
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Creates a URL that matches this pattern by substituting the specified values
 * for the path and search parameters. Null values for path parameters are
 * treated as empty strings.
 *
 * @example
 * <pre>
 * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
 * // returns '/user/bob?q=yes'
 * </pre>
 *
 * @param {Object} values  the values to substitute for the parameters in this pattern.
 * @returns {string}  the formatted URL (path and optionally search part).
 */
UrlMatcher.prototype.format = function (values) {
  values = values || {};
  var segments = this.segments, params = this.parameters(), paramset = this.params;
  if (!this.validates(values)) return null;

  var i, search = false, nPath = segments.length - 1, nTotal = params.length, result = segments[0];

  function encodeDashes(str) { // Replace dashes with encoded "\-"
    return encodeURIComponent(str).replace(/-/g, function(c) { return '%5C%' + c.charCodeAt(0).toString(16).toUpperCase(); });
  }

  for (i = 0; i < nTotal; i++) {
    var isPathParam = i < nPath;
    var name = params[i], param = paramset[name], value = param.value(values[name]);
    var isDefaultValue = param.isOptional && param.type.equals(param.value(), value);
    var squash = isDefaultValue ? param.squash : false;
    var encoded = param.type.encode(value);

    if (isPathParam) {
      var nextSegment = segments[i + 1];
      var isFinalPathParam = i + 1 === nPath;

      if (squash === false) {
        if (encoded != null) {
          if (isArray(encoded)) {
            result += map(encoded, encodeDashes).join("-");
          } else {
            result += encodeURIComponent(encoded);
          }
        }
        result += nextSegment;
      } else if (squash === true) {
        var capture = result.match(/\/$/) ? /\/?(.*)/ : /(.*)/;
        result += nextSegment.match(capture)[1];
      } else if (isString(squash)) {
        result += squash + nextSegment;
      }

      if (isFinalPathParam && param.squash === true && result.slice(-1) === '/') result = result.slice(0, -1);
    } else {
      if (encoded == null || (isDefaultValue && squash !== false)) continue;
      if (!isArray(encoded)) encoded = [ encoded ];
      if (encoded.length === 0) continue;
      encoded = map(encoded, encodeURIComponent).join('&' + name + '=');
      result += (search ? '&' : '?') + (name + '=' + encoded);
      search = true;
    }
  }

  return result;
};

/**
 * @ngdoc object
 * @name ui.router.util.type:Type
 *
 * @description
 * Implements an interface to define custom parameter types that can be decoded from and encoded to
 * string parameters matched in a URL. Used by {@link ui.router.util.type:UrlMatcher `UrlMatcher`}
 * objects when matching or formatting URLs, or comparing or validating parameter values.
 *
 * See {@link ui.router.util.$urlMatcherFactory#methods_type `$urlMatcherFactory#type()`} for more
 * information on registering custom types.
 *
 * @param {Object} config  A configuration object which contains the custom type definition.  The object's
 *        properties will override the default methods and/or pattern in `Type`'s public interface.
 * @example
 * <pre>
 * {
 *   decode: function(val) { return parseInt(val, 10); },
 *   encode: function(val) { return val && val.toString(); },
 *   equals: function(a, b) { return this.is(a) && a === b; },
 *   is: function(val) { return angular.isNumber(val) isFinite(val) && val % 1 === 0; },
 *   pattern: /\d+/
 * }
 * </pre>
 *
 * @property {RegExp} pattern The regular expression pattern used to match values of this type when
 *           coming from a substring of a URL.
 *
 * @returns {Object}  Returns a new `Type` object.
 */
function Type(config) {
  extend(this, config);
}

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#is
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Detects whether a value is of a particular type. Accepts a native (decoded) value
 * and determines whether it matches the current `Type` object.
 *
 * @param {*} val  The value to check.
 * @param {string} key  Optional. If the type check is happening in the context of a specific
 *        {@link ui.router.util.type:UrlMatcher `UrlMatcher`} object, this is the name of the
 *        parameter in which `val` is stored. Can be used for meta-programming of `Type` objects.
 * @returns {Boolean}  Returns `true` if the value matches the type, otherwise `false`.
 */
Type.prototype.is = function(val, key) {
  return true;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#encode
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Encodes a custom/native type value to a string that can be embedded in a URL. Note that the
 * return value does *not* need to be URL-safe (i.e. passed through `encodeURIComponent()`), it
 * only needs to be a representation of `val` that has been coerced to a string.
 *
 * @param {*} val  The value to encode.
 * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
 *        meta-programming of `Type` objects.
 * @returns {string}  Returns a string representation of `val` that can be encoded in a URL.
 */
Type.prototype.encode = function(val, key) {
  return val;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#decode
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Converts a parameter value (from URL string or transition param) to a custom/native value.
 *
 * @param {string} val  The URL parameter value to decode.
 * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
 *        meta-programming of `Type` objects.
 * @returns {*}  Returns a custom representation of the URL parameter value.
 */
Type.prototype.decode = function(val, key) {
  return val;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#equals
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Determines whether two decoded values are equivalent.
 *
 * @param {*} a  A value to compare against.
 * @param {*} b  A value to compare against.
 * @returns {Boolean}  Returns `true` if the values are equivalent/equal, otherwise `false`.
 */
Type.prototype.equals = function(a, b) {
  return a == b;
};

Type.prototype.$subPattern = function() {
  var sub = this.pattern.toString();
  return sub.substr(1, sub.length - 2);
};

Type.prototype.pattern = /.*/;

Type.prototype.toString = function() { return "{Type:" + this.name + "}"; };

/** Given an encoded string, or a decoded object, returns a decoded object */
Type.prototype.$normalize = function(val) {
  return this.is(val) ? val : this.decode(val);
};

/*
 * Wraps an existing custom Type as an array of Type, depending on 'mode'.
 * e.g.:
 * - urlmatcher pattern "/path?{queryParam[]:int}"
 * - url: "/path?queryParam=1&queryParam=2
 * - $stateParams.queryParam will be [1, 2]
 * if `mode` is "auto", then
 * - url: "/path?queryParam=1 will create $stateParams.queryParam: 1
 * - url: "/path?queryParam=1&queryParam=2 will create $stateParams.queryParam: [1, 2]
 */
Type.prototype.$asArray = function(mode, isSearch) {
  if (!mode) return this;
  if (mode === "auto" && !isSearch) throw new Error("'auto' array mode is for query parameters only");

  function ArrayType(type, mode) {
    function bindTo(type, callbackName) {
      return function() {
        return type[callbackName].apply(type, arguments);
      };
    }

    // Wrap non-array value as array
    function arrayWrap(val) { return isArray(val) ? val : (isDefined(val) ? [ val ] : []); }
    // Unwrap array value for "auto" mode. Return undefined for empty array.
    function arrayUnwrap(val) {
      switch(val.length) {
        case 0: return undefined;
        case 1: return mode === "auto" ? val[0] : val;
        default: return val;
      }
    }
    function falsey(val) { return !val; }

    // Wraps type (.is/.encode/.decode) functions to operate on each value of an array
    function arrayHandler(callback, allTruthyMode) {
      return function handleArray(val) {
        if (isArray(val) && val.length === 0) return val;
        val = arrayWrap(val);
        var result = map(val, callback);
        if (allTruthyMode === true)
          return filter(result, falsey).length === 0;
        return arrayUnwrap(result);
      };
    }

    // Wraps type (.equals) functions to operate on each value of an array
    function arrayEqualsHandler(callback) {
      return function handleArray(val1, val2) {
        var left = arrayWrap(val1), right = arrayWrap(val2);
        if (left.length !== right.length) return false;
        for (var i = 0; i < left.length; i++) {
          if (!callback(left[i], right[i])) return false;
        }
        return true;
      };
    }

    this.encode = arrayHandler(bindTo(type, 'encode'));
    this.decode = arrayHandler(bindTo(type, 'decode'));
    this.is     = arrayHandler(bindTo(type, 'is'), true);
    this.equals = arrayEqualsHandler(bindTo(type, 'equals'));
    this.pattern = type.pattern;
    this.$normalize = arrayHandler(bindTo(type, '$normalize'));
    this.name = type.name;
    this.$arrayMode = mode;
  }

  return new ArrayType(this, mode);
};



/**
 * @ngdoc object
 * @name ui.router.util.$urlMatcherFactory
 *
 * @description
 * Factory for {@link ui.router.util.type:UrlMatcher `UrlMatcher`} instances. The factory
 * is also available to providers under the name `$urlMatcherFactoryProvider`.
 */
function $UrlMatcherFactory() {
  $$UMFP = this;

  var isCaseInsensitive = false, isStrictMode = true, defaultSquashPolicy = false;

  // Use tildes to pre-encode slashes.
  // If the slashes are simply URLEncoded, the browser can choose to pre-decode them,
  // and bidirectional encoding/decoding fails.
  // Tilde was chosen because it's not a RFC 3986 section 2.2 Reserved Character
  function valToString(val) { return val != null ? val.toString().replace(/~/g, "~~").replace(/\//g, "~2F") : val; }
  function valFromString(val) { return val != null ? val.toString().replace(/~2F/g, "/").replace(/~~/g, "~") : val; }

  var $types = {}, enqueue = true, typeQueue = [], injector, defaultTypes = {
    "string": {
      encode: valToString,
      decode: valFromString,
      // TODO: in 1.0, make string .is() return false if value is undefined/null by default.
      // In 0.2.x, string params are optional by default for backwards compat
      is: function(val) { return val == null || !isDefined(val) || typeof val === "string"; },
      pattern: /[^/]*/
    },
    "int": {
      encode: valToString,
      decode: function(val) { return parseInt(val, 10); },
      is: function(val) { return isDefined(val) && this.decode(val.toString()) === val; },
      pattern: /\d+/
    },
    "bool": {
      encode: function(val) { return val ? 1 : 0; },
      decode: function(val) { return parseInt(val, 10) !== 0; },
      is: function(val) { return val === true || val === false; },
      pattern: /0|1/
    },
    "date": {
      encode: function (val) {
        if (!this.is(val))
          return undefined;
        return [ val.getFullYear(),
          ('0' + (val.getMonth() + 1)).slice(-2),
          ('0' + val.getDate()).slice(-2)
        ].join("-");
      },
      decode: function (val) {
        if (this.is(val)) return val;
        var match = this.capture.exec(val);
        return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
      },
      is: function(val) { return val instanceof Date && !isNaN(val.valueOf()); },
      equals: function (a, b) { return this.is(a) && this.is(b) && a.toISOString() === b.toISOString(); },
      pattern: /[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,
      capture: /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
    },
    "json": {
      encode: angular.toJson,
      decode: angular.fromJson,
      is: angular.isObject,
      equals: angular.equals,
      pattern: /[^/]*/
    },
    "any": { // does not encode/decode
      encode: angular.identity,
      decode: angular.identity,
      equals: angular.equals,
      pattern: /.*/
    }
  };

  function getDefaultConfig() {
    return {
      strict: isStrictMode,
      caseInsensitive: isCaseInsensitive
    };
  }

  function isInjectable(value) {
    return (isFunction(value) || (isArray(value) && isFunction(value[value.length - 1])));
  }

  /**
   * [Internal] Get the default value of a parameter, which may be an injectable function.
   */
  $UrlMatcherFactory.$$getDefaultValue = function(config) {
    if (!isInjectable(config.value)) return config.value;
    if (!injector) throw new Error("Injectable functions cannot be called at configuration time");
    return injector.invoke(config.value);
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#caseInsensitive
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Defines whether URL matching should be case sensitive (the default behavior), or not.
   *
   * @param {boolean} value `false` to match URL in a case sensitive manner; otherwise `true`;
   * @returns {boolean} the current value of caseInsensitive
   */
  this.caseInsensitive = function(value) {
    if (isDefined(value))
      isCaseInsensitive = value;
    return isCaseInsensitive;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#strictMode
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Defines whether URLs should match trailing slashes, or not (the default behavior).
   *
   * @param {boolean=} value `false` to match trailing slashes in URLs, otherwise `true`.
   * @returns {boolean} the current value of strictMode
   */
  this.strictMode = function(value) {
    if (isDefined(value))
      isStrictMode = value;
    return isStrictMode;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#defaultSquashPolicy
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Sets the default behavior when generating or matching URLs with default parameter values.
   *
   * @param {string} value A string that defines the default parameter URL squashing behavior.
   *    `nosquash`: When generating an href with a default parameter value, do not squash the parameter value from the URL
   *    `slash`: When generating an href with a default parameter value, squash (remove) the parameter value, and, if the
   *             parameter is surrounded by slashes, squash (remove) one slash from the URL
   *    any other string, e.g. "~": When generating an href with a default parameter value, squash (remove)
   *             the parameter value from the URL and replace it with this string.
   */
  this.defaultSquashPolicy = function(value) {
    if (!isDefined(value)) return defaultSquashPolicy;
    if (value !== true && value !== false && !isString(value))
      throw new Error("Invalid squash policy: " + value + ". Valid policies: false, true, arbitrary-string");
    defaultSquashPolicy = value;
    return value;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#compile
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Creates a {@link ui.router.util.type:UrlMatcher `UrlMatcher`} for the specified pattern.
   *
   * @param {string} pattern  The URL pattern.
   * @param {Object} config  The config object hash.
   * @returns {UrlMatcher}  The UrlMatcher.
   */
  this.compile = function (pattern, config) {
    return new UrlMatcher(pattern, extend(getDefaultConfig(), config));
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#isMatcher
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Returns true if the specified object is a `UrlMatcher`, or false otherwise.
   *
   * @param {Object} object  The object to perform the type check against.
   * @returns {Boolean}  Returns `true` if the object matches the `UrlMatcher` interface, by
   *          implementing all the same methods.
   */
  this.isMatcher = function (o) {
    if (!isObject(o)) return false;
    var result = true;

    forEach(UrlMatcher.prototype, function(val, name) {
      if (isFunction(val)) {
        result = result && (isDefined(o[name]) && isFunction(o[name]));
      }
    });
    return result;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#type
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Registers a custom {@link ui.router.util.type:Type `Type`} object that can be used to
   * generate URLs with typed parameters.
   *
   * @param {string} name  The type name.
   * @param {Object|Function} definition   The type definition. See
   *        {@link ui.router.util.type:Type `Type`} for information on the values accepted.
   * @param {Object|Function} definitionFn (optional) A function that is injected before the app
   *        runtime starts.  The result of this function is merged into the existing `definition`.
   *        See {@link ui.router.util.type:Type `Type`} for information on the values accepted.
   *
   * @returns {Object}  Returns `$urlMatcherFactoryProvider`.
   *
   * @example
   * This is a simple example of a custom type that encodes and decodes items from an
   * array, using the array index as the URL-encoded value:
   *
   * <pre>
   * var list = ['John', 'Paul', 'George', 'Ringo'];
   *
   * $urlMatcherFactoryProvider.type('listItem', {
   *   encode: function(item) {
   *     // Represent the list item in the URL using its corresponding index
   *     return list.indexOf(item);
   *   },
   *   decode: function(item) {
   *     // Look up the list item by index
   *     return list[parseInt(item, 10)];
   *   },
   *   is: function(item) {
   *     // Ensure the item is valid by checking to see that it appears
   *     // in the list
   *     return list.indexOf(item) > -1;
   *   }
   * });
   *
   * $stateProvider.state('list', {
   *   url: "/list/{item:listItem}",
   *   controller: function($scope, $stateParams) {
   *     console.log($stateParams.item);
   *   }
   * });
   *
   * // ...
   *
   * // Changes URL to '/list/3', logs "Ringo" to the console
   * $state.go('list', { item: "Ringo" });
   * </pre>
   *
   * This is a more complex example of a type that relies on dependency injection to
   * interact with services, and uses the parameter name from the URL to infer how to
   * handle encoding and decoding parameter values:
   *
   * <pre>
   * // Defines a custom type that gets a value from a service,
   * // where each service gets different types of values from
   * // a backend API:
   * $urlMatcherFactoryProvider.type('dbObject', {}, function(Users, Posts) {
   *
   *   // Matches up services to URL parameter names
   *   var services = {
   *     user: Users,
   *     post: Posts
   *   };
   *
   *   return {
   *     encode: function(object) {
   *       // Represent the object in the URL using its unique ID
   *       return object.id;
   *     },
   *     decode: function(value, key) {
   *       // Look up the object by ID, using the parameter
   *       // name (key) to call the correct service
   *       return services[key].findById(value);
   *     },
   *     is: function(object, key) {
   *       // Check that object is a valid dbObject
   *       return angular.isObject(object) && object.id && services[key];
   *     }
   *     equals: function(a, b) {
   *       // Check the equality of decoded objects by comparing
   *       // their unique IDs
   *       return a.id === b.id;
   *     }
   *   };
   * });
   *
   * // In a config() block, you can then attach URLs with
   * // type-annotated parameters:
   * $stateProvider.state('users', {
   *   url: "/users",
   *   // ...
   * }).state('users.item', {
   *   url: "/{user:dbObject}",
   *   controller: function($scope, $stateParams) {
   *     // $stateParams.user will now be an object returned from
   *     // the Users service
   *   },
   *   // ...
   * });
   * </pre>
   */
  this.type = function (name, definition, definitionFn) {
    if (!isDefined(definition)) return $types[name];
    if ($types.hasOwnProperty(name)) throw new Error("A type named '" + name + "' has already been defined.");

    $types[name] = new Type(extend({ name: name }, definition));
    if (definitionFn) {
      typeQueue.push({ name: name, def: definitionFn });
      if (!enqueue) flushTypeQueue();
    }
    return this;
  };

  // `flushTypeQueue()` waits until `$urlMatcherFactory` is injected before invoking the queued `definitionFn`s
  function flushTypeQueue() {
    while(typeQueue.length) {
      var type = typeQueue.shift();
      if (type.pattern) throw new Error("You cannot override a type's .pattern at runtime.");
      angular.extend($types[type.name], injector.invoke(type.def));
    }
  }

  // Register default types. Store them in the prototype of $types.
  forEach(defaultTypes, function(type, name) { $types[name] = new Type(extend({name: name}, type)); });
  $types = inherit($types, {});

  /* No need to document $get, since it returns this */
  this.$get = ['$injector', function ($injector) {
    injector = $injector;
    enqueue = false;
    flushTypeQueue();

    forEach(defaultTypes, function(type, name) {
      if (!$types[name]) $types[name] = new Type(type);
    });
    return this;
  }];

  this.Param = function Param(id, type, config, location) {
    var self = this;
    config = unwrapShorthand(config);
    type = getType(config, type, location);
    var arrayMode = getArrayMode();
    type = arrayMode ? type.$asArray(arrayMode, location === "search") : type;
    if (type.name === "string" && !arrayMode && location === "path" && config.value === undefined)
      config.value = ""; // for 0.2.x; in 0.3.0+ do not automatically default to ""
    var isOptional = config.value !== undefined;
    var squash = getSquashPolicy(config, isOptional);
    var replace = getReplace(config, arrayMode, isOptional, squash);

    function unwrapShorthand(config) {
      var keys = isObject(config) ? objectKeys(config) : [];
      var isShorthand = indexOf(keys, "value") === -1 && indexOf(keys, "type") === -1 &&
                        indexOf(keys, "squash") === -1 && indexOf(keys, "array") === -1;
      if (isShorthand) config = { value: config };
      config.$$fn = isInjectable(config.value) ? config.value : function () { return config.value; };
      return config;
    }

    function getType(config, urlType, location) {
      if (config.type && urlType) throw new Error("Param '"+id+"' has two type configurations.");
      if (urlType) return urlType;
      if (!config.type) return (location === "config" ? $types.any : $types.string);

      if (angular.isString(config.type))
        return $types[config.type];
      if (config.type instanceof Type)
        return config.type;
      return new Type(config.type);
    }

    // array config: param name (param[]) overrides default settings.  explicit config overrides param name.
    function getArrayMode() {
      var arrayDefaults = { array: (location === "search" ? "auto" : false) };
      var arrayParamNomenclature = id.match(/\[\]$/) ? { array: true } : {};
      return extend(arrayDefaults, arrayParamNomenclature, config).array;
    }

    /**
     * returns false, true, or the squash value to indicate the "default parameter url squash policy".
     */
    function getSquashPolicy(config, isOptional) {
      var squash = config.squash;
      if (!isOptional || squash === false) return false;
      if (!isDefined(squash) || squash == null) return defaultSquashPolicy;
      if (squash === true || isString(squash)) return squash;
      throw new Error("Invalid squash policy: '" + squash + "'. Valid policies: false, true, or arbitrary string");
    }

    function getReplace(config, arrayMode, isOptional, squash) {
      var replace, configuredKeys, defaultPolicy = [
        { from: "",   to: (isOptional || arrayMode ? undefined : "") },
        { from: null, to: (isOptional || arrayMode ? undefined : "") }
      ];
      replace = isArray(config.replace) ? config.replace : [];
      if (isString(squash))
        replace.push({ from: squash, to: undefined });
      configuredKeys = map(replace, function(item) { return item.from; } );
      return filter(defaultPolicy, function(item) { return indexOf(configuredKeys, item.from) === -1; }).concat(replace);
    }

    /**
     * [Internal] Get the default value of a parameter, which may be an injectable function.
     */
    function $$getDefaultValue() {
      if (!injector) throw new Error("Injectable functions cannot be called at configuration time");
      var defaultValue = injector.invoke(config.$$fn);
      if (defaultValue !== null && defaultValue !== undefined && !self.type.is(defaultValue))
        throw new Error("Default value (" + defaultValue + ") for parameter '" + self.id + "' is not an instance of Type (" + self.type.name + ")");
      return defaultValue;
    }

    /**
     * [Internal] Gets the decoded representation of a value if the value is defined, otherwise, returns the
     * default value, which may be the result of an injectable function.
     */
    function $value(value) {
      function hasReplaceVal(val) { return function(obj) { return obj.from === val; }; }
      function $replace(value) {
        var replacement = map(filter(self.replace, hasReplaceVal(value)), function(obj) { return obj.to; });
        return replacement.length ? replacement[0] : value;
      }
      value = $replace(value);
      return !isDefined(value) ? $$getDefaultValue() : self.type.$normalize(value);
    }

    function toString() { return "{Param:" + id + " " + type + " squash: '" + squash + "' optional: " + isOptional + "}"; }

    extend(this, {
      id: id,
      type: type,
      location: location,
      array: arrayMode,
      squash: squash,
      replace: replace,
      isOptional: isOptional,
      value: $value,
      dynamic: undefined,
      config: config,
      toString: toString
    });
  };

  function ParamSet(params) {
    extend(this, params || {});
  }

  ParamSet.prototype = {
    $$new: function() {
      return inherit(this, extend(new ParamSet(), { $$parent: this}));
    },
    $$keys: function () {
      var keys = [], chain = [], parent = this,
        ignore = objectKeys(ParamSet.prototype);
      while (parent) { chain.push(parent); parent = parent.$$parent; }
      chain.reverse();
      forEach(chain, function(paramset) {
        forEach(objectKeys(paramset), function(key) {
            if (indexOf(keys, key) === -1 && indexOf(ignore, key) === -1) keys.push(key);
        });
      });
      return keys;
    },
    $$values: function(paramValues) {
      var values = {}, self = this;
      forEach(self.$$keys(), function(key) {
        values[key] = self[key].value(paramValues && paramValues[key]);
      });
      return values;
    },
    $$equals: function(paramValues1, paramValues2) {
      var equal = true, self = this;
      forEach(self.$$keys(), function(key) {
        var left = paramValues1 && paramValues1[key], right = paramValues2 && paramValues2[key];
        if (!self[key].type.equals(left, right)) equal = false;
      });
      return equal;
    },
    $$validates: function $$validate(paramValues) {
      var keys = this.$$keys(), i, param, rawVal, normalized, encoded;
      for (i = 0; i < keys.length; i++) {
        param = this[keys[i]];
        rawVal = paramValues[keys[i]];
        if ((rawVal === undefined || rawVal === null) && param.isOptional)
          break; // There was no parameter value, but the param is optional
        normalized = param.type.$normalize(rawVal);
        if (!param.type.is(normalized))
          return false; // The value was not of the correct Type, and could not be decoded to the correct Type
        encoded = param.type.encode(normalized);
        if (angular.isString(encoded) && !param.type.pattern.exec(encoded))
          return false; // The value was of the correct type, but when encoded, did not match the Type's regexp
      }
      return true;
    },
    $$parent: undefined
  };

  this.ParamSet = ParamSet;
}

// Register as a provider so it's available to other providers
angular.module('ui.router.util').provider('$urlMatcherFactory', $UrlMatcherFactory);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory) { }]);

/**
 * @ngdoc object
 * @name ui.router.router.$urlRouterProvider
 *
 * @requires ui.router.util.$urlMatcherFactoryProvider
 * @requires $locationProvider
 *
 * @description
 * `$urlRouterProvider` has the responsibility of watching `$location`. 
 * When `$location` changes it runs through a list of rules one by one until a 
 * match is found. `$urlRouterProvider` is used behind the scenes anytime you specify 
 * a url in a state configuration. All urls are compiled into a UrlMatcher object.
 *
 * There are several methods on `$urlRouterProvider` that make it useful to use directly
 * in your module config.
 */
$UrlRouterProvider.$inject = ['$locationProvider', '$urlMatcherFactoryProvider'];
function $UrlRouterProvider(   $locationProvider,   $urlMatcherFactory) {
  var rules = [], otherwise = null, interceptDeferred = false, listener;

  // Returns a string that is a prefix of all strings matching the RegExp
  function regExpPrefix(re) {
    var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
    return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
  }

  // Interpolates matched values into a String.replace()-style pattern
  function interpolate(pattern, match) {
    return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
      return match[what === '$' ? 0 : Number(what)];
    });
  }

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#rule
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Defines rules that are used by `$urlRouterProvider` to find matches for
   * specific URLs.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   // Here's an example of how you might allow case insensitive urls
   *   $urlRouterProvider.rule(function ($injector, $location) {
   *     var path = $location.path(),
   *         normalized = path.toLowerCase();
   *
   *     if (path !== normalized) {
   *       return normalized;
   *     }
   *   });
   * });
   * </pre>
   *
   * @param {function} rule Handler function that takes `$injector` and `$location`
   * services as arguments. You can use them to return a valid path as a string.
   *
   * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
   */
  this.rule = function (rule) {
    if (!isFunction(rule)) throw new Error("'rule' must be a function");
    rules.push(rule);
    return this;
  };

  /**
   * @ngdoc object
   * @name ui.router.router.$urlRouterProvider#otherwise
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Defines a path that is used when an invalid route is requested.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   // if the path doesn't match any of the urls you configured
   *   // otherwise will take care of routing the user to the
   *   // specified url
   *   $urlRouterProvider.otherwise('/index');
   *
   *   // Example of using function rule as param
   *   $urlRouterProvider.otherwise(function ($injector, $location) {
   *     return '/a/valid/url';
   *   });
   * });
   * </pre>
   *
   * @param {string|function} rule The url path you want to redirect to or a function 
   * rule that returns the url path. The function version is passed two params: 
   * `$injector` and `$location` services, and must return a url string.
   *
   * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
   */
  this.otherwise = function (rule) {
    if (isString(rule)) {
      var redirect = rule;
      rule = function () { return redirect; };
    }
    else if (!isFunction(rule)) throw new Error("'rule' must be a function");
    otherwise = rule;
    return this;
  };


  function handleIfMatch($injector, handler, match) {
    if (!match) return false;
    var result = $injector.invoke(handler, handler, { $match: match });
    return isDefined(result) ? result : true;
  }

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#when
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Registers a handler for a given url matching. 
   * 
   * If the handler is a string, it is
   * treated as a redirect, and is interpolated according to the syntax of match
   * (i.e. like `String.replace()` for `RegExp`, or like a `UrlMatcher` pattern otherwise).
   *
   * If the handler is a function, it is injectable. It gets invoked if `$location`
   * matches. You have the option of inject the match object as `$match`.
   *
   * The handler can return
   *
   * - **falsy** to indicate that the rule didn't match after all, then `$urlRouter`
   *   will continue trying to find another one that matches.
   * - **string** which is treated as a redirect and passed to `$location.url()`
   * - **void** or any **truthy** value tells `$urlRouter` that the url was handled.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   $urlRouterProvider.when($state.url, function ($match, $stateParams) {
   *     if ($state.$current.navigable !== state ||
   *         !equalForKeys($match, $stateParams) {
   *      $state.transitionTo(state, $match, false);
   *     }
   *   });
   * });
   * </pre>
   *
   * @param {string|object} what The incoming path that you want to redirect.
   * @param {string|function} handler The path you want to redirect your user to.
   */
  this.when = function (what, handler) {
    var redirect, handlerIsString = isString(handler);
    if (isString(what)) what = $urlMatcherFactory.compile(what);

    if (!handlerIsString && !isFunction(handler) && !isArray(handler))
      throw new Error("invalid 'handler' in when()");

    var strategies = {
      matcher: function (what, handler) {
        if (handlerIsString) {
          redirect = $urlMatcherFactory.compile(handler);
          handler = ['$match', function ($match) { return redirect.format($match); }];
        }
        return extend(function ($injector, $location) {
          return handleIfMatch($injector, handler, what.exec($location.path(), $location.search()));
        }, {
          prefix: isString(what.prefix) ? what.prefix : ''
        });
      },
      regex: function (what, handler) {
        if (what.global || what.sticky) throw new Error("when() RegExp must not be global or sticky");

        if (handlerIsString) {
          redirect = handler;
          handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
        }
        return extend(function ($injector, $location) {
          return handleIfMatch($injector, handler, what.exec($location.path()));
        }, {
          prefix: regExpPrefix(what)
        });
      }
    };

    var check = { matcher: $urlMatcherFactory.isMatcher(what), regex: what instanceof RegExp };

    for (var n in check) {
      if (check[n]) return this.rule(strategies[n](what, handler));
    }

    throw new Error("invalid 'what' in when()");
  };

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#deferIntercept
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Disables (or enables) deferring location change interception.
   *
   * If you wish to customize the behavior of syncing the URL (for example, if you wish to
   * defer a transition but maintain the current URL), call this method at configuration time.
   * Then, at run time, call `$urlRouter.listen()` after you have configured your own
   * `$locationChangeSuccess` event handler.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *
   *   // Prevent $urlRouter from automatically intercepting URL changes;
   *   // this allows you to configure custom behavior in between
   *   // location changes and route synchronization:
   *   $urlRouterProvider.deferIntercept();
   *
   * }).run(function ($rootScope, $urlRouter, UserService) {
   *
   *   $rootScope.$on('$locationChangeSuccess', function(e) {
   *     // UserService is an example service for managing user state
   *     if (UserService.isLoggedIn()) return;
   *
   *     // Prevent $urlRouter's default handler from firing
   *     e.preventDefault();
   *
   *     UserService.handleLogin().then(function() {
   *       // Once the user has logged in, sync the current URL
   *       // to the router:
   *       $urlRouter.sync();
   *     });
   *   });
   *
   *   // Configures $urlRouter's listener *after* your custom listener
   *   $urlRouter.listen();
   * });
   * </pre>
   *
   * @param {boolean} defer Indicates whether to defer location change interception. Passing
            no parameter is equivalent to `true`.
   */
  this.deferIntercept = function (defer) {
    if (defer === undefined) defer = true;
    interceptDeferred = defer;
  };

  /**
   * @ngdoc object
   * @name ui.router.router.$urlRouter
   *
   * @requires $location
   * @requires $rootScope
   * @requires $injector
   * @requires $browser
   *
   * @description
   *
   */
  this.$get = $get;
  $get.$inject = ['$location', '$rootScope', '$injector', '$browser', '$sniffer'];
  function $get(   $location,   $rootScope,   $injector,   $browser,   $sniffer) {

    var baseHref = $browser.baseHref(), location = $location.url(), lastPushedUrl;

    function appendBasePath(url, isHtml5, absolute) {
      if (baseHref === '/') return url;
      if (isHtml5) return baseHref.slice(0, -1) + url;
      if (absolute) return baseHref.slice(1) + url;
      return url;
    }

    // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
    function update(evt) {
      if (evt && evt.defaultPrevented) return;
      var ignoreUpdate = lastPushedUrl && $location.url() === lastPushedUrl;
      lastPushedUrl = undefined;
      // TODO: Re-implement this in 1.0 for https://github.com/angular-ui/ui-router/issues/1573
      //if (ignoreUpdate) return true;

      function check(rule) {
        var handled = rule($injector, $location);

        if (!handled) return false;
        if (isString(handled)) $location.replace().url(handled);
        return true;
      }
      var n = rules.length, i;

      for (i = 0; i < n; i++) {
        if (check(rules[i])) return;
      }
      // always check otherwise last to allow dynamic updates to the set of rules
      if (otherwise) check(otherwise);
    }

    function listen() {
      listener = listener || $rootScope.$on('$locationChangeSuccess', update);
      return listener;
    }

    if (!interceptDeferred) listen();

    return {
      /**
       * @ngdoc function
       * @name ui.router.router.$urlRouter#sync
       * @methodOf ui.router.router.$urlRouter
       *
       * @description
       * Triggers an update; the same update that happens when the address bar url changes, aka `$locationChangeSuccess`.
       * This method is useful when you need to use `preventDefault()` on the `$locationChangeSuccess` event,
       * perform some custom logic (route protection, auth, config, redirection, etc) and then finally proceed
       * with the transition by calling `$urlRouter.sync()`.
       *
       * @example
       * <pre>
       * angular.module('app', ['ui.router'])
       *   .run(function($rootScope, $urlRouter) {
       *     $rootScope.$on('$locationChangeSuccess', function(evt) {
       *       // Halt state change from even starting
       *       evt.preventDefault();
       *       // Perform custom logic
       *       var meetsRequirement = ...
       *       // Continue with the update and state transition if logic allows
       *       if (meetsRequirement) $urlRouter.sync();
       *     });
       * });
       * </pre>
       */
      sync: function() {
        update();
      },

      listen: function() {
        return listen();
      },

      update: function(read) {
        if (read) {
          location = $location.url();
          return;
        }
        if ($location.url() === location) return;

        $location.url(location);
        $location.replace();
      },

      push: function(urlMatcher, params, options) {
         var url = urlMatcher.format(params || {});

        // Handle the special hash param, if needed
        if (url !== null && params && params['#']) {
            url += '#' + params['#'];
        }

        $location.url(url);
        lastPushedUrl = options && options.$$avoidResync ? $location.url() : undefined;
        if (options && options.replace) $location.replace();
      },

      /**
       * @ngdoc function
       * @name ui.router.router.$urlRouter#href
       * @methodOf ui.router.router.$urlRouter
       *
       * @description
       * A URL generation method that returns the compiled URL for a given
       * {@link ui.router.util.type:UrlMatcher `UrlMatcher`}, populated with the provided parameters.
       *
       * @example
       * <pre>
       * $bob = $urlRouter.href(new UrlMatcher("/about/:person"), {
       *   person: "bob"
       * });
       * // $bob == "/about/bob";
       * </pre>
       *
       * @param {UrlMatcher} urlMatcher The `UrlMatcher` object which is used as the template of the URL to generate.
       * @param {object=} params An object of parameter values to fill the matcher's required parameters.
       * @param {object=} options Options object. The options are:
       *
       * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
       *
       * @returns {string} Returns the fully compiled URL, or `null` if `params` fail validation against `urlMatcher`
       */
      href: function(urlMatcher, params, options) {
        if (!urlMatcher.validates(params)) return null;

        var isHtml5 = $locationProvider.html5Mode();
        if (angular.isObject(isHtml5)) {
          isHtml5 = isHtml5.enabled;
        }

        isHtml5 = isHtml5 && $sniffer.history;
        
        var url = urlMatcher.format(params);
        options = options || {};

        if (!isHtml5 && url !== null) {
          url = "#" + $locationProvider.hashPrefix() + url;
        }

        // Handle special hash param, if needed
        if (url !== null && params && params['#']) {
          url += '#' + params['#'];
        }

        url = appendBasePath(url, isHtml5, options.absolute);

        if (!options.absolute || !url) {
          return url;
        }

        var slash = (!isHtml5 && url ? '/' : ''), port = $location.port();
        port = (port === 80 || port === 443 ? '' : ':' + port);

        return [$location.protocol(), '://', $location.host(), port, slash, url].join('');
      }
    };
  }
}

angular.module('ui.router.router').provider('$urlRouter', $UrlRouterProvider);

/**
 * @ngdoc object
 * @name ui.router.state.$stateProvider
 *
 * @requires ui.router.router.$urlRouterProvider
 * @requires ui.router.util.$urlMatcherFactoryProvider
 *
 * @description
 * The new `$stateProvider` works similar to Angular's v1 router, but it focuses purely
 * on state.
 *
 * A state corresponds to a "place" in the application in terms of the overall UI and
 * navigation. A state describes (via the controller / template / view properties) what
 * the UI looks like and does at that place.
 *
 * States often have things in common, and the primary way of factoring out these
 * commonalities in this model is via the state hierarchy, i.e. parent/child states aka
 * nested states.
 *
 * The `$stateProvider` provides interfaces to declare these states for your app.
 */
$StateProvider.$inject = ['$urlRouterProvider', '$urlMatcherFactoryProvider'];
function $StateProvider(   $urlRouterProvider,   $urlMatcherFactory) {

  var root, states = {}, $state, queue = {}, abstractKey = 'abstract';

  // Builds state properties from definition passed to registerState()
  var stateBuilder = {

    // Derive parent state from a hierarchical name only if 'parent' is not explicitly defined.
    // state.children = [];
    // if (parent) parent.children.push(state);
    parent: function(state) {
      if (isDefined(state.parent) && state.parent) return findState(state.parent);
      // regex matches any valid composite state name
      // would match "contact.list" but not "contacts"
      var compositeName = /^(.+)\.[^.]+$/.exec(state.name);
      return compositeName ? findState(compositeName[1]) : root;
    },

    // inherit 'data' from parent and override by own values (if any)
    data: function(state) {
      if (state.parent && state.parent.data) {
        state.data = state.self.data = inherit(state.parent.data, state.data);
      }
      return state.data;
    },

    // Build a URLMatcher if necessary, either via a relative or absolute URL
    url: function(state) {
      var url = state.url, config = { params: state.params || {} };

      if (isString(url)) {
        if (url.charAt(0) == '^') return $urlMatcherFactory.compile(url.substring(1), config);
        return (state.parent.navigable || root).url.concat(url, config);
      }

      if (!url || $urlMatcherFactory.isMatcher(url)) return url;
      throw new Error("Invalid url '" + url + "' in state '" + state + "'");
    },

    // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
    navigable: function(state) {
      return state.url ? state : (state.parent ? state.parent.navigable : null);
    },

    // Own parameters for this state. state.url.params is already built at this point. Create and add non-url params
    ownParams: function(state) {
      var params = state.url && state.url.params || new $$UMFP.ParamSet();
      forEach(state.params || {}, function(config, id) {
        if (!params[id]) params[id] = new $$UMFP.Param(id, null, config, "config");
      });
      return params;
    },

    // Derive parameters for this state and ensure they're a super-set of parent's parameters
    params: function(state) {
      var ownParams = pick(state.ownParams, state.ownParams.$$keys());
      return state.parent && state.parent.params ? extend(state.parent.params.$$new(), ownParams) : new $$UMFP.ParamSet();
    },

    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    views: function(state) {
      var views = {};

      forEach(isDefined(state.views) ? state.views : { '': state }, function (view, name) {
        if (name.indexOf('@') < 0) name += '@' + state.parent.name;
        views[name] = view;
      });
      return views;
    },

    // Keep a full path from the root down to this state as this is needed for state activation.
    path: function(state) {
      return state.parent ? state.parent.path.concat(state) : []; // exclude root from path
    },

    // Speed up $state.contains() as it's used a lot
    includes: function(state) {
      var includes = state.parent ? extend({}, state.parent.includes) : {};
      includes[state.name] = true;
      return includes;
    },

    $delegates: {}
  };

  function isRelative(stateName) {
    return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
  }

  function findState(stateOrName, base) {
    if (!stateOrName) return undefined;

    var isStr = isString(stateOrName),
        name  = isStr ? stateOrName : stateOrName.name,
        path  = isRelative(name);

    if (path) {
      if (!base) throw new Error("No reference point given for path '"  + name + "'");
      base = findState(base);
      
      var rel = name.split("."), i = 0, pathLength = rel.length, current = base;

      for (; i < pathLength; i++) {
        if (rel[i] === "" && i === 0) {
          current = base;
          continue;
        }
        if (rel[i] === "^") {
          if (!current.parent) throw new Error("Path '" + name + "' not valid for state '" + base.name + "'");
          current = current.parent;
          continue;
        }
        break;
      }
      rel = rel.slice(i).join(".");
      name = current.name + (current.name && rel ? "." : "") + rel;
    }
    var state = states[name];

    if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
      return state;
    }
    return undefined;
  }

  function queueState(parentName, state) {
    if (!queue[parentName]) {
      queue[parentName] = [];
    }
    queue[parentName].push(state);
  }

  function flushQueuedChildren(parentName) {
    var queued = queue[parentName] || [];
    while(queued.length) {
      registerState(queued.shift());
    }
  }

  function registerState(state) {
    // Wrap a new object around the state so we can store our private details easily.
    state = inherit(state, {
      self: state,
      resolve: state.resolve || {},
      toString: function() { return this.name; }
    });

    var name = state.name;
    if (!isString(name) || name.indexOf('@') >= 0) throw new Error("State must have a valid name");
    if (states.hasOwnProperty(name)) throw new Error("State '" + name + "' is already defined");

    // Get parent name
    var parentName = (name.indexOf('.') !== -1) ? name.substring(0, name.lastIndexOf('.'))
        : (isString(state.parent)) ? state.parent
        : (isObject(state.parent) && isString(state.parent.name)) ? state.parent.name
        : '';

    // If parent is not registered yet, add state to queue and register later
    if (parentName && !states[parentName]) {
      return queueState(parentName, state.self);
    }

    for (var key in stateBuilder) {
      if (isFunction(stateBuilder[key])) state[key] = stateBuilder[key](state, stateBuilder.$delegates[key]);
    }
    states[name] = state;

    // Register the state in the global state list and with $urlRouter if necessary.
    if (!state[abstractKey] && state.url) {
      $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
        if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
          $state.transitionTo(state, $match, { inherit: true, location: false });
        }
      }]);
    }

    // Register any queued children
    flushQueuedChildren(name);

    return state;
  }

  // Checks text to see if it looks like a glob.
  function isGlob (text) {
    return text.indexOf('*') > -1;
  }

  // Returns true if glob matches current $state name.
  function doesStateMatchGlob (glob) {
    var globSegments = glob.split('.'),
        segments = $state.$current.name.split('.');

    //match single stars
    for (var i = 0, l = globSegments.length; i < l; i++) {
      if (globSegments[i] === '*') {
        segments[i] = '*';
      }
    }

    //match greedy starts
    if (globSegments[0] === '**') {
       segments = segments.slice(indexOf(segments, globSegments[1]));
       segments.unshift('**');
    }
    //match greedy ends
    if (globSegments[globSegments.length - 1] === '**') {
       segments.splice(indexOf(segments, globSegments[globSegments.length - 2]) + 1, Number.MAX_VALUE);
       segments.push('**');
    }

    if (globSegments.length != segments.length) {
      return false;
    }

    return segments.join('') === globSegments.join('');
  }


  // Implicit root state that is always active
  root = registerState({
    name: '',
    url: '^',
    views: null,
    'abstract': true
  });
  root.navigable = null;


  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#decorator
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Allows you to extend (carefully) or override (at your own peril) the 
   * `stateBuilder` object used internally by `$stateProvider`. This can be used 
   * to add custom functionality to ui-router, for example inferring templateUrl 
   * based on the state name.
   *
   * When passing only a name, it returns the current (original or decorated) builder
   * function that matches `name`.
   *
   * The builder functions that can be decorated are listed below. Though not all
   * necessarily have a good use case for decoration, that is up to you to decide.
   *
   * In addition, users can attach custom decorators, which will generate new 
   * properties within the state's internal definition. There is currently no clear 
   * use-case for this beyond accessing internal states (i.e. $state.$current), 
   * however, expect this to become increasingly relevant as we introduce additional 
   * meta-programming features.
   *
   * **Warning**: Decorators should not be interdependent because the order of 
   * execution of the builder functions in non-deterministic. Builder functions 
   * should only be dependent on the state definition object and super function.
   *
   *
   * Existing builder functions and current return values:
   *
   * - **parent** `{object}` - returns the parent state object.
   * - **data** `{object}` - returns state data, including any inherited data that is not
   *   overridden by own values (if any).
   * - **url** `{object}` - returns a {@link ui.router.util.type:UrlMatcher UrlMatcher}
   *   or `null`.
   * - **navigable** `{object}` - returns closest ancestor state that has a URL (aka is 
   *   navigable).
   * - **params** `{object}` - returns an array of state params that are ensured to 
   *   be a super-set of parent's params.
   * - **views** `{object}` - returns a views object where each key is an absolute view 
   *   name (i.e. "viewName@stateName") and each value is the config object 
   *   (template, controller) for the view. Even when you don't use the views object 
   *   explicitly on a state config, one is still created for you internally.
   *   So by decorating this builder function you have access to decorating template 
   *   and controller properties.
   * - **ownParams** `{object}` - returns an array of params that belong to the state, 
   *   not including any params defined by ancestor states.
   * - **path** `{string}` - returns the full path from the root down to this state. 
   *   Needed for state activation.
   * - **includes** `{object}` - returns an object that includes every state that 
   *   would pass a `$state.includes()` test.
   *
   * @example
   * <pre>
   * // Override the internal 'views' builder with a function that takes the state
   * // definition, and a reference to the internal function being overridden:
   * $stateProvider.decorator('views', function (state, parent) {
   *   var result = {},
   *       views = parent(state);
   *
   *   angular.forEach(views, function (config, name) {
   *     var autoName = (state.name + '.' + name).replace('.', '/');
   *     config.templateUrl = config.templateUrl || '/partials/' + autoName + '.html';
   *     result[name] = config;
   *   });
   *   return result;
   * });
   *
   * $stateProvider.state('home', {
   *   views: {
   *     'contact.list': { controller: 'ListController' },
   *     'contact.item': { controller: 'ItemController' }
   *   }
   * });
   *
   * // ...
   *
   * $state.go('home');
   * // Auto-populates list and item views with /partials/home/contact/list.html,
   * // and /partials/home/contact/item.html, respectively.
   * </pre>
   *
   * @param {string} name The name of the builder function to decorate. 
   * @param {object} func A function that is responsible for decorating the original 
   * builder function. The function receives two parameters:
   *
   *   - `{object}` - state - The state config object.
   *   - `{object}` - super - The original builder function.
   *
   * @return {object} $stateProvider - $stateProvider instance
   */
  this.decorator = decorator;
  function decorator(name, func) {
    /*jshint validthis: true */
    if (isString(name) && !isDefined(func)) {
      return stateBuilder[name];
    }
    if (!isFunction(func) || !isString(name)) {
      return this;
    }
    if (stateBuilder[name] && !stateBuilder.$delegates[name]) {
      stateBuilder.$delegates[name] = stateBuilder[name];
    }
    stateBuilder[name] = func;
    return this;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#state
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Registers a state configuration under a given state name. The stateConfig object
   * has the following acceptable properties.
   *
   * @param {string} name A unique state name, e.g. "home", "about", "contacts".
   * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
   * @param {object} stateConfig State configuration object.
   * @param {string|function=} stateConfig.template
   * <a id='template'></a>
   *   html template as a string or a function that returns
   *   an html template as a string which should be used by the uiView directives. This property 
   *   takes precedence over templateUrl.
   *   
   *   If `template` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
   *     applying the current state
   *
   * <pre>template:
   *   "<h1>inline template definition</h1>" +
   *   "<div ui-view></div>"</pre>
   * <pre>template: function(params) {
   *       return "<h1>generated template</h1>"; }</pre>
   * </div>
   *
   * @param {string|function=} stateConfig.templateUrl
   * <a id='templateUrl'></a>
   *
   *   path or function that returns a path to an html
   *   template that should be used by uiView.
   *   
   *   If `templateUrl` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by 
   *     applying the current state
   *
   * <pre>templateUrl: "home.html"</pre>
   * <pre>templateUrl: function(params) {
   *     return myTemplates[params.pageId]; }</pre>
   *
   * @param {function=} stateConfig.templateProvider
   * <a id='templateProvider'></a>
   *    Provider function that returns HTML content string.
   * <pre> templateProvider:
   *       function(MyTemplateService, params) {
   *         return MyTemplateService.getTemplate(params.pageId);
   *       }</pre>
   *
   * @param {string|function=} stateConfig.controller
   * <a id='controller'></a>
   *
   *  Controller fn that should be associated with newly
   *   related scope or the name of a registered controller if passed as a string.
   *   Optionally, the ControllerAs may be declared here.
   * <pre>controller: "MyRegisteredController"</pre>
   * <pre>controller:
   *     "MyRegisteredController as fooCtrl"}</pre>
   * <pre>controller: function($scope, MyService) {
   *     $scope.data = MyService.getData(); }</pre>
   *
   * @param {function=} stateConfig.controllerProvider
   * <a id='controllerProvider'></a>
   *
   * Injectable provider function that returns the actual controller or string.
   * <pre>controllerProvider:
   *   function(MyResolveData) {
   *     if (MyResolveData.foo)
   *       return "FooCtrl"
   *     else if (MyResolveData.bar)
   *       return "BarCtrl";
   *     else return function($scope) {
   *       $scope.baz = "Qux";
   *     }
   *   }</pre>
   *
   * @param {string=} stateConfig.controllerAs
   * <a id='controllerAs'></a>
   * 
   * A controller alias name. If present the controller will be
   *   published to scope under the controllerAs name.
   * <pre>controllerAs: "myCtrl"</pre>
   *
   * @param {string|object=} stateConfig.parent
   * <a id='parent'></a>
   * Optionally specifies the parent state of this state.
   *
   * <pre>parent: 'parentState'</pre>
   * <pre>parent: parentState // JS variable</pre>
   *
   * @param {object=} stateConfig.resolve
   * <a id='resolve'></a>
   *
   * An optional map&lt;string, function&gt; of dependencies which
   *   should be injected into the controller. If any of these dependencies are promises, 
   *   the router will wait for them all to be resolved before the controller is instantiated.
   *   If all the promises are resolved successfully, the $stateChangeSuccess event is fired
   *   and the values of the resolved promises are injected into any controllers that reference them.
   *   If any  of the promises are rejected the $stateChangeError event is fired.
   *
   *   The map object is:
   *   
   *   - key - {string}: name of dependency to be injected into controller
   *   - factory - {string|function}: If string then it is alias for service. Otherwise if function, 
   *     it is injected and return value it treated as dependency. If result is a promise, it is 
   *     resolved before its value is injected into controller.
   *
   * <pre>resolve: {
   *     myResolve1:
   *       function($http, $stateParams) {
   *         return $http.get("/api/foos/"+stateParams.fooID);
   *       }
   *     }</pre>
   *
   * @param {string=} stateConfig.url
   * <a id='url'></a>
   *
   *   A url fragment with optional parameters. When a state is navigated or
   *   transitioned to, the `$stateParams` service will be populated with any 
   *   parameters that were passed.
   *
   *   (See {@link ui.router.util.type:UrlMatcher UrlMatcher} `UrlMatcher`} for
   *   more details on acceptable patterns )
   *
   * examples:
   * <pre>url: "/home"
   * url: "/users/:userid"
   * url: "/books/{bookid:[a-zA-Z_-]}"
   * url: "/books/{categoryid:int}"
   * url: "/books/{publishername:string}/{categoryid:int}"
   * url: "/messages?before&after"
   * url: "/messages?{before:date}&{after:date}"
   * url: "/messages/:mailboxid?{before:date}&{after:date}"
   * </pre>
   *
   * @param {object=} stateConfig.views
   * <a id='views'></a>
   * an optional map&lt;string, object&gt; which defined multiple views, or targets views
   * manually/explicitly.
   *
   * Examples:
   *
   * Targets three named `ui-view`s in the parent state's template
   * <pre>views: {
   *     header: {
   *       controller: "headerCtrl",
   *       templateUrl: "header.html"
   *     }, body: {
   *       controller: "bodyCtrl",
   *       templateUrl: "body.html"
   *     }, footer: {
   *       controller: "footCtrl",
   *       templateUrl: "footer.html"
   *     }
   *   }</pre>
   *
   * Targets named `ui-view="header"` from grandparent state 'top''s template, and named `ui-view="body" from parent state's template.
   * <pre>views: {
   *     'header@top': {
   *       controller: "msgHeaderCtrl",
   *       templateUrl: "msgHeader.html"
   *     }, 'body': {
   *       controller: "messagesCtrl",
   *       templateUrl: "messages.html"
   *     }
   *   }</pre>
   *
   * @param {boolean=} [stateConfig.abstract=false]
   * <a id='abstract'></a>
   * An abstract state will never be directly activated,
   *   but can provide inherited properties to its common children states.
   * <pre>abstract: true</pre>
   *
   * @param {function=} stateConfig.onEnter
   * <a id='onEnter'></a>
   *
   * Callback function for when a state is entered. Good way
   *   to trigger an action or dispatch an event, such as opening a dialog.
   * If minifying your scripts, make sure to explicitly annotate this function,
   * because it won't be automatically annotated by your build tools.
   *
   * <pre>onEnter: function(MyService, $stateParams) {
   *     MyService.foo($stateParams.myParam);
   * }</pre>
   *
   * @param {function=} stateConfig.onExit
   * <a id='onExit'></a>
   *
   * Callback function for when a state is exited. Good way to
   *   trigger an action or dispatch an event, such as opening a dialog.
   * If minifying your scripts, make sure to explicitly annotate this function,
   * because it won't be automatically annotated by your build tools.
   *
   * <pre>onExit: function(MyService, $stateParams) {
   *     MyService.cleanup($stateParams.myParam);
   * }</pre>
   *
   * @param {boolean=} [stateConfig.reloadOnSearch=true]
   * <a id='reloadOnSearch'></a>
   *
   * If `false`, will not retrigger the same state
   *   just because a search/query parameter has changed (via $location.search() or $location.hash()). 
   *   Useful for when you'd like to modify $location.search() without triggering a reload.
   * <pre>reloadOnSearch: false</pre>
   *
   * @param {object=} stateConfig.data
   * <a id='data'></a>
   *
   * Arbitrary data object, useful for custom configuration.  The parent state's `data` is
   *   prototypally inherited.  In other words, adding a data property to a state adds it to
   *   the entire subtree via prototypal inheritance.
   *
   * <pre>data: {
   *     requiredRole: 'foo'
   * } </pre>
   *
   * @param {object=} stateConfig.params
   * <a id='params'></a>
   *
   * A map which optionally configures parameters declared in the `url`, or
   *   defines additional non-url parameters.  For each parameter being
   *   configured, add a configuration object keyed to the name of the parameter.
   *
   *   Each parameter configuration object may contain the following properties:
   *
   *   - ** value ** - {object|function=}: specifies the default value for this
   *     parameter.  This implicitly sets this parameter as optional.
   *
   *     When UI-Router routes to a state and no value is
   *     specified for this parameter in the URL or transition, the
   *     default value will be used instead.  If `value` is a function,
   *     it will be injected and invoked, and the return value used.
   *
   *     *Note*: `undefined` is treated as "no default value" while `null`
   *     is treated as "the default value is `null`".
   *
   *     *Shorthand*: If you only need to configure the default value of the
   *     parameter, you may use a shorthand syntax.   In the **`params`**
   *     map, instead mapping the param name to a full parameter configuration
   *     object, simply set map it to the default parameter value, e.g.:
   *
   * <pre>// define a parameter's default value
   * params: {
   *     param1: { value: "defaultValue" }
   * }
   * // shorthand default values
   * params: {
   *     param1: "defaultValue",
   *     param2: "param2Default"
   * }</pre>
   *
   *   - ** array ** - {boolean=}: *(default: false)* If true, the param value will be
   *     treated as an array of values.  If you specified a Type, the value will be
   *     treated as an array of the specified Type.  Note: query parameter values
   *     default to a special `"auto"` mode.
   *
   *     For query parameters in `"auto"` mode, if multiple  values for a single parameter
   *     are present in the URL (e.g.: `/foo?bar=1&bar=2&bar=3`) then the values
   *     are mapped to an array (e.g.: `{ foo: [ '1', '2', '3' ] }`).  However, if
   *     only one value is present (e.g.: `/foo?bar=1`) then the value is treated as single
   *     value (e.g.: `{ foo: '1' }`).
   *
   * <pre>params: {
   *     param1: { array: true }
   * }</pre>
   *
   *   - ** squash ** - {bool|string=}: `squash` configures how a default parameter value is represented in the URL when
   *     the current parameter value is the same as the default value. If `squash` is not set, it uses the
   *     configured default squash policy.
   *     (See {@link ui.router.util.$urlMatcherFactory#methods_defaultSquashPolicy `defaultSquashPolicy()`})
   *
   *   There are three squash settings:
   *
   *     - false: The parameter's default value is not squashed.  It is encoded and included in the URL
   *     - true: The parameter's default value is omitted from the URL.  If the parameter is preceeded and followed
   *       by slashes in the state's `url` declaration, then one of those slashes are omitted.
   *       This can allow for cleaner looking URLs.
   *     - `"<arbitrary string>"`: The parameter's default value is replaced with an arbitrary placeholder of  your choice.
   *
   * <pre>params: {
   *     param1: {
   *       value: "defaultId",
   *       squash: true
   * } }
   * // squash "defaultValue" to "~"
   * params: {
   *     param1: {
   *       value: "defaultValue",
   *       squash: "~"
   * } }
   * </pre>
   *
   *
   * @example
   * <pre>
   * // Some state name examples
   *
   * // stateName can be a single top-level name (must be unique).
   * $stateProvider.state("home", {});
   *
   * // Or it can be a nested state name. This state is a child of the
   * // above "home" state.
   * $stateProvider.state("home.newest", {});
   *
   * // Nest states as deeply as needed.
   * $stateProvider.state("home.newest.abc.xyz.inception", {});
   *
   * // state() returns $stateProvider, so you can chain state declarations.
   * $stateProvider
   *   .state("home", {})
   *   .state("about", {})
   *   .state("contacts", {});
   * </pre>
   *
   */
  this.state = state;
  function state(name, definition) {
    /*jshint validthis: true */
    if (isObject(name)) definition = name;
    else definition.name = name;
    registerState(definition);
    return this;
  }

  /**
   * @ngdoc object
   * @name ui.router.state.$state
   *
   * @requires $rootScope
   * @requires $q
   * @requires ui.router.state.$view
   * @requires $injector
   * @requires ui.router.util.$resolve
   * @requires ui.router.state.$stateParams
   * @requires ui.router.router.$urlRouter
   *
   * @property {object} params A param object, e.g. {sectionId: section.id)}, that 
   * you'd like to test against the current active state.
   * @property {object} current A reference to the state's config object. However 
   * you passed it in. Useful for accessing custom data.
   * @property {object} transition Currently pending transition. A promise that'll 
   * resolve or reject.
   *
   * @description
   * `$state` service is responsible for representing states as well as transitioning
   * between them. It also provides interfaces to ask for current state or even states
   * you're coming from.
   */
  this.$get = $get;
  $get.$inject = ['$rootScope', '$q', '$view', '$injector', '$resolve', '$stateParams', '$urlRouter', '$location', '$urlMatcherFactory'];
  function $get(   $rootScope,   $q,   $view,   $injector,   $resolve,   $stateParams,   $urlRouter,   $location,   $urlMatcherFactory) {

    var TransitionSuperseded = $q.reject(new Error('transition superseded'));
    var TransitionPrevented = $q.reject(new Error('transition prevented'));
    var TransitionAborted = $q.reject(new Error('transition aborted'));
    var TransitionFailed = $q.reject(new Error('transition failed'));

    // Handles the case where a state which is the target of a transition is not found, and the user
    // can optionally retry or defer the transition
    function handleRedirect(redirect, state, params, options) {
      /**
       * @ngdoc event
       * @name ui.router.state.$state#$stateNotFound
       * @eventOf ui.router.state.$state
       * @eventType broadcast on root scope
       * @description
       * Fired when a requested state **cannot be found** using the provided state name during transition.
       * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
       * lazy-loading the unfound state). A special `unfoundState` object is passed to the listener handler,
       * you can see its three properties in the example. You can use `event.preventDefault()` to abort the
       * transition and the promise returned from `go` will be rejected with a `'transition aborted'` value.
       *
       * @param {Object} event Event object.
       * @param {Object} unfoundState Unfound State information. Contains: `to, toParams, options` properties.
       * @param {State} fromState Current state object.
       * @param {Object} fromParams Current state params.
       *
       * @example
       *
       * <pre>
       * // somewhere, assume lazy.state has not been defined
       * $state.go("lazy.state", {a:1, b:2}, {inherit:false});
       *
       * // somewhere else
       * $scope.$on('$stateNotFound',
       * function(event, unfoundState, fromState, fromParams){
       *     console.log(unfoundState.to); // "lazy.state"
       *     console.log(unfoundState.toParams); // {a:1, b:2}
       *     console.log(unfoundState.options); // {inherit:false} + default options
       * })
       * </pre>
       */
      var evt = $rootScope.$broadcast('$stateNotFound', redirect, state, params);

      if (evt.defaultPrevented) {
        $urlRouter.update();
        return TransitionAborted;
      }

      if (!evt.retry) {
        return null;
      }

      // Allow the handler to return a promise to defer state lookup retry
      if (options.$retry) {
        $urlRouter.update();
        return TransitionFailed;
      }
      var retryTransition = $state.transition = $q.when(evt.retry);

      retryTransition.then(function() {
        if (retryTransition !== $state.transition) return TransitionSuperseded;
        redirect.options.$retry = true;
        return $state.transitionTo(redirect.to, redirect.toParams, redirect.options);
      }, function() {
        return TransitionAborted;
      });
      $urlRouter.update();

      return retryTransition;
    }

    root.locals = { resolve: null, globals: { $stateParams: {} } };

    $state = {
      params: {},
      current: root.self,
      $current: root,
      transition: null
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#reload
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method that force reloads the current state. All resolves are re-resolved,
     * controllers reinstantiated, and events re-fired.
     *
     * @example
     * <pre>
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     $state.reload();
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, { 
     *   reload: true, inherit: false, notify: true
     * });
     * </pre>
     *
     * @param {string=|object=} state - A state name or a state object, which is the root of the resolves to be re-resolved.
     * @example
     * <pre>
     * //assuming app application consists of 3 states: 'contacts', 'contacts.detail', 'contacts.detail.item' 
     * //and current state is 'contacts.detail.item'
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     //will reload 'contact.detail' and 'contact.detail.item' states
     *     $state.reload('contact.detail');
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, { 
     *   reload: true, inherit: false, notify: true
     * });
     * </pre>

     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.reload = function reload(state) {
      return $state.transitionTo($state.current, $stateParams, { reload: state || true, inherit: false, notify: true});
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#go
     * @methodOf ui.router.state.$state
     *
     * @description
     * Convenience method for transitioning to a new state. `$state.go` calls 
     * `$state.transitionTo` internally but automatically sets options to 
     * `{ location: true, inherit: true, relative: $state.$current, notify: true }`. 
     * This allows you to easily use an absolute or relative to path and specify 
     * only the parameters you'd like to update (while letting unspecified parameters 
     * inherit from the currently active ancestor states).
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.go('contact.detail');
     *   };
     * });
     * </pre>
     * <img src='../ngdoc_assets/StateGoExamples.png'/>
     *
     * @param {string} to Absolute state name or relative state path. Some examples:
     *
     * - `$state.go('contact.detail')` - will go to the `contact.detail` state
     * - `$state.go('^')` - will go to a parent state
     * - `$state.go('^.sibling')` - will go to a sibling state
     * - `$state.go('.child.grandchild')` - will go to grandchild state
     *
     * @param {object=} params A map of the parameters that will be sent to the state, 
     * will populate $stateParams. Any parameters that are not specified will be inherited from currently 
     * defined parameters. Only parameters specified in the state definition can be overridden, new 
     * parameters will be ignored. This allows, for example, going to a sibling state that shares parameters
     * specified in a parent state. Parameter inheritance only works between common ancestor states, I.e.
     * transitioning to a sibling will get you the parameters for all parents, transitioning to a child
     * will get you all current parameters, etc.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false|string|object}, If `true` will force transition even if no state or params
     *    have changed.  It will reload the resolves and views of the current state and parent states.
     *    If `reload` is a string (or state object), the state object is fetched (by name, or object reference); and \
     *    the transition reloads the resolves and views for that matched state, and all its children states.
     *
     * @returns {promise} A promise representing the state of the new transition.
     *
     * Possible success values:
     *
     * - $state.current
     *
     * <br/>Possible rejection values:
     *
     * - 'transition superseded' - when a newer transition has been started after this one
     * - 'transition prevented' - when `event.preventDefault()` has been called in a `$stateChangeStart` listener
     * - 'transition aborted' - when `event.preventDefault()` has been called in a `$stateNotFound` listener or
     *   when a `$stateNotFound` `event.retry` promise errors.
     * - 'transition failed' - when a state has been unsuccessfully found after 2 tries.
     * - *resolve error* - when an error has occurred with a `resolve`
     *
     */
    $state.go = function go(to, params, options) {
      return $state.transitionTo(to, params, extend({ inherit: true, relative: $state.$current }, options));
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#transitionTo
     * @methodOf ui.router.state.$state
     *
     * @description
     * Low-level method for transitioning to a new state. {@link ui.router.state.$state#methods_go $state.go}
     * uses `transitionTo` internally. `$state.go` is recommended in most situations.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.transitionTo('contact.detail');
     *   };
     * });
     * </pre>
     *
     * @param {string} to State name.
     * @param {object=} toParams A map of the parameters that will be sent to the state,
     * will populate $stateParams.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false|string=|object=}, If `true` will force transition even if the state or params 
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *    if String, then will reload the state with the name given in reload, and any children.
     *    if Object, then a stateObj is expected, will reload the state found in stateObj, and any children.
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.transitionTo = function transitionTo(to, toParams, options) {
      toParams = toParams || {};
      options = extend({
        location: true, inherit: false, relative: null, notify: true, reload: false, $retry: false
      }, options || {});

      var from = $state.$current, fromParams = $state.params, fromPath = from.path;
      var evt, toState = findState(to, options.relative);

      // Store the hash param for later (since it will be stripped out by various methods)
      var hash = toParams['#'];

      if (!isDefined(toState)) {
        var redirect = { to: to, toParams: toParams, options: options };
        var redirectResult = handleRedirect(redirect, from.self, fromParams, options);

        if (redirectResult) {
          return redirectResult;
        }

        // Always retry once if the $stateNotFound was not prevented
        // (handles either redirect changed or state lazy-definition)
        to = redirect.to;
        toParams = redirect.toParams;
        options = redirect.options;
        toState = findState(to, options.relative);

        if (!isDefined(toState)) {
          if (!options.relative) throw new Error("No such state '" + to + "'");
          throw new Error("Could not resolve '" + to + "' from state '" + options.relative + "'");
        }
      }
      if (toState[abstractKey]) throw new Error("Cannot transition to abstract state '" + to + "'");
      if (options.inherit) toParams = inheritParams($stateParams, toParams || {}, $state.$current, toState);
      if (!toState.params.$$validates(toParams)) return TransitionFailed;

      toParams = toState.params.$$values(toParams);
      to = toState;

      var toPath = to.path;

      // Starting from the root of the path, keep all levels that haven't changed
      var keep = 0, state = toPath[keep], locals = root.locals, toLocals = [];

      if (!options.reload) {
        while (state && state === fromPath[keep] && state.ownParams.$$equals(toParams, fromParams)) {
          locals = toLocals[keep] = state.locals;
          keep++;
          state = toPath[keep];
        }
      } else if (isString(options.reload) || isObject(options.reload)) {
        if (isObject(options.reload) && !options.reload.name) {
          throw new Error('Invalid reload state object');
        }
        
        var reloadState = options.reload === true ? fromPath[0] : findState(options.reload);
        if (options.reload && !reloadState) {
          throw new Error("No such reload state '" + (isString(options.reload) ? options.reload : options.reload.name) + "'");
        }

        while (state && state === fromPath[keep] && state !== reloadState) {
          locals = toLocals[keep] = state.locals;
          keep++;
          state = toPath[keep];
        }
      }

      // If we're going to the same state and all locals are kept, we've got nothing to do.
      // But clear 'transition', as we still want to cancel any other pending transitions.
      // TODO: We may not want to bump 'transition' if we're called from a location change
      // that we've initiated ourselves, because we might accidentally abort a legitimate
      // transition initiated from code?
      if (shouldSkipReload(to, toParams, from, fromParams, locals, options)) {
        if (hash) toParams['#'] = hash;
        $state.params = toParams;
        copy($state.params, $stateParams);
        copy(filterByKeys(to.params.$$keys(), $stateParams), to.locals.globals.$stateParams);
        if (options.location && to.navigable && to.navigable.url) {
          $urlRouter.push(to.navigable.url, toParams, {
            $$avoidResync: true, replace: options.location === 'replace'
          });
          $urlRouter.update(true);
        }
        $state.transition = null;
        return $q.when($state.current);
      }

      // Filter parameters before we pass them to event handlers etc.
      toParams = filterByKeys(to.params.$$keys(), toParams || {});
      
      // Re-add the saved hash before we start returning things or broadcasting $stateChangeStart
      if (hash) toParams['#'] = hash;
      
      // Broadcast start event and cancel the transition if requested
      if (options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeStart
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when the state transition **begins**. You can use `event.preventDefault()`
         * to prevent the transition from happening and then the transition promise will be
         * rejected with a `'transition prevented'` value.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         *
         * @example
         *
         * <pre>
         * $rootScope.$on('$stateChangeStart',
         * function(event, toState, toParams, fromState, fromParams){
         *     event.preventDefault();
         *     // transitionTo() promise will be rejected with
         *     // a 'transition prevented' error
         * })
         * </pre>
         */
        if ($rootScope.$broadcast('$stateChangeStart', to.self, toParams, from.self, fromParams, options).defaultPrevented) {
          $rootScope.$broadcast('$stateChangeCancel', to.self, toParams, from.self, fromParams);
          //Don't update and resync url if there's been a new transition started. see issue #2238, #600
          if ($state.transition == null) $urlRouter.update();
          return TransitionPrevented;
        }
      }

      // Resolve locals for the remaining states, but don't update any global state just
      // yet -- if anything fails to resolve the current state needs to remain untouched.
      // We also set up an inheritance chain for the locals here. This allows the view directive
      // to quickly look up the correct definition for each view in the current state. Even
      // though we create the locals object itself outside resolveState(), it is initially
      // empty and gets filled asynchronously. We need to keep track of the promise for the
      // (fully resolved) current locals, and pass this down the chain.
      var resolved = $q.when(locals);

      for (var l = keep; l < toPath.length; l++, state = toPath[l]) {
        locals = toLocals[l] = inherit(locals);
        resolved = resolveState(state, toParams, state === to, resolved, locals, options);
      }

      // Once everything is resolved, we are ready to perform the actual transition
      // and return a promise for the new state. We also keep track of what the
      // current promise is, so that we can detect overlapping transitions and
      // keep only the outcome of the last transition.
      var transition = $state.transition = resolved.then(function () {
        var l, entering, exiting;

        if ($state.transition !== transition) return TransitionSuperseded;

        // Exit 'from' states not kept
        for (l = fromPath.length - 1; l >= keep; l--) {
          exiting = fromPath[l];
          if (exiting.self.onExit) {
            $injector.invoke(exiting.self.onExit, exiting.self, exiting.locals.globals);
          }
          exiting.locals = null;
        }

        // Enter 'to' states not kept
        for (l = keep; l < toPath.length; l++) {
          entering = toPath[l];
          entering.locals = toLocals[l];
          if (entering.self.onEnter) {
            $injector.invoke(entering.self.onEnter, entering.self, entering.locals.globals);
          }
        }

        // Run it again, to catch any transitions in callbacks
        if ($state.transition !== transition) return TransitionSuperseded;

        // Update globals in $state
        $state.$current = to;
        $state.current = to.self;
        $state.params = toParams;
        copy($state.params, $stateParams);
        $state.transition = null;

        if (options.location && to.navigable) {
          $urlRouter.push(to.navigable.url, to.navigable.locals.globals.$stateParams, {
            $$avoidResync: true, replace: options.location === 'replace'
          });
        }

        if (options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeSuccess
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired once the state transition is **complete**.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         */
          $rootScope.$broadcast('$stateChangeSuccess', to.self, toParams, from.self, fromParams);
        }
        $urlRouter.update(true);

        return $state.current;
      }, function (error) {
        if ($state.transition !== transition) return TransitionSuperseded;

        $state.transition = null;
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeError
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when an **error occurs** during transition. It's important to note that if you
         * have any errors in your resolve functions (javascript errors, non-existent services, etc)
         * they will not throw traditionally. You must listen for this $stateChangeError event to
         * catch **ALL** errors.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         * @param {Error} error The resolve error object.
         */
        evt = $rootScope.$broadcast('$stateChangeError', to.self, toParams, from.self, fromParams, error);

        if (!evt.defaultPrevented) {
            $urlRouter.update();
        }

        return $q.reject(error);
      });

      return transition;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#is
     * @methodOf ui.router.state.$state
     *
     * @description
     * Similar to {@link ui.router.state.$state#methods_includes $state.includes},
     * but only checks for the full state name. If params is supplied then it will be
     * tested for strict equality against the current active params object, so all params
     * must match with none missing and no extras.
     *
     * @example
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // absolute name
     * $state.is('contact.details.item'); // returns true
     * $state.is(contactDetailItemStateObject); // returns true
     *
     * // relative name (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.is('.item')}">Item</div>
     * </pre>
     *
     * @param {string|object} stateOrName The state name (absolute or relative) or state object you'd like to check.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like
     * to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object} -  If `stateOrName` is a relative state name and `options.relative` is set, .is will
     * test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it is the state.
     */
    $state.is = function is(stateOrName, params, options) {
      options = extend({ relative: $state.$current }, options || {});
      var state = findState(stateOrName, options.relative);

      if (!isDefined(state)) { return undefined; }
      if ($state.$current !== state) { return false; }
      return params ? equalForKeys(state.params.$$values(params), $stateParams) : true;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#includes
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method to determine if the current active state is equal to or is the child of the
     * state stateName. If any params are passed then they will be tested for a match as well.
     * Not all the parameters need to be passed, just the ones you'd like to test for equality.
     *
     * @example
     * Partial and relative names
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // Using partial names
     * $state.includes("contacts"); // returns true
     * $state.includes("contacts.details"); // returns true
     * $state.includes("contacts.details.item"); // returns true
     * $state.includes("contacts.list"); // returns false
     * $state.includes("about"); // returns false
     *
     * // Using relative names (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.includes('.item')}">Item</div>
     * </pre>
     *
     * Basic globbing patterns
     * <pre>
     * $state.$current.name = 'contacts.details.item.url';
     *
     * $state.includes("*.details.*.*"); // returns true
     * $state.includes("*.details.**"); // returns true
     * $state.includes("**.item.**"); // returns true
     * $state.includes("*.details.item.url"); // returns true
     * $state.includes("*.details.*.url"); // returns true
     * $state.includes("*.details.*"); // returns false
     * $state.includes("item.**"); // returns false
     * </pre>
     *
     * @param {string} stateOrName A partial name, relative name, or glob pattern
     * to be searched for within the current state name.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`,
     * that you'd like to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object=} -  If `stateOrName` is a relative state reference and `options.relative` is set,
     * .includes will test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it does include the state
     */
    $state.includes = function includes(stateOrName, params, options) {
      options = extend({ relative: $state.$current }, options || {});
      if (isString(stateOrName) && isGlob(stateOrName)) {
        if (!doesStateMatchGlob(stateOrName)) {
          return false;
        }
        stateOrName = $state.$current.name;
      }

      var state = findState(stateOrName, options.relative);
      if (!isDefined(state)) { return undefined; }
      if (!isDefined($state.$current.includes[state.name])) { return false; }
      return params ? equalForKeys(state.params.$$values(params), $stateParams, objectKeys(params)) : true;
    };


    /**
     * @ngdoc function
     * @name ui.router.state.$state#href
     * @methodOf ui.router.state.$state
     *
     * @description
     * A url generation method that returns the compiled url for the given state populated with the given params.
     *
     * @example
     * <pre>
     * expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
     * </pre>
     *
     * @param {string|object} stateOrName The state name or state object you'd like to generate a url from.
     * @param {object=} params An object of parameter values to fill the state's required parameters.
     * @param {object=} options Options object. The options are:
     *
     * - **`lossy`** - {boolean=true} -  If true, and if there is no url associated with the state provided in the
     *    first parameter, then the constructed href url will be built from the first navigable ancestor (aka
     *    ancestor with a valid url).
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
     * 
     * @returns {string} compiled state url
     */
    $state.href = function href(stateOrName, params, options) {
      options = extend({
        lossy:    true,
        inherit:  true,
        absolute: false,
        relative: $state.$current
      }, options || {});

      var state = findState(stateOrName, options.relative);

      if (!isDefined(state)) return null;
      if (options.inherit) params = inheritParams($stateParams, params || {}, $state.$current, state);
      
      var nav = (state && options.lossy) ? state.navigable : state;

      if (!nav || nav.url === undefined || nav.url === null) {
        return null;
      }
      return $urlRouter.href(nav.url, filterByKeys(state.params.$$keys().concat('#'), params || {}), {
        absolute: options.absolute
      });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#get
     * @methodOf ui.router.state.$state
     *
     * @description
     * Returns the state configuration object for any specific state or all states.
     *
     * @param {string|object=} stateOrName (absolute or relative) If provided, will only get the config for
     * the requested state. If not provided, returns an array of ALL state configs.
     * @param {string|object=} context When stateOrName is a relative state reference, the state will be retrieved relative to context.
     * @returns {Object|Array} State configuration object or array of all objects.
     */
    $state.get = function (stateOrName, context) {
      if (arguments.length === 0) return map(objectKeys(states), function(name) { return states[name].self; });
      var state = findState(stateOrName, context || $state.$current);
      return (state && state.self) ? state.self : null;
    };

    function resolveState(state, params, paramsAreFiltered, inherited, dst, options) {
      // Make a restricted $stateParams with only the parameters that apply to this state if
      // necessary. In addition to being available to the controller and onEnter/onExit callbacks,
      // we also need $stateParams to be available for any $injector calls we make during the
      // dependency resolution process.
      var $stateParams = (paramsAreFiltered) ? params : filterByKeys(state.params.$$keys(), params);
      var locals = { $stateParams: $stateParams };

      // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
      // We're also including $stateParams in this; that way the parameters are restricted
      // to the set that should be visible to the state, and are independent of when we update
      // the global $state and $stateParams values.
      dst.resolve = $resolve.resolve(state.resolve, locals, dst.resolve, state);
      var promises = [dst.resolve.then(function (globals) {
        dst.globals = globals;
      })];
      if (inherited) promises.push(inherited);

      function resolveViews() {
        var viewsPromises = [];

        // Resolve template and dependencies for all views.
        forEach(state.views, function (view, name) {
          var injectables = (view.resolve && view.resolve !== state.resolve ? view.resolve : {});
          injectables.$template = [ function () {
            return $view.load(name, { view: view, locals: dst.globals, params: $stateParams, notify: options.notify }) || '';
          }];

          viewsPromises.push($resolve.resolve(injectables, dst.globals, dst.resolve, state).then(function (result) {
            // References to the controller (only instantiated at link time)
            if (isFunction(view.controllerProvider) || isArray(view.controllerProvider)) {
              var injectLocals = angular.extend({}, injectables, dst.globals);
              result.$$controller = $injector.invoke(view.controllerProvider, null, injectLocals);
            } else {
              result.$$controller = view.controller;
            }
            // Provide access to the state itself for internal use
            result.$$state = state;
            result.$$controllerAs = view.controllerAs;
            dst[name] = result;
          }));
        });

        return $q.all(viewsPromises).then(function(){
          return dst.globals;
        });
      }

      // Wait for all the promises and then return the activation object
      return $q.all(promises).then(resolveViews).then(function (values) {
        return dst;
      });
    }

    return $state;
  }

  function shouldSkipReload(to, toParams, from, fromParams, locals, options) {
    // Return true if there are no differences in non-search (path/object) params, false if there are differences
    function nonSearchParamsEqual(fromAndToState, fromParams, toParams) {
      // Identify whether all the parameters that differ between `fromParams` and `toParams` were search params.
      function notSearchParam(key) {
        return fromAndToState.params[key].location != "search";
      }
      var nonQueryParamKeys = fromAndToState.params.$$keys().filter(notSearchParam);
      var nonQueryParams = pick.apply({}, [fromAndToState.params].concat(nonQueryParamKeys));
      var nonQueryParamSet = new $$UMFP.ParamSet(nonQueryParams);
      return nonQueryParamSet.$$equals(fromParams, toParams);
    }

    // If reload was not explicitly requested
    // and we're transitioning to the same state we're already in
    // and    the locals didn't change
    //     or they changed in a way that doesn't merit reloading
    //        (reloadOnParams:false, or reloadOnSearch.false and only search params changed)
    // Then return true.
    if (!options.reload && to === from &&
      (locals === from.locals || (to.self.reloadOnSearch === false && nonSearchParamsEqual(from, fromParams, toParams)))) {
      return true;
    }
  }
}

angular.module('ui.router.state')
  .factory('$stateParams', function () { return {}; })
  .provider('$state', $StateProvider);


$ViewProvider.$inject = [];
function $ViewProvider() {

  this.$get = $get;
  /**
   * @ngdoc object
   * @name ui.router.state.$view
   *
   * @requires ui.router.util.$templateFactory
   * @requires $rootScope
   *
   * @description
   *
   */
  $get.$inject = ['$rootScope', '$templateFactory'];
  function $get(   $rootScope,   $templateFactory) {
    return {
      // $view.load('full.viewName', { template: ..., controller: ..., resolve: ..., async: false, params: ... })
      /**
       * @ngdoc function
       * @name ui.router.state.$view#load
       * @methodOf ui.router.state.$view
       *
       * @description
       *
       * @param {string} name name
       * @param {object} options option object.
       */
      load: function load(name, options) {
        var result, defaults = {
          template: null, controller: null, view: null, locals: null, notify: true, async: true, params: {}
        };
        options = extend(defaults, options);

        if (options.view) {
          result = $templateFactory.fromConfig(options.view, options.params, options.locals);
        }
        return result;
      }
    };
  }
}

angular.module('ui.router.state').provider('$view', $ViewProvider);

/**
 * @ngdoc object
 * @name ui.router.state.$uiViewScrollProvider
 *
 * @description
 * Provider that returns the {@link ui.router.state.$uiViewScroll} service function.
 */
function $ViewScrollProvider() {

  var useAnchorScroll = false;

  /**
   * @ngdoc function
   * @name ui.router.state.$uiViewScrollProvider#useAnchorScroll
   * @methodOf ui.router.state.$uiViewScrollProvider
   *
   * @description
   * Reverts back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll) service for
   * scrolling based on the url anchor.
   */
  this.useAnchorScroll = function () {
    useAnchorScroll = true;
  };

  /**
   * @ngdoc object
   * @name ui.router.state.$uiViewScroll
   *
   * @requires $anchorScroll
   * @requires $timeout
   *
   * @description
   * When called with a jqLite element, it scrolls the element into view (after a
   * `$timeout` so the DOM has time to refresh).
   *
   * If you prefer to rely on `$anchorScroll` to scroll the view to the anchor,
   * this can be enabled by calling {@link ui.router.state.$uiViewScrollProvider#methods_useAnchorScroll `$uiViewScrollProvider.useAnchorScroll()`}.
   */
  this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
    if (useAnchorScroll) {
      return $anchorScroll;
    }

    return function ($element) {
      return $timeout(function () {
        $element[0].scrollIntoView();
      }, 0, false);
    };
  }];
}

angular.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);

var ngMajorVer = angular.version.major;
var ngMinorVer = angular.version.minor;
/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-view
 *
 * @requires ui.router.state.$state
 * @requires $compile
 * @requires $controller
 * @requires $injector
 * @requires ui.router.state.$uiViewScroll
 * @requires $document
 *
 * @restrict ECA
 *
 * @description
 * The ui-view directive tells $state where to place your templates.
 *
 * @param {string=} name A view name. The name should be unique amongst the other views in the
 * same state. You can have views of the same name that live in different states.
 *
 * @param {string=} autoscroll It allows you to set the scroll behavior of the browser window
 * when a view is populated. By default, $anchorScroll is overridden by ui-router's custom scroll
 * service, {@link ui.router.state.$uiViewScroll}. This custom service let's you
 * scroll ui-view elements into view when they are populated during a state activation.
 *
 * @param {string=} noanimation If truthy, the non-animated renderer will be selected (no animations
 * will be applied to the ui-view)
 *
 * *Note: To revert back to old [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
 * functionality, call `$uiViewScrollProvider.useAnchorScroll()`.*
 *
 * @param {string=} onload Expression to evaluate whenever the view updates.
 * 
 * @example
 * A view can be unnamed or named. 
 * <pre>
 * <!-- Unnamed -->
 * <div ui-view></div> 
 * 
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 * </pre>
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a 
 * single view and it is unnamed then you can populate it like so:
 * <pre>
 * <div ui-view></div> 
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * </pre>
 * 
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the {@link ui.router.state.$stateProvider#views `views`}
 * config property, by name, in this case an empty name:
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
 * </pre>
 * 
 * But typically you'll only use the views property if you name your view or have more than one view 
 * in the same template. There's not really a compelling reason to name a view if its the only one, 
 * but you could if you wanted, like so:
 * <pre>
 * <div ui-view="main"></div>
 * </pre> 
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
 * </pre>
 * 
 * Really though, you'll use views to set up multiple views:
 * <pre>
 * <div ui-view></div>
 * <div ui-view="chart"></div> 
 * <div ui-view="data"></div> 
 * </pre>
 * 
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     },
 *     "chart": {
 *       template: "<chart_thing/>"
 *     },
 *     "data": {
 *       template: "<data_thing/>"
 *     }
 *   }    
 * })
 * </pre>
 *
 * Examples for `autoscroll`:
 *
 * <pre>
 * <!-- If autoscroll present with no expression,
 *      then scroll ui-view into view -->
 * <ui-view autoscroll/>
 *
 * <!-- If autoscroll present with valid expression,
 *      then scroll ui-view into view if expression evaluates to true -->
 * <ui-view autoscroll='true'/>
 * <ui-view autoscroll='false'/>
 * <ui-view autoscroll='scopeVariable'/>
 * </pre>
 */
$ViewDirective.$inject = ['$state', '$injector', '$uiViewScroll', '$interpolate'];
function $ViewDirective(   $state,   $injector,   $uiViewScroll,   $interpolate) {

  function getService() {
    return ($injector.has) ? function(service) {
      return $injector.has(service) ? $injector.get(service) : null;
    } : function(service) {
      try {
        return $injector.get(service);
      } catch (e) {
        return null;
      }
    };
  }

  var service = getService(),
      $animator = service('$animator'),
      $animate = service('$animate');

  // Returns a set of DOM manipulation functions based on which Angular version
  // it should use
  function getRenderer(attrs, scope) {
    var statics = {
      enter: function (element, target, cb) { target.after(element); cb(); },
      leave: function (element, cb) { element.remove(); cb(); }
    };

    if (!!attrs.noanimation) return statics;

    function animEnabled(element) {
      if (ngMajorVer === 1 && ngMinorVer >= 4) return !!$animate.enabled(element);
      if (ngMajorVer === 1 && ngMinorVer >= 2) return !!$animate.enabled();
      return (!!$animator);
    }

    // ng 1.2+
    if ($animate) {
      return {
        enter: function(element, target, cb) {
          if (!animEnabled(element)) {
            statics.enter(element, target, cb);
          } else if (angular.version.minor > 2) {
            $animate.enter(element, null, target).then(cb);
          } else {
            $animate.enter(element, null, target, cb);
          }
        },
        leave: function(element, cb) {
          if (!animEnabled(element)) {
            statics.leave(element, cb);
          } else if (angular.version.minor > 2) {
            $animate.leave(element).then(cb);
          } else {
            $animate.leave(element, cb);
          }
        }
      };
    }

    // ng 1.1.5
    if ($animator) {
      var animate = $animator && $animator(scope, attrs);

      return {
        enter: function(element, target, cb) {animate.enter(element, null, target); cb(); },
        leave: function(element, cb) { animate.leave(element); cb(); }
      };
    }

    return statics;
  }

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    compile: function (tElement, tAttrs, $transclude) {
      return function (scope, $element, attrs) {
        var previousEl, currentEl, currentScope, latestLocals,
            onloadExp     = attrs.onload || '',
            autoScrollExp = attrs.autoscroll,
            renderer      = getRenderer(attrs, scope);

        scope.$on('$stateChangeSuccess', function() {
          updateView(false);
        });

        updateView(true);

        function cleanupLastView() {
          var _previousEl = previousEl;
          var _currentScope = currentScope;

          if (_currentScope) {
            _currentScope._willBeDestroyed = true;
          }

          function cleanOld() {
            if (_previousEl) {
              _previousEl.remove();
            }

            if (_currentScope) {
              _currentScope.$destroy();
            }
          }

          if (currentEl) {
            renderer.leave(currentEl, function() {
              cleanOld();
              previousEl = null;
            });

            previousEl = currentEl;
          } else {
            cleanOld();
            previousEl = null;
          }

          currentEl = null;
          currentScope = null;
        }

        function updateView(firstTime) {
          var newScope,
              name            = getUiViewName(scope, attrs, $element, $interpolate),
              previousLocals  = name && $state.$current && $state.$current.locals[name];

          if (!firstTime && previousLocals === latestLocals || scope._willBeDestroyed) return; // nothing to do
          newScope = scope.$new();
          latestLocals = $state.$current.locals[name];

          /**
           * @ngdoc event
           * @name ui.router.state.directive:ui-view#$viewContentLoading
           * @eventOf ui.router.state.directive:ui-view
           * @eventType emits on ui-view directive scope
           * @description
           *
           * Fired once the view **begins loading**, *before* the DOM is rendered.
           *
           * @param {Object} event Event object.
           * @param {string} viewName Name of the view.
           */
          newScope.$emit('$viewContentLoading', name);

          var clone = $transclude(newScope, function(clone) {
            renderer.enter(clone, $element, function onUiViewEnter() {
              if(currentScope) {
                currentScope.$emit('$viewContentAnimationEnded');
              }

              if (angular.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                $uiViewScroll(clone);
              }
            });
            cleanupLastView();
          });

          currentEl = clone;
          currentScope = newScope;
          /**
           * @ngdoc event
           * @name ui.router.state.directive:ui-view#$viewContentLoaded
           * @eventOf ui.router.state.directive:ui-view
           * @eventType emits on ui-view directive scope
           * @description
           * Fired once the view is **loaded**, *after* the DOM is rendered.
           *
           * @param {Object} event Event object.
           * @param {string} viewName Name of the view.
           */
          currentScope.$emit('$viewContentLoaded', name);
          currentScope.$eval(onloadExp);
        }
      };
    }
  };

  return directive;
}

$ViewDirectiveFill.$inject = ['$compile', '$controller', '$state', '$interpolate'];
function $ViewDirectiveFill (  $compile,   $controller,   $state,   $interpolate) {
  return {
    restrict: 'ECA',
    priority: -400,
    compile: function (tElement) {
      var initial = tElement.html();
      return function (scope, $element, attrs) {
        var current = $state.$current,
            name = getUiViewName(scope, attrs, $element, $interpolate),
            locals  = current && current.locals[name];

        if (! locals) {
          return;
        }

        $element.data('$uiView', { name: name, state: locals.$$state });
        $element.html(locals.$template ? locals.$template : initial);

        var link = $compile($element.contents());

        if (locals.$$controller) {
          locals.$scope = scope;
          locals.$element = $element;
          var controller = $controller(locals.$$controller, locals);
          if (locals.$$controllerAs) {
            scope[locals.$$controllerAs] = controller;
          }
          $element.data('$ngControllerController', controller);
          $element.children().data('$ngControllerController', controller);
        }

        link(scope);
      };
    }
  };
}

/**
 * Shared ui-view code for both directives:
 * Given scope, element, and its attributes, return the view's name
 */
function getUiViewName(scope, attrs, element, $interpolate) {
  var name = $interpolate(attrs.uiView || attrs.name || '')(scope);
  var inherited = element.inheritedData('$uiView');
  return name.indexOf('@') >= 0 ?  name :  (name + '@' + (inherited ? inherited.state.name : ''));
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);

function parseStateRef(ref, current) {
  var preparsed = ref.match(/^\s*({[^}]*})\s*$/), parsed;
  if (preparsed) ref = current + '(' + preparsed[1] + ')';
  parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

function stateContext(el) {
  var stateData = el.parent().inheritedData('$uiView');

  if (stateData && stateData.state && stateData.state.name) {
    return stateData.state;
  }
}

function getTypeInfo(el) {
  // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
  var isSvg = Object.prototype.toString.call(el.prop('href')) === '[object SVGAnimatedString]';
  var isForm = el[0].nodeName === "FORM";

  return {
    attr: isForm ? "action" : (isSvg ? 'xlink:href' : 'href'),
    isAnchor: el.prop("tagName").toUpperCase() === "A",
    clickable: !isForm
  };
}

function clickHook(el, $state, $timeout, type, current) {
  return function(e) {
    var button = e.which || e.button, target = current();

    if (!(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || el.attr('target'))) {
      // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
      var transition = $timeout(function() {
        $state.go(target.state, target.params, target.options);
      });
      e.preventDefault();

      // if the state has no URL, ignore one preventDefault from the <a> directive.
      var ignorePreventDefaultCount = type.isAnchor && !target.href ? 1: 0;

      e.preventDefault = function() {
        if (ignorePreventDefaultCount-- <= 0) $timeout.cancel(transition);
      };
    }
  };
}

function defaultOpts(el, $state) {
  return { relative: stateContext(el) || $state.$current, inherit: true };
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref
 *
 * @requires ui.router.state.$state
 * @requires $timeout
 *
 * @restrict A
 *
 * @description
 * A directive that binds a link (`<a>` tag) to a state. If the state has an associated
 * URL, the directive will automatically generate & update the `href` attribute via
 * the {@link ui.router.state.$state#methods_href $state.href()} method. Clicking
 * the link will trigger a state transition with optional parameters.
 *
 * Also middle-clicking, right-clicking, and ctrl-clicking on the link will be
 * handled natively by the browser.
 *
 * You can also use relative state paths within ui-sref, just like the relative
 * paths passed to `$state.go()`. You just need to be aware that the path is relative
 * to the state that the link lives in, in other words the state that loaded the
 * template containing the link.
 *
 * You can specify options to pass to {@link ui.router.state.$state#go $state.go()}
 * using the `ui-sref-opts` attribute. Options are restricted to `location`, `inherit`,
 * and `reload`.
 *
 * @example
 * Here's an example of how you'd use ui-sref and how it would compile. If you have the
 * following template:
 * <pre>
 * <a ui-sref="home">Home</a> | <a ui-sref="about">About</a> | <a ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *     </li>
 * </ul>
 * </pre>
 *
 * Then the compiled html would be (assuming Html5Mode is off and current state is contacts):
 * <pre>
 * <a href="#/home" ui-sref="home">Home</a> | <a href="#/about" ui-sref="about">About</a> | <a href="#/contacts?page=2" ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
 *     </li>
 * </ul>
 *
 * <a ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
 * </pre>
 *
 * @param {string} ui-sref 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-sref-opts options to pass to {@link ui.router.state.$state#go $state.go()}
 */
$StateRefDirective.$inject = ['$state', '$timeout'];
function $StateRefDirective($state, $timeout) {
  return {
    restrict: 'A',
    require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
    link: function(scope, element, attrs, uiSrefActive) {
      var ref    = parseStateRef(attrs.uiSref, $state.current.name);
      var def    = { state: ref.state, href: null, params: null };
      var type   = getTypeInfo(element);
      var active = uiSrefActive[1] || uiSrefActive[0];

      def.options = extend(defaultOpts(element, $state), attrs.uiSrefOpts ? scope.$eval(attrs.uiSrefOpts) : {});

      var update = function(val) {
        if (val) def.params = angular.copy(val);
        def.href = $state.href(ref.state, def.params, def.options);

        if (active) active.$$addStateInfo(ref.state, def.params);
        if (def.href !== null) attrs.$set(type.attr, def.href);
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(val) { if (val !== def.params) update(val); }, true);
        def.params = angular.copy(scope.$eval(ref.paramExpr));
      }
      update();

      if (!type.clickable) return;
      element.bind("click", clickHook(element, $state, $timeout, type, function() { return def; }));
    }
  };
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-state
 *
 * @requires ui.router.state.uiSref
 *
 * @restrict A
 *
 * @description
 * Much like ui-sref, but will accept named $scope properties to evaluate for a state definition,
 * params and override options.
 *
 * @param {string} ui-state 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-state-params params to pass to {@link ui.router.state.$state#href $state.href()}
 * @param {Object} ui-state-opts options to pass to {@link ui.router.state.$state#go $state.go()}
 */
$StateRefDynamicDirective.$inject = ['$state', '$timeout'];
function $StateRefDynamicDirective($state, $timeout) {
  return {
    restrict: 'A',
    require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
    link: function(scope, element, attrs, uiSrefActive) {
      var type   = getTypeInfo(element);
      var active = uiSrefActive[1] || uiSrefActive[0];
      var group  = [attrs.uiState, attrs.uiStateParams || null, attrs.uiStateOpts || null];
      var watch  = '[' + group.map(function(val) { return val || 'null'; }).join(', ') + ']';
      var def    = { state: null, params: null, options: null, href: null };

      function runStateRefLink (group) {
        def.state = group[0]; def.params = group[1]; def.options = group[2];
        def.href = $state.href(def.state, def.params, def.options);

        if (active) active.$$addStateInfo(def.state, def.params);
        if (def.href) attrs.$set(type.attr, def.href);
      }

      scope.$watch(watch, runStateRefLink, true);
      runStateRefLink(scope.$eval(watch));

      if (!type.clickable) return;
      element.bind("click", clickHook(element, $state, $timeout, type, function() { return def; }));
    }
  };
}


/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref-active
 *
 * @requires ui.router.state.$state
 * @requires ui.router.state.$stateParams
 * @requires $interpolate
 *
 * @restrict A
 *
 * @description
 * A directive working alongside ui-sref to add classes to an element when the
 * related ui-sref directive's state is active, and removing them when it is inactive.
 * The primary use-case is to simplify the special appearance of navigation menus
 * relying on `ui-sref`, by having the "active" state's menu button appear different,
 * distinguishing it from the inactive menu items.
 *
 * ui-sref-active can live on the same element as ui-sref or on a parent element. The first
 * ui-sref-active found at the same level or above the ui-sref will be used.
 *
 * Will activate when the ui-sref's target state or any child state is active. If you
 * need to activate only when the ui-sref target state is active and *not* any of
 * it's children, then you will use
 * {@link ui.router.state.directive:ui-sref-active-eq ui-sref-active-eq}
 *
 * @example
 * Given the following template:
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item">
 *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 *
 *
 * When the app state is "app.user" (or any children states), and contains the state parameter "user" with value "bilbobaggins",
 * the resulting HTML will appear as (note the 'active' class):
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 *
 * The class name is interpolated **once** during the directives link time (any further changes to the
 * interpolated value are ignored).
 *
 * Multiple classes may be specified in a space-separated format:
 * <pre>
 * <ul>
 *   <li ui-sref-active='class1 class2 class3'>
 *     <a ui-sref="app.user">link</a>
 *   </li>
 * </ul>
 * </pre>
 *
 * It is also possible to pass ui-sref-active an expression that evaluates
 * to an object hash, whose keys represent active class names and whose
 * values represent the respective state names/globs.
 * ui-sref-active will match if the current active state **includes** any of
 * the specified state names/globs, even the abstract ones.
 *
 * @Example
 * Given the following template, with "admin" being an abstract state:
 * <pre>
 * <div ui-sref-active="{'active': 'admin.*'}">
 *   <a ui-sref-active="active" ui-sref="admin.roles">Roles</a>
 * </div>
 * </pre>
 *
 * When the current state is "admin.roles" the "active" class will be applied
 * to both the <div> and <a> elements. It is important to note that the state
 * names/globs passed to ui-sref-active shadow the state provided by ui-sref.
 */

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref-active-eq
 *
 * @requires ui.router.state.$state
 * @requires ui.router.state.$stateParams
 * @requires $interpolate
 *
 * @restrict A
 *
 * @description
 * The same as {@link ui.router.state.directive:ui-sref-active ui-sref-active} but will only activate
 * when the exact target state used in the `ui-sref` is active; no child states.
 *
 */
$StateRefActiveDirective.$inject = ['$state', '$stateParams', '$interpolate'];
function $StateRefActiveDirective($state, $stateParams, $interpolate) {
  return  {
    restrict: "A",
    controller: ['$scope', '$element', '$attrs', '$timeout', function ($scope, $element, $attrs, $timeout) {
      var states = [], activeClasses = {}, activeEqClass, uiSrefActive;

      // There probably isn't much point in $observing this
      // uiSrefActive and uiSrefActiveEq share the same directive object with some
      // slight difference in logic routing
      activeEqClass = $interpolate($attrs.uiSrefActiveEq || '', false)($scope);

      try {
        uiSrefActive = $scope.$eval($attrs.uiSrefActive);
      } catch (e) {
        // Do nothing. uiSrefActive is not a valid expression.
        // Fall back to using $interpolate below
      }
      uiSrefActive = uiSrefActive || $interpolate($attrs.uiSrefActive || '', false)($scope);
      if (isObject(uiSrefActive)) {
        forEach(uiSrefActive, function(stateOrName, activeClass) {
          if (isString(stateOrName)) {
            var ref = parseStateRef(stateOrName, $state.current.name);
            addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
          }
        });
      }

      // Allow uiSref to communicate with uiSrefActive[Equals]
      this.$$addStateInfo = function (newState, newParams) {
        // we already got an explicit state provided by ui-sref-active, so we
        // shadow the one that comes from ui-sref
        if (isObject(uiSrefActive) && states.length > 0) {
          return;
        }
        addState(newState, newParams, uiSrefActive);
        update();
      };

      $scope.$on('$stateChangeSuccess', update);

      function addState(stateName, stateParams, activeClass) {
        var state = $state.get(stateName, stateContext($element));
        var stateHash = createStateHash(stateName, stateParams);

        states.push({
          state: state || { name: stateName },
          params: stateParams,
          hash: stateHash
        });

        activeClasses[stateHash] = activeClass;
      }

      /**
       * @param {string} state
       * @param {Object|string} [params]
       * @return {string}
       */
      function createStateHash(state, params) {
        if (!isString(state)) {
          throw new Error('state should be a string');
        }
        if (isObject(params)) {
          return state + toJson(params);
        }
        params = $scope.$eval(params);
        if (isObject(params)) {
          return state + toJson(params);
        }
        return state;
      }

      // Update route state
      function update() {
        for (var i = 0; i < states.length; i++) {
          if (anyMatch(states[i].state, states[i].params)) {
            addClass($element, activeClasses[states[i].hash]);
          } else {
            removeClass($element, activeClasses[states[i].hash]);
          }

          if (exactMatch(states[i].state, states[i].params)) {
            addClass($element, activeEqClass);
          } else {
            removeClass($element, activeEqClass);
          }
        }
      }

      function addClass(el, className) { $timeout(function () { el.addClass(className); }); }
      function removeClass(el, className) { el.removeClass(className); }
      function anyMatch(state, params) { return $state.includes(state.name, params); }
      function exactMatch(state, params) { return $state.is(state.name, params); }

      update();
    }]
  };
}

angular.module('ui.router.state')
  .directive('uiSref', $StateRefDirective)
  .directive('uiSrefActive', $StateRefActiveDirective)
  .directive('uiSrefActiveEq', $StateRefActiveDirective)
  .directive('uiState', $StateRefDynamicDirective);

/**
 * @ngdoc filter
 * @name ui.router.state.filter:isState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName")}.
 */
$IsStateFilter.$inject = ['$state'];
function $IsStateFilter($state) {
  var isFilter = function (state, params) {
    return $state.is(state, params);
  };
  isFilter.$stateful = true;
  return isFilter;
}

/**
 * @ngdoc filter
 * @name ui.router.state.filter:includedByState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName')}.
 */
$IncludedByStateFilter.$inject = ['$state'];
function $IncludedByStateFilter($state) {
  var includesFilter = function (state, params, options) {
    return $state.includes(state, params, options);
  };
  includesFilter.$stateful = true;
  return  includesFilter;
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter);
})(window, window.angular);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFuZ3VsYXItdWktcm91dGVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJ3aW5kb3ciLCJhbmd1bGFyIiwidW5kZWZpbmVkIiwiaW5oZXJpdCIsInBhcmVudCIsImV4dHJhIiwiZXh0ZW5kIiwicHJvdG90eXBlIiwibWVyZ2UiLCJkc3QiLCJmb3JFYWNoIiwiYXJndW1lbnRzIiwib2JqIiwidmFsdWUiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsImFuY2VzdG9ycyIsImZpcnN0Iiwic2Vjb25kIiwicGF0aCIsIm4iLCJwdXNoIiwib2JqZWN0S2V5cyIsIm9iamVjdCIsIk9iamVjdCIsImtleXMiLCJyZXN1bHQiLCJ2YWwiLCJpbmRleE9mIiwiYXJyYXkiLCJBcnJheSIsIk51bWJlciIsImxlbiIsImxlbmd0aCIsImZyb20iLCJNYXRoIiwiY2VpbCIsImZsb29yIiwiaW5oZXJpdFBhcmFtcyIsImN1cnJlbnRQYXJhbXMiLCJuZXdQYXJhbXMiLCIkY3VycmVudCIsIiR0byIsInBhcmVudFBhcmFtcyIsInBhcmVudHMiLCJpbmhlcml0ZWQiLCJpbmhlcml0TGlzdCIsImkiLCJwYXJhbXMiLCJqIiwiZXF1YWxGb3JLZXlzIiwiYSIsImIiLCJrIiwiZmlsdGVyQnlLZXlzIiwidmFsdWVzIiwiZmlsdGVyZWQiLCJuYW1lIiwicGljayIsImNvcHkiLCJjb25jYXQiLCJhcHBseSIsInNsaWNlIiwiY2FsbCIsIm9taXQiLCJmaWx0ZXIiLCJjb2xsZWN0aW9uIiwiY2FsbGJhY2siLCJpc0FycmF5IiwibWFwIiwiJFJlc29sdmUiLCIkcSIsIiRpbmplY3RvciIsIlZJU0lUX0lOX1BST0dSRVNTIiwiVklTSVRfRE9ORSIsIk5PVEhJTkciLCJOT19ERVBFTkRFTkNJRVMiLCJOT19MT0NBTFMiLCJOT19QQVJFTlQiLCJ3aGVuIiwiJCRwcm9taXNlcyIsIiQkdmFsdWVzIiwidGhpcyIsInN0dWR5IiwiaW52b2NhYmxlcyIsInZpc2l0IiwidmlzaXRlZCIsImN5Y2xlIiwic3BsaWNlIiwiRXJyb3IiLCJqb2luIiwiaXNTdHJpbmciLCJwbGFuIiwiZ2V0IiwiYW5ub3RhdGUiLCJwYXJhbSIsInBvcCIsImlzUmVzb2x2ZSIsImlzT2JqZWN0IiwidGhlbiIsImludm9jYWJsZUtleXMiLCJsb2NhbHMiLCJzZWxmIiwiZG9uZSIsIndhaXQiLCJtZXJnZWQiLCIkJGluaGVyaXRlZFZhbHVlcyIsInJlc29sdXRpb24iLCJyZXNvbHZlIiwiZmFpbCIsInJlYXNvbiIsIiQkZmFpbHVyZSIsInJlamVjdCIsImludm9rZSIsImludm9jYWJsZSIsIm9uZmFpbHVyZSIsImludm9jYXRpb24iLCJwcm9jZWVkIiwiaXNEZWZpbmVkIiwicHJvbWlzZSIsImUiLCJkZWZlciIsIndhaXRQYXJhbXMiLCJkZXAiLCJwcm9taXNlcyIsImlpIiwiJFRlbXBsYXRlRmFjdG9yeSIsIiRodHRwIiwiJHRlbXBsYXRlQ2FjaGUiLCJmcm9tQ29uZmlnIiwiY29uZmlnIiwidGVtcGxhdGUiLCJmcm9tU3RyaW5nIiwidGVtcGxhdGVVcmwiLCJmcm9tVXJsIiwidGVtcGxhdGVQcm92aWRlciIsImZyb21Qcm92aWRlciIsImlzRnVuY3Rpb24iLCJ1cmwiLCJjYWNoZSIsImhlYWRlcnMiLCJBY2NlcHQiLCJyZXNwb25zZSIsImRhdGEiLCJwcm92aWRlciIsIlVybE1hdGNoZXIiLCJwYXR0ZXJuIiwicGFyZW50TWF0Y2hlciIsImFkZFBhcmFtZXRlciIsImlkIiwidHlwZSIsImxvY2F0aW9uIiwicGFyYW1OYW1lcyIsInRlc3QiLCIkJFVNRlAiLCJQYXJhbSIsInF1b3RlUmVnRXhwIiwic3RyaW5nIiwic3F1YXNoIiwib3B0aW9uYWwiLCJzdXJyb3VuZFBhdHRlcm4iLCJyZXBsYWNlIiwibWF0Y2hEZXRhaWxzIiwibSIsImlzU2VhcmNoIiwicmVnZXhwIiwic2VnbWVudCIsImNmZyIsInN1YnN0cmluZyIsImxhc3QiLCJpbmRleCIsIlJlZ0V4cCIsImNhc2VJbnNlbnNpdGl2ZSIsInBsYWNlaG9sZGVyIiwic2VhcmNoUGxhY2Vob2xkZXIiLCJjb21waWxlZCIsInNlZ21lbnRzIiwiJCRuZXciLCJQYXJhbVNldCIsInNvdXJjZSIsInAiLCJleGVjIiwiaXNPcHRpb25hbCIsImxhc3RJbmRleCIsInNlYXJjaCIsInNvdXJjZVNlYXJjaCIsInNvdXJjZVBhdGgiLCJzdHJpY3QiLCJwcmVmaXgiLCIkJHBhcmFtTmFtZXMiLCJUeXBlIiwiJFVybE1hdGNoZXJGYWN0b3J5IiwidmFsVG9TdHJpbmciLCJ0b1N0cmluZyIsInZhbEZyb21TdHJpbmciLCJnZXREZWZhdWx0Q29uZmlnIiwiaXNTdHJpY3RNb2RlIiwiaXNDYXNlSW5zZW5zaXRpdmUiLCJpc0luamVjdGFibGUiLCJmbHVzaFR5cGVRdWV1ZSIsInR5cGVRdWV1ZSIsInNoaWZ0IiwiJHR5cGVzIiwiaW5qZWN0b3IiLCJkZWYiLCJkZWZhdWx0U3F1YXNoUG9saWN5IiwiZW5xdWV1ZSIsImRlZmF1bHRUeXBlcyIsImVuY29kZSIsImRlY29kZSIsImlzIiwiaW50IiwicGFyc2VJbnQiLCJib29sIiwiZGF0ZSIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwibWF0Y2giLCJjYXB0dXJlIiwiRGF0ZSIsImlzTmFOIiwidmFsdWVPZiIsImVxdWFscyIsInRvSVNPU3RyaW5nIiwianNvbiIsInRvSnNvbiIsImZyb21Kc29uIiwiYW55IiwiaWRlbnRpdHkiLCIkJGdldERlZmF1bHRWYWx1ZSIsInN0cmljdE1vZGUiLCJjb21waWxlIiwiaXNNYXRjaGVyIiwibyIsImRlZmluaXRpb24iLCJkZWZpbml0aW9uRm4iLCIkZ2V0IiwidW53cmFwU2hvcnRoYW5kIiwiaXNTaG9ydGhhbmQiLCIkJGZuIiwiZ2V0VHlwZSIsInVybFR5cGUiLCJnZXRBcnJheU1vZGUiLCJhcnJheURlZmF1bHRzIiwiYXJyYXlQYXJhbU5vbWVuY2xhdHVyZSIsImdldFNxdWFzaFBvbGljeSIsImdldFJlcGxhY2UiLCJhcnJheU1vZGUiLCJjb25maWd1cmVkS2V5cyIsImRlZmF1bHRQb2xpY3kiLCJ0byIsIml0ZW0iLCJkZWZhdWx0VmFsdWUiLCIkdmFsdWUiLCJoYXNSZXBsYWNlVmFsIiwiJHJlcGxhY2UiLCJyZXBsYWNlbWVudCIsIiRub3JtYWxpemUiLCIkYXNBcnJheSIsImR5bmFtaWMiLCIkJHBhcmVudCIsIiQka2V5cyIsImNoYWluIiwiaWdub3JlIiwicmV2ZXJzZSIsInBhcmFtc2V0IiwicGFyYW1WYWx1ZXMiLCIkJGVxdWFscyIsInBhcmFtVmFsdWVzMSIsInBhcmFtVmFsdWVzMiIsImVxdWFsIiwibGVmdCIsInJpZ2h0IiwiJCR2YWxpZGF0ZXMiLCJyYXdWYWwiLCJub3JtYWxpemVkIiwiZW5jb2RlZCIsIiRVcmxSb3V0ZXJQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiJHVybE1hdGNoZXJGYWN0b3J5IiwicmVnRXhwUHJlZml4IiwicmUiLCJpbnRlcnBvbGF0ZSIsIndoYXQiLCJoYW5kbGVJZk1hdGNoIiwiaGFuZGxlciIsIiRtYXRjaCIsIiRsb2NhdGlvbiIsIiRyb290U2NvcGUiLCIkYnJvd3NlciIsIiRzbmlmZmVyIiwiYXBwZW5kQmFzZVBhdGgiLCJpc0h0bWw1IiwiYWJzb2x1dGUiLCJiYXNlSHJlZiIsInVwZGF0ZSIsImV2dCIsImNoZWNrIiwicnVsZSIsImhhbmRsZWQiLCJkZWZhdWx0UHJldmVudGVkIiwibGFzdFB1c2hlZFVybCIsInJ1bGVzIiwib3RoZXJ3aXNlIiwibGlzdGVuIiwibGlzdGVuZXIiLCIkb24iLCJpbnRlcmNlcHREZWZlcnJlZCIsInN5bmMiLCJyZWFkIiwidXJsTWF0Y2hlciIsIm9wdGlvbnMiLCJmb3JtYXQiLCIkJGF2b2lkUmVzeW5jIiwiaHJlZiIsInZhbGlkYXRlcyIsImh0bWw1TW9kZSIsImVuYWJsZWQiLCJoaXN0b3J5IiwiaGFzaFByZWZpeCIsInNsYXNoIiwicG9ydCIsInByb3RvY29sIiwiaG9zdCIsInJlZGlyZWN0IiwiaGFuZGxlcklzU3RyaW5nIiwic3RyYXRlZ2llcyIsIm1hdGNoZXIiLCJyZWdleCIsImdsb2JhbCIsInN0aWNreSIsImRlZmVySW50ZXJjZXB0IiwiJGluamVjdCIsIiRTdGF0ZVByb3ZpZGVyIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiaXNSZWxhdGl2ZSIsInN0YXRlTmFtZSIsImZpbmRTdGF0ZSIsInN0YXRlT3JOYW1lIiwiYmFzZSIsImlzU3RyIiwicmVsIiwic3BsaXQiLCJwYXRoTGVuZ3RoIiwiY3VycmVudCIsInN0YXRlIiwic3RhdGVzIiwicXVldWVTdGF0ZSIsInBhcmVudE5hbWUiLCJxdWV1ZSIsImZsdXNoUXVldWVkQ2hpbGRyZW4iLCJxdWV1ZWQiLCJyZWdpc3RlclN0YXRlIiwibGFzdEluZGV4T2YiLCJzdGF0ZUJ1aWxkZXIiLCIkZGVsZWdhdGVzIiwiYWJzdHJhY3RLZXkiLCIkc3RhdGVQYXJhbXMiLCIkc3RhdGUiLCJuYXZpZ2FibGUiLCJ0cmFuc2l0aW9uVG8iLCJpc0dsb2IiLCJ0ZXh0IiwiZG9lc1N0YXRlTWF0Y2hHbG9iIiwiZ2xvYiIsImdsb2JTZWdtZW50cyIsImwiLCJ1bnNoaWZ0IiwiTUFYX1ZBTFVFIiwiZGVjb3JhdG9yIiwiZnVuYyIsIiR2aWV3IiwiJHJlc29sdmUiLCIkdXJsUm91dGVyIiwiaGFuZGxlUmVkaXJlY3QiLCIkYnJvYWRjYXN0IiwiVHJhbnNpdGlvbkFib3J0ZWQiLCJyZXRyeSIsIiRyZXRyeSIsIlRyYW5zaXRpb25GYWlsZWQiLCJyZXRyeVRyYW5zaXRpb24iLCJ0cmFuc2l0aW9uIiwiVHJhbnNpdGlvblN1cGVyc2VkZWQiLCJ0b1BhcmFtcyIsInJlc29sdmVTdGF0ZSIsInBhcmFtc0FyZUZpbHRlcmVkIiwicmVzb2x2ZVZpZXdzIiwidmlld3NQcm9taXNlcyIsInZpZXdzIiwidmlldyIsImluamVjdGFibGVzIiwiJHRlbXBsYXRlIiwibG9hZCIsImdsb2JhbHMiLCJub3RpZnkiLCJjb250cm9sbGVyUHJvdmlkZXIiLCJpbmplY3RMb2NhbHMiLCIkJGNvbnRyb2xsZXIiLCJjb250cm9sbGVyIiwiJCRzdGF0ZSIsIiQkY29udHJvbGxlckFzIiwiY29udHJvbGxlckFzIiwiYWxsIiwiVHJhbnNpdGlvblByZXZlbnRlZCIsInJvb3QiLCJyZWxvYWQiLCJnbyIsInJlbGF0aXZlIiwiZnJvbVBhcmFtcyIsImZyb21QYXRoIiwidG9TdGF0ZSIsImhhc2giLCJyZWRpcmVjdFJlc3VsdCIsInRvUGF0aCIsImtlZXAiLCJ0b0xvY2FscyIsInJlbG9hZFN0YXRlIiwib3duUGFyYW1zIiwic2hvdWxkU2tpcFJlbG9hZCIsInJlc29sdmVkIiwiZW50ZXJpbmciLCJleGl0aW5nIiwib25FeGl0Iiwib25FbnRlciIsImVycm9yIiwiaW5jbHVkZXMiLCJsb3NzeSIsIm5hdiIsImNvbnRleHQiLCJub25TZWFyY2hQYXJhbXNFcXVhbCIsImZyb21BbmRUb1N0YXRlIiwibm90U2VhcmNoUGFyYW0iLCJub25RdWVyeVBhcmFtS2V5cyIsIm5vblF1ZXJ5UGFyYW1zIiwibm9uUXVlcnlQYXJhbVNldCIsInJlbG9hZE9uU2VhcmNoIiwiY29tcG9zaXRlTmFtZSIsImNoYXJBdCIsIiIsImFic3RyYWN0IiwiJFZpZXdQcm92aWRlciIsIiR0ZW1wbGF0ZUZhY3RvcnkiLCJkZWZhdWx0cyIsImFzeW5jIiwiJFZpZXdTY3JvbGxQcm92aWRlciIsInVzZUFuY2hvclNjcm9sbCIsIiRhbmNob3JTY3JvbGwiLCIkdGltZW91dCIsIiRlbGVtZW50Iiwic2Nyb2xsSW50b1ZpZXciLCIkVmlld0RpcmVjdGl2ZSIsIiR1aVZpZXdTY3JvbGwiLCIkaW50ZXJwb2xhdGUiLCJnZXRTZXJ2aWNlIiwic2VydmljZSIsImhhcyIsImdldFJlbmRlcmVyIiwiYXR0cnMiLCJzY29wZSIsImFuaW1FbmFibGVkIiwiZWxlbWVudCIsIm5nTWFqb3JWZXIiLCJuZ01pbm9yVmVyIiwiJGFuaW1hdGUiLCIkYW5pbWF0b3IiLCJzdGF0aWNzIiwiZW50ZXIiLCJ0YXJnZXQiLCJjYiIsImFmdGVyIiwibGVhdmUiLCJyZW1vdmUiLCJub2FuaW1hdGlvbiIsInZlcnNpb24iLCJtaW5vciIsImFuaW1hdGUiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInRlcm1pbmFsIiwicHJpb3JpdHkiLCJ0cmFuc2NsdWRlIiwidEVsZW1lbnQiLCJ0QXR0cnMiLCIkdHJhbnNjbHVkZSIsImNsZWFudXBMYXN0VmlldyIsImNsZWFuT2xkIiwiX3ByZXZpb3VzRWwiLCJfY3VycmVudFNjb3BlIiwiJGRlc3Ryb3kiLCJwcmV2aW91c0VsIiwiY3VycmVudFNjb3BlIiwiX3dpbGxCZURlc3Ryb3llZCIsImN1cnJlbnRFbCIsInJlbmRlcmVyIiwidXBkYXRlVmlldyIsImZpcnN0VGltZSIsIm5ld1Njb3BlIiwiZ2V0VWlWaWV3TmFtZSIsInByZXZpb3VzTG9jYWxzIiwibGF0ZXN0TG9jYWxzIiwiJG5ldyIsIiRlbWl0IiwiY2xvbmUiLCJhdXRvU2Nyb2xsRXhwIiwiJGV2YWwiLCJvbmxvYWRFeHAiLCJvbmxvYWQiLCJhdXRvc2Nyb2xsIiwiJFZpZXdEaXJlY3RpdmVGaWxsIiwiJGNvbXBpbGUiLCIkY29udHJvbGxlciIsImluaXRpYWwiLCJodG1sIiwibGluayIsImNvbnRlbnRzIiwiJHNjb3BlIiwiY2hpbGRyZW4iLCJ1aVZpZXciLCJpbmhlcml0ZWREYXRhIiwicGFyc2VTdGF0ZVJlZiIsInJlZiIsInBhcnNlZCIsInByZXBhcnNlZCIsInBhcmFtRXhwciIsInN0YXRlQ29udGV4dCIsImVsIiwic3RhdGVEYXRhIiwiZ2V0VHlwZUluZm8iLCJpc1N2ZyIsInByb3AiLCJpc0Zvcm0iLCJub2RlTmFtZSIsImF0dHIiLCJpc0FuY2hvciIsInRvVXBwZXJDYXNlIiwiY2xpY2thYmxlIiwiY2xpY2tIb29rIiwiYnV0dG9uIiwid2hpY2giLCJjdHJsS2V5IiwibWV0YUtleSIsInNoaWZ0S2V5IiwicHJldmVudERlZmF1bHQiLCJpZ25vcmVQcmV2ZW50RGVmYXVsdENvdW50IiwiY2FuY2VsIiwiZGVmYXVsdE9wdHMiLCIkU3RhdGVSZWZEaXJlY3RpdmUiLCJyZXF1aXJlIiwidWlTcmVmQWN0aXZlIiwidWlTcmVmIiwiYWN0aXZlIiwidWlTcmVmT3B0cyIsIiQkYWRkU3RhdGVJbmZvIiwiJHNldCIsIiR3YXRjaCIsImJpbmQiLCIkU3RhdGVSZWZEeW5hbWljRGlyZWN0aXZlIiwicnVuU3RhdGVSZWZMaW5rIiwiZ3JvdXAiLCJ1aVN0YXRlIiwidWlTdGF0ZVBhcmFtcyIsInVpU3RhdGVPcHRzIiwid2F0Y2giLCIkU3RhdGVSZWZBY3RpdmVEaXJlY3RpdmUiLCIkYXR0cnMiLCJhZGRTdGF0ZSIsInN0YXRlUGFyYW1zIiwiYWN0aXZlQ2xhc3MiLCJzdGF0ZUhhc2giLCJjcmVhdGVTdGF0ZUhhc2giLCJhY3RpdmVDbGFzc2VzIiwiYW55TWF0Y2giLCJhZGRDbGFzcyIsInJlbW92ZUNsYXNzIiwiZXhhY3RNYXRjaCIsImFjdGl2ZUVxQ2xhc3MiLCJjbGFzc05hbWUiLCJ1aVNyZWZBY3RpdmVFcSIsIm5ld1N0YXRlIiwiJElzU3RhdGVGaWx0ZXIiLCJpc0ZpbHRlciIsIiRzdGF0ZWZ1bCIsIiRJbmNsdWRlZEJ5U3RhdGVGaWx0ZXIiLCJpbmNsdWRlc0ZpbHRlciIsImRlZmF1bHRDb25maWciLCJzZWFyY2hQYXJhbXMiLCJkZWNvZGVQYXRoQXJyYXkiLCJyZXZlcnNlU3RyaW5nIiwic3RyIiwidW5xdW90ZURhc2hlcyIsImFsbFJldmVyc2VkIiwicGFyYW1OYW1lIiwicGFyYW1ldGVycyIsIm5Ub3RhbCIsIm5QYXRoIiwicGFyYW1WYWwiLCJlbmNvZGVEYXNoZXMiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjIiwiY2hhckNvZGVBdCIsImlzUGF0aFBhcmFtIiwiaXNEZWZhdWx0VmFsdWUiLCJuZXh0U2VnbWVudCIsImlzRmluYWxQYXRoUGFyYW0iLCIkc3ViUGF0dGVybiIsInN1YiIsInN1YnN0ciIsIm1vZGUiLCJBcnJheVR5cGUiLCJiaW5kVG8iLCJjYWxsYmFja05hbWUiLCJhcnJheVdyYXAiLCJhcnJheVVud3JhcCIsImZhbHNleSIsImFycmF5SGFuZGxlciIsImFsbFRydXRoeU1vZGUiLCJhcnJheUVxdWFsc0hhbmRsZXIiLCJ2YWwxIiwidmFsMiIsIiRhcnJh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LEdBQ2xCbmdCLE9BQU8sa0JBQW1Cc2dCLElBQzFCdmtCLE9BQVFBLE9BQU9DIiwiZmlsZSI6ImFuZ3VsYXItdWktcm91dGVyLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFN0YXRlLWJhc2VkIHJvdXRpbmcgZm9yIEFuZ3VsYXJKU1xyXG4gKiBAdmVyc2lvbiB2MC4yLjE4XHJcbiAqIEBsaW5rIGh0dHA6Ly9hbmd1bGFyLXVpLmdpdGh1Yi5jb20vXHJcbiAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlLCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxyXG4gKi9cclxuXHJcbi8qIGNvbW1vbmpzIHBhY2thZ2UgbWFuYWdlciBzdXBwb3J0IChlZyBjb21wb25lbnRqcykgKi9cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMgPT09IGV4cG9ydHMpe1xyXG4gIG1vZHVsZS5leHBvcnRzID0gJ3VpLnJvdXRlcic7XHJcbn1cclxuXHJcbihmdW5jdGlvbiAod2luZG93LCBhbmd1bGFyLCB1bmRlZmluZWQpIHtcclxuLypqc2hpbnQgZ2xvYmFsc3RyaWN0OnRydWUqL1xyXG4vKmdsb2JhbCBhbmd1bGFyOmZhbHNlKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGlzRGVmaW5lZCA9IGFuZ3VsYXIuaXNEZWZpbmVkLFxyXG4gICAgaXNGdW5jdGlvbiA9IGFuZ3VsYXIuaXNGdW5jdGlvbixcclxuICAgIGlzU3RyaW5nID0gYW5ndWxhci5pc1N0cmluZyxcclxuICAgIGlzT2JqZWN0ID0gYW5ndWxhci5pc09iamVjdCxcclxuICAgIGlzQXJyYXkgPSBhbmd1bGFyLmlzQXJyYXksXHJcbiAgICBmb3JFYWNoID0gYW5ndWxhci5mb3JFYWNoLFxyXG4gICAgZXh0ZW5kID0gYW5ndWxhci5leHRlbmQsXHJcbiAgICBjb3B5ID0gYW5ndWxhci5jb3B5LFxyXG4gICAgdG9Kc29uID0gYW5ndWxhci50b0pzb247XHJcblxyXG5mdW5jdGlvbiBpbmhlcml0KHBhcmVudCwgZXh0cmEpIHtcclxuICByZXR1cm4gZXh0ZW5kKG5ldyAoZXh0ZW5kKGZ1bmN0aW9uKCkge30sIHsgcHJvdG90eXBlOiBwYXJlbnQgfSkpKCksIGV4dHJhKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWVyZ2UoZHN0KSB7XHJcbiAgZm9yRWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgaWYgKG9iaiAhPT0gZHN0KSB7XHJcbiAgICAgIGZvckVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgaWYgKCFkc3QuaGFzT3duUHJvcGVydHkoa2V5KSkgZHN0W2tleV0gPSB2YWx1ZTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGRzdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZpbmRzIHRoZSBjb21tb24gYW5jZXN0b3IgcGF0aCBiZXR3ZWVuIHR3byBzdGF0ZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBmaXJzdCBUaGUgZmlyc3Qgc3RhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBzZWNvbmQgVGhlIHNlY29uZCBzdGF0ZS5cclxuICogQHJldHVybiB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2Ygc3RhdGUgbmFtZXMgaW4gZGVzY2VuZGluZyBvcmRlciwgbm90IGluY2x1ZGluZyB0aGUgcm9vdC5cclxuICovXHJcbmZ1bmN0aW9uIGFuY2VzdG9ycyhmaXJzdCwgc2Vjb25kKSB7XHJcbiAgdmFyIHBhdGggPSBbXTtcclxuXHJcbiAgZm9yICh2YXIgbiBpbiBmaXJzdC5wYXRoKSB7XHJcbiAgICBpZiAoZmlyc3QucGF0aFtuXSAhPT0gc2Vjb25kLnBhdGhbbl0pIGJyZWFrO1xyXG4gICAgcGF0aC5wdXNoKGZpcnN0LnBhdGhbbl0pO1xyXG4gIH1cclxuICByZXR1cm4gcGF0aDtcclxufVxyXG5cclxuLyoqXHJcbiAqIElFOC1zYWZlIHdyYXBwZXIgZm9yIGBPYmplY3Qua2V5cygpYC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBBIEphdmFTY3JpcHQgb2JqZWN0LlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyB0aGUga2V5cyBvZiB0aGUgb2JqZWN0IGFzIGFuIGFycmF5LlxyXG4gKi9cclxuZnVuY3Rpb24gb2JqZWN0S2V5cyhvYmplY3QpIHtcclxuICBpZiAoT2JqZWN0LmtleXMpIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpO1xyXG4gIH1cclxuICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gIGZvckVhY2gob2JqZWN0LCBmdW5jdGlvbih2YWwsIGtleSkge1xyXG4gICAgcmVzdWx0LnB1c2goa2V5KTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogSUU4LXNhZmUgd3JhcHBlciBmb3IgYEFycmF5LnByb3RvdHlwZS5pbmRleE9mKClgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBBIEphdmFTY3JpcHQgYXJyYXkuXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgQSB2YWx1ZSB0byBzZWFyY2ggdGhlIGFycmF5IGZvci5cclxuICogQHJldHVybiB7TnVtYmVyfSBSZXR1cm5zIHRoZSBhcnJheSBpbmRleCB2YWx1ZSBvZiBgdmFsdWVgLCBvciBgLTFgIGlmIG5vdCBwcmVzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcclxuICBpZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcclxuICAgIHJldHVybiBhcnJheS5pbmRleE9mKHZhbHVlLCBOdW1iZXIoYXJndW1lbnRzWzJdKSB8fCAwKTtcclxuICB9XHJcbiAgdmFyIGxlbiA9IGFycmF5Lmxlbmd0aCA+Pj4gMCwgZnJvbSA9IE51bWJlcihhcmd1bWVudHNbMl0pIHx8IDA7XHJcbiAgZnJvbSA9IChmcm9tIDwgMCkgPyBNYXRoLmNlaWwoZnJvbSkgOiBNYXRoLmZsb29yKGZyb20pO1xyXG5cclxuICBpZiAoZnJvbSA8IDApIGZyb20gKz0gbGVuO1xyXG5cclxuICBmb3IgKDsgZnJvbSA8IGxlbjsgZnJvbSsrKSB7XHJcbiAgICBpZiAoZnJvbSBpbiBhcnJheSAmJiBhcnJheVtmcm9tXSA9PT0gdmFsdWUpIHJldHVybiBmcm9tO1xyXG4gIH1cclxuICByZXR1cm4gLTE7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNZXJnZXMgYSBzZXQgb2YgcGFyYW1ldGVycyB3aXRoIGFsbCBwYXJhbWV0ZXJzIGluaGVyaXRlZCBiZXR3ZWVuIHRoZSBjb21tb24gcGFyZW50cyBvZiB0aGVcclxuICogY3VycmVudCBzdGF0ZSBhbmQgYSBnaXZlbiBkZXN0aW5hdGlvbiBzdGF0ZS5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGN1cnJlbnRQYXJhbXMgVGhlIHZhbHVlIG9mIHRoZSBjdXJyZW50IHN0YXRlIHBhcmFtZXRlcnMgKCRzdGF0ZVBhcmFtcykuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBuZXdQYXJhbXMgVGhlIHNldCBvZiBwYXJhbWV0ZXJzIHdoaWNoIHdpbGwgYmUgY29tcG9zaXRlZCB3aXRoIGluaGVyaXRlZCBwYXJhbXMuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSAkY3VycmVudCBJbnRlcm5hbCBkZWZpbml0aW9uIG9mIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgc3RhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSAkdG8gSW50ZXJuYWwgZGVmaW5pdGlvbiBvZiBvYmplY3QgcmVwcmVzZW50aW5nIHN0YXRlIHRvIHRyYW5zaXRpb24gdG8uXHJcbiAqL1xyXG5mdW5jdGlvbiBpbmhlcml0UGFyYW1zKGN1cnJlbnRQYXJhbXMsIG5ld1BhcmFtcywgJGN1cnJlbnQsICR0bykge1xyXG4gIHZhciBwYXJlbnRzID0gYW5jZXN0b3JzKCRjdXJyZW50LCAkdG8pLCBwYXJlbnRQYXJhbXMsIGluaGVyaXRlZCA9IHt9LCBpbmhlcml0TGlzdCA9IFtdO1xyXG5cclxuICBmb3IgKHZhciBpIGluIHBhcmVudHMpIHtcclxuICAgIGlmICghcGFyZW50c1tpXSB8fCAhcGFyZW50c1tpXS5wYXJhbXMpIGNvbnRpbnVlO1xyXG4gICAgcGFyZW50UGFyYW1zID0gb2JqZWN0S2V5cyhwYXJlbnRzW2ldLnBhcmFtcyk7XHJcbiAgICBpZiAoIXBhcmVudFBhcmFtcy5sZW5ndGgpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAodmFyIGogaW4gcGFyZW50UGFyYW1zKSB7XHJcbiAgICAgIGlmIChpbmRleE9mKGluaGVyaXRMaXN0LCBwYXJlbnRQYXJhbXNbal0pID49IDApIGNvbnRpbnVlO1xyXG4gICAgICBpbmhlcml0TGlzdC5wdXNoKHBhcmVudFBhcmFtc1tqXSk7XHJcbiAgICAgIGluaGVyaXRlZFtwYXJlbnRQYXJhbXNbal1dID0gY3VycmVudFBhcmFtc1twYXJlbnRQYXJhbXNbal1dO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZXh0ZW5kKHt9LCBpbmhlcml0ZWQsIG5ld1BhcmFtcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtcyBhIG5vbi1zdHJpY3QgY29tcGFyaXNvbiBvZiB0aGUgc3Vic2V0IG9mIHR3byBvYmplY3RzLCBkZWZpbmVkIGJ5IGEgbGlzdCBvZiBrZXlzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYSBUaGUgZmlyc3Qgb2JqZWN0LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYiBUaGUgc2Vjb25kIG9iamVjdC5cclxuICogQHBhcmFtIHtBcnJheX0ga2V5cyBUaGUgbGlzdCBvZiBrZXlzIHdpdGhpbiBlYWNoIG9iamVjdCB0byBjb21wYXJlLiBJZiB0aGUgbGlzdCBpcyBlbXB0eSBvciBub3Qgc3BlY2lmaWVkLFxyXG4gKiAgICAgICAgICAgICAgICAgICAgIGl0IGRlZmF1bHRzIHRvIHRoZSBsaXN0IG9mIGtleXMgaW4gYGFgLlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUga2V5cyBtYXRjaCwgb3RoZXJ3aXNlIGBmYWxzZWAuXHJcbiAqL1xyXG5mdW5jdGlvbiBlcXVhbEZvcktleXMoYSwgYiwga2V5cykge1xyXG4gIGlmICgha2V5cykge1xyXG4gICAga2V5cyA9IFtdO1xyXG4gICAgZm9yICh2YXIgbiBpbiBhKSBrZXlzLnB1c2gobik7IC8vIFVzZWQgaW5zdGVhZCBvZiBPYmplY3Qua2V5cygpIGZvciBJRTggY29tcGF0aWJpbGl0eVxyXG4gIH1cclxuXHJcbiAgZm9yICh2YXIgaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBrID0ga2V5c1tpXTtcclxuICAgIGlmIChhW2tdICE9IGJba10pIHJldHVybiBmYWxzZTsgLy8gTm90ICc9PT0nLCB2YWx1ZXMgYXJlbid0IG5lY2Vzc2FyaWx5IG5vcm1hbGl6ZWRcclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBzdWJzZXQgb2YgYW4gb2JqZWN0LCBiYXNlZCBvbiBhIGxpc3Qgb2Yga2V5cy5cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0ga2V5c1xyXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgYSBzdWJzZXQgb2YgYHZhbHVlc2AuXHJcbiAqL1xyXG5mdW5jdGlvbiBmaWx0ZXJCeUtleXMoa2V5cywgdmFsdWVzKSB7XHJcbiAgdmFyIGZpbHRlcmVkID0ge307XHJcblxyXG4gIGZvckVhY2goa2V5cywgZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgIGZpbHRlcmVkW25hbWVdID0gdmFsdWVzW25hbWVdO1xyXG4gIH0pO1xyXG4gIHJldHVybiBmaWx0ZXJlZDtcclxufVxyXG5cclxuLy8gbGlrZSBfLmluZGV4QnlcclxuLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLCBvciB5b3Ugd2FudCBsYXN0LW9uZS1pbiB0byB3aW5cclxuZnVuY3Rpb24gaW5kZXhCeShhcnJheSwgcHJvcE5hbWUpIHtcclxuICB2YXIgcmVzdWx0ID0ge307XHJcbiAgZm9yRWFjaChhcnJheSwgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgcmVzdWx0W2l0ZW1bcHJvcE5hbWVdXSA9IGl0ZW07XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLy8gZXh0cmFjdGVkIGZyb20gdW5kZXJzY29yZS5qc1xyXG4vLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxyXG5mdW5jdGlvbiBwaWNrKG9iaikge1xyXG4gIHZhciBjb3B5ID0ge307XHJcbiAgdmFyIGtleXMgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KEFycmF5LnByb3RvdHlwZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XHJcbiAgZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcclxuICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcclxuICB9KTtcclxuICByZXR1cm4gY29weTtcclxufVxyXG5cclxuLy8gZXh0cmFjdGVkIGZyb20gdW5kZXJzY29yZS5qc1xyXG4vLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb21pdHRpbmcgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXHJcbmZ1bmN0aW9uIG9taXQob2JqKSB7XHJcbiAgdmFyIGNvcHkgPSB7fTtcclxuICB2YXIga2V5cyA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoQXJyYXkucHJvdG90eXBlLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICBpZiAoaW5kZXhPZihrZXlzLCBrZXkpID09IC0xKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcclxuICB9XHJcbiAgcmV0dXJuIGNvcHk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBsdWNrKGNvbGxlY3Rpb24sIGtleSkge1xyXG4gIHZhciByZXN1bHQgPSBpc0FycmF5KGNvbGxlY3Rpb24pID8gW10gOiB7fTtcclxuXHJcbiAgZm9yRWFjaChjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWwsIGkpIHtcclxuICAgIHJlc3VsdFtpXSA9IGlzRnVuY3Rpb24oa2V5KSA/IGtleSh2YWwpIDogdmFsW2tleV07XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gZmlsdGVyKGNvbGxlY3Rpb24sIGNhbGxiYWNrKSB7XHJcbiAgdmFyIGFycmF5ID0gaXNBcnJheShjb2xsZWN0aW9uKTtcclxuICB2YXIgcmVzdWx0ID0gYXJyYXkgPyBbXSA6IHt9O1xyXG4gIGZvckVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsLCBpKSB7XHJcbiAgICBpZiAoY2FsbGJhY2sodmFsLCBpKSkge1xyXG4gICAgICByZXN1bHRbYXJyYXkgPyByZXN1bHQubGVuZ3RoIDogaV0gPSB2YWw7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwKGNvbGxlY3Rpb24sIGNhbGxiYWNrKSB7XHJcbiAgdmFyIHJlc3VsdCA9IGlzQXJyYXkoY29sbGVjdGlvbikgPyBbXSA6IHt9O1xyXG5cclxuICBmb3JFYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbCwgaSkge1xyXG4gICAgcmVzdWx0W2ldID0gY2FsbGJhY2sodmFsLCBpKTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogQG5nZG9jIG92ZXJ2aWV3XHJcbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIHVpLnJvdXRlci51dGlsIHN1Yi1tb2R1bGVcclxuICpcclxuICogVGhpcyBtb2R1bGUgaXMgYSBkZXBlbmRlbmN5IG9mIG90aGVyIHN1Yi1tb2R1bGVzLiBEbyBub3QgaW5jbHVkZSB0aGlzIG1vZHVsZSBhcyBhIGRlcGVuZGVuY3lcclxuICogaW4geW91ciBhbmd1bGFyIGFwcCAodXNlIHtAbGluayB1aS5yb3V0ZXJ9IG1vZHVsZSBpbnN0ZWFkKS5cclxuICpcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIudXRpbCcsIFsnbmcnXSk7XHJcblxyXG4vKipcclxuICogQG5nZG9jIG92ZXJ2aWV3XHJcbiAqIEBuYW1lIHVpLnJvdXRlci5yb3V0ZXJcclxuICogXHJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIudXRpbFxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyB1aS5yb3V0ZXIucm91dGVyIHN1Yi1tb2R1bGVcclxuICpcclxuICogVGhpcyBtb2R1bGUgaXMgYSBkZXBlbmRlbmN5IG9mIG90aGVyIHN1Yi1tb2R1bGVzLiBEbyBub3QgaW5jbHVkZSB0aGlzIG1vZHVsZSBhcyBhIGRlcGVuZGVuY3lcclxuICogaW4geW91ciBhbmd1bGFyIGFwcCAodXNlIHtAbGluayB1aS5yb3V0ZXJ9IG1vZHVsZSBpbnN0ZWFkKS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIucm91dGVyJywgWyd1aS5yb3V0ZXIudXRpbCddKTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2Mgb3ZlcnZpZXdcclxuICogQG5hbWUgdWkucm91dGVyLnN0YXRlXHJcbiAqIFxyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnJvdXRlclxyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnV0aWxcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgdWkucm91dGVyLnN0YXRlIHN1Yi1tb2R1bGVcclxuICpcclxuICogVGhpcyBtb2R1bGUgaXMgYSBkZXBlbmRlbmN5IG9mIHRoZSBtYWluIHVpLnJvdXRlciBtb2R1bGUuIERvIG5vdCBpbmNsdWRlIHRoaXMgbW9kdWxlIGFzIGEgZGVwZW5kZW5jeVxyXG4gKiBpbiB5b3VyIGFuZ3VsYXIgYXBwICh1c2Uge0BsaW5rIHVpLnJvdXRlcn0gbW9kdWxlIGluc3RlYWQpLlxyXG4gKiBcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuc3RhdGUnLCBbJ3VpLnJvdXRlci5yb3V0ZXInLCAndWkucm91dGVyLnV0aWwnXSk7XHJcblxyXG4vKipcclxuICogQG5nZG9jIG92ZXJ2aWV3XHJcbiAqIEBuYW1lIHVpLnJvdXRlclxyXG4gKlxyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIHVpLnJvdXRlclxyXG4gKiBcclxuICogIyMgVGhlIG1haW4gbW9kdWxlIGZvciB1aS5yb3V0ZXIgXHJcbiAqIFRoZXJlIGFyZSBzZXZlcmFsIHN1Yi1tb2R1bGVzIGluY2x1ZGVkIHdpdGggdGhlIHVpLnJvdXRlciBtb2R1bGUsIGhvd2V2ZXIgb25seSB0aGlzIG1vZHVsZSBpcyBuZWVkZWRcclxuICogYXMgYSBkZXBlbmRlbmN5IHdpdGhpbiB5b3VyIGFuZ3VsYXIgYXBwLiBUaGUgb3RoZXIgbW9kdWxlcyBhcmUgZm9yIG9yZ2FuaXphdGlvbiBwdXJwb3Nlcy4gXHJcbiAqXHJcbiAqIFRoZSBtb2R1bGVzIGFyZTpcclxuICogKiB1aS5yb3V0ZXIgLSB0aGUgbWFpbiBcInVtYnJlbGxhXCIgbW9kdWxlXHJcbiAqICogdWkucm91dGVyLnJvdXRlciAtIFxyXG4gKiBcclxuICogKllvdSdsbCBuZWVkIHRvIGluY2x1ZGUgKipvbmx5KiogdGhpcyBtb2R1bGUgYXMgdGhlIGRlcGVuZGVuY3kgd2l0aGluIHlvdXIgYW5ndWxhciBhcHAuKlxyXG4gKiBcclxuICogPHByZT5cclxuICogPCFkb2N0eXBlIGh0bWw+XHJcbiAqIDxodG1sIG5nLWFwcD1cIm15QXBwXCI+XHJcbiAqIDxoZWFkPlxyXG4gKiAgIDxzY3JpcHQgc3JjPVwianMvYW5ndWxhci5qc1wiPjwvc2NyaXB0PlxyXG4gKiAgIDwhLS0gSW5jbHVkZSB0aGUgdWktcm91dGVyIHNjcmlwdCAtLT5cclxuICogICA8c2NyaXB0IHNyYz1cImpzL2FuZ3VsYXItdWktcm91dGVyLm1pbi5qc1wiPjwvc2NyaXB0PlxyXG4gKiAgIDxzY3JpcHQ+XHJcbiAqICAgICAvLyAuLi5hbmQgYWRkICd1aS5yb3V0ZXInIGFzIGEgZGVwZW5kZW5jeVxyXG4gKiAgICAgdmFyIG15QXBwID0gYW5ndWxhci5tb2R1bGUoJ215QXBwJywgWyd1aS5yb3V0ZXInXSk7XHJcbiAqICAgPC9zY3JpcHQ+XHJcbiAqIDwvaGVhZD5cclxuICogPGJvZHk+XHJcbiAqIDwvYm9keT5cclxuICogPC9odG1sPlxyXG4gKiA8L3ByZT5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXInLCBbJ3VpLnJvdXRlci5zdGF0ZSddKTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuY29tcGF0JywgWyd1aS5yb3V0ZXInXSk7XHJcblxyXG4vKipcclxuICogQG5nZG9jIG9iamVjdFxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kcmVzb2x2ZVxyXG4gKlxyXG4gKiBAcmVxdWlyZXMgJHFcclxuICogQHJlcXVpcmVzICRpbmplY3RvclxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogTWFuYWdlcyByZXNvbHV0aW9uIG9mIChhY3ljbGljKSBncmFwaHMgb2YgcHJvbWlzZXMuXHJcbiAqL1xyXG4kUmVzb2x2ZS4kaW5qZWN0ID0gWyckcScsICckaW5qZWN0b3InXTtcclxuZnVuY3Rpb24gJFJlc29sdmUoICAkcSwgICAgJGluamVjdG9yKSB7XHJcbiAgXHJcbiAgdmFyIFZJU0lUX0lOX1BST0dSRVNTID0gMSxcclxuICAgICAgVklTSVRfRE9ORSA9IDIsXHJcbiAgICAgIE5PVEhJTkcgPSB7fSxcclxuICAgICAgTk9fREVQRU5ERU5DSUVTID0gW10sXHJcbiAgICAgIE5PX0xPQ0FMUyA9IE5PVEhJTkcsXHJcbiAgICAgIE5PX1BBUkVOVCA9IGV4dGVuZCgkcS53aGVuKE5PVEhJTkcpLCB7ICQkcHJvbWlzZXM6IE5PVEhJTkcsICQkdmFsdWVzOiBOT1RISU5HIH0pO1xyXG4gIFxyXG5cclxuICAvKipcclxuICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kcmVzb2x2ZSNzdHVkeVxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kcmVzb2x2ZVxyXG4gICAqXHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogU3R1ZGllcyBhIHNldCBvZiBpbnZvY2FibGVzIHRoYXQgYXJlIGxpa2VseSB0byBiZSB1c2VkIG11bHRpcGxlIHRpbWVzLlxyXG4gICAqIDxwcmU+XHJcbiAgICogJHJlc29sdmUuc3R1ZHkoaW52b2NhYmxlcykobG9jYWxzLCBwYXJlbnQsIHNlbGYpXHJcbiAgICogPC9wcmU+XHJcbiAgICogaXMgZXF1aXZhbGVudCB0b1xyXG4gICAqIDxwcmU+XHJcbiAgICogJHJlc29sdmUucmVzb2x2ZShpbnZvY2FibGVzLCBsb2NhbHMsIHBhcmVudCwgc2VsZilcclxuICAgKiA8L3ByZT5cclxuICAgKiBidXQgdGhlIGZvcm1lciBpcyBtb3JlIGVmZmljaWVudCAoaW4gZmFjdCBgcmVzb2x2ZWAganVzdCBjYWxscyBgc3R1ZHlgIFxyXG4gICAqIGludGVybmFsbHkpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IGludm9jYWJsZXMgSW52b2NhYmxlIG9iamVjdHNcclxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0byBwYXNzIGluIGxvY2FscywgcGFyZW50IGFuZCBzZWxmXHJcbiAgICovXHJcbiAgdGhpcy5zdHVkeSA9IGZ1bmN0aW9uIChpbnZvY2FibGVzKSB7XHJcbiAgICBpZiAoIWlzT2JqZWN0KGludm9jYWJsZXMpKSB0aHJvdyBuZXcgRXJyb3IoXCInaW52b2NhYmxlcycgbXVzdCBiZSBhbiBvYmplY3RcIik7XHJcbiAgICB2YXIgaW52b2NhYmxlS2V5cyA9IG9iamVjdEtleXMoaW52b2NhYmxlcyB8fCB7fSk7XHJcbiAgICBcclxuICAgIC8vIFBlcmZvcm0gYSB0b3BvbG9naWNhbCBzb3J0IG9mIGludm9jYWJsZXMgdG8gYnVpbGQgYW4gb3JkZXJlZCBwbGFuXHJcbiAgICB2YXIgcGxhbiA9IFtdLCBjeWNsZSA9IFtdLCB2aXNpdGVkID0ge307XHJcbiAgICBmdW5jdGlvbiB2aXNpdCh2YWx1ZSwga2V5KSB7XHJcbiAgICAgIGlmICh2aXNpdGVkW2tleV0gPT09IFZJU0lUX0RPTkUpIHJldHVybjtcclxuICAgICAgXHJcbiAgICAgIGN5Y2xlLnB1c2goa2V5KTtcclxuICAgICAgaWYgKHZpc2l0ZWRba2V5XSA9PT0gVklTSVRfSU5fUFJPR1JFU1MpIHtcclxuICAgICAgICBjeWNsZS5zcGxpY2UoMCwgaW5kZXhPZihjeWNsZSwga2V5KSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3ljbGljIGRlcGVuZGVuY3k6IFwiICsgY3ljbGUuam9pbihcIiAtPiBcIikpO1xyXG4gICAgICB9XHJcbiAgICAgIHZpc2l0ZWRba2V5XSA9IFZJU0lUX0lOX1BST0dSRVNTO1xyXG4gICAgICBcclxuICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgIHBsYW4ucHVzaChrZXksIFsgZnVuY3Rpb24oKSB7IHJldHVybiAkaW5qZWN0b3IuZ2V0KHZhbHVlKTsgfV0sIE5PX0RFUEVOREVOQ0lFUyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICRpbmplY3Rvci5hbm5vdGF0ZSh2YWx1ZSk7XHJcbiAgICAgICAgZm9yRWFjaChwYXJhbXMsIGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICAgICAgaWYgKHBhcmFtICE9PSBrZXkgJiYgaW52b2NhYmxlcy5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHZpc2l0KGludm9jYWJsZXNbcGFyYW1dLCBwYXJhbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcGxhbi5wdXNoKGtleSwgdmFsdWUsIHBhcmFtcyk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGN5Y2xlLnBvcCgpO1xyXG4gICAgICB2aXNpdGVkW2tleV0gPSBWSVNJVF9ET05FO1xyXG4gICAgfVxyXG4gICAgZm9yRWFjaChpbnZvY2FibGVzLCB2aXNpdCk7XHJcbiAgICBpbnZvY2FibGVzID0gY3ljbGUgPSB2aXNpdGVkID0gbnVsbDsgLy8gcGxhbiBpcyBhbGwgdGhhdCdzIHJlcXVpcmVkXHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIGlzUmVzb2x2ZSh2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gaXNPYmplY3QodmFsdWUpICYmIHZhbHVlLnRoZW4gJiYgdmFsdWUuJCRwcm9taXNlcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChsb2NhbHMsIHBhcmVudCwgc2VsZikge1xyXG4gICAgICBpZiAoaXNSZXNvbHZlKGxvY2FscykgJiYgc2VsZiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc2VsZiA9IHBhcmVudDsgcGFyZW50ID0gbG9jYWxzOyBsb2NhbHMgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghbG9jYWxzKSBsb2NhbHMgPSBOT19MT0NBTFM7XHJcbiAgICAgIGVsc2UgaWYgKCFpc09iamVjdChsb2NhbHMpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2xvY2FscycgbXVzdCBiZSBhbiBvYmplY3RcIik7XHJcbiAgICAgIH0gICAgICAgXHJcbiAgICAgIGlmICghcGFyZW50KSBwYXJlbnQgPSBOT19QQVJFTlQ7XHJcbiAgICAgIGVsc2UgaWYgKCFpc1Jlc29sdmUocGFyZW50KSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIidwYXJlbnQnIG11c3QgYmUgYSBwcm9taXNlIHJldHVybmVkIGJ5ICRyZXNvbHZlLnJlc29sdmUoKVwiKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gVG8gY29tcGxldGUgdGhlIG92ZXJhbGwgcmVzb2x1dGlvbiwgd2UgaGF2ZSB0byB3YWl0IGZvciB0aGUgcGFyZW50XHJcbiAgICAgIC8vIHByb21pc2UgYW5kIGZvciB0aGUgcHJvbWlzZSBmb3IgZWFjaCBpbnZva2FibGUgaW4gb3VyIHBsYW4uXHJcbiAgICAgIHZhciByZXNvbHV0aW9uID0gJHEuZGVmZXIoKSxcclxuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdXRpb24ucHJvbWlzZSxcclxuICAgICAgICAgIHByb21pc2VzID0gcmVzdWx0LiQkcHJvbWlzZXMgPSB7fSxcclxuICAgICAgICAgIHZhbHVlcyA9IGV4dGVuZCh7fSwgbG9jYWxzKSxcclxuICAgICAgICAgIHdhaXQgPSAxICsgcGxhbi5sZW5ndGgvMyxcclxuICAgICAgICAgIG1lcmdlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgXHJcbiAgICAgIGZ1bmN0aW9uIGRvbmUoKSB7XHJcbiAgICAgICAgLy8gTWVyZ2UgcGFyZW50IHZhbHVlcyB3ZSBoYXZlbid0IGdvdCB5ZXQgYW5kIHB1Ymxpc2ggb3VyIG93biAkJHZhbHVlc1xyXG4gICAgICAgIGlmICghLS13YWl0KSB7XHJcbiAgICAgICAgICBpZiAoIW1lcmdlZCkgbWVyZ2UodmFsdWVzLCBwYXJlbnQuJCR2YWx1ZXMpOyBcclxuICAgICAgICAgIHJlc3VsdC4kJHZhbHVlcyA9IHZhbHVlcztcclxuICAgICAgICAgIHJlc3VsdC4kJHByb21pc2VzID0gcmVzdWx0LiQkcHJvbWlzZXMgfHwgdHJ1ZTsgLy8ga2VlcCBmb3IgaXNSZXNvbHZlKClcclxuICAgICAgICAgIGRlbGV0ZSByZXN1bHQuJCRpbmhlcml0ZWRWYWx1ZXM7XHJcbiAgICAgICAgICByZXNvbHV0aW9uLnJlc29sdmUodmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGZ1bmN0aW9uIGZhaWwocmVhc29uKSB7XHJcbiAgICAgICAgcmVzdWx0LiQkZmFpbHVyZSA9IHJlYXNvbjtcclxuICAgICAgICByZXNvbHV0aW9uLnJlamVjdChyZWFzb24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTaG9ydC1jaXJjdWl0IGlmIHBhcmVudCBoYXMgYWxyZWFkeSBmYWlsZWRcclxuICAgICAgaWYgKGlzRGVmaW5lZChwYXJlbnQuJCRmYWlsdXJlKSkge1xyXG4gICAgICAgIGZhaWwocGFyZW50LiQkZmFpbHVyZSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgaWYgKHBhcmVudC4kJGluaGVyaXRlZFZhbHVlcykge1xyXG4gICAgICAgIG1lcmdlKHZhbHVlcywgb21pdChwYXJlbnQuJCRpbmhlcml0ZWRWYWx1ZXMsIGludm9jYWJsZUtleXMpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTWVyZ2UgcGFyZW50IHZhbHVlcyBpZiB0aGUgcGFyZW50IGhhcyBhbHJlYWR5IHJlc29sdmVkLCBvciBtZXJnZVxyXG4gICAgICAvLyBwYXJlbnQgcHJvbWlzZXMgYW5kIHdhaXQgaWYgdGhlIHBhcmVudCByZXNvbHZlIGlzIHN0aWxsIGluIHByb2dyZXNzLlxyXG4gICAgICBleHRlbmQocHJvbWlzZXMsIHBhcmVudC4kJHByb21pc2VzKTtcclxuICAgICAgaWYgKHBhcmVudC4kJHZhbHVlcykge1xyXG4gICAgICAgIG1lcmdlZCA9IG1lcmdlKHZhbHVlcywgb21pdChwYXJlbnQuJCR2YWx1ZXMsIGludm9jYWJsZUtleXMpKTtcclxuICAgICAgICByZXN1bHQuJCRpbmhlcml0ZWRWYWx1ZXMgPSBvbWl0KHBhcmVudC4kJHZhbHVlcywgaW52b2NhYmxlS2V5cyk7XHJcbiAgICAgICAgZG9uZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChwYXJlbnQuJCRpbmhlcml0ZWRWYWx1ZXMpIHtcclxuICAgICAgICAgIHJlc3VsdC4kJGluaGVyaXRlZFZhbHVlcyA9IG9taXQocGFyZW50LiQkaW5oZXJpdGVkVmFsdWVzLCBpbnZvY2FibGVLZXlzKTtcclxuICAgICAgICB9ICAgICAgICBcclxuICAgICAgICBwYXJlbnQudGhlbihkb25lLCBmYWlsKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gUHJvY2VzcyBlYWNoIGludm9jYWJsZSBpbiB0aGUgcGxhbiwgYnV0IGlnbm9yZSBhbnkgd2hlcmUgYSBsb2NhbCBvZiB0aGUgc2FtZSBuYW1lIGV4aXN0cy5cclxuICAgICAgZm9yICh2YXIgaT0wLCBpaT1wbGFuLmxlbmd0aDsgaTxpaTsgaSs9Mykge1xyXG4gICAgICAgIGlmIChsb2NhbHMuaGFzT3duUHJvcGVydHkocGxhbltpXSkpIGRvbmUoKTtcclxuICAgICAgICBlbHNlIGludm9rZShwbGFuW2ldLCBwbGFuW2krMV0sIHBsYW5baSsyXSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGZ1bmN0aW9uIGludm9rZShrZXksIGludm9jYWJsZSwgcGFyYW1zKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGEgZGVmZXJyZWQgZm9yIHRoaXMgaW52b2NhdGlvbi4gRmFpbHVyZXMgd2lsbCBwcm9wYWdhdGUgdG8gdGhlIHJlc29sdXRpb24gYXMgd2VsbC5cclxuICAgICAgICB2YXIgaW52b2NhdGlvbiA9ICRxLmRlZmVyKCksIHdhaXRQYXJhbXMgPSAwO1xyXG4gICAgICAgIGZ1bmN0aW9uIG9uZmFpbHVyZShyZWFzb24pIHtcclxuICAgICAgICAgIGludm9jYXRpb24ucmVqZWN0KHJlYXNvbik7XHJcbiAgICAgICAgICBmYWlsKHJlYXNvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFdhaXQgZm9yIGFueSBwYXJhbWV0ZXIgdGhhdCB3ZSBoYXZlIGEgcHJvbWlzZSBmb3IgKGVpdGhlciBmcm9tIHBhcmVudCBvciBmcm9tIHRoaXNcclxuICAgICAgICAvLyByZXNvbHZlOyBpbiB0aGF0IGNhc2Ugc3R1ZHkoKSB3aWxsIGhhdmUgbWFkZSBzdXJlIGl0J3Mgb3JkZXJlZCBiZWZvcmUgdXMgaW4gdGhlIHBsYW4pLlxyXG4gICAgICAgIGZvckVhY2gocGFyYW1zLCBmdW5jdGlvbiAoZGVwKSB7XHJcbiAgICAgICAgICBpZiAocHJvbWlzZXMuaGFzT3duUHJvcGVydHkoZGVwKSAmJiAhbG9jYWxzLmhhc093blByb3BlcnR5KGRlcCkpIHtcclxuICAgICAgICAgICAgd2FpdFBhcmFtcysrO1xyXG4gICAgICAgICAgICBwcm9taXNlc1tkZXBdLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgIHZhbHVlc1tkZXBdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgIGlmICghKC0td2FpdFBhcmFtcykpIHByb2NlZWQoKTtcclxuICAgICAgICAgICAgfSwgb25mYWlsdXJlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoIXdhaXRQYXJhbXMpIHByb2NlZWQoKTtcclxuICAgICAgICBmdW5jdGlvbiBwcm9jZWVkKCkge1xyXG4gICAgICAgICAgaWYgKGlzRGVmaW5lZChyZXN1bHQuJCRmYWlsdXJlKSkgcmV0dXJuO1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaW52b2NhdGlvbi5yZXNvbHZlKCRpbmplY3Rvci5pbnZva2UoaW52b2NhYmxlLCBzZWxmLCB2YWx1ZXMpKTtcclxuICAgICAgICAgICAgaW52b2NhdGlvbi5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgIHZhbHVlc1trZXldID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgIGRvbmUoKTtcclxuICAgICAgICAgICAgfSwgb25mYWlsdXJlKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgb25mYWlsdXJlKGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQdWJsaXNoIHByb21pc2Ugc3luY2hyb25vdXNseTsgaW52b2NhdGlvbnMgZnVydGhlciBkb3duIGluIHRoZSBwbGFuIG1heSBkZXBlbmQgb24gaXQuXHJcbiAgICAgICAgcHJvbWlzZXNba2V5XSA9IGludm9jYXRpb24ucHJvbWlzZTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcbiAgfTtcclxuICBcclxuICAvKipcclxuICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kcmVzb2x2ZSNyZXNvbHZlXHJcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiRyZXNvbHZlXHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBSZXNvbHZlcyBhIHNldCBvZiBpbnZvY2FibGVzLiBBbiBpbnZvY2FibGUgaXMgYSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHZpYSBcclxuICAgKiBgJGluamVjdG9yLmludm9rZSgpYCwgYW5kIGNhbiBoYXZlIGFuIGFyYml0cmFyeSBudW1iZXIgb2YgZGVwZW5kZW5jaWVzLiBcclxuICAgKiBBbiBpbnZvY2FibGUgY2FuIGVpdGhlciByZXR1cm4gYSB2YWx1ZSBkaXJlY3RseSxcclxuICAgKiBvciBhIGAkcWAgcHJvbWlzZS4gSWYgYSBwcm9taXNlIGlzIHJldHVybmVkIGl0IHdpbGwgYmUgcmVzb2x2ZWQgYW5kIHRoZSBcclxuICAgKiByZXN1bHRpbmcgdmFsdWUgd2lsbCBiZSB1c2VkIGluc3RlYWQuIERlcGVuZGVuY2llcyBvZiBpbnZvY2FibGVzIGFyZSByZXNvbHZlZCBcclxuICAgKiAoaW4gdGhpcyBvcmRlciBvZiBwcmVjZWRlbmNlKVxyXG4gICAqXHJcbiAgICogLSBmcm9tIHRoZSBzcGVjaWZpZWQgYGxvY2Fsc2BcclxuICAgKiAtIGZyb20gYW5vdGhlciBpbnZvY2FibGUgdGhhdCBpcyBwYXJ0IG9mIHRoaXMgYCRyZXNvbHZlYCBjYWxsXHJcbiAgICogLSBmcm9tIGFuIGludm9jYWJsZSB0aGF0IGlzIGluaGVyaXRlZCBmcm9tIGEgYHBhcmVudGAgY2FsbCB0byBgJHJlc29sdmVgIFxyXG4gICAqICAgKG9yIHJlY3Vyc2l2ZWx5XHJcbiAgICogLSBmcm9tIGFueSBhbmNlc3RvciBgJHJlc29sdmVgIG9mIHRoYXQgcGFyZW50KS5cclxuICAgKlxyXG4gICAqIFRoZSByZXR1cm4gdmFsdWUgb2YgYCRyZXNvbHZlYCBpcyBhIHByb21pc2UgZm9yIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIFxyXG4gICAqIChpbiB0aGlzIG9yZGVyIG9mIHByZWNlZGVuY2UpXHJcbiAgICpcclxuICAgKiAtIGFueSBgbG9jYWxzYCAoaWYgc3BlY2lmaWVkKVxyXG4gICAqIC0gdGhlIHJlc29sdmVkIHJldHVybiB2YWx1ZXMgb2YgYWxsIGluamVjdGFibGVzXHJcbiAgICogLSBhbnkgdmFsdWVzIGluaGVyaXRlZCBmcm9tIGEgYHBhcmVudGAgY2FsbCB0byBgJHJlc29sdmVgIChpZiBzcGVjaWZpZWQpXHJcbiAgICpcclxuICAgKiBUaGUgcHJvbWlzZSB3aWxsIHJlc29sdmUgYWZ0ZXIgdGhlIGBwYXJlbnRgIHByb21pc2UgKGlmIGFueSkgYW5kIGFsbCBwcm9taXNlcyBcclxuICAgKiByZXR1cm5lZCBieSBpbmplY3RhYmxlcyBoYXZlIGJlZW4gcmVzb2x2ZWQuIElmIGFueSBpbnZvY2FibGUgXHJcbiAgICogKG9yIGAkaW5qZWN0b3IuaW52b2tlYCkgdGhyb3dzIGFuIGV4Y2VwdGlvbiwgb3IgaWYgYSBwcm9taXNlIHJldHVybmVkIGJ5IGFuIFxyXG4gICAqIGludm9jYWJsZSBpcyByZWplY3RlZCwgdGhlIGAkcmVzb2x2ZWAgcHJvbWlzZSBpcyBpbW1lZGlhdGVseSByZWplY3RlZCB3aXRoIHRoZSBcclxuICAgKiBzYW1lIGVycm9yLiBBIHJlamVjdGlvbiBvZiBhIGBwYXJlbnRgIHByb21pc2UgKGlmIHNwZWNpZmllZCkgd2lsbCBsaWtld2lzZSBiZSBcclxuICAgKiBwcm9wYWdhdGVkIGltbWVkaWF0ZWx5LiBPbmNlIHRoZSBgJHJlc29sdmVgIHByb21pc2UgaGFzIGJlZW4gcmVqZWN0ZWQsIG5vIFxyXG4gICAqIGZ1cnRoZXIgaW52b2NhYmxlcyB3aWxsIGJlIGNhbGxlZC5cclxuICAgKiBcclxuICAgKiBDeWNsaWMgZGVwZW5kZW5jaWVzIGJldHdlZW4gaW52b2NhYmxlcyBhcmUgbm90IHBlcm1pdHRlZCBhbmQgd2lsbCBjYXVzZSBgJHJlc29sdmVgXHJcbiAgICogdG8gdGhyb3cgYW4gZXJyb3IuIEFzIGEgc3BlY2lhbCBjYXNlLCBhbiBpbmplY3RhYmxlIGNhbiBkZXBlbmQgb24gYSBwYXJhbWV0ZXIgXHJcbiAgICogd2l0aCB0aGUgc2FtZSBuYW1lIGFzIHRoZSBpbmplY3RhYmxlLCB3aGljaCB3aWxsIGJlIGZ1bGZpbGxlZCBmcm9tIHRoZSBgcGFyZW50YCBcclxuICAgKiBpbmplY3RhYmxlIG9mIHRoZSBzYW1lIG5hbWUuIFRoaXMgYWxsb3dzIGluaGVyaXRlZCB2YWx1ZXMgdG8gYmUgZGVjb3JhdGVkLiBcclxuICAgKiBOb3RlIHRoYXQgaW4gdGhpcyBjYXNlIGFueSBvdGhlciBpbmplY3RhYmxlIGluIHRoZSBzYW1lIGAkcmVzb2x2ZWAgd2l0aCB0aGUgc2FtZVxyXG4gICAqIGRlcGVuZGVuY3kgd291bGQgc2VlIHRoZSBkZWNvcmF0ZWQgdmFsdWUsIG5vdCB0aGUgaW5oZXJpdGVkIHZhbHVlLlxyXG4gICAqXHJcbiAgICogTm90ZSB0aGF0IG1pc3NpbmcgZGVwZW5kZW5jaWVzIC0tIHVubGlrZSBjeWNsaWMgZGVwZW5kZW5jaWVzIC0tIHdpbGwgY2F1c2UgYW4gXHJcbiAgICogKGFzeW5jaHJvbm91cykgcmVqZWN0aW9uIG9mIHRoZSBgJHJlc29sdmVgIHByb21pc2UgcmF0aGVyIHRoYW4gYSAoc3luY2hyb25vdXMpIFxyXG4gICAqIGV4Y2VwdGlvbi5cclxuICAgKlxyXG4gICAqIEludm9jYWJsZXMgYXJlIGludm9rZWQgZWFnZXJseSBhcyBzb29uIGFzIGFsbCBkZXBlbmRlbmNpZXMgYXJlIGF2YWlsYWJsZS4gXHJcbiAgICogVGhpcyBpcyB0cnVlIGV2ZW4gZm9yIGRlcGVuZGVuY2llcyBpbmhlcml0ZWQgZnJvbSBhIGBwYXJlbnRgIGNhbGwgdG8gYCRyZXNvbHZlYC5cclxuICAgKlxyXG4gICAqIEFzIGEgc3BlY2lhbCBjYXNlLCBhbiBpbnZvY2FibGUgY2FuIGJlIGEgc3RyaW5nLCBpbiB3aGljaCBjYXNlIGl0IGlzIHRha2VuIHRvIFxyXG4gICAqIGJlIGEgc2VydmljZSBuYW1lIHRvIGJlIHBhc3NlZCB0byBgJGluamVjdG9yLmdldCgpYC4gVGhpcyBpcyBzdXBwb3J0ZWQgcHJpbWFyaWx5IFxyXG4gICAqIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBgcmVzb2x2ZWAgcHJvcGVydHkgb2YgYCRyb3V0ZVByb3ZpZGVyYCBcclxuICAgKiByb3V0ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gaW52b2NhYmxlcyBmdW5jdGlvbnMgdG8gaW52b2tlIG9yIFxyXG4gICAqIGAkaW5qZWN0b3JgIHNlcnZpY2VzIHRvIGZldGNoLlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBsb2NhbHMgIHZhbHVlcyB0byBtYWtlIGF2YWlsYWJsZSB0byB0aGUgaW5qZWN0YWJsZXNcclxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyZW50ICBhIHByb21pc2UgcmV0dXJuZWQgYnkgYW5vdGhlciBjYWxsIHRvIGAkcmVzb2x2ZWAuXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHNlbGYgIHRoZSBgdGhpc2AgZm9yIHRoZSBpbnZva2VkIG1ldGhvZHNcclxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFByb21pc2UgZm9yIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSByZXNvbHZlZCByZXR1cm4gdmFsdWVcclxuICAgKiBvZiBhbGwgaW52b2NhYmxlcywgYXMgd2VsbCBhcyBhbnkgaW5oZXJpdGVkIGFuZCBsb2NhbCB2YWx1ZXMuXHJcbiAgICovXHJcbiAgdGhpcy5yZXNvbHZlID0gZnVuY3Rpb24gKGludm9jYWJsZXMsIGxvY2FscywgcGFyZW50LCBzZWxmKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdHVkeShpbnZvY2FibGVzKShsb2NhbHMsIHBhcmVudCwgc2VsZik7XHJcbiAgfTtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci51dGlsJykuc2VydmljZSgnJHJlc29sdmUnLCAkUmVzb2x2ZSk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBvYmplY3RcclxuICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHRlbXBsYXRlRmFjdG9yeVxyXG4gKlxyXG4gKiBAcmVxdWlyZXMgJGh0dHBcclxuICogQHJlcXVpcmVzICR0ZW1wbGF0ZUNhY2hlXHJcbiAqIEByZXF1aXJlcyAkaW5qZWN0b3JcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIFNlcnZpY2UuIE1hbmFnZXMgbG9hZGluZyBvZiB0ZW1wbGF0ZXMuXHJcbiAqL1xyXG4kVGVtcGxhdGVGYWN0b3J5LiRpbmplY3QgPSBbJyRodHRwJywgJyR0ZW1wbGF0ZUNhY2hlJywgJyRpbmplY3RvciddO1xyXG5mdW5jdGlvbiAkVGVtcGxhdGVGYWN0b3J5KCAgJGh0dHAsICAgJHRlbXBsYXRlQ2FjaGUsICAgJGluamVjdG9yKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnkjZnJvbUNvbmZpZ1xyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5XHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBDcmVhdGVzIGEgdGVtcGxhdGUgZnJvbSBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0LiBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHdoaWNoIHRvIGxvYWQgYSB0ZW1wbGF0ZS4gXHJcbiAgICogVGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzIGFyZSBzZWFyY2ggaW4gdGhlIHNwZWNpZmllZCBvcmRlciwgYW5kIHRoZSBmaXJzdCBvbmUgXHJcbiAgICogdGhhdCBpcyBkZWZpbmVkIGlzIHVzZWQgdG8gY3JlYXRlIHRoZSB0ZW1wbGF0ZTpcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gY29uZmlnLnRlbXBsYXRlIGh0bWwgc3RyaW5nIHRlbXBsYXRlIG9yIGZ1bmN0aW9uIHRvIFxyXG4gICAqIGxvYWQgdmlhIHtAbGluayB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5I2Zyb21TdHJpbmcgZnJvbVN0cmluZ30uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBjb25maWcudGVtcGxhdGVVcmwgdXJsIHRvIGxvYWQgb3IgYSBmdW5jdGlvbiByZXR1cm5pbmcgXHJcbiAgICogdGhlIHVybCB0byBsb2FkIHZpYSB7QGxpbmsgdWkucm91dGVyLnV0aWwuJHRlbXBsYXRlRmFjdG9yeSNmcm9tVXJsIGZyb21Vcmx9LlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbmZpZy50ZW1wbGF0ZVByb3ZpZGVyIGZ1bmN0aW9uIHRvIGludm9rZSB2aWEgXHJcbiAgICoge0BsaW5rIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnkjZnJvbVByb3ZpZGVyIGZyb21Qcm92aWRlcn0uXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAgUGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbi5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gbG9jYWxzIExvY2FscyB0byBwYXNzIHRvIGBpbnZva2VgIGlmIHRoZSB0ZW1wbGF0ZSBpcyBsb2FkZWQgXHJcbiAgICogdmlhIGEgYHRlbXBsYXRlUHJvdmlkZXJgLiBEZWZhdWx0cyB0byBgeyBwYXJhbXM6IHBhcmFtcyB9YC5cclxuICAgKlxyXG4gICAqIEByZXR1cm4ge3N0cmluZ3xvYmplY3R9ICBUaGUgdGVtcGxhdGUgaHRtbCBhcyBhIHN0cmluZywgb3IgYSBwcm9taXNlIGZvciBcclxuICAgKiB0aGF0IHN0cmluZyxvciBgbnVsbGAgaWYgbm8gdGVtcGxhdGUgaXMgY29uZmlndXJlZC5cclxuICAgKi9cclxuICB0aGlzLmZyb21Db25maWcgPSBmdW5jdGlvbiAoY29uZmlnLCBwYXJhbXMsIGxvY2Fscykge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgaXNEZWZpbmVkKGNvbmZpZy50ZW1wbGF0ZSkgPyB0aGlzLmZyb21TdHJpbmcoY29uZmlnLnRlbXBsYXRlLCBwYXJhbXMpIDpcclxuICAgICAgaXNEZWZpbmVkKGNvbmZpZy50ZW1wbGF0ZVVybCkgPyB0aGlzLmZyb21VcmwoY29uZmlnLnRlbXBsYXRlVXJsLCBwYXJhbXMpIDpcclxuICAgICAgaXNEZWZpbmVkKGNvbmZpZy50ZW1wbGF0ZVByb3ZpZGVyKSA/IHRoaXMuZnJvbVByb3ZpZGVyKGNvbmZpZy50ZW1wbGF0ZVByb3ZpZGVyLCBwYXJhbXMsIGxvY2FscykgOlxyXG4gICAgICBudWxsXHJcbiAgICApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnkjZnJvbVN0cmluZ1xyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5XHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBDcmVhdGVzIGEgdGVtcGxhdGUgZnJvbSBhIHN0cmluZyBvciBhIGZ1bmN0aW9uIHJldHVybmluZyBhIHN0cmluZy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gdGVtcGxhdGUgaHRtbCB0ZW1wbGF0ZSBhcyBhIHN0cmluZyBvciBmdW5jdGlvbiB0aGF0IFxyXG4gICAqIHJldHVybnMgYW4gaHRtbCB0ZW1wbGF0ZSBhcyBhIHN0cmluZy5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgdGVtcGxhdGUgZnVuY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtzdHJpbmd8b2JqZWN0fSBUaGUgdGVtcGxhdGUgaHRtbCBhcyBhIHN0cmluZywgb3IgYSBwcm9taXNlIGZvciB0aGF0IFxyXG4gICAqIHN0cmluZy5cclxuICAgKi9cclxuICB0aGlzLmZyb21TdHJpbmcgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHBhcmFtcykge1xyXG4gICAgcmV0dXJuIGlzRnVuY3Rpb24odGVtcGxhdGUpID8gdGVtcGxhdGUocGFyYW1zKSA6IHRlbXBsYXRlO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnkjZnJvbVVybFxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5XHJcbiAgICogXHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogTG9hZHMgYSB0ZW1wbGF0ZSBmcm9tIHRoZSBhIFVSTCB2aWEgYCRodHRwYCBhbmQgYCR0ZW1wbGF0ZUNhY2hlYC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfEZ1bmN0aW9ufSB1cmwgdXJsIG9mIHRoZSB0ZW1wbGF0ZSB0byBsb2FkLCBvciBhIGZ1bmN0aW9uIFxyXG4gICAqIHRoYXQgcmV0dXJucyBhIHVybC5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgdXJsIGZ1bmN0aW9uLlxyXG4gICAqIEByZXR1cm4ge3N0cmluZ3xQcm9taXNlLjxzdHJpbmc+fSBUaGUgdGVtcGxhdGUgaHRtbCBhcyBhIHN0cmluZywgb3IgYSBwcm9taXNlIFxyXG4gICAqIGZvciB0aGF0IHN0cmluZy5cclxuICAgKi9cclxuICB0aGlzLmZyb21VcmwgPSBmdW5jdGlvbiAodXJsLCBwYXJhbXMpIHtcclxuICAgIGlmIChpc0Z1bmN0aW9uKHVybCkpIHVybCA9IHVybChwYXJhbXMpO1xyXG4gICAgaWYgKHVybCA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuICAgIGVsc2UgcmV0dXJuICRodHRwXHJcbiAgICAgICAgLmdldCh1cmwsIHsgY2FjaGU6ICR0ZW1wbGF0ZUNhY2hlLCBoZWFkZXJzOiB7IEFjY2VwdDogJ3RleHQvaHRtbCcgfX0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmV0dXJuIHJlc3BvbnNlLmRhdGE7IH0pO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnkjZnJvbVByb3ZpZGVyXHJcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnlcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIENyZWF0ZXMgYSB0ZW1wbGF0ZSBieSBpbnZva2luZyBhbiBpbmplY3RhYmxlIHByb3ZpZGVyIGZ1bmN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJvdmlkZXIgRnVuY3Rpb24gdG8gaW52b2tlIHZpYSBgJGluamVjdG9yLmludm9rZWBcclxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgZm9yIHRoZSB0ZW1wbGF0ZS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gbG9jYWxzIExvY2FscyB0byBwYXNzIHRvIGBpbnZva2VgLiBEZWZhdWx0cyB0byBcclxuICAgKiBgeyBwYXJhbXM6IHBhcmFtcyB9YC5cclxuICAgKiBAcmV0dXJuIHtzdHJpbmd8UHJvbWlzZS48c3RyaW5nPn0gVGhlIHRlbXBsYXRlIGh0bWwgYXMgYSBzdHJpbmcsIG9yIGEgcHJvbWlzZSBcclxuICAgKiBmb3IgdGhhdCBzdHJpbmcuXHJcbiAgICovXHJcbiAgdGhpcy5mcm9tUHJvdmlkZXIgPSBmdW5jdGlvbiAocHJvdmlkZXIsIHBhcmFtcywgbG9jYWxzKSB7XHJcbiAgICByZXR1cm4gJGluamVjdG9yLmludm9rZShwcm92aWRlciwgbnVsbCwgbG9jYWxzIHx8IHsgcGFyYW1zOiBwYXJhbXMgfSk7XHJcbiAgfTtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci51dGlsJykuc2VydmljZSgnJHRlbXBsYXRlRmFjdG9yeScsICRUZW1wbGF0ZUZhY3RvcnkpO1xyXG5cclxudmFyICQkVU1GUDsgLy8gcmVmZXJlbmNlIHRvICRVcmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyXHJcblxyXG4vKipcclxuICogQG5nZG9jIG9iamVjdFxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXJcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIE1hdGNoZXMgVVJMcyBhZ2FpbnN0IHBhdHRlcm5zIGFuZCBleHRyYWN0cyBuYW1lZCBwYXJhbWV0ZXJzIGZyb20gdGhlIHBhdGggb3IgdGhlIHNlYXJjaFxyXG4gKiBwYXJ0IG9mIHRoZSBVUkwuIEEgVVJMIHBhdHRlcm4gY29uc2lzdHMgb2YgYSBwYXRoIHBhdHRlcm4sIG9wdGlvbmFsbHkgZm9sbG93ZWQgYnkgJz8nIGFuZCBhIGxpc3RcclxuICogb2Ygc2VhcmNoIHBhcmFtZXRlcnMuIE11bHRpcGxlIHNlYXJjaCBwYXJhbWV0ZXIgbmFtZXMgYXJlIHNlcGFyYXRlZCBieSAnJicuIFNlYXJjaCBwYXJhbWV0ZXJzXHJcbiAqIGRvIG5vdCBpbmZsdWVuY2Ugd2hldGhlciBvciBub3QgYSBVUkwgaXMgbWF0Y2hlZCwgYnV0IHRoZWlyIHZhbHVlcyBhcmUgcGFzc2VkIHRocm91Z2ggaW50b1xyXG4gKiB0aGUgbWF0Y2hlZCBwYXJhbWV0ZXJzIHJldHVybmVkIGJ5IHtAbGluayB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIjbWV0aG9kc19leGVjIGV4ZWN9LlxyXG4gKlxyXG4gKiBQYXRoIHBhcmFtZXRlciBwbGFjZWhvbGRlcnMgY2FuIGJlIHNwZWNpZmllZCB1c2luZyBzaW1wbGUgY29sb24vY2F0Y2gtYWxsIHN5bnRheCBvciBjdXJseSBicmFjZVxyXG4gKiBzeW50YXgsIHdoaWNoIG9wdGlvbmFsbHkgYWxsb3dzIGEgcmVndWxhciBleHByZXNzaW9uIGZvciB0aGUgcGFyYW1ldGVyIHRvIGJlIHNwZWNpZmllZDpcclxuICpcclxuICogKiBgJzonYCBuYW1lIC0gY29sb24gcGxhY2Vob2xkZXJcclxuICogKiBgJyonYCBuYW1lIC0gY2F0Y2gtYWxsIHBsYWNlaG9sZGVyXHJcbiAqICogYCd7JyBuYW1lICd9J2AgLSBjdXJseSBwbGFjZWhvbGRlclxyXG4gKiAqIGAneycgbmFtZSAnOicgcmVnZXhwfHR5cGUgJ30nYCAtIGN1cmx5IHBsYWNlaG9sZGVyIHdpdGggcmVnZXhwIG9yIHR5cGUgbmFtZS4gU2hvdWxkIHRoZVxyXG4gKiAgIHJlZ2V4cCBpdHNlbGYgY29udGFpbiBjdXJseSBicmFjZXMsIHRoZXkgbXVzdCBiZSBpbiBtYXRjaGVkIHBhaXJzIG9yIGVzY2FwZWQgd2l0aCBhIGJhY2tzbGFzaC5cclxuICpcclxuICogUGFyYW1ldGVyIG5hbWVzIG1heSBjb250YWluIG9ubHkgd29yZCBjaGFyYWN0ZXJzIChsYXRpbiBsZXR0ZXJzLCBkaWdpdHMsIGFuZCB1bmRlcnNjb3JlKSBhbmRcclxuICogbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXR0ZXJuIChhY3Jvc3MgYm90aCBwYXRoIGFuZCBzZWFyY2ggcGFyYW1ldGVycykuIEZvciBjb2xvblxyXG4gKiBwbGFjZWhvbGRlcnMgb3IgY3VybHkgcGxhY2Vob2xkZXJzIHdpdGhvdXQgYW4gZXhwbGljaXQgcmVnZXhwLCBhIHBhdGggcGFyYW1ldGVyIG1hdGNoZXMgYW55XHJcbiAqIG51bWJlciBvZiBjaGFyYWN0ZXJzIG90aGVyIHRoYW4gJy8nLiBGb3IgY2F0Y2gtYWxsIHBsYWNlaG9sZGVycyB0aGUgcGF0aCBwYXJhbWV0ZXIgbWF0Y2hlc1xyXG4gKiBhbnkgbnVtYmVyIG9mIGNoYXJhY3RlcnMuXHJcbiAqXHJcbiAqIEV4YW1wbGVzOlxyXG4gKlxyXG4gKiAqIGAnL2hlbGxvLydgIC0gTWF0Y2hlcyBvbmx5IGlmIHRoZSBwYXRoIGlzIGV4YWN0bHkgJy9oZWxsby8nLiBUaGVyZSBpcyBubyBzcGVjaWFsIHRyZWF0bWVudCBmb3JcclxuICogICB0cmFpbGluZyBzbGFzaGVzLCBhbmQgcGF0dGVybnMgaGF2ZSB0byBtYXRjaCB0aGUgZW50aXJlIHBhdGgsIG5vdCBqdXN0IGEgcHJlZml4LlxyXG4gKiAqIGAnL3VzZXIvOmlkJ2AgLSBNYXRjaGVzICcvdXNlci9ib2InIG9yICcvdXNlci8xMjM0ISEhJyBvciBldmVuICcvdXNlci8nIGJ1dCBub3QgJy91c2VyJyBvclxyXG4gKiAgICcvdXNlci9ib2IvZGV0YWlscycuIFRoZSBzZWNvbmQgcGF0aCBzZWdtZW50IHdpbGwgYmUgY2FwdHVyZWQgYXMgdGhlIHBhcmFtZXRlciAnaWQnLlxyXG4gKiAqIGAnL3VzZXIve2lkfSdgIC0gU2FtZSBhcyB0aGUgcHJldmlvdXMgZXhhbXBsZSwgYnV0IHVzaW5nIGN1cmx5IGJyYWNlIHN5bnRheC5cclxuICogKiBgJy91c2VyL3tpZDpbXi9dKn0nYCAtIFNhbWUgYXMgdGhlIHByZXZpb3VzIGV4YW1wbGUuXHJcbiAqICogYCcvdXNlci97aWQ6WzAtOWEtZkEtRl17MSw4fX0nYCAtIFNpbWlsYXIgdG8gdGhlIHByZXZpb3VzIGV4YW1wbGUsIGJ1dCBvbmx5IG1hdGNoZXMgaWYgdGhlIGlkXHJcbiAqICAgcGFyYW1ldGVyIGNvbnNpc3RzIG9mIDEgdG8gOCBoZXggZGlnaXRzLlxyXG4gKiAqIGAnL2ZpbGVzL3twYXRoOi4qfSdgIC0gTWF0Y2hlcyBhbnkgVVJMIHN0YXJ0aW5nIHdpdGggJy9maWxlcy8nIGFuZCBjYXB0dXJlcyB0aGUgcmVzdCBvZiB0aGVcclxuICogICBwYXRoIGludG8gdGhlIHBhcmFtZXRlciAncGF0aCcuXHJcbiAqICogYCcvZmlsZXMvKnBhdGgnYCAtIGRpdHRvLlxyXG4gKiAqIGAnL2NhbGVuZGFyL3tzdGFydDpkYXRlfSdgIC0gTWF0Y2hlcyBcIi9jYWxlbmRhci8yMDE0LTExLTEyXCIgKGJlY2F1c2UgdGhlIHBhdHRlcm4gZGVmaW5lZFxyXG4gKiAgIGluIHRoZSBidWlsdC1pbiAgYGRhdGVgIFR5cGUgbWF0Y2hlcyBgMjAxNC0xMS0xMmApIGFuZCBwcm92aWRlcyBhIERhdGUgb2JqZWN0IGluICRzdGF0ZVBhcmFtcy5zdGFydFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0dGVybiAgVGhlIHBhdHRlcm4gdG8gY29tcGlsZSBpbnRvIGEgbWF0Y2hlci5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyAgQSBjb25maWd1cmF0aW9uIG9iamVjdCBoYXNoOlxyXG4gKiBAcGFyYW0ge09iamVjdD19IHBhcmVudE1hdGNoZXIgVXNlZCB0byBjb25jYXRlbmF0ZSB0aGUgcGF0dGVybi9jb25maWcgb250b1xyXG4gKiAgIGFuIGV4aXN0aW5nIFVybE1hdGNoZXJcclxuICpcclxuICogKiBgY2FzZUluc2Vuc2l0aXZlYCAtIGB0cnVlYCBpZiBVUkwgbWF0Y2hpbmcgc2hvdWxkIGJlIGNhc2UgaW5zZW5zaXRpdmUsIG90aGVyd2lzZSBgZmFsc2VgLCB0aGUgZGVmYXVsdCB2YWx1ZSAoZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkpIGlzIGBmYWxzZWAuXHJcbiAqICogYHN0cmljdGAgLSBgZmFsc2VgIGlmIG1hdGNoaW5nIGFnYWluc3QgYSBVUkwgd2l0aCBhIHRyYWlsaW5nIHNsYXNoIHNob3VsZCBiZSB0cmVhdGVkIGFzIGVxdWl2YWxlbnQgdG8gYSBVUkwgd2l0aG91dCBhIHRyYWlsaW5nIHNsYXNoLCB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgdHJ1ZWAuXHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwcmVmaXggIEEgc3RhdGljIHByZWZpeCBvZiB0aGlzIHBhdHRlcm4uIFRoZSBtYXRjaGVyIGd1YXJhbnRlZXMgdGhhdCBhbnlcclxuICogICBVUkwgbWF0Y2hpbmcgdGhpcyBtYXRjaGVyIChpLmUuIGFueSBzdHJpbmcgZm9yIHdoaWNoIHtAbGluayB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIjbWV0aG9kc19leGVjIGV4ZWMoKX0gcmV0dXJuc1xyXG4gKiAgIG5vbi1udWxsKSB3aWxsIHN0YXJ0IHdpdGggdGhpcyBwcmVmaXguXHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzb3VyY2UgIFRoZSBwYXR0ZXJuIHRoYXQgd2FzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxyXG4gKlxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gc291cmNlUGF0aCAgVGhlIHBhdGggcG9ydGlvbiBvZiB0aGUgc291cmNlIHByb3BlcnR5XHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzb3VyY2VTZWFyY2ggIFRoZSBzZWFyY2ggcG9ydGlvbiBvZiB0aGUgc291cmNlIHByb3BlcnR5XHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWdleCAgVGhlIGNvbnN0cnVjdGVkIHJlZ2V4IHRoYXQgd2lsbCBiZSB1c2VkIHRvIG1hdGNoIGFnYWluc3QgdGhlIHVybCB3aGVuXHJcbiAqICAgaXQgaXMgdGltZSB0byBkZXRlcm1pbmUgd2hpY2ggdXJsIHdpbGwgbWF0Y2guXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9ICBOZXcgYFVybE1hdGNoZXJgIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gVXJsTWF0Y2hlcihwYXR0ZXJuLCBjb25maWcsIHBhcmVudE1hdGNoZXIpIHtcclxuICBjb25maWcgPSBleHRlbmQoeyBwYXJhbXM6IHt9IH0sIGlzT2JqZWN0KGNvbmZpZykgPyBjb25maWcgOiB7fSk7XHJcblxyXG4gIC8vIEZpbmQgYWxsIHBsYWNlaG9sZGVycyBhbmQgY3JlYXRlIGEgY29tcGlsZWQgcGF0dGVybiwgdXNpbmcgZWl0aGVyIGNsYXNzaWMgb3IgY3VybHkgc3ludGF4OlxyXG4gIC8vICAgJyonIG5hbWVcclxuICAvLyAgICc6JyBuYW1lXHJcbiAgLy8gICAneycgbmFtZSAnfSdcclxuICAvLyAgICd7JyBuYW1lICc6JyByZWdleHAgJ30nXHJcbiAgLy8gVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBpcyBzb21ld2hhdCBjb21wbGljYXRlZCBkdWUgdG8gdGhlIG5lZWQgdG8gYWxsb3cgY3VybHkgYnJhY2VzXHJcbiAgLy8gaW5zaWRlIHRoZSByZWd1bGFyIGV4cHJlc3Npb24uIFRoZSBwbGFjZWhvbGRlciByZWdleHAgYnJlYWtzIGRvd24gYXMgZm9sbG93czpcclxuICAvLyAgICAoWzoqXSkoW1xcd1xcW1xcXV0rKSAgICAgICAgICAgICAgLSBjbGFzc2ljIHBsYWNlaG9sZGVyICgkMSAvICQyKSAoc2VhcmNoIHZlcnNpb24gaGFzIC0gZm9yIHNuYWtlLWNhc2UpXHJcbiAgLy8gICAgXFx7KFtcXHdcXFtcXF1dKykoPzpcXDpcXHMqKCAuLi4gKSk/XFx9ICAtIGN1cmx5IGJyYWNlIHBsYWNlaG9sZGVyICgkMykgd2l0aCBvcHRpb25hbCByZWdleHAvdHlwZSAuLi4gKCQ0KSAoc2VhcmNoIHZlcnNpb24gaGFzIC0gZm9yIHNuYWtlLWNhc2VcclxuICAvLyAgICAoPzogLi4uIHwgLi4uIHwgLi4uICkrICAgICAgICAgLSB0aGUgcmVnZXhwIGNvbnNpc3RzIG9mIGFueSBudW1iZXIgb2YgYXRvbXMsIGFuIGF0b20gYmVpbmcgZWl0aGVyXHJcbiAgLy8gICAgW157fVxcXFxdKyAgICAgICAgICAgICAgICAgICAgICAgLSBhbnl0aGluZyBvdGhlciB0aGFuIGN1cmx5IGJyYWNlcyBvciBiYWNrc2xhc2hcclxuICAvLyAgICBcXFxcLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIGEgYmFja3NsYXNoIGVzY2FwZVxyXG4gIC8vICAgIFxceyg/Oltee31cXFxcXSt8XFxcXC4pKlxcfSAgICAgICAgICAtIGEgbWF0Y2hlZCBzZXQgb2YgY3VybHkgYnJhY2VzIGNvbnRhaW5pbmcgb3RoZXIgYXRvbXNcclxuICB2YXIgcGxhY2Vob2xkZXIgICAgICAgPSAvKFs6Kl0pKFtcXHdcXFtcXF1dKyl8XFx7KFtcXHdcXFtcXF1dKykoPzpcXDpcXHMqKCg/Oltee31cXFxcXSt8XFxcXC58XFx7KD86W157fVxcXFxdK3xcXFxcLikqXFx9KSspKT9cXH0vZyxcclxuICAgICAgc2VhcmNoUGxhY2Vob2xkZXIgPSAvKFs6XT8pKFtcXHdcXFtcXF0uLV0rKXxcXHsoW1xcd1xcW1xcXS4tXSspKD86XFw6XFxzKigoPzpbXnt9XFxcXF0rfFxcXFwufFxceyg/Oltee31cXFxcXSt8XFxcXC4pKlxcfSkrKSk/XFx9L2csXHJcbiAgICAgIGNvbXBpbGVkID0gJ14nLCBsYXN0ID0gMCwgbSxcclxuICAgICAgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzID0gW10sXHJcbiAgICAgIHBhcmVudFBhcmFtcyA9IHBhcmVudE1hdGNoZXIgPyBwYXJlbnRNYXRjaGVyLnBhcmFtcyA6IHt9LFxyXG4gICAgICBwYXJhbXMgPSB0aGlzLnBhcmFtcyA9IHBhcmVudE1hdGNoZXIgPyBwYXJlbnRNYXRjaGVyLnBhcmFtcy4kJG5ldygpIDogbmV3ICQkVU1GUC5QYXJhbVNldCgpLFxyXG4gICAgICBwYXJhbU5hbWVzID0gW107XHJcblxyXG4gIGZ1bmN0aW9uIGFkZFBhcmFtZXRlcihpZCwgdHlwZSwgY29uZmlnLCBsb2NhdGlvbikge1xyXG4gICAgcGFyYW1OYW1lcy5wdXNoKGlkKTtcclxuICAgIGlmIChwYXJlbnRQYXJhbXNbaWRdKSByZXR1cm4gcGFyZW50UGFyYW1zW2lkXTtcclxuICAgIGlmICghL15cXHcrKFstLl0rXFx3KykqKD86XFxbXFxdKT8kLy50ZXN0KGlkKSkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBwYXJhbWV0ZXIgbmFtZSAnXCIgKyBpZCArIFwiJyBpbiBwYXR0ZXJuICdcIiArIHBhdHRlcm4gKyBcIidcIik7XHJcbiAgICBpZiAocGFyYW1zW2lkXSkgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlIHBhcmFtZXRlciBuYW1lICdcIiArIGlkICsgXCInIGluIHBhdHRlcm4gJ1wiICsgcGF0dGVybiArIFwiJ1wiKTtcclxuICAgIHBhcmFtc1tpZF0gPSBuZXcgJCRVTUZQLlBhcmFtKGlkLCB0eXBlLCBjb25maWcsIGxvY2F0aW9uKTtcclxuICAgIHJldHVybiBwYXJhbXNbaWRdO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcXVvdGVSZWdFeHAoc3RyaW5nLCBwYXR0ZXJuLCBzcXVhc2gsIG9wdGlvbmFsKSB7XHJcbiAgICB2YXIgc3Vycm91bmRQYXR0ZXJuID0gWycnLCcnXSwgcmVzdWx0ID0gc3RyaW5nLnJlcGxhY2UoL1tcXFxcXFxbXFxdXFxeJCorPy4oKXx7fV0vZywgXCJcXFxcJCZcIik7XHJcbiAgICBpZiAoIXBhdHRlcm4pIHJldHVybiByZXN1bHQ7XHJcbiAgICBzd2l0Y2goc3F1YXNoKSB7XHJcbiAgICAgIGNhc2UgZmFsc2U6IHN1cnJvdW5kUGF0dGVybiA9IFsnKCcsICcpJyArIChvcHRpb25hbCA/IFwiP1wiIDogXCJcIildOyBicmVhaztcclxuICAgICAgY2FzZSB0cnVlOlxyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9cXC8kLywgJycpO1xyXG4gICAgICAgIHN1cnJvdW5kUGF0dGVybiA9IFsnKD86XFwvKCcsICcpfFxcLyk/J107XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OiAgICBzdXJyb3VuZFBhdHRlcm4gPSBbJygnICsgc3F1YXNoICsgXCJ8XCIsICcpPyddOyBicmVhaztcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQgKyBzdXJyb3VuZFBhdHRlcm5bMF0gKyBwYXR0ZXJuICsgc3Vycm91bmRQYXR0ZXJuWzFdO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5zb3VyY2UgPSBwYXR0ZXJuO1xyXG5cclxuICAvLyBTcGxpdCBpbnRvIHN0YXRpYyBzZWdtZW50cyBzZXBhcmF0ZWQgYnkgcGF0aCBwYXJhbWV0ZXIgcGxhY2Vob2xkZXJzLlxyXG4gIC8vIFRoZSBudW1iZXIgb2Ygc2VnbWVudHMgaXMgYWx3YXlzIDEgbW9yZSB0aGFuIHRoZSBudW1iZXIgb2YgcGFyYW1ldGVycy5cclxuICBmdW5jdGlvbiBtYXRjaERldGFpbHMobSwgaXNTZWFyY2gpIHtcclxuICAgIHZhciBpZCwgcmVnZXhwLCBzZWdtZW50LCB0eXBlLCBjZmcsIGFycmF5TW9kZTtcclxuICAgIGlkICAgICAgICAgID0gbVsyXSB8fCBtWzNdOyAvLyBJRVs3OF0gcmV0dXJucyAnJyBmb3IgdW5tYXRjaGVkIGdyb3VwcyBpbnN0ZWFkIG9mIG51bGxcclxuICAgIGNmZyAgICAgICAgID0gY29uZmlnLnBhcmFtc1tpZF07XHJcbiAgICBzZWdtZW50ICAgICA9IHBhdHRlcm4uc3Vic3RyaW5nKGxhc3QsIG0uaW5kZXgpO1xyXG4gICAgcmVnZXhwICAgICAgPSBpc1NlYXJjaCA/IG1bNF0gOiBtWzRdIHx8IChtWzFdID09ICcqJyA/ICcuKicgOiBudWxsKTtcclxuXHJcbiAgICBpZiAocmVnZXhwKSB7XHJcbiAgICAgIHR5cGUgICAgICA9ICQkVU1GUC50eXBlKHJlZ2V4cCkgfHwgaW5oZXJpdCgkJFVNRlAudHlwZShcInN0cmluZ1wiKSwgeyBwYXR0ZXJuOiBuZXcgUmVnRXhwKHJlZ2V4cCwgY29uZmlnLmNhc2VJbnNlbnNpdGl2ZSA/ICdpJyA6IHVuZGVmaW5lZCkgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaWQ6IGlkLCByZWdleHA6IHJlZ2V4cCwgc2VnbWVudDogc2VnbWVudCwgdHlwZTogdHlwZSwgY2ZnOiBjZmdcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB2YXIgcCwgcGFyYW0sIHNlZ21lbnQ7XHJcbiAgd2hpbGUgKChtID0gcGxhY2Vob2xkZXIuZXhlYyhwYXR0ZXJuKSkpIHtcclxuICAgIHAgPSBtYXRjaERldGFpbHMobSwgZmFsc2UpO1xyXG4gICAgaWYgKHAuc2VnbWVudC5pbmRleE9mKCc/JykgPj0gMCkgYnJlYWs7IC8vIHdlJ3JlIGludG8gdGhlIHNlYXJjaCBwYXJ0XHJcblxyXG4gICAgcGFyYW0gPSBhZGRQYXJhbWV0ZXIocC5pZCwgcC50eXBlLCBwLmNmZywgXCJwYXRoXCIpO1xyXG4gICAgY29tcGlsZWQgKz0gcXVvdGVSZWdFeHAocC5zZWdtZW50LCBwYXJhbS50eXBlLnBhdHRlcm4uc291cmNlLCBwYXJhbS5zcXVhc2gsIHBhcmFtLmlzT3B0aW9uYWwpO1xyXG4gICAgc2VnbWVudHMucHVzaChwLnNlZ21lbnQpO1xyXG4gICAgbGFzdCA9IHBsYWNlaG9sZGVyLmxhc3RJbmRleDtcclxuICB9XHJcbiAgc2VnbWVudCA9IHBhdHRlcm4uc3Vic3RyaW5nKGxhc3QpO1xyXG5cclxuICAvLyBGaW5kIGFueSBzZWFyY2ggcGFyYW1ldGVyIG5hbWVzIGFuZCByZW1vdmUgdGhlbSBmcm9tIHRoZSBsYXN0IHNlZ21lbnRcclxuICB2YXIgaSA9IHNlZ21lbnQuaW5kZXhPZignPycpO1xyXG5cclxuICBpZiAoaSA+PSAwKSB7XHJcbiAgICB2YXIgc2VhcmNoID0gdGhpcy5zb3VyY2VTZWFyY2ggPSBzZWdtZW50LnN1YnN0cmluZyhpKTtcclxuICAgIHNlZ21lbnQgPSBzZWdtZW50LnN1YnN0cmluZygwLCBpKTtcclxuICAgIHRoaXMuc291cmNlUGF0aCA9IHBhdHRlcm4uc3Vic3RyaW5nKDAsIGxhc3QgKyBpKTtcclxuXHJcbiAgICBpZiAoc2VhcmNoLmxlbmd0aCA+IDApIHtcclxuICAgICAgbGFzdCA9IDA7XHJcbiAgICAgIHdoaWxlICgobSA9IHNlYXJjaFBsYWNlaG9sZGVyLmV4ZWMoc2VhcmNoKSkpIHtcclxuICAgICAgICBwID0gbWF0Y2hEZXRhaWxzKG0sIHRydWUpO1xyXG4gICAgICAgIHBhcmFtID0gYWRkUGFyYW1ldGVyKHAuaWQsIHAudHlwZSwgcC5jZmcsIFwic2VhcmNoXCIpO1xyXG4gICAgICAgIGxhc3QgPSBwbGFjZWhvbGRlci5sYXN0SW5kZXg7XHJcbiAgICAgICAgLy8gY2hlY2sgaWYgPyZcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLnNvdXJjZVBhdGggPSBwYXR0ZXJuO1xyXG4gICAgdGhpcy5zb3VyY2VTZWFyY2ggPSAnJztcclxuICB9XHJcblxyXG4gIGNvbXBpbGVkICs9IHF1b3RlUmVnRXhwKHNlZ21lbnQpICsgKGNvbmZpZy5zdHJpY3QgPT09IGZhbHNlID8gJ1xcLz8nIDogJycpICsgJyQnO1xyXG4gIHNlZ21lbnRzLnB1c2goc2VnbWVudCk7XHJcblxyXG4gIHRoaXMucmVnZXhwID0gbmV3IFJlZ0V4cChjb21waWxlZCwgY29uZmlnLmNhc2VJbnNlbnNpdGl2ZSA/ICdpJyA6IHVuZGVmaW5lZCk7XHJcbiAgdGhpcy5wcmVmaXggPSBzZWdtZW50c1swXTtcclxuICB0aGlzLiQkcGFyYW1OYW1lcyA9IHBhcmFtTmFtZXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZnVuY3Rpb25cclxuICogQG5hbWUgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyI2NvbmNhdFxyXG4gKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBSZXR1cm5zIGEgbmV3IG1hdGNoZXIgZm9yIGEgcGF0dGVybiBjb25zdHJ1Y3RlZCBieSBhcHBlbmRpbmcgdGhlIHBhdGggcGFydCBhbmQgYWRkaW5nIHRoZVxyXG4gKiBzZWFyY2ggcGFyYW1ldGVycyBvZiB0aGUgc3BlY2lmaWVkIHBhdHRlcm4gdG8gdGhpcyBwYXR0ZXJuLiBUaGUgY3VycmVudCBwYXR0ZXJuIGlzIG5vdFxyXG4gKiBtb2RpZmllZC4gVGhpcyBjYW4gYmUgdW5kZXJzdG9vZCBhcyBjcmVhdGluZyBhIHBhdHRlcm4gZm9yIFVSTHMgdGhhdCBhcmUgcmVsYXRpdmUgdG8gKG9yXHJcbiAqIHN1ZmZpeGVzIG9mKSB0aGUgY3VycmVudCBwYXR0ZXJuLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBUaGUgZm9sbG93aW5nIHR3byBtYXRjaGVycyBhcmUgZXF1aXZhbGVudDpcclxuICogPHByZT5cclxuICogbmV3IFVybE1hdGNoZXIoJy91c2VyL3tpZH0/cScpLmNvbmNhdCgnL2RldGFpbHM/ZGF0ZScpO1xyXG4gKiBuZXcgVXJsTWF0Y2hlcignL3VzZXIve2lkfS9kZXRhaWxzP3EmZGF0ZScpO1xyXG4gKiA8L3ByZT5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHBhdHRlcm4gIFRoZSBwYXR0ZXJuIHRvIGFwcGVuZC5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyAgQW4gb2JqZWN0IGhhc2ggb2YgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBtYXRjaGVyLlxyXG4gKiBAcmV0dXJucyB7VXJsTWF0Y2hlcn0gIEEgbWF0Y2hlciBmb3IgdGhlIGNvbmNhdGVuYXRlZCBwYXR0ZXJuLlxyXG4gKi9cclxuVXJsTWF0Y2hlci5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKHBhdHRlcm4sIGNvbmZpZykge1xyXG4gIC8vIEJlY2F1c2Ugb3JkZXIgb2Ygc2VhcmNoIHBhcmFtZXRlcnMgaXMgaXJyZWxldmFudCwgd2UgY2FuIGFkZCBvdXIgb3duIHNlYXJjaFxyXG4gIC8vIHBhcmFtZXRlcnMgdG8gdGhlIGVuZCBvZiB0aGUgbmV3IHBhdHRlcm4uIFBhcnNlIHRoZSBuZXcgcGF0dGVybiBieSBpdHNlbGZcclxuICAvLyBhbmQgdGhlbiBqb2luIHRoZSBiaXRzIHRvZ2V0aGVyLCBidXQgaXQncyBtdWNoIGVhc2llciB0byBkbyB0aGlzIG9uIGEgc3RyaW5nIGxldmVsLlxyXG4gIHZhciBkZWZhdWx0Q29uZmlnID0ge1xyXG4gICAgY2FzZUluc2Vuc2l0aXZlOiAkJFVNRlAuY2FzZUluc2Vuc2l0aXZlKCksXHJcbiAgICBzdHJpY3Q6ICQkVU1GUC5zdHJpY3RNb2RlKCksXHJcbiAgICBzcXVhc2g6ICQkVU1GUC5kZWZhdWx0U3F1YXNoUG9saWN5KClcclxuICB9O1xyXG4gIHJldHVybiBuZXcgVXJsTWF0Y2hlcih0aGlzLnNvdXJjZVBhdGggKyBwYXR0ZXJuICsgdGhpcy5zb3VyY2VTZWFyY2gsIGV4dGVuZChkZWZhdWx0Q29uZmlnLCBjb25maWcpLCB0aGlzKTtcclxufTtcclxuXHJcblVybE1hdGNoZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiB0aGlzLnNvdXJjZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZnVuY3Rpb25cclxuICogQG5hbWUgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyI2V4ZWNcclxuICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlclxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogVGVzdHMgdGhlIHNwZWNpZmllZCBwYXRoIGFnYWluc3QgdGhpcyBtYXRjaGVyLCBhbmQgcmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgY2FwdHVyZWRcclxuICogcGFyYW1ldGVyIHZhbHVlcywgb3IgbnVsbCBpZiB0aGUgcGF0aCBkb2VzIG5vdCBtYXRjaC4gVGhlIHJldHVybmVkIG9iamVjdCBjb250YWlucyB0aGUgdmFsdWVzXHJcbiAqIG9mIGFueSBzZWFyY2ggcGFyYW1ldGVycyB0aGF0IGFyZSBtZW50aW9uZWQgaW4gdGhlIHBhdHRlcm4sIGJ1dCB0aGVpciB2YWx1ZSBtYXkgYmUgbnVsbCBpZlxyXG4gKiB0aGV5IGFyZSBub3QgcHJlc2VudCBpbiBgc2VhcmNoUGFyYW1zYC4gVGhpcyBtZWFucyB0aGF0IHNlYXJjaCBwYXJhbWV0ZXJzIGFyZSBhbHdheXMgdHJlYXRlZFxyXG4gKiBhcyBvcHRpb25hbC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogPHByZT5cclxuICogbmV3IFVybE1hdGNoZXIoJy91c2VyL3tpZH0/cSZyJykuZXhlYygnL3VzZXIvYm9iJywge1xyXG4gKiAgIHg6ICcxJywgcTogJ2hlbGxvJ1xyXG4gKiB9KTtcclxuICogLy8gcmV0dXJucyB7IGlkOiAnYm9iJywgcTogJ2hlbGxvJywgcjogbnVsbCB9XHJcbiAqIDwvcHJlPlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAgVGhlIFVSTCBwYXRoIHRvIG1hdGNoLCBlLmcuIGAkbG9jYXRpb24ucGF0aCgpYC5cclxuICogQHBhcmFtIHtPYmplY3R9IHNlYXJjaFBhcmFtcyAgVVJMIHNlYXJjaCBwYXJhbWV0ZXJzLCBlLmcuIGAkbG9jYXRpb24uc2VhcmNoKClgLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAgVGhlIGNhcHR1cmVkIHBhcmFtZXRlciB2YWx1ZXMuXHJcbiAqL1xyXG5VcmxNYXRjaGVyLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKHBhdGgsIHNlYXJjaFBhcmFtcykge1xyXG4gIHZhciBtID0gdGhpcy5yZWdleHAuZXhlYyhwYXRoKTtcclxuICBpZiAoIW0pIHJldHVybiBudWxsO1xyXG4gIHNlYXJjaFBhcmFtcyA9IHNlYXJjaFBhcmFtcyB8fCB7fTtcclxuXHJcbiAgdmFyIHBhcmFtTmFtZXMgPSB0aGlzLnBhcmFtZXRlcnMoKSwgblRvdGFsID0gcGFyYW1OYW1lcy5sZW5ndGgsXHJcbiAgICBuUGF0aCA9IHRoaXMuc2VnbWVudHMubGVuZ3RoIC0gMSxcclxuICAgIHZhbHVlcyA9IHt9LCBpLCBqLCBjZmcsIHBhcmFtTmFtZTtcclxuXHJcbiAgaWYgKG5QYXRoICE9PSBtLmxlbmd0aCAtIDEpIHRocm93IG5ldyBFcnJvcihcIlVuYmFsYW5jZWQgY2FwdHVyZSBncm91cCBpbiByb3V0ZSAnXCIgKyB0aGlzLnNvdXJjZSArIFwiJ1wiKTtcclxuXHJcbiAgZnVuY3Rpb24gZGVjb2RlUGF0aEFycmF5KHN0cmluZykge1xyXG4gICAgZnVuY3Rpb24gcmV2ZXJzZVN0cmluZyhzdHIpIHsgcmV0dXJuIHN0ci5zcGxpdChcIlwiKS5yZXZlcnNlKCkuam9pbihcIlwiKTsgfVxyXG4gICAgZnVuY3Rpb24gdW5xdW90ZURhc2hlcyhzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXFxcLS9nLCBcIi1cIik7IH1cclxuXHJcbiAgICB2YXIgc3BsaXQgPSByZXZlcnNlU3RyaW5nKHN0cmluZykuc3BsaXQoLy0oPyFcXFxcKS8pO1xyXG4gICAgdmFyIGFsbFJldmVyc2VkID0gbWFwKHNwbGl0LCByZXZlcnNlU3RyaW5nKTtcclxuICAgIHJldHVybiBtYXAoYWxsUmV2ZXJzZWQsIHVucXVvdGVEYXNoZXMpLnJldmVyc2UoKTtcclxuICB9XHJcblxyXG4gIHZhciBwYXJhbSwgcGFyYW1WYWw7XHJcbiAgZm9yIChpID0gMDsgaSA8IG5QYXRoOyBpKyspIHtcclxuICAgIHBhcmFtTmFtZSA9IHBhcmFtTmFtZXNbaV07XHJcbiAgICBwYXJhbSA9IHRoaXMucGFyYW1zW3BhcmFtTmFtZV07XHJcbiAgICBwYXJhbVZhbCA9IG1baSsxXTtcclxuICAgIC8vIGlmIHRoZSBwYXJhbSB2YWx1ZSBtYXRjaGVzIGEgcHJlLXJlcGxhY2UgcGFpciwgcmVwbGFjZSB0aGUgdmFsdWUgYmVmb3JlIGRlY29kaW5nLlxyXG4gICAgZm9yIChqID0gMDsgaiA8IHBhcmFtLnJlcGxhY2UubGVuZ3RoOyBqKyspIHtcclxuICAgICAgaWYgKHBhcmFtLnJlcGxhY2Vbal0uZnJvbSA9PT0gcGFyYW1WYWwpIHBhcmFtVmFsID0gcGFyYW0ucmVwbGFjZVtqXS50bztcclxuICAgIH1cclxuICAgIGlmIChwYXJhbVZhbCAmJiBwYXJhbS5hcnJheSA9PT0gdHJ1ZSkgcGFyYW1WYWwgPSBkZWNvZGVQYXRoQXJyYXkocGFyYW1WYWwpO1xyXG4gICAgaWYgKGlzRGVmaW5lZChwYXJhbVZhbCkpIHBhcmFtVmFsID0gcGFyYW0udHlwZS5kZWNvZGUocGFyYW1WYWwpO1xyXG4gICAgdmFsdWVzW3BhcmFtTmFtZV0gPSBwYXJhbS52YWx1ZShwYXJhbVZhbCk7XHJcbiAgfVxyXG4gIGZvciAoLyoqLzsgaSA8IG5Ub3RhbDsgaSsrKSB7XHJcbiAgICBwYXJhbU5hbWUgPSBwYXJhbU5hbWVzW2ldO1xyXG4gICAgdmFsdWVzW3BhcmFtTmFtZV0gPSB0aGlzLnBhcmFtc1twYXJhbU5hbWVdLnZhbHVlKHNlYXJjaFBhcmFtc1twYXJhbU5hbWVdKTtcclxuICAgIHBhcmFtID0gdGhpcy5wYXJhbXNbcGFyYW1OYW1lXTtcclxuICAgIHBhcmFtVmFsID0gc2VhcmNoUGFyYW1zW3BhcmFtTmFtZV07XHJcbiAgICBmb3IgKGogPSAwOyBqIDwgcGFyYW0ucmVwbGFjZS5sZW5ndGg7IGorKykge1xyXG4gICAgICBpZiAocGFyYW0ucmVwbGFjZVtqXS5mcm9tID09PSBwYXJhbVZhbCkgcGFyYW1WYWwgPSBwYXJhbS5yZXBsYWNlW2pdLnRvO1xyXG4gICAgfVxyXG4gICAgaWYgKGlzRGVmaW5lZChwYXJhbVZhbCkpIHBhcmFtVmFsID0gcGFyYW0udHlwZS5kZWNvZGUocGFyYW1WYWwpO1xyXG4gICAgdmFsdWVzW3BhcmFtTmFtZV0gPSBwYXJhbS52YWx1ZShwYXJhbVZhbCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsdWVzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIjcGFyYW1ldGVyc1xyXG4gKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBSZXR1cm5zIHRoZSBuYW1lcyBvZiBhbGwgcGF0aCBhbmQgc2VhcmNoIHBhcmFtZXRlcnMgb2YgdGhpcyBwYXR0ZXJuIGluIGFuIHVuc3BlY2lmaWVkIG9yZGVyLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59ICBBbiBhcnJheSBvZiBwYXJhbWV0ZXIgbmFtZXMuIE11c3QgYmUgdHJlYXRlZCBhcyByZWFkLW9ubHkuIElmIHRoZVxyXG4gKiAgICBwYXR0ZXJuIGhhcyBubyBwYXJhbWV0ZXJzLCBhbiBlbXB0eSBhcnJheSBpcyByZXR1cm5lZC5cclxuICovXHJcblVybE1hdGNoZXIucHJvdG90eXBlLnBhcmFtZXRlcnMgPSBmdW5jdGlvbiAocGFyYW0pIHtcclxuICBpZiAoIWlzRGVmaW5lZChwYXJhbSkpIHJldHVybiB0aGlzLiQkcGFyYW1OYW1lcztcclxuICByZXR1cm4gdGhpcy5wYXJhbXNbcGFyYW1dIHx8IG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciN2YWxpZGF0ZXNcclxuICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlclxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogQ2hlY2tzIGFuIG9iamVjdCBoYXNoIG9mIHBhcmFtZXRlcnMgdG8gdmFsaWRhdGUgdGhlaXIgY29ycmVjdG5lc3MgYWNjb3JkaW5nIHRvIHRoZSBwYXJhbWV0ZXJcclxuICogdHlwZXMgb2YgdGhpcyBgVXJsTWF0Y2hlcmAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgVGhlIG9iamVjdCBoYXNoIG9mIHBhcmFtZXRlcnMgdG8gdmFsaWRhdGUuXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgcGFyYW1zYCB2YWxpZGF0ZXMsIG90aGVyd2lzZSBgZmFsc2VgLlxyXG4gKi9cclxuVXJsTWF0Y2hlci5wcm90b3R5cGUudmFsaWRhdGVzID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gIHJldHVybiB0aGlzLnBhcmFtcy4kJHZhbGlkYXRlcyhwYXJhbXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIjZm9ybWF0XHJcbiAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXJcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIENyZWF0ZXMgYSBVUkwgdGhhdCBtYXRjaGVzIHRoaXMgcGF0dGVybiBieSBzdWJzdGl0dXRpbmcgdGhlIHNwZWNpZmllZCB2YWx1ZXNcclxuICogZm9yIHRoZSBwYXRoIGFuZCBzZWFyY2ggcGFyYW1ldGVycy4gTnVsbCB2YWx1ZXMgZm9yIHBhdGggcGFyYW1ldGVycyBhcmVcclxuICogdHJlYXRlZCBhcyBlbXB0eSBzdHJpbmdzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiA8cHJlPlxyXG4gKiBuZXcgVXJsTWF0Y2hlcignL3VzZXIve2lkfT9xJykuZm9ybWF0KHsgaWQ6J2JvYicsIHE6J3llcycgfSk7XHJcbiAqIC8vIHJldHVybnMgJy91c2VyL2JvYj9xPXllcydcclxuICogPC9wcmU+XHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXMgIHRoZSB2YWx1ZXMgdG8gc3Vic3RpdHV0ZSBmb3IgdGhlIHBhcmFtZXRlcnMgaW4gdGhpcyBwYXR0ZXJuLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAgdGhlIGZvcm1hdHRlZCBVUkwgKHBhdGggYW5kIG9wdGlvbmFsbHkgc2VhcmNoIHBhcnQpLlxyXG4gKi9cclxuVXJsTWF0Y2hlci5wcm90b3R5cGUuZm9ybWF0ID0gZnVuY3Rpb24gKHZhbHVlcykge1xyXG4gIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuICB2YXIgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzLCBwYXJhbXMgPSB0aGlzLnBhcmFtZXRlcnMoKSwgcGFyYW1zZXQgPSB0aGlzLnBhcmFtcztcclxuICBpZiAoIXRoaXMudmFsaWRhdGVzKHZhbHVlcykpIHJldHVybiBudWxsO1xyXG5cclxuICB2YXIgaSwgc2VhcmNoID0gZmFsc2UsIG5QYXRoID0gc2VnbWVudHMubGVuZ3RoIC0gMSwgblRvdGFsID0gcGFyYW1zLmxlbmd0aCwgcmVzdWx0ID0gc2VnbWVudHNbMF07XHJcblxyXG4gIGZ1bmN0aW9uIGVuY29kZURhc2hlcyhzdHIpIHsgLy8gUmVwbGFjZSBkYXNoZXMgd2l0aCBlbmNvZGVkIFwiXFwtXCJcclxuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC8tL2csIGZ1bmN0aW9uKGMpIHsgcmV0dXJuICclNUMlJyArIGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTsgfSk7XHJcbiAgfVxyXG5cclxuICBmb3IgKGkgPSAwOyBpIDwgblRvdGFsOyBpKyspIHtcclxuICAgIHZhciBpc1BhdGhQYXJhbSA9IGkgPCBuUGF0aDtcclxuICAgIHZhciBuYW1lID0gcGFyYW1zW2ldLCBwYXJhbSA9IHBhcmFtc2V0W25hbWVdLCB2YWx1ZSA9IHBhcmFtLnZhbHVlKHZhbHVlc1tuYW1lXSk7XHJcbiAgICB2YXIgaXNEZWZhdWx0VmFsdWUgPSBwYXJhbS5pc09wdGlvbmFsICYmIHBhcmFtLnR5cGUuZXF1YWxzKHBhcmFtLnZhbHVlKCksIHZhbHVlKTtcclxuICAgIHZhciBzcXVhc2ggPSBpc0RlZmF1bHRWYWx1ZSA/IHBhcmFtLnNxdWFzaCA6IGZhbHNlO1xyXG4gICAgdmFyIGVuY29kZWQgPSBwYXJhbS50eXBlLmVuY29kZSh2YWx1ZSk7XHJcblxyXG4gICAgaWYgKGlzUGF0aFBhcmFtKSB7XHJcbiAgICAgIHZhciBuZXh0U2VnbWVudCA9IHNlZ21lbnRzW2kgKyAxXTtcclxuICAgICAgdmFyIGlzRmluYWxQYXRoUGFyYW0gPSBpICsgMSA9PT0gblBhdGg7XHJcblxyXG4gICAgICBpZiAoc3F1YXNoID09PSBmYWxzZSkge1xyXG4gICAgICAgIGlmIChlbmNvZGVkICE9IG51bGwpIHtcclxuICAgICAgICAgIGlmIChpc0FycmF5KGVuY29kZWQpKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSBtYXAoZW5jb2RlZCwgZW5jb2RlRGFzaGVzKS5qb2luKFwiLVwiKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSBlbmNvZGVVUklDb21wb25lbnQoZW5jb2RlZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdCArPSBuZXh0U2VnbWVudDtcclxuICAgICAgfSBlbHNlIGlmIChzcXVhc2ggPT09IHRydWUpIHtcclxuICAgICAgICB2YXIgY2FwdHVyZSA9IHJlc3VsdC5tYXRjaCgvXFwvJC8pID8gL1xcLz8oLiopLyA6IC8oLiopLztcclxuICAgICAgICByZXN1bHQgKz0gbmV4dFNlZ21lbnQubWF0Y2goY2FwdHVyZSlbMV07XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNTdHJpbmcoc3F1YXNoKSkge1xyXG4gICAgICAgIHJlc3VsdCArPSBzcXVhc2ggKyBuZXh0U2VnbWVudDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGlzRmluYWxQYXRoUGFyYW0gJiYgcGFyYW0uc3F1YXNoID09PSB0cnVlICYmIHJlc3VsdC5zbGljZSgtMSkgPT09ICcvJykgcmVzdWx0ID0gcmVzdWx0LnNsaWNlKDAsIC0xKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChlbmNvZGVkID09IG51bGwgfHwgKGlzRGVmYXVsdFZhbHVlICYmIHNxdWFzaCAhPT0gZmFsc2UpKSBjb250aW51ZTtcclxuICAgICAgaWYgKCFpc0FycmF5KGVuY29kZWQpKSBlbmNvZGVkID0gWyBlbmNvZGVkIF07XHJcbiAgICAgIGlmIChlbmNvZGVkLmxlbmd0aCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgIGVuY29kZWQgPSBtYXAoZW5jb2RlZCwgZW5jb2RlVVJJQ29tcG9uZW50KS5qb2luKCcmJyArIG5hbWUgKyAnPScpO1xyXG4gICAgICByZXN1bHQgKz0gKHNlYXJjaCA/ICcmJyA6ICc/JykgKyAobmFtZSArICc9JyArIGVuY29kZWQpO1xyXG4gICAgICBzZWFyY2ggPSB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2Mgb2JqZWN0XHJcbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsLnR5cGU6VHlwZVxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogSW1wbGVtZW50cyBhbiBpbnRlcmZhY2UgdG8gZGVmaW5lIGN1c3RvbSBwYXJhbWV0ZXIgdHlwZXMgdGhhdCBjYW4gYmUgZGVjb2RlZCBmcm9tIGFuZCBlbmNvZGVkIHRvXHJcbiAqIHN0cmluZyBwYXJhbWV0ZXJzIG1hdGNoZWQgaW4gYSBVUkwuIFVzZWQgYnkge0BsaW5rIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciBgVXJsTWF0Y2hlcmB9XHJcbiAqIG9iamVjdHMgd2hlbiBtYXRjaGluZyBvciBmb3JtYXR0aW5nIFVSTHMsIG9yIGNvbXBhcmluZyBvciB2YWxpZGF0aW5nIHBhcmFtZXRlciB2YWx1ZXMuXHJcbiAqXHJcbiAqIFNlZSB7QGxpbmsgdWkucm91dGVyLnV0aWwuJHVybE1hdGNoZXJGYWN0b3J5I21ldGhvZHNfdHlwZSBgJHVybE1hdGNoZXJGYWN0b3J5I3R5cGUoKWB9IGZvciBtb3JlXHJcbiAqIGluZm9ybWF0aW9uIG9uIHJlZ2lzdGVyaW5nIGN1c3RvbSB0eXBlcy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyAgQSBjb25maWd1cmF0aW9uIG9iamVjdCB3aGljaCBjb250YWlucyB0aGUgY3VzdG9tIHR5cGUgZGVmaW5pdGlvbi4gIFRoZSBvYmplY3Qnc1xyXG4gKiAgICAgICAgcHJvcGVydGllcyB3aWxsIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG1ldGhvZHMgYW5kL29yIHBhdHRlcm4gaW4gYFR5cGVgJ3MgcHVibGljIGludGVyZmFjZS5cclxuICogQGV4YW1wbGVcclxuICogPHByZT5cclxuICoge1xyXG4gKiAgIGRlY29kZTogZnVuY3Rpb24odmFsKSB7IHJldHVybiBwYXJzZUludCh2YWwsIDEwKTsgfSxcclxuICogICBlbmNvZGU6IGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsICYmIHZhbC50b1N0cmluZygpOyB9LFxyXG4gKiAgIGVxdWFsczogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gdGhpcy5pcyhhKSAmJiBhID09PSBiOyB9LFxyXG4gKiAgIGlzOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIGFuZ3VsYXIuaXNOdW1iZXIodmFsKSBpc0Zpbml0ZSh2YWwpICYmIHZhbCAlIDEgPT09IDA7IH0sXHJcbiAqICAgcGF0dGVybjogL1xcZCsvXHJcbiAqIH1cclxuICogPC9wcmU+XHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBwYXR0ZXJuIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gcGF0dGVybiB1c2VkIHRvIG1hdGNoIHZhbHVlcyBvZiB0aGlzIHR5cGUgd2hlblxyXG4gKiAgICAgICAgICAgY29taW5nIGZyb20gYSBzdWJzdHJpbmcgb2YgYSBVUkwuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9ICBSZXR1cm5zIGEgbmV3IGBUeXBlYCBvYmplY3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBUeXBlKGNvbmZpZykge1xyXG4gIGV4dGVuZCh0aGlzLCBjb25maWcpO1xyXG59XHJcblxyXG4vKipcclxuICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsLnR5cGU6VHlwZSNpc1xyXG4gKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBEZXRlY3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyBvZiBhIHBhcnRpY3VsYXIgdHlwZS4gQWNjZXB0cyBhIG5hdGl2ZSAoZGVjb2RlZCkgdmFsdWVcclxuICogYW5kIGRldGVybWluZXMgd2hldGhlciBpdCBtYXRjaGVzIHRoZSBjdXJyZW50IGBUeXBlYCBvYmplY3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Kn0gdmFsICBUaGUgdmFsdWUgdG8gY2hlY2suXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgIE9wdGlvbmFsLiBJZiB0aGUgdHlwZSBjaGVjayBpcyBoYXBwZW5pbmcgaW4gdGhlIGNvbnRleHQgb2YgYSBzcGVjaWZpY1xyXG4gKiAgICAgICAge0BsaW5rIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciBgVXJsTWF0Y2hlcmB9IG9iamVjdCwgdGhpcyBpcyB0aGUgbmFtZSBvZiB0aGVcclxuICogICAgICAgIHBhcmFtZXRlciBpbiB3aGljaCBgdmFsYCBpcyBzdG9yZWQuIENhbiBiZSB1c2VkIGZvciBtZXRhLXByb2dyYW1taW5nIG9mIGBUeXBlYCBvYmplY3RzLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gIFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlLCBvdGhlcndpc2UgYGZhbHNlYC5cclxuICovXHJcblR5cGUucHJvdG90eXBlLmlzID0gZnVuY3Rpb24odmFsLCBrZXkpIHtcclxuICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZnVuY3Rpb25cclxuICogQG5hbWUgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlI2VuY29kZVxyXG4gKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBFbmNvZGVzIGEgY3VzdG9tL25hdGl2ZSB0eXBlIHZhbHVlIHRvIGEgc3RyaW5nIHRoYXQgY2FuIGJlIGVtYmVkZGVkIGluIGEgVVJMLiBOb3RlIHRoYXQgdGhlXHJcbiAqIHJldHVybiB2YWx1ZSBkb2VzICpub3QqIG5lZWQgdG8gYmUgVVJMLXNhZmUgKGkuZS4gcGFzc2VkIHRocm91Z2ggYGVuY29kZVVSSUNvbXBvbmVudCgpYCksIGl0XHJcbiAqIG9ubHkgbmVlZHMgdG8gYmUgYSByZXByZXNlbnRhdGlvbiBvZiBgdmFsYCB0aGF0IGhhcyBiZWVuIGNvZXJjZWQgdG8gYSBzdHJpbmcuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Kn0gdmFsICBUaGUgdmFsdWUgdG8gZW5jb2RlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5ICBUaGUgbmFtZSBvZiB0aGUgcGFyYW1ldGVyIGluIHdoaWNoIGB2YWxgIGlzIHN0b3JlZC4gQ2FuIGJlIHVzZWQgZm9yXHJcbiAqICAgICAgICBtZXRhLXByb2dyYW1taW5nIG9mIGBUeXBlYCBvYmplY3RzLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAgUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBgdmFsYCB0aGF0IGNhbiBiZSBlbmNvZGVkIGluIGEgVVJMLlxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUuZW5jb2RlID0gZnVuY3Rpb24odmFsLCBrZXkpIHtcclxuICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC50eXBlOlR5cGUjZGVjb2RlXHJcbiAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC50eXBlOlR5cGVcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIENvbnZlcnRzIGEgcGFyYW1ldGVyIHZhbHVlIChmcm9tIFVSTCBzdHJpbmcgb3IgdHJhbnNpdGlvbiBwYXJhbSkgdG8gYSBjdXN0b20vbmF0aXZlIHZhbHVlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsICBUaGUgVVJMIHBhcmFtZXRlciB2YWx1ZSB0byBkZWNvZGUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgIFRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIgaW4gd2hpY2ggYHZhbGAgaXMgc3RvcmVkLiBDYW4gYmUgdXNlZCBmb3JcclxuICogICAgICAgIG1ldGEtcHJvZ3JhbW1pbmcgb2YgYFR5cGVgIG9iamVjdHMuXHJcbiAqIEByZXR1cm5zIHsqfSAgUmV0dXJucyBhIGN1c3RvbSByZXByZXNlbnRhdGlvbiBvZiB0aGUgVVJMIHBhcmFtZXRlciB2YWx1ZS5cclxuICovXHJcblR5cGUucHJvdG90eXBlLmRlY29kZSA9IGZ1bmN0aW9uKHZhbCwga2V5KSB7XHJcbiAgcmV0dXJuIHZhbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZnVuY3Rpb25cclxuICogQG5hbWUgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlI2VxdWFsc1xyXG4gKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdHdvIGRlY29kZWQgdmFsdWVzIGFyZSBlcXVpdmFsZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0geyp9IGEgIEEgdmFsdWUgdG8gY29tcGFyZSBhZ2FpbnN0LlxyXG4gKiBAcGFyYW0geyp9IGIgIEEgdmFsdWUgdG8gY29tcGFyZSBhZ2FpbnN0LlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gIFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQvZXF1YWwsIG90aGVyd2lzZSBgZmFsc2VgLlxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24oYSwgYikge1xyXG4gIHJldHVybiBhID09IGI7XHJcbn07XHJcblxyXG5UeXBlLnByb3RvdHlwZS4kc3ViUGF0dGVybiA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzdWIgPSB0aGlzLnBhdHRlcm4udG9TdHJpbmcoKTtcclxuICByZXR1cm4gc3ViLnN1YnN0cigxLCBzdWIubGVuZ3RoIC0gMik7XHJcbn07XHJcblxyXG5UeXBlLnByb3RvdHlwZS5wYXR0ZXJuID0gLy4qLztcclxuXHJcblR5cGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIntUeXBlOlwiICsgdGhpcy5uYW1lICsgXCJ9XCI7IH07XHJcblxyXG4vKiogR2l2ZW4gYW4gZW5jb2RlZCBzdHJpbmcsIG9yIGEgZGVjb2RlZCBvYmplY3QsIHJldHVybnMgYSBkZWNvZGVkIG9iamVjdCAqL1xyXG5UeXBlLnByb3RvdHlwZS4kbm9ybWFsaXplID0gZnVuY3Rpb24odmFsKSB7XHJcbiAgcmV0dXJuIHRoaXMuaXModmFsKSA/IHZhbCA6IHRoaXMuZGVjb2RlKHZhbCk7XHJcbn07XHJcblxyXG4vKlxyXG4gKiBXcmFwcyBhbiBleGlzdGluZyBjdXN0b20gVHlwZSBhcyBhbiBhcnJheSBvZiBUeXBlLCBkZXBlbmRpbmcgb24gJ21vZGUnLlxyXG4gKiBlLmcuOlxyXG4gKiAtIHVybG1hdGNoZXIgcGF0dGVybiBcIi9wYXRoP3txdWVyeVBhcmFtW106aW50fVwiXHJcbiAqIC0gdXJsOiBcIi9wYXRoP3F1ZXJ5UGFyYW09MSZxdWVyeVBhcmFtPTJcclxuICogLSAkc3RhdGVQYXJhbXMucXVlcnlQYXJhbSB3aWxsIGJlIFsxLCAyXVxyXG4gKiBpZiBgbW9kZWAgaXMgXCJhdXRvXCIsIHRoZW5cclxuICogLSB1cmw6IFwiL3BhdGg/cXVlcnlQYXJhbT0xIHdpbGwgY3JlYXRlICRzdGF0ZVBhcmFtcy5xdWVyeVBhcmFtOiAxXHJcbiAqIC0gdXJsOiBcIi9wYXRoP3F1ZXJ5UGFyYW09MSZxdWVyeVBhcmFtPTIgd2lsbCBjcmVhdGUgJHN0YXRlUGFyYW1zLnF1ZXJ5UGFyYW06IFsxLCAyXVxyXG4gKi9cclxuVHlwZS5wcm90b3R5cGUuJGFzQXJyYXkgPSBmdW5jdGlvbihtb2RlLCBpc1NlYXJjaCkge1xyXG4gIGlmICghbW9kZSkgcmV0dXJuIHRoaXM7XHJcbiAgaWYgKG1vZGUgPT09IFwiYXV0b1wiICYmICFpc1NlYXJjaCkgdGhyb3cgbmV3IEVycm9yKFwiJ2F1dG8nIGFycmF5IG1vZGUgaXMgZm9yIHF1ZXJ5IHBhcmFtZXRlcnMgb25seVwiKTtcclxuXHJcbiAgZnVuY3Rpb24gQXJyYXlUeXBlKHR5cGUsIG1vZGUpIHtcclxuICAgIGZ1bmN0aW9uIGJpbmRUbyh0eXBlLCBjYWxsYmFja05hbWUpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0eXBlW2NhbGxiYWNrTmFtZV0uYXBwbHkodHlwZSwgYXJndW1lbnRzKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXcmFwIG5vbi1hcnJheSB2YWx1ZSBhcyBhcnJheVxyXG4gICAgZnVuY3Rpb24gYXJyYXlXcmFwKHZhbCkgeyByZXR1cm4gaXNBcnJheSh2YWwpID8gdmFsIDogKGlzRGVmaW5lZCh2YWwpID8gWyB2YWwgXSA6IFtdKTsgfVxyXG4gICAgLy8gVW53cmFwIGFycmF5IHZhbHVlIGZvciBcImF1dG9cIiBtb2RlLiBSZXR1cm4gdW5kZWZpbmVkIGZvciBlbXB0eSBhcnJheS5cclxuICAgIGZ1bmN0aW9uIGFycmF5VW53cmFwKHZhbCkge1xyXG4gICAgICBzd2l0Y2godmFsLmxlbmd0aCkge1xyXG4gICAgICAgIGNhc2UgMDogcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICBjYXNlIDE6IHJldHVybiBtb2RlID09PSBcImF1dG9cIiA/IHZhbFswXSA6IHZhbDtcclxuICAgICAgICBkZWZhdWx0OiByZXR1cm4gdmFsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmYWxzZXkodmFsKSB7IHJldHVybiAhdmFsOyB9XHJcblxyXG4gICAgLy8gV3JhcHMgdHlwZSAoLmlzLy5lbmNvZGUvLmRlY29kZSkgZnVuY3Rpb25zIHRvIG9wZXJhdGUgb24gZWFjaCB2YWx1ZSBvZiBhbiBhcnJheVxyXG4gICAgZnVuY3Rpb24gYXJyYXlIYW5kbGVyKGNhbGxiYWNrLCBhbGxUcnV0aHlNb2RlKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiBoYW5kbGVBcnJheSh2YWwpIHtcclxuICAgICAgICBpZiAoaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPT09IDApIHJldHVybiB2YWw7XHJcbiAgICAgICAgdmFsID0gYXJyYXlXcmFwKHZhbCk7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IG1hcCh2YWwsIGNhbGxiYWNrKTtcclxuICAgICAgICBpZiAoYWxsVHJ1dGh5TW9kZSA9PT0gdHJ1ZSlcclxuICAgICAgICAgIHJldHVybiBmaWx0ZXIocmVzdWx0LCBmYWxzZXkpLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICByZXR1cm4gYXJyYXlVbndyYXAocmVzdWx0KTtcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXcmFwcyB0eXBlICguZXF1YWxzKSBmdW5jdGlvbnMgdG8gb3BlcmF0ZSBvbiBlYWNoIHZhbHVlIG9mIGFuIGFycmF5XHJcbiAgICBmdW5jdGlvbiBhcnJheUVxdWFsc0hhbmRsZXIoY2FsbGJhY2spIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZUFycmF5KHZhbDEsIHZhbDIpIHtcclxuICAgICAgICB2YXIgbGVmdCA9IGFycmF5V3JhcCh2YWwxKSwgcmlnaHQgPSBhcnJheVdyYXAodmFsMik7XHJcbiAgICAgICAgaWYgKGxlZnQubGVuZ3RoICE9PSByaWdodC5sZW5ndGgpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlZnQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICghY2FsbGJhY2sobGVmdFtpXSwgcmlnaHRbaV0pKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZW5jb2RlID0gYXJyYXlIYW5kbGVyKGJpbmRUbyh0eXBlLCAnZW5jb2RlJykpO1xyXG4gICAgdGhpcy5kZWNvZGUgPSBhcnJheUhhbmRsZXIoYmluZFRvKHR5cGUsICdkZWNvZGUnKSk7XHJcbiAgICB0aGlzLmlzICAgICA9IGFycmF5SGFuZGxlcihiaW5kVG8odHlwZSwgJ2lzJyksIHRydWUpO1xyXG4gICAgdGhpcy5lcXVhbHMgPSBhcnJheUVxdWFsc0hhbmRsZXIoYmluZFRvKHR5cGUsICdlcXVhbHMnKSk7XHJcbiAgICB0aGlzLnBhdHRlcm4gPSB0eXBlLnBhdHRlcm47XHJcbiAgICB0aGlzLiRub3JtYWxpemUgPSBhcnJheUhhbmRsZXIoYmluZFRvKHR5cGUsICckbm9ybWFsaXplJykpO1xyXG4gICAgdGhpcy5uYW1lID0gdHlwZS5uYW1lO1xyXG4gICAgdGhpcy4kYXJyYXlNb2RlID0gbW9kZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgQXJyYXlUeXBlKHRoaXMsIG1vZGUpO1xyXG59O1xyXG5cclxuXHJcblxyXG4vKipcclxuICogQG5nZG9jIG9iamVjdFxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIEZhY3RvcnkgZm9yIHtAbGluayB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIgYFVybE1hdGNoZXJgfSBpbnN0YW5jZXMuIFRoZSBmYWN0b3J5XHJcbiAqIGlzIGFsc28gYXZhaWxhYmxlIHRvIHByb3ZpZGVycyB1bmRlciB0aGUgbmFtZSBgJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXJgLlxyXG4gKi9cclxuZnVuY3Rpb24gJFVybE1hdGNoZXJGYWN0b3J5KCkge1xyXG4gICQkVU1GUCA9IHRoaXM7XHJcblxyXG4gIHZhciBpc0Nhc2VJbnNlbnNpdGl2ZSA9IGZhbHNlLCBpc1N0cmljdE1vZGUgPSB0cnVlLCBkZWZhdWx0U3F1YXNoUG9saWN5ID0gZmFsc2U7XHJcblxyXG4gIC8vIFVzZSB0aWxkZXMgdG8gcHJlLWVuY29kZSBzbGFzaGVzLlxyXG4gIC8vIElmIHRoZSBzbGFzaGVzIGFyZSBzaW1wbHkgVVJMRW5jb2RlZCwgdGhlIGJyb3dzZXIgY2FuIGNob29zZSB0byBwcmUtZGVjb2RlIHRoZW0sXHJcbiAgLy8gYW5kIGJpZGlyZWN0aW9uYWwgZW5jb2RpbmcvZGVjb2RpbmcgZmFpbHMuXHJcbiAgLy8gVGlsZGUgd2FzIGNob3NlbiBiZWNhdXNlIGl0J3Mgbm90IGEgUkZDIDM5ODYgc2VjdGlvbiAyLjIgUmVzZXJ2ZWQgQ2hhcmFjdGVyXHJcbiAgZnVuY3Rpb24gdmFsVG9TdHJpbmcodmFsKSB7IHJldHVybiB2YWwgIT0gbnVsbCA/IHZhbC50b1N0cmluZygpLnJlcGxhY2UoL34vZywgXCJ+flwiKS5yZXBsYWNlKC9cXC8vZywgXCJ+MkZcIikgOiB2YWw7IH1cclxuICBmdW5jdGlvbiB2YWxGcm9tU3RyaW5nKHZhbCkgeyByZXR1cm4gdmFsICE9IG51bGwgPyB2YWwudG9TdHJpbmcoKS5yZXBsYWNlKC9+MkYvZywgXCIvXCIpLnJlcGxhY2UoL35+L2csIFwiflwiKSA6IHZhbDsgfVxyXG5cclxuICB2YXIgJHR5cGVzID0ge30sIGVucXVldWUgPSB0cnVlLCB0eXBlUXVldWUgPSBbXSwgaW5qZWN0b3IsIGRlZmF1bHRUeXBlcyA9IHtcclxuICAgIFwic3RyaW5nXCI6IHtcclxuICAgICAgZW5jb2RlOiB2YWxUb1N0cmluZyxcclxuICAgICAgZGVjb2RlOiB2YWxGcm9tU3RyaW5nLFxyXG4gICAgICAvLyBUT0RPOiBpbiAxLjAsIG1ha2Ugc3RyaW5nIC5pcygpIHJldHVybiBmYWxzZSBpZiB2YWx1ZSBpcyB1bmRlZmluZWQvbnVsbCBieSBkZWZhdWx0LlxyXG4gICAgICAvLyBJbiAwLjIueCwgc3RyaW5nIHBhcmFtcyBhcmUgb3B0aW9uYWwgYnkgZGVmYXVsdCBmb3IgYmFja3dhcmRzIGNvbXBhdFxyXG4gICAgICBpczogZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWwgPT0gbnVsbCB8fCAhaXNEZWZpbmVkKHZhbCkgfHwgdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIjsgfSxcclxuICAgICAgcGF0dGVybjogL1teL10qL1xyXG4gICAgfSxcclxuICAgIFwiaW50XCI6IHtcclxuICAgICAgZW5jb2RlOiB2YWxUb1N0cmluZyxcclxuICAgICAgZGVjb2RlOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHBhcnNlSW50KHZhbCwgMTApOyB9LFxyXG4gICAgICBpczogZnVuY3Rpb24odmFsKSB7IHJldHVybiBpc0RlZmluZWQodmFsKSAmJiB0aGlzLmRlY29kZSh2YWwudG9TdHJpbmcoKSkgPT09IHZhbDsgfSxcclxuICAgICAgcGF0dGVybjogL1xcZCsvXHJcbiAgICB9LFxyXG4gICAgXCJib29sXCI6IHtcclxuICAgICAgZW5jb2RlOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbCA/IDEgOiAwOyB9LFxyXG4gICAgICBkZWNvZGU6IGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gcGFyc2VJbnQodmFsLCAxMCkgIT09IDA7IH0sXHJcbiAgICAgIGlzOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbCA9PT0gdHJ1ZSB8fCB2YWwgPT09IGZhbHNlOyB9LFxyXG4gICAgICBwYXR0ZXJuOiAvMHwxL1xyXG4gICAgfSxcclxuICAgIFwiZGF0ZVwiOiB7XHJcbiAgICAgIGVuY29kZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIGlmICghdGhpcy5pcyh2YWwpKVxyXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICByZXR1cm4gWyB2YWwuZ2V0RnVsbFllYXIoKSxcclxuICAgICAgICAgICgnMCcgKyAodmFsLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpLFxyXG4gICAgICAgICAgKCcwJyArIHZhbC5nZXREYXRlKCkpLnNsaWNlKC0yKVxyXG4gICAgICAgIF0uam9pbihcIi1cIik7XHJcbiAgICAgIH0sXHJcbiAgICAgIGRlY29kZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIGlmICh0aGlzLmlzKHZhbCkpIHJldHVybiB2YWw7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gdGhpcy5jYXB0dXJlLmV4ZWModmFsKTtcclxuICAgICAgICByZXR1cm4gbWF0Y2ggPyBuZXcgRGF0ZShtYXRjaFsxXSwgbWF0Y2hbMl0gLSAxLCBtYXRjaFszXSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgIH0sXHJcbiAgICAgIGlzOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbCBpbnN0YW5jZW9mIERhdGUgJiYgIWlzTmFOKHZhbC52YWx1ZU9mKCkpOyB9LFxyXG4gICAgICBlcXVhbHM6IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiB0aGlzLmlzKGEpICYmIHRoaXMuaXMoYikgJiYgYS50b0lTT1N0cmluZygpID09PSBiLnRvSVNPU3RyaW5nKCk7IH0sXHJcbiAgICAgIHBhdHRlcm46IC9bMC05XXs0fS0oPzowWzEtOV18MVswLTJdKS0oPzowWzEtOV18WzEtMl1bMC05XXwzWzAtMV0pLyxcclxuICAgICAgY2FwdHVyZTogLyhbMC05XXs0fSktKDBbMS05XXwxWzAtMl0pLSgwWzEtOV18WzEtMl1bMC05XXwzWzAtMV0pL1xyXG4gICAgfSxcclxuICAgIFwianNvblwiOiB7XHJcbiAgICAgIGVuY29kZTogYW5ndWxhci50b0pzb24sXHJcbiAgICAgIGRlY29kZTogYW5ndWxhci5mcm9tSnNvbixcclxuICAgICAgaXM6IGFuZ3VsYXIuaXNPYmplY3QsXHJcbiAgICAgIGVxdWFsczogYW5ndWxhci5lcXVhbHMsXHJcbiAgICAgIHBhdHRlcm46IC9bXi9dKi9cclxuICAgIH0sXHJcbiAgICBcImFueVwiOiB7IC8vIGRvZXMgbm90IGVuY29kZS9kZWNvZGVcclxuICAgICAgZW5jb2RlOiBhbmd1bGFyLmlkZW50aXR5LFxyXG4gICAgICBkZWNvZGU6IGFuZ3VsYXIuaWRlbnRpdHksXHJcbiAgICAgIGVxdWFsczogYW5ndWxhci5lcXVhbHMsXHJcbiAgICAgIHBhdHRlcm46IC8uKi9cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBnZXREZWZhdWx0Q29uZmlnKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RyaWN0OiBpc1N0cmljdE1vZGUsXHJcbiAgICAgIGNhc2VJbnNlbnNpdGl2ZTogaXNDYXNlSW5zZW5zaXRpdmVcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpc0luamVjdGFibGUodmFsdWUpIHtcclxuICAgIHJldHVybiAoaXNGdW5jdGlvbih2YWx1ZSkgfHwgKGlzQXJyYXkodmFsdWUpICYmIGlzRnVuY3Rpb24odmFsdWVbdmFsdWUubGVuZ3RoIC0gMV0pKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBbSW50ZXJuYWxdIEdldCB0aGUgZGVmYXVsdCB2YWx1ZSBvZiBhIHBhcmFtZXRlciwgd2hpY2ggbWF5IGJlIGFuIGluamVjdGFibGUgZnVuY3Rpb24uXHJcbiAgICovXHJcbiAgJFVybE1hdGNoZXJGYWN0b3J5LiQkZ2V0RGVmYXVsdFZhbHVlID0gZnVuY3Rpb24oY29uZmlnKSB7XHJcbiAgICBpZiAoIWlzSW5qZWN0YWJsZShjb25maWcudmFsdWUpKSByZXR1cm4gY29uZmlnLnZhbHVlO1xyXG4gICAgaWYgKCFpbmplY3RvcikgdGhyb3cgbmV3IEVycm9yKFwiSW5qZWN0YWJsZSBmdW5jdGlvbnMgY2Fubm90IGJlIGNhbGxlZCBhdCBjb25maWd1cmF0aW9uIHRpbWVcIik7XHJcbiAgICByZXR1cm4gaW5qZWN0b3IuaW52b2tlKGNvbmZpZy52YWx1ZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHVybE1hdGNoZXJGYWN0b3J5I2Nhc2VJbnNlbnNpdGl2ZVxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIERlZmluZXMgd2hldGhlciBVUkwgbWF0Y2hpbmcgc2hvdWxkIGJlIGNhc2Ugc2Vuc2l0aXZlICh0aGUgZGVmYXVsdCBiZWhhdmlvciksIG9yIG5vdC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWUgYGZhbHNlYCB0byBtYXRjaCBVUkwgaW4gYSBjYXNlIHNlbnNpdGl2ZSBtYW5uZXI7IG90aGVyd2lzZSBgdHJ1ZWA7XHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRoZSBjdXJyZW50IHZhbHVlIG9mIGNhc2VJbnNlbnNpdGl2ZVxyXG4gICAqL1xyXG4gIHRoaXMuY2FzZUluc2Vuc2l0aXZlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmIChpc0RlZmluZWQodmFsdWUpKVxyXG4gICAgICBpc0Nhc2VJbnNlbnNpdGl2ZSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIGlzQ2FzZUluc2Vuc2l0aXZlO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeSNzdHJpY3RNb2RlXHJcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeVxyXG4gICAqXHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogRGVmaW5lcyB3aGV0aGVyIFVSTHMgc2hvdWxkIG1hdGNoIHRyYWlsaW5nIHNsYXNoZXMsIG9yIG5vdCAodGhlIGRlZmF1bHQgYmVoYXZpb3IpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFuPX0gdmFsdWUgYGZhbHNlYCB0byBtYXRjaCB0cmFpbGluZyBzbGFzaGVzIGluIFVSTHMsIG90aGVyd2lzZSBgdHJ1ZWAuXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRoZSBjdXJyZW50IHZhbHVlIG9mIHN0cmljdE1vZGVcclxuICAgKi9cclxuICB0aGlzLnN0cmljdE1vZGUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKGlzRGVmaW5lZCh2YWx1ZSkpXHJcbiAgICAgIGlzU3RyaWN0TW9kZSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIGlzU3RyaWN0TW9kZTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnkjZGVmYXVsdFNxdWFzaFBvbGljeVxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgYmVoYXZpb3Igd2hlbiBnZW5lcmF0aW5nIG9yIG1hdGNoaW5nIFVSTHMgd2l0aCBkZWZhdWx0IHBhcmFtZXRlciB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgQSBzdHJpbmcgdGhhdCBkZWZpbmVzIHRoZSBkZWZhdWx0IHBhcmFtZXRlciBVUkwgc3F1YXNoaW5nIGJlaGF2aW9yLlxyXG4gICAqICAgIGBub3NxdWFzaGA6IFdoZW4gZ2VuZXJhdGluZyBhbiBocmVmIHdpdGggYSBkZWZhdWx0IHBhcmFtZXRlciB2YWx1ZSwgZG8gbm90IHNxdWFzaCB0aGUgcGFyYW1ldGVyIHZhbHVlIGZyb20gdGhlIFVSTFxyXG4gICAqICAgIGBzbGFzaGA6IFdoZW4gZ2VuZXJhdGluZyBhbiBocmVmIHdpdGggYSBkZWZhdWx0IHBhcmFtZXRlciB2YWx1ZSwgc3F1YXNoIChyZW1vdmUpIHRoZSBwYXJhbWV0ZXIgdmFsdWUsIGFuZCwgaWYgdGhlXHJcbiAgICogICAgICAgICAgICAgcGFyYW1ldGVyIGlzIHN1cnJvdW5kZWQgYnkgc2xhc2hlcywgc3F1YXNoIChyZW1vdmUpIG9uZSBzbGFzaCBmcm9tIHRoZSBVUkxcclxuICAgKiAgICBhbnkgb3RoZXIgc3RyaW5nLCBlLmcuIFwiflwiOiBXaGVuIGdlbmVyYXRpbmcgYW4gaHJlZiB3aXRoIGEgZGVmYXVsdCBwYXJhbWV0ZXIgdmFsdWUsIHNxdWFzaCAocmVtb3ZlKVxyXG4gICAqICAgICAgICAgICAgIHRoZSBwYXJhbWV0ZXIgdmFsdWUgZnJvbSB0aGUgVVJMIGFuZCByZXBsYWNlIGl0IHdpdGggdGhpcyBzdHJpbmcuXHJcbiAgICovXHJcbiAgdGhpcy5kZWZhdWx0U3F1YXNoUG9saWN5ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNEZWZpbmVkKHZhbHVlKSkgcmV0dXJuIGRlZmF1bHRTcXVhc2hQb2xpY3k7XHJcbiAgICBpZiAodmFsdWUgIT09IHRydWUgJiYgdmFsdWUgIT09IGZhbHNlICYmICFpc1N0cmluZyh2YWx1ZSkpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc3F1YXNoIHBvbGljeTogXCIgKyB2YWx1ZSArIFwiLiBWYWxpZCBwb2xpY2llczogZmFsc2UsIHRydWUsIGFyYml0cmFyeS1zdHJpbmdcIik7XHJcbiAgICBkZWZhdWx0U3F1YXNoUG9saWN5ID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHVybE1hdGNoZXJGYWN0b3J5I2NvbXBpbGVcclxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwuJHVybE1hdGNoZXJGYWN0b3J5XHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBDcmVhdGVzIGEge0BsaW5rIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciBgVXJsTWF0Y2hlcmB9IGZvciB0aGUgc3BlY2lmaWVkIHBhdHRlcm4uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0dGVybiAgVGhlIFVSTCBwYXR0ZXJuLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgIFRoZSBjb25maWcgb2JqZWN0IGhhc2guXHJcbiAgICogQHJldHVybnMge1VybE1hdGNoZXJ9ICBUaGUgVXJsTWF0Y2hlci5cclxuICAgKi9cclxuICB0aGlzLmNvbXBpbGUgPSBmdW5jdGlvbiAocGF0dGVybiwgY29uZmlnKSB7XHJcbiAgICByZXR1cm4gbmV3IFVybE1hdGNoZXIocGF0dGVybiwgZXh0ZW5kKGdldERlZmF1bHRDb25maWcoKSwgY29uZmlnKSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHVybE1hdGNoZXJGYWN0b3J5I2lzTWF0Y2hlclxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgc3BlY2lmaWVkIG9iamVjdCBpcyBhIGBVcmxNYXRjaGVyYCwgb3IgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCAgVGhlIG9iamVjdCB0byBwZXJmb3JtIHRoZSB0eXBlIGNoZWNrIGFnYWluc3QuXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59ICBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0IG1hdGNoZXMgdGhlIGBVcmxNYXRjaGVyYCBpbnRlcmZhY2UsIGJ5XHJcbiAgICogICAgICAgICAgaW1wbGVtZW50aW5nIGFsbCB0aGUgc2FtZSBtZXRob2RzLlxyXG4gICAqL1xyXG4gIHRoaXMuaXNNYXRjaGVyID0gZnVuY3Rpb24gKG8pIHtcclxuICAgIGlmICghaXNPYmplY3QobykpIHJldHVybiBmYWxzZTtcclxuICAgIHZhciByZXN1bHQgPSB0cnVlO1xyXG5cclxuICAgIGZvckVhY2goVXJsTWF0Y2hlci5wcm90b3R5cGUsIGZ1bmN0aW9uKHZhbCwgbmFtZSkge1xyXG4gICAgICBpZiAoaXNGdW5jdGlvbih2YWwpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICYmIChpc0RlZmluZWQob1tuYW1lXSkgJiYgaXNGdW5jdGlvbihvW25hbWVdKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnkjdHlwZVxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIFJlZ2lzdGVycyBhIGN1c3RvbSB7QGxpbmsgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlIGBUeXBlYH0gb2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG9cclxuICAgKiBnZW5lcmF0ZSBVUkxzIHdpdGggdHlwZWQgcGFyYW1ldGVycy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lICBUaGUgdHlwZSBuYW1lLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBkZWZpbml0aW9uICAgVGhlIHR5cGUgZGVmaW5pdGlvbi4gU2VlXHJcbiAgICogICAgICAgIHtAbGluayB1aS5yb3V0ZXIudXRpbC50eXBlOlR5cGUgYFR5cGVgfSBmb3IgaW5mb3JtYXRpb24gb24gdGhlIHZhbHVlcyBhY2NlcHRlZC5cclxuICAgKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gZGVmaW5pdGlvbkZuIChvcHRpb25hbCkgQSBmdW5jdGlvbiB0aGF0IGlzIGluamVjdGVkIGJlZm9yZSB0aGUgYXBwXHJcbiAgICogICAgICAgIHJ1bnRpbWUgc3RhcnRzLiAgVGhlIHJlc3VsdCBvZiB0aGlzIGZ1bmN0aW9uIGlzIG1lcmdlZCBpbnRvIHRoZSBleGlzdGluZyBgZGVmaW5pdGlvbmAuXHJcbiAgICogICAgICAgIFNlZSB7QGxpbmsgdWkucm91dGVyLnV0aWwudHlwZTpUeXBlIGBUeXBlYH0gZm9yIGluZm9ybWF0aW9uIG9uIHRoZSB2YWx1ZXMgYWNjZXB0ZWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSAgUmV0dXJucyBgJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXJgLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBUaGlzIGlzIGEgc2ltcGxlIGV4YW1wbGUgb2YgYSBjdXN0b20gdHlwZSB0aGF0IGVuY29kZXMgYW5kIGRlY29kZXMgaXRlbXMgZnJvbSBhblxyXG4gICAqIGFycmF5LCB1c2luZyB0aGUgYXJyYXkgaW5kZXggYXMgdGhlIFVSTC1lbmNvZGVkIHZhbHVlOlxyXG4gICAqXHJcbiAgICogPHByZT5cclxuICAgKiB2YXIgbGlzdCA9IFsnSm9obicsICdQYXVsJywgJ0dlb3JnZScsICdSaW5nbyddO1xyXG4gICAqXHJcbiAgICogJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXIudHlwZSgnbGlzdEl0ZW0nLCB7XHJcbiAgICogICBlbmNvZGU6IGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgKiAgICAgLy8gUmVwcmVzZW50IHRoZSBsaXN0IGl0ZW0gaW4gdGhlIFVSTCB1c2luZyBpdHMgY29ycmVzcG9uZGluZyBpbmRleFxyXG4gICAqICAgICByZXR1cm4gbGlzdC5pbmRleE9mKGl0ZW0pO1xyXG4gICAqICAgfSxcclxuICAgKiAgIGRlY29kZTogZnVuY3Rpb24oaXRlbSkge1xyXG4gICAqICAgICAvLyBMb29rIHVwIHRoZSBsaXN0IGl0ZW0gYnkgaW5kZXhcclxuICAgKiAgICAgcmV0dXJuIGxpc3RbcGFyc2VJbnQoaXRlbSwgMTApXTtcclxuICAgKiAgIH0sXHJcbiAgICogICBpczogZnVuY3Rpb24oaXRlbSkge1xyXG4gICAqICAgICAvLyBFbnN1cmUgdGhlIGl0ZW0gaXMgdmFsaWQgYnkgY2hlY2tpbmcgdG8gc2VlIHRoYXQgaXQgYXBwZWFyc1xyXG4gICAqICAgICAvLyBpbiB0aGUgbGlzdFxyXG4gICAqICAgICByZXR1cm4gbGlzdC5pbmRleE9mKGl0ZW0pID4gLTE7XHJcbiAgICogICB9XHJcbiAgICogfSk7XHJcbiAgICpcclxuICAgKiAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGlzdCcsIHtcclxuICAgKiAgIHVybDogXCIvbGlzdC97aXRlbTpsaXN0SXRlbX1cIixcclxuICAgKiAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICogICAgIGNvbnNvbGUubG9nKCRzdGF0ZVBhcmFtcy5pdGVtKTtcclxuICAgKiAgIH1cclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqIC8vIC4uLlxyXG4gICAqXHJcbiAgICogLy8gQ2hhbmdlcyBVUkwgdG8gJy9saXN0LzMnLCBsb2dzIFwiUmluZ29cIiB0byB0aGUgY29uc29sZVxyXG4gICAqICRzdGF0ZS5nbygnbGlzdCcsIHsgaXRlbTogXCJSaW5nb1wiIH0pO1xyXG4gICAqIDwvcHJlPlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyBhIG1vcmUgY29tcGxleCBleGFtcGxlIG9mIGEgdHlwZSB0aGF0IHJlbGllcyBvbiBkZXBlbmRlbmN5IGluamVjdGlvbiB0b1xyXG4gICAqIGludGVyYWN0IHdpdGggc2VydmljZXMsIGFuZCB1c2VzIHRoZSBwYXJhbWV0ZXIgbmFtZSBmcm9tIHRoZSBVUkwgdG8gaW5mZXIgaG93IHRvXHJcbiAgICogaGFuZGxlIGVuY29kaW5nIGFuZCBkZWNvZGluZyBwYXJhbWV0ZXIgdmFsdWVzOlxyXG4gICAqXHJcbiAgICogPHByZT5cclxuICAgKiAvLyBEZWZpbmVzIGEgY3VzdG9tIHR5cGUgdGhhdCBnZXRzIGEgdmFsdWUgZnJvbSBhIHNlcnZpY2UsXHJcbiAgICogLy8gd2hlcmUgZWFjaCBzZXJ2aWNlIGdldHMgZGlmZmVyZW50IHR5cGVzIG9mIHZhbHVlcyBmcm9tXHJcbiAgICogLy8gYSBiYWNrZW5kIEFQSTpcclxuICAgKiAkdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlci50eXBlKCdkYk9iamVjdCcsIHt9LCBmdW5jdGlvbihVc2VycywgUG9zdHMpIHtcclxuICAgKlxyXG4gICAqICAgLy8gTWF0Y2hlcyB1cCBzZXJ2aWNlcyB0byBVUkwgcGFyYW1ldGVyIG5hbWVzXHJcbiAgICogICB2YXIgc2VydmljZXMgPSB7XHJcbiAgICogICAgIHVzZXI6IFVzZXJzLFxyXG4gICAqICAgICBwb3N0OiBQb3N0c1xyXG4gICAqICAgfTtcclxuICAgKlxyXG4gICAqICAgcmV0dXJuIHtcclxuICAgKiAgICAgZW5jb2RlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuICAgKiAgICAgICAvLyBSZXByZXNlbnQgdGhlIG9iamVjdCBpbiB0aGUgVVJMIHVzaW5nIGl0cyB1bmlxdWUgSURcclxuICAgKiAgICAgICByZXR1cm4gb2JqZWN0LmlkO1xyXG4gICAqICAgICB9LFxyXG4gICAqICAgICBkZWNvZGU6IGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcclxuICAgKiAgICAgICAvLyBMb29rIHVwIHRoZSBvYmplY3QgYnkgSUQsIHVzaW5nIHRoZSBwYXJhbWV0ZXJcclxuICAgKiAgICAgICAvLyBuYW1lIChrZXkpIHRvIGNhbGwgdGhlIGNvcnJlY3Qgc2VydmljZVxyXG4gICAqICAgICAgIHJldHVybiBzZXJ2aWNlc1trZXldLmZpbmRCeUlkKHZhbHVlKTtcclxuICAgKiAgICAgfSxcclxuICAgKiAgICAgaXM6IGZ1bmN0aW9uKG9iamVjdCwga2V5KSB7XHJcbiAgICogICAgICAgLy8gQ2hlY2sgdGhhdCBvYmplY3QgaXMgYSB2YWxpZCBkYk9iamVjdFxyXG4gICAqICAgICAgIHJldHVybiBhbmd1bGFyLmlzT2JqZWN0KG9iamVjdCkgJiYgb2JqZWN0LmlkICYmIHNlcnZpY2VzW2tleV07XHJcbiAgICogICAgIH1cclxuICAgKiAgICAgZXF1YWxzOiBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICogICAgICAgLy8gQ2hlY2sgdGhlIGVxdWFsaXR5IG9mIGRlY29kZWQgb2JqZWN0cyBieSBjb21wYXJpbmdcclxuICAgKiAgICAgICAvLyB0aGVpciB1bmlxdWUgSURzXHJcbiAgICogICAgICAgcmV0dXJuIGEuaWQgPT09IGIuaWQ7XHJcbiAgICogICAgIH1cclxuICAgKiAgIH07XHJcbiAgICogfSk7XHJcbiAgICpcclxuICAgKiAvLyBJbiBhIGNvbmZpZygpIGJsb2NrLCB5b3UgY2FuIHRoZW4gYXR0YWNoIFVSTHMgd2l0aFxyXG4gICAqIC8vIHR5cGUtYW5ub3RhdGVkIHBhcmFtZXRlcnM6XHJcbiAgICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXJzJywge1xyXG4gICAqICAgdXJsOiBcIi91c2Vyc1wiLFxyXG4gICAqICAgLy8gLi4uXHJcbiAgICogfSkuc3RhdGUoJ3VzZXJzLml0ZW0nLCB7XHJcbiAgICogICB1cmw6IFwiL3t1c2VyOmRiT2JqZWN0fVwiLFxyXG4gICAqICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgKiAgICAgLy8gJHN0YXRlUGFyYW1zLnVzZXIgd2lsbCBub3cgYmUgYW4gb2JqZWN0IHJldHVybmVkIGZyb21cclxuICAgKiAgICAgLy8gdGhlIFVzZXJzIHNlcnZpY2VcclxuICAgKiAgIH0sXHJcbiAgICogICAvLyAuLi5cclxuICAgKiB9KTtcclxuICAgKiA8L3ByZT5cclxuICAgKi9cclxuICB0aGlzLnR5cGUgPSBmdW5jdGlvbiAobmFtZSwgZGVmaW5pdGlvbiwgZGVmaW5pdGlvbkZuKSB7XHJcbiAgICBpZiAoIWlzRGVmaW5lZChkZWZpbml0aW9uKSkgcmV0dXJuICR0eXBlc1tuYW1lXTtcclxuICAgIGlmICgkdHlwZXMuaGFzT3duUHJvcGVydHkobmFtZSkpIHRocm93IG5ldyBFcnJvcihcIkEgdHlwZSBuYW1lZCAnXCIgKyBuYW1lICsgXCInIGhhcyBhbHJlYWR5IGJlZW4gZGVmaW5lZC5cIik7XHJcblxyXG4gICAgJHR5cGVzW25hbWVdID0gbmV3IFR5cGUoZXh0ZW5kKHsgbmFtZTogbmFtZSB9LCBkZWZpbml0aW9uKSk7XHJcbiAgICBpZiAoZGVmaW5pdGlvbkZuKSB7XHJcbiAgICAgIHR5cGVRdWV1ZS5wdXNoKHsgbmFtZTogbmFtZSwgZGVmOiBkZWZpbml0aW9uRm4gfSk7XHJcbiAgICAgIGlmICghZW5xdWV1ZSkgZmx1c2hUeXBlUXVldWUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIC8vIGBmbHVzaFR5cGVRdWV1ZSgpYCB3YWl0cyB1bnRpbCBgJHVybE1hdGNoZXJGYWN0b3J5YCBpcyBpbmplY3RlZCBiZWZvcmUgaW52b2tpbmcgdGhlIHF1ZXVlZCBgZGVmaW5pdGlvbkZuYHNcclxuICBmdW5jdGlvbiBmbHVzaFR5cGVRdWV1ZSgpIHtcclxuICAgIHdoaWxlKHR5cGVRdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgdmFyIHR5cGUgPSB0eXBlUXVldWUuc2hpZnQoKTtcclxuICAgICAgaWYgKHR5cGUucGF0dGVybikgdGhyb3cgbmV3IEVycm9yKFwiWW91IGNhbm5vdCBvdmVycmlkZSBhIHR5cGUncyAucGF0dGVybiBhdCBydW50aW1lLlwiKTtcclxuICAgICAgYW5ndWxhci5leHRlbmQoJHR5cGVzW3R5cGUubmFtZV0sIGluamVjdG9yLmludm9rZSh0eXBlLmRlZikpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUmVnaXN0ZXIgZGVmYXVsdCB0eXBlcy4gU3RvcmUgdGhlbSBpbiB0aGUgcHJvdG90eXBlIG9mICR0eXBlcy5cclxuICBmb3JFYWNoKGRlZmF1bHRUeXBlcywgZnVuY3Rpb24odHlwZSwgbmFtZSkgeyAkdHlwZXNbbmFtZV0gPSBuZXcgVHlwZShleHRlbmQoe25hbWU6IG5hbWV9LCB0eXBlKSk7IH0pO1xyXG4gICR0eXBlcyA9IGluaGVyaXQoJHR5cGVzLCB7fSk7XHJcblxyXG4gIC8qIE5vIG5lZWQgdG8gZG9jdW1lbnQgJGdldCwgc2luY2UgaXQgcmV0dXJucyB0aGlzICovXHJcbiAgdGhpcy4kZ2V0ID0gWyckaW5qZWN0b3InLCBmdW5jdGlvbiAoJGluamVjdG9yKSB7XHJcbiAgICBpbmplY3RvciA9ICRpbmplY3RvcjtcclxuICAgIGVucXVldWUgPSBmYWxzZTtcclxuICAgIGZsdXNoVHlwZVF1ZXVlKCk7XHJcblxyXG4gICAgZm9yRWFjaChkZWZhdWx0VHlwZXMsIGZ1bmN0aW9uKHR5cGUsIG5hbWUpIHtcclxuICAgICAgaWYgKCEkdHlwZXNbbmFtZV0pICR0eXBlc1tuYW1lXSA9IG5ldyBUeXBlKHR5cGUpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XTtcclxuXHJcbiAgdGhpcy5QYXJhbSA9IGZ1bmN0aW9uIFBhcmFtKGlkLCB0eXBlLCBjb25maWcsIGxvY2F0aW9uKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBjb25maWcgPSB1bndyYXBTaG9ydGhhbmQoY29uZmlnKTtcclxuICAgIHR5cGUgPSBnZXRUeXBlKGNvbmZpZywgdHlwZSwgbG9jYXRpb24pO1xyXG4gICAgdmFyIGFycmF5TW9kZSA9IGdldEFycmF5TW9kZSgpO1xyXG4gICAgdHlwZSA9IGFycmF5TW9kZSA/IHR5cGUuJGFzQXJyYXkoYXJyYXlNb2RlLCBsb2NhdGlvbiA9PT0gXCJzZWFyY2hcIikgOiB0eXBlO1xyXG4gICAgaWYgKHR5cGUubmFtZSA9PT0gXCJzdHJpbmdcIiAmJiAhYXJyYXlNb2RlICYmIGxvY2F0aW9uID09PSBcInBhdGhcIiAmJiBjb25maWcudmFsdWUgPT09IHVuZGVmaW5lZClcclxuICAgICAgY29uZmlnLnZhbHVlID0gXCJcIjsgLy8gZm9yIDAuMi54OyBpbiAwLjMuMCsgZG8gbm90IGF1dG9tYXRpY2FsbHkgZGVmYXVsdCB0byBcIlwiXHJcbiAgICB2YXIgaXNPcHRpb25hbCA9IGNvbmZpZy52YWx1ZSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgdmFyIHNxdWFzaCA9IGdldFNxdWFzaFBvbGljeShjb25maWcsIGlzT3B0aW9uYWwpO1xyXG4gICAgdmFyIHJlcGxhY2UgPSBnZXRSZXBsYWNlKGNvbmZpZywgYXJyYXlNb2RlLCBpc09wdGlvbmFsLCBzcXVhc2gpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHVud3JhcFNob3J0aGFuZChjb25maWcpIHtcclxuICAgICAgdmFyIGtleXMgPSBpc09iamVjdChjb25maWcpID8gb2JqZWN0S2V5cyhjb25maWcpIDogW107XHJcbiAgICAgIHZhciBpc1Nob3J0aGFuZCA9IGluZGV4T2Yoa2V5cywgXCJ2YWx1ZVwiKSA9PT0gLTEgJiYgaW5kZXhPZihrZXlzLCBcInR5cGVcIikgPT09IC0xICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4T2Yoa2V5cywgXCJzcXVhc2hcIikgPT09IC0xICYmIGluZGV4T2Yoa2V5cywgXCJhcnJheVwiKSA9PT0gLTE7XHJcbiAgICAgIGlmIChpc1Nob3J0aGFuZCkgY29uZmlnID0geyB2YWx1ZTogY29uZmlnIH07XHJcbiAgICAgIGNvbmZpZy4kJGZuID0gaXNJbmplY3RhYmxlKGNvbmZpZy52YWx1ZSkgPyBjb25maWcudmFsdWUgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25maWcudmFsdWU7IH07XHJcbiAgICAgIHJldHVybiBjb25maWc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0VHlwZShjb25maWcsIHVybFR5cGUsIGxvY2F0aW9uKSB7XHJcbiAgICAgIGlmIChjb25maWcudHlwZSAmJiB1cmxUeXBlKSB0aHJvdyBuZXcgRXJyb3IoXCJQYXJhbSAnXCIraWQrXCInIGhhcyB0d28gdHlwZSBjb25maWd1cmF0aW9ucy5cIik7XHJcbiAgICAgIGlmICh1cmxUeXBlKSByZXR1cm4gdXJsVHlwZTtcclxuICAgICAgaWYgKCFjb25maWcudHlwZSkgcmV0dXJuIChsb2NhdGlvbiA9PT0gXCJjb25maWdcIiA/ICR0eXBlcy5hbnkgOiAkdHlwZXMuc3RyaW5nKTtcclxuXHJcbiAgICAgIGlmIChhbmd1bGFyLmlzU3RyaW5nKGNvbmZpZy50eXBlKSlcclxuICAgICAgICByZXR1cm4gJHR5cGVzW2NvbmZpZy50eXBlXTtcclxuICAgICAgaWYgKGNvbmZpZy50eXBlIGluc3RhbmNlb2YgVHlwZSlcclxuICAgICAgICByZXR1cm4gY29uZmlnLnR5cGU7XHJcbiAgICAgIHJldHVybiBuZXcgVHlwZShjb25maWcudHlwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYXJyYXkgY29uZmlnOiBwYXJhbSBuYW1lIChwYXJhbVtdKSBvdmVycmlkZXMgZGVmYXVsdCBzZXR0aW5ncy4gIGV4cGxpY2l0IGNvbmZpZyBvdmVycmlkZXMgcGFyYW0gbmFtZS5cclxuICAgIGZ1bmN0aW9uIGdldEFycmF5TW9kZSgpIHtcclxuICAgICAgdmFyIGFycmF5RGVmYXVsdHMgPSB7IGFycmF5OiAobG9jYXRpb24gPT09IFwic2VhcmNoXCIgPyBcImF1dG9cIiA6IGZhbHNlKSB9O1xyXG4gICAgICB2YXIgYXJyYXlQYXJhbU5vbWVuY2xhdHVyZSA9IGlkLm1hdGNoKC9cXFtcXF0kLykgPyB7IGFycmF5OiB0cnVlIH0gOiB7fTtcclxuICAgICAgcmV0dXJuIGV4dGVuZChhcnJheURlZmF1bHRzLCBhcnJheVBhcmFtTm9tZW5jbGF0dXJlLCBjb25maWcpLmFycmF5O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBmYWxzZSwgdHJ1ZSwgb3IgdGhlIHNxdWFzaCB2YWx1ZSB0byBpbmRpY2F0ZSB0aGUgXCJkZWZhdWx0IHBhcmFtZXRlciB1cmwgc3F1YXNoIHBvbGljeVwiLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRTcXVhc2hQb2xpY3koY29uZmlnLCBpc09wdGlvbmFsKSB7XHJcbiAgICAgIHZhciBzcXVhc2ggPSBjb25maWcuc3F1YXNoO1xyXG4gICAgICBpZiAoIWlzT3B0aW9uYWwgfHwgc3F1YXNoID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICBpZiAoIWlzRGVmaW5lZChzcXVhc2gpIHx8IHNxdWFzaCA9PSBudWxsKSByZXR1cm4gZGVmYXVsdFNxdWFzaFBvbGljeTtcclxuICAgICAgaWYgKHNxdWFzaCA9PT0gdHJ1ZSB8fCBpc1N0cmluZyhzcXVhc2gpKSByZXR1cm4gc3F1YXNoO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHNxdWFzaCBwb2xpY3k6ICdcIiArIHNxdWFzaCArIFwiJy4gVmFsaWQgcG9saWNpZXM6IGZhbHNlLCB0cnVlLCBvciBhcmJpdHJhcnkgc3RyaW5nXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFJlcGxhY2UoY29uZmlnLCBhcnJheU1vZGUsIGlzT3B0aW9uYWwsIHNxdWFzaCkge1xyXG4gICAgICB2YXIgcmVwbGFjZSwgY29uZmlndXJlZEtleXMsIGRlZmF1bHRQb2xpY3kgPSBbXHJcbiAgICAgICAgeyBmcm9tOiBcIlwiLCAgIHRvOiAoaXNPcHRpb25hbCB8fCBhcnJheU1vZGUgPyB1bmRlZmluZWQgOiBcIlwiKSB9LFxyXG4gICAgICAgIHsgZnJvbTogbnVsbCwgdG86IChpc09wdGlvbmFsIHx8IGFycmF5TW9kZSA/IHVuZGVmaW5lZCA6IFwiXCIpIH1cclxuICAgICAgXTtcclxuICAgICAgcmVwbGFjZSA9IGlzQXJyYXkoY29uZmlnLnJlcGxhY2UpID8gY29uZmlnLnJlcGxhY2UgOiBbXTtcclxuICAgICAgaWYgKGlzU3RyaW5nKHNxdWFzaCkpXHJcbiAgICAgICAgcmVwbGFjZS5wdXNoKHsgZnJvbTogc3F1YXNoLCB0bzogdW5kZWZpbmVkIH0pO1xyXG4gICAgICBjb25maWd1cmVkS2V5cyA9IG1hcChyZXBsYWNlLCBmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmZyb207IH0gKTtcclxuICAgICAgcmV0dXJuIGZpbHRlcihkZWZhdWx0UG9saWN5LCBmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpbmRleE9mKGNvbmZpZ3VyZWRLZXlzLCBpdGVtLmZyb20pID09PSAtMTsgfSkuY29uY2F0KHJlcGxhY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogW0ludGVybmFsXSBHZXQgdGhlIGRlZmF1bHQgdmFsdWUgb2YgYSBwYXJhbWV0ZXIsIHdoaWNoIG1heSBiZSBhbiBpbmplY3RhYmxlIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiAkJGdldERlZmF1bHRWYWx1ZSgpIHtcclxuICAgICAgaWYgKCFpbmplY3RvcikgdGhyb3cgbmV3IEVycm9yKFwiSW5qZWN0YWJsZSBmdW5jdGlvbnMgY2Fubm90IGJlIGNhbGxlZCBhdCBjb25maWd1cmF0aW9uIHRpbWVcIik7XHJcbiAgICAgIHZhciBkZWZhdWx0VmFsdWUgPSBpbmplY3Rvci5pbnZva2UoY29uZmlnLiQkZm4pO1xyXG4gICAgICBpZiAoZGVmYXVsdFZhbHVlICE9PSBudWxsICYmIGRlZmF1bHRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmICFzZWxmLnR5cGUuaXMoZGVmYXVsdFZhbHVlKSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEZWZhdWx0IHZhbHVlIChcIiArIGRlZmF1bHRWYWx1ZSArIFwiKSBmb3IgcGFyYW1ldGVyICdcIiArIHNlbGYuaWQgKyBcIicgaXMgbm90IGFuIGluc3RhbmNlIG9mIFR5cGUgKFwiICsgc2VsZi50eXBlLm5hbWUgKyBcIilcIik7XHJcbiAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBbSW50ZXJuYWxdIEdldHMgdGhlIGRlY29kZWQgcmVwcmVzZW50YXRpb24gb2YgYSB2YWx1ZSBpZiB0aGUgdmFsdWUgaXMgZGVmaW5lZCwgb3RoZXJ3aXNlLCByZXR1cm5zIHRoZVxyXG4gICAgICogZGVmYXVsdCB2YWx1ZSwgd2hpY2ggbWF5IGJlIHRoZSByZXN1bHQgb2YgYW4gaW5qZWN0YWJsZSBmdW5jdGlvbi5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gJHZhbHVlKHZhbHVlKSB7XHJcbiAgICAgIGZ1bmN0aW9uIGhhc1JlcGxhY2VWYWwodmFsKSB7IHJldHVybiBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9iai5mcm9tID09PSB2YWw7IH07IH1cclxuICAgICAgZnVuY3Rpb24gJHJlcGxhY2UodmFsdWUpIHtcclxuICAgICAgICB2YXIgcmVwbGFjZW1lbnQgPSBtYXAoZmlsdGVyKHNlbGYucmVwbGFjZSwgaGFzUmVwbGFjZVZhbCh2YWx1ZSkpLCBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9iai50bzsgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcGxhY2VtZW50Lmxlbmd0aCA/IHJlcGxhY2VtZW50WzBdIDogdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgdmFsdWUgPSAkcmVwbGFjZSh2YWx1ZSk7XHJcbiAgICAgIHJldHVybiAhaXNEZWZpbmVkKHZhbHVlKSA/ICQkZ2V0RGVmYXVsdFZhbHVlKCkgOiBzZWxmLnR5cGUuJG5vcm1hbGl6ZSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdG9TdHJpbmcoKSB7IHJldHVybiBcIntQYXJhbTpcIiArIGlkICsgXCIgXCIgKyB0eXBlICsgXCIgc3F1YXNoOiAnXCIgKyBzcXVhc2ggKyBcIicgb3B0aW9uYWw6IFwiICsgaXNPcHRpb25hbCArIFwifVwiOyB9XHJcblxyXG4gICAgZXh0ZW5kKHRoaXMsIHtcclxuICAgICAgaWQ6IGlkLFxyXG4gICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICBsb2NhdGlvbjogbG9jYXRpb24sXHJcbiAgICAgIGFycmF5OiBhcnJheU1vZGUsXHJcbiAgICAgIHNxdWFzaDogc3F1YXNoLFxyXG4gICAgICByZXBsYWNlOiByZXBsYWNlLFxyXG4gICAgICBpc09wdGlvbmFsOiBpc09wdGlvbmFsLFxyXG4gICAgICB2YWx1ZTogJHZhbHVlLFxyXG4gICAgICBkeW5hbWljOiB1bmRlZmluZWQsXHJcbiAgICAgIGNvbmZpZzogY29uZmlnLFxyXG4gICAgICB0b1N0cmluZzogdG9TdHJpbmdcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIFBhcmFtU2V0KHBhcmFtcykge1xyXG4gICAgZXh0ZW5kKHRoaXMsIHBhcmFtcyB8fCB7fSk7XHJcbiAgfVxyXG5cclxuICBQYXJhbVNldC5wcm90b3R5cGUgPSB7XHJcbiAgICAkJG5ldzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBpbmhlcml0KHRoaXMsIGV4dGVuZChuZXcgUGFyYW1TZXQoKSwgeyAkJHBhcmVudDogdGhpc30pKTtcclxuICAgIH0sXHJcbiAgICAkJGtleXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGtleXMgPSBbXSwgY2hhaW4gPSBbXSwgcGFyZW50ID0gdGhpcyxcclxuICAgICAgICBpZ25vcmUgPSBvYmplY3RLZXlzKFBhcmFtU2V0LnByb3RvdHlwZSk7XHJcbiAgICAgIHdoaWxlIChwYXJlbnQpIHsgY2hhaW4ucHVzaChwYXJlbnQpOyBwYXJlbnQgPSBwYXJlbnQuJCRwYXJlbnQ7IH1cclxuICAgICAgY2hhaW4ucmV2ZXJzZSgpO1xyXG4gICAgICBmb3JFYWNoKGNoYWluLCBmdW5jdGlvbihwYXJhbXNldCkge1xyXG4gICAgICAgIGZvckVhY2gob2JqZWN0S2V5cyhwYXJhbXNldCksIGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICBpZiAoaW5kZXhPZihrZXlzLCBrZXkpID09PSAtMSAmJiBpbmRleE9mKGlnbm9yZSwga2V5KSA9PT0gLTEpIGtleXMucHVzaChrZXkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9LFxyXG4gICAgJCR2YWx1ZXM6IGZ1bmN0aW9uKHBhcmFtVmFsdWVzKSB7XHJcbiAgICAgIHZhciB2YWx1ZXMgPSB7fSwgc2VsZiA9IHRoaXM7XHJcbiAgICAgIGZvckVhY2goc2VsZi4kJGtleXMoKSwgZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgdmFsdWVzW2tleV0gPSBzZWxmW2tleV0udmFsdWUocGFyYW1WYWx1ZXMgJiYgcGFyYW1WYWx1ZXNba2V5XSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgfSxcclxuICAgICQkZXF1YWxzOiBmdW5jdGlvbihwYXJhbVZhbHVlczEsIHBhcmFtVmFsdWVzMikge1xyXG4gICAgICB2YXIgZXF1YWwgPSB0cnVlLCBzZWxmID0gdGhpcztcclxuICAgICAgZm9yRWFjaChzZWxmLiQka2V5cygpLCBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICB2YXIgbGVmdCA9IHBhcmFtVmFsdWVzMSAmJiBwYXJhbVZhbHVlczFba2V5XSwgcmlnaHQgPSBwYXJhbVZhbHVlczIgJiYgcGFyYW1WYWx1ZXMyW2tleV07XHJcbiAgICAgICAgaWYgKCFzZWxmW2tleV0udHlwZS5lcXVhbHMobGVmdCwgcmlnaHQpKSBlcXVhbCA9IGZhbHNlO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGVxdWFsO1xyXG4gICAgfSxcclxuICAgICQkdmFsaWRhdGVzOiBmdW5jdGlvbiAkJHZhbGlkYXRlKHBhcmFtVmFsdWVzKSB7XHJcbiAgICAgIHZhciBrZXlzID0gdGhpcy4kJGtleXMoKSwgaSwgcGFyYW0sIHJhd1ZhbCwgbm9ybWFsaXplZCwgZW5jb2RlZDtcclxuICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBwYXJhbSA9IHRoaXNba2V5c1tpXV07XHJcbiAgICAgICAgcmF3VmFsID0gcGFyYW1WYWx1ZXNba2V5c1tpXV07XHJcbiAgICAgICAgaWYgKChyYXdWYWwgPT09IHVuZGVmaW5lZCB8fCByYXdWYWwgPT09IG51bGwpICYmIHBhcmFtLmlzT3B0aW9uYWwpXHJcbiAgICAgICAgICBicmVhazsgLy8gVGhlcmUgd2FzIG5vIHBhcmFtZXRlciB2YWx1ZSwgYnV0IHRoZSBwYXJhbSBpcyBvcHRpb25hbFxyXG4gICAgICAgIG5vcm1hbGl6ZWQgPSBwYXJhbS50eXBlLiRub3JtYWxpemUocmF3VmFsKTtcclxuICAgICAgICBpZiAoIXBhcmFtLnR5cGUuaXMobm9ybWFsaXplZCkpXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRoZSB2YWx1ZSB3YXMgbm90IG9mIHRoZSBjb3JyZWN0IFR5cGUsIGFuZCBjb3VsZCBub3QgYmUgZGVjb2RlZCB0byB0aGUgY29ycmVjdCBUeXBlXHJcbiAgICAgICAgZW5jb2RlZCA9IHBhcmFtLnR5cGUuZW5jb2RlKG5vcm1hbGl6ZWQpO1xyXG4gICAgICAgIGlmIChhbmd1bGFyLmlzU3RyaW5nKGVuY29kZWQpICYmICFwYXJhbS50eXBlLnBhdHRlcm4uZXhlYyhlbmNvZGVkKSlcclxuICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gVGhlIHZhbHVlIHdhcyBvZiB0aGUgY29ycmVjdCB0eXBlLCBidXQgd2hlbiBlbmNvZGVkLCBkaWQgbm90IG1hdGNoIHRoZSBUeXBlJ3MgcmVnZXhwXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgJCRwYXJlbnQ6IHVuZGVmaW5lZFxyXG4gIH07XHJcblxyXG4gIHRoaXMuUGFyYW1TZXQgPSBQYXJhbVNldDtcclxufVxyXG5cclxuLy8gUmVnaXN0ZXIgYXMgYSBwcm92aWRlciBzbyBpdCdzIGF2YWlsYWJsZSB0byBvdGhlciBwcm92aWRlcnNcclxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci51dGlsJykucHJvdmlkZXIoJyR1cmxNYXRjaGVyRmFjdG9yeScsICRVcmxNYXRjaGVyRmFjdG9yeSk7XHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIudXRpbCcpLnJ1bihbJyR1cmxNYXRjaGVyRmFjdG9yeScsIGZ1bmN0aW9uKCR1cmxNYXRjaGVyRmFjdG9yeSkgeyB9XSk7XHJcblxyXG4vKipcclxuICogQG5nZG9jIG9iamVjdFxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlclxyXG4gKlxyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnV0aWwuJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXJcclxuICogQHJlcXVpcmVzICRsb2NhdGlvblByb3ZpZGVyXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBgJHVybFJvdXRlclByb3ZpZGVyYCBoYXMgdGhlIHJlc3BvbnNpYmlsaXR5IG9mIHdhdGNoaW5nIGAkbG9jYXRpb25gLiBcclxuICogV2hlbiBgJGxvY2F0aW9uYCBjaGFuZ2VzIGl0IHJ1bnMgdGhyb3VnaCBhIGxpc3Qgb2YgcnVsZXMgb25lIGJ5IG9uZSB1bnRpbCBhIFxyXG4gKiBtYXRjaCBpcyBmb3VuZC4gYCR1cmxSb3V0ZXJQcm92aWRlcmAgaXMgdXNlZCBiZWhpbmQgdGhlIHNjZW5lcyBhbnl0aW1lIHlvdSBzcGVjaWZ5IFxyXG4gKiBhIHVybCBpbiBhIHN0YXRlIGNvbmZpZ3VyYXRpb24uIEFsbCB1cmxzIGFyZSBjb21waWxlZCBpbnRvIGEgVXJsTWF0Y2hlciBvYmplY3QuXHJcbiAqXHJcbiAqIFRoZXJlIGFyZSBzZXZlcmFsIG1ldGhvZHMgb24gYCR1cmxSb3V0ZXJQcm92aWRlcmAgdGhhdCBtYWtlIGl0IHVzZWZ1bCB0byB1c2UgZGlyZWN0bHlcclxuICogaW4geW91ciBtb2R1bGUgY29uZmlnLlxyXG4gKi9cclxuJFVybFJvdXRlclByb3ZpZGVyLiRpbmplY3QgPSBbJyRsb2NhdGlvblByb3ZpZGVyJywgJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJ107XHJcbmZ1bmN0aW9uICRVcmxSb3V0ZXJQcm92aWRlciggICAkbG9jYXRpb25Qcm92aWRlciwgICAkdXJsTWF0Y2hlckZhY3RvcnkpIHtcclxuICB2YXIgcnVsZXMgPSBbXSwgb3RoZXJ3aXNlID0gbnVsbCwgaW50ZXJjZXB0RGVmZXJyZWQgPSBmYWxzZSwgbGlzdGVuZXI7XHJcblxyXG4gIC8vIFJldHVybnMgYSBzdHJpbmcgdGhhdCBpcyBhIHByZWZpeCBvZiBhbGwgc3RyaW5ncyBtYXRjaGluZyB0aGUgUmVnRXhwXHJcbiAgZnVuY3Rpb24gcmVnRXhwUHJlZml4KHJlKSB7XHJcbiAgICB2YXIgcHJlZml4ID0gL15cXF4oKD86XFxcXFteYS16QS1aMC05XXxbXlxcXFxcXFtcXF1cXF4kKis/LigpfHt9XSspKikvLmV4ZWMocmUuc291cmNlKTtcclxuICAgIHJldHVybiAocHJlZml4ICE9IG51bGwpID8gcHJlZml4WzFdLnJlcGxhY2UoL1xcXFwoLikvZywgXCIkMVwiKSA6ICcnO1xyXG4gIH1cclxuXHJcbiAgLy8gSW50ZXJwb2xhdGVzIG1hdGNoZWQgdmFsdWVzIGludG8gYSBTdHJpbmcucmVwbGFjZSgpLXN0eWxlIHBhdHRlcm5cclxuICBmdW5jdGlvbiBpbnRlcnBvbGF0ZShwYXR0ZXJuLCBtYXRjaCkge1xyXG4gICAgcmV0dXJuIHBhdHRlcm4ucmVwbGFjZSgvXFwkKFxcJHxcXGR7MSwyfSkvLCBmdW5jdGlvbiAobSwgd2hhdCkge1xyXG4gICAgICByZXR1cm4gbWF0Y2hbd2hhdCA9PT0gJyQnID8gMCA6IE51bWJlcih3aGF0KV07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci5yb3V0ZXIuJHVybFJvdXRlclByb3ZpZGVyI3J1bGVcclxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXJcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIERlZmluZXMgcnVsZXMgdGhhdCBhcmUgdXNlZCBieSBgJHVybFJvdXRlclByb3ZpZGVyYCB0byBmaW5kIG1hdGNoZXMgZm9yXHJcbiAgICogc3BlY2lmaWMgVVJMcy5cclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogPHByZT5cclxuICAgKiB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsndWkucm91dGVyLnJvdXRlciddKTtcclxuICAgKlxyXG4gICAqIGFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICAqICAgLy8gSGVyZSdzIGFuIGV4YW1wbGUgb2YgaG93IHlvdSBtaWdodCBhbGxvdyBjYXNlIGluc2Vuc2l0aXZlIHVybHNcclxuICAgKiAgICR1cmxSb3V0ZXJQcm92aWRlci5ydWxlKGZ1bmN0aW9uICgkaW5qZWN0b3IsICRsb2NhdGlvbikge1xyXG4gICAqICAgICB2YXIgcGF0aCA9ICRsb2NhdGlvbi5wYXRoKCksXHJcbiAgICogICAgICAgICBub3JtYWxpemVkID0gcGF0aC50b0xvd2VyQ2FzZSgpO1xyXG4gICAqXHJcbiAgICogICAgIGlmIChwYXRoICE9PSBub3JtYWxpemVkKSB7XHJcbiAgICogICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XHJcbiAgICogICAgIH1cclxuICAgKiAgIH0pO1xyXG4gICAqIH0pO1xyXG4gICAqIDwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gcnVsZSBIYW5kbGVyIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYCRpbmplY3RvcmAgYW5kIGAkbG9jYXRpb25gXHJcbiAgICogc2VydmljZXMgYXMgYXJndW1lbnRzLiBZb3UgY2FuIHVzZSB0aGVtIHRvIHJldHVybiBhIHZhbGlkIHBhdGggYXMgYSBzdHJpbmcuXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGAkdXJsUm91dGVyUHJvdmlkZXJgIC0gYCR1cmxSb3V0ZXJQcm92aWRlcmAgaW5zdGFuY2VcclxuICAgKi9cclxuICB0aGlzLnJ1bGUgPSBmdW5jdGlvbiAocnVsZSkge1xyXG4gICAgaWYgKCFpc0Z1bmN0aW9uKHJ1bGUpKSB0aHJvdyBuZXcgRXJyb3IoXCIncnVsZScgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgcnVsZXMucHVzaChydWxlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBvYmplY3RcclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlciNvdGhlcndpc2VcclxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXJcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIERlZmluZXMgYSBwYXRoIHRoYXQgaXMgdXNlZCB3aGVuIGFuIGludmFsaWQgcm91dGUgaXMgcmVxdWVzdGVkLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiA8cHJlPlxyXG4gICAqIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyd1aS5yb3V0ZXIucm91dGVyJ10pO1xyXG4gICAqXHJcbiAgICogYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgICogICAvLyBpZiB0aGUgcGF0aCBkb2Vzbid0IG1hdGNoIGFueSBvZiB0aGUgdXJscyB5b3UgY29uZmlndXJlZFxyXG4gICAqICAgLy8gb3RoZXJ3aXNlIHdpbGwgdGFrZSBjYXJlIG9mIHJvdXRpbmcgdGhlIHVzZXIgdG8gdGhlXHJcbiAgICogICAvLyBzcGVjaWZpZWQgdXJsXHJcbiAgICogICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvaW5kZXgnKTtcclxuICAgKlxyXG4gICAqICAgLy8gRXhhbXBsZSBvZiB1c2luZyBmdW5jdGlvbiBydWxlIGFzIHBhcmFtXHJcbiAgICogICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKGZ1bmN0aW9uICgkaW5qZWN0b3IsICRsb2NhdGlvbikge1xyXG4gICAqICAgICByZXR1cm4gJy9hL3ZhbGlkL3VybCc7XHJcbiAgICogICB9KTtcclxuICAgKiB9KTtcclxuICAgKiA8L3ByZT5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufSBydWxlIFRoZSB1cmwgcGF0aCB5b3Ugd2FudCB0byByZWRpcmVjdCB0byBvciBhIGZ1bmN0aW9uIFxyXG4gICAqIHJ1bGUgdGhhdCByZXR1cm5zIHRoZSB1cmwgcGF0aC4gVGhlIGZ1bmN0aW9uIHZlcnNpb24gaXMgcGFzc2VkIHR3byBwYXJhbXM6IFxyXG4gICAqIGAkaW5qZWN0b3JgIGFuZCBgJGxvY2F0aW9uYCBzZXJ2aWNlcywgYW5kIG11c3QgcmV0dXJuIGEgdXJsIHN0cmluZy5cclxuICAgKlxyXG4gICAqIEByZXR1cm4ge29iamVjdH0gYCR1cmxSb3V0ZXJQcm92aWRlcmAgLSBgJHVybFJvdXRlclByb3ZpZGVyYCBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHRoaXMub3RoZXJ3aXNlID0gZnVuY3Rpb24gKHJ1bGUpIHtcclxuICAgIGlmIChpc1N0cmluZyhydWxlKSkge1xyXG4gICAgICB2YXIgcmVkaXJlY3QgPSBydWxlO1xyXG4gICAgICBydWxlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkaXJlY3Q7IH07XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICghaXNGdW5jdGlvbihydWxlKSkgdGhyb3cgbmV3IEVycm9yKFwiJ3J1bGUnIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcclxuICAgIG90aGVyd2lzZSA9IHJ1bGU7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlSWZNYXRjaCgkaW5qZWN0b3IsIGhhbmRsZXIsIG1hdGNoKSB7XHJcbiAgICBpZiAoIW1hdGNoKSByZXR1cm4gZmFsc2U7XHJcbiAgICB2YXIgcmVzdWx0ID0gJGluamVjdG9yLmludm9rZShoYW5kbGVyLCBoYW5kbGVyLCB7ICRtYXRjaDogbWF0Y2ggfSk7XHJcbiAgICByZXR1cm4gaXNEZWZpbmVkKHJlc3VsdCkgPyByZXN1bHQgOiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICogQG5hbWUgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXIjd2hlblxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlclxyXG4gICAqXHJcbiAgICogQGRlc2NyaXB0aW9uXHJcbiAgICogUmVnaXN0ZXJzIGEgaGFuZGxlciBmb3IgYSBnaXZlbiB1cmwgbWF0Y2hpbmcuIFxyXG4gICAqIFxyXG4gICAqIElmIHRoZSBoYW5kbGVyIGlzIGEgc3RyaW5nLCBpdCBpc1xyXG4gICAqIHRyZWF0ZWQgYXMgYSByZWRpcmVjdCwgYW5kIGlzIGludGVycG9sYXRlZCBhY2NvcmRpbmcgdG8gdGhlIHN5bnRheCBvZiBtYXRjaFxyXG4gICAqIChpLmUuIGxpa2UgYFN0cmluZy5yZXBsYWNlKClgIGZvciBgUmVnRXhwYCwgb3IgbGlrZSBhIGBVcmxNYXRjaGVyYCBwYXR0ZXJuIG90aGVyd2lzZSkuXHJcbiAgICpcclxuICAgKiBJZiB0aGUgaGFuZGxlciBpcyBhIGZ1bmN0aW9uLCBpdCBpcyBpbmplY3RhYmxlLiBJdCBnZXRzIGludm9rZWQgaWYgYCRsb2NhdGlvbmBcclxuICAgKiBtYXRjaGVzLiBZb3UgaGF2ZSB0aGUgb3B0aW9uIG9mIGluamVjdCB0aGUgbWF0Y2ggb2JqZWN0IGFzIGAkbWF0Y2hgLlxyXG4gICAqXHJcbiAgICogVGhlIGhhbmRsZXIgY2FuIHJldHVyblxyXG4gICAqXHJcbiAgICogLSAqKmZhbHN5KiogdG8gaW5kaWNhdGUgdGhhdCB0aGUgcnVsZSBkaWRuJ3QgbWF0Y2ggYWZ0ZXIgYWxsLCB0aGVuIGAkdXJsUm91dGVyYFxyXG4gICAqICAgd2lsbCBjb250aW51ZSB0cnlpbmcgdG8gZmluZCBhbm90aGVyIG9uZSB0aGF0IG1hdGNoZXMuXHJcbiAgICogLSAqKnN0cmluZyoqIHdoaWNoIGlzIHRyZWF0ZWQgYXMgYSByZWRpcmVjdCBhbmQgcGFzc2VkIHRvIGAkbG9jYXRpb24udXJsKClgXHJcbiAgICogLSAqKnZvaWQqKiBvciBhbnkgKip0cnV0aHkqKiB2YWx1ZSB0ZWxscyBgJHVybFJvdXRlcmAgdGhhdCB0aGUgdXJsIHdhcyBoYW5kbGVkLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiA8cHJlPlxyXG4gICAqIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyd1aS5yb3V0ZXIucm91dGVyJ10pO1xyXG4gICAqXHJcbiAgICogYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgICogICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbigkc3RhdGUudXJsLCBmdW5jdGlvbiAoJG1hdGNoLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgKiAgICAgaWYgKCRzdGF0ZS4kY3VycmVudC5uYXZpZ2FibGUgIT09IHN0YXRlIHx8XHJcbiAgICogICAgICAgICAhZXF1YWxGb3JLZXlzKCRtYXRjaCwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICogICAgICAkc3RhdGUudHJhbnNpdGlvblRvKHN0YXRlLCAkbWF0Y2gsIGZhbHNlKTtcclxuICAgKiAgICAgfVxyXG4gICAqICAgfSk7XHJcbiAgICogfSk7XHJcbiAgICogPC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHdoYXQgVGhlIGluY29taW5nIHBhdGggdGhhdCB5b3Ugd2FudCB0byByZWRpcmVjdC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gaGFuZGxlciBUaGUgcGF0aCB5b3Ugd2FudCB0byByZWRpcmVjdCB5b3VyIHVzZXIgdG8uXHJcbiAgICovXHJcbiAgdGhpcy53aGVuID0gZnVuY3Rpb24gKHdoYXQsIGhhbmRsZXIpIHtcclxuICAgIHZhciByZWRpcmVjdCwgaGFuZGxlcklzU3RyaW5nID0gaXNTdHJpbmcoaGFuZGxlcik7XHJcbiAgICBpZiAoaXNTdHJpbmcod2hhdCkpIHdoYXQgPSAkdXJsTWF0Y2hlckZhY3RvcnkuY29tcGlsZSh3aGF0KTtcclxuXHJcbiAgICBpZiAoIWhhbmRsZXJJc1N0cmluZyAmJiAhaXNGdW5jdGlvbihoYW5kbGVyKSAmJiAhaXNBcnJheShoYW5kbGVyKSlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCAnaGFuZGxlcicgaW4gd2hlbigpXCIpO1xyXG5cclxuICAgIHZhciBzdHJhdGVnaWVzID0ge1xyXG4gICAgICBtYXRjaGVyOiBmdW5jdGlvbiAod2hhdCwgaGFuZGxlcikge1xyXG4gICAgICAgIGlmIChoYW5kbGVySXNTdHJpbmcpIHtcclxuICAgICAgICAgIHJlZGlyZWN0ID0gJHVybE1hdGNoZXJGYWN0b3J5LmNvbXBpbGUoaGFuZGxlcik7XHJcbiAgICAgICAgICBoYW5kbGVyID0gWyckbWF0Y2gnLCBmdW5jdGlvbiAoJG1hdGNoKSB7IHJldHVybiByZWRpcmVjdC5mb3JtYXQoJG1hdGNoKTsgfV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBleHRlbmQoZnVuY3Rpb24gKCRpbmplY3RvciwgJGxvY2F0aW9uKSB7XHJcbiAgICAgICAgICByZXR1cm4gaGFuZGxlSWZNYXRjaCgkaW5qZWN0b3IsIGhhbmRsZXIsIHdoYXQuZXhlYygkbG9jYXRpb24ucGF0aCgpLCAkbG9jYXRpb24uc2VhcmNoKCkpKTtcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBwcmVmaXg6IGlzU3RyaW5nKHdoYXQucHJlZml4KSA/IHdoYXQucHJlZml4IDogJydcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgcmVnZXg6IGZ1bmN0aW9uICh3aGF0LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKHdoYXQuZ2xvYmFsIHx8IHdoYXQuc3RpY2t5KSB0aHJvdyBuZXcgRXJyb3IoXCJ3aGVuKCkgUmVnRXhwIG11c3Qgbm90IGJlIGdsb2JhbCBvciBzdGlja3lcIik7XHJcblxyXG4gICAgICAgIGlmIChoYW5kbGVySXNTdHJpbmcpIHtcclxuICAgICAgICAgIHJlZGlyZWN0ID0gaGFuZGxlcjtcclxuICAgICAgICAgIGhhbmRsZXIgPSBbJyRtYXRjaCcsIGZ1bmN0aW9uICgkbWF0Y2gpIHsgcmV0dXJuIGludGVycG9sYXRlKHJlZGlyZWN0LCAkbWF0Y2gpOyB9XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoJGluamVjdG9yLCAkbG9jYXRpb24pIHtcclxuICAgICAgICAgIHJldHVybiBoYW5kbGVJZk1hdGNoKCRpbmplY3RvciwgaGFuZGxlciwgd2hhdC5leGVjKCRsb2NhdGlvbi5wYXRoKCkpKTtcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBwcmVmaXg6IHJlZ0V4cFByZWZpeCh3aGF0KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjaGVjayA9IHsgbWF0Y2hlcjogJHVybE1hdGNoZXJGYWN0b3J5LmlzTWF0Y2hlcih3aGF0KSwgcmVnZXg6IHdoYXQgaW5zdGFuY2VvZiBSZWdFeHAgfTtcclxuXHJcbiAgICBmb3IgKHZhciBuIGluIGNoZWNrKSB7XHJcbiAgICAgIGlmIChjaGVja1tuXSkgcmV0dXJuIHRoaXMucnVsZShzdHJhdGVnaWVzW25dKHdoYXQsIGhhbmRsZXIpKTtcclxuICAgIH1cclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkICd3aGF0JyBpbiB3aGVuKClcIik7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICogQG5hbWUgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXIjZGVmZXJJbnRlcmNlcHRcclxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXJcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIERpc2FibGVzIChvciBlbmFibGVzKSBkZWZlcnJpbmcgbG9jYXRpb24gY2hhbmdlIGludGVyY2VwdGlvbi5cclxuICAgKlxyXG4gICAqIElmIHlvdSB3aXNoIHRvIGN1c3RvbWl6ZSB0aGUgYmVoYXZpb3Igb2Ygc3luY2luZyB0aGUgVVJMIChmb3IgZXhhbXBsZSwgaWYgeW91IHdpc2ggdG9cclxuICAgKiBkZWZlciBhIHRyYW5zaXRpb24gYnV0IG1haW50YWluIHRoZSBjdXJyZW50IFVSTCksIGNhbGwgdGhpcyBtZXRob2QgYXQgY29uZmlndXJhdGlvbiB0aW1lLlxyXG4gICAqIFRoZW4sIGF0IHJ1biB0aW1lLCBjYWxsIGAkdXJsUm91dGVyLmxpc3RlbigpYCBhZnRlciB5b3UgaGF2ZSBjb25maWd1cmVkIHlvdXIgb3duXHJcbiAgICogYCRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3NgIGV2ZW50IGhhbmRsZXIuXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIDxwcmU+XHJcbiAgICogdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlci5yb3V0ZXInXSk7XHJcbiAgICpcclxuICAgKiBhcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAgKlxyXG4gICAqICAgLy8gUHJldmVudCAkdXJsUm91dGVyIGZyb20gYXV0b21hdGljYWxseSBpbnRlcmNlcHRpbmcgVVJMIGNoYW5nZXM7XHJcbiAgICogICAvLyB0aGlzIGFsbG93cyB5b3UgdG8gY29uZmlndXJlIGN1c3RvbSBiZWhhdmlvciBpbiBiZXR3ZWVuXHJcbiAgICogICAvLyBsb2NhdGlvbiBjaGFuZ2VzIGFuZCByb3V0ZSBzeW5jaHJvbml6YXRpb246XHJcbiAgICogICAkdXJsUm91dGVyUHJvdmlkZXIuZGVmZXJJbnRlcmNlcHQoKTtcclxuICAgKlxyXG4gICAqIH0pLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHVybFJvdXRlciwgVXNlclNlcnZpY2UpIHtcclxuICAgKlxyXG4gICAqICAgJHJvb3RTY29wZS4kb24oJyRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihlKSB7XHJcbiAgICogICAgIC8vIFVzZXJTZXJ2aWNlIGlzIGFuIGV4YW1wbGUgc2VydmljZSBmb3IgbWFuYWdpbmcgdXNlciBzdGF0ZVxyXG4gICAqICAgICBpZiAoVXNlclNlcnZpY2UuaXNMb2dnZWRJbigpKSByZXR1cm47XHJcbiAgICpcclxuICAgKiAgICAgLy8gUHJldmVudCAkdXJsUm91dGVyJ3MgZGVmYXVsdCBoYW5kbGVyIGZyb20gZmlyaW5nXHJcbiAgICogICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgKlxyXG4gICAqICAgICBVc2VyU2VydmljZS5oYW5kbGVMb2dpbigpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICogICAgICAgLy8gT25jZSB0aGUgdXNlciBoYXMgbG9nZ2VkIGluLCBzeW5jIHRoZSBjdXJyZW50IFVSTFxyXG4gICAqICAgICAgIC8vIHRvIHRoZSByb3V0ZXI6XHJcbiAgICogICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICogICAgIH0pO1xyXG4gICAqICAgfSk7XHJcbiAgICpcclxuICAgKiAgIC8vIENvbmZpZ3VyZXMgJHVybFJvdXRlcidzIGxpc3RlbmVyICphZnRlciogeW91ciBjdXN0b20gbGlzdGVuZXJcclxuICAgKiAgICR1cmxSb3V0ZXIubGlzdGVuKCk7XHJcbiAgICogfSk7XHJcbiAgICogPC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRlZmVyIEluZGljYXRlcyB3aGV0aGVyIHRvIGRlZmVyIGxvY2F0aW9uIGNoYW5nZSBpbnRlcmNlcHRpb24uIFBhc3NpbmdcclxuICAgICAgICAgICAgbm8gcGFyYW1ldGVyIGlzIGVxdWl2YWxlbnQgdG8gYHRydWVgLlxyXG4gICAqL1xyXG4gIHRoaXMuZGVmZXJJbnRlcmNlcHQgPSBmdW5jdGlvbiAoZGVmZXIpIHtcclxuICAgIGlmIChkZWZlciA9PT0gdW5kZWZpbmVkKSBkZWZlciA9IHRydWU7XHJcbiAgICBpbnRlcmNlcHREZWZlcnJlZCA9IGRlZmVyO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBvYmplY3RcclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJcclxuICAgKlxyXG4gICAqIEByZXF1aXJlcyAkbG9jYXRpb25cclxuICAgKiBAcmVxdWlyZXMgJHJvb3RTY29wZVxyXG4gICAqIEByZXF1aXJlcyAkaW5qZWN0b3JcclxuICAgKiBAcmVxdWlyZXMgJGJyb3dzZXJcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqXHJcbiAgICovXHJcbiAgdGhpcy4kZ2V0ID0gJGdldDtcclxuICAkZ2V0LiRpbmplY3QgPSBbJyRsb2NhdGlvbicsICckcm9vdFNjb3BlJywgJyRpbmplY3RvcicsICckYnJvd3NlcicsICckc25pZmZlciddO1xyXG4gIGZ1bmN0aW9uICRnZXQoICAgJGxvY2F0aW9uLCAgICRyb290U2NvcGUsICAgJGluamVjdG9yLCAgICRicm93c2VyLCAgICRzbmlmZmVyKSB7XHJcblxyXG4gICAgdmFyIGJhc2VIcmVmID0gJGJyb3dzZXIuYmFzZUhyZWYoKSwgbG9jYXRpb24gPSAkbG9jYXRpb24udXJsKCksIGxhc3RQdXNoZWRVcmw7XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwZW5kQmFzZVBhdGgodXJsLCBpc0h0bWw1LCBhYnNvbHV0ZSkge1xyXG4gICAgICBpZiAoYmFzZUhyZWYgPT09ICcvJykgcmV0dXJuIHVybDtcclxuICAgICAgaWYgKGlzSHRtbDUpIHJldHVybiBiYXNlSHJlZi5zbGljZSgwLCAtMSkgKyB1cmw7XHJcbiAgICAgIGlmIChhYnNvbHV0ZSkgcmV0dXJuIGJhc2VIcmVmLnNsaWNlKDEpICsgdXJsO1xyXG4gICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IE9wdGltaXplIGdyb3VwcyBvZiBydWxlcyB3aXRoIG5vbi1lbXB0eSBwcmVmaXggaW50byBzb21lIHNvcnQgb2YgZGVjaXNpb24gdHJlZVxyXG4gICAgZnVuY3Rpb24gdXBkYXRlKGV2dCkge1xyXG4gICAgICBpZiAoZXZ0ICYmIGV2dC5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XHJcbiAgICAgIHZhciBpZ25vcmVVcGRhdGUgPSBsYXN0UHVzaGVkVXJsICYmICRsb2NhdGlvbi51cmwoKSA9PT0gbGFzdFB1c2hlZFVybDtcclxuICAgICAgbGFzdFB1c2hlZFVybCA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gVE9ETzogUmUtaW1wbGVtZW50IHRoaXMgaW4gMS4wIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci11aS91aS1yb3V0ZXIvaXNzdWVzLzE1NzNcclxuICAgICAgLy9pZiAoaWdub3JlVXBkYXRlKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNoZWNrKHJ1bGUpIHtcclxuICAgICAgICB2YXIgaGFuZGxlZCA9IHJ1bGUoJGluamVjdG9yLCAkbG9jYXRpb24pO1xyXG5cclxuICAgICAgICBpZiAoIWhhbmRsZWQpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoaGFuZGxlZCkpICRsb2NhdGlvbi5yZXBsYWNlKCkudXJsKGhhbmRsZWQpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBuID0gcnVsZXMubGVuZ3RoLCBpO1xyXG5cclxuICAgICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgIGlmIChjaGVjayhydWxlc1tpXSkpIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAvLyBhbHdheXMgY2hlY2sgb3RoZXJ3aXNlIGxhc3QgdG8gYWxsb3cgZHluYW1pYyB1cGRhdGVzIHRvIHRoZSBzZXQgb2YgcnVsZXNcclxuICAgICAgaWYgKG90aGVyd2lzZSkgY2hlY2sob3RoZXJ3aXNlKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsaXN0ZW4oKSB7XHJcbiAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXIgfHwgJHJvb3RTY29wZS4kb24oJyRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3MnLCB1cGRhdGUpO1xyXG4gICAgICByZXR1cm4gbGlzdGVuZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpbnRlcmNlcHREZWZlcnJlZCkgbGlzdGVuKCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXIjc3luY1xyXG4gICAgICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBkZXNjcmlwdGlvblxyXG4gICAgICAgKiBUcmlnZ2VycyBhbiB1cGRhdGU7IHRoZSBzYW1lIHVwZGF0ZSB0aGF0IGhhcHBlbnMgd2hlbiB0aGUgYWRkcmVzcyBiYXIgdXJsIGNoYW5nZXMsIGFrYSBgJGxvY2F0aW9uQ2hhbmdlU3VjY2Vzc2AuXHJcbiAgICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCB3aGVuIHlvdSBuZWVkIHRvIHVzZSBgcHJldmVudERlZmF1bHQoKWAgb24gdGhlIGAkbG9jYXRpb25DaGFuZ2VTdWNjZXNzYCBldmVudCxcclxuICAgICAgICogcGVyZm9ybSBzb21lIGN1c3RvbSBsb2dpYyAocm91dGUgcHJvdGVjdGlvbiwgYXV0aCwgY29uZmlnLCByZWRpcmVjdGlvbiwgZXRjKSBhbmQgdGhlbiBmaW5hbGx5IHByb2NlZWRcclxuICAgICAgICogd2l0aCB0aGUgdHJhbnNpdGlvbiBieSBjYWxsaW5nIGAkdXJsUm91dGVyLnN5bmMoKWAuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAqIDxwcmU+XHJcbiAgICAgICAqIGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlciddKVxyXG4gICAgICAgKiAgIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJHVybFJvdXRlcikge1xyXG4gICAgICAgKiAgICAgJHJvb3RTY29wZS4kb24oJyRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICogICAgICAgLy8gSGFsdCBzdGF0ZSBjaGFuZ2UgZnJvbSBldmVuIHN0YXJ0aW5nXHJcbiAgICAgICAqICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgKiAgICAgICAvLyBQZXJmb3JtIGN1c3RvbSBsb2dpY1xyXG4gICAgICAgKiAgICAgICB2YXIgbWVldHNSZXF1aXJlbWVudCA9IC4uLlxyXG4gICAgICAgKiAgICAgICAvLyBDb250aW51ZSB3aXRoIHRoZSB1cGRhdGUgYW5kIHN0YXRlIHRyYW5zaXRpb24gaWYgbG9naWMgYWxsb3dzXHJcbiAgICAgICAqICAgICAgIGlmIChtZWV0c1JlcXVpcmVtZW50KSAkdXJsUm91dGVyLnN5bmMoKTtcclxuICAgICAgICogICAgIH0pO1xyXG4gICAgICAgKiB9KTtcclxuICAgICAgICogPC9wcmU+XHJcbiAgICAgICAqL1xyXG4gICAgICBzeW5jOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB1cGRhdGUoKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGxpc3RlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGxpc3RlbigpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihyZWFkKSB7XHJcbiAgICAgICAgaWYgKHJlYWQpIHtcclxuICAgICAgICAgIGxvY2F0aW9uID0gJGxvY2F0aW9uLnVybCgpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoJGxvY2F0aW9uLnVybCgpID09PSBsb2NhdGlvbikgcmV0dXJuO1xyXG5cclxuICAgICAgICAkbG9jYXRpb24udXJsKGxvY2F0aW9uKTtcclxuICAgICAgICAkbG9jYXRpb24ucmVwbGFjZSgpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcHVzaDogZnVuY3Rpb24odXJsTWF0Y2hlciwgcGFyYW1zLCBvcHRpb25zKSB7XHJcbiAgICAgICAgIHZhciB1cmwgPSB1cmxNYXRjaGVyLmZvcm1hdChwYXJhbXMgfHwge30pO1xyXG5cclxuICAgICAgICAvLyBIYW5kbGUgdGhlIHNwZWNpYWwgaGFzaCBwYXJhbSwgaWYgbmVlZGVkXHJcbiAgICAgICAgaWYgKHVybCAhPT0gbnVsbCAmJiBwYXJhbXMgJiYgcGFyYW1zWycjJ10pIHtcclxuICAgICAgICAgICAgdXJsICs9ICcjJyArIHBhcmFtc1snIyddO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGxvY2F0aW9uLnVybCh1cmwpO1xyXG4gICAgICAgIGxhc3RQdXNoZWRVcmwgPSBvcHRpb25zICYmIG9wdGlvbnMuJCRhdm9pZFJlc3luYyA/ICRsb2NhdGlvbi51cmwoKSA6IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJlcGxhY2UpICRsb2NhdGlvbi5yZXBsYWNlKCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICAgICAqIEBuYW1lIHVpLnJvdXRlci5yb3V0ZXIuJHVybFJvdXRlciNocmVmXHJcbiAgICAgICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJcclxuICAgICAgICpcclxuICAgICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgICAqIEEgVVJMIGdlbmVyYXRpb24gbWV0aG9kIHRoYXQgcmV0dXJucyB0aGUgY29tcGlsZWQgVVJMIGZvciBhIGdpdmVuXHJcbiAgICAgICAqIHtAbGluayB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIgYFVybE1hdGNoZXJgfSwgcG9wdWxhdGVkIHdpdGggdGhlIHByb3ZpZGVkIHBhcmFtZXRlcnMuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBleGFtcGxlXHJcbiAgICAgICAqIDxwcmU+XHJcbiAgICAgICAqICRib2IgPSAkdXJsUm91dGVyLmhyZWYobmV3IFVybE1hdGNoZXIoXCIvYWJvdXQvOnBlcnNvblwiKSwge1xyXG4gICAgICAgKiAgIHBlcnNvbjogXCJib2JcIlxyXG4gICAgICAgKiB9KTtcclxuICAgICAgICogLy8gJGJvYiA9PSBcIi9hYm91dC9ib2JcIjtcclxuICAgICAgICogPC9wcmU+XHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBwYXJhbSB7VXJsTWF0Y2hlcn0gdXJsTWF0Y2hlciBUaGUgYFVybE1hdGNoZXJgIG9iamVjdCB3aGljaCBpcyB1c2VkIGFzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgVVJMIHRvIGdlbmVyYXRlLlxyXG4gICAgICAgKiBAcGFyYW0ge29iamVjdD19IHBhcmFtcyBBbiBvYmplY3Qgb2YgcGFyYW1ldGVyIHZhbHVlcyB0byBmaWxsIHRoZSBtYXRjaGVyJ3MgcmVxdWlyZWQgcGFyYW1ldGVycy5cclxuICAgICAgICogQHBhcmFtIHtvYmplY3Q9fSBvcHRpb25zIE9wdGlvbnMgb2JqZWN0LiBUaGUgb3B0aW9ucyBhcmU6XHJcbiAgICAgICAqXHJcbiAgICAgICAqIC0gKipgYWJzb2x1dGVgKiogLSB7Ym9vbGVhbj1mYWxzZX0sICBJZiB0cnVlIHdpbGwgZ2VuZXJhdGUgYW4gYWJzb2x1dGUgdXJsLCBlLmcuIFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9mdWxsdXJsXCIuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGZ1bGx5IGNvbXBpbGVkIFVSTCwgb3IgYG51bGxgIGlmIGBwYXJhbXNgIGZhaWwgdmFsaWRhdGlvbiBhZ2FpbnN0IGB1cmxNYXRjaGVyYFxyXG4gICAgICAgKi9cclxuICAgICAgaHJlZjogZnVuY3Rpb24odXJsTWF0Y2hlciwgcGFyYW1zLCBvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKCF1cmxNYXRjaGVyLnZhbGlkYXRlcyhwYXJhbXMpKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIGlzSHRtbDUgPSAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUoKTtcclxuICAgICAgICBpZiAoYW5ndWxhci5pc09iamVjdChpc0h0bWw1KSkge1xyXG4gICAgICAgICAgaXNIdG1sNSA9IGlzSHRtbDUuZW5hYmxlZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlzSHRtbDUgPSBpc0h0bWw1ICYmICRzbmlmZmVyLmhpc3Rvcnk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybCA9IHVybE1hdGNoZXIuZm9ybWF0KHBhcmFtcyk7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIGlmICghaXNIdG1sNSAmJiB1cmwgIT09IG51bGwpIHtcclxuICAgICAgICAgIHVybCA9IFwiI1wiICsgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgpICsgdXJsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIHNwZWNpYWwgaGFzaCBwYXJhbSwgaWYgbmVlZGVkXHJcbiAgICAgICAgaWYgKHVybCAhPT0gbnVsbCAmJiBwYXJhbXMgJiYgcGFyYW1zWycjJ10pIHtcclxuICAgICAgICAgIHVybCArPSAnIycgKyBwYXJhbXNbJyMnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVybCA9IGFwcGVuZEJhc2VQYXRoKHVybCwgaXNIdG1sNSwgb3B0aW9ucy5hYnNvbHV0ZSk7XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9ucy5hYnNvbHV0ZSB8fCAhdXJsKSB7XHJcbiAgICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNsYXNoID0gKCFpc0h0bWw1ICYmIHVybCA/ICcvJyA6ICcnKSwgcG9ydCA9ICRsb2NhdGlvbi5wb3J0KCk7XHJcbiAgICAgICAgcG9ydCA9IChwb3J0ID09PSA4MCB8fCBwb3J0ID09PSA0NDMgPyAnJyA6ICc6JyArIHBvcnQpO1xyXG5cclxuICAgICAgICByZXR1cm4gWyRsb2NhdGlvbi5wcm90b2NvbCgpLCAnOi8vJywgJGxvY2F0aW9uLmhvc3QoKSwgcG9ydCwgc2xhc2gsIHVybF0uam9pbignJyk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnJvdXRlcicpLnByb3ZpZGVyKCckdXJsUm91dGVyJywgJFVybFJvdXRlclByb3ZpZGVyKTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2Mgb2JqZWN0XHJcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVQcm92aWRlclxyXG4gKlxyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXJcclxuICogQHJlcXVpcmVzIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBUaGUgbmV3IGAkc3RhdGVQcm92aWRlcmAgd29ya3Mgc2ltaWxhciB0byBBbmd1bGFyJ3MgdjEgcm91dGVyLCBidXQgaXQgZm9jdXNlcyBwdXJlbHlcclxuICogb24gc3RhdGUuXHJcbiAqXHJcbiAqIEEgc3RhdGUgY29ycmVzcG9uZHMgdG8gYSBcInBsYWNlXCIgaW4gdGhlIGFwcGxpY2F0aW9uIGluIHRlcm1zIG9mIHRoZSBvdmVyYWxsIFVJIGFuZFxyXG4gKiBuYXZpZ2F0aW9uLiBBIHN0YXRlIGRlc2NyaWJlcyAodmlhIHRoZSBjb250cm9sbGVyIC8gdGVtcGxhdGUgLyB2aWV3IHByb3BlcnRpZXMpIHdoYXRcclxuICogdGhlIFVJIGxvb2tzIGxpa2UgYW5kIGRvZXMgYXQgdGhhdCBwbGFjZS5cclxuICpcclxuICogU3RhdGVzIG9mdGVuIGhhdmUgdGhpbmdzIGluIGNvbW1vbiwgYW5kIHRoZSBwcmltYXJ5IHdheSBvZiBmYWN0b3Jpbmcgb3V0IHRoZXNlXHJcbiAqIGNvbW1vbmFsaXRpZXMgaW4gdGhpcyBtb2RlbCBpcyB2aWEgdGhlIHN0YXRlIGhpZXJhcmNoeSwgaS5lLiBwYXJlbnQvY2hpbGQgc3RhdGVzIGFrYVxyXG4gKiBuZXN0ZWQgc3RhdGVzLlxyXG4gKlxyXG4gKiBUaGUgYCRzdGF0ZVByb3ZpZGVyYCBwcm92aWRlcyBpbnRlcmZhY2VzIHRvIGRlY2xhcmUgdGhlc2Ugc3RhdGVzIGZvciB5b3VyIGFwcC5cclxuICovXHJcbiRTdGF0ZVByb3ZpZGVyLiRpbmplY3QgPSBbJyR1cmxSb3V0ZXJQcm92aWRlcicsICckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlciddO1xyXG5mdW5jdGlvbiAkU3RhdGVQcm92aWRlciggICAkdXJsUm91dGVyUHJvdmlkZXIsICAgJHVybE1hdGNoZXJGYWN0b3J5KSB7XHJcblxyXG4gIHZhciByb290LCBzdGF0ZXMgPSB7fSwgJHN0YXRlLCBxdWV1ZSA9IHt9LCBhYnN0cmFjdEtleSA9ICdhYnN0cmFjdCc7XHJcblxyXG4gIC8vIEJ1aWxkcyBzdGF0ZSBwcm9wZXJ0aWVzIGZyb20gZGVmaW5pdGlvbiBwYXNzZWQgdG8gcmVnaXN0ZXJTdGF0ZSgpXHJcbiAgdmFyIHN0YXRlQnVpbGRlciA9IHtcclxuXHJcbiAgICAvLyBEZXJpdmUgcGFyZW50IHN0YXRlIGZyb20gYSBoaWVyYXJjaGljYWwgbmFtZSBvbmx5IGlmICdwYXJlbnQnIGlzIG5vdCBleHBsaWNpdGx5IGRlZmluZWQuXHJcbiAgICAvLyBzdGF0ZS5jaGlsZHJlbiA9IFtdO1xyXG4gICAgLy8gaWYgKHBhcmVudCkgcGFyZW50LmNoaWxkcmVuLnB1c2goc3RhdGUpO1xyXG4gICAgcGFyZW50OiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICBpZiAoaXNEZWZpbmVkKHN0YXRlLnBhcmVudCkgJiYgc3RhdGUucGFyZW50KSByZXR1cm4gZmluZFN0YXRlKHN0YXRlLnBhcmVudCk7XHJcbiAgICAgIC8vIHJlZ2V4IG1hdGNoZXMgYW55IHZhbGlkIGNvbXBvc2l0ZSBzdGF0ZSBuYW1lXHJcbiAgICAgIC8vIHdvdWxkIG1hdGNoIFwiY29udGFjdC5saXN0XCIgYnV0IG5vdCBcImNvbnRhY3RzXCJcclxuICAgICAgdmFyIGNvbXBvc2l0ZU5hbWUgPSAvXiguKylcXC5bXi5dKyQvLmV4ZWMoc3RhdGUubmFtZSk7XHJcbiAgICAgIHJldHVybiBjb21wb3NpdGVOYW1lID8gZmluZFN0YXRlKGNvbXBvc2l0ZU5hbWVbMV0pIDogcm9vdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gaW5oZXJpdCAnZGF0YScgZnJvbSBwYXJlbnQgYW5kIG92ZXJyaWRlIGJ5IG93biB2YWx1ZXMgKGlmIGFueSlcclxuICAgIGRhdGE6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgIGlmIChzdGF0ZS5wYXJlbnQgJiYgc3RhdGUucGFyZW50LmRhdGEpIHtcclxuICAgICAgICBzdGF0ZS5kYXRhID0gc3RhdGUuc2VsZi5kYXRhID0gaW5oZXJpdChzdGF0ZS5wYXJlbnQuZGF0YSwgc3RhdGUuZGF0YSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHN0YXRlLmRhdGE7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEJ1aWxkIGEgVVJMTWF0Y2hlciBpZiBuZWNlc3NhcnksIGVpdGhlciB2aWEgYSByZWxhdGl2ZSBvciBhYnNvbHV0ZSBVUkxcclxuICAgIHVybDogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgdmFyIHVybCA9IHN0YXRlLnVybCwgY29uZmlnID0geyBwYXJhbXM6IHN0YXRlLnBhcmFtcyB8fCB7fSB9O1xyXG5cclxuICAgICAgaWYgKGlzU3RyaW5nKHVybCkpIHtcclxuICAgICAgICBpZiAodXJsLmNoYXJBdCgwKSA9PSAnXicpIHJldHVybiAkdXJsTWF0Y2hlckZhY3RvcnkuY29tcGlsZSh1cmwuc3Vic3RyaW5nKDEpLCBjb25maWcpO1xyXG4gICAgICAgIHJldHVybiAoc3RhdGUucGFyZW50Lm5hdmlnYWJsZSB8fCByb290KS51cmwuY29uY2F0KHVybCwgY29uZmlnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCF1cmwgfHwgJHVybE1hdGNoZXJGYWN0b3J5LmlzTWF0Y2hlcih1cmwpKSByZXR1cm4gdXJsO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHVybCAnXCIgKyB1cmwgKyBcIicgaW4gc3RhdGUgJ1wiICsgc3RhdGUgKyBcIidcIik7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igc3RhdGUgdGhhdCBoYXMgYSBVUkwgKGkuZS4gaXMgbmF2aWdhYmxlKVxyXG4gICAgbmF2aWdhYmxlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICByZXR1cm4gc3RhdGUudXJsID8gc3RhdGUgOiAoc3RhdGUucGFyZW50ID8gc3RhdGUucGFyZW50Lm5hdmlnYWJsZSA6IG51bGwpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBPd24gcGFyYW1ldGVycyBmb3IgdGhpcyBzdGF0ZS4gc3RhdGUudXJsLnBhcmFtcyBpcyBhbHJlYWR5IGJ1aWx0IGF0IHRoaXMgcG9pbnQuIENyZWF0ZSBhbmQgYWRkIG5vbi11cmwgcGFyYW1zXHJcbiAgICBvd25QYXJhbXM6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgIHZhciBwYXJhbXMgPSBzdGF0ZS51cmwgJiYgc3RhdGUudXJsLnBhcmFtcyB8fCBuZXcgJCRVTUZQLlBhcmFtU2V0KCk7XHJcbiAgICAgIGZvckVhY2goc3RhdGUucGFyYW1zIHx8IHt9LCBmdW5jdGlvbihjb25maWcsIGlkKSB7XHJcbiAgICAgICAgaWYgKCFwYXJhbXNbaWRdKSBwYXJhbXNbaWRdID0gbmV3ICQkVU1GUC5QYXJhbShpZCwgbnVsbCwgY29uZmlnLCBcImNvbmZpZ1wiKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBwYXJhbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIERlcml2ZSBwYXJhbWV0ZXJzIGZvciB0aGlzIHN0YXRlIGFuZCBlbnN1cmUgdGhleSdyZSBhIHN1cGVyLXNldCBvZiBwYXJlbnQncyBwYXJhbWV0ZXJzXHJcbiAgICBwYXJhbXM6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgIHZhciBvd25QYXJhbXMgPSBwaWNrKHN0YXRlLm93blBhcmFtcywgc3RhdGUub3duUGFyYW1zLiQka2V5cygpKTtcclxuICAgICAgcmV0dXJuIHN0YXRlLnBhcmVudCAmJiBzdGF0ZS5wYXJlbnQucGFyYW1zID8gZXh0ZW5kKHN0YXRlLnBhcmVudC5wYXJhbXMuJCRuZXcoKSwgb3duUGFyYW1zKSA6IG5ldyAkJFVNRlAuUGFyYW1TZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gZXhwbGljaXQgbXVsdGktdmlldyBjb25maWd1cmF0aW9uLCBtYWtlIG9uZSB1cCBzbyB3ZSBkb24ndCBoYXZlXHJcbiAgICAvLyB0byBoYW5kbGUgYm90aCBjYXNlcyBpbiB0aGUgdmlldyBkaXJlY3RpdmUgbGF0ZXIuIE5vdGUgdGhhdCBoYXZpbmcgYW4gZXhwbGljaXRcclxuICAgIC8vICd2aWV3cycgcHJvcGVydHkgd2lsbCBtZWFuIHRoZSBkZWZhdWx0IHVubmFtZWQgdmlldyBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLiBUaGlzXHJcbiAgICAvLyBpcyBhbHNvIGEgZ29vZCB0aW1lIHRvIHJlc29sdmUgdmlldyBuYW1lcyB0byBhYnNvbHV0ZSBuYW1lcywgc28gZXZlcnl0aGluZyBpcyBhXHJcbiAgICAvLyBzdHJhaWdodCBsb29rdXAgYXQgbGluayB0aW1lLlxyXG4gICAgdmlld3M6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgIHZhciB2aWV3cyA9IHt9O1xyXG5cclxuICAgICAgZm9yRWFjaChpc0RlZmluZWQoc3RhdGUudmlld3MpID8gc3RhdGUudmlld3MgOiB7ICcnOiBzdGF0ZSB9LCBmdW5jdGlvbiAodmlldywgbmFtZSkge1xyXG4gICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ0AnKSA8IDApIG5hbWUgKz0gJ0AnICsgc3RhdGUucGFyZW50Lm5hbWU7XHJcbiAgICAgICAgdmlld3NbbmFtZV0gPSB2aWV3O1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHZpZXdzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBLZWVwIGEgZnVsbCBwYXRoIGZyb20gdGhlIHJvb3QgZG93biB0byB0aGlzIHN0YXRlIGFzIHRoaXMgaXMgbmVlZGVkIGZvciBzdGF0ZSBhY3RpdmF0aW9uLlxyXG4gICAgcGF0aDogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgcmV0dXJuIHN0YXRlLnBhcmVudCA/IHN0YXRlLnBhcmVudC5wYXRoLmNvbmNhdChzdGF0ZSkgOiBbXTsgLy8gZXhjbHVkZSByb290IGZyb20gcGF0aFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTcGVlZCB1cCAkc3RhdGUuY29udGFpbnMoKSBhcyBpdCdzIHVzZWQgYSBsb3RcclxuICAgIGluY2x1ZGVzOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICB2YXIgaW5jbHVkZXMgPSBzdGF0ZS5wYXJlbnQgPyBleHRlbmQoe30sIHN0YXRlLnBhcmVudC5pbmNsdWRlcykgOiB7fTtcclxuICAgICAgaW5jbHVkZXNbc3RhdGUubmFtZV0gPSB0cnVlO1xyXG4gICAgICByZXR1cm4gaW5jbHVkZXM7XHJcbiAgICB9LFxyXG5cclxuICAgICRkZWxlZ2F0ZXM6IHt9XHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gaXNSZWxhdGl2ZShzdGF0ZU5hbWUpIHtcclxuICAgIHJldHVybiBzdGF0ZU5hbWUuaW5kZXhPZihcIi5cIikgPT09IDAgfHwgc3RhdGVOYW1lLmluZGV4T2YoXCJeXCIpID09PSAwO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmluZFN0YXRlKHN0YXRlT3JOYW1lLCBiYXNlKSB7XHJcbiAgICBpZiAoIXN0YXRlT3JOYW1lKSByZXR1cm4gdW5kZWZpbmVkO1xyXG5cclxuICAgIHZhciBpc1N0ciA9IGlzU3RyaW5nKHN0YXRlT3JOYW1lKSxcclxuICAgICAgICBuYW1lICA9IGlzU3RyID8gc3RhdGVPck5hbWUgOiBzdGF0ZU9yTmFtZS5uYW1lLFxyXG4gICAgICAgIHBhdGggID0gaXNSZWxhdGl2ZShuYW1lKTtcclxuXHJcbiAgICBpZiAocGF0aCkge1xyXG4gICAgICBpZiAoIWJhc2UpIHRocm93IG5ldyBFcnJvcihcIk5vIHJlZmVyZW5jZSBwb2ludCBnaXZlbiBmb3IgcGF0aCAnXCIgICsgbmFtZSArIFwiJ1wiKTtcclxuICAgICAgYmFzZSA9IGZpbmRTdGF0ZShiYXNlKTtcclxuICAgICAgXHJcbiAgICAgIHZhciByZWwgPSBuYW1lLnNwbGl0KFwiLlwiKSwgaSA9IDAsIHBhdGhMZW5ndGggPSByZWwubGVuZ3RoLCBjdXJyZW50ID0gYmFzZTtcclxuXHJcbiAgICAgIGZvciAoOyBpIDwgcGF0aExlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHJlbFtpXSA9PT0gXCJcIiAmJiBpID09PSAwKSB7XHJcbiAgICAgICAgICBjdXJyZW50ID0gYmFzZTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVsW2ldID09PSBcIl5cIikge1xyXG4gICAgICAgICAgaWYgKCFjdXJyZW50LnBhcmVudCkgdGhyb3cgbmV3IEVycm9yKFwiUGF0aCAnXCIgKyBuYW1lICsgXCInIG5vdCB2YWxpZCBmb3Igc3RhdGUgJ1wiICsgYmFzZS5uYW1lICsgXCInXCIpO1xyXG4gICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIHJlbCA9IHJlbC5zbGljZShpKS5qb2luKFwiLlwiKTtcclxuICAgICAgbmFtZSA9IGN1cnJlbnQubmFtZSArIChjdXJyZW50Lm5hbWUgJiYgcmVsID8gXCIuXCIgOiBcIlwiKSArIHJlbDtcclxuICAgIH1cclxuICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tuYW1lXTtcclxuXHJcbiAgICBpZiAoc3RhdGUgJiYgKGlzU3RyIHx8ICghaXNTdHIgJiYgKHN0YXRlID09PSBzdGF0ZU9yTmFtZSB8fCBzdGF0ZS5zZWxmID09PSBzdGF0ZU9yTmFtZSkpKSkge1xyXG4gICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcXVldWVTdGF0ZShwYXJlbnROYW1lLCBzdGF0ZSkge1xyXG4gICAgaWYgKCFxdWV1ZVtwYXJlbnROYW1lXSkge1xyXG4gICAgICBxdWV1ZVtwYXJlbnROYW1lXSA9IFtdO1xyXG4gICAgfVxyXG4gICAgcXVldWVbcGFyZW50TmFtZV0ucHVzaChzdGF0ZSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmbHVzaFF1ZXVlZENoaWxkcmVuKHBhcmVudE5hbWUpIHtcclxuICAgIHZhciBxdWV1ZWQgPSBxdWV1ZVtwYXJlbnROYW1lXSB8fCBbXTtcclxuICAgIHdoaWxlKHF1ZXVlZC5sZW5ndGgpIHtcclxuICAgICAgcmVnaXN0ZXJTdGF0ZShxdWV1ZWQuc2hpZnQoKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZWdpc3RlclN0YXRlKHN0YXRlKSB7XHJcbiAgICAvLyBXcmFwIGEgbmV3IG9iamVjdCBhcm91bmQgdGhlIHN0YXRlIHNvIHdlIGNhbiBzdG9yZSBvdXIgcHJpdmF0ZSBkZXRhaWxzIGVhc2lseS5cclxuICAgIHN0YXRlID0gaW5oZXJpdChzdGF0ZSwge1xyXG4gICAgICBzZWxmOiBzdGF0ZSxcclxuICAgICAgcmVzb2x2ZTogc3RhdGUucmVzb2x2ZSB8fCB7fSxcclxuICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5uYW1lOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgbmFtZSA9IHN0YXRlLm5hbWU7XHJcbiAgICBpZiAoIWlzU3RyaW5nKG5hbWUpIHx8IG5hbWUuaW5kZXhPZignQCcpID49IDApIHRocm93IG5ldyBFcnJvcihcIlN0YXRlIG11c3QgaGF2ZSBhIHZhbGlkIG5hbWVcIik7XHJcbiAgICBpZiAoc3RhdGVzLmhhc093blByb3BlcnR5KG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoXCJTdGF0ZSAnXCIgKyBuYW1lICsgXCInIGlzIGFscmVhZHkgZGVmaW5lZFwiKTtcclxuXHJcbiAgICAvLyBHZXQgcGFyZW50IG5hbWVcclxuICAgIHZhciBwYXJlbnROYW1lID0gKG5hbWUuaW5kZXhPZignLicpICE9PSAtMSkgPyBuYW1lLnN1YnN0cmluZygwLCBuYW1lLmxhc3RJbmRleE9mKCcuJykpXHJcbiAgICAgICAgOiAoaXNTdHJpbmcoc3RhdGUucGFyZW50KSkgPyBzdGF0ZS5wYXJlbnRcclxuICAgICAgICA6IChpc09iamVjdChzdGF0ZS5wYXJlbnQpICYmIGlzU3RyaW5nKHN0YXRlLnBhcmVudC5uYW1lKSkgPyBzdGF0ZS5wYXJlbnQubmFtZVxyXG4gICAgICAgIDogJyc7XHJcblxyXG4gICAgLy8gSWYgcGFyZW50IGlzIG5vdCByZWdpc3RlcmVkIHlldCwgYWRkIHN0YXRlIHRvIHF1ZXVlIGFuZCByZWdpc3RlciBsYXRlclxyXG4gICAgaWYgKHBhcmVudE5hbWUgJiYgIXN0YXRlc1twYXJlbnROYW1lXSkge1xyXG4gICAgICByZXR1cm4gcXVldWVTdGF0ZShwYXJlbnROYW1lLCBzdGF0ZS5zZWxmKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGVCdWlsZGVyKSB7XHJcbiAgICAgIGlmIChpc0Z1bmN0aW9uKHN0YXRlQnVpbGRlcltrZXldKSkgc3RhdGVba2V5XSA9IHN0YXRlQnVpbGRlcltrZXldKHN0YXRlLCBzdGF0ZUJ1aWxkZXIuJGRlbGVnYXRlc1trZXldKTtcclxuICAgIH1cclxuICAgIHN0YXRlc1tuYW1lXSA9IHN0YXRlO1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIHRoZSBzdGF0ZSBpbiB0aGUgZ2xvYmFsIHN0YXRlIGxpc3QgYW5kIHdpdGggJHVybFJvdXRlciBpZiBuZWNlc3NhcnkuXHJcbiAgICBpZiAoIXN0YXRlW2Fic3RyYWN0S2V5XSAmJiBzdGF0ZS51cmwpIHtcclxuICAgICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oc3RhdGUudXJsLCBbJyRtYXRjaCcsICckc3RhdGVQYXJhbXMnLCBmdW5jdGlvbiAoJG1hdGNoLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgICAgICBpZiAoJHN0YXRlLiRjdXJyZW50Lm5hdmlnYWJsZSAhPSBzdGF0ZSB8fCAhZXF1YWxGb3JLZXlzKCRtYXRjaCwgJHN0YXRlUGFyYW1zKSkge1xyXG4gICAgICAgICAgJHN0YXRlLnRyYW5zaXRpb25UbyhzdGF0ZSwgJG1hdGNoLCB7IGluaGVyaXQ6IHRydWUsIGxvY2F0aW9uOiBmYWxzZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1dKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZWdpc3RlciBhbnkgcXVldWVkIGNoaWxkcmVuXHJcbiAgICBmbHVzaFF1ZXVlZENoaWxkcmVuKG5hbWUpO1xyXG5cclxuICAgIHJldHVybiBzdGF0ZTtcclxuICB9XHJcblxyXG4gIC8vIENoZWNrcyB0ZXh0IHRvIHNlZSBpZiBpdCBsb29rcyBsaWtlIGEgZ2xvYi5cclxuICBmdW5jdGlvbiBpc0dsb2IgKHRleHQpIHtcclxuICAgIHJldHVybiB0ZXh0LmluZGV4T2YoJyonKSA+IC0xO1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJucyB0cnVlIGlmIGdsb2IgbWF0Y2hlcyBjdXJyZW50ICRzdGF0ZSBuYW1lLlxyXG4gIGZ1bmN0aW9uIGRvZXNTdGF0ZU1hdGNoR2xvYiAoZ2xvYikge1xyXG4gICAgdmFyIGdsb2JTZWdtZW50cyA9IGdsb2Iuc3BsaXQoJy4nKSxcclxuICAgICAgICBzZWdtZW50cyA9ICRzdGF0ZS4kY3VycmVudC5uYW1lLnNwbGl0KCcuJyk7XHJcblxyXG4gICAgLy9tYXRjaCBzaW5nbGUgc3RhcnNcclxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZ2xvYlNlZ21lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICBpZiAoZ2xvYlNlZ21lbnRzW2ldID09PSAnKicpIHtcclxuICAgICAgICBzZWdtZW50c1tpXSA9ICcqJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vbWF0Y2ggZ3JlZWR5IHN0YXJ0c1xyXG4gICAgaWYgKGdsb2JTZWdtZW50c1swXSA9PT0gJyoqJykge1xyXG4gICAgICAgc2VnbWVudHMgPSBzZWdtZW50cy5zbGljZShpbmRleE9mKHNlZ21lbnRzLCBnbG9iU2VnbWVudHNbMV0pKTtcclxuICAgICAgIHNlZ21lbnRzLnVuc2hpZnQoJyoqJyk7XHJcbiAgICB9XHJcbiAgICAvL21hdGNoIGdyZWVkeSBlbmRzXHJcbiAgICBpZiAoZ2xvYlNlZ21lbnRzW2dsb2JTZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gJyoqJykge1xyXG4gICAgICAgc2VnbWVudHMuc3BsaWNlKGluZGV4T2Yoc2VnbWVudHMsIGdsb2JTZWdtZW50c1tnbG9iU2VnbWVudHMubGVuZ3RoIC0gMl0pICsgMSwgTnVtYmVyLk1BWF9WQUxVRSk7XHJcbiAgICAgICBzZWdtZW50cy5wdXNoKCcqKicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChnbG9iU2VnbWVudHMubGVuZ3RoICE9IHNlZ21lbnRzLmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNlZ21lbnRzLmpvaW4oJycpID09PSBnbG9iU2VnbWVudHMuam9pbignJyk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gSW1wbGljaXQgcm9vdCBzdGF0ZSB0aGF0IGlzIGFsd2F5cyBhY3RpdmVcclxuICByb290ID0gcmVnaXN0ZXJTdGF0ZSh7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIHVybDogJ14nLFxyXG4gICAgdmlld3M6IG51bGwsXHJcbiAgICAnYWJzdHJhY3QnOiB0cnVlXHJcbiAgfSk7XHJcbiAgcm9vdC5uYXZpZ2FibGUgPSBudWxsO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVByb3ZpZGVyI2RlY29yYXRvclxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUHJvdmlkZXJcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIEFsbG93cyB5b3UgdG8gZXh0ZW5kIChjYXJlZnVsbHkpIG9yIG92ZXJyaWRlIChhdCB5b3VyIG93biBwZXJpbCkgdGhlIFxyXG4gICAqIGBzdGF0ZUJ1aWxkZXJgIG9iamVjdCB1c2VkIGludGVybmFsbHkgYnkgYCRzdGF0ZVByb3ZpZGVyYC4gVGhpcyBjYW4gYmUgdXNlZCBcclxuICAgKiB0byBhZGQgY3VzdG9tIGZ1bmN0aW9uYWxpdHkgdG8gdWktcm91dGVyLCBmb3IgZXhhbXBsZSBpbmZlcnJpbmcgdGVtcGxhdGVVcmwgXHJcbiAgICogYmFzZWQgb24gdGhlIHN0YXRlIG5hbWUuXHJcbiAgICpcclxuICAgKiBXaGVuIHBhc3Npbmcgb25seSBhIG5hbWUsIGl0IHJldHVybnMgdGhlIGN1cnJlbnQgKG9yaWdpbmFsIG9yIGRlY29yYXRlZCkgYnVpbGRlclxyXG4gICAqIGZ1bmN0aW9uIHRoYXQgbWF0Y2hlcyBgbmFtZWAuXHJcbiAgICpcclxuICAgKiBUaGUgYnVpbGRlciBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgZGVjb3JhdGVkIGFyZSBsaXN0ZWQgYmVsb3cuIFRob3VnaCBub3QgYWxsXHJcbiAgICogbmVjZXNzYXJpbHkgaGF2ZSBhIGdvb2QgdXNlIGNhc2UgZm9yIGRlY29yYXRpb24sIHRoYXQgaXMgdXAgdG8geW91IHRvIGRlY2lkZS5cclxuICAgKlxyXG4gICAqIEluIGFkZGl0aW9uLCB1c2VycyBjYW4gYXR0YWNoIGN1c3RvbSBkZWNvcmF0b3JzLCB3aGljaCB3aWxsIGdlbmVyYXRlIG5ldyBcclxuICAgKiBwcm9wZXJ0aWVzIHdpdGhpbiB0aGUgc3RhdGUncyBpbnRlcm5hbCBkZWZpbml0aW9uLiBUaGVyZSBpcyBjdXJyZW50bHkgbm8gY2xlYXIgXHJcbiAgICogdXNlLWNhc2UgZm9yIHRoaXMgYmV5b25kIGFjY2Vzc2luZyBpbnRlcm5hbCBzdGF0ZXMgKGkuZS4gJHN0YXRlLiRjdXJyZW50KSwgXHJcbiAgICogaG93ZXZlciwgZXhwZWN0IHRoaXMgdG8gYmVjb21lIGluY3JlYXNpbmdseSByZWxldmFudCBhcyB3ZSBpbnRyb2R1Y2UgYWRkaXRpb25hbCBcclxuICAgKiBtZXRhLXByb2dyYW1taW5nIGZlYXR1cmVzLlxyXG4gICAqXHJcbiAgICogKipXYXJuaW5nKio6IERlY29yYXRvcnMgc2hvdWxkIG5vdCBiZSBpbnRlcmRlcGVuZGVudCBiZWNhdXNlIHRoZSBvcmRlciBvZiBcclxuICAgKiBleGVjdXRpb24gb2YgdGhlIGJ1aWxkZXIgZnVuY3Rpb25zIGluIG5vbi1kZXRlcm1pbmlzdGljLiBCdWlsZGVyIGZ1bmN0aW9ucyBcclxuICAgKiBzaG91bGQgb25seSBiZSBkZXBlbmRlbnQgb24gdGhlIHN0YXRlIGRlZmluaXRpb24gb2JqZWN0IGFuZCBzdXBlciBmdW5jdGlvbi5cclxuICAgKlxyXG4gICAqXHJcbiAgICogRXhpc3RpbmcgYnVpbGRlciBmdW5jdGlvbnMgYW5kIGN1cnJlbnQgcmV0dXJuIHZhbHVlczpcclxuICAgKlxyXG4gICAqIC0gKipwYXJlbnQqKiBge29iamVjdH1gIC0gcmV0dXJucyB0aGUgcGFyZW50IHN0YXRlIG9iamVjdC5cclxuICAgKiAtICoqZGF0YSoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIHN0YXRlIGRhdGEsIGluY2x1ZGluZyBhbnkgaW5oZXJpdGVkIGRhdGEgdGhhdCBpcyBub3RcclxuICAgKiAgIG92ZXJyaWRkZW4gYnkgb3duIHZhbHVlcyAoaWYgYW55KS5cclxuICAgKiAtICoqdXJsKiogYHtvYmplY3R9YCAtIHJldHVybnMgYSB7QGxpbmsgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyIFVybE1hdGNoZXJ9XHJcbiAgICogICBvciBgbnVsbGAuXHJcbiAgICogLSAqKm5hdmlnYWJsZSoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGNsb3Nlc3QgYW5jZXN0b3Igc3RhdGUgdGhhdCBoYXMgYSBVUkwgKGFrYSBpcyBcclxuICAgKiAgIG5hdmlnYWJsZSkuXHJcbiAgICogLSAqKnBhcmFtcyoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGFuIGFycmF5IG9mIHN0YXRlIHBhcmFtcyB0aGF0IGFyZSBlbnN1cmVkIHRvIFxyXG4gICAqICAgYmUgYSBzdXBlci1zZXQgb2YgcGFyZW50J3MgcGFyYW1zLlxyXG4gICAqIC0gKip2aWV3cyoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGEgdmlld3Mgb2JqZWN0IHdoZXJlIGVhY2gga2V5IGlzIGFuIGFic29sdXRlIHZpZXcgXHJcbiAgICogICBuYW1lIChpLmUuIFwidmlld05hbWVAc3RhdGVOYW1lXCIpIGFuZCBlYWNoIHZhbHVlIGlzIHRoZSBjb25maWcgb2JqZWN0IFxyXG4gICAqICAgKHRlbXBsYXRlLCBjb250cm9sbGVyKSBmb3IgdGhlIHZpZXcuIEV2ZW4gd2hlbiB5b3UgZG9uJ3QgdXNlIHRoZSB2aWV3cyBvYmplY3QgXHJcbiAgICogICBleHBsaWNpdGx5IG9uIGEgc3RhdGUgY29uZmlnLCBvbmUgaXMgc3RpbGwgY3JlYXRlZCBmb3IgeW91IGludGVybmFsbHkuXHJcbiAgICogICBTbyBieSBkZWNvcmF0aW5nIHRoaXMgYnVpbGRlciBmdW5jdGlvbiB5b3UgaGF2ZSBhY2Nlc3MgdG8gZGVjb3JhdGluZyB0ZW1wbGF0ZSBcclxuICAgKiAgIGFuZCBjb250cm9sbGVyIHByb3BlcnRpZXMuXHJcbiAgICogLSAqKm93blBhcmFtcyoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGFuIGFycmF5IG9mIHBhcmFtcyB0aGF0IGJlbG9uZyB0byB0aGUgc3RhdGUsIFxyXG4gICAqICAgbm90IGluY2x1ZGluZyBhbnkgcGFyYW1zIGRlZmluZWQgYnkgYW5jZXN0b3Igc3RhdGVzLlxyXG4gICAqIC0gKipwYXRoKiogYHtzdHJpbmd9YCAtIHJldHVybnMgdGhlIGZ1bGwgcGF0aCBmcm9tIHRoZSByb290IGRvd24gdG8gdGhpcyBzdGF0ZS4gXHJcbiAgICogICBOZWVkZWQgZm9yIHN0YXRlIGFjdGl2YXRpb24uXHJcbiAgICogLSAqKmluY2x1ZGVzKiogYHtvYmplY3R9YCAtIHJldHVybnMgYW4gb2JqZWN0IHRoYXQgaW5jbHVkZXMgZXZlcnkgc3RhdGUgdGhhdCBcclxuICAgKiAgIHdvdWxkIHBhc3MgYSBgJHN0YXRlLmluY2x1ZGVzKClgIHRlc3QuXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIDxwcmU+XHJcbiAgICogLy8gT3ZlcnJpZGUgdGhlIGludGVybmFsICd2aWV3cycgYnVpbGRlciB3aXRoIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgc3RhdGVcclxuICAgKiAvLyBkZWZpbml0aW9uLCBhbmQgYSByZWZlcmVuY2UgdG8gdGhlIGludGVybmFsIGZ1bmN0aW9uIGJlaW5nIG92ZXJyaWRkZW46XHJcbiAgICogJHN0YXRlUHJvdmlkZXIuZGVjb3JhdG9yKCd2aWV3cycsIGZ1bmN0aW9uIChzdGF0ZSwgcGFyZW50KSB7XHJcbiAgICogICB2YXIgcmVzdWx0ID0ge30sXHJcbiAgICogICAgICAgdmlld3MgPSBwYXJlbnQoc3RhdGUpO1xyXG4gICAqXHJcbiAgICogICBhbmd1bGFyLmZvckVhY2godmlld3MsIGZ1bmN0aW9uIChjb25maWcsIG5hbWUpIHtcclxuICAgKiAgICAgdmFyIGF1dG9OYW1lID0gKHN0YXRlLm5hbWUgKyAnLicgKyBuYW1lKS5yZXBsYWNlKCcuJywgJy8nKTtcclxuICAgKiAgICAgY29uZmlnLnRlbXBsYXRlVXJsID0gY29uZmlnLnRlbXBsYXRlVXJsIHx8ICcvcGFydGlhbHMvJyArIGF1dG9OYW1lICsgJy5odG1sJztcclxuICAgKiAgICAgcmVzdWx0W25hbWVdID0gY29uZmlnO1xyXG4gICAqICAgfSk7XHJcbiAgICogICByZXR1cm4gcmVzdWx0O1xyXG4gICAqIH0pO1xyXG4gICAqXHJcbiAgICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XHJcbiAgICogICB2aWV3czoge1xyXG4gICAqICAgICAnY29udGFjdC5saXN0JzogeyBjb250cm9sbGVyOiAnTGlzdENvbnRyb2xsZXInIH0sXHJcbiAgICogICAgICdjb250YWN0Lml0ZW0nOiB7IGNvbnRyb2xsZXI6ICdJdGVtQ29udHJvbGxlcicgfVxyXG4gICAqICAgfVxyXG4gICAqIH0pO1xyXG4gICAqXHJcbiAgICogLy8gLi4uXHJcbiAgICpcclxuICAgKiAkc3RhdGUuZ28oJ2hvbWUnKTtcclxuICAgKiAvLyBBdXRvLXBvcHVsYXRlcyBsaXN0IGFuZCBpdGVtIHZpZXdzIHdpdGggL3BhcnRpYWxzL2hvbWUvY29udGFjdC9saXN0Lmh0bWwsXHJcbiAgICogLy8gYW5kIC9wYXJ0aWFscy9ob21lL2NvbnRhY3QvaXRlbS5odG1sLCByZXNwZWN0aXZlbHkuXHJcbiAgICogPC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgYnVpbGRlciBmdW5jdGlvbiB0byBkZWNvcmF0ZS4gXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IGZ1bmMgQSBmdW5jdGlvbiB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBkZWNvcmF0aW5nIHRoZSBvcmlnaW5hbCBcclxuICAgKiBidWlsZGVyIGZ1bmN0aW9uLiBUaGUgZnVuY3Rpb24gcmVjZWl2ZXMgdHdvIHBhcmFtZXRlcnM6XHJcbiAgICpcclxuICAgKiAgIC0gYHtvYmplY3R9YCAtIHN0YXRlIC0gVGhlIHN0YXRlIGNvbmZpZyBvYmplY3QuXHJcbiAgICogICAtIGB7b2JqZWN0fWAgLSBzdXBlciAtIFRoZSBvcmlnaW5hbCBidWlsZGVyIGZ1bmN0aW9uLlxyXG4gICAqXHJcbiAgICogQHJldHVybiB7b2JqZWN0fSAkc3RhdGVQcm92aWRlciAtICRzdGF0ZVByb3ZpZGVyIGluc3RhbmNlXHJcbiAgICovXHJcbiAgdGhpcy5kZWNvcmF0b3IgPSBkZWNvcmF0b3I7XHJcbiAgZnVuY3Rpb24gZGVjb3JhdG9yKG5hbWUsIGZ1bmMpIHtcclxuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xyXG4gICAgaWYgKGlzU3RyaW5nKG5hbWUpICYmICFpc0RlZmluZWQoZnVuYykpIHtcclxuICAgICAgcmV0dXJuIHN0YXRlQnVpbGRlcltuYW1lXTtcclxuICAgIH1cclxuICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSB8fCAhaXNTdHJpbmcobmFtZSkpIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBpZiAoc3RhdGVCdWlsZGVyW25hbWVdICYmICFzdGF0ZUJ1aWxkZXIuJGRlbGVnYXRlc1tuYW1lXSkge1xyXG4gICAgICBzdGF0ZUJ1aWxkZXIuJGRlbGVnYXRlc1tuYW1lXSA9IHN0YXRlQnVpbGRlcltuYW1lXTtcclxuICAgIH1cclxuICAgIHN0YXRlQnVpbGRlcltuYW1lXSA9IGZ1bmM7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVQcm92aWRlciNzdGF0ZVxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUHJvdmlkZXJcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIFJlZ2lzdGVycyBhIHN0YXRlIGNvbmZpZ3VyYXRpb24gdW5kZXIgYSBnaXZlbiBzdGF0ZSBuYW1lLiBUaGUgc3RhdGVDb25maWcgb2JqZWN0XHJcbiAgICogaGFzIHRoZSBmb2xsb3dpbmcgYWNjZXB0YWJsZSBwcm9wZXJ0aWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgQSB1bmlxdWUgc3RhdGUgbmFtZSwgZS5nLiBcImhvbWVcIiwgXCJhYm91dFwiLCBcImNvbnRhY3RzXCIuXHJcbiAgICogVG8gY3JlYXRlIGEgcGFyZW50L2NoaWxkIHN0YXRlIHVzZSBhIGRvdCwgZS5nLiBcImFib3V0LnNhbGVzXCIsIFwiaG9tZS5uZXdlc3RcIi5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gc3RhdGVDb25maWcgU3RhdGUgY29uZmlndXJhdGlvbiBvYmplY3QuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8ZnVuY3Rpb249fSBzdGF0ZUNvbmZpZy50ZW1wbGF0ZVxyXG4gICAqIDxhIGlkPSd0ZW1wbGF0ZSc+PC9hPlxyXG4gICAqICAgaHRtbCB0ZW1wbGF0ZSBhcyBhIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJuc1xyXG4gICAqICAgYW4gaHRtbCB0ZW1wbGF0ZSBhcyBhIHN0cmluZyB3aGljaCBzaG91bGQgYmUgdXNlZCBieSB0aGUgdWlWaWV3IGRpcmVjdGl2ZXMuIFRoaXMgcHJvcGVydHkgXHJcbiAgICogICB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGVtcGxhdGVVcmwuXHJcbiAgICogICBcclxuICAgKiAgIElmIGB0ZW1wbGF0ZWAgaXMgYSBmdW5jdGlvbiwgaXQgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XHJcbiAgICpcclxuICAgKiAgIC0ge2FycmF5LiZsdDtvYmplY3QmZ3Q7fSAtIHN0YXRlIHBhcmFtZXRlcnMgZXh0cmFjdGVkIGZyb20gdGhlIGN1cnJlbnQgJGxvY2F0aW9uLnBhdGgoKSBieVxyXG4gICAqICAgICBhcHBseWluZyB0aGUgY3VycmVudCBzdGF0ZVxyXG4gICAqXHJcbiAgICogPHByZT50ZW1wbGF0ZTpcclxuICAgKiAgIFwiPGgxPmlubGluZSB0ZW1wbGF0ZSBkZWZpbml0aW9uPC9oMT5cIiArXHJcbiAgICogICBcIjxkaXYgdWktdmlldz48L2Rpdj5cIjwvcHJlPlxyXG4gICAqIDxwcmU+dGVtcGxhdGU6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG4gICAqICAgICAgIHJldHVybiBcIjxoMT5nZW5lcmF0ZWQgdGVtcGxhdGU8L2gxPlwiOyB9PC9wcmU+XHJcbiAgICogPC9kaXY+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbj19IHN0YXRlQ29uZmlnLnRlbXBsYXRlVXJsXHJcbiAgICogPGEgaWQ9J3RlbXBsYXRlVXJsJz48L2E+XHJcbiAgICpcclxuICAgKiAgIHBhdGggb3IgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcGF0aCB0byBhbiBodG1sXHJcbiAgICogICB0ZW1wbGF0ZSB0aGF0IHNob3VsZCBiZSB1c2VkIGJ5IHVpVmlldy5cclxuICAgKiAgIFxyXG4gICAqICAgSWYgYHRlbXBsYXRlVXJsYCBpcyBhIGZ1bmN0aW9uLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoZSBmb2xsb3dpbmcgcGFyYW1ldGVyczpcclxuICAgKlxyXG4gICAqICAgLSB7YXJyYXkuJmx0O29iamVjdCZndDt9IC0gc3RhdGUgcGFyYW1ldGVycyBleHRyYWN0ZWQgZnJvbSB0aGUgY3VycmVudCAkbG9jYXRpb24ucGF0aCgpIGJ5IFxyXG4gICAqICAgICBhcHBseWluZyB0aGUgY3VycmVudCBzdGF0ZVxyXG4gICAqXHJcbiAgICogPHByZT50ZW1wbGF0ZVVybDogXCJob21lLmh0bWxcIjwvcHJlPlxyXG4gICAqIDxwcmU+dGVtcGxhdGVVcmw6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG4gICAqICAgICByZXR1cm4gbXlUZW1wbGF0ZXNbcGFyYW1zLnBhZ2VJZF07IH08L3ByZT5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBzdGF0ZUNvbmZpZy50ZW1wbGF0ZVByb3ZpZGVyXHJcbiAgICogPGEgaWQ9J3RlbXBsYXRlUHJvdmlkZXInPjwvYT5cclxuICAgKiAgICBQcm92aWRlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgSFRNTCBjb250ZW50IHN0cmluZy5cclxuICAgKiA8cHJlPiB0ZW1wbGF0ZVByb3ZpZGVyOlxyXG4gICAqICAgICAgIGZ1bmN0aW9uKE15VGVtcGxhdGVTZXJ2aWNlLCBwYXJhbXMpIHtcclxuICAgKiAgICAgICAgIHJldHVybiBNeVRlbXBsYXRlU2VydmljZS5nZXRUZW1wbGF0ZShwYXJhbXMucGFnZUlkKTtcclxuICAgKiAgICAgICB9PC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbj19IHN0YXRlQ29uZmlnLmNvbnRyb2xsZXJcclxuICAgKiA8YSBpZD0nY29udHJvbGxlcic+PC9hPlxyXG4gICAqXHJcbiAgICogIENvbnRyb2xsZXIgZm4gdGhhdCBzaG91bGQgYmUgYXNzb2NpYXRlZCB3aXRoIG5ld2x5XHJcbiAgICogICByZWxhdGVkIHNjb3BlIG9yIHRoZSBuYW1lIG9mIGEgcmVnaXN0ZXJlZCBjb250cm9sbGVyIGlmIHBhc3NlZCBhcyBhIHN0cmluZy5cclxuICAgKiAgIE9wdGlvbmFsbHksIHRoZSBDb250cm9sbGVyQXMgbWF5IGJlIGRlY2xhcmVkIGhlcmUuXHJcbiAgICogPHByZT5jb250cm9sbGVyOiBcIk15UmVnaXN0ZXJlZENvbnRyb2xsZXJcIjwvcHJlPlxyXG4gICAqIDxwcmU+Y29udHJvbGxlcjpcclxuICAgKiAgICAgXCJNeVJlZ2lzdGVyZWRDb250cm9sbGVyIGFzIGZvb0N0cmxcIn08L3ByZT5cclxuICAgKiA8cHJlPmNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgTXlTZXJ2aWNlKSB7XHJcbiAgICogICAgICRzY29wZS5kYXRhID0gTXlTZXJ2aWNlLmdldERhdGEoKTsgfTwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IHN0YXRlQ29uZmlnLmNvbnRyb2xsZXJQcm92aWRlclxyXG4gICAqIDxhIGlkPSdjb250cm9sbGVyUHJvdmlkZXInPjwvYT5cclxuICAgKlxyXG4gICAqIEluamVjdGFibGUgcHJvdmlkZXIgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBhY3R1YWwgY29udHJvbGxlciBvciBzdHJpbmcuXHJcbiAgICogPHByZT5jb250cm9sbGVyUHJvdmlkZXI6XHJcbiAgICogICBmdW5jdGlvbihNeVJlc29sdmVEYXRhKSB7XHJcbiAgICogICAgIGlmIChNeVJlc29sdmVEYXRhLmZvbylcclxuICAgKiAgICAgICByZXR1cm4gXCJGb29DdHJsXCJcclxuICAgKiAgICAgZWxzZSBpZiAoTXlSZXNvbHZlRGF0YS5iYXIpXHJcbiAgICogICAgICAgcmV0dXJuIFwiQmFyQ3RybFwiO1xyXG4gICAqICAgICBlbHNlIHJldHVybiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgKiAgICAgICAkc2NvcGUuYmF6ID0gXCJRdXhcIjtcclxuICAgKiAgICAgfVxyXG4gICAqICAgfTwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzdGF0ZUNvbmZpZy5jb250cm9sbGVyQXNcclxuICAgKiA8YSBpZD0nY29udHJvbGxlckFzJz48L2E+XHJcbiAgICogXHJcbiAgICogQSBjb250cm9sbGVyIGFsaWFzIG5hbWUuIElmIHByZXNlbnQgdGhlIGNvbnRyb2xsZXIgd2lsbCBiZVxyXG4gICAqICAgcHVibGlzaGVkIHRvIHNjb3BlIHVuZGVyIHRoZSBjb250cm9sbGVyQXMgbmFtZS5cclxuICAgKiA8cHJlPmNvbnRyb2xsZXJBczogXCJteUN0cmxcIjwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0PX0gc3RhdGVDb25maWcucGFyZW50XHJcbiAgICogPGEgaWQ9J3BhcmVudCc+PC9hPlxyXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmaWVzIHRoZSBwYXJlbnQgc3RhdGUgb2YgdGhpcyBzdGF0ZS5cclxuICAgKlxyXG4gICAqIDxwcmU+cGFyZW50OiAncGFyZW50U3RhdGUnPC9wcmU+XHJcbiAgICogPHByZT5wYXJlbnQ6IHBhcmVudFN0YXRlIC8vIEpTIHZhcmlhYmxlPC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdD19IHN0YXRlQ29uZmlnLnJlc29sdmVcclxuICAgKiA8YSBpZD0ncmVzb2x2ZSc+PC9hPlxyXG4gICAqXHJcbiAgICogQW4gb3B0aW9uYWwgbWFwJmx0O3N0cmluZywgZnVuY3Rpb24mZ3Q7IG9mIGRlcGVuZGVuY2llcyB3aGljaFxyXG4gICAqICAgc2hvdWxkIGJlIGluamVjdGVkIGludG8gdGhlIGNvbnRyb2xsZXIuIElmIGFueSBvZiB0aGVzZSBkZXBlbmRlbmNpZXMgYXJlIHByb21pc2VzLCBcclxuICAgKiAgIHRoZSByb3V0ZXIgd2lsbCB3YWl0IGZvciB0aGVtIGFsbCB0byBiZSByZXNvbHZlZCBiZWZvcmUgdGhlIGNvbnRyb2xsZXIgaXMgaW5zdGFudGlhdGVkLlxyXG4gICAqICAgSWYgYWxsIHRoZSBwcm9taXNlcyBhcmUgcmVzb2x2ZWQgc3VjY2Vzc2Z1bGx5LCB0aGUgJHN0YXRlQ2hhbmdlU3VjY2VzcyBldmVudCBpcyBmaXJlZFxyXG4gICAqICAgYW5kIHRoZSB2YWx1ZXMgb2YgdGhlIHJlc29sdmVkIHByb21pc2VzIGFyZSBpbmplY3RlZCBpbnRvIGFueSBjb250cm9sbGVycyB0aGF0IHJlZmVyZW5jZSB0aGVtLlxyXG4gICAqICAgSWYgYW55ICBvZiB0aGUgcHJvbWlzZXMgYXJlIHJlamVjdGVkIHRoZSAkc3RhdGVDaGFuZ2VFcnJvciBldmVudCBpcyBmaXJlZC5cclxuICAgKlxyXG4gICAqICAgVGhlIG1hcCBvYmplY3QgaXM6XHJcbiAgICogICBcclxuICAgKiAgIC0ga2V5IC0ge3N0cmluZ306IG5hbWUgb2YgZGVwZW5kZW5jeSB0byBiZSBpbmplY3RlZCBpbnRvIGNvbnRyb2xsZXJcclxuICAgKiAgIC0gZmFjdG9yeSAtIHtzdHJpbmd8ZnVuY3Rpb259OiBJZiBzdHJpbmcgdGhlbiBpdCBpcyBhbGlhcyBmb3Igc2VydmljZS4gT3RoZXJ3aXNlIGlmIGZ1bmN0aW9uLCBcclxuICAgKiAgICAgaXQgaXMgaW5qZWN0ZWQgYW5kIHJldHVybiB2YWx1ZSBpdCB0cmVhdGVkIGFzIGRlcGVuZGVuY3kuIElmIHJlc3VsdCBpcyBhIHByb21pc2UsIGl0IGlzIFxyXG4gICAqICAgICByZXNvbHZlZCBiZWZvcmUgaXRzIHZhbHVlIGlzIGluamVjdGVkIGludG8gY29udHJvbGxlci5cclxuICAgKlxyXG4gICAqIDxwcmU+cmVzb2x2ZToge1xyXG4gICAqICAgICBteVJlc29sdmUxOlxyXG4gICAqICAgICAgIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgKiAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL2Zvb3MvXCIrc3RhdGVQYXJhbXMuZm9vSUQpO1xyXG4gICAqICAgICAgIH1cclxuICAgKiAgICAgfTwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBzdGF0ZUNvbmZpZy51cmxcclxuICAgKiA8YSBpZD0ndXJsJz48L2E+XHJcbiAgICpcclxuICAgKiAgIEEgdXJsIGZyYWdtZW50IHdpdGggb3B0aW9uYWwgcGFyYW1ldGVycy4gV2hlbiBhIHN0YXRlIGlzIG5hdmlnYXRlZCBvclxyXG4gICAqICAgdHJhbnNpdGlvbmVkIHRvLCB0aGUgYCRzdGF0ZVBhcmFtc2Agc2VydmljZSB3aWxsIGJlIHBvcHVsYXRlZCB3aXRoIGFueSBcclxuICAgKiAgIHBhcmFtZXRlcnMgdGhhdCB3ZXJlIHBhc3NlZC5cclxuICAgKlxyXG4gICAqICAgKFNlZSB7QGxpbmsgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyIFVybE1hdGNoZXJ9IGBVcmxNYXRjaGVyYH0gZm9yXHJcbiAgICogICBtb3JlIGRldGFpbHMgb24gYWNjZXB0YWJsZSBwYXR0ZXJucyApXHJcbiAgICpcclxuICAgKiBleGFtcGxlczpcclxuICAgKiA8cHJlPnVybDogXCIvaG9tZVwiXHJcbiAgICogdXJsOiBcIi91c2Vycy86dXNlcmlkXCJcclxuICAgKiB1cmw6IFwiL2Jvb2tzL3tib29raWQ6W2EtekEtWl8tXX1cIlxyXG4gICAqIHVybDogXCIvYm9va3Mve2NhdGVnb3J5aWQ6aW50fVwiXHJcbiAgICogdXJsOiBcIi9ib29rcy97cHVibGlzaGVybmFtZTpzdHJpbmd9L3tjYXRlZ29yeWlkOmludH1cIlxyXG4gICAqIHVybDogXCIvbWVzc2FnZXM/YmVmb3JlJmFmdGVyXCJcclxuICAgKiB1cmw6IFwiL21lc3NhZ2VzP3tiZWZvcmU6ZGF0ZX0me2FmdGVyOmRhdGV9XCJcclxuICAgKiB1cmw6IFwiL21lc3NhZ2VzLzptYWlsYm94aWQ/e2JlZm9yZTpkYXRlfSZ7YWZ0ZXI6ZGF0ZX1cIlxyXG4gICAqIDwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3Q9fSBzdGF0ZUNvbmZpZy52aWV3c1xyXG4gICAqIDxhIGlkPSd2aWV3cyc+PC9hPlxyXG4gICAqIGFuIG9wdGlvbmFsIG1hcCZsdDtzdHJpbmcsIG9iamVjdCZndDsgd2hpY2ggZGVmaW5lZCBtdWx0aXBsZSB2aWV3cywgb3IgdGFyZ2V0cyB2aWV3c1xyXG4gICAqIG1hbnVhbGx5L2V4cGxpY2l0bHkuXHJcbiAgICpcclxuICAgKiBFeGFtcGxlczpcclxuICAgKlxyXG4gICAqIFRhcmdldHMgdGhyZWUgbmFtZWQgYHVpLXZpZXdgcyBpbiB0aGUgcGFyZW50IHN0YXRlJ3MgdGVtcGxhdGVcclxuICAgKiA8cHJlPnZpZXdzOiB7XHJcbiAgICogICAgIGhlYWRlcjoge1xyXG4gICAqICAgICAgIGNvbnRyb2xsZXI6IFwiaGVhZGVyQ3RybFwiLFxyXG4gICAqICAgICAgIHRlbXBsYXRlVXJsOiBcImhlYWRlci5odG1sXCJcclxuICAgKiAgICAgfSwgYm9keToge1xyXG4gICAqICAgICAgIGNvbnRyb2xsZXI6IFwiYm9keUN0cmxcIixcclxuICAgKiAgICAgICB0ZW1wbGF0ZVVybDogXCJib2R5Lmh0bWxcIlxyXG4gICAqICAgICB9LCBmb290ZXI6IHtcclxuICAgKiAgICAgICBjb250cm9sbGVyOiBcImZvb3RDdHJsXCIsXHJcbiAgICogICAgICAgdGVtcGxhdGVVcmw6IFwiZm9vdGVyLmh0bWxcIlxyXG4gICAqICAgICB9XHJcbiAgICogICB9PC9wcmU+XHJcbiAgICpcclxuICAgKiBUYXJnZXRzIG5hbWVkIGB1aS12aWV3PVwiaGVhZGVyXCJgIGZyb20gZ3JhbmRwYXJlbnQgc3RhdGUgJ3RvcCcncyB0ZW1wbGF0ZSwgYW5kIG5hbWVkIGB1aS12aWV3PVwiYm9keVwiIGZyb20gcGFyZW50IHN0YXRlJ3MgdGVtcGxhdGUuXHJcbiAgICogPHByZT52aWV3czoge1xyXG4gICAqICAgICAnaGVhZGVyQHRvcCc6IHtcclxuICAgKiAgICAgICBjb250cm9sbGVyOiBcIm1zZ0hlYWRlckN0cmxcIixcclxuICAgKiAgICAgICB0ZW1wbGF0ZVVybDogXCJtc2dIZWFkZXIuaHRtbFwiXHJcbiAgICogICAgIH0sICdib2R5Jzoge1xyXG4gICAqICAgICAgIGNvbnRyb2xsZXI6IFwibWVzc2FnZXNDdHJsXCIsXHJcbiAgICogICAgICAgdGVtcGxhdGVVcmw6IFwibWVzc2FnZXMuaHRtbFwiXHJcbiAgICogICAgIH1cclxuICAgKiAgIH08L3ByZT5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IFtzdGF0ZUNvbmZpZy5hYnN0cmFjdD1mYWxzZV1cclxuICAgKiA8YSBpZD0nYWJzdHJhY3QnPjwvYT5cclxuICAgKiBBbiBhYnN0cmFjdCBzdGF0ZSB3aWxsIG5ldmVyIGJlIGRpcmVjdGx5IGFjdGl2YXRlZCxcclxuICAgKiAgIGJ1dCBjYW4gcHJvdmlkZSBpbmhlcml0ZWQgcHJvcGVydGllcyB0byBpdHMgY29tbW9uIGNoaWxkcmVuIHN0YXRlcy5cclxuICAgKiA8cHJlPmFic3RyYWN0OiB0cnVlPC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gc3RhdGVDb25maWcub25FbnRlclxyXG4gICAqIDxhIGlkPSdvbkVudGVyJz48L2E+XHJcbiAgICpcclxuICAgKiBDYWxsYmFjayBmdW5jdGlvbiBmb3Igd2hlbiBhIHN0YXRlIGlzIGVudGVyZWQuIEdvb2Qgd2F5XHJcbiAgICogICB0byB0cmlnZ2VyIGFuIGFjdGlvbiBvciBkaXNwYXRjaCBhbiBldmVudCwgc3VjaCBhcyBvcGVuaW5nIGEgZGlhbG9nLlxyXG4gICAqIElmIG1pbmlmeWluZyB5b3VyIHNjcmlwdHMsIG1ha2Ugc3VyZSB0byBleHBsaWNpdGx5IGFubm90YXRlIHRoaXMgZnVuY3Rpb24sXHJcbiAgICogYmVjYXVzZSBpdCB3b24ndCBiZSBhdXRvbWF0aWNhbGx5IGFubm90YXRlZCBieSB5b3VyIGJ1aWxkIHRvb2xzLlxyXG4gICAqXHJcbiAgICogPHByZT5vbkVudGVyOiBmdW5jdGlvbihNeVNlcnZpY2UsICRzdGF0ZVBhcmFtcykge1xyXG4gICAqICAgICBNeVNlcnZpY2UuZm9vKCRzdGF0ZVBhcmFtcy5teVBhcmFtKTtcclxuICAgKiB9PC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gc3RhdGVDb25maWcub25FeGl0XHJcbiAgICogPGEgaWQ9J29uRXhpdCc+PC9hPlxyXG4gICAqXHJcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb24gZm9yIHdoZW4gYSBzdGF0ZSBpcyBleGl0ZWQuIEdvb2Qgd2F5IHRvXHJcbiAgICogICB0cmlnZ2VyIGFuIGFjdGlvbiBvciBkaXNwYXRjaCBhbiBldmVudCwgc3VjaCBhcyBvcGVuaW5nIGEgZGlhbG9nLlxyXG4gICAqIElmIG1pbmlmeWluZyB5b3VyIHNjcmlwdHMsIG1ha2Ugc3VyZSB0byBleHBsaWNpdGx5IGFubm90YXRlIHRoaXMgZnVuY3Rpb24sXHJcbiAgICogYmVjYXVzZSBpdCB3b24ndCBiZSBhdXRvbWF0aWNhbGx5IGFubm90YXRlZCBieSB5b3VyIGJ1aWxkIHRvb2xzLlxyXG4gICAqXHJcbiAgICogPHByZT5vbkV4aXQ6IGZ1bmN0aW9uKE15U2VydmljZSwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICogICAgIE15U2VydmljZS5jbGVhbnVwKCRzdGF0ZVBhcmFtcy5teVBhcmFtKTtcclxuICAgKiB9PC9wcmU+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBbc3RhdGVDb25maWcucmVsb2FkT25TZWFyY2g9dHJ1ZV1cclxuICAgKiA8YSBpZD0ncmVsb2FkT25TZWFyY2gnPjwvYT5cclxuICAgKlxyXG4gICAqIElmIGBmYWxzZWAsIHdpbGwgbm90IHJldHJpZ2dlciB0aGUgc2FtZSBzdGF0ZVxyXG4gICAqICAganVzdCBiZWNhdXNlIGEgc2VhcmNoL3F1ZXJ5IHBhcmFtZXRlciBoYXMgY2hhbmdlZCAodmlhICRsb2NhdGlvbi5zZWFyY2goKSBvciAkbG9jYXRpb24uaGFzaCgpKS4gXHJcbiAgICogICBVc2VmdWwgZm9yIHdoZW4geW91J2QgbGlrZSB0byBtb2RpZnkgJGxvY2F0aW9uLnNlYXJjaCgpIHdpdGhvdXQgdHJpZ2dlcmluZyBhIHJlbG9hZC5cclxuICAgKiA8cHJlPnJlbG9hZE9uU2VhcmNoOiBmYWxzZTwvcHJlPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3Q9fSBzdGF0ZUNvbmZpZy5kYXRhXHJcbiAgICogPGEgaWQ9J2RhdGEnPjwvYT5cclxuICAgKlxyXG4gICAqIEFyYml0cmFyeSBkYXRhIG9iamVjdCwgdXNlZnVsIGZvciBjdXN0b20gY29uZmlndXJhdGlvbi4gIFRoZSBwYXJlbnQgc3RhdGUncyBgZGF0YWAgaXNcclxuICAgKiAgIHByb3RvdHlwYWxseSBpbmhlcml0ZWQuICBJbiBvdGhlciB3b3JkcywgYWRkaW5nIGEgZGF0YSBwcm9wZXJ0eSB0byBhIHN0YXRlIGFkZHMgaXQgdG9cclxuICAgKiAgIHRoZSBlbnRpcmUgc3VidHJlZSB2aWEgcHJvdG90eXBhbCBpbmhlcml0YW5jZS5cclxuICAgKlxyXG4gICAqIDxwcmU+ZGF0YToge1xyXG4gICAqICAgICByZXF1aXJlZFJvbGU6ICdmb28nXHJcbiAgICogfSA8L3ByZT5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0PX0gc3RhdGVDb25maWcucGFyYW1zXHJcbiAgICogPGEgaWQ9J3BhcmFtcyc+PC9hPlxyXG4gICAqXHJcbiAgICogQSBtYXAgd2hpY2ggb3B0aW9uYWxseSBjb25maWd1cmVzIHBhcmFtZXRlcnMgZGVjbGFyZWQgaW4gdGhlIGB1cmxgLCBvclxyXG4gICAqICAgZGVmaW5lcyBhZGRpdGlvbmFsIG5vbi11cmwgcGFyYW1ldGVycy4gIEZvciBlYWNoIHBhcmFtZXRlciBiZWluZ1xyXG4gICAqICAgY29uZmlndXJlZCwgYWRkIGEgY29uZmlndXJhdGlvbiBvYmplY3Qga2V5ZWQgdG8gdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlci5cclxuICAgKlxyXG4gICAqICAgRWFjaCBwYXJhbWV0ZXIgY29uZmlndXJhdGlvbiBvYmplY3QgbWF5IGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxyXG4gICAqXHJcbiAgICogICAtICoqIHZhbHVlICoqIC0ge29iamVjdHxmdW5jdGlvbj19OiBzcGVjaWZpZXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoaXNcclxuICAgKiAgICAgcGFyYW1ldGVyLiAgVGhpcyBpbXBsaWNpdGx5IHNldHMgdGhpcyBwYXJhbWV0ZXIgYXMgb3B0aW9uYWwuXHJcbiAgICpcclxuICAgKiAgICAgV2hlbiBVSS1Sb3V0ZXIgcm91dGVzIHRvIGEgc3RhdGUgYW5kIG5vIHZhbHVlIGlzXHJcbiAgICogICAgIHNwZWNpZmllZCBmb3IgdGhpcyBwYXJhbWV0ZXIgaW4gdGhlIFVSTCBvciB0cmFuc2l0aW9uLCB0aGVcclxuICAgKiAgICAgZGVmYXVsdCB2YWx1ZSB3aWxsIGJlIHVzZWQgaW5zdGVhZC4gIElmIGB2YWx1ZWAgaXMgYSBmdW5jdGlvbixcclxuICAgKiAgICAgaXQgd2lsbCBiZSBpbmplY3RlZCBhbmQgaW52b2tlZCwgYW5kIHRoZSByZXR1cm4gdmFsdWUgdXNlZC5cclxuICAgKlxyXG4gICAqICAgICAqTm90ZSo6IGB1bmRlZmluZWRgIGlzIHRyZWF0ZWQgYXMgXCJubyBkZWZhdWx0IHZhbHVlXCIgd2hpbGUgYG51bGxgXHJcbiAgICogICAgIGlzIHRyZWF0ZWQgYXMgXCJ0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGBcIi5cclxuICAgKlxyXG4gICAqICAgICAqU2hvcnRoYW5kKjogSWYgeW91IG9ubHkgbmVlZCB0byBjb25maWd1cmUgdGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlXHJcbiAgICogICAgIHBhcmFtZXRlciwgeW91IG1heSB1c2UgYSBzaG9ydGhhbmQgc3ludGF4LiAgIEluIHRoZSAqKmBwYXJhbXNgKipcclxuICAgKiAgICAgbWFwLCBpbnN0ZWFkIG1hcHBpbmcgdGhlIHBhcmFtIG5hbWUgdG8gYSBmdWxsIHBhcmFtZXRlciBjb25maWd1cmF0aW9uXHJcbiAgICogICAgIG9iamVjdCwgc2ltcGx5IHNldCBtYXAgaXQgdG8gdGhlIGRlZmF1bHQgcGFyYW1ldGVyIHZhbHVlLCBlLmcuOlxyXG4gICAqXHJcbiAgICogPHByZT4vLyBkZWZpbmUgYSBwYXJhbWV0ZXIncyBkZWZhdWx0IHZhbHVlXHJcbiAgICogcGFyYW1zOiB7XHJcbiAgICogICAgIHBhcmFtMTogeyB2YWx1ZTogXCJkZWZhdWx0VmFsdWVcIiB9XHJcbiAgICogfVxyXG4gICAqIC8vIHNob3J0aGFuZCBkZWZhdWx0IHZhbHVlc1xyXG4gICAqIHBhcmFtczoge1xyXG4gICAqICAgICBwYXJhbTE6IFwiZGVmYXVsdFZhbHVlXCIsXHJcbiAgICogICAgIHBhcmFtMjogXCJwYXJhbTJEZWZhdWx0XCJcclxuICAgKiB9PC9wcmU+XHJcbiAgICpcclxuICAgKiAgIC0gKiogYXJyYXkgKiogLSB7Ym9vbGVhbj19OiAqKGRlZmF1bHQ6IGZhbHNlKSogSWYgdHJ1ZSwgdGhlIHBhcmFtIHZhbHVlIHdpbGwgYmVcclxuICAgKiAgICAgdHJlYXRlZCBhcyBhbiBhcnJheSBvZiB2YWx1ZXMuICBJZiB5b3Ugc3BlY2lmaWVkIGEgVHlwZSwgdGhlIHZhbHVlIHdpbGwgYmVcclxuICAgKiAgICAgdHJlYXRlZCBhcyBhbiBhcnJheSBvZiB0aGUgc3BlY2lmaWVkIFR5cGUuICBOb3RlOiBxdWVyeSBwYXJhbWV0ZXIgdmFsdWVzXHJcbiAgICogICAgIGRlZmF1bHQgdG8gYSBzcGVjaWFsIGBcImF1dG9cImAgbW9kZS5cclxuICAgKlxyXG4gICAqICAgICBGb3IgcXVlcnkgcGFyYW1ldGVycyBpbiBgXCJhdXRvXCJgIG1vZGUsIGlmIG11bHRpcGxlICB2YWx1ZXMgZm9yIGEgc2luZ2xlIHBhcmFtZXRlclxyXG4gICAqICAgICBhcmUgcHJlc2VudCBpbiB0aGUgVVJMIChlLmcuOiBgL2Zvbz9iYXI9MSZiYXI9MiZiYXI9M2ApIHRoZW4gdGhlIHZhbHVlc1xyXG4gICAqICAgICBhcmUgbWFwcGVkIHRvIGFuIGFycmF5IChlLmcuOiBgeyBmb286IFsgJzEnLCAnMicsICczJyBdIH1gKS4gIEhvd2V2ZXIsIGlmXHJcbiAgICogICAgIG9ubHkgb25lIHZhbHVlIGlzIHByZXNlbnQgKGUuZy46IGAvZm9vP2Jhcj0xYCkgdGhlbiB0aGUgdmFsdWUgaXMgdHJlYXRlZCBhcyBzaW5nbGVcclxuICAgKiAgICAgdmFsdWUgKGUuZy46IGB7IGZvbzogJzEnIH1gKS5cclxuICAgKlxyXG4gICAqIDxwcmU+cGFyYW1zOiB7XHJcbiAgICogICAgIHBhcmFtMTogeyBhcnJheTogdHJ1ZSB9XHJcbiAgICogfTwvcHJlPlxyXG4gICAqXHJcbiAgICogICAtICoqIHNxdWFzaCAqKiAtIHtib29sfHN0cmluZz19OiBgc3F1YXNoYCBjb25maWd1cmVzIGhvdyBhIGRlZmF1bHQgcGFyYW1ldGVyIHZhbHVlIGlzIHJlcHJlc2VudGVkIGluIHRoZSBVUkwgd2hlblxyXG4gICAqICAgICB0aGUgY3VycmVudCBwYXJhbWV0ZXIgdmFsdWUgaXMgdGhlIHNhbWUgYXMgdGhlIGRlZmF1bHQgdmFsdWUuIElmIGBzcXVhc2hgIGlzIG5vdCBzZXQsIGl0IHVzZXMgdGhlXHJcbiAgICogICAgIGNvbmZpZ3VyZWQgZGVmYXVsdCBzcXVhc2ggcG9saWN5LlxyXG4gICAqICAgICAoU2VlIHtAbGluayB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnkjbWV0aG9kc19kZWZhdWx0U3F1YXNoUG9saWN5IGBkZWZhdWx0U3F1YXNoUG9saWN5KClgfSlcclxuICAgKlxyXG4gICAqICAgVGhlcmUgYXJlIHRocmVlIHNxdWFzaCBzZXR0aW5nczpcclxuICAgKlxyXG4gICAqICAgICAtIGZhbHNlOiBUaGUgcGFyYW1ldGVyJ3MgZGVmYXVsdCB2YWx1ZSBpcyBub3Qgc3F1YXNoZWQuICBJdCBpcyBlbmNvZGVkIGFuZCBpbmNsdWRlZCBpbiB0aGUgVVJMXHJcbiAgICogICAgIC0gdHJ1ZTogVGhlIHBhcmFtZXRlcidzIGRlZmF1bHQgdmFsdWUgaXMgb21pdHRlZCBmcm9tIHRoZSBVUkwuICBJZiB0aGUgcGFyYW1ldGVyIGlzIHByZWNlZWRlZCBhbmQgZm9sbG93ZWRcclxuICAgKiAgICAgICBieSBzbGFzaGVzIGluIHRoZSBzdGF0ZSdzIGB1cmxgIGRlY2xhcmF0aW9uLCB0aGVuIG9uZSBvZiB0aG9zZSBzbGFzaGVzIGFyZSBvbWl0dGVkLlxyXG4gICAqICAgICAgIFRoaXMgY2FuIGFsbG93IGZvciBjbGVhbmVyIGxvb2tpbmcgVVJMcy5cclxuICAgKiAgICAgLSBgXCI8YXJiaXRyYXJ5IHN0cmluZz5cImA6IFRoZSBwYXJhbWV0ZXIncyBkZWZhdWx0IHZhbHVlIGlzIHJlcGxhY2VkIHdpdGggYW4gYXJiaXRyYXJ5IHBsYWNlaG9sZGVyIG9mICB5b3VyIGNob2ljZS5cclxuICAgKlxyXG4gICAqIDxwcmU+cGFyYW1zOiB7XHJcbiAgICogICAgIHBhcmFtMToge1xyXG4gICAqICAgICAgIHZhbHVlOiBcImRlZmF1bHRJZFwiLFxyXG4gICAqICAgICAgIHNxdWFzaDogdHJ1ZVxyXG4gICAqIH0gfVxyXG4gICAqIC8vIHNxdWFzaCBcImRlZmF1bHRWYWx1ZVwiIHRvIFwiflwiXHJcbiAgICogcGFyYW1zOiB7XHJcbiAgICogICAgIHBhcmFtMToge1xyXG4gICAqICAgICAgIHZhbHVlOiBcImRlZmF1bHRWYWx1ZVwiLFxyXG4gICAqICAgICAgIHNxdWFzaDogXCJ+XCJcclxuICAgKiB9IH1cclxuICAgKiA8L3ByZT5cclxuICAgKlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiA8cHJlPlxyXG4gICAqIC8vIFNvbWUgc3RhdGUgbmFtZSBleGFtcGxlc1xyXG4gICAqXHJcbiAgICogLy8gc3RhdGVOYW1lIGNhbiBiZSBhIHNpbmdsZSB0b3AtbGV2ZWwgbmFtZSAobXVzdCBiZSB1bmlxdWUpLlxyXG4gICAqICRzdGF0ZVByb3ZpZGVyLnN0YXRlKFwiaG9tZVwiLCB7fSk7XHJcbiAgICpcclxuICAgKiAvLyBPciBpdCBjYW4gYmUgYSBuZXN0ZWQgc3RhdGUgbmFtZS4gVGhpcyBzdGF0ZSBpcyBhIGNoaWxkIG9mIHRoZVxyXG4gICAqIC8vIGFib3ZlIFwiaG9tZVwiIHN0YXRlLlxyXG4gICAqICRzdGF0ZVByb3ZpZGVyLnN0YXRlKFwiaG9tZS5uZXdlc3RcIiwge30pO1xyXG4gICAqXHJcbiAgICogLy8gTmVzdCBzdGF0ZXMgYXMgZGVlcGx5IGFzIG5lZWRlZC5cclxuICAgKiAkc3RhdGVQcm92aWRlci5zdGF0ZShcImhvbWUubmV3ZXN0LmFiYy54eXouaW5jZXB0aW9uXCIsIHt9KTtcclxuICAgKlxyXG4gICAqIC8vIHN0YXRlKCkgcmV0dXJucyAkc3RhdGVQcm92aWRlciwgc28geW91IGNhbiBjaGFpbiBzdGF0ZSBkZWNsYXJhdGlvbnMuXHJcbiAgICogJHN0YXRlUHJvdmlkZXJcclxuICAgKiAgIC5zdGF0ZShcImhvbWVcIiwge30pXHJcbiAgICogICAuc3RhdGUoXCJhYm91dFwiLCB7fSlcclxuICAgKiAgIC5zdGF0ZShcImNvbnRhY3RzXCIsIHt9KTtcclxuICAgKiA8L3ByZT5cclxuICAgKlxyXG4gICAqL1xyXG4gIHRoaXMuc3RhdGUgPSBzdGF0ZTtcclxuICBmdW5jdGlvbiBzdGF0ZShuYW1lLCBkZWZpbml0aW9uKSB7XHJcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6IHRydWUgKi9cclxuICAgIGlmIChpc09iamVjdChuYW1lKSkgZGVmaW5pdGlvbiA9IG5hbWU7XHJcbiAgICBlbHNlIGRlZmluaXRpb24ubmFtZSA9IG5hbWU7XHJcbiAgICByZWdpc3RlclN0YXRlKGRlZmluaXRpb24pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmdkb2Mgb2JqZWN0XHJcbiAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxyXG4gICAqXHJcbiAgICogQHJlcXVpcmVzICRyb290U2NvcGVcclxuICAgKiBAcmVxdWlyZXMgJHFcclxuICAgKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiR2aWV3XHJcbiAgICogQHJlcXVpcmVzICRpbmplY3RvclxyXG4gICAqIEByZXF1aXJlcyB1aS5yb3V0ZXIudXRpbC4kcmVzb2x2ZVxyXG4gICAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUGFyYW1zXHJcbiAgICogQHJlcXVpcmVzIHVpLnJvdXRlci5yb3V0ZXIuJHVybFJvdXRlclxyXG4gICAqXHJcbiAgICogQHByb3BlcnR5IHtvYmplY3R9IHBhcmFtcyBBIHBhcmFtIG9iamVjdCwgZS5nLiB7c2VjdGlvbklkOiBzZWN0aW9uLmlkKX0sIHRoYXQgXHJcbiAgICogeW91J2QgbGlrZSB0byB0ZXN0IGFnYWluc3QgdGhlIGN1cnJlbnQgYWN0aXZlIHN0YXRlLlxyXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBjdXJyZW50IEEgcmVmZXJlbmNlIHRvIHRoZSBzdGF0ZSdzIGNvbmZpZyBvYmplY3QuIEhvd2V2ZXIgXHJcbiAgICogeW91IHBhc3NlZCBpdCBpbi4gVXNlZnVsIGZvciBhY2Nlc3NpbmcgY3VzdG9tIGRhdGEuXHJcbiAgICogQHByb3BlcnR5IHtvYmplY3R9IHRyYW5zaXRpb24gQ3VycmVudGx5IHBlbmRpbmcgdHJhbnNpdGlvbi4gQSBwcm9taXNlIHRoYXQnbGwgXHJcbiAgICogcmVzb2x2ZSBvciByZWplY3QuXHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBgJHN0YXRlYCBzZXJ2aWNlIGlzIHJlc3BvbnNpYmxlIGZvciByZXByZXNlbnRpbmcgc3RhdGVzIGFzIHdlbGwgYXMgdHJhbnNpdGlvbmluZ1xyXG4gICAqIGJldHdlZW4gdGhlbS4gSXQgYWxzbyBwcm92aWRlcyBpbnRlcmZhY2VzIHRvIGFzayBmb3IgY3VycmVudCBzdGF0ZSBvciBldmVuIHN0YXRlc1xyXG4gICAqIHlvdSdyZSBjb21pbmcgZnJvbS5cclxuICAgKi9cclxuICB0aGlzLiRnZXQgPSAkZ2V0O1xyXG4gICRnZXQuJGluamVjdCA9IFsnJHJvb3RTY29wZScsICckcScsICckdmlldycsICckaW5qZWN0b3InLCAnJHJlc29sdmUnLCAnJHN0YXRlUGFyYW1zJywgJyR1cmxSb3V0ZXInLCAnJGxvY2F0aW9uJywgJyR1cmxNYXRjaGVyRmFjdG9yeSddO1xyXG4gIGZ1bmN0aW9uICRnZXQoICAgJHJvb3RTY29wZSwgICAkcSwgICAkdmlldywgICAkaW5qZWN0b3IsICAgJHJlc29sdmUsICAgJHN0YXRlUGFyYW1zLCAgICR1cmxSb3V0ZXIsICAgJGxvY2F0aW9uLCAgICR1cmxNYXRjaGVyRmFjdG9yeSkge1xyXG5cclxuICAgIHZhciBUcmFuc2l0aW9uU3VwZXJzZWRlZCA9ICRxLnJlamVjdChuZXcgRXJyb3IoJ3RyYW5zaXRpb24gc3VwZXJzZWRlZCcpKTtcclxuICAgIHZhciBUcmFuc2l0aW9uUHJldmVudGVkID0gJHEucmVqZWN0KG5ldyBFcnJvcigndHJhbnNpdGlvbiBwcmV2ZW50ZWQnKSk7XHJcbiAgICB2YXIgVHJhbnNpdGlvbkFib3J0ZWQgPSAkcS5yZWplY3QobmV3IEVycm9yKCd0cmFuc2l0aW9uIGFib3J0ZWQnKSk7XHJcbiAgICB2YXIgVHJhbnNpdGlvbkZhaWxlZCA9ICRxLnJlamVjdChuZXcgRXJyb3IoJ3RyYW5zaXRpb24gZmFpbGVkJykpO1xyXG5cclxuICAgIC8vIEhhbmRsZXMgdGhlIGNhc2Ugd2hlcmUgYSBzdGF0ZSB3aGljaCBpcyB0aGUgdGFyZ2V0IG9mIGEgdHJhbnNpdGlvbiBpcyBub3QgZm91bmQsIGFuZCB0aGUgdXNlclxyXG4gICAgLy8gY2FuIG9wdGlvbmFsbHkgcmV0cnkgb3IgZGVmZXIgdGhlIHRyYW5zaXRpb25cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlZGlyZWN0KHJlZGlyZWN0LCBzdGF0ZSwgcGFyYW1zLCBvcHRpb25zKSB7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBAbmdkb2MgZXZlbnRcclxuICAgICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSMkc3RhdGVOb3RGb3VuZFxyXG4gICAgICAgKiBAZXZlbnRPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAgICAgICAqIEBldmVudFR5cGUgYnJvYWRjYXN0IG9uIHJvb3Qgc2NvcGVcclxuICAgICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgICAqIEZpcmVkIHdoZW4gYSByZXF1ZXN0ZWQgc3RhdGUgKipjYW5ub3QgYmUgZm91bmQqKiB1c2luZyB0aGUgcHJvdmlkZWQgc3RhdGUgbmFtZSBkdXJpbmcgdHJhbnNpdGlvbi5cclxuICAgICAgICogVGhlIGV2ZW50IGlzIGJyb2FkY2FzdCBhbGxvd2luZyBhbnkgaGFuZGxlcnMgYSBzaW5nbGUgY2hhbmNlIHRvIGRlYWwgd2l0aCB0aGUgZXJyb3IgKHVzdWFsbHkgYnlcclxuICAgICAgICogbGF6eS1sb2FkaW5nIHRoZSB1bmZvdW5kIHN0YXRlKS4gQSBzcGVjaWFsIGB1bmZvdW5kU3RhdGVgIG9iamVjdCBpcyBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyIGhhbmRsZXIsXHJcbiAgICAgICAqIHlvdSBjYW4gc2VlIGl0cyB0aHJlZSBwcm9wZXJ0aWVzIGluIHRoZSBleGFtcGxlLiBZb3UgY2FuIHVzZSBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgdG8gYWJvcnQgdGhlXHJcbiAgICAgICAqIHRyYW5zaXRpb24gYW5kIHRoZSBwcm9taXNlIHJldHVybmVkIGZyb20gYGdvYCB3aWxsIGJlIHJlamVjdGVkIHdpdGggYSBgJ3RyYW5zaXRpb24gYWJvcnRlZCdgIHZhbHVlLlxyXG4gICAgICAgKlxyXG4gICAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgRXZlbnQgb2JqZWN0LlxyXG4gICAgICAgKiBAcGFyYW0ge09iamVjdH0gdW5mb3VuZFN0YXRlIFVuZm91bmQgU3RhdGUgaW5mb3JtYXRpb24uIENvbnRhaW5zOiBgdG8sIHRvUGFyYW1zLCBvcHRpb25zYCBwcm9wZXJ0aWVzLlxyXG4gICAgICAgKiBAcGFyYW0ge1N0YXRlfSBmcm9tU3RhdGUgQ3VycmVudCBzdGF0ZSBvYmplY3QuXHJcbiAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tUGFyYW1zIEN1cnJlbnQgc3RhdGUgcGFyYW1zLlxyXG4gICAgICAgKlxyXG4gICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgKlxyXG4gICAgICAgKiA8cHJlPlxyXG4gICAgICAgKiAvLyBzb21ld2hlcmUsIGFzc3VtZSBsYXp5LnN0YXRlIGhhcyBub3QgYmVlbiBkZWZpbmVkXHJcbiAgICAgICAqICRzdGF0ZS5nbyhcImxhenkuc3RhdGVcIiwge2E6MSwgYjoyfSwge2luaGVyaXQ6ZmFsc2V9KTtcclxuICAgICAgICpcclxuICAgICAgICogLy8gc29tZXdoZXJlIGVsc2VcclxuICAgICAgICogJHNjb3BlLiRvbignJHN0YXRlTm90Rm91bmQnLFxyXG4gICAgICAgKiBmdW5jdGlvbihldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpe1xyXG4gICAgICAgKiAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvKTsgLy8gXCJsYXp5LnN0YXRlXCJcclxuICAgICAgICogICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50b1BhcmFtcyk7IC8vIHthOjEsIGI6Mn1cclxuICAgICAgICogICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICAgICAqIH0pXHJcbiAgICAgICAqIDwvcHJlPlxyXG4gICAgICAgKi9cclxuICAgICAgdmFyIGV2dCA9ICRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHN0YXRlTm90Rm91bmQnLCByZWRpcmVjdCwgc3RhdGUsIHBhcmFtcyk7XHJcblxyXG4gICAgICBpZiAoZXZ0LmRlZmF1bHRQcmV2ZW50ZWQpIHtcclxuICAgICAgICAkdXJsUm91dGVyLnVwZGF0ZSgpO1xyXG4gICAgICAgIHJldHVybiBUcmFuc2l0aW9uQWJvcnRlZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFldnQucmV0cnkpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQWxsb3cgdGhlIGhhbmRsZXIgdG8gcmV0dXJuIGEgcHJvbWlzZSB0byBkZWZlciBzdGF0ZSBsb29rdXAgcmV0cnlcclxuICAgICAgaWYgKG9wdGlvbnMuJHJldHJ5KSB7XHJcbiAgICAgICAgJHVybFJvdXRlci51cGRhdGUoKTtcclxuICAgICAgICByZXR1cm4gVHJhbnNpdGlvbkZhaWxlZDtcclxuICAgICAgfVxyXG4gICAgICB2YXIgcmV0cnlUcmFuc2l0aW9uID0gJHN0YXRlLnRyYW5zaXRpb24gPSAkcS53aGVuKGV2dC5yZXRyeSk7XHJcblxyXG4gICAgICByZXRyeVRyYW5zaXRpb24udGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAocmV0cnlUcmFuc2l0aW9uICE9PSAkc3RhdGUudHJhbnNpdGlvbikgcmV0dXJuIFRyYW5zaXRpb25TdXBlcnNlZGVkO1xyXG4gICAgICAgIHJlZGlyZWN0Lm9wdGlvbnMuJHJldHJ5ID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gJHN0YXRlLnRyYW5zaXRpb25UbyhyZWRpcmVjdC50bywgcmVkaXJlY3QudG9QYXJhbXMsIHJlZGlyZWN0Lm9wdGlvbnMpO1xyXG4gICAgICB9LCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gVHJhbnNpdGlvbkFib3J0ZWQ7XHJcbiAgICAgIH0pO1xyXG4gICAgICAkdXJsUm91dGVyLnVwZGF0ZSgpO1xyXG5cclxuICAgICAgcmV0dXJuIHJldHJ5VHJhbnNpdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICByb290LmxvY2FscyA9IHsgcmVzb2x2ZTogbnVsbCwgZ2xvYmFsczogeyAkc3RhdGVQYXJhbXM6IHt9IH0gfTtcclxuXHJcbiAgICAkc3RhdGUgPSB7XHJcbiAgICAgIHBhcmFtczoge30sXHJcbiAgICAgIGN1cnJlbnQ6IHJvb3Quc2VsZixcclxuICAgICAgJGN1cnJlbnQ6IHJvb3QsXHJcbiAgICAgIHRyYW5zaXRpb246IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjcmVsb2FkXHJcbiAgICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxyXG4gICAgICpcclxuICAgICAqIEBkZXNjcmlwdGlvblxyXG4gICAgICogQSBtZXRob2QgdGhhdCBmb3JjZSByZWxvYWRzIHRoZSBjdXJyZW50IHN0YXRlLiBBbGwgcmVzb2x2ZXMgYXJlIHJlLXJlc29sdmVkLFxyXG4gICAgICogY29udHJvbGxlcnMgcmVpbnN0YW50aWF0ZWQsIGFuZCBldmVudHMgcmUtZmlyZWQuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiB2YXIgYXBwIGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlciddKTtcclxuICAgICAqXHJcbiAgICAgKiBhcHAuY29udHJvbGxlcignY3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSkge1xyXG4gICAgICogICAkc2NvcGUucmVsb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAqICAgICAkc3RhdGUucmVsb2FkKCk7XHJcbiAgICAgKiAgIH1cclxuICAgICAqIH0pO1xyXG4gICAgICogPC9wcmU+XHJcbiAgICAgKlxyXG4gICAgICogYHJlbG9hZCgpYCBpcyBqdXN0IGFuIGFsaWFzIGZvcjpcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiAkc3RhdGUudHJhbnNpdGlvblRvKCRzdGF0ZS5jdXJyZW50LCAkc3RhdGVQYXJhbXMsIHsgXHJcbiAgICAgKiAgIHJlbG9hZDogdHJ1ZSwgaW5oZXJpdDogZmFsc2UsIG5vdGlmeTogdHJ1ZVxyXG4gICAgICogfSk7XHJcbiAgICAgKiA8L3ByZT5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZz18b2JqZWN0PX0gc3RhdGUgLSBBIHN0YXRlIG5hbWUgb3IgYSBzdGF0ZSBvYmplY3QsIHdoaWNoIGlzIHRoZSByb290IG9mIHRoZSByZXNvbHZlcyB0byBiZSByZS1yZXNvbHZlZC5cclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiA8cHJlPlxyXG4gICAgICogLy9hc3N1bWluZyBhcHAgYXBwbGljYXRpb24gY29uc2lzdHMgb2YgMyBzdGF0ZXM6ICdjb250YWN0cycsICdjb250YWN0cy5kZXRhaWwnLCAnY29udGFjdHMuZGV0YWlsLml0ZW0nIFxyXG4gICAgICogLy9hbmQgY3VycmVudCBzdGF0ZSBpcyAnY29udGFjdHMuZGV0YWlsLml0ZW0nXHJcbiAgICAgKiB2YXIgYXBwIGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlciddKTtcclxuICAgICAqXHJcbiAgICAgKiBhcHAuY29udHJvbGxlcignY3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSkge1xyXG4gICAgICogICAkc2NvcGUucmVsb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAqICAgICAvL3dpbGwgcmVsb2FkICdjb250YWN0LmRldGFpbCcgYW5kICdjb250YWN0LmRldGFpbC5pdGVtJyBzdGF0ZXNcclxuICAgICAqICAgICAkc3RhdGUucmVsb2FkKCdjb250YWN0LmRldGFpbCcpO1xyXG4gICAgICogICB9XHJcbiAgICAgKiB9KTtcclxuICAgICAqIDwvcHJlPlxyXG4gICAgICpcclxuICAgICAqIGByZWxvYWQoKWAgaXMganVzdCBhbiBhbGlhcyBmb3I6XHJcbiAgICAgKiA8cHJlPlxyXG4gICAgICogJHN0YXRlLnRyYW5zaXRpb25Ubygkc3RhdGUuY3VycmVudCwgJHN0YXRlUGFyYW1zLCB7IFxyXG4gICAgICogICByZWxvYWQ6IHRydWUsIGluaGVyaXQ6IGZhbHNlLCBub3RpZnk6IHRydWVcclxuICAgICAqIH0pO1xyXG4gICAgICogPC9wcmU+XHJcblxyXG4gICAgICogQHJldHVybnMge3Byb21pc2V9IEEgcHJvbWlzZSByZXByZXNlbnRpbmcgdGhlIHN0YXRlIG9mIHRoZSBuZXcgdHJhbnNpdGlvbi4gU2VlXHJcbiAgICAgKiB7QGxpbmsgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNtZXRob2RzX2dvICRzdGF0ZS5nb30uXHJcbiAgICAgKi9cclxuICAgICRzdGF0ZS5yZWxvYWQgPSBmdW5jdGlvbiByZWxvYWQoc3RhdGUpIHtcclxuICAgICAgcmV0dXJuICRzdGF0ZS50cmFuc2l0aW9uVG8oJHN0YXRlLmN1cnJlbnQsICRzdGF0ZVBhcmFtcywgeyByZWxvYWQ6IHN0YXRlIHx8IHRydWUsIGluaGVyaXQ6IGZhbHNlLCBub3RpZnk6IHRydWV9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjZ29cclxuICAgICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAgICAgKlxyXG4gICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgKiBDb252ZW5pZW5jZSBtZXRob2QgZm9yIHRyYW5zaXRpb25pbmcgdG8gYSBuZXcgc3RhdGUuIGAkc3RhdGUuZ29gIGNhbGxzIFxyXG4gICAgICogYCRzdGF0ZS50cmFuc2l0aW9uVG9gIGludGVybmFsbHkgYnV0IGF1dG9tYXRpY2FsbHkgc2V0cyBvcHRpb25zIHRvIFxyXG4gICAgICogYHsgbG9jYXRpb246IHRydWUsIGluaGVyaXQ6IHRydWUsIHJlbGF0aXZlOiAkc3RhdGUuJGN1cnJlbnQsIG5vdGlmeTogdHJ1ZSB9YC4gXHJcbiAgICAgKiBUaGlzIGFsbG93cyB5b3UgdG8gZWFzaWx5IHVzZSBhbiBhYnNvbHV0ZSBvciByZWxhdGl2ZSB0byBwYXRoIGFuZCBzcGVjaWZ5IFxyXG4gICAgICogb25seSB0aGUgcGFyYW1ldGVycyB5b3UnZCBsaWtlIHRvIHVwZGF0ZSAod2hpbGUgbGV0dGluZyB1bnNwZWNpZmllZCBwYXJhbWV0ZXJzIFxyXG4gICAgICogaW5oZXJpdCBmcm9tIHRoZSBjdXJyZW50bHkgYWN0aXZlIGFuY2VzdG9yIHN0YXRlcykuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsndWkucm91dGVyJ10pO1xyXG4gICAgICpcclxuICAgICAqIGFwcC5jb250cm9sbGVyKCdjdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlKSB7XHJcbiAgICAgKiAgICRzY29wZS5jaGFuZ2VTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAqICAgICAkc3RhdGUuZ28oJ2NvbnRhY3QuZGV0YWlsJyk7XHJcbiAgICAgKiAgIH07XHJcbiAgICAgKiB9KTtcclxuICAgICAqIDwvcHJlPlxyXG4gICAgICogPGltZyBzcmM9Jy4uL25nZG9jX2Fzc2V0cy9TdGF0ZUdvRXhhbXBsZXMucG5nJy8+XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvIEFic29sdXRlIHN0YXRlIG5hbWUgb3IgcmVsYXRpdmUgc3RhdGUgcGF0aC4gU29tZSBleGFtcGxlczpcclxuICAgICAqXHJcbiAgICAgKiAtIGAkc3RhdGUuZ28oJ2NvbnRhY3QuZGV0YWlsJylgIC0gd2lsbCBnbyB0byB0aGUgYGNvbnRhY3QuZGV0YWlsYCBzdGF0ZVxyXG4gICAgICogLSBgJHN0YXRlLmdvKCdeJylgIC0gd2lsbCBnbyB0byBhIHBhcmVudCBzdGF0ZVxyXG4gICAgICogLSBgJHN0YXRlLmdvKCdeLnNpYmxpbmcnKWAgLSB3aWxsIGdvIHRvIGEgc2libGluZyBzdGF0ZVxyXG4gICAgICogLSBgJHN0YXRlLmdvKCcuY2hpbGQuZ3JhbmRjaGlsZCcpYCAtIHdpbGwgZ28gdG8gZ3JhbmRjaGlsZCBzdGF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gcGFyYW1zIEEgbWFwIG9mIHRoZSBwYXJhbWV0ZXJzIHRoYXQgd2lsbCBiZSBzZW50IHRvIHRoZSBzdGF0ZSwgXHJcbiAgICAgKiB3aWxsIHBvcHVsYXRlICRzdGF0ZVBhcmFtcy4gQW55IHBhcmFtZXRlcnMgdGhhdCBhcmUgbm90IHNwZWNpZmllZCB3aWxsIGJlIGluaGVyaXRlZCBmcm9tIGN1cnJlbnRseSBcclxuICAgICAqIGRlZmluZWQgcGFyYW1ldGVycy4gT25seSBwYXJhbWV0ZXJzIHNwZWNpZmllZCBpbiB0aGUgc3RhdGUgZGVmaW5pdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiwgbmV3IFxyXG4gICAgICogcGFyYW1ldGVycyB3aWxsIGJlIGlnbm9yZWQuIFRoaXMgYWxsb3dzLCBmb3IgZXhhbXBsZSwgZ29pbmcgdG8gYSBzaWJsaW5nIHN0YXRlIHRoYXQgc2hhcmVzIHBhcmFtZXRlcnNcclxuICAgICAqIHNwZWNpZmllZCBpbiBhIHBhcmVudCBzdGF0ZS4gUGFyYW1ldGVyIGluaGVyaXRhbmNlIG9ubHkgd29ya3MgYmV0d2VlbiBjb21tb24gYW5jZXN0b3Igc3RhdGVzLCBJLmUuXHJcbiAgICAgKiB0cmFuc2l0aW9uaW5nIHRvIGEgc2libGluZyB3aWxsIGdldCB5b3UgdGhlIHBhcmFtZXRlcnMgZm9yIGFsbCBwYXJlbnRzLCB0cmFuc2l0aW9uaW5nIHRvIGEgY2hpbGRcclxuICAgICAqIHdpbGwgZ2V0IHlvdSBhbGwgY3VycmVudCBwYXJhbWV0ZXJzLCBldGMuXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdD19IG9wdGlvbnMgT3B0aW9ucyBvYmplY3QuIFRoZSBvcHRpb25zIGFyZTpcclxuICAgICAqXHJcbiAgICAgKiAtICoqYGxvY2F0aW9uYCoqIC0ge2Jvb2xlYW49dHJ1ZXxzdHJpbmc9fSAtIElmIGB0cnVlYCB3aWxsIHVwZGF0ZSB0aGUgdXJsIGluIHRoZSBsb2NhdGlvbiBiYXIsIGlmIGBmYWxzZWBcclxuICAgICAqICAgIHdpbGwgbm90LiBJZiBzdHJpbmcsIG11c3QgYmUgYFwicmVwbGFjZVwiYCwgd2hpY2ggd2lsbCB1cGRhdGUgdXJsIGFuZCBhbHNvIHJlcGxhY2UgbGFzdCBoaXN0b3J5IHJlY29yZC5cclxuICAgICAqIC0gKipgaW5oZXJpdGAqKiAtIHtib29sZWFuPXRydWV9LCBJZiBgdHJ1ZWAgd2lsbCBpbmhlcml0IHVybCBwYXJhbWV0ZXJzIGZyb20gY3VycmVudCB1cmwuXHJcbiAgICAgKiAtICoqYHJlbGF0aXZlYCoqIC0ge29iamVjdD0kc3RhdGUuJGN1cnJlbnR9LCBXaGVuIHRyYW5zaXRpb25pbmcgd2l0aCByZWxhdGl2ZSBwYXRoIChlLmcgJ14nKSwgXHJcbiAgICAgKiAgICBkZWZpbmVzIHdoaWNoIHN0YXRlIHRvIGJlIHJlbGF0aXZlIGZyb20uXHJcbiAgICAgKiAtICoqYG5vdGlmeWAqKiAtIHtib29sZWFuPXRydWV9LCBJZiBgdHJ1ZWAgd2lsbCBicm9hZGNhc3QgJHN0YXRlQ2hhbmdlU3RhcnQgYW5kICRzdGF0ZUNoYW5nZVN1Y2Nlc3MgZXZlbnRzLlxyXG4gICAgICogLSAqKmByZWxvYWRgKiogKHYwLjIuNSkgLSB7Ym9vbGVhbj1mYWxzZXxzdHJpbmd8b2JqZWN0fSwgSWYgYHRydWVgIHdpbGwgZm9yY2UgdHJhbnNpdGlvbiBldmVuIGlmIG5vIHN0YXRlIG9yIHBhcmFtc1xyXG4gICAgICogICAgaGF2ZSBjaGFuZ2VkLiAgSXQgd2lsbCByZWxvYWQgdGhlIHJlc29sdmVzIGFuZCB2aWV3cyBvZiB0aGUgY3VycmVudCBzdGF0ZSBhbmQgcGFyZW50IHN0YXRlcy5cclxuICAgICAqICAgIElmIGByZWxvYWRgIGlzIGEgc3RyaW5nIChvciBzdGF0ZSBvYmplY3QpLCB0aGUgc3RhdGUgb2JqZWN0IGlzIGZldGNoZWQgKGJ5IG5hbWUsIG9yIG9iamVjdCByZWZlcmVuY2UpOyBhbmQgXFxcclxuICAgICAqICAgIHRoZSB0cmFuc2l0aW9uIHJlbG9hZHMgdGhlIHJlc29sdmVzIGFuZCB2aWV3cyBmb3IgdGhhdCBtYXRjaGVkIHN0YXRlLCBhbmQgYWxsIGl0cyBjaGlsZHJlbiBzdGF0ZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3Byb21pc2V9IEEgcHJvbWlzZSByZXByZXNlbnRpbmcgdGhlIHN0YXRlIG9mIHRoZSBuZXcgdHJhbnNpdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBQb3NzaWJsZSBzdWNjZXNzIHZhbHVlczpcclxuICAgICAqXHJcbiAgICAgKiAtICRzdGF0ZS5jdXJyZW50XHJcbiAgICAgKlxyXG4gICAgICogPGJyLz5Qb3NzaWJsZSByZWplY3Rpb24gdmFsdWVzOlxyXG4gICAgICpcclxuICAgICAqIC0gJ3RyYW5zaXRpb24gc3VwZXJzZWRlZCcgLSB3aGVuIGEgbmV3ZXIgdHJhbnNpdGlvbiBoYXMgYmVlbiBzdGFydGVkIGFmdGVyIHRoaXMgb25lXHJcbiAgICAgKiAtICd0cmFuc2l0aW9uIHByZXZlbnRlZCcgLSB3aGVuIGBldmVudC5wcmV2ZW50RGVmYXVsdCgpYCBoYXMgYmVlbiBjYWxsZWQgaW4gYSBgJHN0YXRlQ2hhbmdlU3RhcnRgIGxpc3RlbmVyXHJcbiAgICAgKiAtICd0cmFuc2l0aW9uIGFib3J0ZWQnIC0gd2hlbiBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgaGFzIGJlZW4gY2FsbGVkIGluIGEgYCRzdGF0ZU5vdEZvdW5kYCBsaXN0ZW5lciBvclxyXG4gICAgICogICB3aGVuIGEgYCRzdGF0ZU5vdEZvdW5kYCBgZXZlbnQucmV0cnlgIHByb21pc2UgZXJyb3JzLlxyXG4gICAgICogLSAndHJhbnNpdGlvbiBmYWlsZWQnIC0gd2hlbiBhIHN0YXRlIGhhcyBiZWVuIHVuc3VjY2Vzc2Z1bGx5IGZvdW5kIGFmdGVyIDIgdHJpZXMuXHJcbiAgICAgKiAtICpyZXNvbHZlIGVycm9yKiAtIHdoZW4gYW4gZXJyb3IgaGFzIG9jY3VycmVkIHdpdGggYSBgcmVzb2x2ZWBcclxuICAgICAqXHJcbiAgICAgKi9cclxuICAgICRzdGF0ZS5nbyA9IGZ1bmN0aW9uIGdvKHRvLCBwYXJhbXMsIG9wdGlvbnMpIHtcclxuICAgICAgcmV0dXJuICRzdGF0ZS50cmFuc2l0aW9uVG8odG8sIHBhcmFtcywgZXh0ZW5kKHsgaW5oZXJpdDogdHJ1ZSwgcmVsYXRpdmU6ICRzdGF0ZS4kY3VycmVudCB9LCBvcHRpb25zKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI3RyYW5zaXRpb25Ub1xyXG4gICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIExvdy1sZXZlbCBtZXRob2QgZm9yIHRyYW5zaXRpb25pbmcgdG8gYSBuZXcgc3RhdGUuIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI21ldGhvZHNfZ28gJHN0YXRlLmdvfVxyXG4gICAgICogdXNlcyBgdHJhbnNpdGlvblRvYCBpbnRlcm5hbGx5LiBgJHN0YXRlLmdvYCBpcyByZWNvbW1lbmRlZCBpbiBtb3N0IHNpdHVhdGlvbnMuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsndWkucm91dGVyJ10pO1xyXG4gICAgICpcclxuICAgICAqIGFwcC5jb250cm9sbGVyKCdjdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlKSB7XHJcbiAgICAgKiAgICRzY29wZS5jaGFuZ2VTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAqICAgICAkc3RhdGUudHJhbnNpdGlvblRvKCdjb250YWN0LmRldGFpbCcpO1xyXG4gICAgICogICB9O1xyXG4gICAgICogfSk7XHJcbiAgICAgKiA8L3ByZT5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdG8gU3RhdGUgbmFtZS5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gdG9QYXJhbXMgQSBtYXAgb2YgdGhlIHBhcmFtZXRlcnMgdGhhdCB3aWxsIGJlIHNlbnQgdG8gdGhlIHN0YXRlLFxyXG4gICAgICogd2lsbCBwb3B1bGF0ZSAkc3RhdGVQYXJhbXMuXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdD19IG9wdGlvbnMgT3B0aW9ucyBvYmplY3QuIFRoZSBvcHRpb25zIGFyZTpcclxuICAgICAqXHJcbiAgICAgKiAtICoqYGxvY2F0aW9uYCoqIC0ge2Jvb2xlYW49dHJ1ZXxzdHJpbmc9fSAtIElmIGB0cnVlYCB3aWxsIHVwZGF0ZSB0aGUgdXJsIGluIHRoZSBsb2NhdGlvbiBiYXIsIGlmIGBmYWxzZWBcclxuICAgICAqICAgIHdpbGwgbm90LiBJZiBzdHJpbmcsIG11c3QgYmUgYFwicmVwbGFjZVwiYCwgd2hpY2ggd2lsbCB1cGRhdGUgdXJsIGFuZCBhbHNvIHJlcGxhY2UgbGFzdCBoaXN0b3J5IHJlY29yZC5cclxuICAgICAqIC0gKipgaW5oZXJpdGAqKiAtIHtib29sZWFuPWZhbHNlfSwgSWYgYHRydWVgIHdpbGwgaW5oZXJpdCB1cmwgcGFyYW1ldGVycyBmcm9tIGN1cnJlbnQgdXJsLlxyXG4gICAgICogLSAqKmByZWxhdGl2ZWAqKiAtIHtvYmplY3Q9fSwgV2hlbiB0cmFuc2l0aW9uaW5nIHdpdGggcmVsYXRpdmUgcGF0aCAoZS5nICdeJyksIFxyXG4gICAgICogICAgZGVmaW5lcyB3aGljaCBzdGF0ZSB0byBiZSByZWxhdGl2ZSBmcm9tLlxyXG4gICAgICogLSAqKmBub3RpZnlgKiogLSB7Ym9vbGVhbj10cnVlfSwgSWYgYHRydWVgIHdpbGwgYnJvYWRjYXN0ICRzdGF0ZUNoYW5nZVN0YXJ0IGFuZCAkc3RhdGVDaGFuZ2VTdWNjZXNzIGV2ZW50cy5cclxuICAgICAqIC0gKipgcmVsb2FkYCoqICh2MC4yLjUpIC0ge2Jvb2xlYW49ZmFsc2V8c3RyaW5nPXxvYmplY3Q9fSwgSWYgYHRydWVgIHdpbGwgZm9yY2UgdHJhbnNpdGlvbiBldmVuIGlmIHRoZSBzdGF0ZSBvciBwYXJhbXMgXHJcbiAgICAgKiAgICBoYXZlIG5vdCBjaGFuZ2VkLCBha2EgYSByZWxvYWQgb2YgdGhlIHNhbWUgc3RhdGUuIEl0IGRpZmZlcnMgZnJvbSByZWxvYWRPblNlYXJjaCBiZWNhdXNlIHlvdSdkXHJcbiAgICAgKiAgICB1c2UgdGhpcyB3aGVuIHlvdSB3YW50IHRvIGZvcmNlIGEgcmVsb2FkIHdoZW4gKmV2ZXJ5dGhpbmcqIGlzIHRoZSBzYW1lLCBpbmNsdWRpbmcgc2VhcmNoIHBhcmFtcy5cclxuICAgICAqICAgIGlmIFN0cmluZywgdGhlbiB3aWxsIHJlbG9hZCB0aGUgc3RhdGUgd2l0aCB0aGUgbmFtZSBnaXZlbiBpbiByZWxvYWQsIGFuZCBhbnkgY2hpbGRyZW4uXHJcbiAgICAgKiAgICBpZiBPYmplY3QsIHRoZW4gYSBzdGF0ZU9iaiBpcyBleHBlY3RlZCwgd2lsbCByZWxvYWQgdGhlIHN0YXRlIGZvdW5kIGluIHN0YXRlT2JqLCBhbmQgYW55IGNoaWxkcmVuLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtwcm9taXNlfSBBIHByb21pc2UgcmVwcmVzZW50aW5nIHRoZSBzdGF0ZSBvZiB0aGUgbmV3IHRyYW5zaXRpb24uIFNlZVxyXG4gICAgICoge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjbWV0aG9kc19nbyAkc3RhdGUuZ299LlxyXG4gICAgICovXHJcbiAgICAkc3RhdGUudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gdHJhbnNpdGlvblRvKHRvLCB0b1BhcmFtcywgb3B0aW9ucykge1xyXG4gICAgICB0b1BhcmFtcyA9IHRvUGFyYW1zIHx8IHt9O1xyXG4gICAgICBvcHRpb25zID0gZXh0ZW5kKHtcclxuICAgICAgICBsb2NhdGlvbjogdHJ1ZSwgaW5oZXJpdDogZmFsc2UsIHJlbGF0aXZlOiBudWxsLCBub3RpZnk6IHRydWUsIHJlbG9hZDogZmFsc2UsICRyZXRyeTogZmFsc2VcclxuICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XHJcblxyXG4gICAgICB2YXIgZnJvbSA9ICRzdGF0ZS4kY3VycmVudCwgZnJvbVBhcmFtcyA9ICRzdGF0ZS5wYXJhbXMsIGZyb21QYXRoID0gZnJvbS5wYXRoO1xyXG4gICAgICB2YXIgZXZ0LCB0b1N0YXRlID0gZmluZFN0YXRlKHRvLCBvcHRpb25zLnJlbGF0aXZlKTtcclxuXHJcbiAgICAgIC8vIFN0b3JlIHRoZSBoYXNoIHBhcmFtIGZvciBsYXRlciAoc2luY2UgaXQgd2lsbCBiZSBzdHJpcHBlZCBvdXQgYnkgdmFyaW91cyBtZXRob2RzKVxyXG4gICAgICB2YXIgaGFzaCA9IHRvUGFyYW1zWycjJ107XHJcblxyXG4gICAgICBpZiAoIWlzRGVmaW5lZCh0b1N0YXRlKSkge1xyXG4gICAgICAgIHZhciByZWRpcmVjdCA9IHsgdG86IHRvLCB0b1BhcmFtczogdG9QYXJhbXMsIG9wdGlvbnM6IG9wdGlvbnMgfTtcclxuICAgICAgICB2YXIgcmVkaXJlY3RSZXN1bHQgPSBoYW5kbGVSZWRpcmVjdChyZWRpcmVjdCwgZnJvbS5zZWxmLCBmcm9tUGFyYW1zLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgaWYgKHJlZGlyZWN0UmVzdWx0KSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVkaXJlY3RSZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBbHdheXMgcmV0cnkgb25jZSBpZiB0aGUgJHN0YXRlTm90Rm91bmQgd2FzIG5vdCBwcmV2ZW50ZWRcclxuICAgICAgICAvLyAoaGFuZGxlcyBlaXRoZXIgcmVkaXJlY3QgY2hhbmdlZCBvciBzdGF0ZSBsYXp5LWRlZmluaXRpb24pXHJcbiAgICAgICAgdG8gPSByZWRpcmVjdC50bztcclxuICAgICAgICB0b1BhcmFtcyA9IHJlZGlyZWN0LnRvUGFyYW1zO1xyXG4gICAgICAgIG9wdGlvbnMgPSByZWRpcmVjdC5vcHRpb25zO1xyXG4gICAgICAgIHRvU3RhdGUgPSBmaW5kU3RhdGUodG8sIG9wdGlvbnMucmVsYXRpdmUpO1xyXG5cclxuICAgICAgICBpZiAoIWlzRGVmaW5lZCh0b1N0YXRlKSkge1xyXG4gICAgICAgICAgaWYgKCFvcHRpb25zLnJlbGF0aXZlKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBzdWNoIHN0YXRlICdcIiArIHRvICsgXCInXCIpO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHJlc29sdmUgJ1wiICsgdG8gKyBcIicgZnJvbSBzdGF0ZSAnXCIgKyBvcHRpb25zLnJlbGF0aXZlICsgXCInXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAodG9TdGF0ZVthYnN0cmFjdEtleV0pIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCB0cmFuc2l0aW9uIHRvIGFic3RyYWN0IHN0YXRlICdcIiArIHRvICsgXCInXCIpO1xyXG4gICAgICBpZiAob3B0aW9ucy5pbmhlcml0KSB0b1BhcmFtcyA9IGluaGVyaXRQYXJhbXMoJHN0YXRlUGFyYW1zLCB0b1BhcmFtcyB8fCB7fSwgJHN0YXRlLiRjdXJyZW50LCB0b1N0YXRlKTtcclxuICAgICAgaWYgKCF0b1N0YXRlLnBhcmFtcy4kJHZhbGlkYXRlcyh0b1BhcmFtcykpIHJldHVybiBUcmFuc2l0aW9uRmFpbGVkO1xyXG5cclxuICAgICAgdG9QYXJhbXMgPSB0b1N0YXRlLnBhcmFtcy4kJHZhbHVlcyh0b1BhcmFtcyk7XHJcbiAgICAgIHRvID0gdG9TdGF0ZTtcclxuXHJcbiAgICAgIHZhciB0b1BhdGggPSB0by5wYXRoO1xyXG5cclxuICAgICAgLy8gU3RhcnRpbmcgZnJvbSB0aGUgcm9vdCBvZiB0aGUgcGF0aCwga2VlcCBhbGwgbGV2ZWxzIHRoYXQgaGF2ZW4ndCBjaGFuZ2VkXHJcbiAgICAgIHZhciBrZWVwID0gMCwgc3RhdGUgPSB0b1BhdGhba2VlcF0sIGxvY2FscyA9IHJvb3QubG9jYWxzLCB0b0xvY2FscyA9IFtdO1xyXG5cclxuICAgICAgaWYgKCFvcHRpb25zLnJlbG9hZCkge1xyXG4gICAgICAgIHdoaWxlIChzdGF0ZSAmJiBzdGF0ZSA9PT0gZnJvbVBhdGhba2VlcF0gJiYgc3RhdGUub3duUGFyYW1zLiQkZXF1YWxzKHRvUGFyYW1zLCBmcm9tUGFyYW1zKSkge1xyXG4gICAgICAgICAgbG9jYWxzID0gdG9Mb2NhbHNba2VlcF0gPSBzdGF0ZS5sb2NhbHM7XHJcbiAgICAgICAgICBrZWVwKys7XHJcbiAgICAgICAgICBzdGF0ZSA9IHRvUGF0aFtrZWVwXTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNTdHJpbmcob3B0aW9ucy5yZWxvYWQpIHx8IGlzT2JqZWN0KG9wdGlvbnMucmVsb2FkKSkge1xyXG4gICAgICAgIGlmIChpc09iamVjdChvcHRpb25zLnJlbG9hZCkgJiYgIW9wdGlvbnMucmVsb2FkLm5hbWUpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCByZWxvYWQgc3RhdGUgb2JqZWN0Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciByZWxvYWRTdGF0ZSA9IG9wdGlvbnMucmVsb2FkID09PSB0cnVlID8gZnJvbVBhdGhbMF0gOiBmaW5kU3RhdGUob3B0aW9ucy5yZWxvYWQpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLnJlbG9hZCAmJiAhcmVsb2FkU3RhdGUpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHN1Y2ggcmVsb2FkIHN0YXRlICdcIiArIChpc1N0cmluZyhvcHRpb25zLnJlbG9hZCkgPyBvcHRpb25zLnJlbG9hZCA6IG9wdGlvbnMucmVsb2FkLm5hbWUpICsgXCInXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHN0YXRlICYmIHN0YXRlID09PSBmcm9tUGF0aFtrZWVwXSAmJiBzdGF0ZSAhPT0gcmVsb2FkU3RhdGUpIHtcclxuICAgICAgICAgIGxvY2FscyA9IHRvTG9jYWxzW2tlZXBdID0gc3RhdGUubG9jYWxzO1xyXG4gICAgICAgICAga2VlcCsrO1xyXG4gICAgICAgICAgc3RhdGUgPSB0b1BhdGhba2VlcF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB3ZSdyZSBnb2luZyB0byB0aGUgc2FtZSBzdGF0ZSBhbmQgYWxsIGxvY2FscyBhcmUga2VwdCwgd2UndmUgZ290IG5vdGhpbmcgdG8gZG8uXHJcbiAgICAgIC8vIEJ1dCBjbGVhciAndHJhbnNpdGlvbicsIGFzIHdlIHN0aWxsIHdhbnQgdG8gY2FuY2VsIGFueSBvdGhlciBwZW5kaW5nIHRyYW5zaXRpb25zLlxyXG4gICAgICAvLyBUT0RPOiBXZSBtYXkgbm90IHdhbnQgdG8gYnVtcCAndHJhbnNpdGlvbicgaWYgd2UncmUgY2FsbGVkIGZyb20gYSBsb2NhdGlvbiBjaGFuZ2VcclxuICAgICAgLy8gdGhhdCB3ZSd2ZSBpbml0aWF0ZWQgb3Vyc2VsdmVzLCBiZWNhdXNlIHdlIG1pZ2h0IGFjY2lkZW50YWxseSBhYm9ydCBhIGxlZ2l0aW1hdGVcclxuICAgICAgLy8gdHJhbnNpdGlvbiBpbml0aWF0ZWQgZnJvbSBjb2RlP1xyXG4gICAgICBpZiAoc2hvdWxkU2tpcFJlbG9hZCh0bywgdG9QYXJhbXMsIGZyb20sIGZyb21QYXJhbXMsIGxvY2Fscywgb3B0aW9ucykpIHtcclxuICAgICAgICBpZiAoaGFzaCkgdG9QYXJhbXNbJyMnXSA9IGhhc2g7XHJcbiAgICAgICAgJHN0YXRlLnBhcmFtcyA9IHRvUGFyYW1zO1xyXG4gICAgICAgIGNvcHkoJHN0YXRlLnBhcmFtcywgJHN0YXRlUGFyYW1zKTtcclxuICAgICAgICBjb3B5KGZpbHRlckJ5S2V5cyh0by5wYXJhbXMuJCRrZXlzKCksICRzdGF0ZVBhcmFtcyksIHRvLmxvY2Fscy5nbG9iYWxzLiRzdGF0ZVBhcmFtcyk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb24gJiYgdG8ubmF2aWdhYmxlICYmIHRvLm5hdmlnYWJsZS51cmwpIHtcclxuICAgICAgICAgICR1cmxSb3V0ZXIucHVzaCh0by5uYXZpZ2FibGUudXJsLCB0b1BhcmFtcywge1xyXG4gICAgICAgICAgICAkJGF2b2lkUmVzeW5jOiB0cnVlLCByZXBsYWNlOiBvcHRpb25zLmxvY2F0aW9uID09PSAncmVwbGFjZSdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgJHVybFJvdXRlci51cGRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICRzdGF0ZS50cmFuc2l0aW9uID0gbnVsbDtcclxuICAgICAgICByZXR1cm4gJHEud2hlbigkc3RhdGUuY3VycmVudCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZpbHRlciBwYXJhbWV0ZXJzIGJlZm9yZSB3ZSBwYXNzIHRoZW0gdG8gZXZlbnQgaGFuZGxlcnMgZXRjLlxyXG4gICAgICB0b1BhcmFtcyA9IGZpbHRlckJ5S2V5cyh0by5wYXJhbXMuJCRrZXlzKCksIHRvUGFyYW1zIHx8IHt9KTtcclxuICAgICAgXHJcbiAgICAgIC8vIFJlLWFkZCB0aGUgc2F2ZWQgaGFzaCBiZWZvcmUgd2Ugc3RhcnQgcmV0dXJuaW5nIHRoaW5ncyBvciBicm9hZGNhc3RpbmcgJHN0YXRlQ2hhbmdlU3RhcnRcclxuICAgICAgaWYgKGhhc2gpIHRvUGFyYW1zWycjJ10gPSBoYXNoO1xyXG4gICAgICBcclxuICAgICAgLy8gQnJvYWRjYXN0IHN0YXJ0IGV2ZW50IGFuZCBjYW5jZWwgdGhlIHRyYW5zaXRpb24gaWYgcmVxdWVzdGVkXHJcbiAgICAgIGlmIChvcHRpb25zLm5vdGlmeSkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBuZ2RvYyBldmVudFxyXG4gICAgICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjJHN0YXRlQ2hhbmdlU3RhcnRcclxuICAgICAgICAgKiBAZXZlbnRPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAgICAgICAgICogQGV2ZW50VHlwZSBicm9hZGNhc3Qgb24gcm9vdCBzY29wZVxyXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxyXG4gICAgICAgICAqIEZpcmVkIHdoZW4gdGhlIHN0YXRlIHRyYW5zaXRpb24gKipiZWdpbnMqKi4gWW91IGNhbiB1c2UgYGV2ZW50LnByZXZlbnREZWZhdWx0KClgXHJcbiAgICAgICAgICogdG8gcHJldmVudCB0aGUgdHJhbnNpdGlvbiBmcm9tIGhhcHBlbmluZyBhbmQgdGhlbiB0aGUgdHJhbnNpdGlvbiBwcm9taXNlIHdpbGwgYmVcclxuICAgICAgICAgKiByZWplY3RlZCB3aXRoIGEgYCd0cmFuc2l0aW9uIHByZXZlbnRlZCdgIHZhbHVlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IEV2ZW50IG9iamVjdC5cclxuICAgICAgICAgKiBAcGFyYW0ge1N0YXRlfSB0b1N0YXRlIFRoZSBzdGF0ZSBiZWluZyB0cmFuc2l0aW9uZWQgdG8uXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHRvUGFyYW1zIFRoZSBwYXJhbXMgc3VwcGxpZWQgdG8gdGhlIGB0b1N0YXRlYC5cclxuICAgICAgICAgKiBAcGFyYW0ge1N0YXRlfSBmcm9tU3RhdGUgVGhlIGN1cnJlbnQgc3RhdGUsIHByZS10cmFuc2l0aW9uLlxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tUGFyYW1zIFRoZSBwYXJhbXMgc3VwcGxpZWQgdG8gdGhlIGBmcm9tU3RhdGVgLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQGV4YW1wbGVcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIDxwcmU+XHJcbiAgICAgICAgICogJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JyxcclxuICAgICAgICAgKiBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyl7XHJcbiAgICAgICAgICogICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICogICAgIC8vIHRyYW5zaXRpb25UbygpIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoXHJcbiAgICAgICAgICogICAgIC8vIGEgJ3RyYW5zaXRpb24gcHJldmVudGVkJyBlcnJvclxyXG4gICAgICAgICAqIH0pXHJcbiAgICAgICAgICogPC9wcmU+XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaWYgKCRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHN0YXRlQ2hhbmdlU3RhcnQnLCB0by5zZWxmLCB0b1BhcmFtcywgZnJvbS5zZWxmLCBmcm9tUGFyYW1zLCBvcHRpb25zKS5kZWZhdWx0UHJldmVudGVkKSB7XHJcbiAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJyRzdGF0ZUNoYW5nZUNhbmNlbCcsIHRvLnNlbGYsIHRvUGFyYW1zLCBmcm9tLnNlbGYsIGZyb21QYXJhbXMpO1xyXG4gICAgICAgICAgLy9Eb24ndCB1cGRhdGUgYW5kIHJlc3luYyB1cmwgaWYgdGhlcmUncyBiZWVuIGEgbmV3IHRyYW5zaXRpb24gc3RhcnRlZC4gc2VlIGlzc3VlICMyMjM4LCAjNjAwXHJcbiAgICAgICAgICBpZiAoJHN0YXRlLnRyYW5zaXRpb24gPT0gbnVsbCkgJHVybFJvdXRlci51cGRhdGUoKTtcclxuICAgICAgICAgIHJldHVybiBUcmFuc2l0aW9uUHJldmVudGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVzb2x2ZSBsb2NhbHMgZm9yIHRoZSByZW1haW5pbmcgc3RhdGVzLCBidXQgZG9uJ3QgdXBkYXRlIGFueSBnbG9iYWwgc3RhdGUganVzdFxyXG4gICAgICAvLyB5ZXQgLS0gaWYgYW55dGhpbmcgZmFpbHMgdG8gcmVzb2x2ZSB0aGUgY3VycmVudCBzdGF0ZSBuZWVkcyB0byByZW1haW4gdW50b3VjaGVkLlxyXG4gICAgICAvLyBXZSBhbHNvIHNldCB1cCBhbiBpbmhlcml0YW5jZSBjaGFpbiBmb3IgdGhlIGxvY2FscyBoZXJlLiBUaGlzIGFsbG93cyB0aGUgdmlldyBkaXJlY3RpdmVcclxuICAgICAgLy8gdG8gcXVpY2tseSBsb29rIHVwIHRoZSBjb3JyZWN0IGRlZmluaXRpb24gZm9yIGVhY2ggdmlldyBpbiB0aGUgY3VycmVudCBzdGF0ZS4gRXZlblxyXG4gICAgICAvLyB0aG91Z2ggd2UgY3JlYXRlIHRoZSBsb2NhbHMgb2JqZWN0IGl0c2VsZiBvdXRzaWRlIHJlc29sdmVTdGF0ZSgpLCBpdCBpcyBpbml0aWFsbHlcclxuICAgICAgLy8gZW1wdHkgYW5kIGdldHMgZmlsbGVkIGFzeW5jaHJvbm91c2x5LiBXZSBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgdGhlIHByb21pc2UgZm9yIHRoZVxyXG4gICAgICAvLyAoZnVsbHkgcmVzb2x2ZWQpIGN1cnJlbnQgbG9jYWxzLCBhbmQgcGFzcyB0aGlzIGRvd24gdGhlIGNoYWluLlxyXG4gICAgICB2YXIgcmVzb2x2ZWQgPSAkcS53aGVuKGxvY2Fscyk7XHJcblxyXG4gICAgICBmb3IgKHZhciBsID0ga2VlcDsgbCA8IHRvUGF0aC5sZW5ndGg7IGwrKywgc3RhdGUgPSB0b1BhdGhbbF0pIHtcclxuICAgICAgICBsb2NhbHMgPSB0b0xvY2Fsc1tsXSA9IGluaGVyaXQobG9jYWxzKTtcclxuICAgICAgICByZXNvbHZlZCA9IHJlc29sdmVTdGF0ZShzdGF0ZSwgdG9QYXJhbXMsIHN0YXRlID09PSB0bywgcmVzb2x2ZWQsIGxvY2Fscywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE9uY2UgZXZlcnl0aGluZyBpcyByZXNvbHZlZCwgd2UgYXJlIHJlYWR5IHRvIHBlcmZvcm0gdGhlIGFjdHVhbCB0cmFuc2l0aW9uXHJcbiAgICAgIC8vIGFuZCByZXR1cm4gYSBwcm9taXNlIGZvciB0aGUgbmV3IHN0YXRlLiBXZSBhbHNvIGtlZXAgdHJhY2sgb2Ygd2hhdCB0aGVcclxuICAgICAgLy8gY3VycmVudCBwcm9taXNlIGlzLCBzbyB0aGF0IHdlIGNhbiBkZXRlY3Qgb3ZlcmxhcHBpbmcgdHJhbnNpdGlvbnMgYW5kXHJcbiAgICAgIC8vIGtlZXAgb25seSB0aGUgb3V0Y29tZSBvZiB0aGUgbGFzdCB0cmFuc2l0aW9uLlxyXG4gICAgICB2YXIgdHJhbnNpdGlvbiA9ICRzdGF0ZS50cmFuc2l0aW9uID0gcmVzb2x2ZWQudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGwsIGVudGVyaW5nLCBleGl0aW5nO1xyXG5cclxuICAgICAgICBpZiAoJHN0YXRlLnRyYW5zaXRpb24gIT09IHRyYW5zaXRpb24pIHJldHVybiBUcmFuc2l0aW9uU3VwZXJzZWRlZDtcclxuXHJcbiAgICAgICAgLy8gRXhpdCAnZnJvbScgc3RhdGVzIG5vdCBrZXB0XHJcbiAgICAgICAgZm9yIChsID0gZnJvbVBhdGgubGVuZ3RoIC0gMTsgbCA+PSBrZWVwOyBsLS0pIHtcclxuICAgICAgICAgIGV4aXRpbmcgPSBmcm9tUGF0aFtsXTtcclxuICAgICAgICAgIGlmIChleGl0aW5nLnNlbGYub25FeGl0KSB7XHJcbiAgICAgICAgICAgICRpbmplY3Rvci5pbnZva2UoZXhpdGluZy5zZWxmLm9uRXhpdCwgZXhpdGluZy5zZWxmLCBleGl0aW5nLmxvY2Fscy5nbG9iYWxzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGV4aXRpbmcubG9jYWxzID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEVudGVyICd0bycgc3RhdGVzIG5vdCBrZXB0XHJcbiAgICAgICAgZm9yIChsID0ga2VlcDsgbCA8IHRvUGF0aC5sZW5ndGg7IGwrKykge1xyXG4gICAgICAgICAgZW50ZXJpbmcgPSB0b1BhdGhbbF07XHJcbiAgICAgICAgICBlbnRlcmluZy5sb2NhbHMgPSB0b0xvY2Fsc1tsXTtcclxuICAgICAgICAgIGlmIChlbnRlcmluZy5zZWxmLm9uRW50ZXIpIHtcclxuICAgICAgICAgICAgJGluamVjdG9yLmludm9rZShlbnRlcmluZy5zZWxmLm9uRW50ZXIsIGVudGVyaW5nLnNlbGYsIGVudGVyaW5nLmxvY2Fscy5nbG9iYWxzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJ1biBpdCBhZ2FpbiwgdG8gY2F0Y2ggYW55IHRyYW5zaXRpb25zIGluIGNhbGxiYWNrc1xyXG4gICAgICAgIGlmICgkc3RhdGUudHJhbnNpdGlvbiAhPT0gdHJhbnNpdGlvbikgcmV0dXJuIFRyYW5zaXRpb25TdXBlcnNlZGVkO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgZ2xvYmFscyBpbiAkc3RhdGVcclxuICAgICAgICAkc3RhdGUuJGN1cnJlbnQgPSB0bztcclxuICAgICAgICAkc3RhdGUuY3VycmVudCA9IHRvLnNlbGY7XHJcbiAgICAgICAgJHN0YXRlLnBhcmFtcyA9IHRvUGFyYW1zO1xyXG4gICAgICAgIGNvcHkoJHN0YXRlLnBhcmFtcywgJHN0YXRlUGFyYW1zKTtcclxuICAgICAgICAkc3RhdGUudHJhbnNpdGlvbiA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9uICYmIHRvLm5hdmlnYWJsZSkge1xyXG4gICAgICAgICAgJHVybFJvdXRlci5wdXNoKHRvLm5hdmlnYWJsZS51cmwsIHRvLm5hdmlnYWJsZS5sb2NhbHMuZ2xvYmFscy4kc3RhdGVQYXJhbXMsIHtcclxuICAgICAgICAgICAgJCRhdm9pZFJlc3luYzogdHJ1ZSwgcmVwbGFjZTogb3B0aW9ucy5sb2NhdGlvbiA9PT0gJ3JlcGxhY2UnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLm5vdGlmeSkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBuZ2RvYyBldmVudFxyXG4gICAgICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjJHN0YXRlQ2hhbmdlU3VjY2Vzc1xyXG4gICAgICAgICAqIEBldmVudE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICAgICAgICAgKiBAZXZlbnRUeXBlIGJyb2FkY2FzdCBvbiByb290IHNjb3BlXHJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgICAgICogRmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyAqKmNvbXBsZXRlKiouXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgRXZlbnQgb2JqZWN0LlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IHRvU3RhdGUgVGhlIHN0YXRlIGJlaW5nIHRyYW5zaXRpb25lZCB0by5cclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdG9QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYHRvU3RhdGVgLlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IGZyb21TdGF0ZSBUaGUgY3VycmVudCBzdGF0ZSwgcHJlLXRyYW5zaXRpb24uXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGZyb21QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYGZyb21TdGF0ZWAuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCB0by5zZWxmLCB0b1BhcmFtcywgZnJvbS5zZWxmLCBmcm9tUGFyYW1zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJHVybFJvdXRlci51cGRhdGUodHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiAkc3RhdGUuY3VycmVudDtcclxuICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKCRzdGF0ZS50cmFuc2l0aW9uICE9PSB0cmFuc2l0aW9uKSByZXR1cm4gVHJhbnNpdGlvblN1cGVyc2VkZWQ7XHJcblxyXG4gICAgICAgICRzdGF0ZS50cmFuc2l0aW9uID0gbnVsbDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAbmdkb2MgZXZlbnRcclxuICAgICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlIyRzdGF0ZUNoYW5nZUVycm9yXHJcbiAgICAgICAgICogQGV2ZW50T2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxyXG4gICAgICAgICAqIEBldmVudFR5cGUgYnJvYWRjYXN0IG9uIHJvb3Qgc2NvcGVcclxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAgICAgKiBGaXJlZCB3aGVuIGFuICoqZXJyb3Igb2NjdXJzKiogZHVyaW5nIHRyYW5zaXRpb24uIEl0J3MgaW1wb3J0YW50IHRvIG5vdGUgdGhhdCBpZiB5b3VcclxuICAgICAgICAgKiBoYXZlIGFueSBlcnJvcnMgaW4geW91ciByZXNvbHZlIGZ1bmN0aW9ucyAoamF2YXNjcmlwdCBlcnJvcnMsIG5vbi1leGlzdGVudCBzZXJ2aWNlcywgZXRjKVxyXG4gICAgICAgICAqIHRoZXkgd2lsbCBub3QgdGhyb3cgdHJhZGl0aW9uYWxseS4gWW91IG11c3QgbGlzdGVuIGZvciB0aGlzICRzdGF0ZUNoYW5nZUVycm9yIGV2ZW50IHRvXHJcbiAgICAgICAgICogY2F0Y2ggKipBTEwqKiBlcnJvcnMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgRXZlbnQgb2JqZWN0LlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IHRvU3RhdGUgVGhlIHN0YXRlIGJlaW5nIHRyYW5zaXRpb25lZCB0by5cclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdG9QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYHRvU3RhdGVgLlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IGZyb21TdGF0ZSBUaGUgY3VycmVudCBzdGF0ZSwgcHJlLXRyYW5zaXRpb24uXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGZyb21QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYGZyb21TdGF0ZWAuXHJcbiAgICAgICAgICogQHBhcmFtIHtFcnJvcn0gZXJyb3IgVGhlIHJlc29sdmUgZXJyb3Igb2JqZWN0LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGV2dCA9ICRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHN0YXRlQ2hhbmdlRXJyb3InLCB0by5zZWxmLCB0b1BhcmFtcywgZnJvbS5zZWxmLCBmcm9tUGFyYW1zLCBlcnJvcik7XHJcblxyXG4gICAgICAgIGlmICghZXZ0LmRlZmF1bHRQcmV2ZW50ZWQpIHtcclxuICAgICAgICAgICAgJHVybFJvdXRlci51cGRhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAkcS5yZWplY3QoZXJyb3IpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNpc1xyXG4gICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIFNpbWlsYXIgdG8ge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjbWV0aG9kc19pbmNsdWRlcyAkc3RhdGUuaW5jbHVkZXN9LFxyXG4gICAgICogYnV0IG9ubHkgY2hlY2tzIGZvciB0aGUgZnVsbCBzdGF0ZSBuYW1lLiBJZiBwYXJhbXMgaXMgc3VwcGxpZWQgdGhlbiBpdCB3aWxsIGJlXHJcbiAgICAgKiB0ZXN0ZWQgZm9yIHN0cmljdCBlcXVhbGl0eSBhZ2FpbnN0IHRoZSBjdXJyZW50IGFjdGl2ZSBwYXJhbXMgb2JqZWN0LCBzbyBhbGwgcGFyYW1zXHJcbiAgICAgKiBtdXN0IG1hdGNoIHdpdGggbm9uZSBtaXNzaW5nIGFuZCBubyBleHRyYXMuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiAkc3RhdGUuJGN1cnJlbnQubmFtZSA9ICdjb250YWN0cy5kZXRhaWxzLml0ZW0nO1xyXG4gICAgICpcclxuICAgICAqIC8vIGFic29sdXRlIG5hbWVcclxuICAgICAqICRzdGF0ZS5pcygnY29udGFjdC5kZXRhaWxzLml0ZW0nKTsgLy8gcmV0dXJucyB0cnVlXHJcbiAgICAgKiAkc3RhdGUuaXMoY29udGFjdERldGFpbEl0ZW1TdGF0ZU9iamVjdCk7IC8vIHJldHVybnMgdHJ1ZVxyXG4gICAgICpcclxuICAgICAqIC8vIHJlbGF0aXZlIG5hbWUgKC4gYW5kIF4pLCB0eXBpY2FsbHkgZnJvbSBhIHRlbXBsYXRlXHJcbiAgICAgKiAvLyBFLmcuIGZyb20gdGhlICdjb250YWN0cy5kZXRhaWxzJyB0ZW1wbGF0ZVxyXG4gICAgICogPGRpdiBuZy1jbGFzcz1cIntoaWdobGlnaHRlZDogJHN0YXRlLmlzKCcuaXRlbScpfVwiPkl0ZW08L2Rpdj5cclxuICAgICAqIDwvcHJlPlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gc3RhdGVPck5hbWUgVGhlIHN0YXRlIG5hbWUgKGFic29sdXRlIG9yIHJlbGF0aXZlKSBvciBzdGF0ZSBvYmplY3QgeW91J2QgbGlrZSB0byBjaGVjay5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gcGFyYW1zIEEgcGFyYW0gb2JqZWN0LCBlLmcuIGB7c2VjdGlvbklkOiBzZWN0aW9uLmlkfWAsIHRoYXQgeW91J2QgbGlrZVxyXG4gICAgICogdG8gdGVzdCBhZ2FpbnN0IHRoZSBjdXJyZW50IGFjdGl2ZSBzdGF0ZS5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gb3B0aW9ucyBBbiBvcHRpb25zIG9iamVjdC4gIFRoZSBvcHRpb25zIGFyZTpcclxuICAgICAqXHJcbiAgICAgKiAtICoqYHJlbGF0aXZlYCoqIC0ge3N0cmluZ3xvYmplY3R9IC0gIElmIGBzdGF0ZU9yTmFtZWAgaXMgYSByZWxhdGl2ZSBzdGF0ZSBuYW1lIGFuZCBgb3B0aW9ucy5yZWxhdGl2ZWAgaXMgc2V0LCAuaXMgd2lsbFxyXG4gICAgICogdGVzdCByZWxhdGl2ZSB0byBgb3B0aW9ucy5yZWxhdGl2ZWAgc3RhdGUgKG9yIG5hbWUpLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgaXQgaXMgdGhlIHN0YXRlLlxyXG4gICAgICovXHJcbiAgICAkc3RhdGUuaXMgPSBmdW5jdGlvbiBpcyhzdGF0ZU9yTmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmQoeyByZWxhdGl2ZTogJHN0YXRlLiRjdXJyZW50IH0sIG9wdGlvbnMgfHwge30pO1xyXG4gICAgICB2YXIgc3RhdGUgPSBmaW5kU3RhdGUoc3RhdGVPck5hbWUsIG9wdGlvbnMucmVsYXRpdmUpO1xyXG5cclxuICAgICAgaWYgKCFpc0RlZmluZWQoc3RhdGUpKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cclxuICAgICAgaWYgKCRzdGF0ZS4kY3VycmVudCAhPT0gc3RhdGUpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgIHJldHVybiBwYXJhbXMgPyBlcXVhbEZvcktleXMoc3RhdGUucGFyYW1zLiQkdmFsdWVzKHBhcmFtcyksICRzdGF0ZVBhcmFtcykgOiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBuZ2RvYyBmdW5jdGlvblxyXG4gICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNpbmNsdWRlc1xyXG4gICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIEEgbWV0aG9kIHRvIGRldGVybWluZSBpZiB0aGUgY3VycmVudCBhY3RpdmUgc3RhdGUgaXMgZXF1YWwgdG8gb3IgaXMgdGhlIGNoaWxkIG9mIHRoZVxyXG4gICAgICogc3RhdGUgc3RhdGVOYW1lLiBJZiBhbnkgcGFyYW1zIGFyZSBwYXNzZWQgdGhlbiB0aGV5IHdpbGwgYmUgdGVzdGVkIGZvciBhIG1hdGNoIGFzIHdlbGwuXHJcbiAgICAgKiBOb3QgYWxsIHRoZSBwYXJhbWV0ZXJzIG5lZWQgdG8gYmUgcGFzc2VkLCBqdXN0IHRoZSBvbmVzIHlvdSdkIGxpa2UgdG8gdGVzdCBmb3IgZXF1YWxpdHkuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIFBhcnRpYWwgYW5kIHJlbGF0aXZlIG5hbWVzXHJcbiAgICAgKiA8cHJlPlxyXG4gICAgICogJHN0YXRlLiRjdXJyZW50Lm5hbWUgPSAnY29udGFjdHMuZGV0YWlscy5pdGVtJztcclxuICAgICAqXHJcbiAgICAgKiAvLyBVc2luZyBwYXJ0aWFsIG5hbWVzXHJcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCJjb250YWN0c1wiKTsgLy8gcmV0dXJucyB0cnVlXHJcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCJjb250YWN0cy5kZXRhaWxzXCIpOyAvLyByZXR1cm5zIHRydWVcclxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcImNvbnRhY3RzLmRldGFpbHMuaXRlbVwiKTsgLy8gcmV0dXJucyB0cnVlXHJcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCJjb250YWN0cy5saXN0XCIpOyAvLyByZXR1cm5zIGZhbHNlXHJcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCJhYm91dFwiKTsgLy8gcmV0dXJucyBmYWxzZVxyXG4gICAgICpcclxuICAgICAqIC8vIFVzaW5nIHJlbGF0aXZlIG5hbWVzICguIGFuZCBeKSwgdHlwaWNhbGx5IGZyb20gYSB0ZW1wbGF0ZVxyXG4gICAgICogLy8gRS5nLiBmcm9tIHRoZSAnY29udGFjdHMuZGV0YWlscycgdGVtcGxhdGVcclxuICAgICAqIDxkaXYgbmctY2xhc3M9XCJ7aGlnaGxpZ2h0ZWQ6ICRzdGF0ZS5pbmNsdWRlcygnLml0ZW0nKX1cIj5JdGVtPC9kaXY+XHJcbiAgICAgKiA8L3ByZT5cclxuICAgICAqXHJcbiAgICAgKiBCYXNpYyBnbG9iYmluZyBwYXR0ZXJuc1xyXG4gICAgICogPHByZT5cclxuICAgICAqICRzdGF0ZS4kY3VycmVudC5uYW1lID0gJ2NvbnRhY3RzLmRldGFpbHMuaXRlbS51cmwnO1xyXG4gICAgICpcclxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcIiouZGV0YWlscy4qLipcIik7IC8vIHJldHVybnMgdHJ1ZVxyXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiKi5kZXRhaWxzLioqXCIpOyAvLyByZXR1cm5zIHRydWVcclxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcIioqLml0ZW0uKipcIik7IC8vIHJldHVybnMgdHJ1ZVxyXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiKi5kZXRhaWxzLml0ZW0udXJsXCIpOyAvLyByZXR1cm5zIHRydWVcclxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcIiouZGV0YWlscy4qLnVybFwiKTsgLy8gcmV0dXJucyB0cnVlXHJcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCIqLmRldGFpbHMuKlwiKTsgLy8gcmV0dXJucyBmYWxzZVxyXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiaXRlbS4qKlwiKTsgLy8gcmV0dXJucyBmYWxzZVxyXG4gICAgICogPC9wcmU+XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlT3JOYW1lIEEgcGFydGlhbCBuYW1lLCByZWxhdGl2ZSBuYW1lLCBvciBnbG9iIHBhdHRlcm5cclxuICAgICAqIHRvIGJlIHNlYXJjaGVkIGZvciB3aXRoaW4gdGhlIGN1cnJlbnQgc3RhdGUgbmFtZS5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gcGFyYW1zIEEgcGFyYW0gb2JqZWN0LCBlLmcuIGB7c2VjdGlvbklkOiBzZWN0aW9uLmlkfWAsXHJcbiAgICAgKiB0aGF0IHlvdSdkIGxpa2UgdG8gdGVzdCBhZ2FpbnN0IHRoZSBjdXJyZW50IGFjdGl2ZSBzdGF0ZS5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gb3B0aW9ucyBBbiBvcHRpb25zIG9iamVjdC4gIFRoZSBvcHRpb25zIGFyZTpcclxuICAgICAqXHJcbiAgICAgKiAtICoqYHJlbGF0aXZlYCoqIC0ge3N0cmluZ3xvYmplY3Q9fSAtICBJZiBgc3RhdGVPck5hbWVgIGlzIGEgcmVsYXRpdmUgc3RhdGUgcmVmZXJlbmNlIGFuZCBgb3B0aW9ucy5yZWxhdGl2ZWAgaXMgc2V0LFxyXG4gICAgICogLmluY2x1ZGVzIHdpbGwgdGVzdCByZWxhdGl2ZSB0byBgb3B0aW9ucy5yZWxhdGl2ZWAgc3RhdGUgKG9yIG5hbWUpLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgaXQgZG9lcyBpbmNsdWRlIHRoZSBzdGF0ZVxyXG4gICAgICovXHJcbiAgICAkc3RhdGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyhzdGF0ZU9yTmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmQoeyByZWxhdGl2ZTogJHN0YXRlLiRjdXJyZW50IH0sIG9wdGlvbnMgfHwge30pO1xyXG4gICAgICBpZiAoaXNTdHJpbmcoc3RhdGVPck5hbWUpICYmIGlzR2xvYihzdGF0ZU9yTmFtZSkpIHtcclxuICAgICAgICBpZiAoIWRvZXNTdGF0ZU1hdGNoR2xvYihzdGF0ZU9yTmFtZSkpIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGVPck5hbWUgPSAkc3RhdGUuJGN1cnJlbnQubmFtZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHN0YXRlID0gZmluZFN0YXRlKHN0YXRlT3JOYW1lLCBvcHRpb25zLnJlbGF0aXZlKTtcclxuICAgICAgaWYgKCFpc0RlZmluZWQoc3RhdGUpKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cclxuICAgICAgaWYgKCFpc0RlZmluZWQoJHN0YXRlLiRjdXJyZW50LmluY2x1ZGVzW3N0YXRlLm5hbWVdKSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgcmV0dXJuIHBhcmFtcyA/IGVxdWFsRm9yS2V5cyhzdGF0ZS5wYXJhbXMuJCR2YWx1ZXMocGFyYW1zKSwgJHN0YXRlUGFyYW1zLCBvYmplY3RLZXlzKHBhcmFtcykpIDogdHJ1ZTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQG5nZG9jIGZ1bmN0aW9uXHJcbiAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI2hyZWZcclxuICAgICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAgICAgKlxyXG4gICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgKiBBIHVybCBnZW5lcmF0aW9uIG1ldGhvZCB0aGF0IHJldHVybnMgdGhlIGNvbXBpbGVkIHVybCBmb3IgdGhlIGdpdmVuIHN0YXRlIHBvcHVsYXRlZCB3aXRoIHRoZSBnaXZlbiBwYXJhbXMuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiBleHBlY3QoJHN0YXRlLmhyZWYoXCJhYm91dC5wZXJzb25cIiwgeyBwZXJzb246IFwiYm9iXCIgfSkpLnRvRXF1YWwoXCIvYWJvdXQvYm9iXCIpO1xyXG4gICAgICogPC9wcmU+XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBzdGF0ZU9yTmFtZSBUaGUgc3RhdGUgbmFtZSBvciBzdGF0ZSBvYmplY3QgeW91J2QgbGlrZSB0byBnZW5lcmF0ZSBhIHVybCBmcm9tLlxyXG4gICAgICogQHBhcmFtIHtvYmplY3Q9fSBwYXJhbXMgQW4gb2JqZWN0IG9mIHBhcmFtZXRlciB2YWx1ZXMgdG8gZmlsbCB0aGUgc3RhdGUncyByZXF1aXJlZCBwYXJhbWV0ZXJzLlxyXG4gICAgICogQHBhcmFtIHtvYmplY3Q9fSBvcHRpb25zIE9wdGlvbnMgb2JqZWN0LiBUaGUgb3B0aW9ucyBhcmU6XHJcbiAgICAgKlxyXG4gICAgICogLSAqKmBsb3NzeWAqKiAtIHtib29sZWFuPXRydWV9IC0gIElmIHRydWUsIGFuZCBpZiB0aGVyZSBpcyBubyB1cmwgYXNzb2NpYXRlZCB3aXRoIHRoZSBzdGF0ZSBwcm92aWRlZCBpbiB0aGVcclxuICAgICAqICAgIGZpcnN0IHBhcmFtZXRlciwgdGhlbiB0aGUgY29uc3RydWN0ZWQgaHJlZiB1cmwgd2lsbCBiZSBidWlsdCBmcm9tIHRoZSBmaXJzdCBuYXZpZ2FibGUgYW5jZXN0b3IgKGFrYVxyXG4gICAgICogICAgYW5jZXN0b3Igd2l0aCBhIHZhbGlkIHVybCkuXHJcbiAgICAgKiAtICoqYGluaGVyaXRgKiogLSB7Ym9vbGVhbj10cnVlfSwgSWYgYHRydWVgIHdpbGwgaW5oZXJpdCB1cmwgcGFyYW1ldGVycyBmcm9tIGN1cnJlbnQgdXJsLlxyXG4gICAgICogLSAqKmByZWxhdGl2ZWAqKiAtIHtvYmplY3Q9JHN0YXRlLiRjdXJyZW50fSwgV2hlbiB0cmFuc2l0aW9uaW5nIHdpdGggcmVsYXRpdmUgcGF0aCAoZS5nICdeJyksIFxyXG4gICAgICogICAgZGVmaW5lcyB3aGljaCBzdGF0ZSB0byBiZSByZWxhdGl2ZSBmcm9tLlxyXG4gICAgICogLSAqKmBhYnNvbHV0ZWAqKiAtIHtib29sZWFuPWZhbHNlfSwgIElmIHRydWUgd2lsbCBnZW5lcmF0ZSBhbiBhYnNvbHV0ZSB1cmwsIGUuZy4gXCJodHRwOi8vd3d3LmV4YW1wbGUuY29tL2Z1bGx1cmxcIi5cclxuICAgICAqIFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gY29tcGlsZWQgc3RhdGUgdXJsXHJcbiAgICAgKi9cclxuICAgICRzdGF0ZS5ocmVmID0gZnVuY3Rpb24gaHJlZihzdGF0ZU9yTmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmQoe1xyXG4gICAgICAgIGxvc3N5OiAgICB0cnVlLFxyXG4gICAgICAgIGluaGVyaXQ6ICB0cnVlLFxyXG4gICAgICAgIGFic29sdXRlOiBmYWxzZSxcclxuICAgICAgICByZWxhdGl2ZTogJHN0YXRlLiRjdXJyZW50XHJcbiAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xyXG5cclxuICAgICAgdmFyIHN0YXRlID0gZmluZFN0YXRlKHN0YXRlT3JOYW1lLCBvcHRpb25zLnJlbGF0aXZlKTtcclxuXHJcbiAgICAgIGlmICghaXNEZWZpbmVkKHN0YXRlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIGlmIChvcHRpb25zLmluaGVyaXQpIHBhcmFtcyA9IGluaGVyaXRQYXJhbXMoJHN0YXRlUGFyYW1zLCBwYXJhbXMgfHwge30sICRzdGF0ZS4kY3VycmVudCwgc3RhdGUpO1xyXG4gICAgICBcclxuICAgICAgdmFyIG5hdiA9IChzdGF0ZSAmJiBvcHRpb25zLmxvc3N5KSA/IHN0YXRlLm5hdmlnYWJsZSA6IHN0YXRlO1xyXG5cclxuICAgICAgaWYgKCFuYXYgfHwgbmF2LnVybCA9PT0gdW5kZWZpbmVkIHx8IG5hdi51cmwgPT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gJHVybFJvdXRlci5ocmVmKG5hdi51cmwsIGZpbHRlckJ5S2V5cyhzdGF0ZS5wYXJhbXMuJCRrZXlzKCkuY29uY2F0KCcjJyksIHBhcmFtcyB8fCB7fSksIHtcclxuICAgICAgICBhYnNvbHV0ZTogb3B0aW9ucy5hYnNvbHV0ZVxyXG4gICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjZ2V0XHJcbiAgICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxyXG4gICAgICpcclxuICAgICAqIEBkZXNjcmlwdGlvblxyXG4gICAgICogUmV0dXJucyB0aGUgc3RhdGUgY29uZmlndXJhdGlvbiBvYmplY3QgZm9yIGFueSBzcGVjaWZpYyBzdGF0ZSBvciBhbGwgc3RhdGVzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdD19IHN0YXRlT3JOYW1lIChhYnNvbHV0ZSBvciByZWxhdGl2ZSkgSWYgcHJvdmlkZWQsIHdpbGwgb25seSBnZXQgdGhlIGNvbmZpZyBmb3JcclxuICAgICAqIHRoZSByZXF1ZXN0ZWQgc3RhdGUuIElmIG5vdCBwcm92aWRlZCwgcmV0dXJucyBhbiBhcnJheSBvZiBBTEwgc3RhdGUgY29uZmlncy5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdD19IGNvbnRleHQgV2hlbiBzdGF0ZU9yTmFtZSBpcyBhIHJlbGF0aXZlIHN0YXRlIHJlZmVyZW5jZSwgdGhlIHN0YXRlIHdpbGwgYmUgcmV0cmlldmVkIHJlbGF0aXZlIHRvIGNvbnRleHQuXHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fEFycmF5fSBTdGF0ZSBjb25maWd1cmF0aW9uIG9iamVjdCBvciBhcnJheSBvZiBhbGwgb2JqZWN0cy5cclxuICAgICAqL1xyXG4gICAgJHN0YXRlLmdldCA9IGZ1bmN0aW9uIChzdGF0ZU9yTmFtZSwgY29udGV4dCkge1xyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG1hcChvYmplY3RLZXlzKHN0YXRlcyksIGZ1bmN0aW9uKG5hbWUpIHsgcmV0dXJuIHN0YXRlc1tuYW1lXS5zZWxmOyB9KTtcclxuICAgICAgdmFyIHN0YXRlID0gZmluZFN0YXRlKHN0YXRlT3JOYW1lLCBjb250ZXh0IHx8ICRzdGF0ZS4kY3VycmVudCk7XHJcbiAgICAgIHJldHVybiAoc3RhdGUgJiYgc3RhdGUuc2VsZikgPyBzdGF0ZS5zZWxmIDogbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcmVzb2x2ZVN0YXRlKHN0YXRlLCBwYXJhbXMsIHBhcmFtc0FyZUZpbHRlcmVkLCBpbmhlcml0ZWQsIGRzdCwgb3B0aW9ucykge1xyXG4gICAgICAvLyBNYWtlIGEgcmVzdHJpY3RlZCAkc3RhdGVQYXJhbXMgd2l0aCBvbmx5IHRoZSBwYXJhbWV0ZXJzIHRoYXQgYXBwbHkgdG8gdGhpcyBzdGF0ZSBpZlxyXG4gICAgICAvLyBuZWNlc3NhcnkuIEluIGFkZGl0aW9uIHRvIGJlaW5nIGF2YWlsYWJsZSB0byB0aGUgY29udHJvbGxlciBhbmQgb25FbnRlci9vbkV4aXQgY2FsbGJhY2tzLFxyXG4gICAgICAvLyB3ZSBhbHNvIG5lZWQgJHN0YXRlUGFyYW1zIHRvIGJlIGF2YWlsYWJsZSBmb3IgYW55ICRpbmplY3RvciBjYWxscyB3ZSBtYWtlIGR1cmluZyB0aGVcclxuICAgICAgLy8gZGVwZW5kZW5jeSByZXNvbHV0aW9uIHByb2Nlc3MuXHJcbiAgICAgIHZhciAkc3RhdGVQYXJhbXMgPSAocGFyYW1zQXJlRmlsdGVyZWQpID8gcGFyYW1zIDogZmlsdGVyQnlLZXlzKHN0YXRlLnBhcmFtcy4kJGtleXMoKSwgcGFyYW1zKTtcclxuICAgICAgdmFyIGxvY2FscyA9IHsgJHN0YXRlUGFyYW1zOiAkc3RhdGVQYXJhbXMgfTtcclxuXHJcbiAgICAgIC8vIFJlc29sdmUgJ2dsb2JhbCcgZGVwZW5kZW5jaWVzIGZvciB0aGUgc3RhdGUsIGkuZS4gdGhvc2Ugbm90IHNwZWNpZmljIHRvIGEgdmlldy5cclxuICAgICAgLy8gV2UncmUgYWxzbyBpbmNsdWRpbmcgJHN0YXRlUGFyYW1zIGluIHRoaXM7IHRoYXQgd2F5IHRoZSBwYXJhbWV0ZXJzIGFyZSByZXN0cmljdGVkXHJcbiAgICAgIC8vIHRvIHRoZSBzZXQgdGhhdCBzaG91bGQgYmUgdmlzaWJsZSB0byB0aGUgc3RhdGUsIGFuZCBhcmUgaW5kZXBlbmRlbnQgb2Ygd2hlbiB3ZSB1cGRhdGVcclxuICAgICAgLy8gdGhlIGdsb2JhbCAkc3RhdGUgYW5kICRzdGF0ZVBhcmFtcyB2YWx1ZXMuXHJcbiAgICAgIGRzdC5yZXNvbHZlID0gJHJlc29sdmUucmVzb2x2ZShzdGF0ZS5yZXNvbHZlLCBsb2NhbHMsIGRzdC5yZXNvbHZlLCBzdGF0ZSk7XHJcbiAgICAgIHZhciBwcm9taXNlcyA9IFtkc3QucmVzb2x2ZS50aGVuKGZ1bmN0aW9uIChnbG9iYWxzKSB7XHJcbiAgICAgICAgZHN0Lmdsb2JhbHMgPSBnbG9iYWxzO1xyXG4gICAgICB9KV07XHJcbiAgICAgIGlmIChpbmhlcml0ZWQpIHByb21pc2VzLnB1c2goaW5oZXJpdGVkKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJlc29sdmVWaWV3cygpIHtcclxuICAgICAgICB2YXIgdmlld3NQcm9taXNlcyA9IFtdO1xyXG5cclxuICAgICAgICAvLyBSZXNvbHZlIHRlbXBsYXRlIGFuZCBkZXBlbmRlbmNpZXMgZm9yIGFsbCB2aWV3cy5cclxuICAgICAgICBmb3JFYWNoKHN0YXRlLnZpZXdzLCBmdW5jdGlvbiAodmlldywgbmFtZSkge1xyXG4gICAgICAgICAgdmFyIGluamVjdGFibGVzID0gKHZpZXcucmVzb2x2ZSAmJiB2aWV3LnJlc29sdmUgIT09IHN0YXRlLnJlc29sdmUgPyB2aWV3LnJlc29sdmUgOiB7fSk7XHJcbiAgICAgICAgICBpbmplY3RhYmxlcy4kdGVtcGxhdGUgPSBbIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICR2aWV3LmxvYWQobmFtZSwgeyB2aWV3OiB2aWV3LCBsb2NhbHM6IGRzdC5nbG9iYWxzLCBwYXJhbXM6ICRzdGF0ZVBhcmFtcywgbm90aWZ5OiBvcHRpb25zLm5vdGlmeSB9KSB8fCAnJztcclxuICAgICAgICAgIH1dO1xyXG5cclxuICAgICAgICAgIHZpZXdzUHJvbWlzZXMucHVzaCgkcmVzb2x2ZS5yZXNvbHZlKGluamVjdGFibGVzLCBkc3QuZ2xvYmFscywgZHN0LnJlc29sdmUsIHN0YXRlKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgLy8gUmVmZXJlbmNlcyB0byB0aGUgY29udHJvbGxlciAob25seSBpbnN0YW50aWF0ZWQgYXQgbGluayB0aW1lKVxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2aWV3LmNvbnRyb2xsZXJQcm92aWRlcikgfHwgaXNBcnJheSh2aWV3LmNvbnRyb2xsZXJQcm92aWRlcikpIHtcclxuICAgICAgICAgICAgICB2YXIgaW5qZWN0TG9jYWxzID0gYW5ndWxhci5leHRlbmQoe30sIGluamVjdGFibGVzLCBkc3QuZ2xvYmFscyk7XHJcbiAgICAgICAgICAgICAgcmVzdWx0LiQkY29udHJvbGxlciA9ICRpbmplY3Rvci5pbnZva2Uodmlldy5jb250cm9sbGVyUHJvdmlkZXIsIG51bGwsIGluamVjdExvY2Fscyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVzdWx0LiQkY29udHJvbGxlciA9IHZpZXcuY29udHJvbGxlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBQcm92aWRlIGFjY2VzcyB0byB0aGUgc3RhdGUgaXRzZWxmIGZvciBpbnRlcm5hbCB1c2VcclxuICAgICAgICAgICAgcmVzdWx0LiQkc3RhdGUgPSBzdGF0ZTtcclxuICAgICAgICAgICAgcmVzdWx0LiQkY29udHJvbGxlckFzID0gdmlldy5jb250cm9sbGVyQXM7XHJcbiAgICAgICAgICAgIGRzdFtuYW1lXSA9IHJlc3VsdDtcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuICRxLmFsbCh2aWV3c1Byb21pc2VzKS50aGVuKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICByZXR1cm4gZHN0Lmdsb2JhbHM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIGFsbCB0aGUgcHJvbWlzZXMgYW5kIHRoZW4gcmV0dXJuIHRoZSBhY3RpdmF0aW9uIG9iamVjdFxyXG4gICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmVWaWV3cykudGhlbihmdW5jdGlvbiAodmFsdWVzKSB7XHJcbiAgICAgICAgcmV0dXJuIGRzdDtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICRzdGF0ZTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNob3VsZFNraXBSZWxvYWQodG8sIHRvUGFyYW1zLCBmcm9tLCBmcm9tUGFyYW1zLCBsb2NhbHMsIG9wdGlvbnMpIHtcclxuICAgIC8vIFJldHVybiB0cnVlIGlmIHRoZXJlIGFyZSBubyBkaWZmZXJlbmNlcyBpbiBub24tc2VhcmNoIChwYXRoL29iamVjdCkgcGFyYW1zLCBmYWxzZSBpZiB0aGVyZSBhcmUgZGlmZmVyZW5jZXNcclxuICAgIGZ1bmN0aW9uIG5vblNlYXJjaFBhcmFtc0VxdWFsKGZyb21BbmRUb1N0YXRlLCBmcm9tUGFyYW1zLCB0b1BhcmFtcykge1xyXG4gICAgICAvLyBJZGVudGlmeSB3aGV0aGVyIGFsbCB0aGUgcGFyYW1ldGVycyB0aGF0IGRpZmZlciBiZXR3ZWVuIGBmcm9tUGFyYW1zYCBhbmQgYHRvUGFyYW1zYCB3ZXJlIHNlYXJjaCBwYXJhbXMuXHJcbiAgICAgIGZ1bmN0aW9uIG5vdFNlYXJjaFBhcmFtKGtleSkge1xyXG4gICAgICAgIHJldHVybiBmcm9tQW5kVG9TdGF0ZS5wYXJhbXNba2V5XS5sb2NhdGlvbiAhPSBcInNlYXJjaFwiO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBub25RdWVyeVBhcmFtS2V5cyA9IGZyb21BbmRUb1N0YXRlLnBhcmFtcy4kJGtleXMoKS5maWx0ZXIobm90U2VhcmNoUGFyYW0pO1xyXG4gICAgICB2YXIgbm9uUXVlcnlQYXJhbXMgPSBwaWNrLmFwcGx5KHt9LCBbZnJvbUFuZFRvU3RhdGUucGFyYW1zXS5jb25jYXQobm9uUXVlcnlQYXJhbUtleXMpKTtcclxuICAgICAgdmFyIG5vblF1ZXJ5UGFyYW1TZXQgPSBuZXcgJCRVTUZQLlBhcmFtU2V0KG5vblF1ZXJ5UGFyYW1zKTtcclxuICAgICAgcmV0dXJuIG5vblF1ZXJ5UGFyYW1TZXQuJCRlcXVhbHMoZnJvbVBhcmFtcywgdG9QYXJhbXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHJlbG9hZCB3YXMgbm90IGV4cGxpY2l0bHkgcmVxdWVzdGVkXHJcbiAgICAvLyBhbmQgd2UncmUgdHJhbnNpdGlvbmluZyB0byB0aGUgc2FtZSBzdGF0ZSB3ZSdyZSBhbHJlYWR5IGluXHJcbiAgICAvLyBhbmQgICAgdGhlIGxvY2FscyBkaWRuJ3QgY2hhbmdlXHJcbiAgICAvLyAgICAgb3IgdGhleSBjaGFuZ2VkIGluIGEgd2F5IHRoYXQgZG9lc24ndCBtZXJpdCByZWxvYWRpbmdcclxuICAgIC8vICAgICAgICAocmVsb2FkT25QYXJhbXM6ZmFsc2UsIG9yIHJlbG9hZE9uU2VhcmNoLmZhbHNlIGFuZCBvbmx5IHNlYXJjaCBwYXJhbXMgY2hhbmdlZClcclxuICAgIC8vIFRoZW4gcmV0dXJuIHRydWUuXHJcbiAgICBpZiAoIW9wdGlvbnMucmVsb2FkICYmIHRvID09PSBmcm9tICYmXHJcbiAgICAgIChsb2NhbHMgPT09IGZyb20ubG9jYWxzIHx8ICh0by5zZWxmLnJlbG9hZE9uU2VhcmNoID09PSBmYWxzZSAmJiBub25TZWFyY2hQYXJhbXNFcXVhbChmcm9tLCBmcm9tUGFyYW1zLCB0b1BhcmFtcykpKSkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuc3RhdGUnKVxyXG4gIC5mYWN0b3J5KCckc3RhdGVQYXJhbXMnLCBmdW5jdGlvbiAoKSB7IHJldHVybiB7fTsgfSlcclxuICAucHJvdmlkZXIoJyRzdGF0ZScsICRTdGF0ZVByb3ZpZGVyKTtcclxuXHJcblxyXG4kVmlld1Byb3ZpZGVyLiRpbmplY3QgPSBbXTtcclxuZnVuY3Rpb24gJFZpZXdQcm92aWRlcigpIHtcclxuXHJcbiAgdGhpcy4kZ2V0ID0gJGdldDtcclxuICAvKipcclxuICAgKiBAbmdkb2Mgb2JqZWN0XHJcbiAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiR2aWV3XHJcbiAgICpcclxuICAgKiBAcmVxdWlyZXMgdWkucm91dGVyLnV0aWwuJHRlbXBsYXRlRmFjdG9yeVxyXG4gICAqIEByZXF1aXJlcyAkcm9vdFNjb3BlXHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKlxyXG4gICAqL1xyXG4gICRnZXQuJGluamVjdCA9IFsnJHJvb3RTY29wZScsICckdGVtcGxhdGVGYWN0b3J5J107XHJcbiAgZnVuY3Rpb24gJGdldCggICAkcm9vdFNjb3BlLCAgICR0ZW1wbGF0ZUZhY3RvcnkpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC8vICR2aWV3LmxvYWQoJ2Z1bGwudmlld05hbWUnLCB7IHRlbXBsYXRlOiAuLi4sIGNvbnRyb2xsZXI6IC4uLiwgcmVzb2x2ZTogLi4uLCBhc3luYzogZmFsc2UsIHBhcmFtczogLi4uIH0pXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiR2aWV3I2xvYWRcclxuICAgICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kdmlld1xyXG4gICAgICAgKlxyXG4gICAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAgICpcclxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgbmFtZVxyXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBvcHRpb24gb2JqZWN0LlxyXG4gICAgICAgKi9cclxuICAgICAgbG9hZDogZnVuY3Rpb24gbG9hZChuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCwgZGVmYXVsdHMgPSB7XHJcbiAgICAgICAgICB0ZW1wbGF0ZTogbnVsbCwgY29udHJvbGxlcjogbnVsbCwgdmlldzogbnVsbCwgbG9jYWxzOiBudWxsLCBub3RpZnk6IHRydWUsIGFzeW5jOiB0cnVlLCBwYXJhbXM6IHt9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBvcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMudmlldykge1xyXG4gICAgICAgICAgcmVzdWx0ID0gJHRlbXBsYXRlRmFjdG9yeS5mcm9tQ29uZmlnKG9wdGlvbnMudmlldywgb3B0aW9ucy5wYXJhbXMsIG9wdGlvbnMubG9jYWxzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuc3RhdGUnKS5wcm92aWRlcignJHZpZXcnLCAkVmlld1Byb3ZpZGVyKTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2Mgb2JqZWN0XHJcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kdWlWaWV3U2Nyb2xsUHJvdmlkZXJcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIFByb3ZpZGVyIHRoYXQgcmV0dXJucyB0aGUge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kdWlWaWV3U2Nyb2xsfSBzZXJ2aWNlIGZ1bmN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gJFZpZXdTY3JvbGxQcm92aWRlcigpIHtcclxuXHJcbiAgdmFyIHVzZUFuY2hvclNjcm9sbCA9IGZhbHNlO1xyXG5cclxuICAvKipcclxuICAgKiBAbmdkb2MgZnVuY3Rpb25cclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbFByb3ZpZGVyI3VzZUFuY2hvclNjcm9sbFxyXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbFByb3ZpZGVyXHJcbiAgICpcclxuICAgKiBAZGVzY3JpcHRpb25cclxuICAgKiBSZXZlcnRzIGJhY2sgdG8gdXNpbmcgdGhlIGNvcmUgW2AkYW5jaG9yU2Nyb2xsYF0oaHR0cDovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmcuJGFuY2hvclNjcm9sbCkgc2VydmljZSBmb3JcclxuICAgKiBzY3JvbGxpbmcgYmFzZWQgb24gdGhlIHVybCBhbmNob3IuXHJcbiAgICovXHJcbiAgdGhpcy51c2VBbmNob3JTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB1c2VBbmNob3JTY3JvbGwgPSB0cnVlO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuZ2RvYyBvYmplY3RcclxuICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbFxyXG4gICAqXHJcbiAgICogQHJlcXVpcmVzICRhbmNob3JTY3JvbGxcclxuICAgKiBAcmVxdWlyZXMgJHRpbWVvdXRcclxuICAgKlxyXG4gICAqIEBkZXNjcmlwdGlvblxyXG4gICAqIFdoZW4gY2FsbGVkIHdpdGggYSBqcUxpdGUgZWxlbWVudCwgaXQgc2Nyb2xscyB0aGUgZWxlbWVudCBpbnRvIHZpZXcgKGFmdGVyIGFcclxuICAgKiBgJHRpbWVvdXRgIHNvIHRoZSBET00gaGFzIHRpbWUgdG8gcmVmcmVzaCkuXHJcbiAgICpcclxuICAgKiBJZiB5b3UgcHJlZmVyIHRvIHJlbHkgb24gYCRhbmNob3JTY3JvbGxgIHRvIHNjcm9sbCB0aGUgdmlldyB0byB0aGUgYW5jaG9yLFxyXG4gICAqIHRoaXMgY2FuIGJlIGVuYWJsZWQgYnkgY2FsbGluZyB7QGxpbmsgdWkucm91dGVyLnN0YXRlLiR1aVZpZXdTY3JvbGxQcm92aWRlciNtZXRob2RzX3VzZUFuY2hvclNjcm9sbCBgJHVpVmlld1Njcm9sbFByb3ZpZGVyLnVzZUFuY2hvclNjcm9sbCgpYH0uXHJcbiAgICovXHJcbiAgdGhpcy4kZ2V0ID0gWyckYW5jaG9yU2Nyb2xsJywgJyR0aW1lb3V0JywgZnVuY3Rpb24gKCRhbmNob3JTY3JvbGwsICR0aW1lb3V0KSB7XHJcbiAgICBpZiAodXNlQW5jaG9yU2Nyb2xsKSB7XHJcbiAgICAgIHJldHVybiAkYW5jaG9yU2Nyb2xsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiAoJGVsZW1lbnQpIHtcclxuICAgICAgcmV0dXJuICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkZWxlbWVudFswXS5zY3JvbGxJbnRvVmlldygpO1xyXG4gICAgICB9LCAwLCBmYWxzZSk7XHJcbiAgICB9O1xyXG4gIH1dO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnN0YXRlJykucHJvdmlkZXIoJyR1aVZpZXdTY3JvbGwnLCAkVmlld1Njcm9sbFByb3ZpZGVyKTtcclxuXHJcbnZhciBuZ01ham9yVmVyID0gYW5ndWxhci52ZXJzaW9uLm1ham9yO1xyXG52YXIgbmdNaW5vclZlciA9IGFuZ3VsYXIudmVyc2lvbi5taW5vcjtcclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdWkucm91dGVyLnN0YXRlLmRpcmVjdGl2ZTp1aS12aWV3XHJcbiAqXHJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAqIEByZXF1aXJlcyAkY29tcGlsZVxyXG4gKiBAcmVxdWlyZXMgJGNvbnRyb2xsZXJcclxuICogQHJlcXVpcmVzICRpbmplY3RvclxyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiR1aVZpZXdTY3JvbGxcclxuICogQHJlcXVpcmVzICRkb2N1bWVudFxyXG4gKlxyXG4gKiBAcmVzdHJpY3QgRUNBXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBUaGUgdWktdmlldyBkaXJlY3RpdmUgdGVsbHMgJHN0YXRlIHdoZXJlIHRvIHBsYWNlIHlvdXIgdGVtcGxhdGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZz19IG5hbWUgQSB2aWV3IG5hbWUuIFRoZSBuYW1lIHNob3VsZCBiZSB1bmlxdWUgYW1vbmdzdCB0aGUgb3RoZXIgdmlld3MgaW4gdGhlXHJcbiAqIHNhbWUgc3RhdGUuIFlvdSBjYW4gaGF2ZSB2aWV3cyBvZiB0aGUgc2FtZSBuYW1lIHRoYXQgbGl2ZSBpbiBkaWZmZXJlbnQgc3RhdGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZz19IGF1dG9zY3JvbGwgSXQgYWxsb3dzIHlvdSB0byBzZXQgdGhlIHNjcm9sbCBiZWhhdmlvciBvZiB0aGUgYnJvd3NlciB3aW5kb3dcclxuICogd2hlbiBhIHZpZXcgaXMgcG9wdWxhdGVkLiBCeSBkZWZhdWx0LCAkYW5jaG9yU2Nyb2xsIGlzIG92ZXJyaWRkZW4gYnkgdWktcm91dGVyJ3MgY3VzdG9tIHNjcm9sbFxyXG4gKiBzZXJ2aWNlLCB7QGxpbmsgdWkucm91dGVyLnN0YXRlLiR1aVZpZXdTY3JvbGx9LiBUaGlzIGN1c3RvbSBzZXJ2aWNlIGxldCdzIHlvdVxyXG4gKiBzY3JvbGwgdWktdmlldyBlbGVtZW50cyBpbnRvIHZpZXcgd2hlbiB0aGV5IGFyZSBwb3B1bGF0ZWQgZHVyaW5nIGEgc3RhdGUgYWN0aXZhdGlvbi5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmc9fSBub2FuaW1hdGlvbiBJZiB0cnV0aHksIHRoZSBub24tYW5pbWF0ZWQgcmVuZGVyZXIgd2lsbCBiZSBzZWxlY3RlZCAobm8gYW5pbWF0aW9uc1xyXG4gKiB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIHVpLXZpZXcpXHJcbiAqXHJcbiAqICpOb3RlOiBUbyByZXZlcnQgYmFjayB0byBvbGQgW2AkYW5jaG9yU2Nyb2xsYF0oaHR0cDovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmcuJGFuY2hvclNjcm9sbClcclxuICogZnVuY3Rpb25hbGl0eSwgY2FsbCBgJHVpVmlld1Njcm9sbFByb3ZpZGVyLnVzZUFuY2hvclNjcm9sbCgpYC4qXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nPX0gb25sb2FkIEV4cHJlc3Npb24gdG8gZXZhbHVhdGUgd2hlbmV2ZXIgdGhlIHZpZXcgdXBkYXRlcy5cclxuICogXHJcbiAqIEBleGFtcGxlXHJcbiAqIEEgdmlldyBjYW4gYmUgdW5uYW1lZCBvciBuYW1lZC4gXHJcbiAqIDxwcmU+XHJcbiAqIDwhLS0gVW5uYW1lZCAtLT5cclxuICogPGRpdiB1aS12aWV3PjwvZGl2PiBcclxuICogXHJcbiAqIDwhLS0gTmFtZWQgLS0+XHJcbiAqIDxkaXYgdWktdmlldz1cInZpZXdOYW1lXCI+PC9kaXY+XHJcbiAqIDwvcHJlPlxyXG4gKlxyXG4gKiBZb3UgY2FuIG9ubHkgaGF2ZSBvbmUgdW5uYW1lZCB2aWV3IHdpdGhpbiBhbnkgdGVtcGxhdGUgKG9yIHJvb3QgaHRtbCkuIElmIHlvdSBhcmUgb25seSB1c2luZyBhIFxyXG4gKiBzaW5nbGUgdmlldyBhbmQgaXQgaXMgdW5uYW1lZCB0aGVuIHlvdSBjYW4gcG9wdWxhdGUgaXQgbGlrZSBzbzpcclxuICogPHByZT5cclxuICogPGRpdiB1aS12aWV3PjwvZGl2PiBcclxuICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lXCIsIHtcclxuICogICB0ZW1wbGF0ZTogXCI8aDE+SEVMTE8hPC9oMT5cIlxyXG4gKiB9KVxyXG4gKiA8L3ByZT5cclxuICogXHJcbiAqIFRoZSBhYm92ZSBpcyBhIGNvbnZlbmllbnQgc2hvcnRjdXQgZXF1aXZhbGVudCB0byBzcGVjaWZ5aW5nIHlvdXIgdmlldyBleHBsaWNpdGx5IHdpdGggdGhlIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUHJvdmlkZXIjdmlld3MgYHZpZXdzYH1cclxuICogY29uZmlnIHByb3BlcnR5LCBieSBuYW1lLCBpbiB0aGlzIGNhc2UgYW4gZW1wdHkgbmFtZTpcclxuICogPHByZT5cclxuICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lXCIsIHtcclxuICogICB2aWV3czoge1xyXG4gKiAgICAgXCJcIjoge1xyXG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8aDE+SEVMTE8hPC9oMT5cIlxyXG4gKiAgICAgfVxyXG4gKiAgIH0gICAgXHJcbiAqIH0pXHJcbiAqIDwvcHJlPlxyXG4gKiBcclxuICogQnV0IHR5cGljYWxseSB5b3UnbGwgb25seSB1c2UgdGhlIHZpZXdzIHByb3BlcnR5IGlmIHlvdSBuYW1lIHlvdXIgdmlldyBvciBoYXZlIG1vcmUgdGhhbiBvbmUgdmlldyBcclxuICogaW4gdGhlIHNhbWUgdGVtcGxhdGUuIFRoZXJlJ3Mgbm90IHJlYWxseSBhIGNvbXBlbGxpbmcgcmVhc29uIHRvIG5hbWUgYSB2aWV3IGlmIGl0cyB0aGUgb25seSBvbmUsIFxyXG4gKiBidXQgeW91IGNvdWxkIGlmIHlvdSB3YW50ZWQsIGxpa2Ugc286XHJcbiAqIDxwcmU+XHJcbiAqIDxkaXYgdWktdmlldz1cIm1haW5cIj48L2Rpdj5cclxuICogPC9wcmU+IFxyXG4gKiA8cHJlPlxyXG4gKiAkc3RhdGVQcm92aWRlci5zdGF0ZShcImhvbWVcIiwge1xyXG4gKiAgIHZpZXdzOiB7XHJcbiAqICAgICBcIm1haW5cIjoge1xyXG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8aDE+SEVMTE8hPC9oMT5cIlxyXG4gKiAgICAgfVxyXG4gKiAgIH0gICAgXHJcbiAqIH0pXHJcbiAqIDwvcHJlPlxyXG4gKiBcclxuICogUmVhbGx5IHRob3VnaCwgeW91J2xsIHVzZSB2aWV3cyB0byBzZXQgdXAgbXVsdGlwbGUgdmlld3M6XHJcbiAqIDxwcmU+XHJcbiAqIDxkaXYgdWktdmlldz48L2Rpdj5cclxuICogPGRpdiB1aS12aWV3PVwiY2hhcnRcIj48L2Rpdj4gXHJcbiAqIDxkaXYgdWktdmlldz1cImRhdGFcIj48L2Rpdj4gXHJcbiAqIDwvcHJlPlxyXG4gKiBcclxuICogPHByZT5cclxuICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lXCIsIHtcclxuICogICB2aWV3czoge1xyXG4gKiAgICAgXCJcIjoge1xyXG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8aDE+SEVMTE8hPC9oMT5cIlxyXG4gKiAgICAgfSxcclxuICogICAgIFwiY2hhcnRcIjoge1xyXG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8Y2hhcnRfdGhpbmcvPlwiXHJcbiAqICAgICB9LFxyXG4gKiAgICAgXCJkYXRhXCI6IHtcclxuICogICAgICAgdGVtcGxhdGU6IFwiPGRhdGFfdGhpbmcvPlwiXHJcbiAqICAgICB9XHJcbiAqICAgfSAgICBcclxuICogfSlcclxuICogPC9wcmU+XHJcbiAqXHJcbiAqIEV4YW1wbGVzIGZvciBgYXV0b3Njcm9sbGA6XHJcbiAqXHJcbiAqIDxwcmU+XHJcbiAqIDwhLS0gSWYgYXV0b3Njcm9sbCBwcmVzZW50IHdpdGggbm8gZXhwcmVzc2lvbixcclxuICogICAgICB0aGVuIHNjcm9sbCB1aS12aWV3IGludG8gdmlldyAtLT5cclxuICogPHVpLXZpZXcgYXV0b3Njcm9sbC8+XHJcbiAqXHJcbiAqIDwhLS0gSWYgYXV0b3Njcm9sbCBwcmVzZW50IHdpdGggdmFsaWQgZXhwcmVzc2lvbixcclxuICogICAgICB0aGVuIHNjcm9sbCB1aS12aWV3IGludG8gdmlldyBpZiBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnVlIC0tPlxyXG4gKiA8dWktdmlldyBhdXRvc2Nyb2xsPSd0cnVlJy8+XHJcbiAqIDx1aS12aWV3IGF1dG9zY3JvbGw9J2ZhbHNlJy8+XHJcbiAqIDx1aS12aWV3IGF1dG9zY3JvbGw9J3Njb3BlVmFyaWFibGUnLz5cclxuICogPC9wcmU+XHJcbiAqL1xyXG4kVmlld0RpcmVjdGl2ZS4kaW5qZWN0ID0gWyckc3RhdGUnLCAnJGluamVjdG9yJywgJyR1aVZpZXdTY3JvbGwnLCAnJGludGVycG9sYXRlJ107XHJcbmZ1bmN0aW9uICRWaWV3RGlyZWN0aXZlKCAgICRzdGF0ZSwgICAkaW5qZWN0b3IsICAgJHVpVmlld1Njcm9sbCwgICAkaW50ZXJwb2xhdGUpIHtcclxuXHJcbiAgZnVuY3Rpb24gZ2V0U2VydmljZSgpIHtcclxuICAgIHJldHVybiAoJGluamVjdG9yLmhhcykgPyBmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgIHJldHVybiAkaW5qZWN0b3IuaGFzKHNlcnZpY2UpID8gJGluamVjdG9yLmdldChzZXJ2aWNlKSA6IG51bGw7XHJcbiAgICB9IDogZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KHNlcnZpY2UpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB2YXIgc2VydmljZSA9IGdldFNlcnZpY2UoKSxcclxuICAgICAgJGFuaW1hdG9yID0gc2VydmljZSgnJGFuaW1hdG9yJyksXHJcbiAgICAgICRhbmltYXRlID0gc2VydmljZSgnJGFuaW1hdGUnKTtcclxuXHJcbiAgLy8gUmV0dXJucyBhIHNldCBvZiBET00gbWFuaXB1bGF0aW9uIGZ1bmN0aW9ucyBiYXNlZCBvbiB3aGljaCBBbmd1bGFyIHZlcnNpb25cclxuICAvLyBpdCBzaG91bGQgdXNlXHJcbiAgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoYXR0cnMsIHNjb3BlKSB7XHJcbiAgICB2YXIgc3RhdGljcyA9IHtcclxuICAgICAgZW50ZXI6IGZ1bmN0aW9uIChlbGVtZW50LCB0YXJnZXQsIGNiKSB7IHRhcmdldC5hZnRlcihlbGVtZW50KTsgY2IoKTsgfSxcclxuICAgICAgbGVhdmU6IGZ1bmN0aW9uIChlbGVtZW50LCBjYikgeyBlbGVtZW50LnJlbW92ZSgpOyBjYigpOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghIWF0dHJzLm5vYW5pbWF0aW9uKSByZXR1cm4gc3RhdGljcztcclxuXHJcbiAgICBmdW5jdGlvbiBhbmltRW5hYmxlZChlbGVtZW50KSB7XHJcbiAgICAgIGlmIChuZ01ham9yVmVyID09PSAxICYmIG5nTWlub3JWZXIgPj0gNCkgcmV0dXJuICEhJGFuaW1hdGUuZW5hYmxlZChlbGVtZW50KTtcclxuICAgICAgaWYgKG5nTWFqb3JWZXIgPT09IDEgJiYgbmdNaW5vclZlciA+PSAyKSByZXR1cm4gISEkYW5pbWF0ZS5lbmFibGVkKCk7XHJcbiAgICAgIHJldHVybiAoISEkYW5pbWF0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG5nIDEuMitcclxuICAgIGlmICgkYW5pbWF0ZSkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGVudGVyOiBmdW5jdGlvbihlbGVtZW50LCB0YXJnZXQsIGNiKSB7XHJcbiAgICAgICAgICBpZiAoIWFuaW1FbmFibGVkKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIHN0YXRpY3MuZW50ZXIoZWxlbWVudCwgdGFyZ2V0LCBjYik7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGFuZ3VsYXIudmVyc2lvbi5taW5vciA+IDIpIHtcclxuICAgICAgICAgICAgJGFuaW1hdGUuZW50ZXIoZWxlbWVudCwgbnVsbCwgdGFyZ2V0KS50aGVuKGNiKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRhbmltYXRlLmVudGVyKGVsZW1lbnQsIG51bGwsIHRhcmdldCwgY2IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbGVhdmU6IGZ1bmN0aW9uKGVsZW1lbnQsIGNiKSB7XHJcbiAgICAgICAgICBpZiAoIWFuaW1FbmFibGVkKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIHN0YXRpY3MubGVhdmUoZWxlbWVudCwgY2IpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLnZlcnNpb24ubWlub3IgPiAyKSB7XHJcbiAgICAgICAgICAgICRhbmltYXRlLmxlYXZlKGVsZW1lbnQpLnRoZW4oY2IpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGFuaW1hdGUubGVhdmUoZWxlbWVudCwgY2IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBuZyAxLjEuNVxyXG4gICAgaWYgKCRhbmltYXRvcikge1xyXG4gICAgICB2YXIgYW5pbWF0ZSA9ICRhbmltYXRvciAmJiAkYW5pbWF0b3Ioc2NvcGUsIGF0dHJzKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZW50ZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIHRhcmdldCwgY2IpIHthbmltYXRlLmVudGVyKGVsZW1lbnQsIG51bGwsIHRhcmdldCk7IGNiKCk7IH0sXHJcbiAgICAgICAgbGVhdmU6IGZ1bmN0aW9uKGVsZW1lbnQsIGNiKSB7IGFuaW1hdGUubGVhdmUoZWxlbWVudCk7IGNiKCk7IH1cclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RhdGljcztcclxuICB9XHJcblxyXG4gIHZhciBkaXJlY3RpdmUgPSB7XHJcbiAgICByZXN0cmljdDogJ0VDQScsXHJcbiAgICB0ZXJtaW5hbDogdHJ1ZSxcclxuICAgIHByaW9yaXR5OiA0MDAsXHJcbiAgICB0cmFuc2NsdWRlOiAnZWxlbWVudCcsXHJcbiAgICBjb21waWxlOiBmdW5jdGlvbiAodEVsZW1lbnQsIHRBdHRycywgJHRyYW5zY2x1ZGUpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzY29wZSwgJGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgdmFyIHByZXZpb3VzRWwsIGN1cnJlbnRFbCwgY3VycmVudFNjb3BlLCBsYXRlc3RMb2NhbHMsXHJcbiAgICAgICAgICAgIG9ubG9hZEV4cCAgICAgPSBhdHRycy5vbmxvYWQgfHwgJycsXHJcbiAgICAgICAgICAgIGF1dG9TY3JvbGxFeHAgPSBhdHRycy5hdXRvc2Nyb2xsLFxyXG4gICAgICAgICAgICByZW5kZXJlciAgICAgID0gZ2V0UmVuZGVyZXIoYXR0cnMsIHNjb3BlKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICB1cGRhdGVWaWV3KGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdXBkYXRlVmlldyh0cnVlKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cExhc3RWaWV3KCkge1xyXG4gICAgICAgICAgdmFyIF9wcmV2aW91c0VsID0gcHJldmlvdXNFbDtcclxuICAgICAgICAgIHZhciBfY3VycmVudFNjb3BlID0gY3VycmVudFNjb3BlO1xyXG5cclxuICAgICAgICAgIGlmIChfY3VycmVudFNjb3BlKSB7XHJcbiAgICAgICAgICAgIF9jdXJyZW50U2NvcGUuX3dpbGxCZURlc3Ryb3llZCA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZnVuY3Rpb24gY2xlYW5PbGQoKSB7XHJcbiAgICAgICAgICAgIGlmIChfcHJldmlvdXNFbCkge1xyXG4gICAgICAgICAgICAgIF9wcmV2aW91c0VsLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoX2N1cnJlbnRTY29wZSkge1xyXG4gICAgICAgICAgICAgIF9jdXJyZW50U2NvcGUuJGRlc3Ryb3koKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChjdXJyZW50RWwpIHtcclxuICAgICAgICAgICAgcmVuZGVyZXIubGVhdmUoY3VycmVudEVsLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICBjbGVhbk9sZCgpO1xyXG4gICAgICAgICAgICAgIHByZXZpb3VzRWwgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHByZXZpb3VzRWwgPSBjdXJyZW50RWw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbGVhbk9sZCgpO1xyXG4gICAgICAgICAgICBwcmV2aW91c0VsID0gbnVsbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjdXJyZW50RWwgPSBudWxsO1xyXG4gICAgICAgICAgY3VycmVudFNjb3BlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVZpZXcoZmlyc3RUaW1lKSB7XHJcbiAgICAgICAgICB2YXIgbmV3U2NvcGUsXHJcbiAgICAgICAgICAgICAgbmFtZSAgICAgICAgICAgID0gZ2V0VWlWaWV3TmFtZShzY29wZSwgYXR0cnMsICRlbGVtZW50LCAkaW50ZXJwb2xhdGUpLFxyXG4gICAgICAgICAgICAgIHByZXZpb3VzTG9jYWxzICA9IG5hbWUgJiYgJHN0YXRlLiRjdXJyZW50ICYmICRzdGF0ZS4kY3VycmVudC5sb2NhbHNbbmFtZV07XHJcblxyXG4gICAgICAgICAgaWYgKCFmaXJzdFRpbWUgJiYgcHJldmlvdXNMb2NhbHMgPT09IGxhdGVzdExvY2FscyB8fCBzY29wZS5fd2lsbEJlRGVzdHJveWVkKSByZXR1cm47IC8vIG5vdGhpbmcgdG8gZG9cclxuICAgICAgICAgIG5ld1Njb3BlID0gc2NvcGUuJG5ldygpO1xyXG4gICAgICAgICAgbGF0ZXN0TG9jYWxzID0gJHN0YXRlLiRjdXJyZW50LmxvY2Fsc1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAvKipcclxuICAgICAgICAgICAqIEBuZ2RvYyBldmVudFxyXG4gICAgICAgICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLmRpcmVjdGl2ZTp1aS12aWV3IyR2aWV3Q29udGVudExvYWRpbmdcclxuICAgICAgICAgICAqIEBldmVudE9mIHVpLnJvdXRlci5zdGF0ZS5kaXJlY3RpdmU6dWktdmlld1xyXG4gICAgICAgICAgICogQGV2ZW50VHlwZSBlbWl0cyBvbiB1aS12aWV3IGRpcmVjdGl2ZSBzY29wZVxyXG4gICAgICAgICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgICAgICAgKlxyXG4gICAgICAgICAgICogRmlyZWQgb25jZSB0aGUgdmlldyAqKmJlZ2lucyBsb2FkaW5nKiosICpiZWZvcmUqIHRoZSBET00gaXMgcmVuZGVyZWQuXHJcbiAgICAgICAgICAgKlxyXG4gICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IEV2ZW50IG9iamVjdC5cclxuICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2aWV3TmFtZSBOYW1lIG9mIHRoZSB2aWV3LlxyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICBuZXdTY29wZS4kZW1pdCgnJHZpZXdDb250ZW50TG9hZGluZycsIG5hbWUpO1xyXG5cclxuICAgICAgICAgIHZhciBjbG9uZSA9ICR0cmFuc2NsdWRlKG5ld1Njb3BlLCBmdW5jdGlvbihjbG9uZSkge1xyXG4gICAgICAgICAgICByZW5kZXJlci5lbnRlcihjbG9uZSwgJGVsZW1lbnQsIGZ1bmN0aW9uIG9uVWlWaWV3RW50ZXIoKSB7XHJcbiAgICAgICAgICAgICAgaWYoY3VycmVudFNjb3BlKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50U2NvcGUuJGVtaXQoJyR2aWV3Q29udGVudEFuaW1hdGlvbkVuZGVkJyk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoYXV0b1Njcm9sbEV4cCkgJiYgIWF1dG9TY3JvbGxFeHAgfHwgc2NvcGUuJGV2YWwoYXV0b1Njcm9sbEV4cCkpIHtcclxuICAgICAgICAgICAgICAgICR1aVZpZXdTY3JvbGwoY2xvbmUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNsZWFudXBMYXN0VmlldygpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgY3VycmVudEVsID0gY2xvbmU7XHJcbiAgICAgICAgICBjdXJyZW50U2NvcGUgPSBuZXdTY29wZTtcclxuICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICogQG5nZG9jIGV2ZW50XHJcbiAgICAgICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuZGlyZWN0aXZlOnVpLXZpZXcjJHZpZXdDb250ZW50TG9hZGVkXHJcbiAgICAgICAgICAgKiBAZXZlbnRPZiB1aS5yb3V0ZXIuc3RhdGUuZGlyZWN0aXZlOnVpLXZpZXdcclxuICAgICAgICAgICAqIEBldmVudFR5cGUgZW1pdHMgb24gdWktdmlldyBkaXJlY3RpdmUgc2NvcGVcclxuICAgICAgICAgICAqIEBkZXNjcmlwdGlvblxyXG4gICAgICAgICAgICogRmlyZWQgb25jZSB0aGUgdmlldyBpcyAqKmxvYWRlZCoqLCAqYWZ0ZXIqIHRoZSBET00gaXMgcmVuZGVyZWQuXHJcbiAgICAgICAgICAgKlxyXG4gICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IEV2ZW50IG9iamVjdC5cclxuICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2aWV3TmFtZSBOYW1lIG9mIHRoZSB2aWV3LlxyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICBjdXJyZW50U2NvcGUuJGVtaXQoJyR2aWV3Q29udGVudExvYWRlZCcsIG5hbWUpO1xyXG4gICAgICAgICAgY3VycmVudFNjb3BlLiRldmFsKG9ubG9hZEV4cCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBkaXJlY3RpdmU7XHJcbn1cclxuXHJcbiRWaWV3RGlyZWN0aXZlRmlsbC4kaW5qZWN0ID0gWyckY29tcGlsZScsICckY29udHJvbGxlcicsICckc3RhdGUnLCAnJGludGVycG9sYXRlJ107XHJcbmZ1bmN0aW9uICRWaWV3RGlyZWN0aXZlRmlsbCAoICAkY29tcGlsZSwgICAkY29udHJvbGxlciwgICAkc3RhdGUsICAgJGludGVycG9sYXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnRUNBJyxcclxuICAgIHByaW9yaXR5OiAtNDAwLFxyXG4gICAgY29tcGlsZTogZnVuY3Rpb24gKHRFbGVtZW50KSB7XHJcbiAgICAgIHZhciBpbml0aWFsID0gdEVsZW1lbnQuaHRtbCgpO1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHNjb3BlLCAkZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICB2YXIgY3VycmVudCA9ICRzdGF0ZS4kY3VycmVudCxcclxuICAgICAgICAgICAgbmFtZSA9IGdldFVpVmlld05hbWUoc2NvcGUsIGF0dHJzLCAkZWxlbWVudCwgJGludGVycG9sYXRlKSxcclxuICAgICAgICAgICAgbG9jYWxzICA9IGN1cnJlbnQgJiYgY3VycmVudC5sb2NhbHNbbmFtZV07XHJcblxyXG4gICAgICAgIGlmICghIGxvY2Fscykge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGVsZW1lbnQuZGF0YSgnJHVpVmlldycsIHsgbmFtZTogbmFtZSwgc3RhdGU6IGxvY2Fscy4kJHN0YXRlIH0pO1xyXG4gICAgICAgICRlbGVtZW50Lmh0bWwobG9jYWxzLiR0ZW1wbGF0ZSA/IGxvY2Fscy4kdGVtcGxhdGUgOiBpbml0aWFsKTtcclxuXHJcbiAgICAgICAgdmFyIGxpbmsgPSAkY29tcGlsZSgkZWxlbWVudC5jb250ZW50cygpKTtcclxuXHJcbiAgICAgICAgaWYgKGxvY2Fscy4kJGNvbnRyb2xsZXIpIHtcclxuICAgICAgICAgIGxvY2Fscy4kc2NvcGUgPSBzY29wZTtcclxuICAgICAgICAgIGxvY2Fscy4kZWxlbWVudCA9ICRlbGVtZW50O1xyXG4gICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSAkY29udHJvbGxlcihsb2NhbHMuJCRjb250cm9sbGVyLCBsb2NhbHMpO1xyXG4gICAgICAgICAgaWYgKGxvY2Fscy4kJGNvbnRyb2xsZXJBcykge1xyXG4gICAgICAgICAgICBzY29wZVtsb2NhbHMuJCRjb250cm9sbGVyQXNdID0gY29udHJvbGxlcjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICRlbGVtZW50LmRhdGEoJyRuZ0NvbnRyb2xsZXJDb250cm9sbGVyJywgY29udHJvbGxlcik7XHJcbiAgICAgICAgICAkZWxlbWVudC5jaGlsZHJlbigpLmRhdGEoJyRuZ0NvbnRyb2xsZXJDb250cm9sbGVyJywgY29udHJvbGxlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaW5rKHNjb3BlKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogU2hhcmVkIHVpLXZpZXcgY29kZSBmb3IgYm90aCBkaXJlY3RpdmVzOlxyXG4gKiBHaXZlbiBzY29wZSwgZWxlbWVudCwgYW5kIGl0cyBhdHRyaWJ1dGVzLCByZXR1cm4gdGhlIHZpZXcncyBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRVaVZpZXdOYW1lKHNjb3BlLCBhdHRycywgZWxlbWVudCwgJGludGVycG9sYXRlKSB7XHJcbiAgdmFyIG5hbWUgPSAkaW50ZXJwb2xhdGUoYXR0cnMudWlWaWV3IHx8IGF0dHJzLm5hbWUgfHwgJycpKHNjb3BlKTtcclxuICB2YXIgaW5oZXJpdGVkID0gZWxlbWVudC5pbmhlcml0ZWREYXRhKCckdWlWaWV3Jyk7XHJcbiAgcmV0dXJuIG5hbWUuaW5kZXhPZignQCcpID49IDAgPyAgbmFtZSA6ICAobmFtZSArICdAJyArIChpbmhlcml0ZWQgPyBpbmhlcml0ZWQuc3RhdGUubmFtZSA6ICcnKSk7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuc3RhdGUnKS5kaXJlY3RpdmUoJ3VpVmlldycsICRWaWV3RGlyZWN0aXZlKTtcclxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScpLmRpcmVjdGl2ZSgndWlWaWV3JywgJFZpZXdEaXJlY3RpdmVGaWxsKTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlU3RhdGVSZWYocmVmLCBjdXJyZW50KSB7XHJcbiAgdmFyIHByZXBhcnNlZCA9IHJlZi5tYXRjaCgvXlxccyooe1tefV0qfSlcXHMqJC8pLCBwYXJzZWQ7XHJcbiAgaWYgKHByZXBhcnNlZCkgcmVmID0gY3VycmVudCArICcoJyArIHByZXBhcnNlZFsxXSArICcpJztcclxuICBwYXJzZWQgPSByZWYucmVwbGFjZSgvXFxuL2csIFwiIFwiKS5tYXRjaCgvXihbXihdKz8pXFxzKihcXCgoLiopXFwpKT8kLyk7XHJcbiAgaWYgKCFwYXJzZWQgfHwgcGFyc2VkLmxlbmd0aCAhPT0gNCkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzdGF0ZSByZWYgJ1wiICsgcmVmICsgXCInXCIpO1xyXG4gIHJldHVybiB7IHN0YXRlOiBwYXJzZWRbMV0sIHBhcmFtRXhwcjogcGFyc2VkWzNdIHx8IG51bGwgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhdGVDb250ZXh0KGVsKSB7XHJcbiAgdmFyIHN0YXRlRGF0YSA9IGVsLnBhcmVudCgpLmluaGVyaXRlZERhdGEoJyR1aVZpZXcnKTtcclxuXHJcbiAgaWYgKHN0YXRlRGF0YSAmJiBzdGF0ZURhdGEuc3RhdGUgJiYgc3RhdGVEYXRhLnN0YXRlLm5hbWUpIHtcclxuICAgIHJldHVybiBzdGF0ZURhdGEuc3RhdGU7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRUeXBlSW5mbyhlbCkge1xyXG4gIC8vIFNWR0FFbGVtZW50IGRvZXMgbm90IHVzZSB0aGUgaHJlZiBhdHRyaWJ1dGUsIGJ1dCByYXRoZXIgdGhlICd4bGlua0hyZWYnIGF0dHJpYnV0ZS5cclxuICB2YXIgaXNTdmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZWwucHJvcCgnaHJlZicpKSA9PT0gJ1tvYmplY3QgU1ZHQW5pbWF0ZWRTdHJpbmddJztcclxuICB2YXIgaXNGb3JtID0gZWxbMF0ubm9kZU5hbWUgPT09IFwiRk9STVwiO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYXR0cjogaXNGb3JtID8gXCJhY3Rpb25cIiA6IChpc1N2ZyA/ICd4bGluazpocmVmJyA6ICdocmVmJyksXHJcbiAgICBpc0FuY2hvcjogZWwucHJvcChcInRhZ05hbWVcIikudG9VcHBlckNhc2UoKSA9PT0gXCJBXCIsXHJcbiAgICBjbGlja2FibGU6ICFpc0Zvcm1cclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGlja0hvb2soZWwsICRzdGF0ZSwgJHRpbWVvdXQsIHR5cGUsIGN1cnJlbnQpIHtcclxuICByZXR1cm4gZnVuY3Rpb24oZSkge1xyXG4gICAgdmFyIGJ1dHRvbiA9IGUud2hpY2ggfHwgZS5idXR0b24sIHRhcmdldCA9IGN1cnJlbnQoKTtcclxuXHJcbiAgICBpZiAoIShidXR0b24gPiAxIHx8IGUuY3RybEtleSB8fCBlLm1ldGFLZXkgfHwgZS5zaGlmdEtleSB8fCBlbC5hdHRyKCd0YXJnZXQnKSkpIHtcclxuICAgICAgLy8gSEFDSzogVGhpcyBpcyB0byBhbGxvdyBuZy1jbGlja3MgdG8gYmUgcHJvY2Vzc2VkIGJlZm9yZSB0aGUgdHJhbnNpdGlvbiBpcyBpbml0aWF0ZWQ6XHJcbiAgICAgIHZhciB0cmFuc2l0aW9uID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJHN0YXRlLmdvKHRhcmdldC5zdGF0ZSwgdGFyZ2V0LnBhcmFtcywgdGFyZ2V0Lm9wdGlvbnMpO1xyXG4gICAgICB9KTtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgLy8gaWYgdGhlIHN0YXRlIGhhcyBubyBVUkwsIGlnbm9yZSBvbmUgcHJldmVudERlZmF1bHQgZnJvbSB0aGUgPGE+IGRpcmVjdGl2ZS5cclxuICAgICAgdmFyIGlnbm9yZVByZXZlbnREZWZhdWx0Q291bnQgPSB0eXBlLmlzQW5jaG9yICYmICF0YXJnZXQuaHJlZiA/IDE6IDA7XHJcblxyXG4gICAgICBlLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGlnbm9yZVByZXZlbnREZWZhdWx0Q291bnQtLSA8PSAwKSAkdGltZW91dC5jYW5jZWwodHJhbnNpdGlvbik7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVmYXVsdE9wdHMoZWwsICRzdGF0ZSkge1xyXG4gIHJldHVybiB7IHJlbGF0aXZlOiBzdGF0ZUNvbnRleHQoZWwpIHx8ICRzdGF0ZS4kY3VycmVudCwgaW5oZXJpdDogdHJ1ZSB9O1xyXG59XHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuZGlyZWN0aXZlOnVpLXNyZWZcclxuICpcclxuICogQHJlcXVpcmVzIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICogQHJlcXVpcmVzICR0aW1lb3V0XHJcbiAqXHJcbiAqIEByZXN0cmljdCBBXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IGJpbmRzIGEgbGluayAoYDxhPmAgdGFnKSB0byBhIHN0YXRlLiBJZiB0aGUgc3RhdGUgaGFzIGFuIGFzc29jaWF0ZWRcclxuICogVVJMLCB0aGUgZGlyZWN0aXZlIHdpbGwgYXV0b21hdGljYWxseSBnZW5lcmF0ZSAmIHVwZGF0ZSB0aGUgYGhyZWZgIGF0dHJpYnV0ZSB2aWFcclxuICogdGhlIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI21ldGhvZHNfaHJlZiAkc3RhdGUuaHJlZigpfSBtZXRob2QuIENsaWNraW5nXHJcbiAqIHRoZSBsaW5rIHdpbGwgdHJpZ2dlciBhIHN0YXRlIHRyYW5zaXRpb24gd2l0aCBvcHRpb25hbCBwYXJhbWV0ZXJzLlxyXG4gKlxyXG4gKiBBbHNvIG1pZGRsZS1jbGlja2luZywgcmlnaHQtY2xpY2tpbmcsIGFuZCBjdHJsLWNsaWNraW5nIG9uIHRoZSBsaW5rIHdpbGwgYmVcclxuICogaGFuZGxlZCBuYXRpdmVseSBieSB0aGUgYnJvd3Nlci5cclxuICpcclxuICogWW91IGNhbiBhbHNvIHVzZSByZWxhdGl2ZSBzdGF0ZSBwYXRocyB3aXRoaW4gdWktc3JlZiwganVzdCBsaWtlIHRoZSByZWxhdGl2ZVxyXG4gKiBwYXRocyBwYXNzZWQgdG8gYCRzdGF0ZS5nbygpYC4gWW91IGp1c3QgbmVlZCB0byBiZSBhd2FyZSB0aGF0IHRoZSBwYXRoIGlzIHJlbGF0aXZlXHJcbiAqIHRvIHRoZSBzdGF0ZSB0aGF0IHRoZSBsaW5rIGxpdmVzIGluLCBpbiBvdGhlciB3b3JkcyB0aGUgc3RhdGUgdGhhdCBsb2FkZWQgdGhlXHJcbiAqIHRlbXBsYXRlIGNvbnRhaW5pbmcgdGhlIGxpbmsuXHJcbiAqXHJcbiAqIFlvdSBjYW4gc3BlY2lmeSBvcHRpb25zIHRvIHBhc3MgdG8ge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjZ28gJHN0YXRlLmdvKCl9XHJcbiAqIHVzaW5nIHRoZSBgdWktc3JlZi1vcHRzYCBhdHRyaWJ1dGUuIE9wdGlvbnMgYXJlIHJlc3RyaWN0ZWQgdG8gYGxvY2F0aW9uYCwgYGluaGVyaXRgLFxyXG4gKiBhbmQgYHJlbG9hZGAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIEhlcmUncyBhbiBleGFtcGxlIG9mIGhvdyB5b3UnZCB1c2UgdWktc3JlZiBhbmQgaG93IGl0IHdvdWxkIGNvbXBpbGUuIElmIHlvdSBoYXZlIHRoZVxyXG4gKiBmb2xsb3dpbmcgdGVtcGxhdGU6XHJcbiAqIDxwcmU+XHJcbiAqIDxhIHVpLXNyZWY9XCJob21lXCI+SG9tZTwvYT4gfCA8YSB1aS1zcmVmPVwiYWJvdXRcIj5BYm91dDwvYT4gfCA8YSB1aS1zcmVmPVwie3BhZ2U6IDJ9XCI+TmV4dCBwYWdlPC9hPlxyXG4gKlxyXG4gKiA8dWw+XHJcbiAqICAgICA8bGkgbmctcmVwZWF0PVwiY29udGFjdCBpbiBjb250YWN0c1wiPlxyXG4gKiAgICAgICAgIDxhIHVpLXNyZWY9XCJjb250YWN0cy5kZXRhaWwoeyBpZDogY29udGFjdC5pZCB9KVwiPnt7IGNvbnRhY3QubmFtZSB9fTwvYT5cclxuICogICAgIDwvbGk+XHJcbiAqIDwvdWw+XHJcbiAqIDwvcHJlPlxyXG4gKlxyXG4gKiBUaGVuIHRoZSBjb21waWxlZCBodG1sIHdvdWxkIGJlIChhc3N1bWluZyBIdG1sNU1vZGUgaXMgb2ZmIGFuZCBjdXJyZW50IHN0YXRlIGlzIGNvbnRhY3RzKTpcclxuICogPHByZT5cclxuICogPGEgaHJlZj1cIiMvaG9tZVwiIHVpLXNyZWY9XCJob21lXCI+SG9tZTwvYT4gfCA8YSBocmVmPVwiIy9hYm91dFwiIHVpLXNyZWY9XCJhYm91dFwiPkFib3V0PC9hPiB8IDxhIGhyZWY9XCIjL2NvbnRhY3RzP3BhZ2U9MlwiIHVpLXNyZWY9XCJ7cGFnZTogMn1cIj5OZXh0IHBhZ2U8L2E+XHJcbiAqXHJcbiAqIDx1bD5cclxuICogICAgIDxsaSBuZy1yZXBlYXQ9XCJjb250YWN0IGluIGNvbnRhY3RzXCI+XHJcbiAqICAgICAgICAgPGEgaHJlZj1cIiMvY29udGFjdHMvMVwiIHVpLXNyZWY9XCJjb250YWN0cy5kZXRhaWwoeyBpZDogY29udGFjdC5pZCB9KVwiPkpvZTwvYT5cclxuICogICAgIDwvbGk+XHJcbiAqICAgICA8bGkgbmctcmVwZWF0PVwiY29udGFjdCBpbiBjb250YWN0c1wiPlxyXG4gKiAgICAgICAgIDxhIGhyZWY9XCIjL2NvbnRhY3RzLzJcIiB1aS1zcmVmPVwiY29udGFjdHMuZGV0YWlsKHsgaWQ6IGNvbnRhY3QuaWQgfSlcIj5BbGljZTwvYT5cclxuICogICAgIDwvbGk+XHJcbiAqICAgICA8bGkgbmctcmVwZWF0PVwiY29udGFjdCBpbiBjb250YWN0c1wiPlxyXG4gKiAgICAgICAgIDxhIGhyZWY9XCIjL2NvbnRhY3RzLzNcIiB1aS1zcmVmPVwiY29udGFjdHMuZGV0YWlsKHsgaWQ6IGNvbnRhY3QuaWQgfSlcIj5Cb2I8L2E+XHJcbiAqICAgICA8L2xpPlxyXG4gKiA8L3VsPlxyXG4gKlxyXG4gKiA8YSB1aS1zcmVmPVwiaG9tZVwiIHVpLXNyZWYtb3B0cz1cIntyZWxvYWQ6IHRydWV9XCI+SG9tZTwvYT5cclxuICogPC9wcmU+XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1aS1zcmVmICdzdGF0ZU5hbWUnIGNhbiBiZSBhbnkgdmFsaWQgYWJzb2x1dGUgb3IgcmVsYXRpdmUgc3RhdGVcclxuICogQHBhcmFtIHtPYmplY3R9IHVpLXNyZWYtb3B0cyBvcHRpb25zIHRvIHBhc3MgdG8ge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjZ28gJHN0YXRlLmdvKCl9XHJcbiAqL1xyXG4kU3RhdGVSZWZEaXJlY3RpdmUuJGluamVjdCA9IFsnJHN0YXRlJywgJyR0aW1lb3V0J107XHJcbmZ1bmN0aW9uICRTdGF0ZVJlZkRpcmVjdGl2ZSgkc3RhdGUsICR0aW1lb3V0KSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICByZXF1aXJlOiBbJz9edWlTcmVmQWN0aXZlJywgJz9edWlTcmVmQWN0aXZlRXEnXSxcclxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgdWlTcmVmQWN0aXZlKSB7XHJcbiAgICAgIHZhciByZWYgICAgPSBwYXJzZVN0YXRlUmVmKGF0dHJzLnVpU3JlZiwgJHN0YXRlLmN1cnJlbnQubmFtZSk7XHJcbiAgICAgIHZhciBkZWYgICAgPSB7IHN0YXRlOiByZWYuc3RhdGUsIGhyZWY6IG51bGwsIHBhcmFtczogbnVsbCB9O1xyXG4gICAgICB2YXIgdHlwZSAgID0gZ2V0VHlwZUluZm8oZWxlbWVudCk7XHJcbiAgICAgIHZhciBhY3RpdmUgPSB1aVNyZWZBY3RpdmVbMV0gfHwgdWlTcmVmQWN0aXZlWzBdO1xyXG5cclxuICAgICAgZGVmLm9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdE9wdHMoZWxlbWVudCwgJHN0YXRlKSwgYXR0cnMudWlTcmVmT3B0cyA/IHNjb3BlLiRldmFsKGF0dHJzLnVpU3JlZk9wdHMpIDoge30pO1xyXG5cclxuICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmICh2YWwpIGRlZi5wYXJhbXMgPSBhbmd1bGFyLmNvcHkodmFsKTtcclxuICAgICAgICBkZWYuaHJlZiA9ICRzdGF0ZS5ocmVmKHJlZi5zdGF0ZSwgZGVmLnBhcmFtcywgZGVmLm9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoYWN0aXZlKSBhY3RpdmUuJCRhZGRTdGF0ZUluZm8ocmVmLnN0YXRlLCBkZWYucGFyYW1zKTtcclxuICAgICAgICBpZiAoZGVmLmhyZWYgIT09IG51bGwpIGF0dHJzLiRzZXQodHlwZS5hdHRyLCBkZWYuaHJlZik7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAocmVmLnBhcmFtRXhwcikge1xyXG4gICAgICAgIHNjb3BlLiR3YXRjaChyZWYucGFyYW1FeHByLCBmdW5jdGlvbih2YWwpIHsgaWYgKHZhbCAhPT0gZGVmLnBhcmFtcykgdXBkYXRlKHZhbCk7IH0sIHRydWUpO1xyXG4gICAgICAgIGRlZi5wYXJhbXMgPSBhbmd1bGFyLmNvcHkoc2NvcGUuJGV2YWwocmVmLnBhcmFtRXhwcikpO1xyXG4gICAgICB9XHJcbiAgICAgIHVwZGF0ZSgpO1xyXG5cclxuICAgICAgaWYgKCF0eXBlLmNsaWNrYWJsZSkgcmV0dXJuO1xyXG4gICAgICBlbGVtZW50LmJpbmQoXCJjbGlja1wiLCBjbGlja0hvb2soZWxlbWVudCwgJHN0YXRlLCAkdGltZW91dCwgdHlwZSwgZnVuY3Rpb24oKSB7IHJldHVybiBkZWY7IH0pKTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuZGlyZWN0aXZlOnVpLXN0YXRlXHJcbiAqXHJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUudWlTcmVmXHJcbiAqXHJcbiAqIEByZXN0cmljdCBBXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBNdWNoIGxpa2UgdWktc3JlZiwgYnV0IHdpbGwgYWNjZXB0IG5hbWVkICRzY29wZSBwcm9wZXJ0aWVzIHRvIGV2YWx1YXRlIGZvciBhIHN0YXRlIGRlZmluaXRpb24sXHJcbiAqIHBhcmFtcyBhbmQgb3ZlcnJpZGUgb3B0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVpLXN0YXRlICdzdGF0ZU5hbWUnIGNhbiBiZSBhbnkgdmFsaWQgYWJzb2x1dGUgb3IgcmVsYXRpdmUgc3RhdGVcclxuICogQHBhcmFtIHtPYmplY3R9IHVpLXN0YXRlLXBhcmFtcyBwYXJhbXMgdG8gcGFzcyB0byB7QGxpbmsgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNocmVmICRzdGF0ZS5ocmVmKCl9XHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB1aS1zdGF0ZS1vcHRzIG9wdGlvbnMgdG8gcGFzcyB0byB7QGxpbmsgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNnbyAkc3RhdGUuZ28oKX1cclxuICovXHJcbiRTdGF0ZVJlZkR5bmFtaWNEaXJlY3RpdmUuJGluamVjdCA9IFsnJHN0YXRlJywgJyR0aW1lb3V0J107XHJcbmZ1bmN0aW9uICRTdGF0ZVJlZkR5bmFtaWNEaXJlY3RpdmUoJHN0YXRlLCAkdGltZW91dCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgcmVxdWlyZTogWyc/XnVpU3JlZkFjdGl2ZScsICc/XnVpU3JlZkFjdGl2ZUVxJ10sXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHVpU3JlZkFjdGl2ZSkge1xyXG4gICAgICB2YXIgdHlwZSAgID0gZ2V0VHlwZUluZm8oZWxlbWVudCk7XHJcbiAgICAgIHZhciBhY3RpdmUgPSB1aVNyZWZBY3RpdmVbMV0gfHwgdWlTcmVmQWN0aXZlWzBdO1xyXG4gICAgICB2YXIgZ3JvdXAgID0gW2F0dHJzLnVpU3RhdGUsIGF0dHJzLnVpU3RhdGVQYXJhbXMgfHwgbnVsbCwgYXR0cnMudWlTdGF0ZU9wdHMgfHwgbnVsbF07XHJcbiAgICAgIHZhciB3YXRjaCAgPSAnWycgKyBncm91cC5tYXAoZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWwgfHwgJ251bGwnOyB9KS5qb2luKCcsICcpICsgJ10nO1xyXG4gICAgICB2YXIgZGVmICAgID0geyBzdGF0ZTogbnVsbCwgcGFyYW1zOiBudWxsLCBvcHRpb25zOiBudWxsLCBocmVmOiBudWxsIH07XHJcblxyXG4gICAgICBmdW5jdGlvbiBydW5TdGF0ZVJlZkxpbmsgKGdyb3VwKSB7XHJcbiAgICAgICAgZGVmLnN0YXRlID0gZ3JvdXBbMF07IGRlZi5wYXJhbXMgPSBncm91cFsxXTsgZGVmLm9wdGlvbnMgPSBncm91cFsyXTtcclxuICAgICAgICBkZWYuaHJlZiA9ICRzdGF0ZS5ocmVmKGRlZi5zdGF0ZSwgZGVmLnBhcmFtcywgZGVmLm9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoYWN0aXZlKSBhY3RpdmUuJCRhZGRTdGF0ZUluZm8oZGVmLnN0YXRlLCBkZWYucGFyYW1zKTtcclxuICAgICAgICBpZiAoZGVmLmhyZWYpIGF0dHJzLiRzZXQodHlwZS5hdHRyLCBkZWYuaHJlZik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNjb3BlLiR3YXRjaCh3YXRjaCwgcnVuU3RhdGVSZWZMaW5rLCB0cnVlKTtcclxuICAgICAgcnVuU3RhdGVSZWZMaW5rKHNjb3BlLiRldmFsKHdhdGNoKSk7XHJcblxyXG4gICAgICBpZiAoIXR5cGUuY2xpY2thYmxlKSByZXR1cm47XHJcbiAgICAgIGVsZW1lbnQuYmluZChcImNsaWNrXCIsIGNsaWNrSG9vayhlbGVtZW50LCAkc3RhdGUsICR0aW1lb3V0LCB0eXBlLCBmdW5jdGlvbigpIHsgcmV0dXJuIGRlZjsgfSkpO1xyXG4gICAgfVxyXG4gIH07XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuZGlyZWN0aXZlOnVpLXNyZWYtYWN0aXZlXHJcbiAqXHJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUGFyYW1zXHJcbiAqIEByZXF1aXJlcyAkaW50ZXJwb2xhdGVcclxuICpcclxuICogQHJlc3RyaWN0IEFcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIEEgZGlyZWN0aXZlIHdvcmtpbmcgYWxvbmdzaWRlIHVpLXNyZWYgdG8gYWRkIGNsYXNzZXMgdG8gYW4gZWxlbWVudCB3aGVuIHRoZVxyXG4gKiByZWxhdGVkIHVpLXNyZWYgZGlyZWN0aXZlJ3Mgc3RhdGUgaXMgYWN0aXZlLCBhbmQgcmVtb3ZpbmcgdGhlbSB3aGVuIGl0IGlzIGluYWN0aXZlLlxyXG4gKiBUaGUgcHJpbWFyeSB1c2UtY2FzZSBpcyB0byBzaW1wbGlmeSB0aGUgc3BlY2lhbCBhcHBlYXJhbmNlIG9mIG5hdmlnYXRpb24gbWVudXNcclxuICogcmVseWluZyBvbiBgdWktc3JlZmAsIGJ5IGhhdmluZyB0aGUgXCJhY3RpdmVcIiBzdGF0ZSdzIG1lbnUgYnV0dG9uIGFwcGVhciBkaWZmZXJlbnQsXHJcbiAqIGRpc3Rpbmd1aXNoaW5nIGl0IGZyb20gdGhlIGluYWN0aXZlIG1lbnUgaXRlbXMuXHJcbiAqXHJcbiAqIHVpLXNyZWYtYWN0aXZlIGNhbiBsaXZlIG9uIHRoZSBzYW1lIGVsZW1lbnQgYXMgdWktc3JlZiBvciBvbiBhIHBhcmVudCBlbGVtZW50LiBUaGUgZmlyc3RcclxuICogdWktc3JlZi1hY3RpdmUgZm91bmQgYXQgdGhlIHNhbWUgbGV2ZWwgb3IgYWJvdmUgdGhlIHVpLXNyZWYgd2lsbCBiZSB1c2VkLlxyXG4gKlxyXG4gKiBXaWxsIGFjdGl2YXRlIHdoZW4gdGhlIHVpLXNyZWYncyB0YXJnZXQgc3RhdGUgb3IgYW55IGNoaWxkIHN0YXRlIGlzIGFjdGl2ZS4gSWYgeW91XHJcbiAqIG5lZWQgdG8gYWN0aXZhdGUgb25seSB3aGVuIHRoZSB1aS1zcmVmIHRhcmdldCBzdGF0ZSBpcyBhY3RpdmUgYW5kICpub3QqIGFueSBvZlxyXG4gKiBpdCdzIGNoaWxkcmVuLCB0aGVuIHlvdSB3aWxsIHVzZVxyXG4gKiB7QGxpbmsgdWkucm91dGVyLnN0YXRlLmRpcmVjdGl2ZTp1aS1zcmVmLWFjdGl2ZS1lcSB1aS1zcmVmLWFjdGl2ZS1lcX1cclxuICpcclxuICogQGV4YW1wbGVcclxuICogR2l2ZW4gdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZTpcclxuICogPHByZT5cclxuICogPHVsPlxyXG4gKiAgIDxsaSB1aS1zcmVmLWFjdGl2ZT1cImFjdGl2ZVwiIGNsYXNzPVwiaXRlbVwiPlxyXG4gKiAgICAgPGEgaHJlZiB1aS1zcmVmPVwiYXBwLnVzZXIoe3VzZXI6ICdiaWxib2JhZ2dpbnMnfSlcIj5AYmlsYm9iYWdnaW5zPC9hPlxyXG4gKiAgIDwvbGk+XHJcbiAqIDwvdWw+XHJcbiAqIDwvcHJlPlxyXG4gKlxyXG4gKlxyXG4gKiBXaGVuIHRoZSBhcHAgc3RhdGUgaXMgXCJhcHAudXNlclwiIChvciBhbnkgY2hpbGRyZW4gc3RhdGVzKSwgYW5kIGNvbnRhaW5zIHRoZSBzdGF0ZSBwYXJhbWV0ZXIgXCJ1c2VyXCIgd2l0aCB2YWx1ZSBcImJpbGJvYmFnZ2luc1wiLFxyXG4gKiB0aGUgcmVzdWx0aW5nIEhUTUwgd2lsbCBhcHBlYXIgYXMgKG5vdGUgdGhlICdhY3RpdmUnIGNsYXNzKTpcclxuICogPHByZT5cclxuICogPHVsPlxyXG4gKiAgIDxsaSB1aS1zcmVmLWFjdGl2ZT1cImFjdGl2ZVwiIGNsYXNzPVwiaXRlbSBhY3RpdmVcIj5cclxuICogICAgIDxhIHVpLXNyZWY9XCJhcHAudXNlcih7dXNlcjogJ2JpbGJvYmFnZ2lucyd9KVwiIGhyZWY9XCIvdXNlcnMvYmlsYm9iYWdnaW5zXCI+QGJpbGJvYmFnZ2luczwvYT5cclxuICogICA8L2xpPlxyXG4gKiA8L3VsPlxyXG4gKiA8L3ByZT5cclxuICpcclxuICogVGhlIGNsYXNzIG5hbWUgaXMgaW50ZXJwb2xhdGVkICoqb25jZSoqIGR1cmluZyB0aGUgZGlyZWN0aXZlcyBsaW5rIHRpbWUgKGFueSBmdXJ0aGVyIGNoYW5nZXMgdG8gdGhlXHJcbiAqIGludGVycG9sYXRlZCB2YWx1ZSBhcmUgaWdub3JlZCkuXHJcbiAqXHJcbiAqIE11bHRpcGxlIGNsYXNzZXMgbWF5IGJlIHNwZWNpZmllZCBpbiBhIHNwYWNlLXNlcGFyYXRlZCBmb3JtYXQ6XHJcbiAqIDxwcmU+XHJcbiAqIDx1bD5cclxuICogICA8bGkgdWktc3JlZi1hY3RpdmU9J2NsYXNzMSBjbGFzczIgY2xhc3MzJz5cclxuICogICAgIDxhIHVpLXNyZWY9XCJhcHAudXNlclwiPmxpbms8L2E+XHJcbiAqICAgPC9saT5cclxuICogPC91bD5cclxuICogPC9wcmU+XHJcbiAqXHJcbiAqIEl0IGlzIGFsc28gcG9zc2libGUgdG8gcGFzcyB1aS1zcmVmLWFjdGl2ZSBhbiBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzXHJcbiAqIHRvIGFuIG9iamVjdCBoYXNoLCB3aG9zZSBrZXlzIHJlcHJlc2VudCBhY3RpdmUgY2xhc3MgbmFtZXMgYW5kIHdob3NlXHJcbiAqIHZhbHVlcyByZXByZXNlbnQgdGhlIHJlc3BlY3RpdmUgc3RhdGUgbmFtZXMvZ2xvYnMuXHJcbiAqIHVpLXNyZWYtYWN0aXZlIHdpbGwgbWF0Y2ggaWYgdGhlIGN1cnJlbnQgYWN0aXZlIHN0YXRlICoqaW5jbHVkZXMqKiBhbnkgb2ZcclxuICogdGhlIHNwZWNpZmllZCBzdGF0ZSBuYW1lcy9nbG9icywgZXZlbiB0aGUgYWJzdHJhY3Qgb25lcy5cclxuICpcclxuICogQEV4YW1wbGVcclxuICogR2l2ZW4gdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSwgd2l0aCBcImFkbWluXCIgYmVpbmcgYW4gYWJzdHJhY3Qgc3RhdGU6XHJcbiAqIDxwcmU+XHJcbiAqIDxkaXYgdWktc3JlZi1hY3RpdmU9XCJ7J2FjdGl2ZSc6ICdhZG1pbi4qJ31cIj5cclxuICogICA8YSB1aS1zcmVmLWFjdGl2ZT1cImFjdGl2ZVwiIHVpLXNyZWY9XCJhZG1pbi5yb2xlc1wiPlJvbGVzPC9hPlxyXG4gKiA8L2Rpdj5cclxuICogPC9wcmU+XHJcbiAqXHJcbiAqIFdoZW4gdGhlIGN1cnJlbnQgc3RhdGUgaXMgXCJhZG1pbi5yb2xlc1wiIHRoZSBcImFjdGl2ZVwiIGNsYXNzIHdpbGwgYmUgYXBwbGllZFxyXG4gKiB0byBib3RoIHRoZSA8ZGl2PiBhbmQgPGE+IGVsZW1lbnRzLiBJdCBpcyBpbXBvcnRhbnQgdG8gbm90ZSB0aGF0IHRoZSBzdGF0ZVxyXG4gKiBuYW1lcy9nbG9icyBwYXNzZWQgdG8gdWktc3JlZi1hY3RpdmUgc2hhZG93IHRoZSBzdGF0ZSBwcm92aWRlZCBieSB1aS1zcmVmLlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS5kaXJlY3RpdmU6dWktc3JlZi1hY3RpdmUtZXFcclxuICpcclxuICogQHJlcXVpcmVzIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICogQHJlcXVpcmVzIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVQYXJhbXNcclxuICogQHJlcXVpcmVzICRpbnRlcnBvbGF0ZVxyXG4gKlxyXG4gKiBAcmVzdHJpY3QgQVxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogVGhlIHNhbWUgYXMge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS5kaXJlY3RpdmU6dWktc3JlZi1hY3RpdmUgdWktc3JlZi1hY3RpdmV9IGJ1dCB3aWxsIG9ubHkgYWN0aXZhdGVcclxuICogd2hlbiB0aGUgZXhhY3QgdGFyZ2V0IHN0YXRlIHVzZWQgaW4gdGhlIGB1aS1zcmVmYCBpcyBhY3RpdmU7IG5vIGNoaWxkIHN0YXRlcy5cclxuICpcclxuICovXHJcbiRTdGF0ZVJlZkFjdGl2ZURpcmVjdGl2ZS4kaW5qZWN0ID0gWyckc3RhdGUnLCAnJHN0YXRlUGFyYW1zJywgJyRpbnRlcnBvbGF0ZSddO1xyXG5mdW5jdGlvbiAkU3RhdGVSZWZBY3RpdmVEaXJlY3RpdmUoJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRpbnRlcnBvbGF0ZSkge1xyXG4gIHJldHVybiAge1xyXG4gICAgcmVzdHJpY3Q6IFwiQVwiLFxyXG4gICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJGF0dHJzJywgJyR0aW1lb3V0JywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJHRpbWVvdXQpIHtcclxuICAgICAgdmFyIHN0YXRlcyA9IFtdLCBhY3RpdmVDbGFzc2VzID0ge30sIGFjdGl2ZUVxQ2xhc3MsIHVpU3JlZkFjdGl2ZTtcclxuXHJcbiAgICAgIC8vIFRoZXJlIHByb2JhYmx5IGlzbid0IG11Y2ggcG9pbnQgaW4gJG9ic2VydmluZyB0aGlzXHJcbiAgICAgIC8vIHVpU3JlZkFjdGl2ZSBhbmQgdWlTcmVmQWN0aXZlRXEgc2hhcmUgdGhlIHNhbWUgZGlyZWN0aXZlIG9iamVjdCB3aXRoIHNvbWVcclxuICAgICAgLy8gc2xpZ2h0IGRpZmZlcmVuY2UgaW4gbG9naWMgcm91dGluZ1xyXG4gICAgICBhY3RpdmVFcUNsYXNzID0gJGludGVycG9sYXRlKCRhdHRycy51aVNyZWZBY3RpdmVFcSB8fCAnJywgZmFsc2UpKCRzY29wZSk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHVpU3JlZkFjdGl2ZSA9ICRzY29wZS4kZXZhbCgkYXR0cnMudWlTcmVmQWN0aXZlKTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vIERvIG5vdGhpbmcuIHVpU3JlZkFjdGl2ZSBpcyBub3QgYSB2YWxpZCBleHByZXNzaW9uLlxyXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byB1c2luZyAkaW50ZXJwb2xhdGUgYmVsb3dcclxuICAgICAgfVxyXG4gICAgICB1aVNyZWZBY3RpdmUgPSB1aVNyZWZBY3RpdmUgfHwgJGludGVycG9sYXRlKCRhdHRycy51aVNyZWZBY3RpdmUgfHwgJycsIGZhbHNlKSgkc2NvcGUpO1xyXG4gICAgICBpZiAoaXNPYmplY3QodWlTcmVmQWN0aXZlKSkge1xyXG4gICAgICAgIGZvckVhY2godWlTcmVmQWN0aXZlLCBmdW5jdGlvbihzdGF0ZU9yTmFtZSwgYWN0aXZlQ2xhc3MpIHtcclxuICAgICAgICAgIGlmIChpc1N0cmluZyhzdGF0ZU9yTmFtZSkpIHtcclxuICAgICAgICAgICAgdmFyIHJlZiA9IHBhcnNlU3RhdGVSZWYoc3RhdGVPck5hbWUsICRzdGF0ZS5jdXJyZW50Lm5hbWUpO1xyXG4gICAgICAgICAgICBhZGRTdGF0ZShyZWYuc3RhdGUsICRzY29wZS4kZXZhbChyZWYucGFyYW1FeHByKSwgYWN0aXZlQ2xhc3MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBbGxvdyB1aVNyZWYgdG8gY29tbXVuaWNhdGUgd2l0aCB1aVNyZWZBY3RpdmVbRXF1YWxzXVxyXG4gICAgICB0aGlzLiQkYWRkU3RhdGVJbmZvID0gZnVuY3Rpb24gKG5ld1N0YXRlLCBuZXdQYXJhbXMpIHtcclxuICAgICAgICAvLyB3ZSBhbHJlYWR5IGdvdCBhbiBleHBsaWNpdCBzdGF0ZSBwcm92aWRlZCBieSB1aS1zcmVmLWFjdGl2ZSwgc28gd2VcclxuICAgICAgICAvLyBzaGFkb3cgdGhlIG9uZSB0aGF0IGNvbWVzIGZyb20gdWktc3JlZlxyXG4gICAgICAgIGlmIChpc09iamVjdCh1aVNyZWZBY3RpdmUpICYmIHN0YXRlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFkZFN0YXRlKG5ld1N0YXRlLCBuZXdQYXJhbXMsIHVpU3JlZkFjdGl2ZSk7XHJcbiAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAkc2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgdXBkYXRlKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGFkZFN0YXRlKHN0YXRlTmFtZSwgc3RhdGVQYXJhbXMsIGFjdGl2ZUNsYXNzKSB7XHJcbiAgICAgICAgdmFyIHN0YXRlID0gJHN0YXRlLmdldChzdGF0ZU5hbWUsIHN0YXRlQ29udGV4dCgkZWxlbWVudCkpO1xyXG4gICAgICAgIHZhciBzdGF0ZUhhc2ggPSBjcmVhdGVTdGF0ZUhhc2goc3RhdGVOYW1lLCBzdGF0ZVBhcmFtcyk7XHJcblxyXG4gICAgICAgIHN0YXRlcy5wdXNoKHtcclxuICAgICAgICAgIHN0YXRlOiBzdGF0ZSB8fCB7IG5hbWU6IHN0YXRlTmFtZSB9LFxyXG4gICAgICAgICAgcGFyYW1zOiBzdGF0ZVBhcmFtcyxcclxuICAgICAgICAgIGhhc2g6IHN0YXRlSGFzaFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhY3RpdmVDbGFzc2VzW3N0YXRlSGFzaF0gPSBhY3RpdmVDbGFzcztcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZVxyXG4gICAgICAgKiBAcGFyYW0ge09iamVjdHxzdHJpbmd9IFtwYXJhbXNdXHJcbiAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIGNyZWF0ZVN0YXRlSGFzaChzdGF0ZSwgcGFyYW1zKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhzdGF0ZSkpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc3RhdGUgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpc09iamVjdChwYXJhbXMpKSB7XHJcbiAgICAgICAgICByZXR1cm4gc3RhdGUgKyB0b0pzb24ocGFyYW1zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcGFyYW1zID0gJHNjb3BlLiRldmFsKHBhcmFtcyk7XHJcbiAgICAgICAgaWYgKGlzT2JqZWN0KHBhcmFtcykpIHtcclxuICAgICAgICAgIHJldHVybiBzdGF0ZSArIHRvSnNvbihwYXJhbXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFVwZGF0ZSByb3V0ZSBzdGF0ZVxyXG4gICAgICBmdW5jdGlvbiB1cGRhdGUoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmIChhbnlNYXRjaChzdGF0ZXNbaV0uc3RhdGUsIHN0YXRlc1tpXS5wYXJhbXMpKSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzKCRlbGVtZW50LCBhY3RpdmVDbGFzc2VzW3N0YXRlc1tpXS5oYXNoXSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzcygkZWxlbWVudCwgYWN0aXZlQ2xhc3Nlc1tzdGF0ZXNbaV0uaGFzaF0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChleGFjdE1hdGNoKHN0YXRlc1tpXS5zdGF0ZSwgc3RhdGVzW2ldLnBhcmFtcykpIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3MoJGVsZW1lbnQsIGFjdGl2ZUVxQ2xhc3MpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3MoJGVsZW1lbnQsIGFjdGl2ZUVxQ2xhc3MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIGNsYXNzTmFtZSkgeyAkdGltZW91dChmdW5jdGlvbiAoKSB7IGVsLmFkZENsYXNzKGNsYXNzTmFtZSk7IH0pOyB9XHJcbiAgICAgIGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsLCBjbGFzc05hbWUpIHsgZWwucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTsgfVxyXG4gICAgICBmdW5jdGlvbiBhbnlNYXRjaChzdGF0ZSwgcGFyYW1zKSB7IHJldHVybiAkc3RhdGUuaW5jbHVkZXMoc3RhdGUubmFtZSwgcGFyYW1zKTsgfVxyXG4gICAgICBmdW5jdGlvbiBleGFjdE1hdGNoKHN0YXRlLCBwYXJhbXMpIHsgcmV0dXJuICRzdGF0ZS5pcyhzdGF0ZS5uYW1lLCBwYXJhbXMpOyB9XHJcblxyXG4gICAgICB1cGRhdGUoKTtcclxuICAgIH1dXHJcbiAgfTtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScpXHJcbiAgLmRpcmVjdGl2ZSgndWlTcmVmJywgJFN0YXRlUmVmRGlyZWN0aXZlKVxyXG4gIC5kaXJlY3RpdmUoJ3VpU3JlZkFjdGl2ZScsICRTdGF0ZVJlZkFjdGl2ZURpcmVjdGl2ZSlcclxuICAuZGlyZWN0aXZlKCd1aVNyZWZBY3RpdmVFcScsICRTdGF0ZVJlZkFjdGl2ZURpcmVjdGl2ZSlcclxuICAuZGlyZWN0aXZlKCd1aVN0YXRlJywgJFN0YXRlUmVmRHluYW1pY0RpcmVjdGl2ZSk7XHJcblxyXG4vKipcclxuICogQG5nZG9jIGZpbHRlclxyXG4gKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuZmlsdGVyOmlzU3RhdGVcclxuICpcclxuICogQHJlcXVpcmVzIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcclxuICpcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqIFRyYW5zbGF0ZXMgdG8ge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjbWV0aG9kc19pcyAkc3RhdGUuaXMoXCJzdGF0ZU5hbWVcIil9LlxyXG4gKi9cclxuJElzU3RhdGVGaWx0ZXIuJGluamVjdCA9IFsnJHN0YXRlJ107XHJcbmZ1bmN0aW9uICRJc1N0YXRlRmlsdGVyKCRzdGF0ZSkge1xyXG4gIHZhciBpc0ZpbHRlciA9IGZ1bmN0aW9uIChzdGF0ZSwgcGFyYW1zKSB7XHJcbiAgICByZXR1cm4gJHN0YXRlLmlzKHN0YXRlLCBwYXJhbXMpO1xyXG4gIH07XHJcbiAgaXNGaWx0ZXIuJHN0YXRlZnVsID0gdHJ1ZTtcclxuICByZXR1cm4gaXNGaWx0ZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZmlsdGVyXHJcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS5maWx0ZXI6aW5jbHVkZWRCeVN0YXRlXHJcbiAqXHJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiBUcmFuc2xhdGVzIHRvIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI21ldGhvZHNfaW5jbHVkZXMgJHN0YXRlLmluY2x1ZGVzKCdmdWxsT3JQYXJ0aWFsU3RhdGVOYW1lJyl9LlxyXG4gKi9cclxuJEluY2x1ZGVkQnlTdGF0ZUZpbHRlci4kaW5qZWN0ID0gWyckc3RhdGUnXTtcclxuZnVuY3Rpb24gJEluY2x1ZGVkQnlTdGF0ZUZpbHRlcigkc3RhdGUpIHtcclxuICB2YXIgaW5jbHVkZXNGaWx0ZXIgPSBmdW5jdGlvbiAoc3RhdGUsIHBhcmFtcywgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICRzdGF0ZS5pbmNsdWRlcyhzdGF0ZSwgcGFyYW1zLCBvcHRpb25zKTtcclxuICB9O1xyXG4gIGluY2x1ZGVzRmlsdGVyLiRzdGF0ZWZ1bCA9IHRydWU7XHJcbiAgcmV0dXJuICBpbmNsdWRlc0ZpbHRlcjtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScpXHJcbiAgLmZpbHRlcignaXNTdGF0ZScsICRJc1N0YXRlRmlsdGVyKVxyXG4gIC5maWx0ZXIoJ2luY2x1ZGVkQnlTdGF0ZScsICRJbmNsdWRlZEJ5U3RhdGVGaWx0ZXIpO1xyXG59KSh3aW5kb3csIHdpbmRvdy5hbmd1bGFyKTsiXX0=

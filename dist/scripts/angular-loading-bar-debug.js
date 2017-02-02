/*
 * angular-loading-bar
 *
 * intercepts XHR requests and creates a loading bar.
 * Based on the excellent nprogress work by rstacruz (more info in readme)
 *
 * (c) 2013 Wes Cruver
 * License: MIT
 */


(function() {

'use strict';

// Alias the loading bar for various backwards compatibilities since the project has matured:
angular.module('angular-loading-bar', ['cfp.loadingBarInterceptor']);
angular.module('chieffancypants.loadingBar', ['cfp.loadingBarInterceptor']);


/**
 * loadingBarInterceptor service
 *
 * Registers itself as an Angular interceptor and listens for XHR requests.
 */
angular.module('cfp.loadingBarInterceptor', ['cfp.loadingBar'])
  .config(['$httpProvider', function ($httpProvider) {

    var interceptor = ['$q', '$cacheFactory', '$timeout', '$rootScope', '$log', 'cfpLoadingBar', function ($q, $cacheFactory, $timeout, $rootScope, $log, cfpLoadingBar) {

      /**
       * The total number of requests made
       */
      var reqsTotal = 0;

      /**
       * The number of requests completed (either successfully or not)
       */
      var reqsCompleted = 0;

      /**
       * The amount of time spent fetching before showing the loading bar
       */
      var latencyThreshold = cfpLoadingBar.latencyThreshold;

      /**
       * $timeout handle for latencyThreshold
       */
      var startTimeout;


      /**
       * calls cfpLoadingBar.complete() which removes the
       * loading bar from the DOM.
       */
      function setComplete() {
        $timeout.cancel(startTimeout);
        cfpLoadingBar.complete();
        reqsCompleted = 0;
        reqsTotal = 0;
      }

      /**
       * Determine if the response has already been cached
       * @param  {Object}  config the config option from the request
       * @return {Boolean} retrns true if cached, otherwise false
       */
      function isCached(config) {
        var cache;
        var defaultCache = $cacheFactory.get('$http');
        var defaults = $httpProvider.defaults;

        // Choose the proper cache source. Borrowed from angular: $http service
        if ((config.cache || defaults.cache) && config.cache !== false &&
          (config.method === 'GET' || config.method === 'JSONP')) {
            cache = angular.isObject(config.cache) ? config.cache
              : angular.isObject(defaults.cache) ? defaults.cache
              : defaultCache;
        }

        var cached = cache !== undefined ?
          cache.get(config.url) !== undefined : false;

        if (config.cached !== undefined && cached !== config.cached) {
          return config.cached;
        }
        config.cached = cached;
        return cached;
      }


      return {
        'request': function(config) {
          // Check to make sure this request hasn't already been cached and that
          // the requester didn't explicitly ask us to ignore this request:
          if (!config.ignoreLoadingBar && !isCached(config)) {
            $rootScope.$broadcast('cfpLoadingBar:loading', {url: config.url});
            if (reqsTotal === 0) {
              startTimeout = $timeout(function() {
                cfpLoadingBar.start();
              }, latencyThreshold);
            }
            reqsTotal++;
            cfpLoadingBar.set(reqsCompleted / reqsTotal);
          }
          return config;
        },

        'response': function(response) {
          if (!response || !response.config) {
            $log.error('Broken interceptor detected: Config object not supplied in response:\n https://github.com/chieffancypants/angular-loading-bar/pull/50');
            return response;
          }

          if (!response.config.ignoreLoadingBar && !isCached(response.config)) {
            reqsCompleted++;
            $rootScope.$broadcast('cfpLoadingBar:loaded', {url: response.config.url, result: response});
            if (reqsCompleted >= reqsTotal) {
              setComplete();
            } else {
              cfpLoadingBar.set(reqsCompleted / reqsTotal);
            }
          }
          return response;
        },

        'responseError': function(rejection) {
          if (!rejection || !rejection.config) {
            $log.error('Broken interceptor detected: Config object not supplied in rejection:\n https://github.com/chieffancypants/angular-loading-bar/pull/50');
            return $q.reject(rejection);
          }

          if (!rejection.config.ignoreLoadingBar && !isCached(rejection.config)) {
            reqsCompleted++;
            $rootScope.$broadcast('cfpLoadingBar:loaded', {url: rejection.config.url, result: rejection});
            if (reqsCompleted >= reqsTotal) {
              setComplete();
            } else {
              cfpLoadingBar.set(reqsCompleted / reqsTotal);
            }
          }
          return $q.reject(rejection);
        }
      };
    }];

    $httpProvider.interceptors.push(interceptor);
  }]);


/**
 * Loading Bar
 *
 * This service handles adding and removing the actual element in the DOM.
 * Generally, best practices for DOM manipulation is to take place in a
 * directive, but because the element itself is injected in the DOM only upon
 * XHR requests, and it's likely needed on every view, the best option is to
 * use a service.
 */
angular.module('cfp.loadingBar', [])
  .provider('cfpLoadingBar', function() {

    this.autoIncrement = true;
    this.includeSpinner = true;
    this.includeBar = true;
    this.latencyThreshold = 100;
    this.startSize = 0.02;
    this.parentSelector = 'body';
    this.spinnerTemplate = '<div id="loading-bar-spinner"><div class="spinner-icon"></div></div>';
    this.loadingBarTemplate = '<div id="loading-bar"><div class="bar"><div class="peg"></div></div></div>';

    this.$get = ['$injector', '$document', '$timeout', '$rootScope', function ($injector, $document, $timeout, $rootScope) {
      var $animate;
      var $parentSelector = this.parentSelector,
        loadingBarContainer = angular.element(this.loadingBarTemplate),
        loadingBar = loadingBarContainer.find('div').eq(0),
        spinner = angular.element(this.spinnerTemplate);

      var incTimeout,
        completeTimeout,
        started = false,
        status = 0;

      var autoIncrement = this.autoIncrement;
      var includeSpinner = this.includeSpinner;
      var includeBar = this.includeBar;
      var startSize = this.startSize;

      /**
       * Inserts the loading bar element into the dom, and sets it to 2%
       */
      function _start() {
        if (!$animate) {
          $animate = $injector.get('$animate');
        }

        $timeout.cancel(completeTimeout);

        // do not continually broadcast the started event:
        if (started) {
          return;
        }

        var document = $document[0];
        var parent = document.querySelector ?
          document.querySelector($parentSelector)
          : $document.find($parentSelector)[0]
        ;

        if (! parent) {
          parent = document.getElementsByTagName('body')[0];
        }

        var $parent = angular.element(parent);
        var $after = parent.lastChild && angular.element(parent.lastChild);

        $rootScope.$broadcast('cfpLoadingBar:started');
        started = true;

        if (includeBar) {
          $animate.enter(loadingBarContainer, $parent, $after);
        }

        if (includeSpinner) {
          $animate.enter(spinner, $parent, loadingBarContainer);
        }

        _set(startSize);
      }

      /**
       * Set the loading bar's width to a certain percent.
       *
       * @param n any value between 0 and 1
       */
      function _set(n) {
        if (!started) {
          return;
        }
        var pct = (n * 100) + '%';
        loadingBar.css('width', pct);
        status = n;

        // increment loadingbar to give the illusion that there is always
        // progress but make sure to cancel the previous timeouts so we don't
        // have multiple incs running at the same time.
        if (autoIncrement) {
          $timeout.cancel(incTimeout);
          incTimeout = $timeout(function() {
            _inc();
          }, 250);
        }
      }

      /**
       * Increments the loading bar by a random amount
       * but slows down as it progresses
       */
      function _inc() {
        if (_status() >= 1) {
          return;
        }

        var rnd = 0;

        // TODO: do this mathmatically instead of through conditions

        var stat = _status();
        if (stat >= 0 && stat < 0.25) {
          // Start out between 3 - 6% increments
          rnd = (Math.random() * (5 - 3 + 1) + 3) / 100;
        } else if (stat >= 0.25 && stat < 0.65) {
          // increment between 0 - 3%
          rnd = (Math.random() * 3) / 100;
        } else if (stat >= 0.65 && stat < 0.9) {
          // increment between 0 - 2%
          rnd = (Math.random() * 2) / 100;
        } else if (stat >= 0.9 && stat < 0.99) {
          // finally, increment it .5 %
          rnd = 0.005;
        } else {
          // after 99%, don't increment:
          rnd = 0;
        }

        var pct = _status() + rnd;
        _set(pct);
      }

      function _status() {
        return status;
      }

      function _completeAnimation() {
        status = 0;
        started = false;
      }

      function _complete() {
        if (!$animate) {
          $animate = $injector.get('$animate');
        }

        $rootScope.$broadcast('cfpLoadingBar:completed');
        _set(1);

        $timeout.cancel(completeTimeout);

        // Attempt to aggregate any start/complete calls within 500ms:
        completeTimeout = $timeout(function() {
          var promise = $animate.leave(loadingBarContainer, _completeAnimation);
          if (promise && promise.then) {
            promise.then(_completeAnimation);
          }
          $animate.leave(spinner);
        }, 500);
      }

      return {
        start            : _start,
        set              : _set,
        status           : _status,
        inc              : _inc,
        complete         : _complete,
        autoIncrement    : this.autoIncrement,
        includeSpinner   : this.includeSpinner,
        latencyThreshold : this.latencyThreshold,
        parentSelector   : this.parentSelector,
        startSize        : this.startSize
      };


    }];     //
  });       // wtf javascript. srsly
})();       //

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFuZ3VsYXItbG9hZGluZy1iYXIuanMiXSwibmFtZXMiOlsiYW5ndWxhciIsIm1vZHVsZSIsImNvbmZpZyIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvciIsIiRxIiwiJGNhY2hlRmFjdG9yeSIsIiR0aW1lb3V0IiwiJHJvb3RTY29wZSIsIiRsb2ciLCJjZnBMb2FkaW5nQmFyIiwic2V0Q29tcGxldGUiLCJjYW5jZWwiLCJzdGFydFRpbWVvdXQiLCJjb21wbGV0ZSIsInJlcXNDb21wbGV0ZWQiLCJyZXFzVG90YWwiLCJpc0NhY2hlZCIsImNhY2hlIiwiZGVmYXVsdENhY2hlIiwiZ2V0IiwiZGVmYXVsdHMiLCJtZXRob2QiLCJpc09iamVjdCIsImNhY2hlZCIsInVuZGVmaW5lZCIsInVybCIsImxhdGVuY3lUaHJlc2hvbGQiLCJyZXF1ZXN0IiwiaWdub3JlTG9hZGluZ0JhciIsIiRicm9hZGNhc3QiLCJzdGFydCIsInNldCIsInJlc3BvbnNlIiwicmVzdWx0IiwiZXJyb3IiLCJyZXNwb25zZUVycm9yIiwicmVqZWN0aW9uIiwicmVqZWN0IiwiaW50ZXJjZXB0b3JzIiwicHVzaCIsInByb3ZpZGVyIiwidGhpcyIsImF1dG9JbmNyZW1lbnQiLCJpbmNsdWRlU3Bpbm5lciIsImluY2x1ZGVCYXIiLCJzdGFydFNpemUiLCJwYXJlbnRTZWxlY3RvciIsInNwaW5uZXJUZW1wbGF0ZSIsImxvYWRpbmdCYXJUZW1wbGF0ZSIsIiRnZXQiLCIkaW5qZWN0b3IiLCIkZG9jdW1lbnQiLCJfc3RhcnQiLCIkYW5pbWF0ZSIsImNvbXBsZXRlVGltZW91dCIsInN0YXJ0ZWQiLCJkb2N1bWVudCIsInBhcmVudCIsInF1ZXJ5U2VsZWN0b3IiLCIkcGFyZW50U2VsZWN0b3IiLCJmaW5kIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCIkcGFyZW50IiwiZWxlbWVudCIsIiRhZnRlciIsImxhc3RDaGlsZCIsImVudGVyIiwibG9hZGluZ0JhckNvbnRhaW5lciIsInNwaW5uZXIiLCJfc2V0IiwibiIsInBjdCIsImxvYWRpbmdCYXIiLCJjc3MiLCJzdGF0dXMiLCJpbmNUaW1lb3V0IiwiX2luYyIsIl9zdGF0dXMiLCJybmQiLCJzdGF0IiwiTWF0aCIsInJhbmRvbSIsIl9jb21wbGV0ZUFuaW1hdGlvbiIsIl9jb21wbGV0ZSIsInByb21pc2UiLCJsZWF2ZSIsInRoZW4iLCJlcSIsImluYyJdLCJtYXBwaW5ncyI6IkNBV0EsV0FFQSxZQUdBQSxTQUFRQyxPQUFPLHVCQUF3Qiw4QkFDdkNELFFBQVFDLE9BQU8sOEJBQStCLDhCQVE5Q0QsUUFBUUMsT0FBTyw2QkFBOEIsbUJBQzFDQyxRQUFRLGdCQUFpQixTQUFVQyxHQUVsQyxHQUFJQyxJQUFlLEtBQU0sZ0JBQWlCLFdBQVksYUFBYyxPQUFRLGdCQUFpQixTQUFVQyxFQUFJQyxFQUFlQyxFQUFVQyxFQUFZQyxFQUFNQyxHQTJCcEosUUFBU0MsS0FDUEosRUFBU0ssT0FBT0MsR0FDaEJILEVBQWNJLFdBQ2RDLEVBQWdCLEVBQ2hCQyxFQUFZLEVBUWQsUUFBU0MsR0FBU2YsR0FDaEIsR0FBSWdCLEdBQ0FDLEVBQWViLEVBQWNjLElBQUksU0FDakNDLEVBQVdsQixFQUFja0IsVUFHeEJuQixFQUFPZ0IsUUFBU0csRUFBU0gsT0FBVWhCLEVBQU9nQixTQUFVLEdBQ3BDLFFBQWxCaEIsRUFBT29CLFFBQXNDLFVBQWxCcEIsRUFBT29CLFNBQ2pDSixFQUFRbEIsUUFBUXVCLFNBQVNyQixFQUFPZ0IsT0FBU2hCLEVBQU9nQixNQUM1Q2xCLFFBQVF1QixTQUFTRixFQUFTSCxPQUFTRyxFQUFTSCxNQUM1Q0MsRUFHUixJQUFJSyxHQUFtQkMsU0FBVlAsR0FDZU8sU0FBMUJQLEVBQU1FLElBQUlsQixFQUFPd0IsSUFFbkIsT0FBc0JELFVBQWxCdkIsRUFBT3NCLFFBQXdCQSxJQUFXdEIsRUFBT3NCLE9BQzVDdEIsRUFBT3NCLFFBRWhCdEIsRUFBT3NCLE9BQVNBLEVBQ1RBLEdBdERULEdBZUlYLEdBZkFHLEVBQVksRUFLWkQsRUFBZ0IsRUFLaEJZLEVB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LEdBQU1NLElBQVlDLENBQ3RCVCxHQUFLRSxJQUdQLFFBQVNNLEtBQ1AsTUFBT0gsR0FHVCxRQUFTUSxLQUNQUixFQUFTLEVBQ1RuQixHQUFVLEVBR1osUUFBUzRCLEtBQ0Y5QixJQUNIQSxFQUFXSCxFQUFVL0IsSUFBSSxhQUczQlosRUFBV3NCLFdBQVcsMkJBQ3RCd0MsRUFBSyxHQUVML0QsRUFBU0ssT0FBTzJDLEdBR2hCQSxFQUFrQmhELEVBQVMsV0FDekIsR0FBSThFLEdBQVUvQixFQUFTZ0MsTUFBTWxCLEVBQXFCZSxFQUM5Q0UsSUFBV0EsRUFBUUUsTUFDckJGLEVBQVFFLEtBQUtKLEdBRWY3QixFQUFTZ0MsTUFBTWpCLElBQ2QsS0EvSUwsR0FBSWYsR0FNQXNCLEVBQ0ZyQixFQU5FSyxFQUFrQmxCLEtBQUtLLGVBQ3pCcUIsRUFBc0JwRSxRQUFRZ0UsUUFBUXRCLEtBQUtPLG9CQUMzQ3dCLEVBQWFMLEVBQW9CUCxLQUFLLE9BQU8yQixHQUFHLEdBQ2hEbkIsRUFBVXJFLFFBQVFnRSxRQUFRdEIsS0FBS00saUJBSS9CUSxHQUFVLEVBQ1ZtQixFQUFTLEVBRVBoQyxFQUFnQkQsS0FBS0MsY0FDckJDLEVBQWlCRixLQUFLRSxlQUN0QkMsRUFBYUgsS0FBS0csV0FDbEJDLEVBQVlKLEtBQUtJLFNBb0lyQixRQUNFZixNQUFtQnNCLEVBQ25CckIsSUFBbUJzQyxFQUNuQkssT0FBbUJHLEVBQ25CVyxJQUFtQlosRUFDbkIvRCxTQUFtQnNFLEVBQ25CekMsY0FBbUJELEtBQUtDLGNBQ3hCQyxlQUFtQkYsS0FBS0UsZUFDeEJqQixpQkFBbUJlLEtBQUtmLGlCQUN4Qm9CLGVBQW1CTCxLQUFLSyxlQUN4QkQsVUFBbUJKLEtBQUtJIiwiZmlsZSI6ImFuZ3VsYXItbG9hZGluZy1iYXItZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogYW5ndWxhci1sb2FkaW5nLWJhclxuICpcbiAqIGludGVyY2VwdHMgWEhSIHJlcXVlc3RzIGFuZCBjcmVhdGVzIGEgbG9hZGluZyBiYXIuXG4gKiBCYXNlZCBvbiB0aGUgZXhjZWxsZW50IG5wcm9ncmVzcyB3b3JrIGJ5IHJzdGFjcnV6IChtb3JlIGluZm8gaW4gcmVhZG1lKVxuICpcbiAqIChjKSAyMDEzIFdlcyBDcnV2ZXJcbiAqIExpY2Vuc2U6IE1JVFxuICovXG5cblxuKGZ1bmN0aW9uKCkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIEFsaWFzIHRoZSBsb2FkaW5nIGJhciBmb3IgdmFyaW91cyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0aWVzIHNpbmNlIHRoZSBwcm9qZWN0IGhhcyBtYXR1cmVkOlxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXItbG9hZGluZy1iYXInLCBbJ2NmcC5sb2FkaW5nQmFySW50ZXJjZXB0b3InXSk7XG5hbmd1bGFyLm1vZHVsZSgnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLCBbJ2NmcC5sb2FkaW5nQmFySW50ZXJjZXB0b3InXSk7XG5cblxuLyoqXG4gKiBsb2FkaW5nQmFySW50ZXJjZXB0b3Igc2VydmljZVxuICpcbiAqIFJlZ2lzdGVycyBpdHNlbGYgYXMgYW4gQW5ndWxhciBpbnRlcmNlcHRvciBhbmQgbGlzdGVucyBmb3IgWEhSIHJlcXVlc3RzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnY2ZwLmxvYWRpbmdCYXJJbnRlcmNlcHRvcicsIFsnY2ZwLmxvYWRpbmdCYXInXSlcbiAgLmNvbmZpZyhbJyRodHRwUHJvdmlkZXInLCBmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuXG4gICAgdmFyIGludGVyY2VwdG9yID0gWyckcScsICckY2FjaGVGYWN0b3J5JywgJyR0aW1lb3V0JywgJyRyb290U2NvcGUnLCAnJGxvZycsICdjZnBMb2FkaW5nQmFyJywgZnVuY3Rpb24gKCRxLCAkY2FjaGVGYWN0b3J5LCAkdGltZW91dCwgJHJvb3RTY29wZSwgJGxvZywgY2ZwTG9hZGluZ0Jhcikge1xuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSB0b3RhbCBudW1iZXIgb2YgcmVxdWVzdHMgbWFkZVxuICAgICAgICovXG4gICAgICB2YXIgcmVxc1RvdGFsID0gMDtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgbnVtYmVyIG9mIHJlcXVlc3RzIGNvbXBsZXRlZCAoZWl0aGVyIHN1Y2Nlc3NmdWxseSBvciBub3QpXG4gICAgICAgKi9cbiAgICAgIHZhciByZXFzQ29tcGxldGVkID0gMDtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgc3BlbnQgZmV0Y2hpbmcgYmVmb3JlIHNob3dpbmcgdGhlIGxvYWRpbmcgYmFyXG4gICAgICAgKi9cbiAgICAgIHZhciBsYXRlbmN5VGhyZXNob2xkID0gY2ZwTG9hZGluZ0Jhci5sYXRlbmN5VGhyZXNob2xkO1xuXG4gICAgICAvKipcbiAgICAgICAqICR0aW1lb3V0IGhhbmRsZSBmb3IgbGF0ZW5jeVRocmVzaG9sZFxuICAgICAgICovXG4gICAgICB2YXIgc3RhcnRUaW1lb3V0O1xuXG5cbiAgICAgIC8qKlxuICAgICAgICogY2FsbHMgY2ZwTG9hZGluZ0Jhci5jb21wbGV0ZSgpIHdoaWNoIHJlbW92ZXMgdGhlXG4gICAgICAgKiBsb2FkaW5nIGJhciBmcm9tIHRoZSBET00uXG4gICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIHNldENvbXBsZXRlKCkge1xuICAgICAgICAkdGltZW91dC5jYW5jZWwoc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgY2ZwTG9hZGluZ0Jhci5jb21wbGV0ZSgpO1xuICAgICAgICByZXFzQ29tcGxldGVkID0gMDtcbiAgICAgICAgcmVxc1RvdGFsID0gMDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBEZXRlcm1pbmUgaWYgdGhlIHJlc3BvbnNlIGhhcyBhbHJlYWR5IGJlZW4gY2FjaGVkXG4gICAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICBjb25maWcgdGhlIGNvbmZpZyBvcHRpb24gZnJvbSB0aGUgcmVxdWVzdFxuICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gcmV0cm5zIHRydWUgaWYgY2FjaGVkLCBvdGhlcndpc2UgZmFsc2VcbiAgICAgICAqL1xuICAgICAgZnVuY3Rpb24gaXNDYWNoZWQoY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWNoZTtcbiAgICAgICAgdmFyIGRlZmF1bHRDYWNoZSA9ICRjYWNoZUZhY3RvcnkuZ2V0KCckaHR0cCcpO1xuICAgICAgICB2YXIgZGVmYXVsdHMgPSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzO1xuXG4gICAgICAgIC8vIENob29zZSB0aGUgcHJvcGVyIGNhY2hlIHNvdXJjZS4gQm9ycm93ZWQgZnJvbSBhbmd1bGFyOiAkaHR0cCBzZXJ2aWNlXG4gICAgICAgIGlmICgoY29uZmlnLmNhY2hlIHx8IGRlZmF1bHRzLmNhY2hlKSAmJiBjb25maWcuY2FjaGUgIT09IGZhbHNlICYmXG4gICAgICAgICAgKGNvbmZpZy5tZXRob2QgPT09ICdHRVQnIHx8IGNvbmZpZy5tZXRob2QgPT09ICdKU09OUCcpKSB7XG4gICAgICAgICAgICBjYWNoZSA9IGFuZ3VsYXIuaXNPYmplY3QoY29uZmlnLmNhY2hlKSA/IGNvbmZpZy5jYWNoZVxuICAgICAgICAgICAgICA6IGFuZ3VsYXIuaXNPYmplY3QoZGVmYXVsdHMuY2FjaGUpID8gZGVmYXVsdHMuY2FjaGVcbiAgICAgICAgICAgICAgOiBkZWZhdWx0Q2FjaGU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FjaGVkID0gY2FjaGUgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgY2FjaGUuZ2V0KGNvbmZpZy51cmwpICE9PSB1bmRlZmluZWQgOiBmYWxzZTtcblxuICAgICAgICBpZiAoY29uZmlnLmNhY2hlZCAhPT0gdW5kZWZpbmVkICYmIGNhY2hlZCAhPT0gY29uZmlnLmNhY2hlZCkge1xuICAgICAgICAgIHJldHVybiBjb25maWcuY2FjaGVkO1xuICAgICAgICB9XG4gICAgICAgIGNvbmZpZy5jYWNoZWQgPSBjYWNoZWQ7XG4gICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICB9XG5cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJ3JlcXVlc3QnOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgICAvLyBDaGVjayB0byBtYWtlIHN1cmUgdGhpcyByZXF1ZXN0IGhhc24ndCBhbHJlYWR5IGJlZW4gY2FjaGVkIGFuZCB0aGF0XG4gICAgICAgICAgLy8gdGhlIHJlcXVlc3RlciBkaWRuJ3QgZXhwbGljaXRseSBhc2sgdXMgdG8gaWdub3JlIHRoaXMgcmVxdWVzdDpcbiAgICAgICAgICBpZiAoIWNvbmZpZy5pZ25vcmVMb2FkaW5nQmFyICYmICFpc0NhY2hlZChjb25maWcpKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2NmcExvYWRpbmdCYXI6bG9hZGluZycsIHt1cmw6IGNvbmZpZy51cmx9KTtcbiAgICAgICAgICAgIGlmIChyZXFzVG90YWwgPT09IDApIHtcbiAgICAgICAgICAgICAgc3RhcnRUaW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2ZwTG9hZGluZ0Jhci5zdGFydCgpO1xuICAgICAgICAgICAgICB9LCBsYXRlbmN5VGhyZXNob2xkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXNUb3RhbCsrO1xuICAgICAgICAgICAgY2ZwTG9hZGluZ0Jhci5zZXQocmVxc0NvbXBsZXRlZCAvIHJlcXNUb3RhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgJ3Jlc3BvbnNlJzogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICBpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5jb25maWcpIHtcbiAgICAgICAgICAgICRsb2cuZXJyb3IoJ0Jyb2tlbiBpbnRlcmNlcHRvciBkZXRlY3RlZDogQ29uZmlnIG9iamVjdCBub3Qgc3VwcGxpZWQgaW4gcmVzcG9uc2U6XFxuIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGllZmZhbmN5cGFudHMvYW5ndWxhci1sb2FkaW5nLWJhci9wdWxsLzUwJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFyZXNwb25zZS5jb25maWcuaWdub3JlTG9hZGluZ0JhciAmJiAhaXNDYWNoZWQocmVzcG9uc2UuY29uZmlnKSkge1xuICAgICAgICAgICAgcmVxc0NvbXBsZXRlZCsrO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdjZnBMb2FkaW5nQmFyOmxvYWRlZCcsIHt1cmw6IHJlc3BvbnNlLmNvbmZpZy51cmwsIHJlc3VsdDogcmVzcG9uc2V9KTtcbiAgICAgICAgICAgIGlmIChyZXFzQ29tcGxldGVkID49IHJlcXNUb3RhbCkge1xuICAgICAgICAgICAgICBzZXRDb21wbGV0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2ZwTG9hZGluZ0Jhci5zZXQocmVxc0NvbXBsZXRlZCAvIHJlcXNUb3RhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSxcblxuICAgICAgICAncmVzcG9uc2VFcnJvcic6IGZ1bmN0aW9uKHJlamVjdGlvbikge1xuICAgICAgICAgIGlmICghcmVqZWN0aW9uIHx8ICFyZWplY3Rpb24uY29uZmlnKSB7XG4gICAgICAgICAgICAkbG9nLmVycm9yKCdCcm9rZW4gaW50ZXJjZXB0b3IgZGV0ZWN0ZWQ6IENvbmZpZyBvYmplY3Qgbm90IHN1cHBsaWVkIGluIHJlamVjdGlvbjpcXG4gaHR0cHM6Ly9naXRodWIuY29tL2NoaWVmZmFuY3lwYW50cy9hbmd1bGFyLWxvYWRpbmctYmFyL3B1bGwvNTAnKTtcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXJlamVjdGlvbi5jb25maWcuaWdub3JlTG9hZGluZ0JhciAmJiAhaXNDYWNoZWQocmVqZWN0aW9uLmNvbmZpZykpIHtcbiAgICAgICAgICAgIHJlcXNDb21wbGV0ZWQrKztcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnY2ZwTG9hZGluZ0Jhcjpsb2FkZWQnLCB7dXJsOiByZWplY3Rpb24uY29uZmlnLnVybCwgcmVzdWx0OiByZWplY3Rpb259KTtcbiAgICAgICAgICAgIGlmIChyZXFzQ29tcGxldGVkID49IHJlcXNUb3RhbCkge1xuICAgICAgICAgICAgICBzZXRDb21wbGV0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2ZwTG9hZGluZ0Jhci5zZXQocmVxc0NvbXBsZXRlZCAvIHJlcXNUb3RhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XTtcblxuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goaW50ZXJjZXB0b3IpO1xuICB9XSk7XG5cblxuLyoqXG4gKiBMb2FkaW5nIEJhclxuICpcbiAqIFRoaXMgc2VydmljZSBoYW5kbGVzIGFkZGluZyBhbmQgcmVtb3ZpbmcgdGhlIGFjdHVhbCBlbGVtZW50IGluIHRoZSBET00uXG4gKiBHZW5lcmFsbHksIGJlc3QgcHJhY3RpY2VzIGZvciBET00gbWFuaXB1bGF0aW9uIGlzIHRvIHRha2UgcGxhY2UgaW4gYVxuICogZGlyZWN0aXZlLCBidXQgYmVjYXVzZSB0aGUgZWxlbWVudCBpdHNlbGYgaXMgaW5qZWN0ZWQgaW4gdGhlIERPTSBvbmx5IHVwb25cbiAqIFhIUiByZXF1ZXN0cywgYW5kIGl0J3MgbGlrZWx5IG5lZWRlZCBvbiBldmVyeSB2aWV3LCB0aGUgYmVzdCBvcHRpb24gaXMgdG9cbiAqIHVzZSBhIHNlcnZpY2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdjZnAubG9hZGluZ0JhcicsIFtdKVxuICAucHJvdmlkZXIoJ2NmcExvYWRpbmdCYXInLCBmdW5jdGlvbigpIHtcblxuICAgIHRoaXMuYXV0b0luY3JlbWVudCA9IHRydWU7XG4gICAgdGhpcy5pbmNsdWRlU3Bpbm5lciA9IHRydWU7XG4gICAgdGhpcy5pbmNsdWRlQmFyID0gdHJ1ZTtcbiAgICB0aGlzLmxhdGVuY3lUaHJlc2hvbGQgPSAxMDA7XG4gICAgdGhpcy5zdGFydFNpemUgPSAwLjAyO1xuICAgIHRoaXMucGFyZW50U2VsZWN0b3IgPSAnYm9keSc7XG4gICAgdGhpcy5zcGlubmVyVGVtcGxhdGUgPSAnPGRpdiBpZD1cImxvYWRpbmctYmFyLXNwaW5uZXJcIj48ZGl2IGNsYXNzPVwic3Bpbm5lci1pY29uXCI+PC9kaXY+PC9kaXY+JztcbiAgICB0aGlzLmxvYWRpbmdCYXJUZW1wbGF0ZSA9ICc8ZGl2IGlkPVwibG9hZGluZy1iYXJcIj48ZGl2IGNsYXNzPVwiYmFyXCI+PGRpdiBjbGFzcz1cInBlZ1wiPjwvZGl2PjwvZGl2PjwvZGl2Pic7XG5cbiAgICB0aGlzLiRnZXQgPSBbJyRpbmplY3RvcicsICckZG9jdW1lbnQnLCAnJHRpbWVvdXQnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkaW5qZWN0b3IsICRkb2N1bWVudCwgJHRpbWVvdXQsICRyb290U2NvcGUpIHtcbiAgICAgIHZhciAkYW5pbWF0ZTtcbiAgICAgIHZhciAkcGFyZW50U2VsZWN0b3IgPSB0aGlzLnBhcmVudFNlbGVjdG9yLFxuICAgICAgICBsb2FkaW5nQmFyQ29udGFpbmVyID0gYW5ndWxhci5lbGVtZW50KHRoaXMubG9hZGluZ0JhclRlbXBsYXRlKSxcbiAgICAgICAgbG9hZGluZ0JhciA9IGxvYWRpbmdCYXJDb250YWluZXIuZmluZCgnZGl2JykuZXEoMCksXG4gICAgICAgIHNwaW5uZXIgPSBhbmd1bGFyLmVsZW1lbnQodGhpcy5zcGlubmVyVGVtcGxhdGUpO1xuXG4gICAgICB2YXIgaW5jVGltZW91dCxcbiAgICAgICAgY29tcGxldGVUaW1lb3V0LFxuICAgICAgICBzdGFydGVkID0gZmFsc2UsXG4gICAgICAgIHN0YXR1cyA9IDA7XG5cbiAgICAgIHZhciBhdXRvSW5jcmVtZW50ID0gdGhpcy5hdXRvSW5jcmVtZW50O1xuICAgICAgdmFyIGluY2x1ZGVTcGlubmVyID0gdGhpcy5pbmNsdWRlU3Bpbm5lcjtcbiAgICAgIHZhciBpbmNsdWRlQmFyID0gdGhpcy5pbmNsdWRlQmFyO1xuICAgICAgdmFyIHN0YXJ0U2l6ZSA9IHRoaXMuc3RhcnRTaXplO1xuXG4gICAgICAvKipcbiAgICAgICAqIEluc2VydHMgdGhlIGxvYWRpbmcgYmFyIGVsZW1lbnQgaW50byB0aGUgZG9tLCBhbmQgc2V0cyBpdCB0byAyJVxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBfc3RhcnQoKSB7XG4gICAgICAgIGlmICghJGFuaW1hdGUpIHtcbiAgICAgICAgICAkYW5pbWF0ZSA9ICRpbmplY3Rvci5nZXQoJyRhbmltYXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICAkdGltZW91dC5jYW5jZWwoY29tcGxldGVUaW1lb3V0KTtcblxuICAgICAgICAvLyBkbyBub3QgY29udGludWFsbHkgYnJvYWRjYXN0IHRoZSBzdGFydGVkIGV2ZW50OlxuICAgICAgICBpZiAoc3RhcnRlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkb2N1bWVudCA9ICRkb2N1bWVudFswXTtcbiAgICAgICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgP1xuICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJHBhcmVudFNlbGVjdG9yKVxuICAgICAgICAgIDogJGRvY3VtZW50LmZpbmQoJHBhcmVudFNlbGVjdG9yKVswXVxuICAgICAgICA7XG5cbiAgICAgICAgaWYgKCEgcGFyZW50KSB7XG4gICAgICAgICAgcGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkcGFyZW50ID0gYW5ndWxhci5lbGVtZW50KHBhcmVudCk7XG4gICAgICAgIHZhciAkYWZ0ZXIgPSBwYXJlbnQubGFzdENoaWxkICYmIGFuZ3VsYXIuZWxlbWVudChwYXJlbnQubGFzdENoaWxkKTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2NmcExvYWRpbmdCYXI6c3RhcnRlZCcpO1xuICAgICAgICBzdGFydGVkID0gdHJ1ZTtcblxuICAgICAgICBpZiAoaW5jbHVkZUJhcikge1xuICAgICAgICAgICRhbmltYXRlLmVudGVyKGxvYWRpbmdCYXJDb250YWluZXIsICRwYXJlbnQsICRhZnRlcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5jbHVkZVNwaW5uZXIpIHtcbiAgICAgICAgICAkYW5pbWF0ZS5lbnRlcihzcGlubmVyLCAkcGFyZW50LCBsb2FkaW5nQmFyQ29udGFpbmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9zZXQoc3RhcnRTaXplKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgdGhlIGxvYWRpbmcgYmFyJ3Mgd2lkdGggdG8gYSBjZXJ0YWluIHBlcmNlbnQuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIG4gYW55IHZhbHVlIGJldHdlZW4gMCBhbmQgMVxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBfc2V0KG4pIHtcbiAgICAgICAgaWYgKCFzdGFydGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwY3QgPSAobiAqIDEwMCkgKyAnJSc7XG4gICAgICAgIGxvYWRpbmdCYXIuY3NzKCd3aWR0aCcsIHBjdCk7XG4gICAgICAgIHN0YXR1cyA9IG47XG5cbiAgICAgICAgLy8gaW5jcmVtZW50IGxvYWRpbmdiYXIgdG8gZ2l2ZSB0aGUgaWxsdXNpb24gdGhhdCB0aGVyZSBpcyBhbHdheXNcbiAgICAgICAgLy8gcHJvZ3Jlc3MgYnV0IG1ha2Ugc3VyZSB0byBjYW5jZWwgdGhlIHByZXZpb3VzIHRpbWVvdXRzIHNvIHdlIGRvbid0XG4gICAgICAgIC8vIGhhdmUgbXVsdGlwbGUgaW5jcyBydW5uaW5nIGF0IHRoZSBzYW1lIHRpbWUuXG4gICAgICAgIGlmIChhdXRvSW5jcmVtZW50KSB7XG4gICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKGluY1RpbWVvdXQpO1xuICAgICAgICAgIGluY1RpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF9pbmMoKTtcbiAgICAgICAgICB9LCAyNTApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogSW5jcmVtZW50cyB0aGUgbG9hZGluZyBiYXIgYnkgYSByYW5kb20gYW1vdW50XG4gICAgICAgKiBidXQgc2xvd3MgZG93biBhcyBpdCBwcm9ncmVzc2VzXG4gICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIF9pbmMoKSB7XG4gICAgICAgIGlmIChfc3RhdHVzKCkgPj0gMSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBybmQgPSAwO1xuXG4gICAgICAgIC8vIFRPRE86IGRvIHRoaXMgbWF0aG1hdGljYWxseSBpbnN0ZWFkIG9mIHRocm91Z2ggY29uZGl0aW9uc1xuXG4gICAgICAgIHZhciBzdGF0ID0gX3N0YXR1cygpO1xuICAgICAgICBpZiAoc3RhdCA+PSAwICYmIHN0YXQgPCAwLjI1KSB7XG4gICAgICAgICAgLy8gU3RhcnQgb3V0IGJldHdlZW4gMyAtIDYlIGluY3JlbWVudHNcbiAgICAgICAgICBybmQgPSAoTWF0aC5yYW5kb20oKSAqICg1IC0gMyArIDEpICsgMykgLyAxMDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdCA+PSAwLjI1ICYmIHN0YXQgPCAwLjY1KSB7XG4gICAgICAgICAgLy8gaW5jcmVtZW50IGJldHdlZW4gMCAtIDMlXG4gICAgICAgICAgcm5kID0gKE1hdGgucmFuZG9tKCkgKiAzKSAvIDEwMDtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ID49IDAuNjUgJiYgc3RhdCA8IDAuOSkge1xuICAgICAgICAgIC8vIGluY3JlbWVudCBiZXR3ZWVuIDAgLSAyJVxuICAgICAgICAgIHJuZCA9IChNYXRoLnJhbmRvbSgpICogMikgLyAxMDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdCA+PSAwLjkgJiYgc3RhdCA8IDAuOTkpIHtcbiAgICAgICAgICAvLyBmaW5hbGx5LCBpbmNyZW1lbnQgaXQgLjUgJVxuICAgICAgICAgIHJuZCA9IDAuMDA1O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGFmdGVyIDk5JSwgZG9uJ3QgaW5jcmVtZW50OlxuICAgICAgICAgIHJuZCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGN0ID0gX3N0YXR1cygpICsgcm5kO1xuICAgICAgICBfc2V0KHBjdCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIF9zdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIF9jb21wbGV0ZUFuaW1hdGlvbigpIHtcbiAgICAgICAgc3RhdHVzID0gMDtcbiAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBfY29tcGxldGUoKSB7XG4gICAgICAgIGlmICghJGFuaW1hdGUpIHtcbiAgICAgICAgICAkYW5pbWF0ZSA9ICRpbmplY3Rvci5nZXQoJyRhbmltYXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2NmcExvYWRpbmdCYXI6Y29tcGxldGVkJyk7XG4gICAgICAgIF9zZXQoMSk7XG5cbiAgICAgICAgJHRpbWVvdXQuY2FuY2VsKGNvbXBsZXRlVGltZW91dCk7XG5cbiAgICAgICAgLy8gQXR0ZW1wdCB0byBhZ2dyZWdhdGUgYW55IHN0YXJ0L2NvbXBsZXRlIGNhbGxzIHdpdGhpbiA1MDBtczpcbiAgICAgICAgY29tcGxldGVUaW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHByb21pc2UgPSAkYW5pbWF0ZS5sZWF2ZShsb2FkaW5nQmFyQ29udGFpbmVyLCBfY29tcGxldGVBbmltYXRpb24pO1xuICAgICAgICAgIGlmIChwcm9taXNlICYmIHByb21pc2UudGhlbikge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKF9jb21wbGV0ZUFuaW1hdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgICRhbmltYXRlLmxlYXZlKHNwaW5uZXIpO1xuICAgICAgICB9LCA1MDApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCAgICAgICAgICAgIDogX3N0YXJ0LFxuICAgICAgICBzZXQgICAgICAgICAgICAgIDogX3NldCxcbiAgICAgICAgc3RhdHVzICAgICAgICAgICA6IF9zdGF0dXMsXG4gICAgICAgIGluYyAgICAgICAgICAgICAgOiBfaW5jLFxuICAgICAgICBjb21wbGV0ZSAgICAgICAgIDogX2NvbXBsZXRlLFxuICAgICAgICBhdXRvSW5jcmVtZW50ICAgIDogdGhpcy5hdXRvSW5jcmVtZW50LFxuICAgICAgICBpbmNsdWRlU3Bpbm5lciAgIDogdGhpcy5pbmNsdWRlU3Bpbm5lcixcbiAgICAgICAgbGF0ZW5jeVRocmVzaG9sZCA6IHRoaXMubGF0ZW5jeVRocmVzaG9sZCxcbiAgICAgICAgcGFyZW50U2VsZWN0b3IgICA6IHRoaXMucGFyZW50U2VsZWN0b3IsXG4gICAgICAgIHN0YXJ0U2l6ZSAgICAgICAgOiB0aGlzLnN0YXJ0U2l6ZVxuICAgICAgfTtcblxuXG4gICAgfV07ICAgICAvL1xuICB9KTsgICAgICAgLy8gd3RmIGphdmFzY3JpcHQuIHNyc2x5XG59KSgpOyAgICAgICAvL1xuIl19

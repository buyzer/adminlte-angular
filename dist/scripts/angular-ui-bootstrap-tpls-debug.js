/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 2.5.0 - 2017-01-28
 * License: MIT
 */angular.module("ui.bootstrap", ["ui.bootstrap.tpls", "ui.bootstrap.collapse","ui.bootstrap.tabindex","ui.bootstrap.accordion","ui.bootstrap.alert","ui.bootstrap.buttons","ui.bootstrap.carousel","ui.bootstrap.dateparser","ui.bootstrap.isClass","ui.bootstrap.datepicker","ui.bootstrap.position","ui.bootstrap.datepickerPopup","ui.bootstrap.debounce","ui.bootstrap.multiMap","ui.bootstrap.dropdown","ui.bootstrap.stackedMap","ui.bootstrap.modal","ui.bootstrap.paging","ui.bootstrap.pager","ui.bootstrap.pagination","ui.bootstrap.tooltip","ui.bootstrap.popover","ui.bootstrap.progressbar","ui.bootstrap.rating","ui.bootstrap.tabs","ui.bootstrap.timepicker","ui.bootstrap.typeahead"]);
angular.module("ui.bootstrap.tpls", ["uib/template/accordion/accordion-group.html","uib/template/accordion/accordion.html","uib/template/alert/alert.html","uib/template/carousel/carousel.html","uib/template/carousel/slide.html","uib/template/datepicker/datepicker.html","uib/template/datepicker/day.html","uib/template/datepicker/month.html","uib/template/datepicker/year.html","uib/template/datepickerPopup/popup.html","uib/template/modal/window.html","uib/template/pager/pager.html","uib/template/pagination/pagination.html","uib/template/tooltip/tooltip-html-popup.html","uib/template/tooltip/tooltip-popup.html","uib/template/tooltip/tooltip-template-popup.html","uib/template/popover/popover-html.html","uib/template/popover/popover-template.html","uib/template/popover/popover.html","uib/template/progressbar/bar.html","uib/template/progressbar/progress.html","uib/template/progressbar/progressbar.html","uib/template/rating/rating.html","uib/template/tabs/tab.html","uib/template/tabs/tabset.html","uib/template/timepicker/timepicker.html","uib/template/typeahead/typeahead-match.html","uib/template/typeahead/typeahead-popup.html"]);
angular.module('ui.bootstrap.collapse', [])

  .directive('uibCollapse', ['$animate', '$q', '$parse', '$injector', function($animate, $q, $parse, $injector) {
    var $animateCss = $injector.has('$animateCss') ? $injector.get('$animateCss') : null;
    return {
      link: function(scope, element, attrs) {
        var expandingExpr = $parse(attrs.expanding),
          expandedExpr = $parse(attrs.expanded),
          collapsingExpr = $parse(attrs.collapsing),
          collapsedExpr = $parse(attrs.collapsed),
          horizontal = false,
          css = {},
          cssTo = {};

        init();

        function init() {
          horizontal = !!('horizontal' in attrs);
          if (horizontal) {
            css = {
              width: ''
            };
            cssTo = {width: '0'};
          } else {
            css = {
              height: ''
            };
            cssTo = {height: '0'};
          }
          if (!scope.$eval(attrs.uibCollapse)) {
            element.addClass('in')
              .addClass('collapse')
              .attr('aria-expanded', true)
              .attr('aria-hidden', false)
              .css(css);
          }
        }

        function getScrollFromElement(element) {
          if (horizontal) {
            return {width: element.scrollWidth + 'px'};
          }
          return {height: element.scrollHeight + 'px'};
        }

        function expand() {
          if (element.hasClass('collapse') && element.hasClass('in')) {
            return;
          }

          $q.resolve(expandingExpr(scope))
            .then(function() {
              element.removeClass('collapse')
                .addClass('collapsing')
                .attr('aria-expanded', true)
                .attr('aria-hidden', false);

              if ($animateCss) {
                $animateCss(element, {
                  addClass: 'in',
                  easing: 'ease',
                  css: {
                    overflow: 'hidden'
                  },
                  to: getScrollFromElement(element[0])
                }).start()['finally'](expandDone);
              } else {
                $animate.addClass(element, 'in', {
                  css: {
                    overflow: 'hidden'
                  },
                  to: getScrollFromElement(element[0])
                }).then(expandDone);
              }
            }, angular.noop);
        }

        function expandDone() {
          element.removeClass('collapsing')
            .addClass('collapse')
            .css(css);
          expandedExpr(scope);
        }

        function collapse() {
          if (!element.hasClass('collapse') && !element.hasClass('in')) {
            return collapseDone();
          }

          $q.resolve(collapsingExpr(scope))
            .then(function() {
              element
              // IMPORTANT: The width must be set before adding "collapsing" class.
              // Otherwise, the browser attempts to animate from width 0 (in
              // collapsing class) to the given width here.
                .css(getScrollFromElement(element[0]))
                // initially all panel collapse have the collapse class, this removal
                // prevents the animation from jumping to collapsed state
                .removeClass('collapse')
                .addClass('collapsing')
                .attr('aria-expanded', false)
                .attr('aria-hidden', true);

              if ($animateCss) {
                $animateCss(element, {
                  removeClass: 'in',
                  to: cssTo
                }).start()['finally'](collapseDone);
              } else {
                $animate.removeClass(element, 'in', {
                  to: cssTo
                }).then(collapseDone);
              }
            }, angular.noop);
        }

        function collapseDone() {
          element.css(cssTo); // Required so that collapse works when animation is disabled
          element.removeClass('collapsing')
            .addClass('collapse');
          collapsedExpr(scope);
        }

        scope.$watch(attrs.uibCollapse, function(shouldCollapse) {
          if (shouldCollapse) {
            collapse();
          } else {
            expand();
          }
        });
      }
    };
  }]);

angular.module('ui.bootstrap.tabindex', [])

.directive('uibTabindexToggle', function() {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      attrs.$observe('disabled', function(disabled) {
        attrs.$set('tabindex', disabled ? -1 : null);
      });
    }
  };
});

angular.module('ui.bootstrap.accordion', ['ui.bootstrap.collapse', 'ui.bootstrap.tabindex'])

.constant('uibAccordionConfig', {
  closeOthers: true
})

.controller('UibAccordionController', ['$scope', '$attrs', 'uibAccordionConfig', function($scope, $attrs, accordionConfig) {
  // This array keeps track of the accordion groups
  this.groups = [];

  // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
  this.closeOthers = function(openGroup) {
    var closeOthers = angular.isDefined($attrs.closeOthers) ?
      $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
    if (closeOthers) {
      angular.forEach(this.groups, function(group) {
        if (group !== openGroup) {
          group.isOpen = false;
        }
      });
    }
  };

  // This is called from the accordion-group directive to add itself to the accordion
  this.addGroup = function(groupScope) {
    var that = this;
    this.groups.push(groupScope);

    groupScope.$on('$destroy', function(event) {
      that.removeGroup(groupScope);
    });
  };

  // This is called from the accordion-group directive when to remove itself
  this.removeGroup = function(group) {
    var index = this.groups.indexOf(group);
    if (index !== -1) {
      this.groups.splice(index, 1);
    }
  };
}])

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
.directive('uibAccordion', function() {
  return {
    controller: 'UibAccordionController',
    controllerAs: 'accordion',
    transclude: true,
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/accordion/accordion.html';
    }
  };
})

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
.directive('uibAccordionGroup', function() {
  return {
    require: '^uibAccordion',         // We need this directive to be inside an accordion
    transclude: true,              // It transcludes the contents of the directive into the template
    restrict: 'A',
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/accordion/accordion-group.html';
    },
    scope: {
      heading: '@',               // Interpolate the heading attribute onto this scope
      panelClass: '@?',           // Ditto with panelClass
      isOpen: '=?',
      isDisabled: '=?'
    },
    controller: function() {
      this.setHeading = function(element) {
        this.heading = element;
      };
    },
    link: function(scope, element, attrs, accordionCtrl) {
      element.addClass('panel');
      accordionCtrl.addGroup(scope);

      scope.openClass = attrs.openClass || 'panel-open';
      scope.panelClass = attrs.panelClass || 'panel-default';
      scope.$watch('isOpen', function(value) {
        element.toggleClass(scope.openClass, !!value);
        if (value) {
          accordionCtrl.closeOthers(scope);
        }
      });

      scope.toggleOpen = function($event) {
        if (!scope.isDisabled) {
          if (!$event || $event.which === 32) {
            scope.isOpen = !scope.isOpen;
          }
        }
      };

      var id = 'accordiongroup-' + scope.$id + '-' + Math.floor(Math.random() * 10000);
      scope.headingId = id + '-tab';
      scope.panelId = id + '-panel';
    }
  };
})

// Use accordion-heading below an accordion-group to provide a heading containing HTML
.directive('uibAccordionHeading', function() {
  return {
    transclude: true,   // Grab the contents to be used as the heading
    template: '',       // In effect remove this element!
    replace: true,
    require: '^uibAccordionGroup',
    link: function(scope, element, attrs, accordionGroupCtrl, transclude) {
      // Pass the heading to the accordion-group controller
      // so that it can be transcluded into the right place in the template
      // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
      accordionGroupCtrl.setHeading(transclude(scope, angular.noop));
    }
  };
})

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
.directive('uibAccordionTransclude', function() {
  return {
    require: '^uibAccordionGroup',
    link: function(scope, element, attrs, controller) {
      scope.$watch(function() { return controller[attrs.uibAccordionTransclude]; }, function(heading) {
        if (heading) {
          var elem = angular.element(element[0].querySelector(getHeaderSelectors()));
          elem.html('');
          elem.append(heading);
        }
      });
    }
  };

  function getHeaderSelectors() {
      return 'uib-accordion-header,' +
          'data-uib-accordion-header,' +
          'x-uib-accordion-header,' +
          'uib\\:accordion-header,' +
          '[uib-accordion-header],' +
          '[data-uib-accordion-header],' +
          '[x-uib-accordion-header]';
  }
});

angular.module('ui.bootstrap.alert', [])

.controller('UibAlertController', ['$scope', '$element', '$attrs', '$interpolate', '$timeout', function($scope, $element, $attrs, $interpolate, $timeout) {
  $scope.closeable = !!$attrs.close;
  $element.addClass('alert');
  $attrs.$set('role', 'alert');
  if ($scope.closeable) {
    $element.addClass('alert-dismissible');
  }

  var dismissOnTimeout = angular.isDefined($attrs.dismissOnTimeout) ?
    $interpolate($attrs.dismissOnTimeout)($scope.$parent) : null;

  if (dismissOnTimeout) {
    $timeout(function() {
      $scope.close();
    }, parseInt(dismissOnTimeout, 10));
  }
}])

.directive('uibAlert', function() {
  return {
    controller: 'UibAlertController',
    controllerAs: 'alert',
    restrict: 'A',
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/alert/alert.html';
    },
    transclude: true,
    scope: {
      close: '&'
    }
  };
});

angular.module('ui.bootstrap.buttons', [])

.constant('uibButtonConfig', {
  activeClass: 'active',
  toggleEvent: 'click'
})

.controller('UibButtonsController', ['uibButtonConfig', function(buttonConfig) {
  this.activeClass = buttonConfig.activeClass || 'active';
  this.toggleEvent = buttonConfig.toggleEvent || 'click';
}])

.directive('uibBtnRadio', ['$parse', function($parse) {
  return {
    require: ['uibBtnRadio', 'ngModel'],
    controller: 'UibButtonsController',
    controllerAs: 'buttons',
    link: function(scope, element, attrs, ctrls) {
      var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      var uncheckableExpr = $parse(attrs.uibUncheckable);

      element.find('input').css({display: 'none'});

      //model -> UI
      ngModelCtrl.$render = function() {
        element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.uibBtnRadio)));
      };

      //ui->model
      element.on(buttonsCtrl.toggleEvent, function() {
        if (attrs.disabled) {
          return;
        }

        var isActive = element.hasClass(buttonsCtrl.activeClass);

        if (!isActive || angular.isDefined(attrs.uncheckable)) {
          scope.$apply(function() {
            ngModelCtrl.$setViewValue(isActive ? null : scope.$eval(attrs.uibBtnRadio));
            ngModelCtrl.$render();
          });
        }
      });

      if (attrs.uibUncheckable) {
        scope.$watch(uncheckableExpr, function(uncheckable) {
          attrs.$set('uncheckable', uncheckable ? '' : undefined);
        });
      }
    }
  };
}])

.directive('uibBtnCheckbox', function() {
  return {
    require: ['uibBtnCheckbox', 'ngModel'],
    controller: 'UibButtonsController',
    controllerAs: 'button',
    link: function(scope, element, attrs, ctrls) {
      var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];

      element.find('input').css({display: 'none'});

      function getTrueValue() {
        return getCheckboxValue(attrs.btnCheckboxTrue, true);
      }

      function getFalseValue() {
        return getCheckboxValue(attrs.btnCheckboxFalse, false);
      }

      function getCheckboxValue(attribute, defaultValue) {
        return angular.isDefined(attribute) ? scope.$eval(attribute) : defaultValue;
      }

      //model -> UI
      ngModelCtrl.$render = function() {
        element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, getTrueValue()));
      };

      //ui->model
      element.on(buttonsCtrl.toggleEvent, function() {
        if (attrs.disabled) {
          return;
        }

        scope.$apply(function() {
          ngModelCtrl.$setViewValue(element.hasClass(buttonsCtrl.activeClass) ? getFalseValue() : getTrueValue());
          ngModelCtrl.$render();
        });
      });
    }
  };
});

angular.module('ui.bootstrap.carousel', [])

.controller('UibCarouselController', ['$scope', '$element', '$interval', '$timeout', '$animate', function($scope, $element, $interval, $timeout, $animate) {
  var self = this,
    slides = self.slides = $scope.slides = [],
    SLIDE_DIRECTION = 'uib-slideDirection',
    currentIndex = $scope.active,
    currentInterval, isPlaying;

  var destroyed = false;
  $element.addClass('carousel');

  self.addSlide = function(slide, element) {
    slides.push({
      slide: slide,
      element: element
    });
    slides.sort(function(a, b) {
      return +a.slide.index - +b.slide.index;
    });
    //if this is the first slide or the slide is set to active, select it
    if (slide.index === $scope.active || slides.length === 1 && !angular.isNumber($scope.active)) {
      if ($scope.$currentTransition) {
        $scope.$currentTransition = null;
      }

      currentIndex = slide.index;
      $scope.active = slide.index;
      setActive(currentIndex);
      self.select(slides[findSlideIndex(slide)]);
      if (slides.length === 1) {
        $scope.play();
      }
    }
  };

  self.getCurrentIndex = function() {
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].slide.index === currentIndex) {
        return i;
      }
    }
  };

  self.next = $scope.next = function() {
    var newIndex = (self.getCurrentIndex() + 1) % slides.length;

    if (newIndex === 0 && $scope.noWrap()) {
      $scope.pause();
      return;
    }

    return self.select(slides[newIndex], 'next');
  };

  self.prev = $scope.prev = function() {
    var newIndex = self.getCurrentIndex() - 1 < 0 ? slides.length - 1 : self.getCurrentIndex() - 1;

    if ($scope.noWrap() && newIndex === slides.length - 1) {
      $scope.pause();
      return;
    }

    return self.select(slides[newIndex], 'prev');
  };

  self.removeSlide = function(slide) {
    var index = findSlideIndex(slide);

    //get the index of the slide inside the carousel
    slides.splice(index, 1);
    if (slides.length > 0 && currentIndex === index) {
      if (index >= slides.length) {
        currentIndex = slides.length - 1;
        $scope.active = currentIndex;
        setActive(currentIndex);
        self.select(slides[slides.length - 1]);
      } else {
        currentIndex = index;
        $scope.active = currentIndex;
        setActive(currentIndex);
        self.select(slides[index]);
      }
    } else if (currentIndex > index) {
      currentIndex--;
      $scope.active = currentIndex;
    }

    //clean the active value when no more slide
    if (slides.length === 0) {
      currentIndex = null;
      $scope.active = null;
    }
  };

  /* direction: "prev" or "next" */
  self.select = $scope.select = function(nextSlide, direction) {
    var nextIndex = findSlideIndex(nextSlide.slide);
    //Decide direction if it's not given
    if (direction === undefined) {
      direction = nextIndex > self.getCurrentIndex() ? 'next' : 'prev';
    }
    //Prevent this user-triggered transition from occurring if there is already one in progress
    if (nextSlide.slide.index !== currentIndex &&
      !$scope.$currentTransition) {
      goNext(nextSlide.slide, nextIndex, direction);
    }
  };

  /* Allow outside people to call indexOf on slides array */
  $scope.indexOfSlide = function(slide) {
    return +slide.slide.index;
  };

  $scope.isActive = function(slide) {
    return $scope.active === slide.slide.index;
  };

  $scope.isPrevDisabled = function() {
    return $scope.active === 0 && $scope.noWrap();
  };

  $scope.isNextDisabled = function() {
    return $scope.active === slides.length - 1 && $scope.noWrap();
  };

  $scope.pause = function() {
    if (!$scope.noPause) {
      isPlaying = false;
      resetTimer();
    }
  };

  $scope.play = function() {
    if (!isPlaying) {
      isPlaying = true;
      restartTimer();
    }
  };

  $element.on('mouseenter', $scope.pause);
  $element.on('mouseleave', $scope.play);

  $scope.$on('$destroy', function() {
    destroyed = true;
    resetTimer();
  });

  $scope.$watch('noTransition', function(noTransition) {
    $animate.enabled($element, !noTransition);
  });

  $scope.$watch('interval', restartTimer);

  $scope.$watchCollection('slides', resetTransition);

  $scope.$watch('active', function(index) {
    if (angular.isNumber(index) && currentIndex !== index) {
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].slide.index === index) {
          index = i;
          break;
        }
      }

      var slide = slides[index];
      if (slide) {
        setActive(index);
        self.select(slides[index]);
        currentIndex = index;
      }
    }
  });

  function getSlideByIndex(index) {
    for (var i = 0, l = slides.length; i < l; ++i) {
      if (slides[i].index === index) {
        return slides[i];
      }
    }
  }

  function setActive(index) {
    for (var i = 0; i < slides.length; i++) {
      slides[i].slide.active = i === index;
    }
  }

  function goNext(slide, index, direction) {
    if (destroyed) {
      return;
    }

    angular.extend(slide, {direction: direction});
    angular.extend(slides[currentIndex].slide || {}, {direction: direction});
    if ($animate.enabled($element) && !$scope.$currentTransition &&
      slides[index].element && self.slides.length > 1) {
      slides[index].element.data(SLIDE_DIRECTION, slide.direction);
      var currentIdx = self.getCurrentIndex();

      if (angular.isNumber(currentIdx) && slides[currentIdx].element) {
        slides[currentIdx].element.data(SLIDE_DIRECTION, slide.direction);
      }

      $scope.$currentTransition = true;
      $animate.on('addClass', slides[index].element, function(element, phase) {
        if (phase === 'close') {
          $scope.$currentTransition = null;
          $animate.off('addClass', element);
        }
      });
    }

    $scope.active = slide.index;
    currentIndex = slide.index;
    setActive(index);

    //every time you change slides, reset the timer
    restartTimer();
  }

  function findSlideIndex(slide) {
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].slide === slide) {
        return i;
      }
    }
  }

  function resetTimer() {
    if (currentInterval) {
      $interval.cancel(currentInterval);
      currentInterval = null;
    }
  }

  function resetTransition(slides) {
    if (!slides.length) {
      $scope.$currentTransition = null;
    }
  }

  function restartTimer() {
    resetTimer();
    var interval = +$scope.interval;
    if (!isNaN(interval) && interval > 0) {
      currentInterval = $interval(timerFn, interval);
    }
  }

  function timerFn() {
    var interval = +$scope.interval;
    if (isPlaying && !isNaN(interval) && interval > 0 && slides.length) {
      $scope.next();
    } else {
      $scope.pause();
    }
  }
}])

.directive('uibCarousel', function() {
  return {
    transclude: true,
    controller: 'UibCarouselController',
    controllerAs: 'carousel',
    restrict: 'A',
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/carousel/carousel.html';
    },
    scope: {
      active: '=',
      interval: '=',
      noTransition: '=',
      noPause: '=',
      noWrap: '&'
    }
  };
})

.directive('uibSlide', ['$animate', function($animate) {
  return {
    require: '^uibCarousel',
    restrict: 'A',
    transclude: true,
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/carousel/slide.html';
    },
    scope: {
      actual: '=?',
      index: '=?'
    },
    link: function (scope, element, attrs, carouselCtrl) {
      element.addClass('item');
      carouselCtrl.addSlide(scope, element);
      //when the scope is destroyed then remove the slide from the current slides array
      scope.$on('$destroy', function() {
        carouselCtrl.removeSlide(scope);
      });

      scope.$watch('active', function(active) {
        $animate[active ? 'addClass' : 'removeClass'](element, 'active');
      });
    }
  };
}])

.animation('.item', ['$animateCss',
function($animateCss) {
  var SLIDE_DIRECTION = 'uib-slideDirection';

  function removeClass(element, className, callback) {
    element.removeClass(className);
    if (callback) {
      callback();
    }
  }

  return {
    beforeAddClass: function(element, className, done) {
      if (className === 'active') {
        var stopped = false;
        var direction = element.data(SLIDE_DIRECTION);
        var directionClass = direction === 'next' ? 'left' : 'right';
        var removeClassFn = removeClass.bind(this, element,
          directionClass + ' ' + direction, done);
        element.addClass(direction);

        $animateCss(element, {addClass: directionClass})
          .start()
          .done(removeClassFn);

        return function() {
          stopped = true;
        };
      }
      done();
    },
    beforeRemoveClass: function (element, className, done) {
      if (className === 'active') {
        var stopped = false;
        var direction = element.data(SLIDE_DIRECTION);
        var directionClass = direction === 'next' ? 'left' : 'right';
        var removeClassFn = removeClass.bind(this, element, directionClass, done);

        $animateCss(element, {addClass: directionClass})
          .start()
          .done(removeClassFn);

        return function() {
          stopped = true;
        };
      }
      done();
    }
  };
}]);

angular.module('ui.bootstrap.dateparser', [])

.service('uibDateParser', ['$log', '$locale', 'dateFilter', 'orderByFilter', 'filterFilter', function($log, $locale, dateFilter, orderByFilter, filterFilter) {
  // Pulled from https://github.com/mbostock/d3/blob/master/src/format/requote.js
  var SPECIAL_CHARACTERS_REGEXP = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

  var localeId;
  var formatCodeToRegex;

  this.init = function() {
    localeId = $locale.id;

    this.parsers = {};
    this.formatters = {};

    formatCodeToRegex = [
      {
        key: 'yyyy',
        regex: '\\d{4}',
        apply: function(value) { this.year = +value; },
        formatter: function(date) {
          var _date = new Date();
          _date.setFullYear(Math.abs(date.getFullYear()));
          return dateFilter(_date, 'yyyy');
        }
      },
      {
        key: 'yy',
        regex: '\\d{2}',
        apply: function(value) { value = +value; this.year = value < 69 ? value + 2000 : value + 1900; },
        formatter: function(date) {
          var _date = new Date();
          _date.setFullYear(Math.abs(date.getFullYear()));
          return dateFilter(_date, 'yy');
        }
      },
      {
        key: 'y',
        regex: '\\d{1,4}',
        apply: function(value) { this.year = +value; },
        formatter: function(date) {
          var _date = new Date();
          _date.setFullYear(Math.abs(date.getFullYear()));
          return dateFilter(_date, 'y');
        }
      },
      {
        key: 'M!',
        regex: '0?[1-9]|1[0-2]',
        apply: function(value) { this.month = value - 1; },
        formatter: function(date) {
          var value = date.getMonth();
          if (/^[0-9]$/.test(value)) {
            return dateFilter(date, 'MM');
          }

          return dateFilter(date, 'M');
        }
      },
      {
        key: 'MMMM',
        regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
        apply: function(value) { this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value); },
        formatter: function(date) { return dateFilter(date, 'MMMM'); }
      },
      {
        key: 'MMM',
        regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
        apply: function(value) { this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value); },
        formatter: function(date) { return dateFilter(date, 'MMM'); }
      },
      {
        key: 'MM',
        regex: '0[1-9]|1[0-2]',
        apply: function(value) { this.month = value - 1; },
        formatter: function(date) { return dateFilter(date, 'MM'); }
      },
      {
        key: 'M',
        regex: '[1-9]|1[0-2]',
        apply: function(value) { this.month = value - 1; },
        formatter: function(date) { return dateFilter(date, 'M'); }
      },
      {
        key: 'd!',
        regex: '[0-2]?[0-9]{1}|3[0-1]{1}',
        apply: function(value) { this.date = +value; },
        formatter: function(date) {
          var value = date.getDate();
          if (/^[1-9]$/.test(value)) {
            return dateFilter(date, 'dd');
          }

          return dateFilter(date, 'd');
        }
      },
      {
        key: 'dd',
        regex: '[0-2][0-9]{1}|3[0-1]{1}',
        apply: function(value) { this.date = +value; },
        formatter: function(date) { return dateFilter(date, 'dd'); }
      },
      {
        key: 'd',
        regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
        apply: function(value) { this.date = +value; },
        formatter: function(date) { return dateFilter(date, 'd'); }
      },
      {
        key: 'EEEE',
        regex: $locale.DATETIME_FORMATS.DAY.join('|'),
        formatter: function(date) { return dateFilter(date, 'EEEE'); }
      },
      {
        key: 'EEE',
        regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|'),
        formatter: function(date) { return dateFilter(date, 'EEE'); }
      },
      {
        key: 'HH',
        regex: '(?:0|1)[0-9]|2[0-3]',
        apply: function(value) { this.hours = +value; },
        formatter: function(date) { return dateFilter(date, 'HH'); }
      },
      {
        key: 'hh',
        regex: '0[0-9]|1[0-2]',
        apply: function(value) { this.hours = +value; },
        formatter: function(date) { return dateFilter(date, 'hh'); }
      },
      {
        key: 'H',
        regex: '1?[0-9]|2[0-3]',
        apply: function(value) { this.hours = +value; },
        formatter: function(date) { return dateFilter(date, 'H'); }
      },
      {
        key: 'h',
        regex: '[0-9]|1[0-2]',
        apply: function(value) { this.hours = +value; },
        formatter: function(date) { return dateFilter(date, 'h'); }
      },
      {
        key: 'mm',
        regex: '[0-5][0-9]',
        apply: function(value) { this.minutes = +value; },
        formatter: function(date) { return dateFilter(date, 'mm'); }
      },
      {
        key: 'm',
        regex: '[0-9]|[1-5][0-9]',
        apply: function(value) { this.minutes = +value; },
        formatter: function(date) { return dateFilter(date, 'm'); }
      },
      {
        key: 'sss',
        regex: '[0-9][0-9][0-9]',
        apply: function(value) { this.milliseconds = +value; },
        formatter: function(date) { return dateFilter(date, 'sss'); }
      },
      {
        key: 'ss',
        regex: '[0-5][0-9]',
        apply: function(value) { this.seconds = +value; },
        formatter: function(date) { return dateFilter(date, 'ss'); }
      },
      {
        key: 's',
        regex: '[0-9]|[1-5][0-9]',
        apply: function(value) { this.seconds = +value; },
        formatter: function(date) { return dateFilter(date, 's'); }
      },
      {
        key: 'a',
        regex: $locale.DATETIME_FORMATS.AMPMS.join('|'),
        apply: function(value) {
          if (this.hours === 12) {
            this.hours = 0;
          }

          if (value === 'PM') {
            this.hours += 12;
          }
        },
        formatter: function(date) { return dateFilter(date, 'a'); }
      },
      {
        key: 'Z',
        regex: '[+-]\\d{4}',
        apply: function(value) {
          var matches = value.match(/([+-])(\d{2})(\d{2})/),
            sign = matches[1],
            hours = matches[2],
            minutes = matches[3];
          this.hours += toInt(sign + hours);
          this.minutes += toInt(sign + minutes);
        },
        formatter: function(date) {
          return dateFilter(date, 'Z');
        }
      },
      {
        key: 'ww',
        regex: '[0-4][0-9]|5[0-3]',
        formatter: function(date) { return dateFilter(date, 'ww'); }
      },
      {
        key: 'w',
        regex: '[0-9]|[1-4][0-9]|5[0-3]',
        formatter: function(date) { return dateFilter(date, 'w'); }
      },
      {
        key: 'GGGG',
        regex: $locale.DATETIME_FORMATS.ERANAMES.join('|').replace(/\s/g, '\\s'),
        formatter: function(date) { return dateFilter(date, 'GGGG'); }
      },
      {
        key: 'GGG',
        regex: $locale.DATETIME_FORMATS.ERAS.join('|'),
        formatter: function(date) { return dateFilter(date, 'GGG'); }
      },
      {
        key: 'GG',
        regex: $locale.DATETIME_FORMATS.ERAS.join('|'),
        formatter: function(date) { return dateFilter(date, 'GG'); }
      },
      {
        key: 'G',
        regex: $locale.DATETIME_FORMATS.ERAS.join('|'),
        formatter: function(date) { return dateFilter(date, 'G'); }
      }
    ];

    if (angular.version.major >= 1 && angular.version.minor > 4) {
      formatCodeToRegex.push({
        key: 'LLLL',
        regex: $locale.DATETIME_FORMATS.STANDALONEMONTH.join('|'),
        apply: function(value) { this.month = $locale.DATETIME_FORMATS.STANDALONEMONTH.indexOf(value); },
        formatter: function(date) { return dateFilter(date, 'LLLL'); }
      });
    }
  };

  this.init();

  function getFormatCodeToRegex(key) {
    return filterFilter(formatCodeToRegex, {key: key}, true)[0];
  }

  this.getParser = function (key) {
    var f = getFormatCodeToRegex(key);
    return f && f.apply || null;
  };

  this.overrideParser = function (key, parser) {
    var f = getFormatCodeToRegex(key);
    if (f && angular.isFunction(parser)) {
      this.parsers = {};
      f.apply = parser;
    }
  }.bind(this);

  function createParser(format) {
    var map = [], regex = format.split('');

    // check for literal values
    var quoteIndex = format.indexOf('\'');
    if (quoteIndex > -1) {
      var inLiteral = false;
      format = format.split('');
      for (var i = quoteIndex; i < format.length; i++) {
        if (inLiteral) {
          if (format[i] === '\'') {
            if (i + 1 < format.length && format[i+1] === '\'') { // escaped single quote
              format[i+1] = '$';
              regex[i+1] = '';
            } else { // end of literal
              regex[i] = '';
              inLiteral = false;
            }
          }
          format[i] = '$';
        } else {
          if (format[i] === '\'') { // start of literal
            format[i] = '$';
            regex[i] = '';
            inLiteral = true;
          }
        }
      }

      format = format.join('');
    }

    angular.forEach(formatCodeToRegex, function(data) {
      var index = format.indexOf(data.key);

      if (index > -1) {
        format = format.split('');

        regex[index] = '(' + data.regex + ')';
        format[index] = '$'; // Custom symbol to define consumed part of format
        for (var i = index + 1, n = index + data.key.length; i < n; i++) {
          regex[i] = '';
          format[i] = '$';
        }
        format = format.join('');

        map.push({
          index: index,
          key: data.key,
          apply: data.apply,
          matcher: data.regex
        });
      }
    });

    return {
      regex: new RegExp('^' + regex.join('') + '$'),
      map: orderByFilter(map, 'index')
    };
  }

  function createFormatter(format) {
    var formatters = [];
    var i = 0;
    var formatter, literalIdx;
    while (i < format.length) {
      if (angular.isNumber(literalIdx)) {
        if (format.charAt(i) === '\'') {
          if (i + 1 >= format.length || format.charAt(i + 1) !== '\'') {
            formatters.push(constructLiteralFormatter(format, literalIdx, i));
            literalIdx = null;
          }
        } else if (i === format.length) {
          while (literalIdx < format.length) {
            formatter = constructFormatterFromIdx(format, literalIdx);
            formatters.push(formatter);
            literalIdx = formatter.endIdx;
          }
        }

        i++;
        continue;
      }

      if (format.charAt(i) === '\'') {
        literalIdx = i;
        i++;
        continue;
      }

      formatter = constructFormatterFromIdx(format, i);

      formatters.push(formatter.parser);
      i = formatter.endIdx;
    }

    return formatters;
  }

  function constructLiteralFormatter(format, literalIdx, endIdx) {
    return function() {
      return format.substr(literalIdx + 1, endIdx - literalIdx - 1);
    };
  }

  function constructFormatterFromIdx(format, i) {
    var currentPosStr = format.substr(i);
    for (var j = 0; j < formatCodeToRegex.length; j++) {
      if (new RegExp('^' + formatCodeToRegex[j].key).test(currentPosStr)) {
        var data = formatCodeToRegex[j];
        return {
          endIdx: i + data.key.length,
          parser: data.formatter
        };
      }
    }

    return {
      endIdx: i + 1,
      parser: function() {
        return currentPosStr.charAt(0);
      }
    };
  }

  this.filter = function(date, format) {
    if (!angular.isDate(date) || isNaN(date) || !format) {
      return '';
    }

    format = $locale.DATETIME_FORMATS[format] || format;

    if ($locale.id !== localeId) {
      this.init();
    }

    if (!this.formatters[format]) {
      this.formatters[format] = createFormatter(format);
    }

    var formatters = this.formatters[format];

    return formatters.reduce(function(str, formatter) {
      return str + formatter(date);
    }, '');
  };

  this.parse = function(input, format, baseDate) {
    if (!angular.isString(input) || !format) {
      return input;
    }

    format = $locale.DATETIME_FORMATS[format] || format;
    format = format.replace(SPECIAL_CHARACTERS_REGEXP, '\\$&');

    if ($locale.id !== localeId) {
      this.init();
    }

    if (!this.parsers[format]) {
      this.parsers[format] = createParser(format, 'apply');
    }

    var parser = this.parsers[format],
        regex = parser.regex,
        map = parser.map,
        results = input.match(regex),
        tzOffset = false;
    if (results && results.length) {
      var fields, dt;
      if (angular.isDate(baseDate) && !isNaN(baseDate.getTime())) {
        fields = {
          year: baseDate.getFullYear(),
          month: baseDate.getMonth(),
          date: baseDate.getDate(),
          hours: baseDate.getHours(),
          minutes: baseDate.getMinutes(),
          seconds: baseDate.getSeconds(),
          milliseconds: baseDate.getMilliseconds()
        };
      } else {
        if (baseDate) {
          $log.warn('dateparser:', 'baseDate is not a valid date');
        }
        fields = { year: 1900, month: 0, date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
      }

      for (var i = 1, n = results.length; i < n; i++) {
        var mapper = map[i - 1];
        if (mapper.matcher === 'Z') {
          tzOffset = true;
        }

        if (mapper.apply) {
          mapper.apply.call(fields, results[i]);
        }
      }

      var datesetter = tzOffset ? Date.prototype.setUTCFullYear :
        Date.prototype.setFullYear;
      var timesetter = tzOffset ? Date.prototype.setUTCHours :
        Date.prototype.setHours;

      if (isValid(fields.year, fields.month, fields.date)) {
        if (angular.isDate(baseDate) && !isNaN(baseDate.getTime()) && !tzOffset) {
          dt = new Date(baseDate);
          datesetter.call(dt, fields.year, fields.month, fields.date);
          timesetter.call(dt, fields.hours, fields.minutes,
            fields.seconds, fields.milliseconds);
        } else {
          dt = new Date(0);
          datesetter.call(dt, fields.year, fields.month, fields.date);
          timesetter.call(dt, fields.hours || 0, fields.minutes || 0,
            fields.seconds || 0, fields.milliseconds || 0);
        }
      }

      return dt;
    }
  };

  // Check if date is valid for specific month (and year for February).
  // Month: 0 = Jan, 1 = Feb, etc
  function isValid(year, month, date) {
    if (date < 1) {
      return false;
    }

    if (month === 1 && date > 28) {
      return date === 29 && (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0);
    }

    if (month === 3 || month === 5 || month === 8 || month === 10) {
      return date < 31;
    }

    return true;
  }

  function toInt(str) {
    return parseInt(str, 10);
  }

  this.toTimezone = toTimezone;
  this.fromTimezone = fromTimezone;
  this.timezoneToOffset = timezoneToOffset;
  this.addDateMinutes = addDateMinutes;
  this.convertTimezoneToLocal = convertTimezoneToLocal;

  function toTimezone(date, timezone) {
    return date && timezone ? convertTimezoneToLocal(date, timezone) : date;
  }

  function fromTimezone(date, timezone) {
    return date && timezone ? convertTimezoneToLocal(date, timezone, true) : date;
  }

  //https://github.com/angular/angular.js/blob/622c42169699ec07fc6daaa19fe6d224e5d2f70e/src/Angular.js#L1207
  function timezoneToOffset(timezone, fallback) {
    timezone = timezone.replace(/:/g, '');
    var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
    return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
  }

  function addDateMinutes(date, minutes) {
    date = new Date(date.getTime());
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  function convertTimezoneToLocal(date, timezone, reverse) {
    reverse = reverse ? -1 : 1;
    var dateTimezoneOffset = date.getTimezoneOffset();
    var timezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
    return addDateMinutes(date, reverse * (timezoneOffset - dateTimezoneOffset));
  }
}]);

// Avoiding use of ng-class as it creates a lot of watchers when a class is to be applied to
// at most one element.
angular.module('ui.bootstrap.isClass', [])
.directive('uibIsClass', [
         '$animate',
function ($animate) {
  //                    11111111          22222222
  var ON_REGEXP = /^\s*([\s\S]+?)\s+on\s+([\s\S]+?)\s*$/;
  //                    11111111           22222222
  var IS_REGEXP = /^\s*([\s\S]+?)\s+for\s+([\s\S]+?)\s*$/;

  var dataPerTracked = {};

  return {
    restrict: 'A',
    compile: function(tElement, tAttrs) {
      var linkedScopes = [];
      var instances = [];
      var expToData = {};
      var lastActivated = null;
      var onExpMatches = tAttrs.uibIsClass.match(ON_REGEXP);
      var onExp = onExpMatches[2];
      var expsStr = onExpMatches[1];
      var exps = expsStr.split(',');

      return linkFn;

      function linkFn(scope, element, attrs) {
        linkedScopes.push(scope);
        instances.push({
          scope: scope,
          element: element
        });

        exps.forEach(function(exp, k) {
          addForExp(exp, scope);
        });

        scope.$on('$destroy', removeScope);
      }

      function addForExp(exp, scope) {
        var matches = exp.match(IS_REGEXP);
        var clazz = scope.$eval(matches[1]);
        var compareWithExp = matches[2];
        var data = expToData[exp];
        if (!data) {
          var watchFn = function(compareWithVal) {
            var newActivated = null;
            instances.some(function(instance) {
              var thisVal = instance.scope.$eval(onExp);
              if (thisVal === compareWithVal) {
                newActivated = instance;
                return true;
              }
            });
            if (data.lastActivated !== newActivated) {
              if (data.lastActivated) {
                $animate.removeClass(data.lastActivated.element, clazz);
              }
              if (newActivated) {
                $animate.addClass(newActivated.element, clazz);
              }
              data.lastActivated = newActivated;
            }
          };
          expToData[exp] = data = {
            lastActivated: null,
            scope: scope,
            watchFn: watchFn,
            compareWithExp: compareWithExp,
            watcher: scope.$watch(compareWithExp, watchFn)
          };
        }
        data.watchFn(scope.$eval(compareWithExp));
      }

      function removeScope(e) {
        var removedScope = e.targetScope;
        var index = linkedScopes.indexOf(removedScope);
        linkedScopes.splice(index, 1);
        instances.splice(index, 1);
        if (linkedScopes.length) {
          var newWatchScope = linkedScopes[0];
          angular.forEach(expToData, function(data) {
            if (data.scope === removedScope) {
              data.watcher = newWatchScope.$watch(data.compareWithExp, data.watchFn);
              data.scope = newWatchScope;
            }
          });
        } else {
          expToData = {};
        }
      }
    }
  };
}]);
angular.module('ui.bootstrap.datepicker', ['ui.bootstrap.dateparser', 'ui.bootstrap.isClass'])

.value('$datepickerSuppressError', false)

.value('$datepickerLiteralWarning', true)

.constant('uibDatepickerConfig', {
  datepickerMode: 'day',
  formatDay: 'dd',
  formatMonth: 'MMMM',
  formatYear: 'yyyy',
  formatDayHeader: 'EEE',
  formatDayTitle: 'MMMM yyyy',
  formatMonthTitle: 'yyyy',
  maxDate: null,
  maxMode: 'year',
  minDate: null,
  minMode: 'day',
  monthColumns: 3,
  ngModelOptions: {},
  shortcutPropagation: false,
  showWeeks: true,
  yearColumns: 5,
  yearRows: 4
})

.controller('UibDatepickerController', ['$scope', '$element', '$attrs', '$parse', '$interpolate', '$locale', '$log', 'dateFilter', 'uibDatepickerConfig', '$datepickerLiteralWarning', '$datepickerSuppressError', 'uibDateParser',
  function($scope, $element, $attrs, $parse, $interpolate, $locale, $log, dateFilter, datepickerConfig, $datepickerLiteralWarning, $datepickerSuppressError, dateParser) {
  var self = this,
      ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl;
      ngModelOptions = {},
      watchListeners = [];

  $element.addClass('uib-datepicker');
  $attrs.$set('role', 'application');

  if (!$scope.datepickerOptions) {
    $scope.datepickerOptions = {};
  }

  // Modes chain
  this.modes = ['day', 'month', 'year'];

  [
    'customClass',
    'dateDisabled',
    'datepickerMode',
    'formatDay',
    'formatDayHeader',
    'formatDayTitle',
    'formatMonth',
    'formatMonthTitle',
    'formatYear',
    'maxDate',
    'maxMode',
    'minDate',
    'minMode',
    'monthColumns',
    'showWeeks',
    'shortcutPropagation',
    'startingDay',
    'yearColumns',
    'yearRows'
  ].forEach(function(key) {
    switch (key) {
      case 'customClass':
      case 'dateDisabled':
        $scope[key] = $scope.datepickerOptions[key] || angular.noop;
        break;
      case 'datepickerMode':
        $scope.datepickerMode = angular.isDefined($scope.datepickerOptions.datepickerMode) ?
          $scope.datepickerOptions.datepickerMode : datepickerConfig.datepickerMode;
        break;
      case 'formatDay':
      case 'formatDayHeader':
      case 'formatDayTitle':
      case 'formatMonth':
      case 'formatMonthTitle':
      case 'formatYear':
        self[key] = angular.isDefined($scope.datepickerOptions[key]) ?
          $interpolate($scope.datepickerOptions[key])($scope.$parent) :
          datepickerConfig[key];
        break;
      case 'monthColumns':
      case 'showWeeks':
      case 'shortcutPropagation':
      case 'yearColumns':
      case 'yearRows':
        self[key] = angular.isDefined($scope.datepickerOptions[key]) ?
          $scope.datepickerOptions[key] : datepickerConfig[key];
        break;
      case 'startingDay':
        if (angular.isDefined($scope.datepickerOptions.startingDay)) {
          self.startingDay = $scope.datepickerOptions.startingDay;
        } else if (angular.isNumber(datepickerConfig.startingDay)) {
          self.startingDay = datepickerConfig.startingDay;
        } else {
          self.startingDay = ($locale.DATETIME_FORMATS.FIRSTDAYOFWEEK + 8) % 7;
        }

        break;
      case 'maxDate':
      case 'minDate':
        $scope.$watch('datepickerOptions.' + key, function(value) {
          if (value) {
            if (angular.isDate(value)) {
              self[key] = dateParser.fromTimezone(new Date(value), ngModelOptions.getOption('timezone'));
            } else {
              if ($datepickerLiteralWarning) {
                $log.warn('Literal date support has been deprecated, please switch to date object usage');
              }

              self[key] = new Date(dateFilter(value, 'medium'));
            }
          } else {
            self[key] = datepickerConfig[key] ?
              dateParser.fromTimezone(new Date(datepickerConfig[key]), ngModelOptions.getOption('timezone')) :
              null;
          }

          self.refreshView();
        });

        break;
      case 'maxMode':
      case 'minMode':
        if ($scope.datepickerOptions[key]) {
          $scope.$watch(function() { return $scope.datepickerOptions[key]; }, function(value) {
            self[key] = $scope[key] = angular.isDefined(value) ? value : $scope.datepickerOptions[key];
            if (key === 'minMode' && self.modes.indexOf($scope.datepickerOptions.datepickerMode) < self.modes.indexOf(self[key]) ||
              key === 'maxMode' && self.modes.indexOf($scope.datepickerOptions.datepickerMode) > self.modes.indexOf(self[key])) {
              $scope.datepickerMode = self[key];
              $scope.datepickerOptions.datepickerMode = self[key];
            }
          });
        } else {
          self[key] = $scope[key] = datepickerConfig[key] || null;
        }

        break;
    }
  });

  $scope.uniqueId = 'datepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);

  $scope.disabled = angular.isDefined($attrs.disabled) || false;
  if (angular.isDefined($attrs.ngDisabled)) {
    watchListeners.push($scope.$parent.$watch($attrs.ngDisabled, function(disabled) {
      $scope.disabled = disabled;
      self.refreshView();
    }));
  }

  $scope.isActive = function(dateObject) {
    if (self.compare(dateObject.date, self.activeDate) === 0) {
      $scope.activeDateId = dateObject.uid;
      return true;
    }
    return false;
  };

  this.init = function(ngModelCtrl_) {
    ngModelCtrl = ngModelCtrl_;
    ngModelOptions = extractOptions(ngModelCtrl);

    if ($scope.datepickerOptions.initDate) {
      self.activeDate = dateParser.fromTimezone($scope.datepickerOptions.initDate, ngModelOptions.getOption('timezone')) || new Date();
      $scope.$watch('datepickerOptions.initDate', function(initDate) {
        if (initDate && (ngModelCtrl.$isEmpty(ngModelCtrl.$modelValue) || ngModelCtrl.$invalid)) {
          self.activeDate = dateParser.fromTimezone(initDate, ngModelOptions.getOption('timezone'));
          self.refreshView();
        }
      });
    } else {
      self.activeDate = new Date();
    }

    var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : new Date();
    this.activeDate = !isNaN(date) ?
      dateParser.fromTimezone(date, ngModelOptions.getOption('timezone')) :
      dateParser.fromTimezone(new Date(), ngModelOptions.getOption('timezone'));

    ngModelCtrl.$render = function() {
      self.render();
    };
  };

  this.render = function() {
    if (ngModelCtrl.$viewValue) {
      var date = new Date(ngModelCtrl.$viewValue),
          isValid = !isNaN(date);

      if (isValid) {
        this.activeDate = dateParser.fromTimezone(date, ngModelOptions.getOption('timezone'));
      } else if (!$datepickerSuppressError) {
        $log.error('Datepicker directive: "ng-model" value must be a Date object');
      }
    }
    this.refreshView();
  };

  this.refreshView = function() {
    if (this.element) {
      $scope.selectedDt = null;
      this._refreshView();
      if ($scope.activeDt) {
        $scope.activeDateId = $scope.activeDt.uid;
      }

      var date = ngModelCtrl.$viewValue ? new Date(ngModelCtrl.$viewValue) : null;
      date = dateParser.fromTimezone(date, ngModelOptions.getOption('timezone'));
      ngModelCtrl.$setValidity('dateDisabled', !date ||
        this.element && !this.isDisabled(date));
    }
  };

  this.createDateObject = function(date, format) {
    var model = ngModelCtrl.$viewValue ? new Date(ngModelCtrl.$viewValue) : null;
    model = dateParser.fromTimezone(model, ngModelOptions.getOption('timezone'));
    var today = new Date();
    today = dateParser.fromTimezone(today, ngModelOptions.getOption('timezone'));
    var time = this.compare(date, today);
    var dt = {
      date: date,
      label: dateParser.filter(date, format),
      selected: model && this.compare(date, model) === 0,
      disabled: this.isDisabled(date),
      past: time < 0,
      current: time === 0,
      future: time > 0,
      customClass: this.customClass(date) || null
    };

    if (model && this.compare(date, model) === 0) {
      $scope.selectedDt = dt;
    }

    if (self.activeDate && this.compare(dt.date, self.activeDate) === 0) {
      $scope.activeDt = dt;
    }

    return dt;
  };

  this.isDisabled = function(date) {
    return $scope.disabled ||
      this.minDate && this.compare(date, this.minDate) < 0 ||
      this.maxDate && this.compare(date, this.maxDate) > 0 ||
      $scope.dateDisabled && $scope.dateDisabled({date: date, mode: $scope.datepickerMode});
  };

  this.customClass = function(date) {
    return $scope.customClass({date: date, mode: $scope.datepickerMode});
  };

  // Split array into smaller arrays
  this.split = function(arr, size) {
    var arrays = [];
    while (arr.length > 0) {
      arrays.push(arr.splice(0, size));
    }
    return arrays;
  };

  $scope.select = function(date) {
    if ($scope.datepickerMode === self.minMode) {
      var dt = ngModelCtrl.$viewValue ? dateParser.fromTimezone(new Date(ngModelCtrl.$viewValue), ngModelOptions.getOption('timezone')) : new Date(0, 0, 0, 0, 0, 0, 0);
      dt.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      dt = dateParser.toTimezone(dt, ngModelOptions.getOption('timezone'));
      ngModelCtrl.$setViewValue(dt);
      ngModelCtrl.$render();
    } else {
      self.activeDate = date;
      setMode(self.modes[self.modes.indexOf($scope.datepickerMode) - 1]);

      $scope.$emit('uib:datepicker.mode');
    }

    $scope.$broadcast('uib:datepicker.focus');
  };

  $scope.move = function(direction) {
    var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
        month = self.activeDate.getMonth() + direction * (self.step.months || 0);
    self.activeDate.setFullYear(year, month, 1);
    self.refreshView();
  };

  $scope.toggleMode = function(direction) {
    direction = direction || 1;

    if ($scope.datepickerMode === self.maxMode && direction === 1 ||
      $scope.datepickerMode === self.minMode && direction === -1) {
      return;
    }

    setMode(self.modes[self.modes.indexOf($scope.datepickerMode) + direction]);

    $scope.$emit('uib:datepicker.mode');
  };

  // Key event mapper
  $scope.keys = { 13: 'enter', 32: 'space', 33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home', 37: 'left', 38: 'up', 39: 'right', 40: 'down' };

  var focusElement = function() {
    self.element[0].focus();
  };

  // Listen for focus requests from popup directive
  $scope.$on('uib:datepicker.focus', focusElement);

  $scope.keydown = function(evt) {
    var key = $scope.keys[evt.which];

    if (!key || evt.shiftKey || evt.altKey || $scope.disabled) {
      return;
    }

    evt.preventDefault();
    if (!self.shortcutPropagation) {
      evt.stopPropagation();
    }

    if (key === 'enter' || key === 'space') {
      if (self.isDisabled(self.activeDate)) {
        return; // do nothing
      }
      $scope.select(self.activeDate);
    } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
      $scope.toggleMode(key === 'up' ? 1 : -1);
    } else {
      self.handleKeyDown(key, evt);
      self.refreshView();
    }
  };

  $element.on('keydown', function(evt) {
    $scope.$apply(function() {
      $scope.keydown(evt);
    });
  });

  $scope.$on('$destroy', function() {
    //Clear all watch listeners on destroy
    while (watchListeners.length) {
      watchListeners.shift()();
    }
  });

  function setMode(mode) {
    $scope.datepickerMode = mode;
    $scope.datepickerOptions.datepickerMode = mode;
  }

  function extractOptions(ngModelCtrl) {
    var ngModelOptions;

    if (angular.version.minor < 6) { // in angular < 1.6 $options could be missing
      // guarantee a value
      ngModelOptions = ngModelCtrl.$options ||
        $scope.datepickerOptions.ngModelOptions ||
        datepickerConfig.ngModelOptions ||
        {};

      // mimic 1.6+ api
      ngModelOptions.getOption = function (key) {
        return ngModelOptions[key];
      };
    } else { // in angular >=1.6 $options is always present
      // ng-model-options defaults timezone to null; don't let its precedence squash a non-null value
      var timezone = ngModelCtrl.$options.getOption('timezone') ||
        ($scope.datepickerOptions.ngModelOptions ? $scope.datepickerOptions.ngModelOptions.timezone : null) ||
        (datepickerConfig.ngModelOptions ? datepickerConfig.ngModelOptions.timezone : null);

      // values passed to createChild override existing values
      ngModelOptions = ngModelCtrl.$options // start with a ModelOptions instance
        .createChild(datepickerConfig.ngModelOptions) // lowest precedence
        .createChild($scope.datepickerOptions.ngModelOptions)
        .createChild(ngModelCtrl.$options) // highest precedence
        .createChild({timezone: timezone}); // to keep from squashing a non-null value
    }

    return ngModelOptions;
  }
}])

.controller('UibDaypickerController', ['$scope', '$element', 'dateFilter', function(scope, $element, dateFilter) {
  var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  this.step = { months: 1 };
  this.element = $element;
  function getDaysInMonth(year, month) {
    return month === 1 && year % 4 === 0 &&
      (year % 100 !== 0 || year % 400 === 0) ? 29 : DAYS_IN_MONTH[month];
  }

  this.init = function(ctrl) {
    angular.extend(ctrl, this);
    scope.showWeeks = ctrl.showWeeks;
    ctrl.refreshView();
  };

  this.getDates = function(startDate, n) {
    var dates = new Array(n), current = new Date(startDate), i = 0, date;
    while (i < n) {
      date = new Date(current);
      dates[i++] = date;
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  this._refreshView = function() {
    var year = this.activeDate.getFullYear(),
      month = this.activeDate.getMonth(),
      firstDayOfMonth = new Date(this.activeDate);

    firstDayOfMonth.setFullYear(year, month, 1);

    var difference = this.startingDay - firstDayOfMonth.getDay(),
      numDisplayedFromPreviousMonth = difference > 0 ?
        7 - difference : - difference,
      firstDate = new Date(firstDayOfMonth);

    if (numDisplayedFromPreviousMonth > 0) {
      firstDate.setDate(-numDisplayedFromPreviousMonth + 1);
    }

    // 42 is the number of days on a six-week calendar
    var days = this.getDates(firstDate, 42);
    for (var i = 0; i < 42; i ++) {
      days[i] = angular.extend(this.createDateObject(days[i], this.formatDay), {
        secondary: days[i].getMonth() !== month,
        uid: scope.uniqueId + '-' + i
      });
    }

    scope.labels = new Array(7);
    for (var j = 0; j < 7; j++) {
      scope.labels[j] = {
        abbr: dateFilter(days[j].date, this.formatDayHeader),
        full: dateFilter(days[j].date, 'EEEE')
      };
    }

    scope.title = dateFilter(this.activeDate, this.formatDayTitle);
    scope.rows = this.split(days, 7);

    if (scope.showWeeks) {
      scope.weekNumbers = [];
      var thursdayIndex = (4 + 7 - this.startingDay) % 7,
          numWeeks = scope.rows.length;
      for (var curWeek = 0; curWeek < numWeeks; curWeek++) {
        scope.weekNumbers.push(
          getISO8601WeekNumber(scope.rows[curWeek][thursdayIndex].date));
      }
    }
  };

  this.compare = function(date1, date2) {
    var _date1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    var _date2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    _date1.setFullYear(date1.getFullYear());
    _date2.setFullYear(date2.getFullYear());
    return _date1 - _date2;
  };

  function getISO8601WeekNumber(date) {
    var checkDate = new Date(date);
    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
    var time = checkDate.getTime();
    checkDate.setMonth(0); // Compare with Jan 1
    checkDate.setDate(1);
    return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
  }

  this.handleKeyDown = function(key, evt) {
    var date = this.activeDate.getDate();

    if (key === 'left') {
      date = date - 1;
    } else if (key === 'up') {
      date = date - 7;
    } else if (key === 'right') {
      date = date + 1;
    } else if (key === 'down') {
      date = date + 7;
    } else if (key === 'pageup' || key === 'pagedown') {
      var month = this.activeDate.getMonth() + (key === 'pageup' ? - 1 : 1);
      this.activeDate.setMonth(month, 1);
      date = Math.min(getDaysInMonth(this.activeDate.getFullYear(), this.activeDate.getMonth()), date);
    } else if (key === 'home') {
      date = 1;
    } else if (key === 'end') {
      date = getDaysInMonth(this.activeDate.getFullYear(), this.activeDate.getMonth());
    }
    this.activeDate.setDate(date);
  };
}])

.controller('UibMonthpickerController', ['$scope', '$element', 'dateFilter', function(scope, $element, dateFilter) {
  this.step = { years: 1 };
  this.element = $element;

  this.init = function(ctrl) {
    angular.extend(ctrl, this);
    ctrl.refreshView();
  };

  this._refreshView = function() {
    var months = new Array(12),
        year = this.activeDate.getFullYear(),
        date;

    for (var i = 0; i < 12; i++) {
      date = new Date(this.activeDate);
      date.setFullYear(year, i, 1);
      months[i] = angular.extend(this.createDateObject(date, this.formatMonth), {
        uid: scope.uniqueId + '-' + i
      });
    }

    scope.title = dateFilter(this.activeDate, this.formatMonthTitle);
    scope.rows = this.split(months, this.monthColumns);
    scope.yearHeaderColspan = this.monthColumns > 3 ? this.monthColumns - 2 : 1;
  };

  this.compare = function(date1, date2) {
    var _date1 = new Date(date1.getFullYear(), date1.getMonth());
    var _date2 = new Date(date2.getFullYear(), date2.getMonth());
    _date1.setFullYear(date1.getFullYear());
    _date2.setFullYear(date2.getFullYear());
    return _date1 - _date2;
  };

  this.handleKeyDown = function(key, evt) {
    var date = this.activeDate.getMonth();

    if (key === 'left') {
      date = date - 1;
    } else if (key === 'up') {
      date = date - this.monthColumns;
    } else if (key === 'right') {
      date = date + 1;
    } else if (key === 'down') {
      date = date + this.monthColumns;
    } else if (key === 'pageup' || key === 'pagedown') {
      var year = this.activeDate.getFullYear() + (key === 'pageup' ? - 1 : 1);
      this.activeDate.setFullYear(year);
    } else if (key === 'home') {
      date = 0;
    } else if (key === 'end') {
      date = 11;
    }
    this.activeDate.setMonth(date);
  };
}])

.controller('UibYearpickerController', ['$scope', '$element', 'dateFilter', function(scope, $element, dateFilter) {
  var columns, range;
  this.element = $element;

  function getStartingYear(year) {
    return parseInt((year - 1) / range, 10) * range + 1;
  }

  this.yearpickerInit = function() {
    columns = this.yearColumns;
    range = this.yearRows * columns;
    this.step = { years: range };
  };

  this._refreshView = function() {
    var years = new Array(range), date;

    for (var i = 0, start = getStartingYear(this.activeDate.getFullYear()); i < range; i++) {
      date = new Date(this.activeDate);
      date.setFullYear(start + i, 0, 1);
      years[i] = angular.extend(this.createDateObject(date, this.formatYear), {
        uid: scope.uniqueId + '-' + i
      });
    }

    scope.title = [years[0].label, years[range - 1].label].join(' - ');
    scope.rows = this.split(years, columns);
    scope.columns = columns;
  };

  this.compare = function(date1, date2) {
    return date1.getFullYear() - date2.getFullYear();
  };

  this.handleKeyDown = function(key, evt) {
    var date = this.activeDate.getFullYear();

    if (key === 'left') {
      date = date - 1;
    } else if (key === 'up') {
      date = date - columns;
    } else if (key === 'right') {
      date = date + 1;
    } else if (key === 'down') {
      date = date + columns;
    } else if (key === 'pageup' || key === 'pagedown') {
      date += (key === 'pageup' ? - 1 : 1) * range;
    } else if (key === 'home') {
      date = getStartingYear(this.activeDate.getFullYear());
    } else if (key === 'end') {
      date = getStartingYear(this.activeDate.getFullYear()) + range - 1;
    }
    this.activeDate.setFullYear(date);
  };
}])

.directive('uibDatepicker', function() {
  return {
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/datepicker/datepicker.html';
    },
    scope: {
      datepickerOptions: '=?'
    },
    require: ['uibDatepicker', '^ngModel'],
    restrict: 'A',
    controller: 'UibDatepickerController',
    controllerAs: 'datepicker',
    link: function(scope, element, attrs, ctrls) {
      var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

      datepickerCtrl.init(ngModelCtrl);
    }
  };
})

.directive('uibDaypicker', function() {
  return {
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/datepicker/day.html';
    },
    require: ['^uibDatepicker', 'uibDaypicker'],
    restrict: 'A',
    controller: 'UibDaypickerController',
    link: function(scope, element, attrs, ctrls) {
      var datepickerCtrl = ctrls[0],
        daypickerCtrl = ctrls[1];

      daypickerCtrl.init(datepickerCtrl);
    }
  };
})

.directive('uibMonthpicker', function() {
  return {
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/datepicker/month.html';
    },
    require: ['^uibDatepicker', 'uibMonthpicker'],
    restrict: 'A',
    controller: 'UibMonthpickerController',
    link: function(scope, element, attrs, ctrls) {
      var datepickerCtrl = ctrls[0],
        monthpickerCtrl = ctrls[1];

      monthpickerCtrl.init(datepickerCtrl);
    }
  };
})

.directive('uibYearpicker', function() {
  return {
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/datepicker/year.html';
    },
    require: ['^uibDatepicker', 'uibYearpicker'],
    restrict: 'A',
    controller: 'UibYearpickerController',
    link: function(scope, element, attrs, ctrls) {
      var ctrl = ctrls[0];
      angular.extend(ctrl, ctrls[1]);
      ctrl.yearpickerInit();

      ctrl.refreshView();
    }
  };
});

angular.module('ui.bootstrap.position', [])

/**
 * A set of utility methods for working with the DOM.
 * It is meant to be used where we need to absolute-position elements in
 * relation to another element (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
  .factory('$uibPosition', ['$document', '$window', function($document, $window) {
    /**
     * Used by scrollbarWidth() function to cache scrollbar's width.
     * Do not access this variable directly, use scrollbarWidth() instead.
     */
    var SCROLLBAR_WIDTH;
    /**
     * scrollbar on body and html element in IE and Edge overlay
     * content and should be considered 0 width.
     */
    var BODY_SCROLLBAR_WIDTH;
    var OVERFLOW_REGEX = {
      normal: /(auto|scroll)/,
      hidden: /(auto|scroll|hidden)/
    };
    var PLACEMENT_REGEX = {
      auto: /\s?auto?\s?/i,
      primary: /^(top|bottom|left|right)$/,
      secondary: /^(top|bottom|left|right|center)$/,
      vertical: /^(top|bottom)$/
    };
    var BODY_REGEX = /(HTML|BODY)/;

    return {

      /**
       * Provides a raw DOM element from a jQuery/jQLite element.
       *
       * @param {element} elem - The element to convert.
       *
       * @returns {element} A HTML element.
       */
      getRawNode: function(elem) {
        return elem.nodeName ? elem : elem[0] || elem;
      },

      /**
       * Provides a parsed number for a style property.  Strips
       * units and casts invalid numbers to 0.
       *
       * @param {string} value - The style value to parse.
       *
       * @returns {number} A valid number.
       */
      parseStyle: function(value) {
        value = parseFloat(value);
        return isFinite(value) ? value : 0;
      },

      /**
       * Provides the closest positioned ancestor.
       *
       * @param {element} element - The element to get the offest parent for.
       *
       * @returns {element} The closest positioned ancestor.
       */
      offsetParent: function(elem) {
        elem = this.getRawNode(elem);

        var offsetParent = elem.offsetParent || $document[0].documentElement;

        function isStaticPositioned(el) {
          return ($window.getComputedStyle(el).position || 'static') === 'static';
        }

        while (offsetParent && offsetParent !== $document[0].documentElement && isStaticPositioned(offsetParent)) {
          offsetParent = offsetParent.offsetParent;
        }

        return offsetParent || $document[0].documentElement;
      },

      /**
       * Provides the scrollbar width, concept from TWBS measureScrollbar()
       * function in https://github.com/twbs/bootstrap/blob/master/js/modal.js
       * In IE and Edge, scollbar on body and html element overlay and should
       * return a width of 0.
       *
       * @returns {number} The width of the browser scollbar.
       */
      scrollbarWidth: function(isBody) {
        if (isBody) {
          if (angular.isUndefined(BODY_SCROLLBAR_WIDTH)) {
            var bodyElem = $document.find('body');
            bodyElem.addClass('uib-position-body-scrollbar-measure');
            BODY_SCROLLBAR_WIDTH = $window.innerWidth - bodyElem[0].clientWidth;
            BODY_SCROLLBAR_WIDTH = isFinite(BODY_SCROLLBAR_WIDTH) ? BODY_SCROLLBAR_WIDTH : 0;
            bodyElem.removeClass('uib-position-body-scrollbar-measure');
          }
          return BODY_SCROLLBAR_WIDTH;
        }

        if (angular.isUndefined(SCROLLBAR_WIDTH)) {
          var scrollElem = angular.element('<div class="uib-position-scrollbar-measure"></div>');
          $document.find('body').append(scrollElem);
          SCROLLBAR_WIDTH = scrollElem[0].offsetWidth - scrollElem[0].clientWidth;
          SCROLLBAR_WIDTH = isFinite(SCROLLBAR_WIDTH) ? SCROLLBAR_WIDTH : 0;
          scrollElem.remove();
        }

        return SCROLLBAR_WIDTH;
      },

      /**
       * Provides the padding required on an element to replace the scrollbar.
       *
       * @returns {object} An object with the following properties:
       *   <ul>
       *     <li>**scrollbarWidth**: the width of the scrollbar</li>
       *     <li>**widthOverflow**: whether the the width is overflowing</li>
       *     <li>**right**: the amount of right padding on the element needed to replace the scrollbar</li>
       *     <li>**rightOriginal**: the amount of right padding currently on the element</li>
       *     <li>**heightOverflow**: whether the the height is overflowing</li>
       *     <li>**bottom**: the amount of bottom padding on the element needed to replace the scrollbar</li>
       *     <li>**bottomOriginal**: the amount of bottom padding currently on the element</li>
       *   </ul>
       */
      scrollbarPadding: function(elem) {
        elem = this.getRawNode(elem);

        var elemStyle = $window.getComputedStyle(elem);
        var paddingRight = this.parseStyle(elemStyle.paddingRight);
        var paddingBottom = this.parseStyle(elemStyle.paddingBottom);
        var scrollParent = this.scrollParent(elem, false, true);
        var scrollbarWidth = this.scrollbarWidth(BODY_REGEX.test(scrollParent.tagName));

        return {
          scrollbarWidth: scrollbarWidth,
          widthOverflow: scrollParent.scrollWidth > scrollParent.clientWidth,
          right: paddingRight + scrollbarWidth,
          originalRight: paddingRight,
          heightOverflow: scrollParent.scrollHeight > scrollParent.clientHeight,
          bottom: paddingBottom + scrollbarWidth,
          originalBottom: paddingBottom
         };
      },

      /**
       * Checks to see if the element is scrollable.
       *
       * @param {element} elem - The element to check.
       * @param {boolean=} [includeHidden=false] - Should scroll style of 'hidden' be considered,
       *   default is false.
       *
       * @returns {boolean} Whether the element is scrollable.
       */
      isScrollable: function(elem, includeHidden) {
        elem = this.getRawNode(elem);

        var overflowRegex = includeHidden ? OVERFLOW_REGEX.hidden : OVERFLOW_REGEX.normal;
        var elemStyle = $window.getComputedStyle(elem);
        return overflowRegex.test(elemStyle.overflow + elemStyle.overflowY + elemStyle.overflowX);
      },

      /**
       * Provides the closest scrollable ancestor.
       * A port of the jQuery UI scrollParent method:
       * https://github.com/jquery/jquery-ui/blob/master/ui/scroll-parent.js
       *
       * @param {element} elem - The element to find the scroll parent of.
       * @param {boolean=} [includeHidden=false] - Should scroll style of 'hidden' be considered,
       *   default is false.
       * @param {boolean=} [includeSelf=false] - Should the element being passed be
       * included in the scrollable llokup.
       *
       * @returns {element} A HTML element.
       */
      scrollParent: function(elem, includeHidden, includeSelf) {
        elem = this.getRawNode(elem);

        var overflowRegex = includeHidden ? OVERFLOW_REGEX.hidden : OVERFLOW_REGEX.normal;
        var documentEl = $document[0].documentElement;
        var elemStyle = $window.getComputedStyle(elem);
        if (includeSelf && overflowRegex.test(elemStyle.overflow + elemStyle.overflowY + elemStyle.overflowX)) {
          return elem;
        }
        var excludeStatic = elemStyle.position === 'absolute';
        var scrollParent = elem.parentElement || documentEl;

        if (scrollParent === documentEl || elemStyle.position === 'fixed') {
          return documentEl;
        }

        while (scrollParent.parentElement && scrollParent !== documentEl) {
          var spStyle = $window.getComputedStyle(scrollParent);
          if (excludeStatic && spStyle.position !== 'static') {
            excludeStatic = false;
          }

          if (!excludeStatic && overflowRegex.test(spStyle.overflow + spStyle.overflowY + spStyle.overflowX)) {
            break;
          }
          scrollParent = scrollParent.parentElement;
        }

        return scrollParent;
      },

      /**
       * Provides read-only equivalent of jQuery's position function:
       * http://api.jquery.com/position/ - distance to closest positioned
       * ancestor.  Does not account for margins by default like jQuery position.
       *
       * @param {element} elem - The element to caclulate the position on.
       * @param {boolean=} [includeMargins=false] - Should margins be accounted
       * for, default is false.
       *
       * @returns {object} An object with the following properties:
       *   <ul>
       *     <li>**width**: the width of the element</li>
       *     <li>**height**: the height of the element</li>
       *     <li>**top**: distance to top edge of offset parent</li>
       *     <li>**left**: distance to left edge of offset parent</li>
       *   </ul>
       */
      position: function(elem, includeMagins) {
        elem = this.getRawNode(elem);

        var elemOffset = this.offset(elem);
        if (includeMagins) {
          var elemStyle = $window.getComputedStyle(elem);
          elemOffset.top -= this.parseStyle(elemStyle.marginTop);
          elemOffset.left -= this.parseStyle(elemStyle.marginLeft);
        }
        var parent = this.offsetParent(elem);
        var parentOffset = {top: 0, left: 0};

        if (parent !== $document[0].documentElement) {
          parentOffset = this.offset(parent);
          parentOffset.top += parent.clientTop - parent.scrollTop;
          parentOffset.left += parent.clientLeft - parent.scrollLeft;
        }

        return {
          width: Math.round(angular.isNumber(elemOffset.width) ? elemOffset.width : elem.offsetWidth),
          height: Math.round(angular.isNumber(elemOffset.height) ? elemOffset.height : elem.offsetHeight),
          top: Math.round(elemOffset.top - parentOffset.top),
          left: Math.round(elemOffset.left - parentOffset.left)
        };
      },

      /**
       * Provides read-only equivalent of jQuery's offset function:
       * http://api.jquery.com/offset/ - distance to viewport.  Does
       * not account for borders, margins, or padding on the body
       * element.
       *
       * @param {element} elem - The element to calculate the offset on.
       *
       * @returns {object} An object with the following properties:
       *   <ul>
       *     <li>**width**: the width of the element</li>
       *     <li>**height**: the height of the element</li>
       *     <li>**top**: distance to top edge of viewport</li>
       *     <li>**right**: distance to bottom edge of viewport</li>
       *   </ul>
       */
      offset: function(elem) {
        elem = this.getRawNode(elem);

        var elemBCR = elem.getBoundingClientRect();
        return {
          width: Math.round(angular.isNumber(elemBCR.width) ? elemBCR.width : elem.offsetWidth),
          height: Math.round(angular.isNumber(elemBCR.height) ? elemBCR.height : elem.offsetHeight),
          top: Math.round(elemBCR.top + ($window.pageYOffset || $document[0].documentElement.scrollTop)),
          left: Math.round(elemBCR.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft))
        };
      },

      /**
       * Provides offset distance to the closest scrollable ancestor
       * or viewport.  Accounts for border and scrollbar width.
       *
       * Right and bottom dimensions represent the distance to the
       * respective edge of the viewport element.  If the element
       * edge extends beyond the viewport, a negative value will be
       * reported.
       *
       * @param {element} elem - The element to get the viewport offset for.
       * @param {boolean=} [useDocument=false] - Should the viewport be the document element instead
       * of the first scrollable element, default is false.
       * @param {boolean=} [includePadding=true] - Should the padding on the offset parent element
       * be accounted for, default is true.
       *
       * @returns {object} An object with the following properties:
       *   <ul>
       *     <li>**top**: distance to the top content edge of viewport element</li>
       *     <li>**bottom**: distance to the bottom content edge of viewport element</li>
       *     <li>**left**: distance to the left content edge of viewport element</li>
       *     <li>**right**: distance to the right content edge of viewport element</li>
       *   </ul>
       */
      viewportOffset: function(elem, useDocument, includePadding) {
        elem = this.getRawNode(elem);
        includePadding = includePadding !== false ? true : false;

        var elemBCR = elem.getBoundingClientRect();
        var offsetBCR = {top: 0, left: 0, bottom: 0, right: 0};

        var offsetParent = useDocument ? $document[0].documentElement : this.scrollParent(elem);
        var offsetParentBCR = offsetParent.getBoundingClientRect();

        offsetBCR.top = offsetParentBCR.top + offsetParent.clientTop;
        offsetBCR.left = offsetParentBCR.left + offsetParent.clientLeft;
        if (offsetParent === $document[0].documentElement) {
          offsetBCR.top += $window.pageYOffset;
          offsetBCR.left += $window.pageXOffset;
        }
        offsetBCR.bottom = offsetBCR.top + offsetParent.clientHeight;
        offsetBCR.right = offsetBCR.left + offsetParent.clientWidth;

        if (includePadding) {
          var offsetParentStyle = $window.getComputedStyle(offsetParent);
          offsetBCR.top += this.parseStyle(offsetParentStyle.paddingTop);
          offsetBCR.bottom -= this.parseStyle(offsetParentStyle.paddingBottom);
          offsetBCR.left += this.parseStyle(offsetParentStyle.paddingLeft);
          offsetBCR.right -= this.parseStyle(offsetParentStyle.paddingRight);
        }

        return {
          top: Math.round(elemBCR.top - offsetBCR.top),
          bottom: Math.round(offsetBCR.bottom - elemBCR.bottom),
          left: Math.round(elemBCR.left - offsetBCR.left),
          right: Math.round(offsetBCR.right - elemBCR.right)
        };
      },

      /**
       * Provides an array of placement values parsed from a placement string.
       * Along with the 'auto' indicator, supported placement strings are:
       *   <ul>
       *     <li>top: element on top, horizontally centered on host element.</li>
       *     <li>top-left: element on top, left edge aligned with host element left edge.</li>
       *     <li>top-right: element on top, lerightft edge aligned with host element right edge.</li>
       *     <li>bottom: element on bottom, horizontally centered on host element.</li>
       *     <li>bottom-left: element on bottom, left edge aligned with host element left edge.</li>
       *     <li>bottom-right: element on bottom, right edge aligned with host element right edge.</li>
       *     <li>left: element on left, vertically centered on host element.</li>
       *     <li>left-top: element on left, top edge aligned with host element top edge.</li>
       *     <li>left-bottom: element on left, bottom edge aligned with host element bottom edge.</li>
       *     <li>right: element on right, vertically centered on host element.</li>
       *     <li>right-top: element on right, top edge aligned with host element top edge.</li>
       *     <li>right-bottom: element on right, bottom edge aligned with host element bottom edge.</li>
       *   </ul>
       * A placement string with an 'auto' indicator is expected to be
       * space separated from the placement, i.e: 'auto bottom-left'  If
       * the primary and secondary placement values do not match 'top,
       * bottom, left, right' then 'top' will be the primary placement and
       * 'center' will be the secondary placement.  If 'auto' is passed, true
       * will be returned as the 3rd value of the array.
       *
       * @param {string} placement - The placement string to parse.
       *
       * @returns {array} An array with the following values
       * <ul>
       *   <li>**[0]**: The primary placement.</li>
       *   <li>**[1]**: The secondary placement.</li>
       *   <li>**[2]**: If auto is passed: true, else undefined.</li>
       * </ul>
       */
      parsePlacement: function(placement) {
        var autoPlace = PLACEMENT_REGEX.auto.test(placement);
        if (autoPlace) {
          placement = placement.replace(PLACEMENT_REGEX.auto, '');
        }

        placement = placement.split('-');

        placement[0] = placement[0] || 'top';
        if (!PLACEMENT_REGEX.primary.test(placement[0])) {
          placement[0] = 'top';
        }

        placement[1] = placement[1] || 'center';
        if (!PLACEMENT_REGEX.secondary.test(placement[1])) {
          placement[1] = 'center';
        }

        if (autoPlace) {
          placement[2] = true;
        } else {
          placement[2] = false;
        }

        return placement;
      },

      /**
       * Provides coordinates for an element to be positioned relative to
       * another element.  Passing 'auto' as part of the placement parameter
       * will enable smart placement - where the element fits. i.e:
       * 'auto left-top' will check to see if there is enough space to the left
       * of the hostElem to fit the targetElem, if not place right (same for secondary
       * top placement).  Available space is calculated using the viewportOffset
       * function.
       *
       * @param {element} hostElem - The element to position against.
       * @param {element} targetElem - The element to position.
       * @param {string=} [placement=top] - The placement for the targetElem,
       *   default is 'top'. 'center' is assumed as secondary placement for
       *   'top', 'left', 'right', and 'bottom' placements.  Available placements are:
       *   <ul>
       *     <li>top</li>
       *     <li>top-right</li>
       *     <li>top-left</li>
       *     <li>bottom</li>
       *     <li>bottom-left</li>
       *     <li>bottom-right</li>
       *     <li>left</li>
       *     <li>left-top</li>
       *     <li>left-bottom</li>
       *     <li>right</li>
       *     <li>right-top</li>
       *     <li>right-bottom</li>
       *   </ul>
       * @param {boolean=} [appendToBody=false] - Should the top and left values returned
       *   be calculated from the body element, default is false.
       *
       * @returns {object} An object with the following properties:
       *   <ul>
       *     <li>**top**: Value for targetElem top.</li>
       *     <li>**left**: Value for targetElem left.</li>
       *     <li>**placement**: The resolved placement.</li>
       *   </ul>
       */
      positionElements: function(hostElem, targetElem, placement, appendToBody) {
        hostElem = this.getRawNode(hostElem);
        targetElem = this.getRawNode(targetElem);

        // need to read from prop to support tests.
        var targetWidth = angular.isDefined(targetElem.offsetWidth) ? targetElem.offsetWidth : targetElem.prop('offsetWidth');
        var targetHeight = angular.isDefined(targetElem.offsetHeight) ? targetElem.offsetHeight : targetElem.prop('offsetHeight');

        placement = this.parsePlacement(placement);

        var hostElemPos = appendToBody ? this.offset(hostElem) : this.position(hostElem);
        var targetElemPos = {top: 0, left: 0, placement: ''};

        if (placement[2]) {
          var viewportOffset = this.viewportOffset(hostElem, appendToBody);

          var targetElemStyle = $window.getComputedStyle(targetElem);
          var adjustedSize = {
            width: targetWidth + Math.round(Math.abs(this.parseStyle(targetElemStyle.marginLeft) + this.parseStyle(targetElemStyle.marginRight))),
            height: targetHeight + Math.round(Math.abs(this.parseStyle(targetElemStyle.marginTop) + this.parseStyle(targetElemStyle.marginBottom)))
          };

          placement[0] = placement[0] === 'top' && adjustedSize.height > viewportOffset.top && adjustedSize.height <= viewportOffset.bottom ? 'bottom' :
                         placement[0] === 'bottom' && adjustedSize.height > viewportOffset.bottom && adjustedSize.height <= viewportOffset.top ? 'top' :
                         placement[0] === 'left' && adjustedSize.width > viewportOffset.left && adjustedSize.width <= viewportOffset.right ? 'right' :
                         placement[0] === 'right' && adjustedSize.width > viewportOffset.right && adjustedSize.width <= viewportOffset.left ? 'left' :
                         placement[0];

          placement[1] = placement[1] === 'top' && adjustedSize.height - hostElemPos.height > viewportOffset.bottom && adjustedSize.height - hostElemPos.height <= viewportOffset.top ? 'bottom' :
                         placement[1] === 'bottom' && adjustedSize.height - hostElemPos.height > viewportOffset.top && adjustedSize.height - hostElemPos.height <= viewportOffset.bottom ? 'top' :
                         placement[1] === 'left' && adjustedSize.width - hostElemPos.width > viewportOffset.right && adjustedSize.width - hostElemPos.width <= viewportOffset.left ? 'right' :
                         placement[1] === 'right' && adjustedSize.width - hostElemPos.width > viewportOffset.left && adjustedSize.width - hostElemPos.width <= viewportOffset.right ? 'left' :
                         placement[1];

          if (placement[1] === 'center') {
            if (PLACEMENT_REGEX.vertical.test(placement[0])) {
              var xOverflow = hostElemPos.width / 2 - targetWidth / 2;
              if (viewportOffset.left + xOverflow < 0 && adjustedSize.width - hostElemPos.width <= viewportOffset.right) {
                placement[1] = 'left';
              } else if (viewportOffset.right + xOverflow < 0 && adjustedSize.width - hostElemPos.width <= viewportOffset.left) {
                placement[1] = 'right';
              }
            } else {
              var yOverflow = hostElemPos.height / 2 - adjustedSize.height / 2;
              if (viewportOffset.top + yOverflow < 0 && adjustedSize.height - hostElemPos.height <= viewportOffset.bottom) {
                placement[1] = 'top';
              } else if (viewportOffset.bottom + yOverflow < 0 && adjustedSize.height - hostElemPos.height <= viewportOffset.top) {
                placement[1] = 'bottom';
              }
            }
          }
        }

        switch (placement[0]) {
          case 'top':
            targetElemPos.top = hostElemPos.top - targetHeight;
            break;
          case 'bottom':
            targetElemPos.top = hostElemPos.top + hostElemPos.height;
            break;
          case 'left':
            targetElemPos.left = hostElemPos.left - targetWidth;
            break;
          case 'right':
            targetElemPos.left = hostElemPos.left + hostElemPos.width;
            break;
        }

        switch (placement[1]) {
          case 'top':
            targetElemPos.top = hostElemPos.top;
            break;
          case 'bottom':
            targetElemPos.top = hostElemPos.top + hostElemPos.height - targetHeight;
            break;
          case 'left':
            targetElemPos.left = hostElemPos.left;
            break;
          case 'right':
            targetElemPos.left = hostElemPos.left + hostElemPos.width - targetWidth;
            break;
          case 'center':
            if (PLACEMENT_REGEX.vertical.test(placement[0])) {
              targetElemPos.left = hostElemPos.left + hostElemPos.width / 2 - targetWidth / 2;
            } else {
              targetElemPos.top = hostElemPos.top + hostElemPos.height / 2 - targetHeight / 2;
            }
            break;
        }

        targetElemPos.top = Math.round(targetElemPos.top);
        targetElemPos.left = Math.round(targetElemPos.left);
        targetElemPos.placement = placement[1] === 'center' ? placement[0] : placement[0] + '-' + placement[1];

        return targetElemPos;
      },

      /**
       * Provides a way to adjust the top positioning after first
       * render to correctly align element to top after content
       * rendering causes resized element height
       *
       * @param {array} placementClasses - The array of strings of classes
       * element should have.
       * @param {object} containerPosition - The object with container
       * position information
       * @param {number} initialHeight - The initial height for the elem.
       * @param {number} currentHeight - The current height for the elem.
       */
      adjustTop: function(placementClasses, containerPosition, initialHeight, currentHeight) {
        if (placementClasses.indexOf('top') !== -1 && initialHeight !== currentHeight) {
          return {
            top: containerPosition.top - currentHeight + 'px'
          };
        }
      },

      /**
       * Provides a way for positioning tooltip & dropdown
       * arrows when using placement options beyond the standard
       * left, right, top, or bottom.
       *
       * @param {element} elem - The tooltip/dropdown element.
       * @param {string} placement - The placement for the elem.
       */
      positionArrow: function(elem, placement) {
        elem = this.getRawNode(elem);

        var innerElem = elem.querySelector('.tooltip-inner, .popover-inner');
        if (!innerElem) {
          return;
        }

        var isTooltip = angular.element(innerElem).hasClass('tooltip-inner');

        var arrowElem = isTooltip ? elem.querySelector('.tooltip-arrow') : elem.querySelector('.arrow');
        if (!arrowElem) {
          return;
        }

        var arrowCss = {
          top: '',
          bottom: '',
          left: '',
          right: ''
        };

        placement = this.parsePlacement(placement);
        if (placement[1] === 'center') {
          // no adjustment necessary - just reset styles
          angular.element(arrowElem).css(arrowCss);
          return;
        }

        var borderProp = 'border-' + placement[0] + '-width';
        var borderWidth = $window.getComputedStyle(arrowElem)[borderProp];

        var borderRadiusProp = 'border-';
        if (PLACEMENT_REGEX.vertical.test(placement[0])) {
          borderRadiusProp += placement[0] + '-' + placement[1];
        } else {
          borderRadiusProp += placement[1] + '-' + placement[0];
        }
        borderRadiusProp += '-radius';
        var borderRadius = $window.getComputedStyle(isTooltip ? innerElem : elem)[borderRadiusProp];

        switch (placement[0]) {
          case 'top':
            arrowCss.bottom = isTooltip ? '0' : '-' + borderWidth;
            break;
          case 'bottom':
            arrowCss.top = isTooltip ? '0' : '-' + borderWidth;
            break;
          case 'left':
            arrowCss.right = isTooltip ? '0' : '-' + borderWidth;
            break;
          case 'right':
            arrowCss.left = isTooltip ? '0' : '-' + borderWidth;
            break;
        }

        arrowCss[placement[1]] = borderRadius;

        angular.element(arrowElem).css(arrowCss);
      }
    };
  }]);

angular.module('ui.bootstrap.datepickerPopup', ['ui.bootstrap.datepicker', 'ui.bootstrap.position'])

.value('$datepickerPopupLiteralWarning', true)

.constant('uibDatepickerPopupConfig', {
  altInputFormats: [],
  appendToBody: false,
  clearText: 'Clear',
  closeOnDateSelection: true,
  closeText: 'Done',
  currentText: 'Today',
  datepickerPopup: 'yyyy-MM-dd',
  datepickerPopupTemplateUrl: 'uib/template/datepickerPopup/popup.html',
  datepickerTemplateUrl: 'uib/template/datepicker/datepicker.html',
  html5Types: {
    date: 'yyyy-MM-dd',
    'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
    'month': 'yyyy-MM'
  },
  onOpenFocus: true,
  showButtonBar: true,
  placement: 'auto bottom-left'
})

.controller('UibDatepickerPopupController', ['$scope', '$element', '$attrs', '$compile', '$log', '$parse', '$window', '$document', '$rootScope', '$uibPosition', 'dateFilter', 'uibDateParser', 'uibDatepickerPopupConfig', '$timeout', 'uibDatepickerConfig', '$datepickerPopupLiteralWarning',
function($scope, $element, $attrs, $compile, $log, $parse, $window, $document, $rootScope, $position, dateFilter, dateParser, datepickerPopupConfig, $timeout, datepickerConfig, $datepickerPopupLiteralWarning) {
  var cache = {},
    isHtml5DateInput = false;
  var dateFormat, closeOnDateSelection, appendToBody, onOpenFocus,
    datepickerPopupTemplateUrl, datepickerTemplateUrl, popupEl, datepickerEl, scrollParentEl,
    ngModel, ngModelOptions, $popup, altInputFormats, watchListeners = [];

  this.init = function(_ngModel_) {
    ngModel = _ngModel_;
    ngModelOptions = extractOptions(ngModel);
    closeOnDateSelection = angular.isDefined($attrs.closeOnDateSelection) ?
      $scope.$parent.$eval($attrs.closeOnDateSelection) :
      datepickerPopupConfig.closeOnDateSelection;
    appendToBody = angular.isDefined($attrs.datepickerAppendToBody) ?
      $scope.$parent.$eval($attrs.datepickerAppendToBody) :
      datepickerPopupConfig.appendToBody;
    onOpenFocus = angular.isDefined($attrs.onOpenFocus) ?
      $scope.$parent.$eval($attrs.onOpenFocus) : datepickerPopupConfig.onOpenFocus;
    datepickerPopupTemplateUrl = angular.isDefined($attrs.datepickerPopupTemplateUrl) ?
      $attrs.datepickerPopupTemplateUrl :
      datepickerPopupConfig.datepickerPopupTemplateUrl;
    datepickerTemplateUrl = angular.isDefined($attrs.datepickerTemplateUrl) ?
      $attrs.datepickerTemplateUrl : datepickerPopupConfig.datepickerTemplateUrl;
    altInputFormats = angular.isDefined($attrs.altInputFormats) ?
      $scope.$parent.$eval($attrs.altInputFormats) :
      datepickerPopupConfig.altInputFormats;

    $scope.showButtonBar = angular.isDefined($attrs.showButtonBar) ?
      $scope.$parent.$eval($attrs.showButtonBar) :
      datepickerPopupConfig.showButtonBar;

    if (datepickerPopupConfig.html5Types[$attrs.type]) {
      dateFormat = datepickerPopupConfig.html5Types[$attrs.type];
      isHtml5DateInput = true;
    } else {
      dateFormat = $attrs.uibDatepickerPopup || datepickerPopupConfig.datepickerPopup;
      $attrs.$observe('uibDatepickerPopup', function(value, oldValue) {
        var newDateFormat = value || datepickerPopupConfig.datepickerPopup;
        // Invalidate the $modelValue to ensure that formatters re-run
        // FIXME: Refactor when PR is merged: https://github.com/angular/angular.js/pull/10764
        if (newDateFormat !== dateFormat) {
          dateFormat = newDateFormat;
          ngModel.$modelValue = null;

          if (!dateFormat) {
            throw new Error('uibDatepickerPopup must have a date format specified.');
          }
        }
      });
    }

    if (!dateFormat) {
      throw new Error('uibDatepickerPopup must have a date format specified.');
    }

    if (isHtml5DateInput && $attrs.uibDatepickerPopup) {
      throw new Error('HTML5 date input types do not support custom formats.');
    }

    // popup element used to display calendar
    popupEl = angular.element('<div uib-datepicker-popup-wrap><div uib-datepicker></div></div>');

    popupEl.attr({
      'ng-model': 'date',
      'ng-change': 'dateSelection(date)',
      'template-url': datepickerPopupTemplateUrl
    });

    // datepicker element
    datepickerEl = angular.element(popupEl.children()[0]);
    datepickerEl.attr('template-url', datepickerTemplateUrl);

    if (!$scope.datepickerOptions) {
      $scope.datepickerOptions = {};
    }

    if (isHtml5DateInput) {
      if ($attrs.type === 'month') {
        $scope.datepickerOptions.datepickerMode = 'month';
        $scope.datepickerOptions.minMode = 'month';
      }
    }

    datepickerEl.attr('datepicker-options', 'datepickerOptions');

    if (!isHtml5DateInput) {
      // Internal API to maintain the correct ng-invalid-[key] class
      ngModel.$$parserName = 'date';
      ngModel.$validators.date = validator;
      ngModel.$parsers.unshift(parseDate);
      ngModel.$formatters.push(function(value) {
        if (ngModel.$isEmpty(value)) {
          $scope.date = value;
          return value;
        }

        if (angular.isNumber(value)) {
          value = new Date(value);
        }

        $scope.date = dateParser.fromTimezone(value, ngModelOptions.getOption('timezone'));

        return dateParser.filter($scope.date, dateFormat);
      });
    } else {
      ngModel.$formatters.push(function(value) {
        $scope.date = dateParser.fromTimezone(value, ngModelOptions.getOption('timezone'));
        return value;
      });
    }

    // Detect changes in the view from the text box
    ngModel.$viewChangeListeners.push(function() {
      $scope.date = parseDateString(ngModel.$viewValue);
    });

    $element.on('keydown', inputKeydownBind);

    $popup = $compile(popupEl)($scope);
    // Prevent jQuery cache memory leak (template is now redundant after linking)
    popupEl.remove();

    if (appendToBody) {
      $document.find('body').append($popup);
    } else {
      $element.after($popup);
    }

    $scope.$on('$destroy', function() {
      if ($scope.isOpen === true) {
        if (!$rootScope.$$phase) {
          $scope.$apply(function() {
            $scope.isOpen = false;
          });
        }
      }

      $popup.remove();
      $element.off('keydown', inputKeydownBind);
      $document.off('click', documentClickBind);
      if (scrollParentEl) {
        scrollParentEl.off('scroll', positionPopup);
      }
      angular.element($window).off('resize', positionPopup);

      //Clear all watch listeners on destroy
      while (watchListeners.length) {
        watchListeners.shift()();
      }
    });
  };

  $scope.getText = function(key) {
    return $scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'];
  };

  $scope.isDisabled = function(date) {
    if (date === 'today') {
      date = dateParser.fromTimezone(new Date(), ngModelOptions.getOption('timezone'));
    }

    var dates = {};
    angular.forEach(['minDate', 'maxDate'], function(key) {
      if (!$scope.datepickerOptions[key]) {
        dates[key] = null;
      } else if (angular.isDate($scope.datepickerOptions[key])) {
        dates[key] = new Date($scope.datepickerOptions[key]);
      } else {
        if ($datepickerPopupLiteralWarning) {
          $log.warn('Literal date support has been deprecated, please switch to date object usage');
        }

        dates[key] = new Date(dateFilter($scope.datepickerOptions[key], 'medium'));
      }
    });

    return $scope.datepickerOptions &&
      dates.minDate && $scope.compare(date, dates.minDate) < 0 ||
      dates.maxDate && $scope.compare(date, dates.maxDate) > 0;
  };

  $scope.compare = function(date1, date2) {
    return new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  };

  // Inner change
  $scope.dateSelection = function(dt) {
    $scope.date = dt;
    var date = $scope.date ? dateParser.filter($scope.date, dateFormat) : null; // Setting to NULL is necessary for form validators to function
    $element.val(date);
    ngModel.$setViewValue(date);

    if (closeOnDateSelection) {
      $scope.isOpen = false;
      $element[0].focus();
    }
  };

  $scope.keydown = function(evt) {
    if (evt.which === 27) {
      evt.stopPropagation();
      $scope.isOpen = false;
      $element[0].focus();
    }
  };

  $scope.select = function(date, evt) {
    evt.stopPropagation();

    if (date === 'today') {
      var today = new Date();
      if (angular.isDate($scope.date)) {
        date = new Date($scope.date);
        date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
      } else {
        date = dateParser.fromTimezone(today, ngModelOptions.getOption('timezone'));
        date.setHours(0, 0, 0, 0);
      }
    }
    $scope.dateSelection(date);
  };

  $scope.close = function(evt) {
    evt.stopPropagation();

    $scope.isOpen = false;
    $element[0].focus();
  };

  $scope.disabled = angular.isDefined($attrs.disabled) || false;
  if ($attrs.ngDisabled) {
    watchListeners.push($scope.$parent.$watch($parse($attrs.ngDisabled), function(disabled) {
      $scope.disabled = disabled;
    }));
  }

  $scope.$watch('isOpen', function(value) {
    if (value) {
      if (!$scope.disabled) {
        $timeout(function() {
          positionPopup();

          if (onOpenFocus) {
            $scope.$broadcast('uib:datepicker.focus');
          }

          $document.on('click', documentClickBind);

          var placement = $attrs.popupPlacement ? $attrs.popupPlacement : datepickerPopupConfig.placement;
          if (appendToBody || $position.parsePlacement(placement)[2]) {
            scrollParentEl = scrollParentEl || angular.element($position.scrollParent($element));
            if (scrollParentEl) {
              scrollParentEl.on('scroll', positionPopup);
            }
          } else {
            scrollParentEl = null;
          }

          angular.element($window).on('resize', positionPopup);
        }, 0, false);
      } else {
        $scope.isOpen = false;
      }
    } else {
      $document.off('click', documentClickBind);
      if (scrollParentEl) {
        scrollParentEl.off('scroll', positionPopup);
      }
      angular.element($window).off('resize', positionPopup);
    }
  });

  function cameltoDash(string) {
    return string.replace(/([A-Z])/g, function($1) { return '-' + $1.toLowerCase(); });
  }

  function parseDateString(viewValue) {
    var date = dateParser.parse(viewValue, dateFormat, $scope.date);
    if (isNaN(date)) {
      for (var i = 0; i < altInputFormats.length; i++) {
        date = dateParser.parse(viewValue, altInputFormats[i], $scope.date);
        if (!isNaN(date)) {
          return date;
        }
      }
    }
    return date;
  }

  function parseDate(viewValue) {
    if (angular.isNumber(viewValue)) {
      // presumably timestamp to date object
      viewValue = new Date(viewValue);
    }

    if (!viewValue) {
      return null;
    }

    if (angular.isDate(viewValue) && !isNaN(viewValue)) {
      return viewValue;
    }

    if (angular.isString(viewValue)) {
      var date = parseDateString(viewValue);
      if (!isNaN(date)) {
        return dateParser.toTimezone(date, ngModelOptions.getOption('timezone'));
      }
    }

    return ngModelOptions.getOption('allowInvalid') ? viewValue : undefined;
  }

  function validator(modelValue, viewValue) {
    var value = modelValue || viewValue;

    if (!$attrs.ngRequired && !value) {
      return true;
    }

    if (angular.isNumber(value)) {
      value = new Date(value);
    }

    if (!value) {
      return true;
    }

    if (angular.isDate(value) && !isNaN(value)) {
      return true;
    }

    if (angular.isString(value)) {
      return !isNaN(parseDateString(value));
    }

    return false;
  }

  function documentClickBind(event) {
    if (!$scope.isOpen && $scope.disabled) {
      return;
    }

    var popup = $popup[0];
    var dpContainsTarget = $element[0].contains(event.target);
    // The popup node may not be an element node
    // In some browsers (IE) only element nodes have the 'contains' function
    var popupContainsTarget = popup.contains !== undefined && popup.contains(event.target);
    if ($scope.isOpen && !(dpContainsTarget || popupContainsTarget)) {
      $scope.$apply(function() {
        $scope.isOpen = false;
      });
    }
  }

  function inputKeydownBind(evt) {
    if (evt.which === 27 && $scope.isOpen) {
      evt.preventDefault();
      evt.stopPropagation();
      $scope.$apply(function() {
        $scope.isOpen = false;
      });
      $element[0].focus();
    } else if (evt.which === 40 && !$scope.isOpen) {
      evt.preventDefault();
      evt.stopPropagation();
      $scope.$apply(function() {
        $scope.isOpen = true;
      });
    }
  }

  function positionPopup() {
    if ($scope.isOpen) {
      var dpElement = angular.element($popup[0].querySelector('.uib-datepicker-popup'));
      var placement = $attrs.popupPlacement ? $attrs.popupPlacement : datepickerPopupConfig.placement;
      var position = $position.positionElements($element, dpElement, placement, appendToBody);
      dpElement.css({top: position.top + 'px', left: position.left + 'px'});
      if (dpElement.hasClass('uib-position-measure')) {
        dpElement.removeClass('uib-position-measure');
      }
    }
  }

  function extractOptions(ngModelCtrl) {
    var ngModelOptions;

    if (angular.version.minor < 6) { // in angular < 1.6 $options could be missing
      // guarantee a value
      ngModelOptions = angular.isObject(ngModelCtrl.$options) ?
        ngModelCtrl.$options :
        {
          timezone: null
        };

      // mimic 1.6+ api
      ngModelOptions.getOption = function (key) {
        return ngModelOptions[key];
      };
    } else { // in angular >=1.6 $options is always present
      ngModelOptions = ngModelCtrl.$options;
    }

    return ngModelOptions;
  }

  $scope.$on('uib:datepicker.mode', function() {
    $timeout(positionPopup, 0, false);
  });
}])

.directive('uibDatepickerPopup', function() {
  return {
    require: ['ngModel', 'uibDatepickerPopup'],
    controller: 'UibDatepickerPopupController',
    scope: {
      datepickerOptions: '=?',
      isOpen: '=?',
      currentText: '@',
      clearText: '@',
      closeText: '@'
    },
    link: function(scope, element, attrs, ctrls) {
      var ngModel = ctrls[0],
        ctrl = ctrls[1];

      ctrl.init(ngModel);
    }
  };
})

.directive('uibDatepickerPopupWrap', function() {
  return {
    restrict: 'A',
    transclude: true,
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/datepickerPopup/popup.html';
    }
  };
});

angular.module('ui.bootstrap.debounce', [])
/**
 * A helper, internal service that debounces a function
 */
  .factory('$$debounce', ['$timeout', function($timeout) {
    return function(callback, debounceTime) {
      var timeoutPromise;

      return function() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        if (timeoutPromise) {
          $timeout.cancel(timeoutPromise);
        }

        timeoutPromise = $timeout(function() {
          callback.apply(self, args);
        }, debounceTime);
      };
    };
  }]);

angular.module('ui.bootstrap.multiMap', [])
/**
 * A helper, internal data structure that stores all references attached to key
 */
  .factory('$$multiMap', function() {
    return {
      createNew: function() {
        var map = {};

        return {
          entries: function() {
            return Object.keys(map).map(function(key) {
              return {
                key: key,
                value: map[key]
              };
            });
          },
          get: function(key) {
            return map[key];
          },
          hasKey: function(key) {
            return !!map[key];
          },
          keys: function() {
            return Object.keys(map);
          },
          put: function(key, value) {
            if (!map[key]) {
              map[key] = [];
            }

            map[key].push(value);
          },
          remove: function(key, value) {
            var values = map[key];

            if (!values) {
              return;
            }

            var idx = values.indexOf(value);

            if (idx !== -1) {
              values.splice(idx, 1);
            }

            if (!values.length) {
              delete map[key];
            }
          }
        };
      }
    };
  });

angular.module('ui.bootstrap.dropdown', ['ui.bootstrap.multiMap', 'ui.bootstrap.position'])

.constant('uibDropdownConfig', {
  appendToOpenClass: 'uib-dropdown-open',
  openClass: 'open'
})

.service('uibDropdownService', ['$document', '$rootScope', '$$multiMap', function($document, $rootScope, $$multiMap) {
  var openScope = null;
  var openedContainers = $$multiMap.createNew();

  this.isOnlyOpen = function(dropdownScope, appendTo) {
    var openedDropdowns = openedContainers.get(appendTo);
    if (openedDropdowns) {
      var openDropdown = openedDropdowns.reduce(function(toClose, dropdown) {
        if (dropdown.scope === dropdownScope) {
          return dropdown;
        }

        return toClose;
      }, {});
      if (openDropdown) {
        return openedDropdowns.length === 1;
      }
    }

    return false;
  };

  this.open = function(dropdownScope, element, appendTo) {
    if (!openScope) {
      $document.on('click', closeDropdown);
    }

    if (openScope && openScope !== dropdownScope) {
      openScope.isOpen = false;
    }

    openScope = dropdownScope;

    if (!appendTo) {
      return;
    }

    var openedDropdowns = openedContainers.get(appendTo);
    if (openedDropdowns) {
      var openedScopes = openedDropdowns.map(function(dropdown) {
        return dropdown.scope;
      });
      if (openedScopes.indexOf(dropdownScope) === -1) {
        openedContainers.put(appendTo, {
          scope: dropdownScope
        });
      }
    } else {
      openedContainers.put(appendTo, {
        scope: dropdownScope
      });
    }
  };

  this.close = function(dropdownScope, element, appendTo) {
    if (openScope === dropdownScope) {
      $document.off('click', closeDropdown);
      $document.off('keydown', this.keybindFilter);
      openScope = null;
    }

    if (!appendTo) {
      return;
    }

    var openedDropdowns = openedContainers.get(appendTo);
    if (openedDropdowns) {
      var dropdownToClose = openedDropdowns.reduce(function(toClose, dropdown) {
        if (dropdown.scope === dropdownScope) {
          return dropdown;
        }

        return toClose;
      }, {});
      if (dropdownToClose) {
        openedContainers.remove(appendTo, dropdownToClose);
      }
    }
  };

  var closeDropdown = function(evt) {
    // This method may still be called during the same mouse event that
    // unbound this event handler. So check openScope before proceeding.
    if (!openScope || !openScope.isOpen) { return; }

    if (evt && openScope.getAutoClose() === 'disabled') { return; }

    if (evt && evt.which === 3) { return; }

    var toggleElement = openScope.getToggleElement();
    if (evt && toggleElement && toggleElement[0].contains(evt.target)) {
      return;
    }

    var dropdownElement = openScope.getDropdownElement();
    if (evt && openScope.getAutoClose() === 'outsideClick' &&
      dropdownElement && dropdownElement[0].contains(evt.target)) {
      return;
    }

    openScope.focusToggleElement();
    openScope.isOpen = false;

    if (!$rootScope.$$phase) {
      openScope.$apply();
    }
  };

  this.keybindFilter = function(evt) {
    if (!openScope) {
      // see this.close as ESC could have been pressed which kills the scope so we can not proceed
      return;
    }

    var dropdownElement = openScope.getDropdownElement();
    var toggleElement = openScope.getToggleElement();
    var dropdownElementTargeted = dropdownElement && dropdownElement[0].contains(evt.target);
    var toggleElementTargeted = toggleElement && toggleElement[0].contains(evt.target);
    if (evt.which === 27) {
      evt.stopPropagation();
      openScope.focusToggleElement();
      closeDropdown();
    } else if (openScope.isKeynavEnabled() && [38, 40].indexOf(evt.which) !== -1 && openScope.isOpen && (dropdownElementTargeted || toggleElementTargeted)) {
      evt.preventDefault();
      evt.stopPropagation();
      openScope.focusDropdownEntry(evt.which);
    }
  };
}])

.controller('UibDropdownController', ['$scope', '$element', '$attrs', '$parse', 'uibDropdownConfig', 'uibDropdownService', '$animate', '$uibPosition', '$document', '$compile', '$templateRequest', function($scope, $element, $attrs, $parse, dropdownConfig, uibDropdownService, $animate, $position, $document, $compile, $templateRequest) {
  var self = this,
    scope = $scope.$new(), // create a child scope so we are not polluting original one
    templateScope,
    appendToOpenClass = dropdownConfig.appendToOpenClass,
    openClass = dropdownConfig.openClass,
    getIsOpen,
    setIsOpen = angular.noop,
    toggleInvoker = $attrs.onToggle ? $parse($attrs.onToggle) : angular.noop,
    keynavEnabled = false,
    selectedOption = null,
    body = $document.find('body');

  $element.addClass('dropdown');

  this.init = function() {
    if ($attrs.isOpen) {
      getIsOpen = $parse($attrs.isOpen);
      setIsOpen = getIsOpen.assign;

      $scope.$watch(getIsOpen, function(value) {
        scope.isOpen = !!value;
      });
    }

    keynavEnabled = angular.isDefined($attrs.keyboardNav);
  };

  this.toggle = function(open) {
    scope.isOpen = arguments.length ? !!open : !scope.isOpen;
    if (angular.isFunction(setIsOpen)) {
      setIsOpen(scope, scope.isOpen);
    }

    return scope.isOpen;
  };

  // Allow other directives to watch status
  this.isOpen = function() {
    return scope.isOpen;
  };

  scope.getToggleElement = function() {
    return self.toggleElement;
  };

  scope.getAutoClose = function() {
    return $attrs.autoClose || 'always'; //or 'outsideClick' or 'disabled'
  };

  scope.getElement = function() {
    return $element;
  };

  scope.isKeynavEnabled = function() {
    return keynavEnabled;
  };

  scope.focusDropdownEntry = function(keyCode) {
    var elems = self.dropdownMenu ? //If append to body is used.
      angular.element(self.dropdownMenu).find('a') :
      $element.find('ul').eq(0).find('a');

    switch (keyCode) {
      case 40: {
        if (!angular.isNumber(self.selectedOption)) {
          self.selectedOption = 0;
        } else {
          self.selectedOption = self.selectedOption === elems.length - 1 ?
            self.selectedOption :
            self.selectedOption + 1;
        }
        break;
      }
      case 38: {
        if (!angular.isNumber(self.selectedOption)) {
          self.selectedOption = elems.length - 1;
        } else {
          self.selectedOption = self.selectedOption === 0 ?
            0 : self.selectedOption - 1;
        }
        break;
      }
    }
    elems[self.selectedOption].focus();
  };

  scope.getDropdownElement = function() {
    return self.dropdownMenu;
  };

  scope.focusToggleElement = function() {
    if (self.toggleElement) {
      self.toggleElement[0].focus();
    }
  };

  function removeDropdownMenu() {
    $element.append(self.dropdownMenu);
  }

  scope.$watch('isOpen', function(isOpen, wasOpen) {
    var appendTo = null,
      appendToBody = false;

    if (angular.isDefined($attrs.dropdownAppendTo)) {
      var appendToEl = $parse($attrs.dropdownAppendTo)(scope);
      if (appendToEl) {
        appendTo = angular.element(appendToEl);
      }
    }

    if (angular.isDefined($attrs.dropdownAppendToBody)) {
      var appendToBodyValue = $parse($attrs.dropdownAppendToBody)(scope);
      if (appendToBodyValue !== false) {
        appendToBody = true;
      }
    }

    if (appendToBody && !appendTo) {
      appendTo = body;
    }

    if (appendTo && self.dropdownMenu) {
      if (isOpen) {
        appendTo.append(self.dropdownMenu);
        $element.on('$destroy', removeDropdownMenu);
      } else {
        $element.off('$destroy', removeDropdownMenu);
        removeDropdownMenu();
      }
    }

    if (appendTo && self.dropdownMenu) {
      var pos = $position.positionElements($element, self.dropdownMenu, 'bottom-left', true),
        css,
        rightalign,
        scrollbarPadding,
        scrollbarWidth = 0;

      css = {
        top: pos.top + 'px',
        display: isOpen ? 'block' : 'none'
      };

      rightalign = self.dropdownMenu.hasClass('dropdown-menu-right');
      if (!rightalign) {
        css.left = pos.left + 'px';
        css.right = 'auto';
      } else {
        css.left = 'auto';
        scrollbarPadding = $position.scrollbarPadding(appendTo);

        if (scrollbarPadding.heightOverflow && scrollbarPadding.scrollbarWidth) {
          scrollbarWidth = scrollbarPadding.scrollbarWidth;
        }

        css.right = window.innerWidth - scrollbarWidth -
          (pos.left + $element.prop('offsetWidth')) + 'px';
      }

      // Need to adjust our positioning to be relative to the appendTo container
      // if it's not the body element
      if (!appendToBody) {
        var appendOffset = $position.offset(appendTo);

        css.top = pos.top - appendOffset.top + 'px';

        if (!rightalign) {
          css.left = pos.left - appendOffset.left + 'px';
        } else {
          css.right = window.innerWidth -
            (pos.left - appendOffset.left + $element.prop('offsetWidth')) + 'px';
        }
      }

      self.dropdownMenu.css(css);
    }

    var openContainer = appendTo ? appendTo : $element;
    var dropdownOpenClass = appendTo ? appendToOpenClass : openClass;
    var hasOpenClass = openContainer.hasClass(dropdownOpenClass);
    var isOnlyOpen = uibDropdownService.isOnlyOpen($scope, appendTo);

    if (hasOpenClass === !isOpen) {
      var toggleClass;
      if (appendTo) {
        toggleClass = !isOnlyOpen ? 'addClass' : 'removeClass';
      } else {
        toggleClass = isOpen ? 'addClass' : 'removeClass';
      }
      $animate[toggleClass](openContainer, dropdownOpenClass).then(function() {
        if (angular.isDefined(isOpen) && isOpen !== wasOpen) {
          toggleInvoker($scope, { open: !!isOpen });
        }
      });
    }

    if (isOpen) {
      if (self.dropdownMenuTemplateUrl) {
        $templateRequest(self.dropdownMenuTemplateUrl).then(function(tplContent) {
          templateScope = scope.$new();
          $compile(tplContent.trim())(templateScope, function(dropdownElement) {
            var newEl = dropdownElement;
            self.dropdownMenu.replaceWith(newEl);
            self.dropdownMenu = newEl;
            $document.on('keydown', uibDropdownService.keybindFilter);
          });
        });
      } else {
        $document.on('keydown', uibDropdownService.keybindFilter);
      }

      scope.focusToggleElement();
      uibDropdownService.open(scope, $element, appendTo);
    } else {
      uibDropdownService.close(scope, $element, appendTo);
      if (self.dropdownMenuTemplateUrl) {
        if (templateScope) {
          templateScope.$destroy();
        }
        var newEl = angular.element('<ul class="dropdown-menu"></ul>');
        self.dropdownMenu.replaceWith(newEl);
        self.dropdownMenu = newEl;
      }

      self.selectedOption = null;
    }

    if (angular.isFunction(setIsOpen)) {
      setIsOpen($scope, isOpen);
    }
  });
}])

.directive('uibDropdown', function() {
  return {
    controller: 'UibDropdownController',
    link: function(scope, element, attrs, dropdownCtrl) {
      dropdownCtrl.init();
    }
  };
})

.directive('uibDropdownMenu', function() {
  return {
    restrict: 'A',
    require: '?^uibDropdown',
    link: function(scope, element, attrs, dropdownCtrl) {
      if (!dropdownCtrl || angular.isDefined(attrs.dropdownNested)) {
        return;
      }

      element.addClass('dropdown-menu');

      var tplUrl = attrs.templateUrl;
      if (tplUrl) {
        dropdownCtrl.dropdownMenuTemplateUrl = tplUrl;
      }

      if (!dropdownCtrl.dropdownMenu) {
        dropdownCtrl.dropdownMenu = element;
      }
    }
  };
})

.directive('uibDropdownToggle', function() {
  return {
    require: '?^uibDropdown',
    link: function(scope, element, attrs, dropdownCtrl) {
      if (!dropdownCtrl) {
        return;
      }

      element.addClass('dropdown-toggle');

      dropdownCtrl.toggleElement = element;

      var toggleDropdown = function(event) {
        event.preventDefault();

        if (!element.hasClass('disabled') && !attrs.disabled) {
          scope.$apply(function() {
            dropdownCtrl.toggle();
          });
        }
      };

      element.on('click', toggleDropdown);

      // WAI-ARIA
      element.attr({ 'aria-haspopup': true, 'aria-expanded': false });
      scope.$watch(dropdownCtrl.isOpen, function(isOpen) {
        element.attr('aria-expanded', !!isOpen);
      });

      scope.$on('$destroy', function() {
        element.off('click', toggleDropdown);
      });
    }
  };
});

angular.module('ui.bootstrap.stackedMap', [])
/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
  .factory('$$stackedMap', function() {
    return {
      createNew: function() {
        var stack = [];

        return {
          add: function(key, value) {
            stack.push({
              key: key,
              value: value
            });
          },
          get: function(key) {
            for (var i = 0; i < stack.length; i++) {
              if (key === stack[i].key) {
                return stack[i];
              }
            }
          },
          keys: function() {
            var keys = [];
            for (var i = 0; i < stack.length; i++) {
              keys.push(stack[i].key);
            }
            return keys;
          },
          top: function() {
            return stack[stack.length - 1];
          },
          remove: function(key) {
            var idx = -1;
            for (var i = 0; i < stack.length; i++) {
              if (key === stack[i].key) {
                idx = i;
                break;
              }
            }
            return stack.splice(idx, 1)[0];
          },
          removeTop: function() {
            return stack.pop();
          },
          length: function() {
            return stack.length;
          }
        };
      }
    };
  });
angular.module('ui.bootstrap.modal', ['ui.bootstrap.multiMap', 'ui.bootstrap.stackedMap', 'ui.bootstrap.position'])
/**
 * Pluggable resolve mechanism for the modal resolve resolution
 * Supports UI Router's $resolve service
 */
  .provider('$uibResolve', function() {
    var resolve = this;
    this.resolver = null;

    this.setResolver = function(resolver) {
      this.resolver = resolver;
    };

    this.$get = ['$injector', '$q', function($injector, $q) {
      var resolver = resolve.resolver ? $injector.get(resolve.resolver) : null;
      return {
        resolve: function(invocables, locals, parent, self) {
          if (resolver) {
            return resolver.resolve(invocables, locals, parent, self);
          }

          var promises = [];

          angular.forEach(invocables, function(value) {
            if (angular.isFunction(value) || angular.isArray(value)) {
              promises.push($q.resolve($injector.invoke(value)));
            } else if (angular.isString(value)) {
              promises.push($q.resolve($injector.get(value)));
            } else {
              promises.push($q.resolve(value));
            }
          });

          return $q.all(promises).then(function(resolves) {
            var resolveObj = {};
            var resolveIter = 0;
            angular.forEach(invocables, function(value, key) {
              resolveObj[key] = resolves[resolveIter++];
            });

            return resolveObj;
          });
        }
      };
    }];
  })

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
  .directive('uibModalBackdrop', ['$animate', '$injector', '$uibModalStack',
  function($animate, $injector, $modalStack) {
    return {
      restrict: 'A',
      compile: function(tElement, tAttrs) {
        tElement.addClass(tAttrs.backdropClass);
        return linkFn;
      }
    };

    function linkFn(scope, element, attrs) {
      if (attrs.modalInClass) {
        $animate.addClass(element, attrs.modalInClass);

        scope.$on($modalStack.NOW_CLOSING_EVENT, function(e, setIsAsync) {
          var done = setIsAsync();
          if (scope.modalOptions.animation) {
            $animate.removeClass(element, attrs.modalInClass).then(done);
          } else {
            done();
          }
        });
      }
    }
  }])

  .directive('uibModalWindow', ['$uibModalStack', '$q', '$animateCss', '$document',
  function($modalStack, $q, $animateCss, $document) {
    return {
      scope: {
        index: '@'
      },
      restrict: 'A',
      transclude: true,
      templateUrl: function(tElement, tAttrs) {
        return tAttrs.templateUrl || 'uib/template/modal/window.html';
      },
      link: function(scope, element, attrs) {
        element.addClass(attrs.windowTopClass || '');
        scope.size = attrs.size;

        scope.close = function(evt) {
          var modal = $modalStack.getTop();
          if (modal && modal.value.backdrop &&
            modal.value.backdrop !== 'static' &&
            evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            $modalStack.dismiss(modal.key, 'backdrop click');
          }
        };

        // moved from template to fix issue #2280
        element.on('click', scope.close);

        // This property is only added to the scope for the purpose of detecting when this directive is rendered.
        // We can detect that by using this property in the template associated with this directive and then use
        // {@link Attribute#$observe} on it. For more details please see {@link TableColumnResize}.
        scope.$isRendered = true;

        // Deferred object that will be resolved when this modal is rendered.
        var modalRenderDeferObj = $q.defer();
        // Resolve render promise post-digest
        scope.$$postDigest(function() {
          modalRenderDeferObj.resolve();
        });

        modalRenderDeferObj.promise.then(function() {
          var animationPromise = null;

          if (attrs.modalInClass) {
            animationPromise = $animateCss(element, {
              addClass: attrs.modalInClass
            }).start();

            scope.$on($modalStack.NOW_CLOSING_EVENT, function(e, setIsAsync) {
              var done = setIsAsync();
              $animateCss(element, {
                removeClass: attrs.modalInClass
              }).start().then(done);
            });
          }


          $q.when(animationPromise).then(function() {
            // Notify {@link $modalStack} that modal is rendered.
            var modal = $modalStack.getTop();
            if (modal) {
              $modalStack.modalRendered(modal.key);
            }

            /**
             * If something within the freshly-opened modal already has focus (perhaps via a
             * directive that causes focus) then there's no need to try to focus anything.
             */
            if (!($document[0].activeElement && element[0].contains($document[0].activeElement))) {
              var inputWithAutofocus = element[0].querySelector('[autofocus]');
              /**
               * Auto-focusing of a freshly-opened modal element causes any child elements
               * with the autofocus attribute to lose focus. This is an issue on touch
               * based devices which will show and then hide the onscreen keyboard.
               * Attempts to refocus the autofocus element via JavaScript will not reopen
               * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
               * the modal element if the modal does not contain an autofocus element.
               */
              if (inputWithAutofocus) {
                inputWithAutofocus.focus();
              } else {
                element[0].focus();
              }
            }
          });
        });
      }
    };
  }])

  .directive('uibModalAnimationClass', function() {
    return {
      compile: function(tElement, tAttrs) {
        if (tAttrs.modalAnimation) {
          tElement.addClass(tAttrs.uibModalAnimationClass);
        }
      }
    };
  })

  .directive('uibModalTransclude', ['$animate', function($animate) {
    return {
      link: function(scope, element, attrs, controller, transclude) {
        transclude(scope.$parent, function(clone) {
          element.empty();
          $animate.enter(clone, element);
        });
      }
    };
  }])

  .factory('$uibModalStack', ['$animate', '$animateCss', '$document',
    '$compile', '$rootScope', '$q', '$$multiMap', '$$stackedMap', '$uibPosition',
    function($animate, $animateCss, $document, $compile, $rootScope, $q, $$multiMap, $$stackedMap, $uibPosition) {
      var OPENED_MODAL_CLASS = 'modal-open';

      var backdropDomEl, backdropScope;
      var openedWindows = $$stackedMap.createNew();
      var openedClasses = $$multiMap.createNew();
      var $modalStack = {
        NOW_CLOSING_EVENT: 'modal.stack.now-closing'
      };
      var topModalIndex = 0;
      var previousTopOpenedModal = null;
      var ARIA_HIDDEN_ATTRIBUTE_NAME = 'data-bootstrap-modal-aria-hidden-count';

      //Modal focus behavior
      var tabbableSelector = 'a[href], area[href], input:not([disabled]):not([tabindex=\'-1\']), ' +
        'button:not([disabled]):not([tabindex=\'-1\']),select:not([disabled]):not([tabindex=\'-1\']), textarea:not([disabled]):not([tabindex=\'-1\']), ' +
        'iframe, object, embed, *[tabindex]:not([tabindex=\'-1\']), *[contenteditable=true]';
      var scrollbarPadding;
      var SNAKE_CASE_REGEXP = /[A-Z]/g;

      // TODO: extract into common dependency with tooltip
      function snake_case(name) {
        var separator = '-';
        return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
          return (pos ? separator : '') + letter.toLowerCase();
        });
      }

      function isVisible(element) {
        return !!(element.offsetWidth ||
          element.offsetHeight ||
          element.getClientRects().length);
      }

      function backdropIndex() {
        var topBackdropIndex = -1;
        var opened = openedWindows.keys();
        for (var i = 0; i < opened.length; i++) {
          if (openedWindows.get(opened[i]).value.backdrop) {
            topBackdropIndex = i;
          }
        }

        // If any backdrop exist, ensure that it's index is always
        // right below the top modal
        if (topBackdropIndex > -1 && topBackdropIndex < topModalIndex) {
          topBackdropIndex = topModalIndex;
        }
        return topBackdropIndex;
      }

      $rootScope.$watch(backdropIndex, function(newBackdropIndex) {
        if (backdropScope) {
          backdropScope.index = newBackdropIndex;
        }
      });

      function removeModalWindow(modalInstance, elementToReceiveFocus) {
        var modalWindow = openedWindows.get(modalInstance).value;
        var appendToElement = modalWindow.appendTo;

        //clean up the stack
        openedWindows.remove(modalInstance);
        previousTopOpenedModal = openedWindows.top();
        if (previousTopOpenedModal) {
          topModalIndex = parseInt(previousTopOpenedModal.value.modalDomEl.attr('index'), 10);
        }

        removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, function() {
          var modalBodyClass = modalWindow.openedClass || OPENED_MODAL_CLASS;
          openedClasses.remove(modalBodyClass, modalInstance);
          var areAnyOpen = openedClasses.hasKey(modalBodyClass);
          appendToElement.toggleClass(modalBodyClass, areAnyOpen);
          if (!areAnyOpen && scrollbarPadding && scrollbarPadding.heightOverflow && scrollbarPadding.scrollbarWidth) {
            if (scrollbarPadding.originalRight) {
              appendToElement.css({paddingRight: scrollbarPadding.originalRight + 'px'});
            } else {
              appendToElement.css({paddingRight: ''});
            }
            scrollbarPadding = null;
          }
          toggleTopWindowClass(true);
        }, modalWindow.closedDeferred);
        checkRemoveBackdrop();

        //move focus to specified element if available, or else to body
        if (elementToReceiveFocus && elementToReceiveFocus.focus) {
          elementToReceiveFocus.focus();
        } else if (appendToElement.focus) {
          appendToElement.focus();
        }
      }

      // Add or remove "windowTopClass" from the top window in the stack
      function toggleTopWindowClass(toggleSwitch) {
        var modalWindow;

        if (openedWindows.length() > 0) {
          modalWindow = openedWindows.top().value;
          modalWindow.modalDomEl.toggleClass(modalWindow.windowTopClass || '', toggleSwitch);
        }
      }

      function checkRemoveBackdrop() {
        //remove backdrop if no longer needed
        if (backdropDomEl && backdropIndex() === -1) {
          var backdropScopeRef = backdropScope;
          removeAfterAnimate(backdropDomEl, backdropScope, function() {
            backdropScopeRef = null;
          });
          backdropDomEl = undefined;
          backdropScope = undefined;
        }
      }

      function removeAfterAnimate(domEl, scope, done, closedDeferred) {
        var asyncDeferred;
        var asyncPromise = null;
        var setIsAsync = function() {
          if (!asyncDeferred) {
            asyncDeferred = $q.defer();
            asyncPromise = asyncDeferred.promise;
          }

          return function asyncDone() {
            asyncDeferred.resolve();
          };
        };
        scope.$broadcast($modalStack.NOW_CLOSING_EVENT, setIsAsync);

        // Note that it's intentional that asyncPromise might be null.
        // That's when setIsAsync has not been called during the
        // NOW_CLOSING_EVENT broadcast.
        return $q.when(asyncPromise).then(afterAnimating);

        function afterAnimating() {
          if (afterAnimating.done) {
            return;
          }
          afterAnimating.done = true;

          $animate.leave(domEl).then(function() {
            if (done) {
              done();
            }

            domEl.remove();
            if (closedDeferred) {
              closedDeferred.resolve();
            }
          });

          scope.$destroy();
        }
      }

      $document.on('keydown', keydownListener);

      $rootScope.$on('$destroy', function() {
        $document.off('keydown', keydownListener);
      });

      function keydownListener(evt) {
        if (evt.isDefaultPrevented()) {
          return evt;
        }

        var modal = openedWindows.top();
        if (modal) {
          switch (evt.which) {
            case 27: {
              if (modal.value.keyboard) {
                evt.preventDefault();
                $rootScope.$apply(function() {
                  $modalStack.dismiss(modal.key, 'escape key press');
                });
              }
              break;
            }
            case 9: {
              var list = $modalStack.loadFocusElementList(modal);
              var focusChanged = false;
              if (evt.shiftKey) {
                if ($modalStack.isFocusInFirstItem(evt, list) || $modalStack.isModalFocused(evt, modal)) {
                  focusChanged = $modalStack.focusLastFocusableElement(list);
                }
              } else {
                if ($modalStack.isFocusInLastItem(evt, list)) {
                  focusChanged = $modalStack.focusFirstFocusableElement(list);
                }
              }

              if (focusChanged) {
                evt.preventDefault();
                evt.stopPropagation();
              }

              break;
            }
          }
        }
      }

      $modalStack.open = function(modalInstance, modal) {
        var modalOpener = $document[0].activeElement,
          modalBodyClass = modal.openedClass || OPENED_MODAL_CLASS;

        toggleTopWindowClass(false);

        // Store the current top first, to determine what index we ought to use
        // for the current top modal
        previousTopOpenedModal = openedWindows.top();

        openedWindows.add(modalInstance, {
          deferred: modal.deferred,
          renderDeferred: modal.renderDeferred,
          closedDeferred: modal.closedDeferred,
          modalScope: modal.scope,
          backdrop: modal.backdrop,
          keyboard: modal.keyboard,
          openedClass: modal.openedClass,
          windowTopClass: modal.windowTopClass,
          animation: modal.animation,
          appendTo: modal.appendTo
        });

        openedClasses.put(modalBodyClass, modalInstance);

        var appendToElement = modal.appendTo,
            currBackdropIndex = backdropIndex();

        if (currBackdropIndex >= 0 && !backdropDomEl) {
          backdropScope = $rootScope.$new(true);
          backdropScope.modalOptions = modal;
          backdropScope.index = currBackdropIndex;
          backdropDomEl = angular.element('<div uib-modal-backdrop="modal-backdrop"></div>');
          backdropDomEl.attr({
            'class': 'modal-backdrop',
            'ng-style': '{\'z-index\': 1040 + (index && 1 || 0) + index*10}',
            'uib-modal-animation-class': 'fade',
            'modal-in-class': 'in'
          });
          if (modal.backdropClass) {
            backdropDomEl.addClass(modal.backdropClass);
          }

          if (modal.animation) {
            backdropDomEl.attr('modal-animation', 'true');
          }
          $compile(backdropDomEl)(backdropScope);
          $animate.enter(backdropDomEl, appendToElement);
          if ($uibPosition.isScrollable(appendToElement)) {
            scrollbarPadding = $uibPosition.scrollbarPadding(appendToElement);
            if (scrollbarPadding.heightOverflow && scrollbarPadding.scrollbarWidth) {
              appendToElement.css({paddingRight: scrollbarPadding.right + 'px'});
            }
          }
        }

        var content;
        if (modal.component) {
          content = document.createElement(snake_case(modal.component.name));
          content = angular.element(content);
          content.attr({
            resolve: '$resolve',
            'modal-instance': '$uibModalInstance',
            close: '$close($value)',
            dismiss: '$dismiss($value)'
          });
        } else {
          content = modal.content;
        }

        // Set the top modal index based on the index of the previous top modal
        topModalIndex = previousTopOpenedModal ? parseInt(previousTopOpenedModal.value.modalDomEl.attr('index'), 10) + 1 : 0;
        var angularDomEl = angular.element('<div uib-modal-window="modal-window"></div>');
        angularDomEl.attr({
          'class': 'modal',
          'template-url': modal.windowTemplateUrl,
          'window-top-class': modal.windowTopClass,
          'role': 'dialog',
          'aria-labelledby': modal.ariaLabelledBy,
          'aria-describedby': modal.ariaDescribedBy,
          'size': modal.size,
          'index': topModalIndex,
          'animate': 'animate',
          'ng-style': '{\'z-index\': 1050 + $$topModalIndex*10, display: \'block\'}',
          'tabindex': -1,
          'uib-modal-animation-class': 'fade',
          'modal-in-class': 'in'
        }).append(content);
        if (modal.windowClass) {
          angularDomEl.addClass(modal.windowClass);
        }

        if (modal.animation) {
          angularDomEl.attr('modal-animation', 'true');
        }

        appendToElement.addClass(modalBodyClass);
        if (modal.scope) {
          // we need to explicitly add the modal index to the modal scope
          // because it is needed by ngStyle to compute the zIndex property.
          modal.scope.$$topModalIndex = topModalIndex;
        }
        $animate.enter($compile(angularDomEl)(modal.scope), appendToElement);

        openedWindows.top().value.modalDomEl = angularDomEl;
        openedWindows.top().value.modalOpener = modalOpener;

        applyAriaHidden(angularDomEl);

        function applyAriaHidden(el) {
          if (!el || el[0].tagName === 'BODY') {
            return;
          }

          getSiblings(el).forEach(function(sibling) {
            var elemIsAlreadyHidden = sibling.getAttribute('aria-hidden') === 'true',
              ariaHiddenCount = parseInt(sibling.getAttribute(ARIA_HIDDEN_ATTRIBUTE_NAME), 10);

            if (!ariaHiddenCount) {
              ariaHiddenCount = elemIsAlreadyHidden ? 1 : 0;
            }

            sibling.setAttribute(ARIA_HIDDEN_ATTRIBUTE_NAME, ariaHiddenCount + 1);
            sibling.setAttribute('aria-hidden', 'true');
          });

          return applyAriaHidden(el.parent());

          function getSiblings(el) {
            var children = el.parent() ? el.parent().children() : [];

            return Array.prototype.filter.call(children, function(child) {
              return child !== el[0];
            });
          }
        }
      };

      function broadcastClosing(modalWindow, resultOrReason, closing) {
        return !modalWindow.value.modalScope.$broadcast('modal.closing', resultOrReason, closing).defaultPrevented;
      }

      function unhideBackgroundElements() {
        Array.prototype.forEach.call(
          document.querySelectorAll('[' + ARIA_HIDDEN_ATTRIBUTE_NAME + ']'),
          function(hiddenEl) {
            var ariaHiddenCount = parseInt(hiddenEl.getAttribute(ARIA_HIDDEN_ATTRIBUTE_NAME), 10),
              newHiddenCount = ariaHiddenCount - 1;
            hiddenEl.setAttribute(ARIA_HIDDEN_ATTRIBUTE_NAME, newHiddenCount);

            if (!newHiddenCount) {
              hiddenEl.removeAttribute(ARIA_HIDDEN_ATTRIBUTE_NAME);
              hiddenEl.removeAttribute('aria-hidden');
            }
          }
        );
      }

      $modalStack.close = function(modalInstance, result) {
        var modalWindow = openedWindows.get(modalInstance);
        unhideBackgroundElements();
        if (modalWindow && broadcastClosing(modalWindow, result, true)) {
          modalWindow.value.modalScope.$$uibDestructionScheduled = true;
          modalWindow.value.deferred.resolve(result);
          removeModalWindow(modalInstance, modalWindow.value.modalOpener);
          return true;
        }

        return !modalWindow;
      };

      $modalStack.dismiss = function(modalInstance, reason) {
        var modalWindow = openedWindows.get(modalInstance);
        unhideBackgroundElements();
        if (modalWindow && broadcastClosing(modalWindow, reason, false)) {
          modalWindow.value.modalScope.$$uibDestructionScheduled = true;
          modalWindow.value.deferred.reject(reason);
          removeModalWindow(modalInstance, modalWindow.value.modalOpener);
          return true;
        }
        return !modalWindow;
      };

      $modalStack.dismissAll = function(reason) {
        var topModal = this.getTop();
        while (topModal && this.dismiss(topModal.key, reason)) {
          topModal = this.getTop();
        }
      };

      $modalStack.getTop = function() {
        return openedWindows.top();
      };

      $modalStack.modalRendered = function(modalInstance) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
          modalWindow.value.renderDeferred.resolve();
        }
      };

      $modalStack.focusFirstFocusableElement = function(list) {
        if (list.length > 0) {
          list[0].focus();
          return true;
        }
        return false;
      };

      $modalStack.focusLastFocusableElement = function(list) {
        if (list.length > 0) {
          list[list.length - 1].focus();
          return true;
        }
        return false;
      };

      $modalStack.isModalFocused = function(evt, modalWindow) {
        if (evt && modalWindow) {
          var modalDomEl = modalWindow.value.modalDomEl;
          if (modalDomEl && modalDomEl.length) {
            return (evt.target || evt.srcElement) === modalDomEl[0];
          }
        }
        return false;
      };

      $modalStack.isFocusInFirstItem = function(evt, list) {
        if (list.length > 0) {
          return (evt.target || evt.srcElement) === list[0];
        }
        return false;
      };

      $modalStack.isFocusInLastItem = function(evt, list) {
        if (list.length > 0) {
          return (evt.target || evt.srcElement) === list[list.length - 1];
        }
        return false;
      };

      $modalStack.loadFocusElementList = function(modalWindow) {
        if (modalWindow) {
          var modalDomE1 = modalWindow.value.modalDomEl;
          if (modalDomE1 && modalDomE1.length) {
            var elements = modalDomE1[0].querySelectorAll(tabbableSelector);
            return elements ?
              Array.prototype.filter.call(elements, function(element) {
                return isVisible(element);
              }) : elements;
          }
        }
      };

      return $modalStack;
    }])

  .provider('$uibModal', function() {
    var $modalProvider = {
      options: {
        animation: true,
        backdrop: true, //can also be false or 'static'
        keyboard: true
      },
      $get: ['$rootScope', '$q', '$document', '$templateRequest', '$controller', '$uibResolve', '$uibModalStack',
        function ($rootScope, $q, $document, $templateRequest, $controller, $uibResolve, $modalStack) {
          var $modal = {};

          function getTemplatePromise(options) {
            return options.template ? $q.when(options.template) :
              $templateRequest(angular.isFunction(options.templateUrl) ?
                options.templateUrl() : options.templateUrl);
          }

          var promiseChain = null;
          $modal.getPromiseChain = function() {
            return promiseChain;
          };

          $modal.open = function(modalOptions) {
            var modalResultDeferred = $q.defer();
            var modalOpenedDeferred = $q.defer();
            var modalClosedDeferred = $q.defer();
            var modalRenderDeferred = $q.defer();

            //prepare an instance of a modal to be injected into controllers and returned to a caller
            var modalInstance = {
              result: modalResultDeferred.promise,
              opened: modalOpenedDeferred.promise,
              closed: modalClosedDeferred.promise,
              rendered: modalRenderDeferred.promise,
              close: function (result) {
                return $modalStack.close(modalInstance, result);
              },
              dismiss: function (reason) {
                return $modalStack.dismiss(modalInstance, reason);
              }
            };

            //merge and clean up options
            modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
            modalOptions.resolve = modalOptions.resolve || {};
            modalOptions.appendTo = modalOptions.appendTo || $document.find('body').eq(0);

            if (!modalOptions.appendTo.length) {
              throw new Error('appendTo element not found. Make sure that the element passed is in DOM.');
            }

            //verify options
            if (!modalOptions.component && !modalOptions.template && !modalOptions.templateUrl) {
              throw new Error('One of component or template or templateUrl options is required.');
            }

            var templateAndResolvePromise;
            if (modalOptions.component) {
              templateAndResolvePromise = $q.when($uibResolve.resolve(modalOptions.resolve, {}, null, null));
            } else {
              templateAndResolvePromise =
                $q.all([getTemplatePromise(modalOptions), $uibResolve.resolve(modalOptions.resolve, {}, null, null)]);
            }

            function resolveWithTemplate() {
              return templateAndResolvePromise;
            }

            // Wait for the resolution of the existing promise chain.
            // Then switch to our own combined promise dependency (regardless of how the previous modal fared).
            // Then add to $modalStack and resolve opened.
            // Finally clean up the chain variable if no subsequent modal has overwritten it.
            var samePromise;
            samePromise = promiseChain = $q.all([promiseChain])
              .then(resolveWithTemplate, resolveWithTemplate)
              .then(function resolveSuccess(tplAndVars) {
                var providedScope = modalOptions.scope || $rootScope;

                var modalScope = providedScope.$new();
                modalScope.$close = modalInstance.close;
                modalScope.$dismiss = modalInstance.dismiss;

                modalScope.$on('$destroy', function() {
                  if (!modalScope.$$uibDestructionScheduled) {
                    modalScope.$dismiss('$uibUnscheduledDestruction');
                  }
                });

                var modal = {
                  scope: modalScope,
                  deferred: modalResultDeferred,
                  renderDeferred: modalRenderDeferred,
                  closedDeferred: modalClosedDeferred,
                  animation: modalOptions.animation,
                  backdrop: modalOptions.backdrop,
                  keyboard: modalOptions.keyboard,
                  backdropClass: modalOptions.backdropClass,
                  windowTopClass: modalOptions.windowTopClass,
                  windowClass: modalOptions.windowClass,
                  windowTemplateUrl: modalOptions.windowTemplateUrl,
                  ariaLabelledBy: modalOptions.ariaLabelledBy,
                  ariaDescribedBy: modalOptions.ariaDescribedBy,
                  size: modalOptions.size,
                  openedClass: modalOptions.openedClass,
                  appendTo: modalOptions.appendTo
                };

                var component = {};
                var ctrlInstance, ctrlInstantiate, ctrlLocals = {};

                if (modalOptions.component) {
                  constructLocals(component, false, true, false);
                  component.name = modalOptions.component;
                  modal.component = component;
                } else if (modalOptions.controller) {
                  constructLocals(ctrlLocals, true, false, true);

                  // the third param will make the controller instantiate later,private api
                  // @see https://github.com/angular/angular.js/blob/master/src/ng/controller.js#L126
                  ctrlInstantiate = $controller(modalOptions.controller, ctrlLocals, true, modalOptions.controllerAs);
                  if (modalOptions.controllerAs && modalOptions.bindToController) {
                    ctrlInstance = ctrlInstantiate.instance;
                    ctrlInstance.$close = modalScope.$close;
                    ctrlInstance.$dismiss = modalScope.$dismiss;
                    angular.extend(ctrlInstance, {
                      $resolve: ctrlLocals.$scope.$resolve
                    }, providedScope);
                  }

                  ctrlInstance = ctrlInstantiate();

                  if (angular.isFunction(ctrlInstance.$onInit)) {
                    ctrlInstance.$onInit();
                  }
                }

                if (!modalOptions.component) {
                  modal.content = tplAndVars[0];
                }

                $modalStack.open(modalInstance, modal);
                modalOpenedDeferred.resolve(true);

                function constructLocals(obj, template, instanceOnScope, injectable) {
                  obj.$scope = modalScope;
                  obj.$scope.$resolve = {};
                  if (instanceOnScope) {
                    obj.$scope.$uibModalInstance = modalInstance;
                  } else {
                    obj.$uibModalInstance = modalInstance;
                  }

                  var resolves = template ? tplAndVars[1] : tplAndVars;
                  angular.forEach(resolves, function(value, key) {
                    if (injectable) {
                      obj[key] = value;
                    }

                    obj.$scope.$resolve[key] = value;
                  });
                }
            }, function resolveError(reason) {
              modalOpenedDeferred.reject(reason);
              modalResultDeferred.reject(reason);
            })['finally'](function() {
              if (promiseChain === samePromise) {
                promiseChain = null;
              }
            });

            return modalInstance;
          };

          return $modal;
        }
      ]
    };

    return $modalProvider;
  });

angular.module('ui.bootstrap.paging', [])
/**
 * Helper internal service for generating common controller code between the
 * pager and pagination components
 */
.factory('uibPaging', ['$parse', function($parse) {
  return {
    create: function(ctrl, $scope, $attrs) {
      ctrl.setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;
      ctrl.ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl
      ctrl._watchers = [];

      ctrl.init = function(ngModelCtrl, config) {
        ctrl.ngModelCtrl = ngModelCtrl;
        ctrl.config = config;

        ngModelCtrl.$render = function() {
          ctrl.render();
        };

        if ($attrs.itemsPerPage) {
          ctrl._watchers.push($scope.$parent.$watch($attrs.itemsPerPage, function(value) {
            ctrl.itemsPerPage = parseInt(value, 10);
            $scope.totalPages = ctrl.calculateTotalPages();
            ctrl.updatePage();
          }));
        } else {
          ctrl.itemsPerPage = config.itemsPerPage;
        }

        $scope.$watch('totalItems', function(newTotal, oldTotal) {
          if (angular.isDefined(newTotal) || newTotal !== oldTotal) {
            $scope.totalPages = ctrl.calculateTotalPages();
            ctrl.updatePage();
          }
        });
      };

      ctrl.calculateTotalPages = function() {
        var totalPages = ctrl.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / ctrl.itemsPerPage);
        return Math.max(totalPages || 0, 1);
      };

      ctrl.render = function() {
        $scope.page = parseInt(ctrl.ngModelCtrl.$viewValue, 10) || 1;
      };

      $scope.selectPage = function(page, evt) {
        if (evt) {
          evt.preventDefault();
        }

        var clickAllowed = !$scope.ngDisabled || !evt;
        if (clickAllowed && $scope.page !== page && page > 0 && page <= $scope.totalPages) {
          if (evt && evt.target) {
            evt.target.blur();
          }
          ctrl.ngModelCtrl.$setViewValue(page);
          ctrl.ngModelCtrl.$render();
        }
      };

      $scope.getText = function(key) {
        return $scope[key + 'Text'] || ctrl.config[key + 'Text'];
      };

      $scope.noPrevious = function() {
        return $scope.page === 1;
      };

      $scope.noNext = function() {
        return $scope.page === $scope.totalPages;
      };

      ctrl.updatePage = function() {
        ctrl.setNumPages($scope.$parent, $scope.totalPages); // Readonly variable

        if ($scope.page > $scope.totalPages) {
          $scope.selectPage($scope.totalPages);
        } else {
          ctrl.ngModelCtrl.$render();
        }
      };

      $scope.$on('$destroy', function() {
        while (ctrl._watchers.length) {
          ctrl._watchers.shift()();
        }
      });
    }
  };
}]);

angular.module('ui.bootstrap.pager', ['ui.bootstrap.paging', 'ui.bootstrap.tabindex'])

.controller('UibPagerController', ['$scope', '$attrs', 'uibPaging', 'uibPagerConfig', function($scope, $attrs, uibPaging, uibPagerConfig) {
  $scope.align = angular.isDefined($attrs.align) ? $scope.$parent.$eval($attrs.align) : uibPagerConfig.align;

  uibPaging.create(this, $scope, $attrs);
}])

.constant('uibPagerConfig', {
  itemsPerPage: 10,
  previousText: '« Previous',
  nextText: 'Next »',
  align: true
})

.directive('uibPager', ['uibPagerConfig', function(uibPagerConfig) {
  return {
    scope: {
      totalItems: '=',
      previousText: '@',
      nextText: '@',
      ngDisabled: '='
    },
    require: ['uibPager', '?ngModel'],
    restrict: 'A',
    controller: 'UibPagerController',
    controllerAs: 'pager',
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/pager/pager.html';
    },
    link: function(scope, element, attrs, ctrls) {
      element.addClass('pager');
      var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

      if (!ngModelCtrl) {
        return; // do nothing if no ng-model
      }

      paginationCtrl.init(ngModelCtrl, uibPagerConfig);
    }
  };
}]);

angular.module('ui.bootstrap.pagination', ['ui.bootstrap.paging', 'ui.bootstrap.tabindex'])
.controller('UibPaginationController', ['$scope', '$attrs', '$parse', 'uibPaging', 'uibPaginationConfig', function($scope, $attrs, $parse, uibPaging, uibPaginationConfig) {
  var ctrl = this;
  // Setup configuration parameters
  var maxSize = angular.isDefined($attrs.maxSize) ? $scope.$parent.$eval($attrs.maxSize) : uibPaginationConfig.maxSize,
    rotate = angular.isDefined($attrs.rotate) ? $scope.$parent.$eval($attrs.rotate) : uibPaginationConfig.rotate,
    forceEllipses = angular.isDefined($attrs.forceEllipses) ? $scope.$parent.$eval($attrs.forceEllipses) : uibPaginationConfig.forceEllipses,
    boundaryLinkNumbers = angular.isDefined($attrs.boundaryLinkNumbers) ? $scope.$parent.$eval($attrs.boundaryLinkNumbers) : uibPaginationConfig.boundaryLinkNumbers,
    pageLabel = angular.isDefined($attrs.pageLabel) ? function(idx) { return $scope.$parent.$eval($attrs.pageLabel, {$page: idx}); } : angular.identity;
  $scope.boundaryLinks = angular.isDefined($attrs.boundaryLinks) ? $scope.$parent.$eval($attrs.boundaryLinks) : uibPaginationConfig.boundaryLinks;
  $scope.directionLinks = angular.isDefined($attrs.directionLinks) ? $scope.$parent.$eval($attrs.directionLinks) : uibPaginationConfig.directionLinks;
  $attrs.$set('role', 'menu');

  uibPaging.create(this, $scope, $attrs);

  if ($attrs.maxSize) {
    ctrl._watchers.push($scope.$parent.$watch($parse($attrs.maxSize), function(value) {
      maxSize = parseInt(value, 10);
      ctrl.render();
    }));
  }

  // Create page object used in template
  function makePage(number, text, isActive) {
    return {
      number: number,
      text: text,
      active: isActive
    };
  }

  function getPages(currentPage, totalPages) {
    var pages = [];

    // Default page limits
    var startPage = 1, endPage = totalPages;
    var isMaxSized = angular.isDefined(maxSize) && maxSize < totalPages;

    // recompute if maxSize
    if (isMaxSized) {
      if (rotate) {
        // Current page is displayed in the middle of the visible ones
        startPage = Math.max(currentPage - Math.floor(maxSize / 2), 1);
        endPage = startPage + maxSize - 1;

        // Adjust if limit is exceeded
        if (endPage > totalPages) {
          endPage = totalPages;
          startPage = endPage - maxSize + 1;
        }
      } else {
        // Visible pages are paginated with maxSize
        startPage = (Math.ceil(currentPage / maxSize) - 1) * maxSize + 1;

        // Adjust last page if limit is exceeded
        endPage = Math.min(startPage + maxSize - 1, totalPages);
      }
    }

    // Add page number links
    for (var number = startPage; number <= endPage; number++) {
      var page = makePage(number, pageLabel(number), number === currentPage);
      pages.push(page);
    }

    // Add links to move between page sets
    if (isMaxSized && maxSize > 0 && (!rotate || forceEllipses || boundaryLinkNumbers)) {
      if (startPage > 1) {
        if (!boundaryLinkNumbers || startPage > 3) { //need ellipsis for all options unless range is too close to beginning
        var previousPageSet = makePage(startPage - 1, '...', false);
        pages.unshift(previousPageSet);
      }
        if (boundaryLinkNumbers) {
          if (startPage === 3) { //need to replace ellipsis when the buttons would be sequential
            var secondPageLink = makePage(2, '2', false);
            pages.unshift(secondPageLink);
          }
          //add the first page
          var firstPageLink = makePage(1, '1', false);
          pages.unshift(firstPageLink);
        }
      }

      if (endPage < totalPages) {
        if (!boundaryLinkNumbers || endPage < totalPages - 2) { //need ellipsis for all options unless range is too close to end
        var nextPageSet = makePage(endPage + 1, '...', false);
        pages.push(nextPageSet);
      }
        if (boundaryLinkNumbers) {
          if (endPage === totalPages - 2) { //need to replace ellipsis when the buttons would be sequential
            var secondToLastPageLink = makePage(totalPages - 1, totalPages - 1, false);
            pages.push(secondToLastPageLink);
          }
          //add the last page
          var lastPageLink = makePage(totalPages, totalPages, false);
          pages.push(lastPageLink);
        }
      }
    }
    return pages;
  }

  var originalRender = this.render;
  this.render = function() {
    originalRender();
    if ($scope.page > 0 && $scope.page <= $scope.totalPages) {
      $scope.pages = getPages($scope.page, $scope.totalPages);
    }
  };
}])

.constant('uibPaginationConfig', {
  itemsPerPage: 10,
  boundaryLinks: false,
  boundaryLinkNumbers: false,
  directionLinks: true,
  firstText: 'First',
  previousText: 'Previous',
  nextText: 'Next',
  lastText: 'Last',
  rotate: true,
  forceEllipses: false
})

.directive('uibPagination', ['$parse', 'uibPaginationConfig', function($parse, uibPaginationConfig) {
  return {
    scope: {
      totalItems: '=',
      firstText: '@',
      previousText: '@',
      nextText: '@',
      lastText: '@',
      ngDisabled:'='
    },
    require: ['uibPagination', '?ngModel'],
    restrict: 'A',
    controller: 'UibPaginationController',
    controllerAs: 'pagination',
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/pagination/pagination.html';
    },
    link: function(scope, element, attrs, ctrls) {
      element.addClass('pagination');
      var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

      if (!ngModelCtrl) {
         return; // do nothing if no ng-model
      }

      paginationCtrl.init(ngModelCtrl, uibPaginationConfig);
    }
  };
}]);

/**
 * The following features are still outstanding: animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html tooltips, and selector delegation.
 */
angular.module('ui.bootstrap.tooltip', ['ui.bootstrap.position', 'ui.bootstrap.stackedMap'])

/**
 * The $tooltip service creates tooltip- and popover-like directives as well as
 * houses global options for them.
 */
.provider('$uibTooltip', function() {
  // The default options tooltip and popover.
  var defaultOptions = {
    placement: 'top',
    placementClassPrefix: '',
    animation: true,
    popupDelay: 0,
    popupCloseDelay: 0,
    useContentExp: false
  };

  // Default hide triggers for each show trigger
  var triggerMap = {
    'mouseenter': 'mouseleave',
    'click': 'click',
    'outsideClick': 'outsideClick',
    'focus': 'blur',
    'none': ''
  };

  // The options specified to the provider globally.
  var globalOptions = {};

  /**
   * `options({})` allows global configuration of all tooltips in the
   * application.
   *
   *   var app = angular.module( 'App', ['ui.bootstrap.tooltip'], function( $tooltipProvider ) {
   *     // place tooltips left instead of top by default
   *     $tooltipProvider.options( { placement: 'left' } );
   *   });
   */
	this.options = function(value) {
		angular.extend(globalOptions, value);
	};

  /**
   * This allows you to extend the set of trigger mappings available. E.g.:
   *
   *   $tooltipProvider.setTriggers( { 'openTrigger': 'closeTrigger' } );
   */
  this.setTriggers = function setTriggers(triggers) {
    angular.extend(triggerMap, triggers);
  };

  /**
   * This is a helper function for translating camel-case to snake_case.
   */
  function snake_case(name) {
    var regexp = /[A-Z]/g;
    var separator = '-';
    return name.replace(regexp, function(letter, pos) {
      return (pos ? separator : '') + letter.toLowerCase();
    });
  }

  /**
   * Returns the actual instance of the $tooltip service.
   * TODO support multiple triggers
   */
  this.$get = ['$window', '$compile', '$timeout', '$document', '$uibPosition', '$interpolate', '$rootScope', '$parse', '$$stackedMap', function($window, $compile, $timeout, $document, $position, $interpolate, $rootScope, $parse, $$stackedMap) {
    var openedTooltips = $$stackedMap.createNew();
    $document.on('keyup', keypressListener);

    $rootScope.$on('$destroy', function() {
      $document.off('keyup', keypressListener);
    });

    function keypressListener(e) {
      if (e.which === 27) {
        var last = openedTooltips.top();
        if (last) {
          last.value.close();
          last = null;
        }
      }
    }

    return function $tooltip(ttType, prefix, defaultTriggerShow, options) {
      options = angular.extend({}, defaultOptions, globalOptions, options);

      /**
       * Returns an object of show and hide triggers.
       *
       * If a trigger is supplied,
       * it is used to show the tooltip; otherwise, it will use the `trigger`
       * option passed to the `$tooltipProvider.options` method; else it will
       * default to the trigger supplied to this directive factory.
       *
       * The hide trigger is based on the show trigger. If the `trigger` option
       * was passed to the `$tooltipProvider.options` method, it will use the
       * mapped trigger from `triggerMap` or the passed trigger if the map is
       * undefined; otherwise, it uses the `triggerMap` value of the show
       * trigger; else it will just use the show trigger.
       */
      function getTriggers(trigger) {
        var show = (trigger || options.trigger || defaultTriggerShow).split(' ');
        var hide = show.map(function(trigger) {
          return triggerMap[trigger] || trigger;
        });
        return {
          show: show,
          hide: hide
        };
      }

      var directiveName = snake_case(ttType);

      var startSym = $interpolate.startSymbol();
      var endSym = $interpolate.endSymbol();
      var template =
        '<div '+ directiveName + '-popup ' +
          'uib-title="' + startSym + 'title' + endSym + '" ' +
          (options.useContentExp ?
            'content-exp="contentExp()" ' :
            'content="' + startSym + 'content' + endSym + '" ') +
          'origin-scope="origScope" ' +
          'class="uib-position-measure ' + prefix + '" ' +
          'tooltip-animation-class="fade"' +
          'uib-tooltip-classes ' +
          'ng-class="{ in: isOpen }" ' +
          '>' +
        '</div>';

      return {
        compile: function(tElem, tAttrs) {
          var tooltipLinker = $compile(template);

          return function link(scope, element, attrs, tooltipCtrl) {
            var tooltip;
            var tooltipLinkedScope;
            var transitionTimeout;
            var showTimeout;
            var hideTimeout;
            var positionTimeout;
            var adjustmentTimeout;
            var appendToBody = angular.isDefined(options.appendToBody) ? options.appendToBody : false;
            var triggers = getTriggers(undefined);
            var hasEnableExp = angular.isDefined(attrs[prefix + 'Enable']);
            var ttScope = scope.$new(true);
            var repositionScheduled = false;
            var isOpenParse = angular.isDefined(attrs[prefix + 'IsOpen']) ? $parse(attrs[prefix + 'IsOpen']) : false;
            var contentParse = options.useContentExp ? $parse(attrs[ttType]) : false;
            var observers = [];
            var lastPlacement;

            var positionTooltip = function() {
              // check if tooltip exists and is not empty
              if (!tooltip || !tooltip.html()) { return; }

              if (!positionTimeout) {
                positionTimeout = $timeout(function() {
                  var ttPosition = $position.positionElements(element, tooltip, ttScope.placement, appendToBody);
                  var initialHeight = angular.isDefined(tooltip.offsetHeight) ? tooltip.offsetHeight : tooltip.prop('offsetHeight');
                  var elementPos = appendToBody ? $position.offset(element) : $position.position(element);
                  tooltip.css({ top: ttPosition.top + 'px', left: ttPosition.left + 'px' });
                  var placementClasses = ttPosition.placement.split('-');

                  if (!tooltip.hasClass(placementClasses[0])) {
                    tooltip.removeClass(lastPlacement.split('-')[0]);
                    tooltip.addClass(placementClasses[0]);
                  }

                  if (!tooltip.hasClass(options.placementClassPrefix + ttPosition.placement)) {
                    tooltip.removeClass(options.placementClassPrefix + lastPlacement);
                    tooltip.addClass(options.placementClassPrefix + ttPosition.placement);
                  }

                  adjustmentTimeout = $timeout(function() {
                    var currentHeight = angular.isDefined(tooltip.offsetHeight) ? tooltip.offsetHeight : tooltip.prop('offsetHeight');
                    var adjustment = $position.adjustTop(placementClasses, elementPos, initialHeight, currentHeight);
                    if (adjustment) {
                      tooltip.css(adjustment);
                    }
                    adjustmentTimeout = null;
                  }, 0, false);

                  // first time through tt element will have the
                  // uib-position-measure class or if the placement
                  // has changed we need to position the arrow.
                  if (tooltip.hasClass('uib-position-measure')) {
                    $position.positionArrow(tooltip, ttPosition.placement);
                    tooltip.removeClass('uib-position-measure');
                  } else if (lastPlacement !== ttPosition.placement) {
                    $position.positionArrow(tooltip, ttPosition.placement);
                  }
                  lastPlacement = ttPosition.placement;

                  positionTimeout = null;
                }, 0, false);
              }
            };

            // Set up the correct scope to allow transclusion later
            ttScope.origScope = scope;

            // By default, the tooltip is not open.
            // TODO add ability to start tooltip opened
            ttScope.isOpen = false;

            function toggleTooltipBind() {
              if (!ttScope.isOpen) {
                showTooltipBind();
              } else {
                hideTooltipBind();
              }
            }

            // Show the tooltip with delay if specified, otherwise show it immediately
            function showTooltipBind() {
              if (hasEnableExp && !scope.$eval(attrs[prefix + 'Enable'])) {
                return;
              }

              cancelHide();
              prepareTooltip();

              if (ttScope.popupDelay) {
                // Do nothing if the tooltip was already scheduled to pop-up.
                // This happens if show is triggered multiple times before any hide is triggered.
                if (!showTimeout) {
                  showTimeout = $timeout(show, ttScope.popupDelay, false);
                }
              } else {
                show();
              }
            }

            function hideTooltipBind() {
              cancelShow();

              if (ttScope.popupCloseDelay) {
                if (!hideTimeout) {
                  hideTimeout = $timeout(hide, ttScope.popupCloseDelay, false);
                }
              } else {
                hide();
              }
            }

            // Show the tooltip popup element.
            function show() {
              cancelShow();
              cancelHide();

              // Don't show empty tooltips.
              if (!ttScope.content) {
                return angular.noop;
              }

              createTooltip();

              // And show the tooltip.
              ttScope.$evalAsync(function() {
                ttScope.isOpen = true;
                assignIsOpen(true);
                positionTooltip();
              });
            }

            function cancelShow() {
              if (showTimeout) {
                $timeout.cancel(showTimeout);
                showTimeout = null;
              }

              if (positionTimeout) {
                $timeout.cancel(positionTimeout);
                positionTimeout = null;
              }
            }

            // Hide the tooltip popup element.
            function hide() {
              if (!ttScope) {
                return;
              }

              // First things first: we don't show it anymore.
              ttScope.$evalAsync(function() {
                if (ttScope) {
                  ttScope.isOpen = false;
                  assignIsOpen(false);
                  // And now we remove it from the DOM. However, if we have animation, we
                  // need to wait for it to expire beforehand.
                  // FIXME: this is a placeholder for a port of the transitions library.
                  // The fade transition in TWBS is 150ms.
                  if (ttScope.animation) {
                    if (!transitionTimeout) {
                      transitionTimeout = $timeout(removeTooltip, 150, false);
                    }
                  } else {
                    removeTooltip();
                  }
                }
              });
            }

            function cancelHide() {
              if (hideTimeout) {
                $timeout.cancel(hideTimeout);
                hideTimeout = null;
              }

              if (transitionTimeout) {
                $timeout.cancel(transitionTimeout);
                transitionTimeout = null;
              }
            }

            function createTooltip() {
              // There can only be one tooltip element per directive shown at once.
              if (tooltip) {
                return;
              }

              tooltipLinkedScope = ttScope.$new();
              tooltip = tooltipLinker(tooltipLinkedScope, function(tooltip) {
                if (appendToBody) {
                  $document.find('body').append(tooltip);
                } else {
                  element.after(tooltip);
                }
              });

              openedTooltips.add(ttScope, {
                close: hide
              });

              prepObservers();
            }

            function removeTooltip() {
              cancelShow();
              cancelHide();
              unregisterObservers();

              if (tooltip) {
                tooltip.remove();
                
                tooltip = null;
                if (adjustmentTimeout) {
                  $timeout.cancel(adjustmentTimeout);
                }
              }

              openedTooltips.remove(ttScope);
              
              if (tooltipLinkedScope) {
                tooltipLinkedScope.$destroy();
                tooltipLinkedScope = null;
              }
            }

            /**
             * Set the initial scope values. Once
             * the tooltip is created, the observers
             * will be added to keep things in sync.
             */
            function prepareTooltip() {
              ttScope.title = attrs[prefix + 'Title'];
              if (contentParse) {
                ttScope.content = contentParse(scope);
              } else {
                ttScope.content = attrs[ttType];
              }

              ttScope.popupClass = attrs[prefix + 'Class'];
              ttScope.placement = angular.isDefined(attrs[prefix + 'Placement']) ? attrs[prefix + 'Placement'] : options.placement;
              var placement = $position.parsePlacement(ttScope.placement);
              lastPlacement = placement[1] ? placement[0] + '-' + placement[1] : placement[0];

              var delay = parseInt(attrs[prefix + 'PopupDelay'], 10);
              var closeDelay = parseInt(attrs[prefix + 'PopupCloseDelay'], 10);
              ttScope.popupDelay = !isNaN(delay) ? delay : options.popupDelay;
              ttScope.popupCloseDelay = !isNaN(closeDelay) ? closeDelay : options.popupCloseDelay;
            }

            function assignIsOpen(isOpen) {
              if (isOpenParse && angular.isFunction(isOpenParse.assign)) {
                isOpenParse.assign(scope, isOpen);
              }
            }

            ttScope.contentExp = function() {
              return ttScope.content;
            };

            /**
             * Observe the relevant attributes.
             */
            attrs.$observe('disabled', function(val) {
              if (val) {
                cancelShow();
              }

              if (val && ttScope.isOpen) {
                hide();
              }
            });

            if (isOpenParse) {
              scope.$watch(isOpenParse, function(val) {
                if (ttScope && !val === ttScope.isOpen) {
                  toggleTooltipBind();
                }
              });
            }

            function prepObservers() {
              observers.length = 0;

              if (contentParse) {
                observers.push(
                  scope.$watch(contentParse, function(val) {
                    ttScope.content = val;
                    if (!val && ttScope.isOpen) {
                      hide();
                    }
                  })
                );

                observers.push(
                  tooltipLinkedScope.$watch(function() {
                    if (!repositionScheduled) {
                      repositionScheduled = true;
                      tooltipLinkedScope.$$postDigest(function() {
                        repositionScheduled = false;
                        if (ttScope && ttScope.isOpen) {
                          positionTooltip();
                        }
                      });
                    }
                  })
                );
              } else {
                observers.push(
                  attrs.$observe(ttType, function(val) {
                    ttScope.content = val;
                    if (!val && ttScope.isOpen) {
                      hide();
                    } else {
                      positionTooltip();
                    }
                  })
                );
              }

              observers.push(
                attrs.$observe(prefix + 'Title', function(val) {
                  ttScope.title = val;
                  if (ttScope.isOpen) {
                    positionTooltip();
                  }
                })
              );

              observers.push(
                attrs.$observe(prefix + 'Placement', function(val) {
                  ttScope.placement = val ? val : options.placement;
                  if (ttScope.isOpen) {
                    positionTooltip();
                  }
                })
              );
            }

            function unregisterObservers() {
              if (observers.length) {
                angular.forEach(observers, function(observer) {
                  observer();
                });
                observers.length = 0;
              }
            }

            // hide tooltips/popovers for outsideClick trigger
            function bodyHideTooltipBind(e) {
              if (!ttScope || !ttScope.isOpen || !tooltip) {
                return;
              }
              // make sure the tooltip/popover link or tool tooltip/popover itself were not clicked
              if (!element[0].contains(e.target) && !tooltip[0].contains(e.target)) {
                hideTooltipBind();
              }
            }

            // KeyboardEvent handler to hide the tooltip on Escape key press
            function hideOnEscapeKey(e) {
              if (e.which === 27) {
                hideTooltipBind();
              }
            }

            var unregisterTriggers = function() {
              triggers.show.forEach(function(trigger) {
                if (trigger === 'outsideClick') {
                  element.off('click', toggleTooltipBind);
                } else {
                  element.off(trigger, showTooltipBind);
                  element.off(trigger, toggleTooltipBind);
                }
                element.off('keypress', hideOnEscapeKey);
              });
              triggers.hide.forEach(function(trigger) {
                if (trigger === 'outsideClick') {
                  $document.off('click', bodyHideTooltipBind);
                } else {
                  element.off(trigger, hideTooltipBind);
                }
              });
            };

            function prepTriggers() {
              var showTriggers = [], hideTriggers = [];
              var val = scope.$eval(attrs[prefix + 'Trigger']);
              unregisterTriggers();

              if (angular.isObject(val)) {
                Object.keys(val).forEach(function(key) {
                  showTriggers.push(key);
                  hideTriggers.push(val[key]);
                });
                triggers = {
                  show: showTriggers,
                  hide: hideTriggers
                };
              } else {
                triggers = getTriggers(val);
              }

              if (triggers.show !== 'none') {
                triggers.show.forEach(function(trigger, idx) {
                  if (trigger === 'outsideClick') {
                    element.on('click', toggleTooltipBind);
                    $document.on('click', bodyHideTooltipBind);
                  } else if (trigger === triggers.hide[idx]) {
                    element.on(trigger, toggleTooltipBind);
                  } else if (trigger) {
                    element.on(trigger, showTooltipBind);
                    element.on(triggers.hide[idx], hideTooltipBind);
                  }
                  element.on('keypress', hideOnEscapeKey);
                });
              }
            }

            prepTriggers();

            var animation = scope.$eval(attrs[prefix + 'Animation']);
            ttScope.animation = angular.isDefined(animation) ? !!animation : options.animation;

            var appendToBodyVal;
            var appendKey = prefix + 'AppendToBody';
            if (appendKey in attrs && attrs[appendKey] === undefined) {
              appendToBodyVal = true;
            } else {
              appendToBodyVal = scope.$eval(attrs[appendKey]);
            }

            appendToBody = angular.isDefined(appendToBodyVal) ? appendToBodyVal : appendToBody;

            // Make sure tooltip is destroyed and removed.
            scope.$on('$destroy', function onDestroyTooltip() {
              unregisterTriggers();
              removeTooltip();
              ttScope = null;
            });
          };
        }
      };
    };
  }];
})

// This is mostly ngInclude code but with a custom scope
.directive('uibTooltipTemplateTransclude', [
         '$animate', '$sce', '$compile', '$templateRequest',
function ($animate, $sce, $compile, $templateRequest) {
  return {
    link: function(scope, elem, attrs) {
      var origScope = scope.$eval(attrs.tooltipTemplateTranscludeScope);

      var changeCounter = 0,
        currentScope,
        previousElement,
        currentElement;

      var cleanupLastIncludeContent = function() {
        if (previousElement) {
          previousElement.remove();
          previousElement = null;
        }

        if (currentScope) {
          currentScope.$destroy();
          currentScope = null;
        }

        if (currentElement) {
          $animate.leave(currentElement).then(function() {
            previousElement = null;
          });
          previousElement = currentElement;
          currentElement = null;
        }
      };

      scope.$watch($sce.parseAsResourceUrl(attrs.uibTooltipTemplateTransclude), function(src) {
        var thisChangeId = ++changeCounter;

        if (src) {
          //set the 2nd param to true to ignore the template request error so that the inner
          //contents and scope can be cleaned up.
          $templateRequest(src, true).then(function(response) {
            if (thisChangeId !== changeCounter) { return; }
            var newScope = origScope.$new();
            var template = response;

            var clone = $compile(template)(newScope, function(clone) {
              cleanupLastIncludeContent();
              $animate.enter(clone, elem);
            });

            currentScope = newScope;
            currentElement = clone;

            currentScope.$emit('$includeContentLoaded', src);
          }, function() {
            if (thisChangeId === changeCounter) {
              cleanupLastIncludeContent();
              scope.$emit('$includeContentError', src);
            }
          });
          scope.$emit('$includeContentRequested', src);
        } else {
          cleanupLastIncludeContent();
        }
      });

      scope.$on('$destroy', cleanupLastIncludeContent);
    }
  };
}])

/**
 * Note that it's intentional that these classes are *not* applied through $animate.
 * They must not be animated as they're expected to be present on the tooltip on
 * initialization.
 */
.directive('uibTooltipClasses', ['$uibPosition', function($uibPosition) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // need to set the primary position so the
      // arrow has space during position measure.
      // tooltip.positionTooltip()
      if (scope.placement) {
        // // There are no top-left etc... classes
        // // in TWBS, so we need the primary position.
        var position = $uibPosition.parsePlacement(scope.placement);
        element.addClass(position[0]);
      }

      if (scope.popupClass) {
        element.addClass(scope.popupClass);
      }

      if (scope.animation) {
        element.addClass(attrs.tooltipAnimationClass);
      }
    }
  };
}])

.directive('uibTooltipPopup', function() {
  return {
    restrict: 'A',
    scope: { content: '@' },
    templateUrl: 'uib/template/tooltip/tooltip-popup.html'
  };
})

.directive('uibTooltip', [ '$uibTooltip', function($uibTooltip) {
  return $uibTooltip('uibTooltip', 'tooltip', 'mouseenter');
}])

.directive('uibTooltipTemplatePopup', function() {
  return {
    restrict: 'A',
    scope: { contentExp: '&', originScope: '&' },
    templateUrl: 'uib/template/tooltip/tooltip-template-popup.html'
  };
})

.directive('uibTooltipTemplate', ['$uibTooltip', function($uibTooltip) {
  return $uibTooltip('uibTooltipTemplate', 'tooltip', 'mouseenter', {
    useContentExp: true
  });
}])

.directive('uibTooltipHtmlPopup', function() {
  return {
    restrict: 'A',
    scope: { contentExp: '&' },
    templateUrl: 'uib/template/tooltip/tooltip-html-popup.html'
  };
})

.directive('uibTooltipHtml', ['$uibTooltip', function($uibTooltip) {
  return $uibTooltip('uibTooltipHtml', 'tooltip', 'mouseenter', {
    useContentExp: true
  });
}]);

/**
 * The following features are still outstanding: popup delay, animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, and selector delegatation.
 */
angular.module('ui.bootstrap.popover', ['ui.bootstrap.tooltip'])

.directive('uibPopoverTemplatePopup', function() {
  return {
    restrict: 'A',
    scope: { uibTitle: '@', contentExp: '&', originScope: '&' },
    templateUrl: 'uib/template/popover/popover-template.html'
  };
})

.directive('uibPopoverTemplate', ['$uibTooltip', function($uibTooltip) {
  return $uibTooltip('uibPopoverTemplate', 'popover', 'click', {
    useContentExp: true
  });
}])

.directive('uibPopoverHtmlPopup', function() {
  return {
    restrict: 'A',
    scope: { contentExp: '&', uibTitle: '@' },
    templateUrl: 'uib/template/popover/popover-html.html'
  };
})

.directive('uibPopoverHtml', ['$uibTooltip', function($uibTooltip) {
  return $uibTooltip('uibPopoverHtml', 'popover', 'click', {
    useContentExp: true
  });
}])

.directive('uibPopoverPopup', function() {
  return {
    restrict: 'A',
    scope: { uibTitle: '@', content: '@' },
    templateUrl: 'uib/template/popover/popover.html'
  };
})

.directive('uibPopover', ['$uibTooltip', function($uibTooltip) {
  return $uibTooltip('uibPopover', 'popover', 'click');
}]);

angular.module('ui.bootstrap.progressbar', [])

.constant('uibProgressConfig', {
  animate: true,
  max: 100
})

.controller('UibProgressController', ['$scope', '$attrs', 'uibProgressConfig', function($scope, $attrs, progressConfig) {
  var self = this,
      animate = angular.isDefined($attrs.animate) ? $scope.$parent.$eval($attrs.animate) : progressConfig.animate;

  this.bars = [];
  $scope.max = getMaxOrDefault();

  this.addBar = function(bar, element, attrs) {
    if (!animate) {
      element.css({'transition': 'none'});
    }

    this.bars.push(bar);

    bar.max = getMaxOrDefault();
    bar.title = attrs && angular.isDefined(attrs.title) ? attrs.title : 'progressbar';

    bar.$watch('value', function(value) {
      bar.recalculatePercentage();
    });

    bar.recalculatePercentage = function() {
      var totalPercentage = self.bars.reduce(function(total, bar) {
        bar.percent = +(100 * bar.value / bar.max).toFixed(2);
        return total + bar.percent;
      }, 0);

      if (totalPercentage > 100) {
        bar.percent -= totalPercentage - 100;
      }
    };

    bar.$on('$destroy', function() {
      element = null;
      self.removeBar(bar);
    });
  };

  this.removeBar = function(bar) {
    this.bars.splice(this.bars.indexOf(bar), 1);
    this.bars.forEach(function (bar) {
      bar.recalculatePercentage();
    });
  };

  //$attrs.$observe('maxParam', function(maxParam) {
  $scope.$watch('maxParam', function(maxParam) {
    self.bars.forEach(function(bar) {
      bar.max = getMaxOrDefault();
      bar.recalculatePercentage();
    });
  });

  function getMaxOrDefault () {
    return angular.isDefined($scope.maxParam) ? $scope.maxParam : progressConfig.max;
  }
}])

.directive('uibProgress', function() {
  return {
    replace: true,
    transclude: true,
    controller: 'UibProgressController',
    require: 'uibProgress',
    scope: {
      maxParam: '=?max'
    },
    templateUrl: 'uib/template/progressbar/progress.html'
  };
})

.directive('uibBar', function() {
  return {
    replace: true,
    transclude: true,
    require: '^uibProgress',
    scope: {
      value: '=',
      type: '@'
    },
    templateUrl: 'uib/template/progressbar/bar.html',
    link: function(scope, element, attrs, progressCtrl) {
      progressCtrl.addBar(scope, element, attrs);
    }
  };
})

.directive('uibProgressbar', function() {
  return {
    replace: true,
    transclude: true,
    controller: 'UibProgressController',
    scope: {
      value: '=',
      maxParam: '=?max',
      type: '@'
    },
    templateUrl: 'uib/template/progressbar/progressbar.html',
    link: function(scope, element, attrs, progressCtrl) {
      progressCtrl.addBar(scope, angular.element(element.children()[0]), {title: attrs.title});
    }
  };
});

angular.module('ui.bootstrap.rating', [])

.constant('uibRatingConfig', {
  max: 5,
  stateOn: null,
  stateOff: null,
  enableReset: true,
  titles: ['one', 'two', 'three', 'four', 'five']
})

.controller('UibRatingController', ['$scope', '$attrs', 'uibRatingConfig', function($scope, $attrs, ratingConfig) {
  var ngModelCtrl = { $setViewValue: angular.noop },
    self = this;

  this.init = function(ngModelCtrl_) {
    ngModelCtrl = ngModelCtrl_;
    ngModelCtrl.$render = this.render;

    ngModelCtrl.$formatters.push(function(value) {
      if (angular.isNumber(value) && value << 0 !== value) {
        value = Math.round(value);
      }

      return value;
    });

    this.stateOn = angular.isDefined($attrs.stateOn) ? $scope.$parent.$eval($attrs.stateOn) : ratingConfig.stateOn;
    this.stateOff = angular.isDefined($attrs.stateOff) ? $scope.$parent.$eval($attrs.stateOff) : ratingConfig.stateOff;
    this.enableReset = angular.isDefined($attrs.enableReset) ?
      $scope.$parent.$eval($attrs.enableReset) : ratingConfig.enableReset;
    var tmpTitles = angular.isDefined($attrs.titles) ? $scope.$parent.$eval($attrs.titles) : ratingConfig.titles;
    this.titles = angular.isArray(tmpTitles) && tmpTitles.length > 0 ?
      tmpTitles : ratingConfig.titles;

    var ratingStates = angular.isDefined($attrs.ratingStates) ?
      $scope.$parent.$eval($attrs.ratingStates) :
      new Array(angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : ratingConfig.max);
    $scope.range = this.buildTemplateObjects(ratingStates);
  };

  this.buildTemplateObjects = function(states) {
    for (var i = 0, n = states.length; i < n; i++) {
      states[i] = angular.extend({ index: i }, { stateOn: this.stateOn, stateOff: this.stateOff, title: this.getTitle(i) }, states[i]);
    }
    return states;
  };

  this.getTitle = function(index) {
    if (index >= this.titles.length) {
      return index + 1;
    }

    return this.titles[index];
  };

  $scope.rate = function(value) {
    if (!$scope.readonly && value >= 0 && value <= $scope.range.length) {
      var newViewValue = self.enableReset && ngModelCtrl.$viewValue === value ? 0 : value;
      ngModelCtrl.$setViewValue(newViewValue);
      ngModelCtrl.$render();
    }
  };

  $scope.enter = function(value) {
    if (!$scope.readonly) {
      $scope.value = value;
    }
    $scope.onHover({value: value});
  };

  $scope.reset = function() {
    $scope.value = ngModelCtrl.$viewValue;
    $scope.onLeave();
  };

  $scope.onKeydown = function(evt) {
    if (/(37|38|39|40)/.test(evt.which)) {
      evt.preventDefault();
      evt.stopPropagation();
      $scope.rate($scope.value + (evt.which === 38 || evt.which === 39 ? 1 : -1));
    }
  };

  this.render = function() {
    $scope.value = ngModelCtrl.$viewValue;
    $scope.title = self.getTitle($scope.value - 1);
  };
}])

.directive('uibRating', function() {
  return {
    require: ['uibRating', 'ngModel'],
    restrict: 'A',
    scope: {
      readonly: '=?readOnly',
      onHover: '&',
      onLeave: '&'
    },
    controller: 'UibRatingController',
    templateUrl: 'uib/template/rating/rating.html',
    link: function(scope, element, attrs, ctrls) {
      var ratingCtrl = ctrls[0], ngModelCtrl = ctrls[1];
      ratingCtrl.init(ngModelCtrl);
    }
  };
});

angular.module('ui.bootstrap.tabs', [])

.controller('UibTabsetController', ['$scope', function ($scope) {
  var ctrl = this,
    oldIndex;
  ctrl.tabs = [];

  ctrl.select = function(index, evt) {
    if (!destroyed) {
      var previousIndex = findTabIndex(oldIndex);
      var previousSelected = ctrl.tabs[previousIndex];
      if (previousSelected) {
        previousSelected.tab.onDeselect({
          $event: evt,
          $selectedIndex: index
        });
        if (evt && evt.isDefaultPrevented()) {
          return;
        }
        previousSelected.tab.active = false;
      }

      var selected = ctrl.tabs[index];
      if (selected) {
        selected.tab.onSelect({
          $event: evt
        });
        selected.tab.active = true;
        ctrl.active = selected.index;
        oldIndex = selected.index;
      } else if (!selected && angular.isDefined(oldIndex)) {
        ctrl.active = null;
        oldIndex = null;
      }
    }
  };

  ctrl.addTab = function addTab(tab) {
    ctrl.tabs.push({
      tab: tab,
      index: tab.index
    });
    ctrl.tabs.sort(function(t1, t2) {
      if (t1.index > t2.index) {
        return 1;
      }

      if (t1.index < t2.index) {
        return -1;
      }

      return 0;
    });

    if (tab.index === ctrl.active || !angular.isDefined(ctrl.active) && ctrl.tabs.length === 1) {
      var newActiveIndex = findTabIndex(tab.index);
      ctrl.select(newActiveIndex);
    }
  };

  ctrl.removeTab = function removeTab(tab) {
    var index;
    for (var i = 0; i < ctrl.tabs.length; i++) {
      if (ctrl.tabs[i].tab === tab) {
        index = i;
        break;
      }
    }

    if (ctrl.tabs[index].index === ctrl.active) {
      var newActiveTabIndex = index === ctrl.tabs.length - 1 ?
        index - 1 : index + 1 % ctrl.tabs.length;
      ctrl.select(newActiveTabIndex);
    }

    ctrl.tabs.splice(index, 1);
  };

  $scope.$watch('tabset.active', function(val) {
    if (angular.isDefined(val) && val !== oldIndex) {
      ctrl.select(findTabIndex(val));
    }
  });

  var destroyed;
  $scope.$on('$destroy', function() {
    destroyed = true;
  });

  function findTabIndex(index) {
    for (var i = 0; i < ctrl.tabs.length; i++) {
      if (ctrl.tabs[i].index === index) {
        return i;
      }
    }
  }
}])

.directive('uibTabset', function() {
  return {
    transclude: true,
    replace: true,
    scope: {},
    bindToController: {
      active: '=?',
      type: '@'
    },
    controller: 'UibTabsetController',
    controllerAs: 'tabset',
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/tabs/tabset.html';
    },
    link: function(scope, element, attrs) {
      scope.vertical = angular.isDefined(attrs.vertical) ?
        scope.$parent.$eval(attrs.vertical) : false;
      scope.justified = angular.isDefined(attrs.justified) ?
        scope.$parent.$eval(attrs.justified) : false;
    }
  };
})

.directive('uibTab', ['$parse', function($parse) {
  return {
    require: '^uibTabset',
    replace: true,
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || 'uib/template/tabs/tab.html';
    },
    transclude: true,
    scope: {
      heading: '@',
      index: '=?',
      classes: '@?',
      onSelect: '&select', //This callback is called in contentHeadingTransclude
                          //once it inserts the tab's content into the dom
      onDeselect: '&deselect'
    },
    controller: function() {
      //Empty controller so other directives can require being 'under' a tab
    },
    controllerAs: 'tab',
    link: function(scope, elm, attrs, tabsetCtrl, transclude) {
      scope.disabled = false;
      if (attrs.disable) {
        scope.$parent.$watch($parse(attrs.disable), function(value) {
          scope.disabled = !! value;
        });
      }

      if (angular.isUndefined(attrs.index)) {
        if (tabsetCtrl.tabs && tabsetCtrl.tabs.length) {
          scope.index = Math.max.apply(null, tabsetCtrl.tabs.map(function(t) { return t.index; })) + 1;
        } else {
          scope.index = 0;
        }
      }

      if (angular.isUndefined(attrs.classes)) {
        scope.classes = '';
      }

      scope.select = function(evt) {
        if (!scope.disabled) {
          var index;
          for (var i = 0; i < tabsetCtrl.tabs.length; i++) {
            if (tabsetCtrl.tabs[i].tab === scope) {
              index = i;
              break;
            }
          }

          tabsetCtrl.select(index, evt);
        }
      };

      tabsetCtrl.addTab(scope);
      scope.$on('$destroy', function() {
        tabsetCtrl.removeTab(scope);
      });

      //We need to transclude later, once the content container is ready.
      //when this link happens, we're inside a tab heading.
      scope.$transcludeFn = transclude;
    }
  };
}])

.directive('uibTabHeadingTransclude', function() {
  return {
    restrict: 'A',
    require: '^uibTab',
    link: function(scope, elm) {
      scope.$watch('headingElement', function updateHeadingElement(heading) {
        if (heading) {
          elm.html('');
          elm.append(heading);
        }
      });
    }
  };
})

.directive('uibTabContentTransclude', function() {
  return {
    restrict: 'A',
    require: '^uibTabset',
    link: function(scope, elm, attrs) {
      var tab = scope.$eval(attrs.uibTabContentTransclude).tab;

      //Now our tab is ready to be transcluded: both the tab heading area
      //and the tab content area are loaded.  Transclude 'em both.
      tab.$transcludeFn(tab.$parent, function(contents) {
        angular.forEach(contents, function(node) {
          if (isTabHeading(node)) {
            //Let tabHeadingTransclude know.
            tab.headingElement = node;
          } else {
            elm.append(node);
          }
        });
      });
    }
  };

  function isTabHeading(node) {
    return node.tagName && (
      node.hasAttribute('uib-tab-heading') ||
      node.hasAttribute('data-uib-tab-heading') ||
      node.hasAttribute('x-uib-tab-heading') ||
      node.tagName.toLowerCase() === 'uib-tab-heading' ||
      node.tagName.toLowerCase() === 'data-uib-tab-heading' ||
      node.tagName.toLowerCase() === 'x-uib-tab-heading' ||
      node.tagName.toLowerCase() === 'uib:tab-heading'
    );
  }
});

angular.module('ui.bootstrap.timepicker', [])

.constant('uibTimepickerConfig', {
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
  showMeridian: true,
  showSeconds: false,
  meridians: null,
  readonlyInput: false,
  mousewheel: true,
  arrowkeys: true,
  showSpinners: true,
  templateUrl: 'uib/template/timepicker/timepicker.html'
})

.controller('UibTimepickerController', ['$scope', '$element', '$attrs', '$parse', '$log', '$locale', 'uibTimepickerConfig', function($scope, $element, $attrs, $parse, $log, $locale, timepickerConfig) {
  var hoursModelCtrl, minutesModelCtrl, secondsModelCtrl;
  var selected = new Date(),
    watchers = [],
    ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
    meridians = angular.isDefined($attrs.meridians) ? $scope.$parent.$eval($attrs.meridians) : timepickerConfig.meridians || $locale.DATETIME_FORMATS.AMPMS,
    padHours = angular.isDefined($attrs.padHours) ? $scope.$parent.$eval($attrs.padHours) : true;

  $scope.tabindex = angular.isDefined($attrs.tabindex) ? $attrs.tabindex : 0;
  $element.removeAttr('tabindex');

  this.init = function(ngModelCtrl_, inputs) {
    ngModelCtrl = ngModelCtrl_;
    ngModelCtrl.$render = this.render;

    ngModelCtrl.$formatters.unshift(function(modelValue) {
      return modelValue ? new Date(modelValue) : null;
    });

    var hoursInputEl = inputs.eq(0),
        minutesInputEl = inputs.eq(1),
        secondsInputEl = inputs.eq(2);

    hoursModelCtrl = hoursInputEl.controller('ngModel');
    minutesModelCtrl = minutesInputEl.controller('ngModel');
    secondsModelCtrl = secondsInputEl.controller('ngModel');

    var mousewheel = angular.isDefined($attrs.mousewheel) ? $scope.$parent.$eval($attrs.mousewheel) : timepickerConfig.mousewheel;

    if (mousewheel) {
      this.setupMousewheelEvents(hoursInputEl, minutesInputEl, secondsInputEl);
    }

    var arrowkeys = angular.isDefined($attrs.arrowkeys) ? $scope.$parent.$eval($attrs.arrowkeys) : timepickerConfig.arrowkeys;
    if (arrowkeys) {
      this.setupArrowkeyEvents(hoursInputEl, minutesInputEl, secondsInputEl);
    }

    $scope.readonlyInput = angular.isDefined($attrs.readonlyInput) ? $scope.$parent.$eval($attrs.readonlyInput) : timepickerConfig.readonlyInput;
    this.setupInputEvents(hoursInputEl, minutesInputEl, secondsInputEl);
  };

  var hourStep = timepickerConfig.hourStep;
  if ($attrs.hourStep) {
    watchers.push($scope.$parent.$watch($parse($attrs.hourStep), function(value) {
      hourStep = +value;
    }));
  }

  var minuteStep = timepickerConfig.minuteStep;
  if ($attrs.minuteStep) {
    watchers.push($scope.$parent.$watch($parse($attrs.minuteStep), function(value) {
      minuteStep = +value;
    }));
  }

  var min;
  watchers.push($scope.$parent.$watch($parse($attrs.min), function(value) {
    var dt = new Date(value);
    min = isNaN(dt) ? undefined : dt;
  }));

  var max;
  watchers.push($scope.$parent.$watch($parse($attrs.max), function(value) {
    var dt = new Date(value);
    max = isNaN(dt) ? undefined : dt;
  }));

  var disabled = false;
  if ($attrs.ngDisabled) {
    watchers.push($scope.$parent.$watch($parse($attrs.ngDisabled), function(value) {
      disabled = value;
    }));
  }

  $scope.noIncrementHours = function() {
    var incrementedSelected = addMinutes(selected, hourStep * 60);
    return disabled || incrementedSelected > max ||
      incrementedSelected < selected && incrementedSelected < min;
  };

  $scope.noDecrementHours = function() {
    var decrementedSelected = addMinutes(selected, -hourStep * 60);
    return disabled || decrementedSelected < min ||
      decrementedSelected > selected && decrementedSelected > max;
  };

  $scope.noIncrementMinutes = function() {
    var incrementedSelected = addMinutes(selected, minuteStep);
    return disabled || incrementedSelected > max ||
      incrementedSelected < selected && incrementedSelected < min;
  };

  $scope.noDecrementMinutes = function() {
    var decrementedSelected = addMinutes(selected, -minuteStep);
    return disabled || decrementedSelected < min ||
      decrementedSelected > selected && decrementedSelected > max;
  };

  $scope.noIncrementSeconds = function() {
    var incrementedSelected = addSeconds(selected, secondStep);
    return disabled || incrementedSelected > max ||
      incrementedSelected < selected && incrementedSelected < min;
  };

  $scope.noDecrementSeconds = function() {
    var decrementedSelected = addSeconds(selected, -secondStep);
    return disabled || decrementedSelected < min ||
      decrementedSelected > selected && decrementedSelected > max;
  };

  $scope.noToggleMeridian = function() {
    if (selected.getHours() < 12) {
      return disabled || addMinutes(selected, 12 * 60) > max;
    }

    return disabled || addMinutes(selected, -12 * 60) < min;
  };

  var secondStep = timepickerConfig.secondStep;
  if ($attrs.secondStep) {
    watchers.push($scope.$parent.$watch($parse($attrs.secondStep), function(value) {
      secondStep = +value;
    }));
  }

  $scope.showSeconds = timepickerConfig.showSeconds;
  if ($attrs.showSeconds) {
    watchers.push($scope.$parent.$watch($parse($attrs.showSeconds), function(value) {
      $scope.showSeconds = !!value;
    }));
  }

  // 12H / 24H mode
  $scope.showMeridian = timepickerConfig.showMeridian;
  if ($attrs.showMeridian) {
    watchers.push($scope.$parent.$watch($parse($attrs.showMeridian), function(value) {
      $scope.showMeridian = !!value;

      if (ngModelCtrl.$error.time) {
        // Evaluate from template
        var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate();
        if (angular.isDefined(hours) && angular.isDefined(minutes)) {
          selected.setHours(hours);
          refresh();
        }
      } else {
        updateTemplate();
      }
    }));
  }

  // Get $scope.hours in 24H mode if valid
  function getHoursFromTemplate() {
    var hours = +$scope.hours;
    var valid = $scope.showMeridian ? hours > 0 && hours < 13 :
      hours >= 0 && hours < 24;
    if (!valid || $scope.hours === '') {
      return undefined;
    }

    if ($scope.showMeridian) {
      if (hours === 12) {
        hours = 0;
      }
      if ($scope.meridian === meridians[1]) {
        hours = hours + 12;
      }
    }
    return hours;
  }

  function getMinutesFromTemplate() {
    var minutes = +$scope.minutes;
    var valid = minutes >= 0 && minutes < 60;
    if (!valid || $scope.minutes === '') {
      return undefined;
    }
    return minutes;
  }

  function getSecondsFromTemplate() {
    var seconds = +$scope.seconds;
    return seconds >= 0 && seconds < 60 ? seconds : undefined;
  }

  function pad(value, noPad) {
    if (value === null) {
      return '';
    }

    return angular.isDefined(value) && value.toString().length < 2 && !noPad ?
      '0' + value : value.toString();
  }

  // Respond on mousewheel spin
  this.setupMousewheelEvents = function(hoursInputEl, minutesInputEl, secondsInputEl) {
    var isScrollingUp = function(e) {
      if (e.originalEvent) {
        e = e.originalEvent;
      }
      //pick correct delta variable depending on event
      var delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;
      return e.detail || delta > 0;
    };

    hoursInputEl.on('mousewheel wheel', function(e) {
      if (!disabled) {
        $scope.$apply(isScrollingUp(e) ? $scope.incrementHours() : $scope.decrementHours());
      }
      e.preventDefault();
    });

    minutesInputEl.on('mousewheel wheel', function(e) {
      if (!disabled) {
        $scope.$apply(isScrollingUp(e) ? $scope.incrementMinutes() : $scope.decrementMinutes());
      }
      e.preventDefault();
    });

     secondsInputEl.on('mousewheel wheel', function(e) {
      if (!disabled) {
        $scope.$apply(isScrollingUp(e) ? $scope.incrementSeconds() : $scope.decrementSeconds());
      }
      e.preventDefault();
    });
  };

  // Respond on up/down arrowkeys
  this.setupArrowkeyEvents = function(hoursInputEl, minutesInputEl, secondsInputEl) {
    hoursInputEl.on('keydown', function(e) {
      if (!disabled) {
        if (e.which === 38) { // up
          e.preventDefault();
          $scope.incrementHours();
          $scope.$apply();
        } else if (e.which === 40) { // down
          e.preventDefault();
          $scope.decrementHours();
          $scope.$apply();
        }
      }
    });

    minutesInputEl.on('keydown', function(e) {
      if (!disabled) {
        if (e.which === 38) { // up
          e.preventDefault();
          $scope.incrementMinutes();
          $scope.$apply();
        } else if (e.which === 40) { // down
          e.preventDefault();
          $scope.decrementMinutes();
          $scope.$apply();
        }
      }
    });

    secondsInputEl.on('keydown', function(e) {
      if (!disabled) {
        if (e.which === 38) { // up
          e.preventDefault();
          $scope.incrementSeconds();
          $scope.$apply();
        } else if (e.which === 40) { // down
          e.preventDefault();
          $scope.decrementSeconds();
          $scope.$apply();
        }
      }
    });
  };

  this.setupInputEvents = function(hoursInputEl, minutesInputEl, secondsInputEl) {
    if ($scope.readonlyInput) {
      $scope.updateHours = angular.noop;
      $scope.updateMinutes = angular.noop;
      $scope.updateSeconds = angular.noop;
      return;
    }

    var invalidate = function(invalidHours, invalidMinutes, invalidSeconds) {
      ngModelCtrl.$setViewValue(null);
      ngModelCtrl.$setValidity('time', false);
      if (angular.isDefined(invalidHours)) {
        $scope.invalidHours = invalidHours;
        if (hoursModelCtrl) {
          hoursModelCtrl.$setValidity('hours', false);
        }
      }

      if (angular.isDefined(invalidMinutes)) {
        $scope.invalidMinutes = invalidMinutes;
        if (minutesModelCtrl) {
          minutesModelCtrl.$setValidity('minutes', false);
        }
      }

      if (angular.isDefined(invalidSeconds)) {
        $scope.invalidSeconds = invalidSeconds;
        if (secondsModelCtrl) {
          secondsModelCtrl.$setValidity('seconds', false);
        }
      }
    };

    $scope.updateHours = function() {
      var hours = getHoursFromTemplate(),
        minutes = getMinutesFromTemplate();

      ngModelCtrl.$setDirty();

      if (angular.isDefined(hours) && angular.isDefined(minutes)) {
        selected.setHours(hours);
        selected.setMinutes(minutes);
        if (selected < min || selected > max) {
          invalidate(true);
        } else {
          refresh('h');
        }
      } else {
        invalidate(true);
      }
    };

    hoursInputEl.on('blur', function(e) {
      ngModelCtrl.$setTouched();
      if (modelIsEmpty()) {
        makeValid();
      } else if ($scope.hours === null || $scope.hours === '') {
        invalidate(true);
      } else if (!$scope.invalidHours && $scope.hours < 10) {
        $scope.$apply(function() {
          $scope.hours = pad($scope.hours, !padHours);
        });
      }
    });

    $scope.updateMinutes = function() {
      var minutes = getMinutesFromTemplate(),
        hours = getHoursFromTemplate();

      ngModelCtrl.$setDirty();

      if (angular.isDefined(minutes) && angular.isDefined(hours)) {
        selected.setHours(hours);
        selected.setMinutes(minutes);
        if (selected < min || selected > max) {
          invalidate(undefined, true);
        } else {
          refresh('m');
        }
      } else {
        invalidate(undefined, true);
      }
    };

    minutesInputEl.on('blur', function(e) {
      ngModelCtrl.$setTouched();
      if (modelIsEmpty()) {
        makeValid();
      } else if ($scope.minutes === null) {
        invalidate(undefined, true);
      } else if (!$scope.invalidMinutes && $scope.minutes < 10) {
        $scope.$apply(function() {
          $scope.minutes = pad($scope.minutes);
        });
      }
    });

    $scope.updateSeconds = function() {
      var seconds = getSecondsFromTemplate();

      ngModelCtrl.$setDirty();

      if (angular.isDefined(seconds)) {
        selected.setSeconds(seconds);
        refresh('s');
      } else {
        invalidate(undefined, undefined, true);
      }
    };

    secondsInputEl.on('blur', function(e) {
      if (modelIsEmpty()) {
        makeValid();
      } else if (!$scope.invalidSeconds && $scope.seconds < 10) {
        $scope.$apply( function() {
          $scope.seconds = pad($scope.seconds);
        });
      }
    });

  };

  this.render = function() {
    var date = ngModelCtrl.$viewValue;

    if (isNaN(date)) {
      ngModelCtrl.$setValidity('time', false);
      $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
    } else {
      if (date) {
        selected = date;
      }

      if (selected < min || selected > max) {
        ngModelCtrl.$setValidity('time', false);
        $scope.invalidHours = true;
        $scope.invalidMinutes = true;
      } else {
        makeValid();
      }
      updateTemplate();
    }
  };

  // Call internally when we know that model is valid.
  function refresh(keyboardChange) {
    makeValid();
    ngModelCtrl.$setViewValue(new Date(selected));
    updateTemplate(keyboardChange);
  }

  function makeValid() {
    if (hoursModelCtrl) {
      hoursModelCtrl.$setValidity('hours', true);
    }

    if (minutesModelCtrl) {
      minutesModelCtrl.$setValidity('minutes', true);
    }

    if (secondsModelCtrl) {
      secondsModelCtrl.$setValidity('seconds', true);
    }

    ngModelCtrl.$setValidity('time', true);
    $scope.invalidHours = false;
    $scope.invalidMinutes = false;
    $scope.invalidSeconds = false;
  }

  function updateTemplate(keyboardChange) {
    if (!ngModelCtrl.$modelValue) {
      $scope.hours = null;
      $scope.minutes = null;
      $scope.seconds = null;
      $scope.meridian = meridians[0];
    } else {
      var hours = selected.getHours(),
        minutes = selected.getMinutes(),
        seconds = selected.getSeconds();

      if ($scope.showMeridian) {
        hours = hours === 0 || hours === 12 ? 12 : hours % 12; // Convert 24 to 12 hour system
      }

      $scope.hours = keyboardChange === 'h' ? hours : pad(hours, !padHours);
      if (keyboardChange !== 'm') {
        $scope.minutes = pad(minutes);
      }
      $scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];

      if (keyboardChange !== 's') {
        $scope.seconds = pad(seconds);
      }
      $scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];
    }
  }

  function addSecondsToSelected(seconds) {
    selected = addSeconds(selected, seconds);
    refresh();
  }

  function addMinutes(selected, minutes) {
    return addSeconds(selected, minutes*60);
  }

  function addSeconds(date, seconds) {
    var dt = new Date(date.getTime() + seconds * 1000);
    var newDate = new Date(date);
    newDate.setHours(dt.getHours(), dt.getMinutes(), dt.getSeconds());
    return newDate;
  }

  function modelIsEmpty() {
    return ($scope.hours === null || $scope.hours === '') &&
      ($scope.minutes === null || $scope.minutes === '') &&
      (!$scope.showSeconds || $scope.showSeconds && ($scope.seconds === null || $scope.seconds === ''));
  }

  $scope.showSpinners = angular.isDefined($attrs.showSpinners) ?
    $scope.$parent.$eval($attrs.showSpinners) : timepickerConfig.showSpinners;

  $scope.incrementHours = function() {
    if (!$scope.noIncrementHours()) {
      addSecondsToSelected(hourStep * 60 * 60);
    }
  };

  $scope.decrementHours = function() {
    if (!$scope.noDecrementHours()) {
      addSecondsToSelected(-hourStep * 60 * 60);
    }
  };

  $scope.incrementMinutes = function() {
    if (!$scope.noIncrementMinutes()) {
      addSecondsToSelected(minuteStep * 60);
    }
  };

  $scope.decrementMinutes = function() {
    if (!$scope.noDecrementMinutes()) {
      addSecondsToSelected(-minuteStep * 60);
    }
  };

  $scope.incrementSeconds = function() {
    if (!$scope.noIncrementSeconds()) {
      addSecondsToSelected(secondStep);
    }
  };

  $scope.decrementSeconds = function() {
    if (!$scope.noDecrementSeconds()) {
      addSecondsToSelected(-secondStep);
    }
  };

  $scope.toggleMeridian = function() {
    var minutes = getMinutesFromTemplate(),
        hours = getHoursFromTemplate();

    if (!$scope.noToggleMeridian()) {
      if (angular.isDefined(minutes) && angular.isDefined(hours)) {
        addSecondsToSelected(12 * 60 * (selected.getHours() < 12 ? 60 : -60));
      } else {
        $scope.meridian = $scope.meridian === meridians[0] ? meridians[1] : meridians[0];
      }
    }
  };

  $scope.blur = function() {
    ngModelCtrl.$setTouched();
  };

  $scope.$on('$destroy', function() {
    while (watchers.length) {
      watchers.shift()();
    }
  });
}])

.directive('uibTimepicker', ['uibTimepickerConfig', function(uibTimepickerConfig) {
  return {
    require: ['uibTimepicker', '?^ngModel'],
    restrict: 'A',
    controller: 'UibTimepickerController',
    controllerAs: 'timepicker',
    scope: {},
    templateUrl: function(element, attrs) {
      return attrs.templateUrl || uibTimepickerConfig.templateUrl;
    },
    link: function(scope, element, attrs, ctrls) {
      var timepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

      if (ngModelCtrl) {
        timepickerCtrl.init(ngModelCtrl, element.find('input'));
      }
    }
  };
}]);

angular.module('ui.bootstrap.typeahead', ['ui.bootstrap.debounce', 'ui.bootstrap.position'])

/**
 * A helper service that can parse typeahead's syntax (string provided by users)
 * Extracted to a separate service for ease of unit testing
 */
  .factory('uibTypeaheadParser', ['$parse', function($parse) {
    //                      000001111111100000000000002222222200000000000000003333333333333330000000000044444444000
    var TYPEAHEAD_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;
    return {
      parse: function(input) {
        var match = input.match(TYPEAHEAD_REGEXP);
        if (!match) {
          throw new Error(
            'Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_"' +
              ' but got "' + input + '".');
        }

        return {
          itemName: match[3],
          source: $parse(match[4]),
          viewMapper: $parse(match[2] || match[1]),
          modelMapper: $parse(match[1])
        };
      }
    };
  }])

  .controller('UibTypeaheadController', ['$scope', '$element', '$attrs', '$compile', '$parse', '$q', '$timeout', '$document', '$window', '$rootScope', '$$debounce', '$uibPosition', 'uibTypeaheadParser',
    function(originalScope, element, attrs, $compile, $parse, $q, $timeout, $document, $window, $rootScope, $$debounce, $position, typeaheadParser) {
    var HOT_KEYS = [9, 13, 27, 38, 40];
    var eventDebounceTime = 200;
    var modelCtrl, ngModelOptions;
    //SUPPORTED ATTRIBUTES (OPTIONS)

    //minimal no of characters that needs to be entered before typeahead kicks-in
    var minLength = originalScope.$eval(attrs.typeaheadMinLength);
    if (!minLength && minLength !== 0) {
      minLength = 1;
    }

    originalScope.$watch(attrs.typeaheadMinLength, function (newVal) {
        minLength = !newVal && newVal !== 0 ? 1 : newVal;
    });

    //minimal wait time after last character typed before typeahead kicks-in
    var waitTime = originalScope.$eval(attrs.typeaheadWaitMs) || 0;

    //should it restrict model values to the ones selected from the popup only?
    var isEditable = originalScope.$eval(attrs.typeaheadEditable) !== false;
    originalScope.$watch(attrs.typeaheadEditable, function (newVal) {
      isEditable = newVal !== false;
    });

    //binding to a variable that indicates if matches are being retrieved asynchronously
    var isLoadingSetter = $parse(attrs.typeaheadLoading).assign || angular.noop;

    //a function to determine if an event should cause selection
    var isSelectEvent = attrs.typeaheadShouldSelect ? $parse(attrs.typeaheadShouldSelect) : function(scope, vals) {
      var evt = vals.$event;
      return evt.which === 13 || evt.which === 9;
    };

    //a callback executed when a match is selected
    var onSelectCallback = $parse(attrs.typeaheadOnSelect);

    //should it select highlighted popup value when losing focus?
    var isSelectOnBlur = angular.isDefined(attrs.typeaheadSelectOnBlur) ? originalScope.$eval(attrs.typeaheadSelectOnBlur) : false;

    //binding to a variable that indicates if there were no results after the query is completed
    var isNoResultsSetter = $parse(attrs.typeaheadNoResults).assign || angular.noop;

    var inputFormatter = attrs.typeaheadInputFormatter ? $parse(attrs.typeaheadInputFormatter) : undefined;

    var appendToBody = attrs.typeaheadAppendToBody ? originalScope.$eval(attrs.typeaheadAppendToBody) : false;

    var appendTo = attrs.typeaheadAppendTo ?
      originalScope.$eval(attrs.typeaheadAppendTo) : null;

    var focusFirst = originalScope.$eval(attrs.typeaheadFocusFirst) !== false;

    //If input matches an item of the list exactly, select it automatically
    var selectOnExact = attrs.typeaheadSelectOnExact ? originalScope.$eval(attrs.typeaheadSelectOnExact) : false;

    //binding to a variable that indicates if dropdown is open
    var isOpenSetter = $parse(attrs.typeaheadIsOpen).assign || angular.noop;

    var showHint = originalScope.$eval(attrs.typeaheadShowHint) || false;

    //INTERNAL VARIABLES

    //model setter executed upon match selection
    var parsedModel = $parse(attrs.ngModel);
    var invokeModelSetter = $parse(attrs.ngModel + '($$$p)');
    var $setModelValue = function(scope, newValue) {
      if (angular.isFunction(parsedModel(originalScope)) &&
        ngModelOptions.getOption('getterSetter')) {
        return invokeModelSetter(scope, {$$$p: newValue});
      }

      return parsedModel.assign(scope, newValue);
    };

    //expressions used by typeahead
    var parserResult = typeaheadParser.parse(attrs.uibTypeahead);

    var hasFocus;

    //Used to avoid bug in iOS webview where iOS keyboard does not fire
    //mousedown & mouseup events
    //Issue #3699
    var selected;

    //create a child scope for the typeahead directive so we are not polluting original scope
    //with typeahead-specific data (matches, query etc.)
    var scope = originalScope.$new();
    var offDestroy = originalScope.$on('$destroy', function() {
      scope.$destroy();
    });
    scope.$on('$destroy', offDestroy);

    // WAI-ARIA
    var popupId = 'typeahead-' + scope.$id + '-' + Math.floor(Math.random() * 10000);
    element.attr({
      'aria-autocomplete': 'list',
      'aria-expanded': false,
      'aria-owns': popupId
    });

    var inputsContainer, hintInputElem;
    //add read-only input to show hint
    if (showHint) {
      inputsContainer = angular.element('<div></div>');
      inputsContainer.css('position', 'relative');
      element.after(inputsContainer);
      hintInputElem = element.clone();
      hintInputElem.attr('placeholder', '');
      hintInputElem.attr('tabindex', '-1');
      hintInputElem.val('');
      hintInputElem.css({
        'position': 'absolute',
        'top': '0px',
        'left': '0px',
        'border-color': 'transparent',
        'box-shadow': 'none',
        'opacity': 1,
        'background': 'none 0% 0% / auto repeat scroll padding-box border-box rgb(255, 255, 255)',
        'color': '#999'
      });
      element.css({
        'position': 'relative',
        'vertical-align': 'top',
        'background-color': 'transparent'
      });

      if (hintInputElem.attr('id')) {
        hintInputElem.removeAttr('id'); // remove duplicate id if present.
      }
      inputsContainer.append(hintInputElem);
      hintInputElem.after(element);
    }

    //pop-up element used to display matches
    var popUpEl = angular.element('<div uib-typeahead-popup></div>');
    popUpEl.attr({
      id: popupId,
      matches: 'matches',
      active: 'activeIdx',
      select: 'select(activeIdx, evt)',
      'move-in-progress': 'moveInProgress',
      query: 'query',
      position: 'position',
      'assign-is-open': 'assignIsOpen(isOpen)',
      debounce: 'debounceUpdate'
    });
    //custom item template
    if (angular.isDefined(attrs.typeaheadTemplateUrl)) {
      popUpEl.attr('template-url', attrs.typeaheadTemplateUrl);
    }

    if (angular.isDefined(attrs.typeaheadPopupTemplateUrl)) {
      popUpEl.attr('popup-template-url', attrs.typeaheadPopupTemplateUrl);
    }

    var resetHint = function() {
      if (showHint) {
        hintInputElem.val('');
      }
    };

    var resetMatches = function() {
      scope.matches = [];
      scope.activeIdx = -1;
      element.attr('aria-expanded', false);
      resetHint();
    };

    var getMatchId = function(index) {
      return popupId + '-option-' + index;
    };

    // Indicate that the specified match is the active (pre-selected) item in the list owned by this typeahead.
    // This attribute is added or removed automatically when the `activeIdx` changes.
    scope.$watch('activeIdx', function(index) {
      if (index < 0) {
        element.removeAttr('aria-activedescendant');
      } else {
        element.attr('aria-activedescendant', getMatchId(index));
      }
    });

    var inputIsExactMatch = function(inputValue, index) {
      if (scope.matches.length > index && inputValue) {
        return inputValue.toUpperCase() === scope.matches[index].label.toUpperCase();
      }

      return false;
    };

    var getMatchesAsync = function(inputValue, evt) {
      var locals = {$viewValue: inputValue};
      isLoadingSetter(originalScope, true);
      isNoResultsSetter(originalScope, false);
      $q.when(parserResult.source(originalScope, locals)).then(function(matches) {
        //it might happen that several async queries were in progress if a user were typing fast
        //but we are interested only in responses that correspond to the current view value
        var onCurrentRequest = inputValue === modelCtrl.$viewValue;
        if (onCurrentRequest && hasFocus) {
          if (matches && matches.length > 0) {
            scope.activeIdx = focusFirst ? 0 : -1;
            isNoResultsSetter(originalScope, false);
            scope.matches.length = 0;

            //transform labels
            for (var i = 0; i < matches.length; i++) {
              locals[parserResult.itemName] = matches[i];
              scope.matches.push({
                id: getMatchId(i),
                label: parserResult.viewMapper(scope, locals),
                model: matches[i]
              });
            }

            scope.query = inputValue;
            //position pop-up with matches - we need to re-calculate its position each time we are opening a window
            //with matches as a pop-up might be absolute-positioned and position of an input might have changed on a page
            //due to other elements being rendered
            recalculatePosition();

            element.attr('aria-expanded', true);

            //Select the single remaining option if user input matches
            if (selectOnExact && scope.matches.length === 1 && inputIsExactMatch(inputValue, 0)) {
              if (angular.isNumber(scope.debounceUpdate) || angular.isObject(scope.debounceUpdate)) {
                $$debounce(function() {
                  scope.select(0, evt);
                }, angular.isNumber(scope.debounceUpdate) ? scope.debounceUpdate : scope.debounceUpdate['default']);
              } else {
                scope.select(0, evt);
              }
            }

            if (showHint) {
              var firstLabel = scope.matches[0].label;
              if (angular.isString(inputValue) &&
                inputValue.length > 0 &&
                firstLabel.slice(0, inputValue.length).toUpperCase() === inputValue.toUpperCase()) {
                hintInputElem.val(inputValue + firstLabel.slice(inputValue.length));
              } else {
                hintInputElem.val('');
              }
            }
          } else {
            resetMatches();
            isNoResultsSetter(originalScope, true);
          }
        }
        if (onCurrentRequest) {
          isLoadingSetter(originalScope, false);
        }
      }, function() {
        resetMatches();
        isLoadingSetter(originalScope, false);
        isNoResultsSetter(originalScope, true);
      });
    };

    // bind events only if appendToBody params exist - performance feature
    if (appendToBody) {
      angular.element($window).on('resize', fireRecalculating);
      $document.find('body').on('scroll', fireRecalculating);
    }

    // Declare the debounced function outside recalculating for
    // proper debouncing
    var debouncedRecalculate = $$debounce(function() {
      // if popup is visible
      if (scope.matches.length) {
        recalculatePosition();
      }

      scope.moveInProgress = false;
    }, eventDebounceTime);

    // Default progress type
    scope.moveInProgress = false;

    function fireRecalculating() {
      if (!scope.moveInProgress) {
        scope.moveInProgress = true;
        scope.$digest();
      }

      debouncedRecalculate();
    }

    // recalculate actual position and set new values to scope
    // after digest loop is popup in right position
    function recalculatePosition() {
      scope.position = appendToBody ? $position.offset(element) : $position.position(element);
      scope.position.top += element.prop('offsetHeight');
    }

    //we need to propagate user's query so we can higlight matches
    scope.query = undefined;

    //Declare the timeout promise var outside the function scope so that stacked calls can be cancelled later
    var timeoutPromise;

    var scheduleSearchWithTimeout = function(inputValue) {
      timeoutPromise = $timeout(function() {
        getMatchesAsync(inputValue);
      }, waitTime);
    };

    var cancelPreviousTimeout = function() {
      if (timeoutPromise) {
        $timeout.cancel(timeoutPromise);
      }
    };

    resetMatches();

    scope.assignIsOpen = function (isOpen) {
      isOpenSetter(originalScope, isOpen);
    };

    scope.select = function(activeIdx, evt) {
      //called from within the $digest() cycle
      var locals = {};
      var model, item;

      selected = true;
      locals[parserResult.itemName] = item = scope.matches[activeIdx].model;
      model = parserResult.modelMapper(originalScope, locals);
      $setModelValue(originalScope, model);
      modelCtrl.$setValidity('editable', true);
      modelCtrl.$setValidity('parse', true);

      onSelectCallback(originalScope, {
        $item: item,
        $model: model,
        $label: parserResult.viewMapper(originalScope, locals),
        $event: evt
      });

      resetMatches();

      //return focus to the input element if a match was selected via a mouse click event
      // use timeout to avoid $rootScope:inprog error
      if (scope.$eval(attrs.typeaheadFocusOnSelect) !== false) {
        $timeout(function() { element[0].focus(); }, 0, false);
      }
    };

    //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
    element.on('keydown', function(evt) {
      //typeahead is open and an "interesting" key was pressed
      if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
        return;
      }

      var shouldSelect = isSelectEvent(originalScope, {$event: evt});

      /**
       * if there's nothing selected (i.e. focusFirst) and enter or tab is hit
       * or
       * shift + tab is pressed to bring focus to the previous element
       * then clear the results
       */
      if (scope.activeIdx === -1 && shouldSelect || evt.which === 9 && !!evt.shiftKey) {
        resetMatches();
        scope.$digest();
        return;
      }

      evt.preventDefault();
      var target;
      switch (evt.which) {
        case 27: // escape
          evt.stopPropagation();

          resetMatches();
          originalScope.$digest();
          break;
        case 38: // up arrow
          scope.activeIdx = (scope.activeIdx > 0 ? scope.activeIdx : scope.matches.length) - 1;
          scope.$digest();
          target = popUpEl[0].querySelectorAll('.uib-typeahead-match')[scope.activeIdx];
          target.parentNode.scrollTop = target.offsetTop;
          break;
        case 40: // down arrow
          scope.activeIdx = (scope.activeIdx + 1) % scope.matches.length;
          scope.$digest();
          target = popUpEl[0].querySelectorAll('.uib-typeahead-match')[scope.activeIdx];
          target.parentNode.scrollTop = target.offsetTop;
          break;
        default:
          if (shouldSelect) {
            scope.$apply(function() {
              if (angular.isNumber(scope.debounceUpdate) || angular.isObject(scope.debounceUpdate)) {
                $$debounce(function() {
                  scope.select(scope.activeIdx, evt);
                }, angular.isNumber(scope.debounceUpdate) ? scope.debounceUpdate : scope.debounceUpdate['default']);
              } else {
                scope.select(scope.activeIdx, evt);
              }
            });
          }
      }
    });

    element.on('focus', function (evt) {
      hasFocus = true;
      if (minLength === 0 && !modelCtrl.$viewValue) {
        $timeout(function() {
          getMatchesAsync(modelCtrl.$viewValue, evt);
        }, 0);
      }
    });

    element.on('blur', function(evt) {
      if (isSelectOnBlur && scope.matches.length && scope.activeIdx !== -1 && !selected) {
        selected = true;
        scope.$apply(function() {
          if (angular.isObject(scope.debounceUpdate) && angular.isNumber(scope.debounceUpdate.blur)) {
            $$debounce(function() {
              scope.select(scope.activeIdx, evt);
            }, scope.debounceUpdate.blur);
          } else {
            scope.select(scope.activeIdx, evt);
          }
        });
      }
      if (!isEditable && modelCtrl.$error.editable) {
        modelCtrl.$setViewValue();
        scope.$apply(function() {
          // Reset validity as we are clearing
          modelCtrl.$setValidity('editable', true);
          modelCtrl.$setValidity('parse', true);
        });
        element.val('');
      }
      hasFocus = false;
      selected = false;
    });

    // Keep reference to click handler to unbind it.
    var dismissClickHandler = function(evt) {
      // Issue #3973
      // Firefox treats right click as a click on document
      if (element[0] !== evt.target && evt.which !== 3 && scope.matches.length !== 0) {
        resetMatches();
        if (!$rootScope.$$phase) {
          originalScope.$digest();
        }
      }
    };

    $document.on('click', dismissClickHandler);

    originalScope.$on('$destroy', function() {
      $document.off('click', dismissClickHandler);
      if (appendToBody || appendTo) {
        $popup.remove();
      }

      if (appendToBody) {
        angular.element($window).off('resize', fireRecalculating);
        $document.find('body').off('scroll', fireRecalculating);
      }
      // Prevent jQuery cache memory leak
      popUpEl.remove();

      if (showHint) {
          inputsContainer.remove();
      }
    });

    var $popup = $compile(popUpEl)(scope);

    if (appendToBody) {
      $document.find('body').append($popup);
    } else if (appendTo) {
      angular.element(appendTo).eq(0).append($popup);
    } else {
      element.after($popup);
    }

    this.init = function(_modelCtrl) {
      modelCtrl = _modelCtrl;
      ngModelOptions = extractOptions(modelCtrl);

      scope.debounceUpdate = $parse(ngModelOptions.getOption('debounce'))(originalScope);

      //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
      //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
      modelCtrl.$parsers.unshift(function(inputValue) {
        hasFocus = true;

        if (minLength === 0 || inputValue && inputValue.length >= minLength) {
          if (waitTime > 0) {
            cancelPreviousTimeout();
            scheduleSearchWithTimeout(inputValue);
          } else {
            getMatchesAsync(inputValue);
          }
        } else {
          isLoadingSetter(originalScope, false);
          cancelPreviousTimeout();
          resetMatches();
        }

        if (isEditable) {
          return inputValue;
        }

        if (!inputValue) {
          // Reset in case user had typed something previously.
          modelCtrl.$setValidity('editable', true);
          return null;
        }

        modelCtrl.$setValidity('editable', false);
        return undefined;
      });

      modelCtrl.$formatters.push(function(modelValue) {
        var candidateViewValue, emptyViewValue;
        var locals = {};

        // The validity may be set to false via $parsers (see above) if
        // the model is restricted to selected values. If the model
        // is set manually it is considered to be valid.
        if (!isEditable) {
          modelCtrl.$setValidity('editable', true);
        }

        if (inputFormatter) {
          locals.$model = modelValue;
          return inputFormatter(originalScope, locals);
        }

        //it might happen that we don't have enough info to properly render input value
        //we need to check for this situation and simply return model value if we can't apply custom formatting
        locals[parserResult.itemName] = modelValue;
        candidateViewValue = parserResult.viewMapper(originalScope, locals);
        locals[parserResult.itemName] = undefined;
        emptyViewValue = parserResult.viewMapper(originalScope, locals);

        return candidateViewValue !== emptyViewValue ? candidateViewValue : modelValue;
      });
    };

    function extractOptions(ngModelCtrl) {
      var ngModelOptions;

      if (angular.version.minor < 6) { // in angular < 1.6 $options could be missing
        // guarantee a value
        ngModelOptions = ngModelCtrl.$options || {};

        // mimic 1.6+ api
        ngModelOptions.getOption = function (key) {
          return ngModelOptions[key];
        };
      } else { // in angular >=1.6 $options is always present
        ngModelOptions = ngModelCtrl.$options;
      }

      return ngModelOptions;
    }
  }])

  .directive('uibTypeahead', function() {
    return {
      controller: 'UibTypeaheadController',
      require: ['ngModel', 'uibTypeahead'],
      link: function(originalScope, element, attrs, ctrls) {
        ctrls[1].init(ctrls[0]);
      }
    };
  })

  .directive('uibTypeaheadPopup', ['$$debounce', function($$debounce) {
    return {
      scope: {
        matches: '=',
        query: '=',
        active: '=',
        position: '&',
        moveInProgress: '=',
        select: '&',
        assignIsOpen: '&',
        debounce: '&'
      },
      replace: true,
      templateUrl: function(element, attrs) {
        return attrs.popupTemplateUrl || 'uib/template/typeahead/typeahead-popup.html';
      },
      link: function(scope, element, attrs) {
        scope.templateUrl = attrs.templateUrl;

        scope.isOpen = function() {
          var isDropdownOpen = scope.matches.length > 0;
          scope.assignIsOpen({ isOpen: isDropdownOpen });
          return isDropdownOpen;
        };

        scope.isActive = function(matchIdx) {
          return scope.active === matchIdx;
        };

        scope.selectActive = function(matchIdx) {
          scope.active = matchIdx;
        };

        scope.selectMatch = function(activeIdx, evt) {
          var debounce = scope.debounce();
          if (angular.isNumber(debounce) || angular.isObject(debounce)) {
            $$debounce(function() {
              scope.select({activeIdx: activeIdx, evt: evt});
            }, angular.isNumber(debounce) ? debounce : debounce['default']);
          } else {
            scope.select({activeIdx: activeIdx, evt: evt});
          }
        };
      }
    };
  }])

  .directive('uibTypeaheadMatch', ['$templateRequest', '$compile', '$parse', function($templateRequest, $compile, $parse) {
    return {
      scope: {
        index: '=',
        match: '=',
        query: '='
      },
      link: function(scope, element, attrs) {
        var tplUrl = $parse(attrs.templateUrl)(scope.$parent) || 'uib/template/typeahead/typeahead-match.html';
        $templateRequest(tplUrl).then(function(tplContent) {
          var tplEl = angular.element(tplContent.trim());
          element.replaceWith(tplEl);
          $compile(tplEl)(scope);
        });
      }
    };
  }])

  .filter('uibTypeaheadHighlight', ['$sce', '$injector', '$log', function($sce, $injector, $log) {
    var isSanitizePresent;
    isSanitizePresent = $injector.has('$sanitize');

    function escapeRegexp(queryToEscape) {
      // Regex: capture the whole query string and replace it with the string that will be used to match
      // the results, for example if the capture is "a" the result will be \a
      return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }

    function containsHtml(matchItem) {
      return /<.*>/g.test(matchItem);
    }

    return function(matchItem, query) {
      if (!isSanitizePresent && containsHtml(matchItem)) {
        $log.warn('Unsafe use of typeahead please use ngSanitize'); // Warn the user about the danger
      }
      matchItem = query ? ('' + matchItem).replace(new RegExp(escapeRegexp(query), 'gi'), '<strong>$&</strong>') : matchItem; // Replaces the capture string with a the same string inside of a "strong" tag
      if (!isSanitizePresent) {
        matchItem = $sce.trustAsHtml(matchItem); // If $sanitize is not present we pack the string in a $sce object for the ng-bind-html directive
      }
      return matchItem;
    };
  }]);

angular.module("uib/template/accordion/accordion-group.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/accordion/accordion-group.html",
    "<div role=\"tab\" id=\"{{::headingId}}\" aria-selected=\"{{isOpen}}\" class=\"panel-heading\" ng-keypress=\"toggleOpen($event)\">\n" +
    "  <h4 class=\"panel-title\">\n" +
    "    <a role=\"button\" data-toggle=\"collapse\" href aria-expanded=\"{{isOpen}}\" aria-controls=\"{{::panelId}}\" tabindex=\"0\" class=\"accordion-toggle\" ng-click=\"toggleOpen()\" uib-accordion-transclude=\"heading\" ng-disabled=\"isDisabled\" uib-tabindex-toggle><span uib-accordion-header ng-class=\"{'text-muted': isDisabled}\">{{heading}}</span></a>\n" +
    "  </h4>\n" +
    "</div>\n" +
    "<div id=\"{{::panelId}}\" aria-labelledby=\"{{::headingId}}\" aria-hidden=\"{{!isOpen}}\" role=\"tabpanel\" class=\"panel-collapse collapse\" uib-collapse=\"!isOpen\">\n" +
    "  <div class=\"panel-body\" ng-transclude></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/accordion/accordion.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/accordion/accordion.html",
    "<div role=\"tablist\" class=\"panel-group\" ng-transclude></div>");
}]);

angular.module("uib/template/alert/alert.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/alert/alert.html",
    "<button ng-show=\"closeable\" type=\"button\" class=\"close\" ng-click=\"close({$event: $event})\">\n" +
    "  <span aria-hidden=\"true\">&times;</span>\n" +
    "  <span class=\"sr-only\">Close</span>\n" +
    "</button>\n" +
    "<div ng-transclude></div>\n" +
    "");
}]);

angular.module("uib/template/carousel/carousel.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/carousel/carousel.html",
    "<div class=\"carousel-inner\" ng-transclude></div>\n" +
    "<a role=\"button\" href class=\"left carousel-control\" ng-click=\"prev()\" ng-class=\"{ disabled: isPrevDisabled() }\" ng-show=\"slides.length > 1\">\n" +
    "  <span aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-left\"></span>\n" +
    "  <span class=\"sr-only\">previous</span>\n" +
    "</a>\n" +
    "<a role=\"button\" href class=\"right carousel-control\" ng-click=\"next()\" ng-class=\"{ disabled: isNextDisabled() }\" ng-show=\"slides.length > 1\">\n" +
    "  <span aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-right\"></span>\n" +
    "  <span class=\"sr-only\">next</span>\n" +
    "</a>\n" +
    "<ol class=\"carousel-indicators\" ng-show=\"slides.length > 1\">\n" +
    "  <li ng-repeat=\"slide in slides | orderBy:indexOfSlide track by $index\" ng-class=\"{ active: isActive(slide) }\" ng-click=\"select(slide)\">\n" +
    "    <span class=\"sr-only\">slide {{ $index + 1 }} of {{ slides.length }}<span ng-if=\"isActive(slide)\">, currently active</span></span>\n" +
    "  </li>\n" +
    "</ol>\n" +
    "");
}]);

angular.module("uib/template/carousel/slide.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/carousel/slide.html",
    "<div class=\"text-center\" ng-transclude></div>\n" +
    "");
}]);

angular.module("uib/template/datepicker/datepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/datepicker/datepicker.html",
    "<div ng-switch=\"datepickerMode\">\n" +
    "  <div uib-daypicker ng-switch-when=\"day\" tabindex=\"0\" class=\"uib-daypicker\"></div>\n" +
    "  <div uib-monthpicker ng-switch-when=\"month\" tabindex=\"0\" class=\"uib-monthpicker\"></div>\n" +
    "  <div uib-yearpicker ng-switch-when=\"year\" tabindex=\"0\" class=\"uib-yearpicker\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/datepicker/day.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/datepicker/day.html",
    "<table role=\"grid\" aria-labelledby=\"{{::uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left uib-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-left\"></i><span class=\"sr-only\">previous</span></button></th>\n" +
    "      <th colspan=\"{{::5 + showWeeks}}\"><button id=\"{{::uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm uib-title\" ng-click=\"toggleMode()\" ng-disabled=\"datepickerMode === maxMode\" tabindex=\"-1\"><strong>{{title}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right uib-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-right\"></i><span class=\"sr-only\">next</span></button></th>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <th ng-if=\"showWeeks\" class=\"text-center\"></th>\n" +
    "      <th ng-repeat=\"label in ::labels track by $index\" class=\"text-center\"><small aria-label=\"{{::label.full}}\">{{::label.abbr}}</small></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr class=\"uib-weeks\" ng-repeat=\"row in rows track by $index\" role=\"row\">\n" +
    "      <td ng-if=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] }}</em></td>\n" +
    "      <td ng-repeat=\"dt in row\" class=\"uib-day text-center\" role=\"gridcell\"\n" +
    "        id=\"{{::dt.uid}}\"\n" +
    "        ng-class=\"::dt.customClass\">\n" +
    "        <button type=\"button\" class=\"btn btn-default btn-sm\"\n" +
    "          uib-is-class=\"\n" +
    "            'btn-info' for selectedDt,\n" +
    "            'active' for activeDt\n" +
    "            on dt\"\n" +
    "          ng-click=\"select(dt.date)\"\n" +
    "          ng-disabled=\"::dt.disabled\"\n" +
    "          tabindex=\"-1\"><span ng-class=\"::{'text-muted': dt.secondary, 'text-info': dt.current}\">{{::dt.label}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("uib/template/datepicker/month.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/datepicker/month.html",
    "<table role=\"grid\" aria-labelledby=\"{{::uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left uib-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-left\"></i><span class=\"sr-only\">previous</span></button></th>\n" +
    "      <th colspan=\"{{::yearHeaderColspan}}\"><button id=\"{{::uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm uib-title\" ng-click=\"toggleMode()\" ng-disabled=\"datepickerMode === maxMode\" tabindex=\"-1\"><strong>{{title}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right uib-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-right\"></i><span class=\"sr-only\">next</span></i></button></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr class=\"uib-months\" ng-repeat=\"row in rows track by $index\" role=\"row\">\n" +
    "      <td ng-repeat=\"dt in row\" class=\"uib-month text-center\" role=\"gridcell\"\n" +
    "        id=\"{{::dt.uid}}\"\n" +
    "        ng-class=\"::dt.customClass\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\"\n" +
    "          uib-is-class=\"\n" +
    "            'btn-info' for selectedDt,\n" +
    "            'active' for activeDt\n" +
    "            on dt\"\n" +
    "          ng-click=\"select(dt.date)\"\n" +
    "          ng-disabled=\"::dt.disabled\"\n" +
    "          tabindex=\"-1\"><span ng-class=\"::{'text-info': dt.current}\">{{::dt.label}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("uib/template/datepicker/year.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/datepicker/year.html",
    "<table role=\"grid\" aria-labelledby=\"{{::uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left uib-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-left\"></i><span class=\"sr-only\">previous</span></button></th>\n" +
    "      <th colspan=\"{{::columns - 2}}\"><button id=\"{{::uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm uib-title\" ng-click=\"toggleMode()\" ng-disabled=\"datepickerMode === maxMode\" tabindex=\"-1\"><strong>{{title}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right uib-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i aria-hidden=\"true\" class=\"glyphicon glyphicon-chevron-right\"></i><span class=\"sr-only\">next</span></button></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr class=\"uib-years\" ng-repeat=\"row in rows track by $index\" role=\"row\">\n" +
    "      <td ng-repeat=\"dt in row\" class=\"uib-year text-center\" role=\"gridcell\"\n" +
    "        id=\"{{::dt.uid}}\"\n" +
    "        ng-class=\"::dt.customClass\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\"\n" +
    "          uib-is-class=\"\n" +
    "            'btn-info' for selectedDt,\n" +
    "            'active' for activeDt\n" +
    "            on dt\"\n" +
    "          ng-click=\"select(dt.date)\"\n" +
    "          ng-disabled=\"::dt.disabled\"\n" +
    "          tabindex=\"-1\"><span ng-class=\"::{'text-info': dt.current}\">{{::dt.label}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("uib/template/datepickerPopup/popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/datepickerPopup/popup.html",
    "<ul role=\"presentation\" class=\"uib-datepicker-popup dropdown-menu uib-position-measure\" dropdown-nested ng-if=\"isOpen\" ng-keydown=\"keydown($event)\" ng-click=\"$event.stopPropagation()\">\n" +
    "  <li ng-transclude></li>\n" +
    "  <li ng-if=\"showButtonBar\" class=\"uib-button-bar\">\n" +
    "    <span class=\"btn-group pull-left\">\n" +
    "      <button type=\"button\" class=\"btn btn-sm btn-info uib-datepicker-current\" ng-click=\"select('today', $event)\" ng-disabled=\"isDisabled('today')\">{{ getText('current') }}</button>\n" +
    "      <button type=\"button\" class=\"btn btn-sm btn-danger uib-clear\" ng-click=\"select(null, $event)\">{{ getText('clear') }}</button>\n" +
    "    </span>\n" +
    "    <button type=\"button\" class=\"btn btn-sm btn-success pull-right uib-close\" ng-click=\"close($event)\">{{ getText('close') }}</button>\n" +
    "  </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("uib/template/modal/window.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/modal/window.html",
    "<div class=\"modal-dialog {{size ? 'modal-' + size : ''}}\"><div class=\"modal-content\" uib-modal-transclude></div></div>\n" +
    "");
}]);

angular.module("uib/template/pager/pager.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/pager/pager.html",
    "<li ng-class=\"{disabled: noPrevious()||ngDisabled, previous: align}\"><a href ng-click=\"selectPage(page - 1, $event)\" ng-disabled=\"noPrevious()||ngDisabled\" uib-tabindex-toggle>{{::getText('previous')}}</a></li>\n" +
    "<li ng-class=\"{disabled: noNext()||ngDisabled, next: align}\"><a href ng-click=\"selectPage(page + 1, $event)\" ng-disabled=\"noNext()||ngDisabled\" uib-tabindex-toggle>{{::getText('next')}}</a></li>\n" +
    "");
}]);

angular.module("uib/template/pagination/pagination.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/pagination/pagination.html",
    "<li role=\"menuitem\" ng-if=\"::boundaryLinks\" ng-class=\"{disabled: noPrevious()||ngDisabled}\" class=\"pagination-first\"><a href ng-click=\"selectPage(1, $event)\" ng-disabled=\"noPrevious()||ngDisabled\" uib-tabindex-toggle>{{::getText('first')}}</a></li>\n" +
    "<li role=\"menuitem\" ng-if=\"::directionLinks\" ng-class=\"{disabled: noPrevious()||ngDisabled}\" class=\"pagination-prev\"><a href ng-click=\"selectPage(page - 1, $event)\" ng-disabled=\"noPrevious()||ngDisabled\" uib-tabindex-toggle>{{::getText('previous')}}</a></li>\n" +
    "<li role=\"menuitem\" ng-repeat=\"page in pages track by $index\" ng-class=\"{active: page.active,disabled: ngDisabled&&!page.active}\" class=\"pagination-page\"><a href ng-click=\"selectPage(page.number, $event)\" ng-disabled=\"ngDisabled&&!page.active\" uib-tabindex-toggle>{{page.text}}</a></li>\n" +
    "<li role=\"menuitem\" ng-if=\"::directionLinks\" ng-class=\"{disabled: noNext()||ngDisabled}\" class=\"pagination-next\"><a href ng-click=\"selectPage(page + 1, $event)\" ng-disabled=\"noNext()||ngDisabled\" uib-tabindex-toggle>{{::getText('next')}}</a></li>\n" +
    "<li role=\"menuitem\" ng-if=\"::boundaryLinks\" ng-class=\"{disabled: noNext()||ngDisabled}\" class=\"pagination-last\"><a href ng-click=\"selectPage(totalPages, $event)\" ng-disabled=\"noNext()||ngDisabled\" uib-tabindex-toggle>{{::getText('last')}}</a></li>\n" +
    "");
}]);

angular.module("uib/template/tooltip/tooltip-html-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/tooltip/tooltip-html-popup.html",
    "<div class=\"tooltip-arrow\"></div>\n" +
    "<div class=\"tooltip-inner\" ng-bind-html=\"contentExp()\"></div>\n" +
    "");
}]);

angular.module("uib/template/tooltip/tooltip-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/tooltip/tooltip-popup.html",
    "<div class=\"tooltip-arrow\"></div>\n" +
    "<div class=\"tooltip-inner\" ng-bind=\"content\"></div>\n" +
    "");
}]);

angular.module("uib/template/tooltip/tooltip-template-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/tooltip/tooltip-template-popup.html",
    "<div class=\"tooltip-arrow\"></div>\n" +
    "<div class=\"tooltip-inner\"\n" +
    "  uib-tooltip-template-transclude=\"contentExp()\"\n" +
    "  tooltip-template-transclude-scope=\"originScope()\"></div>\n" +
    "");
}]);

angular.module("uib/template/popover/popover-html.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/popover/popover-html.html",
    "<div class=\"arrow\"></div>\n" +
    "\n" +
    "<div class=\"popover-inner\">\n" +
    "    <h3 class=\"popover-title\" ng-bind=\"uibTitle\" ng-if=\"uibTitle\"></h3>\n" +
    "    <div class=\"popover-content\" ng-bind-html=\"contentExp()\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/popover/popover-template.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/popover/popover-template.html",
    "<div class=\"arrow\"></div>\n" +
    "\n" +
    "<div class=\"popover-inner\">\n" +
    "    <h3 class=\"popover-title\" ng-bind=\"uibTitle\" ng-if=\"uibTitle\"></h3>\n" +
    "    <div class=\"popover-content\"\n" +
    "      uib-tooltip-template-transclude=\"contentExp()\"\n" +
    "      tooltip-template-transclude-scope=\"originScope()\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/popover/popover.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/popover/popover.html",
    "<div class=\"arrow\"></div>\n" +
    "\n" +
    "<div class=\"popover-inner\">\n" +
    "    <h3 class=\"popover-title\" ng-bind=\"uibTitle\" ng-if=\"uibTitle\"></h3>\n" +
    "    <div class=\"popover-content\" ng-bind=\"content\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/progressbar/bar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/progressbar/bar.html",
    "<div class=\"progress-bar\" ng-class=\"type && 'progress-bar-' + type\" role=\"progressbar\" aria-valuenow=\"{{value}}\" aria-valuemin=\"0\" aria-valuemax=\"{{max}}\" ng-style=\"{width: (percent < 100 ? percent : 100) + '%'}\" aria-valuetext=\"{{percent | number:0}}%\" aria-labelledby=\"{{::title}}\" ng-transclude></div>\n" +
    "");
}]);

angular.module("uib/template/progressbar/progress.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/progressbar/progress.html",
    "<div class=\"progress\" ng-transclude aria-labelledby=\"{{::title}}\"></div>");
}]);

angular.module("uib/template/progressbar/progressbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/progressbar/progressbar.html",
    "<div class=\"progress\">\n" +
    "  <div class=\"progress-bar\" ng-class=\"type && 'progress-bar-' + type\" role=\"progressbar\" aria-valuenow=\"{{value}}\" aria-valuemin=\"0\" aria-valuemax=\"{{max}}\" ng-style=\"{width: (percent < 100 ? percent : 100) + '%'}\" aria-valuetext=\"{{percent | number:0}}%\" aria-labelledby=\"{{::title}}\" ng-transclude></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/rating/rating.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/rating/rating.html",
    "<span ng-mouseleave=\"reset()\" ng-keydown=\"onKeydown($event)\" tabindex=\"0\" role=\"slider\" aria-valuemin=\"0\" aria-valuemax=\"{{range.length}}\" aria-valuenow=\"{{value}}\" aria-valuetext=\"{{title}}\">\n" +
    "    <span ng-repeat-start=\"r in range track by $index\" class=\"sr-only\">({{ $index < value ? '*' : ' ' }})</span>\n" +
    "    <i ng-repeat-end ng-mouseenter=\"enter($index + 1)\" ng-click=\"rate($index + 1)\" class=\"glyphicon\" ng-class=\"$index < value && (r.stateOn || 'glyphicon-star') || (r.stateOff || 'glyphicon-star-empty')\" ng-attr-title=\"{{r.title}}\"></i>\n" +
    "</span>\n" +
    "");
}]);

angular.module("uib/template/tabs/tab.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/tabs/tab.html",
    "<li ng-class=\"[{active: active, disabled: disabled}, classes]\" class=\"uib-tab nav-item\">\n" +
    "  <a href ng-click=\"select($event)\" class=\"nav-link\" uib-tab-heading-transclude>{{heading}}</a>\n" +
    "</li>\n" +
    "");
}]);

angular.module("uib/template/tabs/tabset.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/tabs/tabset.html",
    "<div>\n" +
    "  <ul class=\"nav nav-{{tabset.type || 'tabs'}}\" ng-class=\"{'nav-stacked': vertical, 'nav-justified': justified}\" ng-transclude></ul>\n" +
    "  <div class=\"tab-content\">\n" +
    "    <div class=\"tab-pane\"\n" +
    "         ng-repeat=\"tab in tabset.tabs\"\n" +
    "         ng-class=\"{active: tabset.active === tab.index}\"\n" +
    "         uib-tab-content-transclude=\"tab\">\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("uib/template/timepicker/timepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/timepicker/timepicker.html",
    "<table class=\"uib-timepicker\">\n" +
    "  <tbody>\n" +
    "    <tr class=\"text-center\" ng-show=\"::showSpinners\">\n" +
    "      <td class=\"uib-increment hours\"><a ng-click=\"incrementHours()\" ng-class=\"{disabled: noIncrementHours()}\" class=\"btn btn-link\" ng-disabled=\"noIncrementHours()\" tabindex=\"-1\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
    "      <td>&nbsp;</td>\n" +
    "      <td class=\"uib-increment minutes\"><a ng-click=\"incrementMinutes()\" ng-class=\"{disabled: noIncrementMinutes()}\" class=\"btn btn-link\" ng-disabled=\"noIncrementMinutes()\" tabindex=\"-1\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
    "      <td ng-show=\"showSeconds\">&nbsp;</td>\n" +
    "      <td ng-show=\"showSeconds\" class=\"uib-increment seconds\"><a ng-click=\"incrementSeconds()\" ng-class=\"{disabled: noIncrementSeconds()}\" class=\"btn btn-link\" ng-disabled=\"noIncrementSeconds()\" tabindex=\"-1\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
    "      <td ng-show=\"showMeridian\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td class=\"form-group uib-time hours\" ng-class=\"{'has-error': invalidHours}\">\n" +
    "        <input type=\"text\" placeholder=\"HH\" ng-model=\"hours\" ng-change=\"updateHours()\" class=\"form-control text-center\" ng-readonly=\"::readonlyInput\" maxlength=\"2\" tabindex=\"{{::tabindex}}\" ng-disabled=\"noIncrementHours()\" ng-blur=\"blur()\">\n" +
    "      </td>\n" +
    "      <td class=\"uib-separator\">:</td>\n" +
    "      <td class=\"form-group uib-time minutes\" ng-class=\"{'has-error': invalidMinutes}\">\n" +
    "        <input type=\"text\" placeholder=\"MM\" ng-model=\"minutes\" ng-change=\"updateMinutes()\" class=\"form-control text-center\" ng-readonly=\"::readonlyInput\" maxlength=\"2\" tabindex=\"{{::tabindex}}\" ng-disabled=\"noIncrementMinutes()\" ng-blur=\"blur()\">\n" +
    "      </td>\n" +
    "      <td ng-show=\"showSeconds\" class=\"uib-separator\">:</td>\n" +
    "      <td class=\"form-group uib-time seconds\" ng-class=\"{'has-error': invalidSeconds}\" ng-show=\"showSeconds\">\n" +
    "        <input type=\"text\" placeholder=\"SS\" ng-model=\"seconds\" ng-change=\"updateSeconds()\" class=\"form-control text-center\" ng-readonly=\"readonlyInput\" maxlength=\"2\" tabindex=\"{{::tabindex}}\" ng-disabled=\"noIncrementSeconds()\" ng-blur=\"blur()\">\n" +
    "      </td>\n" +
    "      <td ng-show=\"showMeridian\" class=\"uib-time am-pm\"><button type=\"button\" ng-class=\"{disabled: noToggleMeridian()}\" class=\"btn btn-default text-center\" ng-click=\"toggleMeridian()\" ng-disabled=\"noToggleMeridian()\" tabindex=\"{{::tabindex}}\">{{meridian}}</button></td>\n" +
    "    </tr>\n" +
    "    <tr class=\"text-center\" ng-show=\"::showSpinners\">\n" +
    "      <td class=\"uib-decrement hours\"><a ng-click=\"decrementHours()\" ng-class=\"{disabled: noDecrementHours()}\" class=\"btn btn-link\" ng-disabled=\"noDecrementHours()\" tabindex=\"-1\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
    "      <td>&nbsp;</td>\n" +
    "      <td class=\"uib-decrement minutes\"><a ng-click=\"decrementMinutes()\" ng-class=\"{disabled: noDecrementMinutes()}\" class=\"btn btn-link\" ng-disabled=\"noDecrementMinutes()\" tabindex=\"-1\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
    "      <td ng-show=\"showSeconds\">&nbsp;</td>\n" +
    "      <td ng-show=\"showSeconds\" class=\"uib-decrement seconds\"><a ng-click=\"decrementSeconds()\" ng-class=\"{disabled: noDecrementSeconds()}\" class=\"btn btn-link\" ng-disabled=\"noDecrementSeconds()\" tabindex=\"-1\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
    "      <td ng-show=\"showMeridian\"></td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("uib/template/typeahead/typeahead-match.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/typeahead/typeahead-match.html",
    "<a href\n" +
    "   tabindex=\"-1\"\n" +
    "   ng-bind-html=\"match.label | uibTypeaheadHighlight:query\"\n" +
    "   ng-attr-title=\"{{match.label}}\"></a>\n" +
    "");
}]);

angular.module("uib/template/typeahead/typeahead-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/typeahead/typeahead-popup.html",
    "<ul class=\"dropdown-menu\" ng-show=\"isOpen() && !moveInProgress\" ng-style=\"{top: position().top+'px', left: position().left+'px'}\" role=\"listbox\" aria-hidden=\"{{!isOpen()}}\">\n" +
    "    <li class=\"uib-typeahead-match\" ng-repeat=\"match in matches track by $index\" ng-class=\"{active: isActive($index) }\" ng-mouseenter=\"selectActive($index)\" ng-click=\"selectMatch($index, $event)\" role=\"option\" id=\"{{::match.id}}\">\n" +
    "        <div uib-typeahead-match index=\"$index\" match=\"match\" query=\"query\" template-url=\"templateUrl\"></div>\n" +
    "    </li>\n" +
    "</ul>\n" +
    "");
}]);
angular.module('ui.bootstrap.carousel').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibCarouselCss && angular.element(document).find('head').prepend('<style type="text/css">.ng-animate.item:not(.left):not(.right){-webkit-transition:0s ease-in-out left;transition:0s ease-in-out left}</style>'); angular.$$uibCarouselCss = true; });
angular.module('ui.bootstrap.datepicker').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibDatepickerCss && angular.element(document).find('head').prepend('<style type="text/css">.uib-datepicker .uib-title{width:100%;}.uib-day button,.uib-month button,.uib-year button{min-width:100%;}.uib-left,.uib-right{width:100%}</style>'); angular.$$uibDatepickerCss = true; });
angular.module('ui.bootstrap.position').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibPositionCss && angular.element(document).find('head').prepend('<style type="text/css">.uib-position-measure{display:block !important;visibility:hidden !important;position:absolute !important;top:-9999px !important;left:-9999px !important;}.uib-position-scrollbar-measure{position:absolute !important;top:-9999px !important;width:50px !important;height:50px !important;overflow:scroll !important;}.uib-position-body-scrollbar-measure{overflow:scroll !important;}</style>'); angular.$$uibPositionCss = true; });
angular.module('ui.bootstrap.datepickerPopup').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibDatepickerpopupCss && angular.element(document).find('head').prepend('<style type="text/css">.uib-datepicker-popup.dropdown-menu{display:block;float:none;margin:0;}.uib-button-bar{padding:10px 9px 2px;}</style>'); angular.$$uibDatepickerpopupCss = true; });
angular.module('ui.bootstrap.tooltip').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibTooltipCss && angular.element(document).find('head').prepend('<style type="text/css">[uib-tooltip-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-popup].tooltip.right-bottom > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.right-bottom > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.right-bottom > .tooltip-arrow,[uib-popover-popup].popover.top-left > .arrow,[uib-popover-popup].popover.top-right > .arrow,[uib-popover-popup].popover.bottom-left > .arrow,[uib-popover-popup].popover.bottom-right > .arrow,[uib-popover-popup].popover.left-top > .arrow,[uib-popover-popup].popover.left-bottom > .arrow,[uib-popover-popup].popover.right-top > .arrow,[uib-popover-popup].popover.right-bottom > .arrow,[uib-popover-html-popup].popover.top-left > .arrow,[uib-popover-html-popup].popover.top-right > .arrow,[uib-popover-html-popup].popover.bottom-left > .arrow,[uib-popover-html-popup].popover.bottom-right > .arrow,[uib-popover-html-popup].popover.left-top > .arrow,[uib-popover-html-popup].popover.left-bottom > .arrow,[uib-popover-html-popup].popover.right-top > .arrow,[uib-popover-html-popup].popover.right-bottom > .arrow,[uib-popover-template-popup].popover.top-left > .arrow,[uib-popover-template-popup].popover.top-right > .arrow,[uib-popover-template-popup].popover.bottom-left > .arrow,[uib-popover-template-popup].popover.bottom-right > .arrow,[uib-popover-template-popup].popover.left-top > .arrow,[uib-popover-template-popup].popover.left-bottom > .arrow,[uib-popover-template-popup].popover.right-top > .arrow,[uib-popover-template-popup].popover.right-bottom > .arrow{top:auto;bottom:auto;left:auto;right:auto;margin:0;}[uib-popover-popup].popover,[uib-popover-html-popup].popover,[uib-popover-template-popup].popover{display:block !important;}</style>'); angular.$$uibTooltipCss = true; });
angular.module('ui.bootstrap.timepicker').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibTimepickerCss && angular.element(document).find('head').prepend('<style type="text/css">.uib-time input{width:50px;}</style>'); angular.$$uibTimepickerCss = true; });
angular.module('ui.bootstrap.typeahead').run(function() {!angular.$$csp().noInlineStyle && !angular.$$uibTypeaheadCss && angular.element(document).find('head').prepend('<style type="text/css">[uib-typeahead-popup].dropdown-menu{display:block;}</style>'); angular.$$uibTypeaheadCss = true; });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFuZ3VsYXItdWktYm9vdHN0cmFwLXRwbHMuanMiXSwibmFtZXMiOlsiYW5ndWxhciIsIm1vZHVsZSIsImRpcmVjdGl2ZSIsIiRhbmltYXRlIiwiJHEiLCIkcGFyc2UiLCIkaW5qZWN0b3IiLCIkYW5pbWF0ZUNzcyIsImhhcyIsImdldCIsImxpbmsiLCJzY29wZSIsImVsZW1lbnQiLCJhdHRycyIsImluaXQiLCJob3Jpem9udGFsIiwiY3NzIiwid2lkdGgiLCJjc3NUbyIsImhlaWdodCIsIiRldmFsIiwidWliQ29sbGFwc2UiLCJhZGRDbGFzcyIsImF0dHIiLCJnZXRTY3JvbGxGcm9tRWxlbWVudCIsInNjcm9sbFdpZHRoIiwic2Nyb2xsSGVpZ2h0IiwiZXhwYW5kIiwiaGFzQ2xhc3MiLCJyZXNvbHZlIiwiZXhwYW5kaW5nRXhwciIsInRoZW4iLCJyZW1vdmVDbGFzcyIsImVhc2luZyIsIm92ZXJmbG93IiwidG8iLCJzdGFydCIsImV4cGFuZERvbmUiLCJub29wIiwiZXhwYW5kZWRFeHByIiwiY29sbGFwc2UiLCJjb2xsYXBzaW5nRXhwciIsImNvbGxhcHNlRG9uZSIsImNvbGxhcHNlZEV4cHIiLCJleHBhbmRpbmciLCJleHBhbmRlZCIsImNvbGxhcHNpbmciLCJjb2xsYXBzZWQiLCIkd2F0Y2giLCJzaG91bGRDb2xsYXBzZSIsInJlc3RyaWN0IiwiZWxlbSIsIiRvYnNlcnZlIiwiZGlzYWJsZWQiLCIkc2V0IiwiY29uc3RhbnQiLCJjbG9zZU90aGVycyIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCIkYXR0cnMiLCJhY2NvcmRpb25Db25maWciLCJ0aGlzIiwiZ3JvdXBzIiwib3Blbkdyb3VwIiwiaXNEZWZpbmVkIiwiZm9yRWFjaCIsImdyb3VwIiwiaXNPcGVuIiwiYWRkR3JvdXAiLCJncm91cFNjb3BlIiwidGhhdCIsInB1c2giLCIkb24iLCJldmVudCIsInJlbW92ZUdyb3VwIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwiY29udHJvbGxlckFzIiwidHJhbnNjbHVkZSIsInRlbXBsYXRlVXJsIiwicmVxdWlyZSIsImhlYWRpbmciLCJwYW5lbENsYXNzIiwiaXNEaXNhYmxlZCIsInNldEhlYWRpbmciLCJhY2NvcmRpb25DdHJsIiwib3BlbkNsYXNzIiwidmFsdWUiLCJ0b2dnbGVDbGFzcyIsInRvZ2dsZU9wZW4iLCIkZXZlbnQiLCJ3aGljaCIsImlkIiwiJGlkIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiaGVhZGluZ0lkIiwicGFuZWxJZCIsInRlbXBsYXRlIiwicmVwbGFjZSIsImFjY29yZGlvbkdyb3VwQ3RybCIsImdldEhlYWRlclNlbGVjdG9ycyIsInVpYkFjY29yZGlvblRyYW5zY2x1ZGUiLCJxdWVyeVNlbGVjdG9yIiwiaHRtbCIsImFwcGVuZCIsIiRlbGVtZW50IiwiJGludGVycG9sYXRlIiwiJHRpbWVvdXQiLCJjbG9zZWFibGUiLCJjbG9zZSIsImRpc21pc3NPblRpbWVvdXQiLCIkcGFyZW50IiwicGFyc2VJbnQiLCJhY3RpdmVDbGFzcyIsInRvZ2dsZUV2ZW50IiwiYnV0dG9uQ29uZmlnIiwiY3RybHMiLCJidXR0b25zQ3RybCIsIm5nTW9kZWxDdHJsIiwidW5jaGVja2FibGVFeHByIiwidWliVW5jaGVja2FibGUiLCJmaW5kIiwiZGlzcGxheSIsIiRyZW5kZXIiLCJlcXVhbHMiLCIkbW9kZWxWYWx1ZSIsInVpYkJ0blJhZGlvIiwib24iLCJpc0FjdGl2ZSIsInVuY2hlY2thYmxlIiwiJGFwcGx5IiwiJHNldFZpZXdWYWx1ZSIsInVuZGVmaW5lZCIsImdldFRydWVWYWx1ZSIsImdldENoZWNrYm94VmFsdWUiLCJidG5DaGVja2JveFRydWUiLCJnZXRGYWxzZVZhbHVlIiwiYnRuQ2hlY2tib3hGYWxzZSIsImF0dHJpYnV0ZSIsImRlZmF1bHRWYWx1ZSIsIiRpbnRlcnZhbCIsInNldEFjdGl2ZSIsImkiLCJzbGlkZXMiLCJsZW5ndGgiLCJzbGlkZSIsImFjdGl2ZSIsImdvTmV4dCIsImRpcmVjdGlvbiIsImRlc3Ryb3llZCIsImV4dGVuZCIsImN1cnJlbnRJbmRleCIsImVuYWJsZWQiLCIkY3VycmVudFRyYW5zaXRpb24iLCJzZWxmIiwiZGF0YSIsIlNMSURFX0RJUkVDVElPTiIsImN1cnJlbnRJZHgiLCJnZXRDdXJyZW50SW5kZXgiLCJpc051bWJlciIsInBoYXNlIiwib2ZmIiwicmVzdGFydFRpbWVyIiwiZmluZFNsaWRlSW5kZXgiLCJyZXNldFRpbWVyIiwiY3VycmVudEludGVydmFsIiwiY2FuY2VsIiwicmVzZXRUcmFuc2l0aW9uIiwiaW50ZXJ2YWwiLCJpc05hTiIsInRpbWVyRm4iLCJpc1BsYXlpbmciLCJuZXh0IiwicGF1c2UiLCJhZGRTbGlkZSIsInNvcnQiLCJhIiwiYiIsInNlbGVjdCIsInBsYXkiLCJuZXdJbmRleCIsIm5vV3JhcCIsInByZXYiLCJyZW1vdmVTbGlkZSIsIm5leHRTbGlkZSIsIm5leHRJbmRleCIsImluZGV4T2ZTbGlkZSIsImlzUHJldkRpc2FibGVkIiwiaXNOZXh0RGlzYWJsZWQiLCJub1BhdXNlIiwibm9UcmFuc2l0aW9uIiwiJHdhdGNoQ29sbGVjdGlvbiIsImFjdHVhbCIsImNhcm91c2VsQ3RybCIsImFuaW1hdGlvbiIsImNsYXNzTmFtZSIsImNhbGxiYWNrIiwiYmVmb3JlQWRkQ2xhc3MiLCJkb25lIiwic3RvcHBlZCIsImRpcmVjdGlvbkNsYXNzIiwicmVtb3ZlQ2xhc3NGbiIsImJpbmQiLCJiZWZvcmVSZW1vdmVDbGFzcyIsInNlcnZpY2UiLCIkbG9nIiwiJGxvY2FsZSIsImRhdGVGaWx0ZXIiLCJvcmRlckJ5RmlsdGVyIiwiZmlsdGVyRmlsdGVyIiwiZ2V0Rm9ybWF0Q29kZVRvUmVnZXgiLCJrZXkiLCJmb3JtYXRDb2RlVG9SZWdleCIsImNyZWF0ZVBhcnNlciIsImZvcm1hdCIsIm1hcCIsInJlZ2V4Iiwic3BsaXQiLCJxdW90ZUluZGV4IiwiaW5MaXRlcmFsIiwiam9pbiIsIm4iLCJhcHBseSIsIm1hdGNoZXIiLCJSZWdFeHAiLCJjcmVhdGVGb3JtYXR0ZXIiLCJmb3JtYXR0ZXIiLCJsaXRlcmFsSWR4IiwiZm9ybWF0dGVycyIsImNoYXJBdCIsImNvbnN0cnVjdExpdGVyYWxGb3JtYXR0ZXIiLCJjb25zdHJ1Y3RGb3JtYXR0ZXJGcm9tSWR4IiwiZW5kSWR4IiwicGFyc2VyIiwic3Vic3RyIiwiY3VycmVudFBvc1N0ciIsImoiLCJ0ZXN0IiwiaXNWYWxpZCIsInllYXIiLCJtb250aCIsImRhdGUiLCJ0b0ludCIsInN0ciIsInRvVGltZXpvbmUiLCJ0aW1lem9uZSIsImNvbnZlcnRUaW1lem9uZVRvTG9jYWwiLCJmcm9tVGltZXpvbmUiLCJ0aW1lem9uZVRvT2Zmc2V0IiwiZmFsbGJhY2siLCJyZXF1ZXN0ZWRUaW1lem9uZU9mZnNldCIsIkRhdGUiLCJwYXJzZSIsImFkZERhdGVNaW51dGVzIiwibWludXRlcyIsImdldFRpbWUiLCJzZXRNaW51dGVzIiwiZ2V0TWludXRlcyIsInJldmVyc2UiLCJkYXRlVGltZXpvbmVPZmZzZXQiLCJnZXRUaW1lem9uZU9mZnNldCIsInRpbWV6b25lT2Zmc2V0IiwibG9jYWxlSWQiLCJTUEVDSUFMX0NIQVJBQ1RFUlNfUkVHRVhQIiwicGFyc2VycyIsIl9kYXRlIiwic2V0RnVsbFllYXIiLCJhYnMiLCJnZXRGdWxsWWVhciIsImdldE1vbnRoIiwiREFURVRJTUVfRk9STUFUUyIsIk1PTlRIIiwiU0hPUlRNT05USCIsImdldERhdGUiLCJEQVkiLCJTSE9SVERBWSIsImhvdXJzIiwibWlsbGlzZWNvbmRzIiwic2Vjb25kcyIsIkFNUE1TIiwibWF0Y2hlcyIsIm1hdGNoIiwic2lnbiIsIkVSQU5BTUVTIiwiRVJBUyIsInZlcnNpb24iLCJtYWpvciIsIm1pbm9yIiwiU1RBTkRBTE9ORU1PTlRIIiwiZ2V0UGFyc2VyIiwiZiIsIm92ZXJyaWRlUGFyc2VyIiwiaXNGdW5jdGlvbiIsImZpbHRlciIsImlzRGF0ZSIsInJlZHVjZSIsImlucHV0IiwiYmFzZURhdGUiLCJpc1N0cmluZyIsInJlc3VsdHMiLCJ0ek9mZnNldCIsImZpZWxkcyIsImR0IiwiZ2V0SG91cnMiLCJnZXRTZWNvbmRzIiwiZ2V0TWlsbGlzZWNvbmRzIiwid2FybiIsIm1hcHBlciIsImNhbGwiLCJkYXRlc2V0dGVyIiwicHJvdG90eXBlIiwic2V0VVRDRnVsbFllYXIiLCJ0aW1lc2V0dGVyIiwic2V0VVRDSG91cnMiLCJzZXRIb3VycyIsIk9OX1JFR0VYUCIsIklTX1JFR0VYUCIsImNvbXBpbGUiLCJ0RWxlbWVudCIsInRBdHRycyIsImxpbmtGbiIsImxpbmtlZFNjb3BlcyIsImluc3RhbmNlcyIsImV4cHMiLCJleHAiLCJrIiwiYWRkRm9yRXhwIiwicmVtb3ZlU2NvcGUiLCJjbGF6eiIsImNvbXBhcmVXaXRoRXhwIiwiZXhwVG9EYXRhIiwid2F0Y2hGbiIsImNvbXBhcmVXaXRoVmFsIiwibmV3QWN0aXZhdGVkIiwic29tZSIsImluc3RhbmNlIiwidGhpc1ZhbCIsIm9uRXhwIiwibGFzdEFjdGl2YXRlZCIsIndhdGNoZXIiLCJlIiwicmVtb3ZlZFNjb3BlIiwidGFyZ2V0U2NvcGUiLCJuZXdXYXRjaFNjb3BlIiwib25FeHBNYXRjaGVzIiwidWliSXNDbGFzcyIsImV4cHNTdHIiLCJkYXRlcGlja2VyTW9kZSIsImZvcm1hdERheSIsImZvcm1hdE1vbnRoIiwiZm9ybWF0WWVhciIsImZvcm1hdERheUhlYWRlciIsImZvcm1hdERheVRpdGxlIiwiZm9ybWF0TW9udGhUaXRsZSIsIm1heERhdGUiLCJtYXhNb2RlIiwibWluRGF0ZSIsIm1pbk1vZGUiLCJtb250aENvbHVtbnMiLCJuZ01vZGVsT3B0aW9ucyIsInNob3J0Y3V0UHJvcGFnYXRpb24iLCJzaG93V2Vla3MiLCJ5ZWFyQ29sdW1ucyIsInllYXJSb3dzIiwiZGF0ZXBpY2tlckNvbmZpZyIsIiRkYXRlcGlja2VyTGl0ZXJhbFdhcm5pbmciLCIkZGF0ZXBpY2tlclN1cHByZXNzRXJyb3IiLCJkYXRlUGFyc2VyIiwic2V0TW9kZSIsIm1vZGUiLCJkYXRlcGlja2VyT3B0aW9ucyIsImV4dHJhY3RPcHRpb25zIiwiJG9wdGlvbnMiLCJnZXRPcHRpb24iLCJjcmVhdGVDaGlsZCIsIndhdGNoTGlzdGVuZXJzIiwibW9kZXMiLCJzdGFydGluZ0RheSIsIkZJUlNUREFZT0ZXRUVLIiwicmVmcmVzaFZpZXciLCJ1bmlxdWVJZCIsIm5nRGlzYWJsZWQiLCJkYXRlT2JqZWN0IiwiY29tcGFyZSIsImFjdGl2ZURhdGUiLCJhY3RpdmVEYXRlSWQiLCJ1aWQiLCJuZ01vZGVsQ3RybF8iLCJpbml0RGF0ZSIsIiRpc0VtcHR5IiwiJGludmFsaWQiLCJyZW5kZXIiLCIkdmlld1ZhbHVlIiwiZXJyb3IiLCJzZWxlY3RlZER0IiwiX3JlZnJlc2hWaWV3IiwiYWN0aXZlRHQiLCIkc2V0VmFsaWRpdHkiLCJjcmVhdGVEYXRlT2JqZWN0IiwibW9kZWwiLCJ0b2RheSIsInRpbWUiLCJsYWJlbCIsInNlbGVjdGVkIiwicGFzdCIsImN1cnJlbnQiLCJmdXR1cmUiLCJjdXN0b21DbGFzcyIsImRhdGVEaXNhYmxlZCIsImFyciIsInNpemUiLCJhcnJheXMiLCIkZW1pdCIsIiRicm9hZGNhc3QiLCJtb3ZlIiwic3RlcCIsInllYXJzIiwibW9udGhzIiwidG9nZ2xlTW9kZSIsImtleXMiLCIxMyIsIjMyIiwiMzMiLCIzNCIsIjM1IiwiMzYiLCIzNyIsIjM4IiwiMzkiLCI0MCIsImZvY3VzRWxlbWVudCIsImZvY3VzIiwia2V5ZG93biIsImV2dCIsInNoaWZ0S2V5IiwiYWx0S2V5IiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJjdHJsS2V5IiwiaGFuZGxlS2V5RG93biIsInNoaWZ0IiwiZ2V0RGF5c0luTW9udGgiLCJEQVlTX0lOX01PTlRIIiwiZ2V0SVNPODYwMVdlZWtOdW1iZXIiLCJjaGVja0RhdGUiLCJzZXREYXRlIiwiZ2V0RGF5Iiwic2V0TW9udGgiLCJyb3VuZCIsImN0cmwiLCJnZXREYXRlcyIsInN0YXJ0RGF0ZSIsImRhdGVzIiwiQXJyYXkiLCJmaXJzdERheU9mTW9udGgiLCJkaWZmZXJlbmNlIiwibnVtRGlzcGxheWVkRnJvbVByZXZpb3VzTW9udGgiLCJmaXJzdERhdGUiLCJkYXlzIiwic2Vjb25kYXJ5IiwibGFiZWxzIiwiYWJiciIsImZ1bGwiLCJ0aXRsZSIsInJvd3MiLCJ3ZWVrTnVtYmVycyIsInRodXJzZGF5SW5kZXgiLCJudW1XZWVrcyIsImN1cldlZWsiLCJkYXRlMSIsImRhdGUyIiwiX2RhdGUxIiwiX2RhdGUyIiwibWluIiwieWVhckhlYWRlckNvbHNwYW4iLCJnZXRTdGFydGluZ1llYXIiLCJyYW5nZSIsImNvbHVtbnMiLCJ5ZWFycGlja2VySW5pdCIsImRhdGVwaWNrZXJDdHJsIiwiZGF5cGlja2VyQ3RybCIsIm1vbnRocGlja2VyQ3RybCIsImZhY3RvcnkiLCIkZG9jdW1lbnQiLCIkd2luZG93IiwiU0NST0xMQkFSX1dJRFRIIiwiQk9EWV9TQ1JPTExCQVJfV0lEVEgiLCJPVkVSRkxPV19SRUdFWCIsIm5vcm1hbCIsImhpZGRlbiIsIlBMQUNFTUVOVF9SRUdFWCIsImF1dG8iLCJwcmltYXJ5IiwidmVydGljYWwiLCJCT0RZX1JFR0VYIiwiZ2V0UmF3Tm9kZSIsIm5vZGVOYW1lIiwicGFyc2VTdHlsZSIsInBhcnNlRmxvYXQiLCJpc0Zpbml0ZSIsIm9mZnNldFBhcmVudCIsImlzU3RhdGljUG9zaXRpb25lZCIsImVsIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsInBvc2l0aW9uIiwiZG9jdW1lbnRFbGVtZW50Iiwic2Nyb2xsYmFyV2lkdGgiLCJpc0JvZHkiLCJpc1VuZGVmaW5lZCIsImJvZHlFbGVtIiwiaW5uZXJXaWR0aCIsImNsaWVudFdpZHRoIiwic2Nyb2xsRWxlbSIsIm9mZnNldFdpZHRoIiwicmVtb3ZlIiwic2Nyb2xsYmFyUGFkZGluZyIsImVsZW1TdHlsZSIsInBhZGRpbmdSaWdodCIsInBhZGRpbmdCb3R0b20iLCJzY3JvbGxQYXJlbnQiLCJ0YWdOYW1lIiwid2lkdGhPdmVyZmxvdyIsInJpZ2h0Iiwib3JpZ2luYWxSaWdodCIsImhlaWdodE92ZXJmbG93IiwiY2xpZW50SGVpZ2h0IiwiYm90dG9tIiwib3JpZ2luYWxCb3R0b20iLCJpc1Njcm9sbGFibGUiLCJpbmNsdWRlSGlkZGVuIiwib3ZlcmZsb3dSZWdleCIsIm92ZXJmbG93WSIsIm92ZXJmbG93WCIsImluY2x1ZGVTZWxmIiwiZG9jdW1lbnRFbCIsImV4Y2x1ZGVTdGF0aWMiLCJwYXJlbnRFbGVtZW50Iiwic3BTdHlsZSIsImluY2x1ZGVNYWdpbnMiLCJlbGVtT2Zmc2V0Iiwib2Zmc2V0IiwidG9wIiwibWFyZ2luVG9wIiwibGVmdCIsIm1hcmdpbkxlZnQiLCJwYXJlbnQiLCJwYXJlbnRPZmZzZXQiLCJjbGllbnRUb3AiLCJzY3JvbGxUb3AiLCJjbGllbnRMZWZ0Iiwic2Nyb2xsTGVmdCIsIm9mZnNldEhlaWdodCIsImVsZW1CQ1IiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJwYWdlWU9mZnNldCIsInBhZ2VYT2Zmc2V0Iiwidmlld3BvcnRPZmZzZXQiLCJ1c2VEb2N1bWVudCIsImluY2x1ZGVQYWRkaW5nIiwib2Zmc2V0QkNSIiwib2Zmc2V0UGFyZW50QkNSIiwib2Zmc2V0UGFyZW50U3R5bGUiLCJwYWRkaW5nVG9wIiwicGFkZGluZ0xlZnQiLCJwYXJzZVBsYWNlbWVudCIsInBsYWNlbWVudCIsImF1dG9QbGFjZSIsInBvc2l0aW9uRWxlbWVudHMiLCJob3N0RWxlbSIsInRhcmdldEVsZW0iLCJhcHBlbmRUb0JvZHkiLCJ0YXJnZXRXaWR0aCIsInByb3AiLCJ0YXJnZXRIZWlnaHQiLCJob3N0RWxlbVBvcyIsInRhcmdldEVsZW1Qb3MiLCJ0YXJnZXRFbGVtU3R5bGUiLCJhZGp1c3RlZFNpemUiLCJtYXJnaW5SaWdodCIsIm1hcmdpbkJvdHRvbSIsInhPdmVyZmxvdyIsInlPdmVyZmxvdyIsImFkanVzdFRvcCIsInBsYWNlbWVudENsYXNzZXMiLCJjb250YWluZXJQb3NpdGlvbiIsImluaXRpYWxIZWlnaHQiLCJjdXJyZW50SGVpZ2h0IiwicG9zaXRpb25BcnJvdyIsImlubmVyRWxlbSIsImlzVG9vbHRpcCIsImFycm93RWxlbSIsImFycm93Q3NzIiwiYm9yZGVyUHJvcCIsImJvcmRlcldpZHRoIiwiYm9yZGVyUmFkaXVzUHJvcCIsImJvcmRlclJhZGl1cyIsImFsdElucHV0Rm9ybWF0cyIsImNsZWFyVGV4dCIsImNsb3NlT25EYXRlU2VsZWN0aW9uIiwiY2xvc2VUZXh0IiwiY3VycmVudFRleHQiLCJkYXRlcGlja2VyUG9wdXAiLCJkYXRlcGlja2VyUG9wdXBUZW1wbGF0ZVVybCIsImRhdGVwaWNrZXJUZW1wbGF0ZVVybCIsImh0bWw1VHlwZXMiLCJkYXRldGltZS1sb2NhbCIsIm9uT3BlbkZvY3VzIiwic2hvd0J1dHRvbkJhciIsIiRjb21waWxlIiwiJHJvb3RTY29wZSIsIiRwb3NpdGlvbiIsImRhdGVwaWNrZXJQb3B1cENvbmZpZyIsIiRkYXRlcGlja2VyUG9wdXBMaXRlcmFsV2FybmluZyIsInBhcnNlRGF0ZVN0cmluZyIsInZpZXdWYWx1ZSIsImRhdGVGb3JtYXQiLCJwYXJzZURhdGUiLCJ2YWxpZGF0b3IiLCJtb2RlbFZhbHVlIiwibmdSZXF1aXJlZCIsImRvY3VtZW50Q2xpY2tCaW5kIiwicG9wdXAiLCIkcG9wdXAiLCJkcENvbnRhaW5zVGFyZ2V0IiwiY29udGFpbnMiLCJ0YXJnZXQiLCJwb3B1cENvbnRhaW5zVGFyZ2V0IiwiaW5wdXRLZXlkb3duQmluZCIsInBvc2l0aW9uUG9wdXAiLCJkcEVsZW1lbnQiLCJwb3B1cFBsYWNlbWVudCIsImlzT2JqZWN0IiwicG9wdXBFbCIsImRhdGVwaWNrZXJFbCIsInNjcm9sbFBhcmVudEVsIiwibmdNb2RlbCIsImlzSHRtbDVEYXRlSW5wdXQiLCJfbmdNb2RlbF8iLCJkYXRlcGlja2VyQXBwZW5kVG9Cb2R5IiwidHlwZSIsInVpYkRhdGVwaWNrZXJQb3B1cCIsIm9sZFZhbHVlIiwibmV3RGF0ZUZvcm1hdCIsIkVycm9yIiwibmctbW9kZWwiLCJuZy1jaGFuZ2UiLCJ0ZW1wbGF0ZS11cmwiLCJjaGlsZHJlbiIsIiRmb3JtYXR0ZXJzIiwiJCRwYXJzZXJOYW1lIiwiJHZhbGlkYXRvcnMiLCIkcGFyc2VycyIsInVuc2hpZnQiLCIkdmlld0NoYW5nZUxpc3RlbmVycyIsImFmdGVyIiwiJCRwaGFzZSIsImdldFRleHQiLCJkYXRlU2VsZWN0aW9uIiwidmFsIiwiZGVib3VuY2VUaW1lIiwidGltZW91dFByb21pc2UiLCJhcmdzIiwic2xpY2UiLCJhcmd1bWVudHMiLCJjcmVhdGVOZXciLCJlbnRyaWVzIiwiT2JqZWN0IiwiaGFzS2V5IiwicHV0IiwidmFsdWVzIiwiaWR4IiwiYXBwZW5kVG9PcGVuQ2xhc3MiLCIkJG11bHRpTWFwIiwib3BlblNjb3BlIiwib3BlbmVkQ29udGFpbmVycyIsImlzT25seU9wZW4iLCJkcm9wZG93blNjb3BlIiwiYXBwZW5kVG8iLCJvcGVuZWREcm9wZG93bnMiLCJvcGVuRHJvcGRvd24iLCJ0b0Nsb3NlIiwiZHJvcGRvd24iLCJvcGVuIiwiY2xvc2VEcm9wZG93biIsIm9wZW5lZFNjb3BlcyIsImtleWJpbmRGaWx0ZXIiLCJkcm9wZG93blRvQ2xvc2UiLCJnZXRBdXRvQ2xvc2UiLCJ0b2dnbGVFbGVtZW50IiwiZ2V0VG9nZ2xlRWxlbWVudCIsImRyb3Bkb3duRWxlbWVudCIsImdldERyb3Bkb3duRWxlbWVudCIsImZvY3VzVG9nZ2xlRWxlbWVudCIsImRyb3Bkb3duRWxlbWVudFRhcmdldGVkIiwidG9nZ2xlRWxlbWVudFRhcmdldGVkIiwiaXNLZXluYXZFbmFibGVkIiwiZm9jdXNEcm9wZG93bkVudHJ5IiwiZHJvcGRvd25Db25maWciLCJ1aWJEcm9wZG93blNlcnZpY2UiLCIkdGVtcGxhdGVSZXF1ZXN0IiwicmVtb3ZlRHJvcGRvd25NZW51IiwiZHJvcGRvd25NZW51IiwidGVtcGxhdGVTY29wZSIsImdldElzT3BlbiIsIiRuZXciLCJzZXRJc09wZW4iLCJ0b2dnbGVJbnZva2VyIiwib25Ub2dnbGUiLCJrZXluYXZFbmFibGVkIiwiYm9keSIsImFzc2lnbiIsImtleWJvYXJkTmF2IiwidG9nZ2xlIiwiYXV0b0Nsb3NlIiwiZ2V0RWxlbWVudCIsImtleUNvZGUiLCJlbGVtcyIsImVxIiwic2VsZWN0ZWRPcHRpb24iLCJ3YXNPcGVuIiwiZHJvcGRvd25BcHBlbmRUbyIsImFwcGVuZFRvRWwiLCJkcm9wZG93bkFwcGVuZFRvQm9keSIsImFwcGVuZFRvQm9keVZhbHVlIiwicmlnaHRhbGlnbiIsInBvcyIsIndpbmRvdyIsImFwcGVuZE9mZnNldCIsIm9wZW5Db250YWluZXIiLCJkcm9wZG93bk9wZW5DbGFzcyIsImhhc09wZW5DbGFzcyIsImRyb3Bkb3duTWVudVRlbXBsYXRlVXJsIiwidHBsQ29udGVudCIsInRyaW0iLCJuZXdFbCIsInJlcGxhY2VXaXRoIiwiJGRlc3Ryb3kiLCJkcm9wZG93bkN0cmwiLCJkcm9wZG93bk5lc3RlZCIsInRwbFVybCIsInRvZ2dsZURyb3Bkb3duIiwiYXJpYS1oYXNwb3B1cCIsImFyaWEtZXhwYW5kZWQiLCJzdGFjayIsImFkZCIsInJlbW92ZVRvcCIsInBvcCIsInByb3ZpZGVyIiwicmVzb2x2ZXIiLCJzZXRSZXNvbHZlciIsIiRnZXQiLCJpbnZvY2FibGVzIiwibG9jYWxzIiwicHJvbWlzZXMiLCJpc0FycmF5IiwiaW52b2tlIiwiYWxsIiwicmVzb2x2ZXMiLCJyZXNvbHZlT2JqIiwicmVzb2x2ZUl0ZXIiLCIkbW9kYWxTdGFjayIsIm1vZGFsSW5DbGFzcyIsIk5PV19DTE9TSU5HX0VWRU5UIiwic2V0SXNBc3luYyIsIm1vZGFsT3B0aW9ucyIsImJhY2tkcm9wQ2xhc3MiLCJ3aW5kb3dUb3BDbGFzcyIsIm1vZGFsIiwiZ2V0VG9wIiwiYmFja2Ryb3AiLCJjdXJyZW50VGFyZ2V0IiwiZGlzbWlzcyIsIiRpc1JlbmRlcmVkIiwibW9kYWxSZW5kZXJEZWZlck9iaiIsImRlZmVyIiwiJCRwb3N0RGlnZXN0IiwicHJvbWlzZSIsImFuaW1hdGlvblByb21pc2UiLCJ3aGVuIiwibW9kYWxSZW5kZXJlZCIsImFjdGl2ZUVsZW1lbnQiLCJpbnB1dFdpdGhBdXRvZm9jdXMiLCJtb2RhbEFuaW1hdGlvbiIsInVpYk1vZGFsQW5pbWF0aW9uQ2xhc3MiLCJjbG9uZSIsImVtcHR5IiwiZW50ZXIiLCIkJHN0YWNrZWRNYXAiLCIkdWliUG9zaXRpb24iLCJzbmFrZV9jYXNlIiwibmFtZSIsInNlcGFyYXRvciIsIlNOQUtFX0NBU0VfUkVHRVhQIiwibGV0dGVyIiwidG9Mb3dlckNhc2UiLCJpc1Zpc2libGUiLCJnZXRDbGllbnRSZWN0cyIsImJhY2tkcm9wSW5kZXgiLCJ0b3BCYWNrZHJvcEluZGV4Iiwib3BlbmVkIiwib3BlbmVkV2luZG93cyIsInRvcE1vZGFsSW5kZXgiLCJyZW1vdmVNb2RhbFdpbmRvdyIsIm1vZGFsSW5zdGFuY2UiLCJlbGVtZW50VG9SZWNlaXZlRm9jdXMiLCJtb2RhbFdpbmRvdyIsImFwcGVuZFRvRWxlbWVudCIsInByZXZpb3VzVG9wT3BlbmVkTW9kYWwiLCJtb2RhbERvbUVsIiwicmVtb3ZlQWZ0ZXJBbmltYXRlIiwibW9kYWxTY29wZSIsIm1vZGFsQm9keUNsYXNzIiwib3BlbmVkQ2xhc3MiLCJPUEVORURfTU9EQUxfQ0xBU1MiLCJvcGVuZWRDbGFzc2VzIiwiYXJlQW55T3BlbiIsInRvZ2dsZVRvcFdpbmRvd0NsYXNzIiwiY2xvc2VkRGVmZXJyZWQiLCJjaGVja1JlbW92ZUJhY2tkcm9wIiwidG9nZ2xlU3dpdGNoIiwiYmFja2Ryb3BEb21FbCIsImJhY2tkcm9wU2NvcGVSZWYiLCJiYWNrZHJvcFNjb3BlIiwiZG9tRWwiLCJhZnRlckFuaW1hdGluZyIsImxlYXZlIiwiYXN5bmNEZWZlcnJlZCIsImFzeW5jUHJvbWlzZSIsImtleWRvd25MaXN0ZW5lciIsImlzRGVmYXVsdFByZXZlbnRlZCIsImtleWJvYXJkIiwibGlzdCIsImxvYWRGb2N1c0VsZW1lbnRMaXN0IiwiZm9jdXNDaGFuZ2VkIiwiaXNGb2N1c0luRmlyc3RJdGVtIiwiaXNNb2RhbEZvY3VzZWQiLCJmb2N1c0xhc3RGb2N1c2FibGVFbGVtZW50IiwiaXNGb2N1c0luTGFzdEl0ZW0iLCJmb2N1c0ZpcnN0Rm9jdXNhYmxlRWxlbWVudCIsImJyb2FkY2FzdENsb3NpbmciLCJyZXN1bHRPclJlYXNvbiIsImNsb3NpbmciLCJkZWZhdWx0UHJldmVudGVkIiwidW5oaWRlQmFja2dyb3VuZEVsZW1lbnRzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiQVJJQV9ISURERU5fQVRUUklCVVRFX05BTUUiLCJoaWRkZW5FbCIsImFyaWFIaWRkZW5Db3VudCIsImdldEF0dHJpYnV0ZSIsIm5ld0hpZGRlbkNvdW50Iiwic2V0QXR0cmlidXRlIiwicmVtb3ZlQXR0cmlidXRlIiwidGFiYmFibGVTZWxlY3RvciIsIm5ld0JhY2tkcm9wSW5kZXgiLCJhcHBseUFyaWFIaWRkZW4iLCJnZXRTaWJsaW5ncyIsImNoaWxkIiwic2libGluZyIsImVsZW1Jc0FscmVhZHlIaWRkZW4iLCJtb2RhbE9wZW5lciIsImRlZmVycmVkIiwicmVuZGVyRGVmZXJyZWQiLCJjdXJyQmFja2Ryb3BJbmRleCIsImNsYXNzIiwibmctc3R5bGUiLCJ1aWItbW9kYWwtYW5pbWF0aW9uLWNsYXNzIiwibW9kYWwtaW4tY2xhc3MiLCJjb250ZW50IiwiY29tcG9uZW50IiwiY3JlYXRlRWxlbWVudCIsIm1vZGFsLWluc3RhbmNlIiwiYW5ndWxhckRvbUVsIiwid2luZG93VGVtcGxhdGVVcmwiLCJ3aW5kb3ctdG9wLWNsYXNzIiwicm9sZSIsImFyaWEtbGFiZWxsZWRieSIsImFyaWFMYWJlbGxlZEJ5IiwiYXJpYS1kZXNjcmliZWRieSIsImFyaWFEZXNjcmliZWRCeSIsImFuaW1hdGUiLCJ0YWJpbmRleCIsIndpbmRvd0NsYXNzIiwiJCR0b3BNb2RhbEluZGV4IiwicmVzdWx0IiwiJCR1aWJEZXN0cnVjdGlvblNjaGVkdWxlZCIsInJlYXNvbiIsInJlamVjdCIsImRpc21pc3NBbGwiLCJ0b3BNb2RhbCIsInNyY0VsZW1lbnQiLCJtb2RhbERvbUUxIiwiZWxlbWVudHMiLCIkbW9kYWxQcm92aWRlciIsIm9wdGlvbnMiLCIkY29udHJvbGxlciIsIiR1aWJSZXNvbHZlIiwiZ2V0VGVtcGxhdGVQcm9taXNlIiwiJG1vZGFsIiwicHJvbWlzZUNoYWluIiwiZ2V0UHJvbWlzZUNoYWluIiwicmVzb2x2ZVdpdGhUZW1wbGF0ZSIsInRlbXBsYXRlQW5kUmVzb2x2ZVByb21pc2UiLCJtb2RhbFJlc3VsdERlZmVycmVkIiwibW9kYWxPcGVuZWREZWZlcnJlZCIsIm1vZGFsQ2xvc2VkRGVmZXJyZWQiLCJtb2RhbFJlbmRlckRlZmVycmVkIiwiY2xvc2VkIiwicmVuZGVyZWQiLCJzYW1lUHJvbWlzZSIsInRwbEFuZFZhcnMiLCJjb25zdHJ1Y3RMb2NhbHMiLCJvYmoiLCJpbnN0YW5jZU9uU2NvcGUiLCJpbmplY3RhYmxlIiwiJHJlc29sdmUiLCIkdWliTW9kYWxJbnN0YW5jZSIsInByb3ZpZGVkU2NvcGUiLCIkY2xvc2UiLCIkZGlzbWlzcyIsImN0cmxJbnN0YW5jZSIsImN0cmxJbnN0YW50aWF0ZSIsImN0cmxMb2NhbHMiLCJiaW5kVG9Db250cm9sbGVyIiwiJG9uSW5pdCIsImNyZWF0ZSIsInNldE51bVBhZ2VzIiwibnVtUGFnZXMiLCJfd2F0Y2hlcnMiLCJjb25maWciLCJpdGVtc1BlclBhZ2UiLCJ0b3RhbFBhZ2VzIiwiY2FsY3VsYXRlVG90YWxQYWdlcyIsInVwZGF0ZVBhZ2UiLCJuZXdUb3RhbCIsIm9sZFRvdGFsIiwiY2VpbCIsInRvdGFsSXRlbXMiLCJtYXgiLCJwYWdlIiwic2VsZWN0UGFnZSIsImNsaWNrQWxsb3dlZCIsImJsdXIiLCJub1ByZXZpb3VzIiwibm9OZXh0IiwidWliUGFnaW5nIiwidWliUGFnZXJDb25maWciLCJhbGlnbiIsInByZXZpb3VzVGV4dCIsIm5leHRUZXh0IiwicGFnaW5hdGlvbkN0cmwiLCJ1aWJQYWdpbmF0aW9uQ29uZmlnIiwibWFrZVBhZ2UiLCJudW1iZXIiLCJ0ZXh0IiwiZ2V0UGFnZXMiLCJjdXJyZW50UGFnZSIsInBhZ2VzIiwic3RhcnRQYWdlIiwiZW5kUGFnZSIsImlzTWF4U2l6ZWQiLCJtYXhTaXplIiwicm90YXRlIiwicGFnZUxhYmVsIiwiZm9yY2VFbGxpcHNlcyIsImJvdW5kYXJ5TGlua051bWJlcnMiLCJwcmV2aW91c1BhZ2VTZXQiLCJzZWNvbmRQYWdlTGluayIsImZpcnN0UGFnZUxpbmsiLCJuZXh0UGFnZVNldCIsInNlY29uZFRvTGFzdFBhZ2VMaW5rIiwibGFzdFBhZ2VMaW5rIiwiJHBhZ2UiLCJpZGVudGl0eSIsImJvdW5kYXJ5TGlua3MiLCJkaXJlY3Rpb25MaW5rcyIsIm9yaWdpbmFsUmVuZGVyIiwiZmlyc3RUZXh0IiwibGFzdFRleHQiLCJyZWdleHAiLCJkZWZhdWx0T3B0aW9ucyIsInBsYWNlbWVudENsYXNzUHJlZml4IiwicG9wdXBEZWxheSIsInBvcHVwQ2xvc2VEZWxheSIsInVzZUNvbnRlbnRFeHAiLCJ0cmlnZ2VyTWFwIiwibW91c2VlbnRlciIsImNsaWNrIiwib3V0c2lkZUNsaWNrIiwibm9uZSIsImdsb2JhbE9wdGlvbnMiLCJzZXRUcmlnZ2VycyIsInRyaWdnZXJzIiwia2V5cHJlc3NMaXN0ZW5lciIsImxhc3QiLCJvcGVuZWRUb29sdGlwcyIsInR0VHlwZSIsInByZWZpeCIsImRlZmF1bHRUcmlnZ2VyU2hvdyIsImdldFRyaWdnZXJzIiwidHJpZ2dlciIsInNob3ciLCJoaWRlIiwiZGlyZWN0aXZlTmFtZSIsInN0YXJ0U3ltIiwic3RhcnRTeW1ib2wiLCJlbmRTeW0iLCJlbmRTeW1ib2wiLCJ0RWxlbSIsInRvb2x0aXBMaW5rZXIiLCJ0b29sdGlwQ3RybCIsInRvZ2dsZVRvb2x0aXBCaW5kIiwidHRTY29wZSIsImhpZGVUb29sdGlwQmluZCIsInNob3dUb29sdGlwQmluZCIsImhhc0VuYWJsZUV4cCIsImNhbmNlbEhpZGUiLCJwcmVwYXJlVG9vbHRpcCIsInNob3dUaW1lb3V0IiwiY2FuY2VsU2hvdyIsImhpZGVUaW1lb3V0IiwiY3JlYXRlVG9vbHRpcCIsIiRldmFsQXN5bmMiLCJhc3NpZ25Jc09wZW4iLCJwb3NpdGlvblRvb2x0aXAiLCJwb3NpdGlvblRpbWVvdXQiLCJ0cmFuc2l0aW9uVGltZW91dCIsInJlbW92ZVRvb2x0aXAiLCJ0b29sdGlwIiwidG9vbHRpcExpbmtlZFNjb3BlIiwicHJlcE9ic2VydmVycyIsInVucmVnaXN0ZXJPYnNlcnZlcnMiLCJhZGp1c3RtZW50VGltZW91dCIsImNvbnRlbnRQYXJzZSIsInBvcHVwQ2xhc3MiLCJsYXN0UGxhY2VtZW50IiwiZGVsYXkiLCJjbG9zZURlbGF5IiwiaXNPcGVuUGFyc2UiLCJvYnNlcnZlcnMiLCJyZXBvc2l0aW9uU2NoZWR1bGVkIiwib2JzZXJ2ZXIiLCJib2R5SGlkZVRvb2x0aXBCaW5kIiwiaGlkZU9uRXNjYXBlS2V5IiwicHJlcFRyaWdnZXJzIiwic2hvd1RyaWdnZXJzIiwiaGlkZVRyaWdnZXJzIiwidW5yZWdpc3RlclRyaWdnZXJzIiwidHRQb3NpdGlvbiIsImVsZW1lbnRQb3MiLCJhZGp1c3RtZW50Iiwib3JpZ1Njb3BlIiwiY29udGVudEV4cCIsImFwcGVuZFRvQm9keVZhbCIsImFwcGVuZEtleSIsIiRzY2UiLCJjdXJyZW50U2NvcGUiLCJwcmV2aW91c0VsZW1lbnQiLCJjdXJyZW50RWxlbWVudCIsInRvb2x0aXBUZW1wbGF0ZVRyYW5zY2x1ZGVTY29wZSIsImNoYW5nZUNvdW50ZXIiLCJjbGVhbnVwTGFzdEluY2x1ZGVDb250ZW50IiwicGFyc2VBc1Jlc291cmNlVXJsIiwidWliVG9vbHRpcFRlbXBsYXRlVHJhbnNjbHVkZSIsInNyYyIsInRoaXNDaGFuZ2VJZCIsInJlc3BvbnNlIiwibmV3U2NvcGUiLCJ0b29sdGlwQW5pbWF0aW9uQ2xhc3MiLCIkdWliVG9vbHRpcCIsIm9yaWdpblNjb3BlIiwidWliVGl0bGUiLCJwcm9ncmVzc0NvbmZpZyIsImdldE1heE9yRGVmYXVsdCIsIm1heFBhcmFtIiwiYmFycyIsImFkZEJhciIsImJhciIsInRyYW5zaXRpb24iLCJyZWNhbGN1bGF0ZVBlcmNlbnRhZ2UiLCJ0b3RhbFBlcmNlbnRhZ2UiLCJ0b3RhbCIsInBlcmNlbnQiLCJ0b0ZpeGVkIiwicmVtb3ZlQmFyIiwicHJvZ3Jlc3NDdHJsIiwic3RhdGVPbiIsInN0YXRlT2ZmIiwiZW5hYmxlUmVzZXQiLCJ0aXRsZXMiLCJyYXRpbmdDb25maWciLCJ0bXBUaXRsZXMiLCJyYXRpbmdTdGF0ZXMiLCJidWlsZFRlbXBsYXRlT2JqZWN0cyIsInN0YXRlcyIsImdldFRpdGxlIiwicmF0ZSIsInJlYWRvbmx5IiwibmV3Vmlld1ZhbHVlIiwib25Ib3ZlciIsInJlc2V0Iiwib25MZWF2ZSIsIm9uS2V5ZG93biIsInJhdGluZ0N0cmwiLCJmaW5kVGFiSW5kZXgiLCJ0YWJzIiwib2xkSW5kZXgiLCJwcmV2aW91c0luZGV4IiwicHJldmlvdXNTZWxlY3RlZCIsInRhYiIsIm9uRGVzZWxlY3QiLCIkc2VsZWN0ZWRJbmRleCIsIm9uU2VsZWN0IiwiYWRkVGFiIiwidDEiLCJ0MiIsIm5ld0FjdGl2ZUluZGV4IiwicmVtb3ZlVGFiIiwibmV3QWN0aXZlVGFiSW5kZXgiLCJqdXN0aWZpZWQiLCJjbGFzc2VzIiwiZWxtIiwidGFic2V0Q3RybCIsImRpc2FibGUiLCJ0IiwiJHRyYW5zY2x1ZGVGbiIsImlzVGFiSGVhZGluZyIsIm5vZGUiLCJoYXNBdHRyaWJ1dGUiLCJ1aWJUYWJDb250ZW50VHJhbnNjbHVkZSIsImNvbnRlbnRzIiwiaGVhZGluZ0VsZW1lbnQiLCJob3VyU3RlcCIsIm1pbnV0ZVN0ZXAiLCJzZWNvbmRTdGVwIiwic2hvd01lcmlkaWFuIiwic2hvd1NlY29uZHMiLCJtZXJpZGlhbnMiLCJyZWFkb25seUlucHV0IiwibW91c2V3aGVlbCIsImFycm93a2V5cyIsInNob3dTcGlubmVycyIsInRpbWVwaWNrZXJDb25maWciLCJnZXRIb3Vyc0Zyb21UZW1wbGF0ZSIsInZhbGlkIiwibWVyaWRpYW4iLCJnZXRNaW51dGVzRnJvbVRlbXBsYXRlIiwiZ2V0U2Vjb25kc0Zyb21UZW1wbGF0ZSIsInBhZCIsIm5vUGFkIiwidG9TdHJpbmciLCJyZWZyZXNoIiwia2V5Ym9hcmRDaGFuZ2UiLCJtYWtlVmFsaWQiLCJ1cGRhdGVUZW1wbGF0ZSIsImhvdXJzTW9kZWxDdHJsIiwibWludXRlc01vZGVsQ3RybCIsInNlY29uZHNNb2RlbEN0cmwiLCJpbnZhbGlkSG91cnMiLCJpbnZhbGlkTWludXRlcyIsImludmFsaWRTZWNvbmRzIiwicGFkSG91cnMiLCJhZGRTZWNvbmRzVG9TZWxlY3RlZCIsImFkZFNlY29uZHMiLCJhZGRNaW51dGVzIiwibmV3RGF0ZSIsIm1vZGVsSXNFbXB0eSIsIndhdGNoZXJzIiwicmVtb3ZlQXR0ciIsImlucHV0cyIsImhvdXJzSW5wdXRFbCIsIm1pbnV0ZXNJbnB1dEVsIiwic2Vjb25kc0lucHV0RWwiLCJzZXR1cE1vdXNld2hlZWxFdmVudHMiLCJzZXR1cEFycm93a2V5RXZlbnRzIiwic2V0dXBJbnB1dEV2ZW50cyIsIm5vSW5jcmVtZW50SG91cnMiLCJpbmNyZW1lbnRlZFNlbGVjdGVkIiwibm9EZWNyZW1lbnRIb3VycyIsImRlY3JlbWVudGVkU2VsZWN0ZWQiLCJub0luY3JlbWVudE1pbnV0ZXMiLCJub0RlY3JlbWVudE1pbnV0ZXMiLCJub0luY3JlbWVudFNlY29uZHMiLCJub0RlY3JlbWVudFNlY29uZHMiLCJub1RvZ2dsZU1lcmlkaWFuIiwiJGVycm9yIiwiaXNTY3JvbGxpbmdVcCIsIm9yaWdpbmFsRXZlbnQiLCJkZWx0YSIsIndoZWVsRGVsdGEiLCJkZWx0YVkiLCJkZXRhaWwiLCJpbmNyZW1lbnRIb3VycyIsImRlY3JlbWVudEhvdXJzIiwiaW5jcmVtZW50TWludXRlcyIsImRlY3JlbWVudE1pbnV0ZXMiLCJpbmNyZW1lbnRTZWNvbmRzIiwiZGVjcmVtZW50U2Vjb25kcyIsInVwZGF0ZUhvdXJzIiwidXBkYXRlTWludXRlcyIsInVwZGF0ZVNlY29uZHMiLCJpbnZhbGlkYXRlIiwiJHNldERpcnR5IiwiJHNldFRvdWNoZWQiLCJzZXRTZWNvbmRzIiwidG9nZ2xlTWVyaWRpYW4iLCJ1aWJUaW1lcGlja2VyQ29uZmlnIiwidGltZXBpY2tlckN0cmwiLCJUWVBFQUhFQURfUkVHRVhQIiwiaXRlbU5hbWUiLCJzb3VyY2UiLCJ2aWV3TWFwcGVyIiwibW9kZWxNYXBwZXIiLCJvcmlnaW5hbFNjb3BlIiwiJCRkZWJvdW5jZSIsInR5cGVhaGVhZFBhcnNlciIsImZpcmVSZWNhbGN1bGF0aW5nIiwibW92ZUluUHJvZ3Jlc3MiLCIkZGlnZXN0IiwiZGVib3VuY2VkUmVjYWxjdWxhdGUiLCJyZWNhbGN1bGF0ZVBvc2l0aW9uIiwibW9kZWxDdHJsIiwiSE9UX0tFWVMiLCJldmVudERlYm91bmNlVGltZSIsIm1pbkxlbmd0aCIsInR5cGVhaGVhZE1pbkxlbmd0aCIsIm5ld1ZhbCIsIndhaXRUaW1lIiwidHlwZWFoZWFkV2FpdE1zIiwiaXNFZGl0YWJsZSIsInR5cGVhaGVhZEVkaXRhYmxlIiwiaGFzRm9jdXMiLCJpc0xvYWRpbmdTZXR0ZXIiLCJ0eXBlYWhlYWRMb2FkaW5nIiwiaXNTZWxlY3RFdmVudCIsInR5cGVhaGVhZFNob3VsZFNlbGVjdCIsInZhbHMiLCJvblNlbGVjdENhbGxiYWNrIiwidHlwZWFoZWFkT25TZWxlY3QiLCJpc1NlbGVjdE9uQmx1ciIsInR5cGVhaGVhZFNlbGVjdE9uQmx1ciIsImlzTm9SZXN1bHRzU2V0dGVyIiwidHlwZWFoZWFkTm9SZXN1bHRzIiwiaW5wdXRGb3JtYXR0ZXIiLCJ0eXBlYWhlYWRJbnB1dEZvcm1hdHRlciIsInR5cGVhaGVhZEFwcGVuZFRvQm9keSIsInR5cGVhaGVhZEFwcGVuZFRvIiwiZm9jdXNGaXJzdCIsInR5cGVhaGVhZEZvY3VzRmlyc3QiLCJzZWxlY3RPbkV4YWN0IiwidHlwZWFoZWFkU2VsZWN0T25FeGFjdCIsImlzT3BlblNldHRlciIsInR5cGVhaGVhZElzT3BlbiIsInNob3dIaW50IiwidHlwZWFoZWFkU2hvd0hpbnQiLCJwYXJzZWRNb2RlbCIsImludm9rZU1vZGVsU2V0dGVyIiwiJHNldE1vZGVsVmFsdWUiLCJuZXdWYWx1ZSIsIiQkJHAiLCJwYXJzZXJSZXN1bHQiLCJ1aWJUeXBlYWhlYWQiLCJvZmZEZXN0cm95IiwicG9wdXBJZCIsImFyaWEtYXV0b2NvbXBsZXRlIiwiYXJpYS1vd25zIiwiaW5wdXRzQ29udGFpbmVyIiwiaGludElucHV0RWxlbSIsImJvcmRlci1jb2xvciIsImJveC1zaGFkb3ciLCJvcGFjaXR5IiwiYmFja2dyb3VuZCIsImNvbG9yIiwidmVydGljYWwtYWxpZ24iLCJiYWNrZ3JvdW5kLWNvbG9yIiwicG9wVXBFbCIsIm1vdmUtaW4tcHJvZ3Jlc3MiLCJxdWVyeSIsImFzc2lnbi1pcy1vcGVuIiwiZGVib3VuY2UiLCJ0eXBlYWhlYWRUZW1wbGF0ZVVybCIsInR5cGVhaGVhZFBvcHVwVGVtcGxhdGVVcmwiLCJyZXNldEhpbnQiLCJyZXNldE1hdGNoZXMiLCJhY3RpdmVJZHgiLCJnZXRNYXRjaElkIiwiaW5wdXRJc0V4YWN0TWF0Y2giLCJpbnB1dFZhbHVlIiwidG9VcHBlckNhc2UiLCJnZXRNYXRjaGVzQXN5bmMiLCJvbkN1cnJlbnRSZXF1ZXN0IiwiZGVib3VuY2VVcGRhdGUiLCJmaXJzdExhYmVsIiwic2NoZWR1bGVTZWFyY2hXaXRoVGltZW91dCIsImNhbmNlbFByZXZpb3VzVGltZW91dCIsIml0ZW0iLCIkaXRlbSIsIiRtb2RlbCIsIiRsYWJlbCIsInR5cGVhaGVhZEZvY3VzT25TZWxlY3QiLCJzaG91bGRTZWxlY3QiLCJwYXJlbnROb2RlIiwib2Zmc2V0VG9wIiwiZWRpdGFibGUiLCJkaXNtaXNzQ2xpY2tIYW5kbGVyIiwiX21vZGVsQ3RybCIsImNhbmRpZGF0ZVZpZXdWYWx1ZSIsImVtcHR5Vmlld1ZhbHVlIiwicG9wdXBUZW1wbGF0ZVVybCIsImlzRHJvcGRvd25PcGVuIiwibWF0Y2hJZHgiLCJzZWxlY3RBY3RpdmUiLCJzZWxlY3RNYXRjaCIsInRwbEVsIiwiZXNjYXBlUmVnZXhwIiwicXVlcnlUb0VzY2FwZSIsImNvbnRhaW5zSHRtbCIsIm1hdGNoSXRlbSIsImlzU2FuaXRpemVQcmVzZW50IiwidHJ1c3RBc0h0bWwiLCJydW4iLCIkdGVtcGxhdGVDYWNoZSIsIiQkY3NwIiwibm9JbmxpbmVTdHlsZSIsIiQkdWliQ2Fyb3VzZWxDc3MiLCJwcmVwZW5kIiwiJCR1aWJEYXRlcGlja2VyQ3NzIiwiJCR1aWJQb3NpdGlvbkNzcyIsIiQkdWliRGF0ZXBpY2tlcnBvcHVwQ3NzIiwiJCR1aWJUb29sdGlwQ3NzIiwiJCR1aWJUaW1lcGlja2VyQ3NzIiwiJCR1aWJUeXBlYWhlYWRDc3MiXSwibWFwcGluZ3MiOiJBQU1HQSxRQUFRQyxPQUFPLGdCQUFpQixvQkFBcUIsd0JBQXdCLHdCQUF3Qix5QkFBeUIscUJBQXFCLHVCQUF1Qix3QkFBd0IsMEJBQTBCLHVCQUF1QiwwQkFBMEIsd0JBQXdCLCtCQUErQix3QkFBd0Isd0JBQXdCLHdCQUF3QiwwQkFBMEIscUJBQXFCLHNCQUFzQixxQkFBcUIsMEJBQTBCLHVCQUF1Qix1QkFBdUIsMkJBQTJCLHNCQUFzQixvQkFBb0IsMEJBQTBCLDJCQUNocEJELFFBQVFDLE9BQU8scUJBQXNCLDhDQUE4Qyx3Q0FBd0MsZ0NBQWdDLHNDQUFzQyxtQ0FBbUMsMENBQTBDLG1DQUFtQyxxQ0FBcUMsb0NBQW9DLDBDQUEwQyxpQ0FBaUMsZ0NBQWdDLDBDQUEwQywrQ0FBK0MsMENBQTBDLG1EQUFtRCx5Q0FBeUMsNkNBQTZDLG9DQUFvQyxvQ0FBb0MseUNBQXlDLDRDQUE0QyxrQ0FBa0MsNkJBQTZCLGdDQUFnQywwQ0FBMEMsOENBQThDLGdEQUNya0NELFFBQVFDLE9BQU8sNEJBRVpDLFVBQVUsZUFBZ0IsV0FBWSxLQUFNLFNBQVUsWUFBYSxTQUFTQyxFQUFVQyxFQUFJQyxFQUFRQyxHQUNqRyxHQUFJQyxHQUFjRCxFQUFVRSxJQUFJLGVBQWlCRixFQUFVRyxJQUFJLGVBQWlCLElBQ2hGLFFBQ0VDLEtBQU0sU0FBU0MsRUFBT0MsRUFBU0MsR0FXN0IsUUFBU0MsS0FDUEMsS0FBZ0IsY0FBZ0JGLElBQzVCRSxHQUNGQyxHQUNFQyxNQUFPLElBRVRDLEdBQVNELE1BQU8sT0FFaEJELEdBQ0VHLE9BQVEsSUFFVkQsR0FBU0MsT0FBUSxNQUVkUixFQUFNUyxNQUFNUCxFQUFNUSxjQUNyQlQsRUFBUVUsU0FBUyxNQUNkQSxTQUFTLFlBQ1RDLEtBQUssaUJBQWlCLEdBQ3RCQSxLQUFLLGVBQWUsR0FDcEJQLElBQUlBLEdBSVgsUUFB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UVksUUFBUW0wQixVQUFVbnRCLEtBQUssUUFBUW9yQyxRQUFRLCtEQUFnRWh6QyxRQUFRcXpDLG9CQUFxQixJQUN2UXJ6QyxRQUFRQyxPQUFPLDBCQUEwQjB5QyxJQUFJLFlBQWEzeUMsUUFBUTZ5QyxRQUFRQyxnQkFBa0I5eUMsUUFBUXN6QyxtQkFBcUJ0ekMsUUFBUVksUUFBUW0wQixVQUFVbnRCLEtBQUssUUFBUW9yQyxRQUFRLHNGQUF1Rmh6QyxRQUFRc3pDLG1CQUFvQiIsImZpbGUiOiJhbmd1bGFyLXVpLWJvb3RzdHJhcC10cGxzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIGFuZ3VsYXItdWktYm9vdHN0cmFwXG4gKiBodHRwOi8vYW5ndWxhci11aS5naXRodWIuaW8vYm9vdHN0cmFwL1xuXG4gKiBWZXJzaW9uOiAyLjUuMCAtIDIwMTctMDEtMjhcbiAqIExpY2Vuc2U6IE1JVFxuICovYW5ndWxhci5tb2R1bGUoXCJ1aS5ib290c3RyYXBcIiwgW1widWkuYm9vdHN0cmFwLnRwbHNcIiwgXCJ1aS5ib290c3RyYXAuY29sbGFwc2VcIixcInVpLmJvb3RzdHJhcC50YWJpbmRleFwiLFwidWkuYm9vdHN0cmFwLmFjY29yZGlvblwiLFwidWkuYm9vdHN0cmFwLmFsZXJ0XCIsXCJ1aS5ib290c3RyYXAuYnV0dG9uc1wiLFwidWkuYm9vdHN0cmFwLmNhcm91c2VsXCIsXCJ1aS5ib290c3RyYXAuZGF0ZXBhcnNlclwiLFwidWkuYm9vdHN0cmFwLmlzQ2xhc3NcIixcInVpLmJvb3RzdHJhcC5kYXRlcGlja2VyXCIsXCJ1aS5ib290c3RyYXAucG9zaXRpb25cIixcInVpLmJvb3RzdHJhcC5kYXRlcGlja2VyUG9wdXBcIixcInVpLmJvb3RzdHJhcC5kZWJvdW5jZVwiLFwidWkuYm9vdHN0cmFwLm11bHRpTWFwXCIsXCJ1aS5ib290c3RyYXAuZHJvcGRvd25cIixcInVpLmJvb3RzdHJhcC5zdGFja2VkTWFwXCIsXCJ1aS5ib290c3RyYXAubW9kYWxcIixcInVpLmJvb3RzdHJhcC5wYWdpbmdcIixcInVpLmJvb3RzdHJhcC5wYWdlclwiLFwidWkuYm9vdHN0cmFwLnBhZ2luYXRpb25cIixcInVpLmJvb3RzdHJhcC50b29sdGlwXCIsXCJ1aS5ib290c3RyYXAucG9wb3ZlclwiLFwidWkuYm9vdHN0cmFwLnByb2dyZXNzYmFyXCIsXCJ1aS5ib290c3RyYXAucmF0aW5nXCIsXCJ1aS5ib290c3RyYXAudGFic1wiLFwidWkuYm9vdHN0cmFwLnRpbWVwaWNrZXJcIixcInVpLmJvb3RzdHJhcC50eXBlYWhlYWRcIl0pO1xuYW5ndWxhci5tb2R1bGUoXCJ1aS5ib290c3RyYXAudHBsc1wiLCBbXCJ1aWIvdGVtcGxhdGUvYWNjb3JkaW9uL2FjY29yZGlvbi1ncm91cC5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvYWNjb3JkaW9uL2FjY29yZGlvbi5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvYWxlcnQvYWxlcnQuaHRtbFwiLFwidWliL3RlbXBsYXRlL2Nhcm91c2VsL2Nhcm91c2VsLmh0bWxcIixcInVpYi90ZW1wbGF0ZS9jYXJvdXNlbC9zbGlkZS5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci9kYXRlcGlja2VyLmh0bWxcIixcInVpYi90ZW1wbGF0ZS9kYXRlcGlja2VyL2RheS5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci9tb250aC5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci95ZWFyLmh0bWxcIixcInVpYi90ZW1wbGF0ZS9kYXRlcGlja2VyUG9wdXAvcG9wdXAuaHRtbFwiLFwidWliL3RlbXBsYXRlL21vZGFsL3dpbmRvdy5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvcGFnZXIvcGFnZXIuaHRtbFwiLFwidWliL3RlbXBsYXRlL3BhZ2luYXRpb24vcGFnaW5hdGlvbi5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvdG9vbHRpcC90b29sdGlwLWh0bWwtcG9wdXAuaHRtbFwiLFwidWliL3RlbXBsYXRlL3Rvb2x0aXAvdG9vbHRpcC1wb3B1cC5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvdG9vbHRpcC90b29sdGlwLXRlbXBsYXRlLXBvcHVwLmh0bWxcIixcInVpYi90ZW1wbGF0ZS9wb3BvdmVyL3BvcG92ZXItaHRtbC5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvcG9wb3Zlci9wb3BvdmVyLXRlbXBsYXRlLmh0bWxcIixcInVpYi90ZW1wbGF0ZS9wb3BvdmVyL3BvcG92ZXIuaHRtbFwiLFwidWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL2Jhci5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvcHJvZ3Jlc3NiYXIvcHJvZ3Jlc3MuaHRtbFwiLFwidWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL3Byb2dyZXNzYmFyLmh0bWxcIixcInVpYi90ZW1wbGF0ZS9yYXRpbmcvcmF0aW5nLmh0bWxcIixcInVpYi90ZW1wbGF0ZS90YWJzL3RhYi5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvdGFicy90YWJzZXQuaHRtbFwiLFwidWliL3RlbXBsYXRlL3RpbWVwaWNrZXIvdGltZXBpY2tlci5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvdHlwZWFoZWFkL3R5cGVhaGVhZC1tYXRjaC5odG1sXCIsXCJ1aWIvdGVtcGxhdGUvdHlwZWFoZWFkL3R5cGVhaGVhZC1wb3B1cC5odG1sXCJdKTtcbmFuZ3VsYXIubW9kdWxlKCd1aS5ib290c3RyYXAuY29sbGFwc2UnLCBbXSlcblxuICAuZGlyZWN0aXZlKCd1aWJDb2xsYXBzZScsIFsnJGFuaW1hdGUnLCAnJHEnLCAnJHBhcnNlJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRhbmltYXRlLCAkcSwgJHBhcnNlLCAkaW5qZWN0b3IpIHtcbiAgICB2YXIgJGFuaW1hdGVDc3MgPSAkaW5qZWN0b3IuaGFzKCckYW5pbWF0ZUNzcycpID8gJGluamVjdG9yLmdldCgnJGFuaW1hdGVDc3MnKSA6IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIgZXhwYW5kaW5nRXhwciA9ICRwYXJzZShhdHRycy5leHBhbmRpbmcpLFxuICAgICAgICAgIGV4cGFuZGVkRXhwciA9ICRwYXJzZShhdHRycy5leHBhbmRlZCksXG4gICAgICAgICAgY29sbGFwc2luZ0V4cHIgPSAkcGFyc2UoYXR0cnMuY29sbGFwc2luZyksXG4gICAgICAgICAgY29sbGFwc2VkRXhwciA9ICRwYXJzZShhdHRycy5jb2xsYXBzZWQpLFxuICAgICAgICAgIGhvcml6b250YWwgPSBmYWxzZSxcbiAgICAgICAgICBjc3MgPSB7fSxcbiAgICAgICAgICBjc3NUbyA9IHt9O1xuXG4gICAgICAgIGluaXQoKTtcblxuICAgICAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAgIGhvcml6b250YWwgPSAhISgnaG9yaXpvbnRhbCcgaW4gYXR0cnMpO1xuICAgICAgICAgIGlmIChob3Jpem9udGFsKSB7XG4gICAgICAgICAgICBjc3MgPSB7XG4gICAgICAgICAgICAgIHdpZHRoOiAnJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNzc1RvID0ge3dpZHRoOiAnMCd9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MgPSB7XG4gICAgICAgICAgICAgIGhlaWdodDogJydcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjc3NUbyA9IHtoZWlnaHQ6ICcwJ307XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghc2NvcGUuJGV2YWwoYXR0cnMudWliQ29sbGFwc2UpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdpbicpXG4gICAgICAgICAgICAgIC5hZGRDbGFzcygnY29sbGFwc2UnKVxuICAgICAgICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG4gICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsIGZhbHNlKVxuICAgICAgICAgICAgICAuY3NzKGNzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0U2Nyb2xsRnJvbUVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICAgIGlmIChob3Jpem9udGFsKSB7XG4gICAgICAgICAgICByZXR1cm4ge3dpZHRoOiBlbGVtZW50LnNjcm9sbFdpZHRoICsgJ3B4J307XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7aGVpZ2h0OiBlbGVtZW50LnNjcm9sbEhlaWdodCArICdweCd9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXhwYW5kKCkge1xuICAgICAgICAgIGlmIChlbGVtZW50Lmhhc0NsYXNzKCdjb2xsYXBzZScpICYmIGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAkcS5yZXNvbHZlKGV4cGFuZGluZ0V4cHIoc2NvcGUpKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlJylcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgaWYgKCRhbmltYXRlQ3NzKSB7XG4gICAgICAgICAgICAgICAgJGFuaW1hdGVDc3MoZWxlbWVudCwge1xuICAgICAgICAgICAgICAgICAgYWRkQ2xhc3M6ICdpbicsXG4gICAgICAgICAgICAgICAgICBlYXNpbmc6ICdlYXNlJyxcbiAgICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB0bzogZ2V0U2Nyb2xsRnJvbUVsZW1lbnQoZWxlbWVudFswXSlcbiAgICAgICAgICAgICAgICB9KS5zdGFydCgpWydmaW5hbGx5J10oZXhwYW5kRG9uZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJGFuaW1hdGUuYWRkQ2xhc3MoZWxlbWVudCwgJ2luJywge1xuICAgICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHRvOiBnZXRTY3JvbGxGcm9tRWxlbWVudChlbGVtZW50WzBdKVxuICAgICAgICAgICAgICAgIH0pLnRoZW4oZXhwYW5kRG9uZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGFuZ3VsYXIubm9vcCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBleHBhbmREb25lKCkge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZScpXG4gICAgICAgICAgICAuY3NzKGNzcyk7XG4gICAgICAgICAgZXhwYW5kZWRFeHByKHNjb3BlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbGxhcHNlKCkge1xuICAgICAgICAgIGlmICghZWxlbWVudC5oYXNDbGFzcygnY29sbGFwc2UnKSAmJiAhZWxlbWVudC5oYXNDbGFzcygnaW4nKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxhcHNlRG9uZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgICRxLnJlc29sdmUoY29sbGFwc2luZ0V4cHIoc2NvcGUpKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAgICAgLy8gSU1QT1JUQU5UOiBUaGUgd2lkdGggbXVzdCBiZSBzZXQgYmVmb3JlIGFkZGluZyBcImNvbGxhcHNpbmdcIiBjbGFzcy5cbiAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCB0aGUgYnJvd3NlciBhdHRlbXB0cyB0byBhbmltYXRlIGZyb20gd2lkdGggMCAoaW5cbiAgICAgICAgICAgICAgLy8gY29sbGFwc2luZyBjbGFzcykgdG8gdGhlIGdpdmVuIHdpZHRoIGhlcmUuXG4gICAgICAgICAgICAgICAgLmNzcyhnZXRTY3JvbGxGcm9tRWxlbWVudChlbGVtZW50WzBdKSlcbiAgICAgICAgICAgICAgICAvLyBpbml0aWFsbHkgYWxsIHBhbmVsIGNvbGxhcHNlIGhhdmUgdGhlIGNvbGxhcHNlIGNsYXNzLCB0aGlzIHJlbW92YWxcbiAgICAgICAgICAgICAgICAvLyBwcmV2ZW50cyB0aGUgYW5pbWF0aW9uIGZyb20ganVtcGluZyB0byBjb2xsYXBzZWQgc3RhdGVcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlJylcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgaWYgKCRhbmltYXRlQ3NzKSB7XG4gICAgICAgICAgICAgICAgJGFuaW1hdGVDc3MoZWxlbWVudCwge1xuICAgICAgICAgICAgICAgICAgcmVtb3ZlQ2xhc3M6ICdpbicsXG4gICAgICAgICAgICAgICAgICB0bzogY3NzVG9cbiAgICAgICAgICAgICAgICB9KS5zdGFydCgpWydmaW5hbGx5J10oY29sbGFwc2VEb25lKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkYW5pbWF0ZS5yZW1vdmVDbGFzcyhlbGVtZW50LCAnaW4nLCB7XG4gICAgICAgICAgICAgICAgICB0bzogY3NzVG9cbiAgICAgICAgICAgICAgICB9KS50aGVuKGNvbGxhcHNlRG9uZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGFuZ3VsYXIubm9vcCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb2xsYXBzZURvbmUoKSB7XG4gICAgICAgICAgZWxlbWVudC5jc3MoY3NzVG8pOyAvLyBSZXF1aXJlZCBzbyB0aGF0IGNvbGxhcHNlIHdvcmtzIHdoZW4gYW5pbWF0aW9uIGlzIGRpc2FibGVkXG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlJyk7XG4gICAgICAgICAgY29sbGFwc2VkRXhwcihzY29wZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS4kd2F0Y2goYXR0cnMudWliQ29sbGFwc2UsIGZ1bmN0aW9uKHNob3VsZENvbGxhcHNlKSB7XG4gICAgICAgICAgaWYgKHNob3VsZENvbGxhcHNlKSB7XG4gICAgICAgICAgICBjb2xsYXBzZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBhbmQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1dKTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC50YWJpbmRleCcsIFtdKVxuXG4uZGlyZWN0aXZlKCd1aWJUYWJpbmRleFRvZ2dsZScsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHJzKSB7XG4gICAgICBhdHRycy4kb2JzZXJ2ZSgnZGlzYWJsZWQnLCBmdW5jdGlvbihkaXNhYmxlZCkge1xuICAgICAgICBhdHRycy4kc2V0KCd0YWJpbmRleCcsIGRpc2FibGVkID8gLTEgOiBudWxsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLmFjY29yZGlvbicsIFsndWkuYm9vdHN0cmFwLmNvbGxhcHNlJywgJ3VpLmJvb3RzdHJhcC50YWJpbmRleCddKVxuXG4uY29uc3RhbnQoJ3VpYkFjY29yZGlvbkNvbmZpZycsIHtcbiAgY2xvc2VPdGhlcnM6IHRydWVcbn0pXG5cbi5jb250cm9sbGVyKCdVaWJBY2NvcmRpb25Db250cm9sbGVyJywgWyckc2NvcGUnLCAnJGF0dHJzJywgJ3VpYkFjY29yZGlvbkNvbmZpZycsIGZ1bmN0aW9uKCRzY29wZSwgJGF0dHJzLCBhY2NvcmRpb25Db25maWcpIHtcbiAgLy8gVGhpcyBhcnJheSBrZWVwcyB0cmFjayBvZiB0aGUgYWNjb3JkaW9uIGdyb3Vwc1xuICB0aGlzLmdyb3VwcyA9IFtdO1xuXG4gIC8vIEVuc3VyZSB0aGF0IGFsbCB0aGUgZ3JvdXBzIGluIHRoaXMgYWNjb3JkaW9uIGFyZSBjbG9zZWQsIHVubGVzcyBjbG9zZS1vdGhlcnMgZXhwbGljaXRseSBzYXlzIG5vdCB0b1xuICB0aGlzLmNsb3NlT3RoZXJzID0gZnVuY3Rpb24ob3Blbkdyb3VwKSB7XG4gICAgdmFyIGNsb3NlT3RoZXJzID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmNsb3NlT3RoZXJzKSA/XG4gICAgICAkc2NvcGUuJGV2YWwoJGF0dHJzLmNsb3NlT3RoZXJzKSA6IGFjY29yZGlvbkNvbmZpZy5jbG9zZU90aGVycztcbiAgICBpZiAoY2xvc2VPdGhlcnMpIHtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaCh0aGlzLmdyb3VwcywgZnVuY3Rpb24oZ3JvdXApIHtcbiAgICAgICAgaWYgKGdyb3VwICE9PSBvcGVuR3JvdXApIHtcbiAgICAgICAgICBncm91cC5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFRoaXMgaXMgY2FsbGVkIGZyb20gdGhlIGFjY29yZGlvbi1ncm91cCBkaXJlY3RpdmUgdG8gYWRkIGl0c2VsZiB0byB0aGUgYWNjb3JkaW9uXG4gIHRoaXMuYWRkR3JvdXAgPSBmdW5jdGlvbihncm91cFNjb3BlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoaXMuZ3JvdXBzLnB1c2goZ3JvdXBTY29wZSk7XG5cbiAgICBncm91cFNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgdGhhdC5yZW1vdmVHcm91cChncm91cFNjb3BlKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUaGlzIGlzIGNhbGxlZCBmcm9tIHRoZSBhY2NvcmRpb24tZ3JvdXAgZGlyZWN0aXZlIHdoZW4gdG8gcmVtb3ZlIGl0c2VsZlxuICB0aGlzLnJlbW92ZUdyb3VwID0gZnVuY3Rpb24oZ3JvdXApIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmdyb3Vwcy5pbmRleE9mKGdyb3VwKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmdyb3Vwcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfTtcbn1dKVxuXG4vLyBUaGUgYWNjb3JkaW9uIGRpcmVjdGl2ZSBzaW1wbHkgc2V0cyB1cCB0aGUgZGlyZWN0aXZlIGNvbnRyb2xsZXJcbi8vIGFuZCBhZGRzIGFuIGFjY29yZGlvbiBDU1MgY2xhc3MgdG8gaXRzZWxmIGVsZW1lbnQuXG4uZGlyZWN0aXZlKCd1aWJBY2NvcmRpb24nLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBjb250cm9sbGVyOiAnVWliQWNjb3JkaW9uQ29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAnYWNjb3JkaW9uJyxcbiAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgIHRlbXBsYXRlVXJsOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xuICAgICAgcmV0dXJuIGF0dHJzLnRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvYWNjb3JkaW9uL2FjY29yZGlvbi5odG1sJztcbiAgICB9XG4gIH07XG59KVxuXG4vLyBUaGUgYWNjb3JkaW9uLWdyb3VwIGRpcmVjdGl2ZSBpbmRpY2F0ZXMgYSBibG9jayBvZiBodG1sIHRoYXQgd2lsbCBleHBhbmQgYW5kIGNvbGxhcHNlIGluIGFuIGFjY29yZGlvblxuLmRpcmVjdGl2ZSgndWliQWNjb3JkaW9uR3JvdXAnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiAnXnVpYkFjY29yZGlvbicsICAgICAgICAgLy8gV2UgbmVlZCB0aGlzIGRpcmVjdGl2ZSB0byBiZSBpbnNpZGUgYW4gYWNjb3JkaW9uXG4gICAgdHJhbnNjbHVkZTogdHJ1ZSwgICAgICAgICAgICAgIC8vIEl0IHRyYW5zY2x1ZGVzIHRoZSBjb250ZW50cyBvZiB0aGUgZGlyZWN0aXZlIGludG8gdGhlIHRlbXBsYXRlXG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCAndWliL3RlbXBsYXRlL2FjY29yZGlvbi9hY2NvcmRpb24tZ3JvdXAuaHRtbCc7XG4gICAgfSxcbiAgICBzY29wZToge1xuICAgICAgaGVhZGluZzogJ0AnLCAgICAgICAgICAgICAgIC8vIEludGVycG9sYXRlIHRoZSBoZWFkaW5nIGF0dHJpYnV0ZSBvbnRvIHRoaXMgc2NvcGVcbiAgICAgIHBhbmVsQ2xhc3M6ICdAPycsICAgICAgICAgICAvLyBEaXR0byB3aXRoIHBhbmVsQ2xhc3NcbiAgICAgIGlzT3BlbjogJz0/JyxcbiAgICAgIGlzRGlzYWJsZWQ6ICc9PydcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zZXRIZWFkaW5nID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB0aGlzLmhlYWRpbmcgPSBlbGVtZW50O1xuICAgICAgfTtcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgYWNjb3JkaW9uQ3RybCkge1xuICAgICAgZWxlbWVudC5hZGRDbGFzcygncGFuZWwnKTtcbiAgICAgIGFjY29yZGlvbkN0cmwuYWRkR3JvdXAoc2NvcGUpO1xuXG4gICAgICBzY29wZS5vcGVuQ2xhc3MgPSBhdHRycy5vcGVuQ2xhc3MgfHwgJ3BhbmVsLW9wZW4nO1xuICAgICAgc2NvcGUucGFuZWxDbGFzcyA9IGF0dHJzLnBhbmVsQ2xhc3MgfHwgJ3BhbmVsLWRlZmF1bHQnO1xuICAgICAgc2NvcGUuJHdhdGNoKCdpc09wZW4nLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBlbGVtZW50LnRvZ2dsZUNsYXNzKHNjb3BlLm9wZW5DbGFzcywgISF2YWx1ZSk7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIGFjY29yZGlvbkN0cmwuY2xvc2VPdGhlcnMoc2NvcGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUudG9nZ2xlT3BlbiA9IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICBpZiAoIXNjb3BlLmlzRGlzYWJsZWQpIHtcbiAgICAgICAgICBpZiAoISRldmVudCB8fCAkZXZlbnQud2hpY2ggPT09IDMyKSB7XG4gICAgICAgICAgICBzY29wZS5pc09wZW4gPSAhc2NvcGUuaXNPcGVuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGlkID0gJ2FjY29yZGlvbmdyb3VwLScgKyBzY29wZS4kaWQgKyAnLScgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMCk7XG4gICAgICBzY29wZS5oZWFkaW5nSWQgPSBpZCArICctdGFiJztcbiAgICAgIHNjb3BlLnBhbmVsSWQgPSBpZCArICctcGFuZWwnO1xuICAgIH1cbiAgfTtcbn0pXG5cbi8vIFVzZSBhY2NvcmRpb24taGVhZGluZyBiZWxvdyBhbiBhY2NvcmRpb24tZ3JvdXAgdG8gcHJvdmlkZSBhIGhlYWRpbmcgY29udGFpbmluZyBIVE1MXG4uZGlyZWN0aXZlKCd1aWJBY2NvcmRpb25IZWFkaW5nJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgdHJhbnNjbHVkZTogdHJ1ZSwgICAvLyBHcmFiIHRoZSBjb250ZW50cyB0byBiZSB1c2VkIGFzIHRoZSBoZWFkaW5nXG4gICAgdGVtcGxhdGU6ICcnLCAgICAgICAvLyBJbiBlZmZlY3QgcmVtb3ZlIHRoaXMgZWxlbWVudCFcbiAgICByZXBsYWNlOiB0cnVlLFxuICAgIHJlcXVpcmU6ICdedWliQWNjb3JkaW9uR3JvdXAnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgYWNjb3JkaW9uR3JvdXBDdHJsLCB0cmFuc2NsdWRlKSB7XG4gICAgICAvLyBQYXNzIHRoZSBoZWFkaW5nIHRvIHRoZSBhY2NvcmRpb24tZ3JvdXAgY29udHJvbGxlclxuICAgICAgLy8gc28gdGhhdCBpdCBjYW4gYmUgdHJhbnNjbHVkZWQgaW50byB0aGUgcmlnaHQgcGxhY2UgaW4gdGhlIHRlbXBsYXRlXG4gICAgICAvLyBbVGhlIHNlY29uZCBwYXJhbWV0ZXIgdG8gdHJhbnNjbHVkZSBjYXVzZXMgdGhlIGVsZW1lbnRzIHRvIGJlIGNsb25lZCBzbyB0aGF0IHRoZXkgd29yayBpbiBuZy1yZXBlYXRdXG4gICAgICBhY2NvcmRpb25Hcm91cEN0cmwuc2V0SGVhZGluZyh0cmFuc2NsdWRlKHNjb3BlLCBhbmd1bGFyLm5vb3ApKTtcbiAgICB9XG4gIH07XG59KVxuXG4vLyBVc2UgaW4gdGhlIGFjY29yZGlvbi1ncm91cCB0ZW1wbGF0ZSB0byBpbmRpY2F0ZSB3aGVyZSB5b3Ugd2FudCB0aGUgaGVhZGluZyB0byBiZSB0cmFuc2NsdWRlZFxuLy8gWW91IG11c3QgcHJvdmlkZSB0aGUgcHJvcGVydHkgb24gdGhlIGFjY29yZGlvbi1ncm91cCBjb250cm9sbGVyIHRoYXQgd2lsbCBob2xkIHRoZSB0cmFuc2NsdWRlZCBlbGVtZW50XG4uZGlyZWN0aXZlKCd1aWJBY2NvcmRpb25UcmFuc2NsdWRlJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVxdWlyZTogJ151aWJBY2NvcmRpb25Hcm91cCcsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICBzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBjb250cm9sbGVyW2F0dHJzLnVpYkFjY29yZGlvblRyYW5zY2x1ZGVdOyB9LCBmdW5jdGlvbihoZWFkaW5nKSB7XG4gICAgICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICAgICAgdmFyIGVsZW0gPSBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKGdldEhlYWRlclNlbGVjdG9ycygpKSk7XG4gICAgICAgICAgZWxlbS5odG1sKCcnKTtcbiAgICAgICAgICBlbGVtLmFwcGVuZChoZWFkaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGdldEhlYWRlclNlbGVjdG9ycygpIHtcbiAgICAgIHJldHVybiAndWliLWFjY29yZGlvbi1oZWFkZXIsJyArXG4gICAgICAgICAgJ2RhdGEtdWliLWFjY29yZGlvbi1oZWFkZXIsJyArXG4gICAgICAgICAgJ3gtdWliLWFjY29yZGlvbi1oZWFkZXIsJyArXG4gICAgICAgICAgJ3VpYlxcXFw6YWNjb3JkaW9uLWhlYWRlciwnICtcbiAgICAgICAgICAnW3VpYi1hY2NvcmRpb24taGVhZGVyXSwnICtcbiAgICAgICAgICAnW2RhdGEtdWliLWFjY29yZGlvbi1oZWFkZXJdLCcgK1xuICAgICAgICAgICdbeC11aWItYWNjb3JkaW9uLWhlYWRlcl0nO1xuICB9XG59KTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5hbGVydCcsIFtdKVxuXG4uY29udHJvbGxlcignVWliQWxlcnRDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJGF0dHJzJywgJyRpbnRlcnBvbGF0ZScsICckdGltZW91dCcsIGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGludGVycG9sYXRlLCAkdGltZW91dCkge1xuICAkc2NvcGUuY2xvc2VhYmxlID0gISEkYXR0cnMuY2xvc2U7XG4gICRlbGVtZW50LmFkZENsYXNzKCdhbGVydCcpO1xuICAkYXR0cnMuJHNldCgncm9sZScsICdhbGVydCcpO1xuICBpZiAoJHNjb3BlLmNsb3NlYWJsZSkge1xuICAgICRlbGVtZW50LmFkZENsYXNzKCdhbGVydC1kaXNtaXNzaWJsZScpO1xuICB9XG5cbiAgdmFyIGRpc21pc3NPblRpbWVvdXQgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuZGlzbWlzc09uVGltZW91dCkgP1xuICAgICRpbnRlcnBvbGF0ZSgkYXR0cnMuZGlzbWlzc09uVGltZW91dCkoJHNjb3BlLiRwYXJlbnQpIDogbnVsbDtcblxuICBpZiAoZGlzbWlzc09uVGltZW91dCkge1xuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgJHNjb3BlLmNsb3NlKCk7XG4gICAgfSwgcGFyc2VJbnQoZGlzbWlzc09uVGltZW91dCwgMTApKTtcbiAgfVxufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYkFsZXJ0JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgY29udHJvbGxlcjogJ1VpYkFsZXJ0Q29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAnYWxlcnQnLFxuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICByZXR1cm4gYXR0cnMudGVtcGxhdGVVcmwgfHwgJ3VpYi90ZW1wbGF0ZS9hbGVydC9hbGVydC5odG1sJztcbiAgICB9LFxuICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgc2NvcGU6IHtcbiAgICAgIGNsb3NlOiAnJidcbiAgICB9XG4gIH07XG59KTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5idXR0b25zJywgW10pXG5cbi5jb25zdGFudCgndWliQnV0dG9uQ29uZmlnJywge1xuICBhY3RpdmVDbGFzczogJ2FjdGl2ZScsXG4gIHRvZ2dsZUV2ZW50OiAnY2xpY2snXG59KVxuXG4uY29udHJvbGxlcignVWliQnV0dG9uc0NvbnRyb2xsZXInLCBbJ3VpYkJ1dHRvbkNvbmZpZycsIGZ1bmN0aW9uKGJ1dHRvbkNvbmZpZykge1xuICB0aGlzLmFjdGl2ZUNsYXNzID0gYnV0dG9uQ29uZmlnLmFjdGl2ZUNsYXNzIHx8ICdhY3RpdmUnO1xuICB0aGlzLnRvZ2dsZUV2ZW50ID0gYnV0dG9uQ29uZmlnLnRvZ2dsZUV2ZW50IHx8ICdjbGljayc7XG59XSlcblxuLmRpcmVjdGl2ZSgndWliQnRuUmFkaW8nLCBbJyRwYXJzZScsIGZ1bmN0aW9uKCRwYXJzZSkge1xuICByZXR1cm4ge1xuICAgIHJlcXVpcmU6IFsndWliQnRuUmFkaW8nLCAnbmdNb2RlbCddLFxuICAgIGNvbnRyb2xsZXI6ICdVaWJCdXR0b25zQ29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAnYnV0dG9ucycsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgdmFyIGJ1dHRvbnNDdHJsID0gY3RybHNbMF0sIG5nTW9kZWxDdHJsID0gY3RybHNbMV07XG4gICAgICB2YXIgdW5jaGVja2FibGVFeHByID0gJHBhcnNlKGF0dHJzLnVpYlVuY2hlY2thYmxlKTtcblxuICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpLmNzcyh7ZGlzcGxheTogJ25vbmUnfSk7XG5cbiAgICAgIC8vbW9kZWwgLT4gVUlcbiAgICAgIG5nTW9kZWxDdHJsLiRyZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZWxlbWVudC50b2dnbGVDbGFzcyhidXR0b25zQ3RybC5hY3RpdmVDbGFzcywgYW5ndWxhci5lcXVhbHMobmdNb2RlbEN0cmwuJG1vZGVsVmFsdWUsIHNjb3BlLiRldmFsKGF0dHJzLnVpYkJ0blJhZGlvKSkpO1xuICAgICAgfTtcblxuICAgICAgLy91aS0+bW9kZWxcbiAgICAgIGVsZW1lbnQub24oYnV0dG9uc0N0cmwudG9nZ2xlRXZlbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoYXR0cnMuZGlzYWJsZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaXNBY3RpdmUgPSBlbGVtZW50Lmhhc0NsYXNzKGJ1dHRvbnNDdHJsLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgICBpZiAoIWlzQWN0aXZlIHx8IGFuZ3VsYXIuaXNEZWZpbmVkKGF0dHJzLnVuY2hlY2thYmxlKSkge1xuICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIG5nTW9kZWxDdHJsLiRzZXRWaWV3VmFsdWUoaXNBY3RpdmUgPyBudWxsIDogc2NvcGUuJGV2YWwoYXR0cnMudWliQnRuUmFkaW8pKTtcbiAgICAgICAgICAgIG5nTW9kZWxDdHJsLiRyZW5kZXIoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChhdHRycy51aWJVbmNoZWNrYWJsZSkge1xuICAgICAgICBzY29wZS4kd2F0Y2godW5jaGVja2FibGVFeHByLCBmdW5jdGlvbih1bmNoZWNrYWJsZSkge1xuICAgICAgICAgIGF0dHJzLiRzZXQoJ3VuY2hlY2thYmxlJywgdW5jaGVja2FibGUgPyAnJyA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1dKVxuXG4uZGlyZWN0aXZlKCd1aWJCdG5DaGVja2JveCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlcXVpcmU6IFsndWliQnRuQ2hlY2tib3gnLCAnbmdNb2RlbCddLFxuICAgIGNvbnRyb2xsZXI6ICdVaWJCdXR0b25zQ29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAnYnV0dG9uJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGN0cmxzKSB7XG4gICAgICB2YXIgYnV0dG9uc0N0cmwgPSBjdHJsc1swXSwgbmdNb2RlbEN0cmwgPSBjdHJsc1sxXTtcblxuICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpLmNzcyh7ZGlzcGxheTogJ25vbmUnfSk7XG5cbiAgICAgIGZ1bmN0aW9uIGdldFRydWVWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldENoZWNrYm94VmFsdWUoYXR0cnMuYnRuQ2hlY2tib3hUcnVlLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0RmFsc2VWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIGdldENoZWNrYm94VmFsdWUoYXR0cnMuYnRuQ2hlY2tib3hGYWxzZSwgZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRDaGVja2JveFZhbHVlKGF0dHJpYnV0ZSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIHJldHVybiBhbmd1bGFyLmlzRGVmaW5lZChhdHRyaWJ1dGUpID8gc2NvcGUuJGV2YWwoYXR0cmlidXRlKSA6IGRlZmF1bHRWYWx1ZTtcbiAgICAgIH1cblxuICAgICAgLy9tb2RlbCAtPiBVSVxuICAgICAgbmdNb2RlbEN0cmwuJHJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBlbGVtZW50LnRvZ2dsZUNsYXNzKGJ1dHRvbnNDdHJsLmFjdGl2ZUNsYXNzLCBhbmd1bGFyLmVxdWFscyhuZ01vZGVsQ3RybC4kbW9kZWxWYWx1ZSwgZ2V0VHJ1ZVZhbHVlKCkpKTtcbiAgICAgIH07XG5cbiAgICAgIC8vdWktPm1vZGVsXG4gICAgICBlbGVtZW50Lm9uKGJ1dHRvbnNDdHJsLnRvZ2dsZUV2ZW50LCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGF0dHJzLmRpc2FibGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5nTW9kZWxDdHJsLiRzZXRWaWV3VmFsdWUoZWxlbWVudC5oYXNDbGFzcyhidXR0b25zQ3RybC5hY3RpdmVDbGFzcykgPyBnZXRGYWxzZVZhbHVlKCkgOiBnZXRUcnVlVmFsdWUoKSk7XG4gICAgICAgICAgbmdNb2RlbEN0cmwuJHJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLmNhcm91c2VsJywgW10pXG5cbi5jb250cm9sbGVyKCdVaWJDYXJvdXNlbENvbnRyb2xsZXInLCBbJyRzY29wZScsICckZWxlbWVudCcsICckaW50ZXJ2YWwnLCAnJHRpbWVvdXQnLCAnJGFuaW1hdGUnLCBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCAkaW50ZXJ2YWwsICR0aW1lb3V0LCAkYW5pbWF0ZSkge1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgc2xpZGVzID0gc2VsZi5zbGlkZXMgPSAkc2NvcGUuc2xpZGVzID0gW10sXG4gICAgU0xJREVfRElSRUNUSU9OID0gJ3VpYi1zbGlkZURpcmVjdGlvbicsXG4gICAgY3VycmVudEluZGV4ID0gJHNjb3BlLmFjdGl2ZSxcbiAgICBjdXJyZW50SW50ZXJ2YWwsIGlzUGxheWluZztcblxuICB2YXIgZGVzdHJveWVkID0gZmFsc2U7XG4gICRlbGVtZW50LmFkZENsYXNzKCdjYXJvdXNlbCcpO1xuXG4gIHNlbGYuYWRkU2xpZGUgPSBmdW5jdGlvbihzbGlkZSwgZWxlbWVudCkge1xuICAgIHNsaWRlcy5wdXNoKHtcbiAgICAgIHNsaWRlOiBzbGlkZSxcbiAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgICB9KTtcbiAgICBzbGlkZXMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICByZXR1cm4gK2Euc2xpZGUuaW5kZXggLSArYi5zbGlkZS5pbmRleDtcbiAgICB9KTtcbiAgICAvL2lmIHRoaXMgaXMgdGhlIGZpcnN0IHNsaWRlIG9yIHRoZSBzbGlkZSBpcyBzZXQgdG8gYWN0aXZlLCBzZWxlY3QgaXRcbiAgICBpZiAoc2xpZGUuaW5kZXggPT09ICRzY29wZS5hY3RpdmUgfHwgc2xpZGVzLmxlbmd0aCA9PT0gMSAmJiAhYW5ndWxhci5pc051bWJlcigkc2NvcGUuYWN0aXZlKSkge1xuICAgICAgaWYgKCRzY29wZS4kY3VycmVudFRyYW5zaXRpb24pIHtcbiAgICAgICAgJHNjb3BlLiRjdXJyZW50VHJhbnNpdGlvbiA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlLmluZGV4O1xuICAgICAgJHNjb3BlLmFjdGl2ZSA9IHNsaWRlLmluZGV4O1xuICAgICAgc2V0QWN0aXZlKGN1cnJlbnRJbmRleCk7XG4gICAgICBzZWxmLnNlbGVjdChzbGlkZXNbZmluZFNsaWRlSW5kZXgoc2xpZGUpXSk7XG4gICAgICBpZiAoc2xpZGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAkc2NvcGUucGxheSgpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBzZWxmLmdldEN1cnJlbnRJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoc2xpZGVzW2ldLnNsaWRlLmluZGV4ID09PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHNlbGYubmV4dCA9ICRzY29wZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld0luZGV4ID0gKHNlbGYuZ2V0Q3VycmVudEluZGV4KCkgKyAxKSAlIHNsaWRlcy5sZW5ndGg7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IDAgJiYgJHNjb3BlLm5vV3JhcCgpKSB7XG4gICAgICAkc2NvcGUucGF1c2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZi5zZWxlY3Qoc2xpZGVzW25ld0luZGV4XSwgJ25leHQnKTtcbiAgfTtcblxuICBzZWxmLnByZXYgPSAkc2NvcGUucHJldiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdJbmRleCA9IHNlbGYuZ2V0Q3VycmVudEluZGV4KCkgLSAxIDwgMCA/IHNsaWRlcy5sZW5ndGggLSAxIDogc2VsZi5nZXRDdXJyZW50SW5kZXgoKSAtIDE7XG5cbiAgICBpZiAoJHNjb3BlLm5vV3JhcCgpICYmIG5ld0luZGV4ID09PSBzbGlkZXMubGVuZ3RoIC0gMSkge1xuICAgICAgJHNjb3BlLnBhdXNlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGYuc2VsZWN0KHNsaWRlc1tuZXdJbmRleF0sICdwcmV2Jyk7XG4gIH07XG5cbiAgc2VsZi5yZW1vdmVTbGlkZSA9IGZ1bmN0aW9uKHNsaWRlKSB7XG4gICAgdmFyIGluZGV4ID0gZmluZFNsaWRlSW5kZXgoc2xpZGUpO1xuXG4gICAgLy9nZXQgdGhlIGluZGV4IG9mIHRoZSBzbGlkZSBpbnNpZGUgdGhlIGNhcm91c2VsXG4gICAgc2xpZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgaWYgKHNsaWRlcy5sZW5ndGggPiAwICYmIGN1cnJlbnRJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgIGlmIChpbmRleCA+PSBzbGlkZXMubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlcy5sZW5ndGggLSAxO1xuICAgICAgICAkc2NvcGUuYWN0aXZlID0gY3VycmVudEluZGV4O1xuICAgICAgICBzZXRBY3RpdmUoY3VycmVudEluZGV4KTtcbiAgICAgICAgc2VsZi5zZWxlY3Qoc2xpZGVzW3NsaWRlcy5sZW5ndGggLSAxXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IGN1cnJlbnRJbmRleDtcbiAgICAgICAgc2V0QWN0aXZlKGN1cnJlbnRJbmRleCk7XG4gICAgICAgIHNlbGYuc2VsZWN0KHNsaWRlc1tpbmRleF0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID4gaW5kZXgpIHtcbiAgICAgIGN1cnJlbnRJbmRleC0tO1xuICAgICAgJHNjb3BlLmFjdGl2ZSA9IGN1cnJlbnRJbmRleDtcbiAgICB9XG5cbiAgICAvL2NsZWFuIHRoZSBhY3RpdmUgdmFsdWUgd2hlbiBubyBtb3JlIHNsaWRlXG4gICAgaWYgKHNsaWRlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGN1cnJlbnRJbmRleCA9IG51bGw7XG4gICAgICAkc2NvcGUuYWN0aXZlID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgLyogZGlyZWN0aW9uOiBcInByZXZcIiBvciBcIm5leHRcIiAqL1xuICBzZWxmLnNlbGVjdCA9ICRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbihuZXh0U2xpZGUsIGRpcmVjdGlvbikge1xuICAgIHZhciBuZXh0SW5kZXggPSBmaW5kU2xpZGVJbmRleChuZXh0U2xpZGUuc2xpZGUpO1xuICAgIC8vRGVjaWRlIGRpcmVjdGlvbiBpZiBpdCdzIG5vdCBnaXZlblxuICAgIGlmIChkaXJlY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgZGlyZWN0aW9uID0gbmV4dEluZGV4ID4gc2VsZi5nZXRDdXJyZW50SW5kZXgoKSA/ICduZXh0JyA6ICdwcmV2JztcbiAgICB9XG4gICAgLy9QcmV2ZW50IHRoaXMgdXNlci10cmlnZ2VyZWQgdHJhbnNpdGlvbiBmcm9tIG9jY3VycmluZyBpZiB0aGVyZSBpcyBhbHJlYWR5IG9uZSBpbiBwcm9ncmVzc1xuICAgIGlmIChuZXh0U2xpZGUuc2xpZGUuaW5kZXggIT09IGN1cnJlbnRJbmRleCAmJlxuICAgICAgISRzY29wZS4kY3VycmVudFRyYW5zaXRpb24pIHtcbiAgICAgIGdvTmV4dChuZXh0U2xpZGUuc2xpZGUsIG5leHRJbmRleCwgZGlyZWN0aW9uKTtcbiAgICB9XG4gIH07XG5cbiAgLyogQWxsb3cgb3V0c2lkZSBwZW9wbGUgdG8gY2FsbCBpbmRleE9mIG9uIHNsaWRlcyBhcnJheSAqL1xuICAkc2NvcGUuaW5kZXhPZlNsaWRlID0gZnVuY3Rpb24oc2xpZGUpIHtcbiAgICByZXR1cm4gK3NsaWRlLnNsaWRlLmluZGV4O1xuICB9O1xuXG4gICRzY29wZS5pc0FjdGl2ZSA9IGZ1bmN0aW9uKHNsaWRlKSB7XG4gICAgcmV0dXJuICRzY29wZS5hY3RpdmUgPT09IHNsaWRlLnNsaWRlLmluZGV4O1xuICB9O1xuXG4gICRzY29wZS5pc1ByZXZEaXNhYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuYWN0aXZlID09PSAwICYmICRzY29wZS5ub1dyYXAoKTtcbiAgfTtcblxuICAkc2NvcGUuaXNOZXh0RGlzYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHNjb3BlLmFjdGl2ZSA9PT0gc2xpZGVzLmxlbmd0aCAtIDEgJiYgJHNjb3BlLm5vV3JhcCgpO1xuICB9O1xuXG4gICRzY29wZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghJHNjb3BlLm5vUGF1c2UpIHtcbiAgICAgIGlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgcmVzZXRUaW1lcigpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUucGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghaXNQbGF5aW5nKSB7XG4gICAgICBpc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgcmVzdGFydFRpbWVyKCk7XG4gICAgfVxuICB9O1xuXG4gICRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgJHNjb3BlLnBhdXNlKTtcbiAgJGVsZW1lbnQub24oJ21vdXNlbGVhdmUnLCAkc2NvcGUucGxheSk7XG5cbiAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICAgIHJlc2V0VGltZXIoKTtcbiAgfSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgnbm9UcmFuc2l0aW9uJywgZnVuY3Rpb24obm9UcmFuc2l0aW9uKSB7XG4gICAgJGFuaW1hdGUuZW5hYmxlZCgkZWxlbWVudCwgIW5vVHJhbnNpdGlvbik7XG4gIH0pO1xuXG4gICRzY29wZS4kd2F0Y2goJ2ludGVydmFsJywgcmVzdGFydFRpbWVyKTtcblxuICAkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignc2xpZGVzJywgcmVzZXRUcmFuc2l0aW9uKTtcblxuICAkc2NvcGUuJHdhdGNoKCdhY3RpdmUnLCBmdW5jdGlvbihpbmRleCkge1xuICAgIGlmIChhbmd1bGFyLmlzTnVtYmVyKGluZGV4KSAmJiBjdXJyZW50SW5kZXggIT09IGluZGV4KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc2xpZGVzW2ldLnNsaWRlLmluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgc2xpZGUgPSBzbGlkZXNbaW5kZXhdO1xuICAgICAgaWYgKHNsaWRlKSB7XG4gICAgICAgIHNldEFjdGl2ZShpbmRleCk7XG4gICAgICAgIHNlbGYuc2VsZWN0KHNsaWRlc1tpbmRleF0pO1xuICAgICAgICBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGdldFNsaWRlQnlJbmRleChpbmRleCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gc2xpZGVzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgaWYgKHNsaWRlc1tpXS5pbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHNsaWRlc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRBY3RpdmUoaW5kZXgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgc2xpZGVzW2ldLnNsaWRlLmFjdGl2ZSA9IGkgPT09IGluZGV4O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdvTmV4dChzbGlkZSwgaW5kZXgsIGRpcmVjdGlvbikge1xuICAgIGlmIChkZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhbmd1bGFyLmV4dGVuZChzbGlkZSwge2RpcmVjdGlvbjogZGlyZWN0aW9ufSk7XG4gICAgYW5ndWxhci5leHRlbmQoc2xpZGVzW2N1cnJlbnRJbmRleF0uc2xpZGUgfHwge30sIHtkaXJlY3Rpb246IGRpcmVjdGlvbn0pO1xuICAgIGlmICgkYW5pbWF0ZS5lbmFibGVkKCRlbGVtZW50KSAmJiAhJHNjb3BlLiRjdXJyZW50VHJhbnNpdGlvbiAmJlxuICAgICAgc2xpZGVzW2luZGV4XS5lbGVtZW50ICYmIHNlbGYuc2xpZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHNsaWRlc1tpbmRleF0uZWxlbWVudC5kYXRhKFNMSURFX0RJUkVDVElPTiwgc2xpZGUuZGlyZWN0aW9uKTtcbiAgICAgIHZhciBjdXJyZW50SWR4ID0gc2VsZi5nZXRDdXJyZW50SW5kZXgoKTtcblxuICAgICAgaWYgKGFuZ3VsYXIuaXNOdW1iZXIoY3VycmVudElkeCkgJiYgc2xpZGVzW2N1cnJlbnRJZHhdLmVsZW1lbnQpIHtcbiAgICAgICAgc2xpZGVzW2N1cnJlbnRJZHhdLmVsZW1lbnQuZGF0YShTTElERV9ESVJFQ1RJT04sIHNsaWRlLmRpcmVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgICRzY29wZS4kY3VycmVudFRyYW5zaXRpb24gPSB0cnVlO1xuICAgICAgJGFuaW1hdGUub24oJ2FkZENsYXNzJywgc2xpZGVzW2luZGV4XS5lbGVtZW50LCBmdW5jdGlvbihlbGVtZW50LCBwaGFzZSkge1xuICAgICAgICBpZiAocGhhc2UgPT09ICdjbG9zZScpIHtcbiAgICAgICAgICAkc2NvcGUuJGN1cnJlbnRUcmFuc2l0aW9uID0gbnVsbDtcbiAgICAgICAgICAkYW5pbWF0ZS5vZmYoJ2FkZENsYXNzJywgZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS5hY3RpdmUgPSBzbGlkZS5pbmRleDtcbiAgICBjdXJyZW50SW5kZXggPSBzbGlkZS5pbmRleDtcbiAgICBzZXRBY3RpdmUoaW5kZXgpO1xuXG4gICAgLy9ldmVyeSB0aW1lIHlvdSBjaGFuZ2Ugc2xpZGVzLCByZXNldCB0aGUgdGltZXJcbiAgICByZXN0YXJ0VGltZXIoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRTbGlkZUluZGV4KHNsaWRlKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzbGlkZXNbaV0uc2xpZGUgPT09IHNsaWRlKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2V0VGltZXIoKSB7XG4gICAgaWYgKGN1cnJlbnRJbnRlcnZhbCkge1xuICAgICAgJGludGVydmFsLmNhbmNlbChjdXJyZW50SW50ZXJ2YWwpO1xuICAgICAgY3VycmVudEludGVydmFsID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXNldFRyYW5zaXRpb24oc2xpZGVzKSB7XG4gICAgaWYgKCFzbGlkZXMubGVuZ3RoKSB7XG4gICAgICAkc2NvcGUuJGN1cnJlbnRUcmFuc2l0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXN0YXJ0VGltZXIoKSB7XG4gICAgcmVzZXRUaW1lcigpO1xuICAgIHZhciBpbnRlcnZhbCA9ICskc2NvcGUuaW50ZXJ2YWw7XG4gICAgaWYgKCFpc05hTihpbnRlcnZhbCkgJiYgaW50ZXJ2YWwgPiAwKSB7XG4gICAgICBjdXJyZW50SW50ZXJ2YWwgPSAkaW50ZXJ2YWwodGltZXJGbiwgaW50ZXJ2YWwpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRm4oKSB7XG4gICAgdmFyIGludGVydmFsID0gKyRzY29wZS5pbnRlcnZhbDtcbiAgICBpZiAoaXNQbGF5aW5nICYmICFpc05hTihpbnRlcnZhbCkgJiYgaW50ZXJ2YWwgPiAwICYmIHNsaWRlcy5sZW5ndGgpIHtcbiAgICAgICRzY29wZS5uZXh0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICRzY29wZS5wYXVzZSgpO1xuICAgIH1cbiAgfVxufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYkNhcm91c2VsJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICBjb250cm9sbGVyOiAnVWliQ2Fyb3VzZWxDb250cm9sbGVyJyxcbiAgICBjb250cm9sbGVyQXM6ICdjYXJvdXNlbCcsXG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCAndWliL3RlbXBsYXRlL2Nhcm91c2VsL2Nhcm91c2VsLmh0bWwnO1xuICAgIH0sXG4gICAgc2NvcGU6IHtcbiAgICAgIGFjdGl2ZTogJz0nLFxuICAgICAgaW50ZXJ2YWw6ICc9JyxcbiAgICAgIG5vVHJhbnNpdGlvbjogJz0nLFxuICAgICAgbm9QYXVzZTogJz0nLFxuICAgICAgbm9XcmFwOiAnJidcbiAgICB9XG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJTbGlkZScsIFsnJGFuaW1hdGUnLCBmdW5jdGlvbigkYW5pbWF0ZSkge1xuICByZXR1cm4ge1xuICAgIHJlcXVpcmU6ICdedWliQ2Fyb3VzZWwnLFxuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCAndWliL3RlbXBsYXRlL2Nhcm91c2VsL3NsaWRlLmh0bWwnO1xuICAgIH0sXG4gICAgc2NvcGU6IHtcbiAgICAgIGFjdHVhbDogJz0/JyxcbiAgICAgIGluZGV4OiAnPT8nXG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjYXJvdXNlbEN0cmwpIHtcbiAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2l0ZW0nKTtcbiAgICAgIGNhcm91c2VsQ3RybC5hZGRTbGlkZShzY29wZSwgZWxlbWVudCk7XG4gICAgICAvL3doZW4gdGhlIHNjb3BlIGlzIGRlc3Ryb3llZCB0aGVuIHJlbW92ZSB0aGUgc2xpZGUgZnJvbSB0aGUgY3VycmVudCBzbGlkZXMgYXJyYXlcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2Fyb3VzZWxDdHJsLnJlbW92ZVNsaWRlKHNjb3BlKTtcbiAgICAgIH0pO1xuXG4gICAgICBzY29wZS4kd2F0Y2goJ2FjdGl2ZScsIGZ1bmN0aW9uKGFjdGl2ZSkge1xuICAgICAgICAkYW5pbWF0ZVthY3RpdmUgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oZWxlbWVudCwgJ2FjdGl2ZScpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufV0pXG5cbi5hbmltYXRpb24oJy5pdGVtJywgWyckYW5pbWF0ZUNzcycsXG5mdW5jdGlvbigkYW5pbWF0ZUNzcykge1xuICB2YXIgU0xJREVfRElSRUNUSU9OID0gJ3VpYi1zbGlkZURpcmVjdGlvbic7XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lLCBjYWxsYmFjaykge1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBiZWZvcmVBZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lLCBkb25lKSB7XG4gICAgICBpZiAoY2xhc3NOYW1lID09PSAnYWN0aXZlJykge1xuICAgICAgICB2YXIgc3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gZWxlbWVudC5kYXRhKFNMSURFX0RJUkVDVElPTik7XG4gICAgICAgIHZhciBkaXJlY3Rpb25DbGFzcyA9IGRpcmVjdGlvbiA9PT0gJ25leHQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgICAgdmFyIHJlbW92ZUNsYXNzRm4gPSByZW1vdmVDbGFzcy5iaW5kKHRoaXMsIGVsZW1lbnQsXG4gICAgICAgICAgZGlyZWN0aW9uQ2xhc3MgKyAnICcgKyBkaXJlY3Rpb24sIGRvbmUpO1xuICAgICAgICBlbGVtZW50LmFkZENsYXNzKGRpcmVjdGlvbik7XG5cbiAgICAgICAgJGFuaW1hdGVDc3MoZWxlbWVudCwge2FkZENsYXNzOiBkaXJlY3Rpb25DbGFzc30pXG4gICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAuZG9uZShyZW1vdmVDbGFzc0ZuKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc3RvcHBlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBkb25lKCk7XG4gICAgfSxcbiAgICBiZWZvcmVSZW1vdmVDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSwgZG9uZSkge1xuICAgICAgaWYgKGNsYXNzTmFtZSA9PT0gJ2FjdGl2ZScpIHtcbiAgICAgICAgdmFyIHN0b3BwZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGVsZW1lbnQuZGF0YShTTElERV9ESVJFQ1RJT04pO1xuICAgICAgICB2YXIgZGlyZWN0aW9uQ2xhc3MgPSBkaXJlY3Rpb24gPT09ICduZXh0JyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICAgIHZhciByZW1vdmVDbGFzc0ZuID0gcmVtb3ZlQ2xhc3MuYmluZCh0aGlzLCBlbGVtZW50LCBkaXJlY3Rpb25DbGFzcywgZG9uZSk7XG5cbiAgICAgICAgJGFuaW1hdGVDc3MoZWxlbWVudCwge2FkZENsYXNzOiBkaXJlY3Rpb25DbGFzc30pXG4gICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAuZG9uZShyZW1vdmVDbGFzc0ZuKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc3RvcHBlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBkb25lKCk7XG4gICAgfVxuICB9O1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLmRhdGVwYXJzZXInLCBbXSlcblxuLnNlcnZpY2UoJ3VpYkRhdGVQYXJzZXInLCBbJyRsb2cnLCAnJGxvY2FsZScsICdkYXRlRmlsdGVyJywgJ29yZGVyQnlGaWx0ZXInLCAnZmlsdGVyRmlsdGVyJywgZnVuY3Rpb24oJGxvZywgJGxvY2FsZSwgZGF0ZUZpbHRlciwgb3JkZXJCeUZpbHRlciwgZmlsdGVyRmlsdGVyKSB7XG4gIC8vIFB1bGxlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9tYm9zdG9jay9kMy9ibG9iL21hc3Rlci9zcmMvZm9ybWF0L3JlcXVvdGUuanNcbiAgdmFyIFNQRUNJQUxfQ0hBUkFDVEVSU19SRUdFWFAgPSAvW1xcXFxcXF5cXCRcXCpcXCtcXD9cXHxcXFtcXF1cXChcXClcXC5cXHtcXH1dL2c7XG5cbiAgdmFyIGxvY2FsZUlkO1xuICB2YXIgZm9ybWF0Q29kZVRvUmVnZXg7XG5cbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgbG9jYWxlSWQgPSAkbG9jYWxlLmlkO1xuXG4gICAgdGhpcy5wYXJzZXJzID0ge307XG4gICAgdGhpcy5mb3JtYXR0ZXJzID0ge307XG5cbiAgICBmb3JtYXRDb2RlVG9SZWdleCA9IFtcbiAgICAgIHtcbiAgICAgICAga2V5OiAneXl5eScsXG4gICAgICAgIHJlZ2V4OiAnXFxcXGR7NH0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy55ZWFyID0gK3ZhbHVlOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgICB2YXIgX2RhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgIF9kYXRlLnNldEZ1bGxZZWFyKE1hdGguYWJzKGRhdGUuZ2V0RnVsbFllYXIoKSkpO1xuICAgICAgICAgIHJldHVybiBkYXRlRmlsdGVyKF9kYXRlLCAneXl5eScpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICd5eScsXG4gICAgICAgIHJlZ2V4OiAnXFxcXGR7Mn0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdmFsdWUgPSArdmFsdWU7IHRoaXMueWVhciA9IHZhbHVlIDwgNjkgPyB2YWx1ZSArIDIwMDAgOiB2YWx1ZSArIDE5MDA7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgIHZhciBfZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgX2RhdGUuc2V0RnVsbFllYXIoTWF0aC5hYnMoZGF0ZS5nZXRGdWxsWWVhcigpKSk7XG4gICAgICAgICAgcmV0dXJuIGRhdGVGaWx0ZXIoX2RhdGUsICd5eScpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICd5JyxcbiAgICAgICAgcmVnZXg6ICdcXFxcZHsxLDR9JyxcbiAgICAgICAgYXBwbHk6IGZ1bmN0aW9uKHZhbHVlKSB7IHRoaXMueWVhciA9ICt2YWx1ZTsgfSxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7XG4gICAgICAgICAgdmFyIF9kYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICBfZGF0ZS5zZXRGdWxsWWVhcihNYXRoLmFicyhkYXRlLmdldEZ1bGxZZWFyKCkpKTtcbiAgICAgICAgICByZXR1cm4gZGF0ZUZpbHRlcihfZGF0ZSwgJ3knKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnTSEnLFxuICAgICAgICByZWdleDogJzA/WzEtOV18MVswLTJdJyxcbiAgICAgICAgYXBwbHk6IGZ1bmN0aW9uKHZhbHVlKSB7IHRoaXMubW9udGggPSB2YWx1ZSAtIDE7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGUuZ2V0TW9udGgoKTtcbiAgICAgICAgICBpZiAoL15bMC05XSQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnTU0nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnTScpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdNTU1NJyxcbiAgICAgICAgcmVnZXg6ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5NT05USC5qb2luKCd8JyksXG4gICAgICAgIGFwcGx5OiBmdW5jdGlvbih2YWx1ZSkgeyB0aGlzLm1vbnRoID0gJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTLk1PTlRILmluZGV4T2YodmFsdWUpOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ01NTU0nKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnTU1NJyxcbiAgICAgICAgcmVnZXg6ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5TSE9SVE1PTlRILmpvaW4oJ3wnKSxcbiAgICAgICAgYXBwbHk6IGZ1bmN0aW9uKHZhbHVlKSB7IHRoaXMubW9udGggPSAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuU0hPUlRNT05USC5pbmRleE9mKHZhbHVlKTsgfSxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7IHJldHVybiBkYXRlRmlsdGVyKGRhdGUsICdNTU0nKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnTU0nLFxuICAgICAgICByZWdleDogJzBbMS05XXwxWzAtMl0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5tb250aCA9IHZhbHVlIC0gMTsgfSxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7IHJldHVybiBkYXRlRmlsdGVyKGRhdGUsICdNTScpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdNJyxcbiAgICAgICAgcmVnZXg6ICdbMS05XXwxWzAtMl0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5tb250aCA9IHZhbHVlIC0gMTsgfSxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7IHJldHVybiBkYXRlRmlsdGVyKGRhdGUsICdNJyk7IH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGtleTogJ2QhJyxcbiAgICAgICAgcmVnZXg6ICdbMC0yXT9bMC05XXsxfXwzWzAtMV17MX0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5kYXRlID0gK3ZhbHVlOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRlLmdldERhdGUoKTtcbiAgICAgICAgICBpZiAoL15bMS05XSQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnZGQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnZCcpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdkZCcsXG4gICAgICAgIHJlZ2V4OiAnWzAtMl1bMC05XXsxfXwzWzAtMV17MX0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5kYXRlID0gK3ZhbHVlOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ2RkJyk7IH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGtleTogJ2QnLFxuICAgICAgICByZWdleDogJ1sxLTJdP1swLTldezF9fDNbMC0xXXsxfScsXG4gICAgICAgIGFwcGx5OiBmdW5jdGlvbih2YWx1ZSkgeyB0aGlzLmRhdGUgPSArdmFsdWU7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnZCcpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdFRUVFJyxcbiAgICAgICAgcmVnZXg6ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5EQVkuam9pbignfCcpLFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ0VFRUUnKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnRUVFJyxcbiAgICAgICAgcmVnZXg6ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5TSE9SVERBWS5qb2luKCd8JyksXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnRUVFJyk7IH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGtleTogJ0hIJyxcbiAgICAgICAgcmVnZXg6ICcoPzowfDEpWzAtOV18MlswLTNdJyxcbiAgICAgICAgYXBwbHk6IGZ1bmN0aW9uKHZhbHVlKSB7IHRoaXMuaG91cnMgPSArdmFsdWU7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnSEgnKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnaGgnLFxuICAgICAgICByZWdleDogJzBbMC05XXwxWzAtMl0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5ob3VycyA9ICt2YWx1ZTsgfSxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7IHJldHVybiBkYXRlRmlsdGVyKGRhdGUsICdoaCcpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdIJyxcbiAgICAgICAgcmVnZXg6ICcxP1swLTldfDJbMC0zXScsXG4gICAgICAgIGFwcGx5OiBmdW5jdGlvbih2YWx1ZSkgeyB0aGlzLmhvdXJzID0gK3ZhbHVlOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ0gnKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnaCcsXG4gICAgICAgIHJlZ2V4OiAnWzAtOV18MVswLTJdJyxcbiAgICAgICAgYXBwbHk6IGZ1bmN0aW9uKHZhbHVlKSB7IHRoaXMuaG91cnMgPSArdmFsdWU7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnaCcpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdtbScsXG4gICAgICAgIHJlZ2V4OiAnWzAtNV1bMC05XScsXG4gICAgICAgIGFwcGx5OiBmdW5jdGlvbih2YWx1ZSkgeyB0aGlzLm1pbnV0ZXMgPSArdmFsdWU7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnbW0nKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnbScsXG4gICAgICAgIHJlZ2V4OiAnWzAtOV18WzEtNV1bMC05XScsXG4gICAgICAgIGFwcGx5OiBmdW5jdGlvbih2YWx1ZSkgeyB0aGlzLm1pbnV0ZXMgPSArdmFsdWU7IH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnbScpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdzc3MnLFxuICAgICAgICByZWdleDogJ1swLTldWzAtOV1bMC05XScsXG4gICAgICAgIGFwcGx5OiBmdW5jdGlvbih2YWx1ZSkgeyB0aGlzLm1pbGxpc2Vjb25kcyA9ICt2YWx1ZTsgfSxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7IHJldHVybiBkYXRlRmlsdGVyKGRhdGUsICdzc3MnKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnc3MnLFxuICAgICAgICByZWdleDogJ1swLTVdWzAtOV0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5zZWNvbmRzID0gK3ZhbHVlOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ3NzJyk7IH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGtleTogJ3MnLFxuICAgICAgICByZWdleDogJ1swLTldfFsxLTVdWzAtOV0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHsgdGhpcy5zZWNvbmRzID0gK3ZhbHVlOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ3MnKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnYScsXG4gICAgICAgIHJlZ2V4OiAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuQU1QTVMuam9pbignfCcpLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAodGhpcy5ob3VycyA9PT0gMTIpIHtcbiAgICAgICAgICAgIHRoaXMuaG91cnMgPSAwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ1BNJykge1xuICAgICAgICAgICAgdGhpcy5ob3VycyArPSAxMjtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnYScpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdaJyxcbiAgICAgICAgcmVnZXg6ICdbKy1dXFxcXGR7NH0nLFxuICAgICAgICBhcHBseTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHZhbHVlLm1hdGNoKC8oWystXSkoXFxkezJ9KShcXGR7Mn0pLyksXG4gICAgICAgICAgICBzaWduID0gbWF0Y2hlc1sxXSxcbiAgICAgICAgICAgIGhvdXJzID0gbWF0Y2hlc1syXSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBtYXRjaGVzWzNdO1xuICAgICAgICAgIHRoaXMuaG91cnMgKz0gdG9JbnQoc2lnbiArIGhvdXJzKTtcbiAgICAgICAgICB0aGlzLm1pbnV0ZXMgKz0gdG9JbnQoc2lnbiArIG1pbnV0ZXMpO1xuICAgICAgICB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgICByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnWicpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICd3dycsXG4gICAgICAgIHJlZ2V4OiAnWzAtNF1bMC05XXw1WzAtM10nLFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ3d3Jyk7IH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGtleTogJ3cnLFxuICAgICAgICByZWdleDogJ1swLTldfFsxLTRdWzAtOV18NVswLTNdJyxcbiAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbihkYXRlKSB7IHJldHVybiBkYXRlRmlsdGVyKGRhdGUsICd3Jyk7IH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGtleTogJ0dHR0cnLFxuICAgICAgICByZWdleDogJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTLkVSQU5BTUVTLmpvaW4oJ3wnKS5yZXBsYWNlKC9cXHMvZywgJ1xcXFxzJyksXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnR0dHRycpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdHR0cnLFxuICAgICAgICByZWdleDogJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTLkVSQVMuam9pbignfCcpLFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ0dHRycpOyB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBrZXk6ICdHRycsXG4gICAgICAgIHJlZ2V4OiAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuRVJBUy5qb2luKCd8JyksXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnR0cnKTsgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAga2V5OiAnRycsXG4gICAgICAgIHJlZ2V4OiAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuRVJBUy5qb2luKCd8JyksXG4gICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24oZGF0ZSkgeyByZXR1cm4gZGF0ZUZpbHRlcihkYXRlLCAnRycpOyB9XG4gICAgICB9XG4gICAgXTtcblxuICAgIGlmIChhbmd1bGFyLnZlcnNpb24ubWFqb3IgPj0gMSAmJiBhbmd1bGFyLnZlcnNpb24ubWlub3IgPiA0KSB7XG4gICAgICBmb3JtYXRDb2RlVG9SZWdleC5wdXNoKHtcbiAgICAgICAga2V5OiAnTExMTCcsXG4gICAgICAgIHJlZ2V4OiAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuU1RBTkRBTE9ORU1PTlRILmpvaW4oJ3wnKSxcbiAgICAgICAgYXBwbHk6IGZ1bmN0aW9uKHZhbHVlKSB7IHRoaXMubW9udGggPSAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuU1RBTkRBTE9ORU1PTlRILmluZGV4T2YodmFsdWUpOyB9LFxuICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKGRhdGUpIHsgcmV0dXJuIGRhdGVGaWx0ZXIoZGF0ZSwgJ0xMTEwnKTsgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIHRoaXMuaW5pdCgpO1xuXG4gIGZ1bmN0aW9uIGdldEZvcm1hdENvZGVUb1JlZ2V4KGtleSkge1xuICAgIHJldHVybiBmaWx0ZXJGaWx0ZXIoZm9ybWF0Q29kZVRvUmVnZXgsIHtrZXk6IGtleX0sIHRydWUpWzBdO1xuICB9XG5cbiAgdGhpcy5nZXRQYXJzZXIgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIGYgPSBnZXRGb3JtYXRDb2RlVG9SZWdleChrZXkpO1xuICAgIHJldHVybiBmICYmIGYuYXBwbHkgfHwgbnVsbDtcbiAgfTtcblxuICB0aGlzLm92ZXJyaWRlUGFyc2VyID0gZnVuY3Rpb24gKGtleSwgcGFyc2VyKSB7XG4gICAgdmFyIGYgPSBnZXRGb3JtYXRDb2RlVG9SZWdleChrZXkpO1xuICAgIGlmIChmICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihwYXJzZXIpKSB7XG4gICAgICB0aGlzLnBhcnNlcnMgPSB7fTtcbiAgICAgIGYuYXBwbHkgPSBwYXJzZXI7XG4gICAgfVxuICB9LmJpbmQodGhpcyk7XG5cbiAgZnVuY3Rpb24gY3JlYXRlUGFyc2VyKGZvcm1hdCkge1xuICAgIHZhciBtYXAgPSBbXSwgcmVnZXggPSBmb3JtYXQuc3BsaXQoJycpO1xuXG4gICAgLy8gY2hlY2sgZm9yIGxpdGVyYWwgdmFsdWVzXG4gICAgdmFyIHF1b3RlSW5kZXggPSBmb3JtYXQuaW5kZXhPZignXFwnJyk7XG4gICAgaWYgKHF1b3RlSW5kZXggPiAtMSkge1xuICAgICAgdmFyIGluTGl0ZXJhbCA9IGZhbHNlO1xuICAgICAgZm9ybWF0ID0gZm9ybWF0LnNwbGl0KCcnKTtcbiAgICAgIGZvciAodmFyIGkgPSBxdW90ZUluZGV4OyBpIDwgZm9ybWF0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpbkxpdGVyYWwpIHtcbiAgICAgICAgICBpZiAoZm9ybWF0W2ldID09PSAnXFwnJykge1xuICAgICAgICAgICAgaWYgKGkgKyAxIDwgZm9ybWF0Lmxlbmd0aCAmJiBmb3JtYXRbaSsxXSA9PT0gJ1xcJycpIHsgLy8gZXNjYXBlZCBzaW5nbGUgcXVvdGVcbiAgICAgICAgICAgICAgZm9ybWF0W2krMV0gPSAnJCc7XG4gICAgICAgICAgICAgIHJlZ2V4W2krMV0gPSAnJztcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGVuZCBvZiBsaXRlcmFsXG4gICAgICAgICAgICAgIHJlZ2V4W2ldID0gJyc7XG4gICAgICAgICAgICAgIGluTGl0ZXJhbCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3JtYXRbaV0gPSAnJCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGZvcm1hdFtpXSA9PT0gJ1xcJycpIHsgLy8gc3RhcnQgb2YgbGl0ZXJhbFxuICAgICAgICAgICAgZm9ybWF0W2ldID0gJyQnO1xuICAgICAgICAgICAgcmVnZXhbaV0gPSAnJztcbiAgICAgICAgICAgIGluTGl0ZXJhbCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvcm1hdCA9IGZvcm1hdC5qb2luKCcnKTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLmZvckVhY2goZm9ybWF0Q29kZVRvUmVnZXgsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBpbmRleCA9IGZvcm1hdC5pbmRleE9mKGRhdGEua2V5KTtcblxuICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnNwbGl0KCcnKTtcblxuICAgICAgICByZWdleFtpbmRleF0gPSAnKCcgKyBkYXRhLnJlZ2V4ICsgJyknO1xuICAgICAgICBmb3JtYXRbaW5kZXhdID0gJyQnOyAvLyBDdXN0b20gc3ltYm9sIHRvIGRlZmluZSBjb25zdW1lZCBwYXJ0IG9mIGZvcm1hdFxuICAgICAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxLCBuID0gaW5kZXggKyBkYXRhLmtleS5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICByZWdleFtpXSA9ICcnO1xuICAgICAgICAgIGZvcm1hdFtpXSA9ICckJztcbiAgICAgICAgfVxuICAgICAgICBmb3JtYXQgPSBmb3JtYXQuam9pbignJyk7XG5cbiAgICAgICAgbWFwLnB1c2goe1xuICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICBrZXk6IGRhdGEua2V5LFxuICAgICAgICAgIGFwcGx5OiBkYXRhLmFwcGx5LFxuICAgICAgICAgIG1hdGNoZXI6IGRhdGEucmVnZXhcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVnZXg6IG5ldyBSZWdFeHAoJ14nICsgcmVnZXguam9pbignJykgKyAnJCcpLFxuICAgICAgbWFwOiBvcmRlckJ5RmlsdGVyKG1hcCwgJ2luZGV4JylcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRm9ybWF0dGVyKGZvcm1hdCkge1xuICAgIHZhciBmb3JtYXR0ZXJzID0gW107XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBmb3JtYXR0ZXIsIGxpdGVyYWxJZHg7XG4gICAgd2hpbGUgKGkgPCBmb3JtYXQubGVuZ3RoKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc051bWJlcihsaXRlcmFsSWR4KSkge1xuICAgICAgICBpZiAoZm9ybWF0LmNoYXJBdChpKSA9PT0gJ1xcJycpIHtcbiAgICAgICAgICBpZiAoaSArIDEgPj0gZm9ybWF0Lmxlbmd0aCB8fCBmb3JtYXQuY2hhckF0KGkgKyAxKSAhPT0gJ1xcJycpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlcnMucHVzaChjb25zdHJ1Y3RMaXRlcmFsRm9ybWF0dGVyKGZvcm1hdCwgbGl0ZXJhbElkeCwgaSkpO1xuICAgICAgICAgICAgbGl0ZXJhbElkeCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGkgPT09IGZvcm1hdC5sZW5ndGgpIHtcbiAgICAgICAgICB3aGlsZSAobGl0ZXJhbElkeCA8IGZvcm1hdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlciA9IGNvbnN0cnVjdEZvcm1hdHRlckZyb21JZHgoZm9ybWF0LCBsaXRlcmFsSWR4KTtcbiAgICAgICAgICAgIGZvcm1hdHRlcnMucHVzaChmb3JtYXR0ZXIpO1xuICAgICAgICAgICAgbGl0ZXJhbElkeCA9IGZvcm1hdHRlci5lbmRJZHg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaSsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZvcm1hdC5jaGFyQXQoaSkgPT09ICdcXCcnKSB7XG4gICAgICAgIGxpdGVyYWxJZHggPSBpO1xuICAgICAgICBpKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3JtYXR0ZXIgPSBjb25zdHJ1Y3RGb3JtYXR0ZXJGcm9tSWR4KGZvcm1hdCwgaSk7XG5cbiAgICAgIGZvcm1hdHRlcnMucHVzaChmb3JtYXR0ZXIucGFyc2VyKTtcbiAgICAgIGkgPSBmb3JtYXR0ZXIuZW5kSWR4O1xuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXR0ZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gY29uc3RydWN0TGl0ZXJhbEZvcm1hdHRlcihmb3JtYXQsIGxpdGVyYWxJZHgsIGVuZElkeCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmb3JtYXQuc3Vic3RyKGxpdGVyYWxJZHggKyAxLCBlbmRJZHggLSBsaXRlcmFsSWR4IC0gMSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN0cnVjdEZvcm1hdHRlckZyb21JZHgoZm9ybWF0LCBpKSB7XG4gICAgdmFyIGN1cnJlbnRQb3NTdHIgPSBmb3JtYXQuc3Vic3RyKGkpO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZm9ybWF0Q29kZVRvUmVnZXgubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChuZXcgUmVnRXhwKCdeJyArIGZvcm1hdENvZGVUb1JlZ2V4W2pdLmtleSkudGVzdChjdXJyZW50UG9zU3RyKSkge1xuICAgICAgICB2YXIgZGF0YSA9IGZvcm1hdENvZGVUb1JlZ2V4W2pdO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVuZElkeDogaSArIGRhdGEua2V5Lmxlbmd0aCxcbiAgICAgICAgICBwYXJzZXI6IGRhdGEuZm9ybWF0dGVyXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVuZElkeDogaSArIDEsXG4gICAgICBwYXJzZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudFBvc1N0ci5jaGFyQXQoMCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHRoaXMuZmlsdGVyID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgaWYgKCFhbmd1bGFyLmlzRGF0ZShkYXRlKSB8fCBpc05hTihkYXRlKSB8fCAhZm9ybWF0KSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgZm9ybWF0ID0gJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTW2Zvcm1hdF0gfHwgZm9ybWF0O1xuXG4gICAgaWYgKCRsb2NhbGUuaWQgIT09IGxvY2FsZUlkKSB7XG4gICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZm9ybWF0dGVyc1tmb3JtYXRdKSB7XG4gICAgICB0aGlzLmZvcm1hdHRlcnNbZm9ybWF0XSA9IGNyZWF0ZUZvcm1hdHRlcihmb3JtYXQpO1xuICAgIH1cblxuICAgIHZhciBmb3JtYXR0ZXJzID0gdGhpcy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG5cbiAgICByZXR1cm4gZm9ybWF0dGVycy5yZWR1Y2UoZnVuY3Rpb24oc3RyLCBmb3JtYXR0ZXIpIHtcbiAgICAgIHJldHVybiBzdHIgKyBmb3JtYXR0ZXIoZGF0ZSk7XG4gICAgfSwgJycpO1xuICB9O1xuXG4gIHRoaXMucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgZm9ybWF0LCBiYXNlRGF0ZSkge1xuICAgIGlmICghYW5ndWxhci5pc1N0cmluZyhpbnB1dCkgfHwgIWZvcm1hdCkge1xuICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIGZvcm1hdCA9ICRsb2NhbGUuREFURVRJTUVfRk9STUFUU1tmb3JtYXRdIHx8IGZvcm1hdDtcbiAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShTUEVDSUFMX0NIQVJBQ1RFUlNfUkVHRVhQLCAnXFxcXCQmJyk7XG5cbiAgICBpZiAoJGxvY2FsZS5pZCAhPT0gbG9jYWxlSWQpIHtcbiAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5wYXJzZXJzW2Zvcm1hdF0pIHtcbiAgICAgIHRoaXMucGFyc2Vyc1tmb3JtYXRdID0gY3JlYXRlUGFyc2VyKGZvcm1hdCwgJ2FwcGx5Jyk7XG4gICAgfVxuXG4gICAgdmFyIHBhcnNlciA9IHRoaXMucGFyc2Vyc1tmb3JtYXRdLFxuICAgICAgICByZWdleCA9IHBhcnNlci5yZWdleCxcbiAgICAgICAgbWFwID0gcGFyc2VyLm1hcCxcbiAgICAgICAgcmVzdWx0cyA9IGlucHV0Lm1hdGNoKHJlZ2V4KSxcbiAgICAgICAgdHpPZmZzZXQgPSBmYWxzZTtcbiAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCkge1xuICAgICAgdmFyIGZpZWxkcywgZHQ7XG4gICAgICBpZiAoYW5ndWxhci5pc0RhdGUoYmFzZURhdGUpICYmICFpc05hTihiYXNlRGF0ZS5nZXRUaW1lKCkpKSB7XG4gICAgICAgIGZpZWxkcyA9IHtcbiAgICAgICAgICB5ZWFyOiBiYXNlRGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgICAgIG1vbnRoOiBiYXNlRGF0ZS5nZXRNb250aCgpLFxuICAgICAgICAgIGRhdGU6IGJhc2VEYXRlLmdldERhdGUoKSxcbiAgICAgICAgICBob3VyczogYmFzZURhdGUuZ2V0SG91cnMoKSxcbiAgICAgICAgICBtaW51dGVzOiBiYXNlRGF0ZS5nZXRNaW51dGVzKCksXG4gICAgICAgICAgc2Vjb25kczogYmFzZURhdGUuZ2V0U2Vjb25kcygpLFxuICAgICAgICAgIG1pbGxpc2Vjb25kczogYmFzZURhdGUuZ2V0TWlsbGlzZWNvbmRzKClcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChiYXNlRGF0ZSkge1xuICAgICAgICAgICRsb2cud2FybignZGF0ZXBhcnNlcjonLCAnYmFzZURhdGUgaXMgbm90IGEgdmFsaWQgZGF0ZScpO1xuICAgICAgICB9XG4gICAgICAgIGZpZWxkcyA9IHsgeWVhcjogMTkwMCwgbW9udGg6IDAsIGRhdGU6IDEsIGhvdXJzOiAwLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwLCBtaWxsaXNlY29uZHM6IDAgfTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDEsIG4gPSByZXN1bHRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YXIgbWFwcGVyID0gbWFwW2kgLSAxXTtcbiAgICAgICAgaWYgKG1hcHBlci5tYXRjaGVyID09PSAnWicpIHtcbiAgICAgICAgICB0ek9mZnNldCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWFwcGVyLmFwcGx5KSB7XG4gICAgICAgICAgbWFwcGVyLmFwcGx5LmNhbGwoZmllbGRzLCByZXN1bHRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgZGF0ZXNldHRlciA9IHR6T2Zmc2V0ID8gRGF0ZS5wcm90b3R5cGUuc2V0VVRDRnVsbFllYXIgOlxuICAgICAgICBEYXRlLnByb3RvdHlwZS5zZXRGdWxsWWVhcjtcbiAgICAgIHZhciB0aW1lc2V0dGVyID0gdHpPZmZzZXQgPyBEYXRlLnByb3RvdHlwZS5zZXRVVENIb3VycyA6XG4gICAgICAgIERhdGUucHJvdG90eXBlLnNldEhvdXJzO1xuXG4gICAgICBpZiAoaXNWYWxpZChmaWVsZHMueWVhciwgZmllbGRzLm1vbnRoLCBmaWVsZHMuZGF0ZSkpIHtcbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNEYXRlKGJhc2VEYXRlKSAmJiAhaXNOYU4oYmFzZURhdGUuZ2V0VGltZSgpKSAmJiAhdHpPZmZzZXQpIHtcbiAgICAgICAgICBkdCA9IG5ldyBEYXRlKGJhc2VEYXRlKTtcbiAgICAgICAgICBkYXRlc2V0dGVyLmNhbGwoZHQsIGZpZWxkcy55ZWFyLCBmaWVsZHMubW9udGgsIGZpZWxkcy5kYXRlKTtcbiAgICAgICAgICB0aW1lc2V0dGVyLmNhbGwoZHQsIGZpZWxkcy5ob3VycywgZmllbGRzLm1pbnV0ZXMsXG4gICAgICAgICAgICBmaWVsZHMuc2Vjb25kcywgZmllbGRzLm1pbGxpc2Vjb25kcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZHQgPSBuZXcgRGF0ZSgwKTtcbiAgICAgICAgICBkYXRlc2V0dGVyLmNhbGwoZHQsIGZpZWxkcy55ZWFyLCBmaWVsZHMubW9udGgsIGZpZWxkcy5kYXRlKTtcbiAgICAgICAgICB0aW1lc2V0dGVyLmNhbGwoZHQsIGZpZWxkcy5ob3VycyB8fCAwLCBmaWVsZHMubWludXRlcyB8fCAwLFxuICAgICAgICAgICAgZmllbGRzLnNlY29uZHMgfHwgMCwgZmllbGRzLm1pbGxpc2Vjb25kcyB8fCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZHQ7XG4gICAgfVxuICB9O1xuXG4gIC8vIENoZWNrIGlmIGRhdGUgaXMgdmFsaWQgZm9yIHNwZWNpZmljIG1vbnRoIChhbmQgeWVhciBmb3IgRmVicnVhcnkpLlxuICAvLyBNb250aDogMCA9IEphbiwgMSA9IEZlYiwgZXRjXG4gIGZ1bmN0aW9uIGlzVmFsaWQoeWVhciwgbW9udGgsIGRhdGUpIHtcbiAgICBpZiAoZGF0ZSA8IDEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAobW9udGggPT09IDEgJiYgZGF0ZSA+IDI4KSB7XG4gICAgICByZXR1cm4gZGF0ZSA9PT0gMjkgJiYgKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDAgfHwgeWVhciAlIDQwMCA9PT0gMCk7XG4gICAgfVxuXG4gICAgaWYgKG1vbnRoID09PSAzIHx8IG1vbnRoID09PSA1IHx8IG1vbnRoID09PSA4IHx8IG1vbnRoID09PSAxMCkge1xuICAgICAgcmV0dXJuIGRhdGUgPCAzMTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvSW50KHN0cikge1xuICAgIHJldHVybiBwYXJzZUludChzdHIsIDEwKTtcbiAgfVxuXG4gIHRoaXMudG9UaW1lem9uZSA9IHRvVGltZXpvbmU7XG4gIHRoaXMuZnJvbVRpbWV6b25lID0gZnJvbVRpbWV6b25lO1xuICB0aGlzLnRpbWV6b25lVG9PZmZzZXQgPSB0aW1lem9uZVRvT2Zmc2V0O1xuICB0aGlzLmFkZERhdGVNaW51dGVzID0gYWRkRGF0ZU1pbnV0ZXM7XG4gIHRoaXMuY29udmVydFRpbWV6b25lVG9Mb2NhbCA9IGNvbnZlcnRUaW1lem9uZVRvTG9jYWw7XG5cbiAgZnVuY3Rpb24gdG9UaW1lem9uZShkYXRlLCB0aW1lem9uZSkge1xuICAgIHJldHVybiBkYXRlICYmIHRpbWV6b25lID8gY29udmVydFRpbWV6b25lVG9Mb2NhbChkYXRlLCB0aW1lem9uZSkgOiBkYXRlO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJvbVRpbWV6b25lKGRhdGUsIHRpbWV6b25lKSB7XG4gICAgcmV0dXJuIGRhdGUgJiYgdGltZXpvbmUgPyBjb252ZXJ0VGltZXpvbmVUb0xvY2FsKGRhdGUsIHRpbWV6b25lLCB0cnVlKSA6IGRhdGU7XG4gIH1cblxuICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIuanMvYmxvYi82MjJjNDIxNjk2OTllYzA3ZmM2ZGFhYTE5ZmU2ZDIyNGU1ZDJmNzBlL3NyYy9Bbmd1bGFyLmpzI0wxMjA3XG4gIGZ1bmN0aW9uIHRpbWV6b25lVG9PZmZzZXQodGltZXpvbmUsIGZhbGxiYWNrKSB7XG4gICAgdGltZXpvbmUgPSB0aW1lem9uZS5yZXBsYWNlKC86L2csICcnKTtcbiAgICB2YXIgcmVxdWVzdGVkVGltZXpvbmVPZmZzZXQgPSBEYXRlLnBhcnNlKCdKYW4gMDEsIDE5NzAgMDA6MDA6MDAgJyArIHRpbWV6b25lKSAvIDYwMDAwO1xuICAgIHJldHVybiBpc05hTihyZXF1ZXN0ZWRUaW1lem9uZU9mZnNldCkgPyBmYWxsYmFjayA6IHJlcXVlc3RlZFRpbWV6b25lT2Zmc2V0O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkRGF0ZU1pbnV0ZXMoZGF0ZSwgbWludXRlcykge1xuICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlLmdldFRpbWUoKSk7XG4gICAgZGF0ZS5zZXRNaW51dGVzKGRhdGUuZ2V0TWludXRlcygpICsgbWludXRlcyk7XG4gICAgcmV0dXJuIGRhdGU7XG4gIH1cblxuICBmdW5jdGlvbiBjb252ZXJ0VGltZXpvbmVUb0xvY2FsKGRhdGUsIHRpbWV6b25lLCByZXZlcnNlKSB7XG4gICAgcmV2ZXJzZSA9IHJldmVyc2UgPyAtMSA6IDE7XG4gICAgdmFyIGRhdGVUaW1lem9uZU9mZnNldCA9IGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgICB2YXIgdGltZXpvbmVPZmZzZXQgPSB0aW1lem9uZVRvT2Zmc2V0KHRpbWV6b25lLCBkYXRlVGltZXpvbmVPZmZzZXQpO1xuICAgIHJldHVybiBhZGREYXRlTWludXRlcyhkYXRlLCByZXZlcnNlICogKHRpbWV6b25lT2Zmc2V0IC0gZGF0ZVRpbWV6b25lT2Zmc2V0KSk7XG4gIH1cbn1dKTtcblxuLy8gQXZvaWRpbmcgdXNlIG9mIG5nLWNsYXNzIGFzIGl0IGNyZWF0ZXMgYSBsb3Qgb2Ygd2F0Y2hlcnMgd2hlbiBhIGNsYXNzIGlzIHRvIGJlIGFwcGxpZWQgdG9cbi8vIGF0IG1vc3Qgb25lIGVsZW1lbnQuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLmlzQ2xhc3MnLCBbXSlcbi5kaXJlY3RpdmUoJ3VpYklzQ2xhc3MnLCBbXG4gICAgICAgICAnJGFuaW1hdGUnLFxuZnVuY3Rpb24gKCRhbmltYXRlKSB7XG4gIC8vICAgICAgICAgICAgICAgICAgICAxMTExMTExMSAgICAgICAgICAyMjIyMjIyMlxuICB2YXIgT05fUkVHRVhQID0gL15cXHMqKFtcXHNcXFNdKz8pXFxzK29uXFxzKyhbXFxzXFxTXSs/KVxccyokLztcbiAgLy8gICAgICAgICAgICAgICAgICAgIDExMTExMTExICAgICAgICAgICAyMjIyMjIyMlxuICB2YXIgSVNfUkVHRVhQID0gL15cXHMqKFtcXHNcXFNdKz8pXFxzK2ZvclxccysoW1xcc1xcU10rPylcXHMqJC87XG5cbiAgdmFyIGRhdGFQZXJUcmFja2VkID0ge307XG5cbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIGNvbXBpbGU6IGZ1bmN0aW9uKHRFbGVtZW50LCB0QXR0cnMpIHtcbiAgICAgIHZhciBsaW5rZWRTY29wZXMgPSBbXTtcbiAgICAgIHZhciBpbnN0YW5jZXMgPSBbXTtcbiAgICAgIHZhciBleHBUb0RhdGEgPSB7fTtcbiAgICAgIHZhciBsYXN0QWN0aXZhdGVkID0gbnVsbDtcbiAgICAgIHZhciBvbkV4cE1hdGNoZXMgPSB0QXR0cnMudWliSXNDbGFzcy5tYXRjaChPTl9SRUdFWFApO1xuICAgICAgdmFyIG9uRXhwID0gb25FeHBNYXRjaGVzWzJdO1xuICAgICAgdmFyIGV4cHNTdHIgPSBvbkV4cE1hdGNoZXNbMV07XG4gICAgICB2YXIgZXhwcyA9IGV4cHNTdHIuc3BsaXQoJywnKTtcblxuICAgICAgcmV0dXJuIGxpbmtGbjtcblxuICAgICAgZnVuY3Rpb24gbGlua0ZuKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBsaW5rZWRTY29wZXMucHVzaChzY29wZSk7XG4gICAgICAgIGluc3RhbmNlcy5wdXNoKHtcbiAgICAgICAgICBzY29wZTogc2NvcGUsXG4gICAgICAgICAgZWxlbWVudDogZWxlbWVudFxuICAgICAgICB9KTtcblxuICAgICAgICBleHBzLmZvckVhY2goZnVuY3Rpb24oZXhwLCBrKSB7XG4gICAgICAgICAgYWRkRm9yRXhwKGV4cCwgc2NvcGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgcmVtb3ZlU2NvcGUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBhZGRGb3JFeHAoZXhwLCBzY29wZSkge1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IGV4cC5tYXRjaChJU19SRUdFWFApO1xuICAgICAgICB2YXIgY2xhenogPSBzY29wZS4kZXZhbChtYXRjaGVzWzFdKTtcbiAgICAgICAgdmFyIGNvbXBhcmVXaXRoRXhwID0gbWF0Y2hlc1syXTtcbiAgICAgICAgdmFyIGRhdGEgPSBleHBUb0RhdGFbZXhwXTtcbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgdmFyIHdhdGNoRm4gPSBmdW5jdGlvbihjb21wYXJlV2l0aFZhbCkge1xuICAgICAgICAgICAgdmFyIG5ld0FjdGl2YXRlZCA9IG51bGw7XG4gICAgICAgICAgICBpbnN0YW5jZXMuc29tZShmdW5jdGlvbihpbnN0YW5jZSkge1xuICAgICAgICAgICAgICB2YXIgdGhpc1ZhbCA9IGluc3RhbmNlLnNjb3BlLiRldmFsKG9uRXhwKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXNWYWwgPT09IGNvbXBhcmVXaXRoVmFsKSB7XG4gICAgICAgICAgICAgICAgbmV3QWN0aXZhdGVkID0gaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGRhdGEubGFzdEFjdGl2YXRlZCAhPT0gbmV3QWN0aXZhdGVkKSB7XG4gICAgICAgICAgICAgIGlmIChkYXRhLmxhc3RBY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgICAgICAkYW5pbWF0ZS5yZW1vdmVDbGFzcyhkYXRhLmxhc3RBY3RpdmF0ZWQuZWxlbWVudCwgY2xhenopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChuZXdBY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgICAgICAkYW5pbWF0ZS5hZGRDbGFzcyhuZXdBY3RpdmF0ZWQuZWxlbWVudCwgY2xhenopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRhdGEubGFzdEFjdGl2YXRlZCA9IG5ld0FjdGl2YXRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIGV4cFRvRGF0YVtleHBdID0gZGF0YSA9IHtcbiAgICAgICAgICAgIGxhc3RBY3RpdmF0ZWQ6IG51bGwsXG4gICAgICAgICAgICBzY29wZTogc2NvcGUsXG4gICAgICAgICAgICB3YXRjaEZuOiB3YXRjaEZuLFxuICAgICAgICAgICAgY29tcGFyZVdpdGhFeHA6IGNvbXBhcmVXaXRoRXhwLFxuICAgICAgICAgICAgd2F0Y2hlcjogc2NvcGUuJHdhdGNoKGNvbXBhcmVXaXRoRXhwLCB3YXRjaEZuKVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS53YXRjaEZuKHNjb3BlLiRldmFsKGNvbXBhcmVXaXRoRXhwKSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZVNjb3BlKGUpIHtcbiAgICAgICAgdmFyIHJlbW92ZWRTY29wZSA9IGUudGFyZ2V0U2NvcGU7XG4gICAgICAgIHZhciBpbmRleCA9IGxpbmtlZFNjb3Blcy5pbmRleE9mKHJlbW92ZWRTY29wZSk7XG4gICAgICAgIGxpbmtlZFNjb3Blcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbnN0YW5jZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaWYgKGxpbmtlZFNjb3Blcy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgbmV3V2F0Y2hTY29wZSA9IGxpbmtlZFNjb3Blc1swXTtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZXhwVG9EYXRhLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zY29wZSA9PT0gcmVtb3ZlZFNjb3BlKSB7XG4gICAgICAgICAgICAgIGRhdGEud2F0Y2hlciA9IG5ld1dhdGNoU2NvcGUuJHdhdGNoKGRhdGEuY29tcGFyZVdpdGhFeHAsIGRhdGEud2F0Y2hGbik7XG4gICAgICAgICAgICAgIGRhdGEuc2NvcGUgPSBuZXdXYXRjaFNjb3BlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cFRvRGF0YSA9IHt9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufV0pO1xuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5kYXRlcGlja2VyJywgWyd1aS5ib290c3RyYXAuZGF0ZXBhcnNlcicsICd1aS5ib290c3RyYXAuaXNDbGFzcyddKVxuXG4udmFsdWUoJyRkYXRlcGlja2VyU3VwcHJlc3NFcnJvcicsIGZhbHNlKVxuXG4udmFsdWUoJyRkYXRlcGlja2VyTGl0ZXJhbFdhcm5pbmcnLCB0cnVlKVxuXG4uY29uc3RhbnQoJ3VpYkRhdGVwaWNrZXJDb25maWcnLCB7XG4gIGRhdGVwaWNrZXJNb2RlOiAnZGF5JyxcbiAgZm9ybWF0RGF5OiAnZGQnLFxuICBmb3JtYXRNb250aDogJ01NTU0nLFxuICBmb3JtYXRZZWFyOiAneXl5eScsXG4gIGZvcm1hdERheUhlYWRlcjogJ0VFRScsXG4gIGZvcm1hdERheVRpdGxlOiAnTU1NTSB5eXl5JyxcbiAgZm9ybWF0TW9udGhUaXRsZTogJ3l5eXknLFxuICBtYXhEYXRlOiBudWxsLFxuICBtYXhNb2RlOiAneWVhcicsXG4gIG1pbkRhdGU6IG51bGwsXG4gIG1pbk1vZGU6ICdkYXknLFxuICBtb250aENvbHVtbnM6IDMsXG4gIG5nTW9kZWxPcHRpb25zOiB7fSxcbiAgc2hvcnRjdXRQcm9wYWdhdGlvbjogZmFsc2UsXG4gIHNob3dXZWVrczogdHJ1ZSxcbiAgeWVhckNvbHVtbnM6IDUsXG4gIHllYXJSb3dzOiA0XG59KVxuXG4uY29udHJvbGxlcignVWliRGF0ZXBpY2tlckNvbnRyb2xsZXInLCBbJyRzY29wZScsICckZWxlbWVudCcsICckYXR0cnMnLCAnJHBhcnNlJywgJyRpbnRlcnBvbGF0ZScsICckbG9jYWxlJywgJyRsb2cnLCAnZGF0ZUZpbHRlcicsICd1aWJEYXRlcGlja2VyQ29uZmlnJywgJyRkYXRlcGlja2VyTGl0ZXJhbFdhcm5pbmcnLCAnJGRhdGVwaWNrZXJTdXBwcmVzc0Vycm9yJywgJ3VpYkRhdGVQYXJzZXInLFxuICBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRwYXJzZSwgJGludGVycG9sYXRlLCAkbG9jYWxlLCAkbG9nLCBkYXRlRmlsdGVyLCBkYXRlcGlja2VyQ29uZmlnLCAkZGF0ZXBpY2tlckxpdGVyYWxXYXJuaW5nLCAkZGF0ZXBpY2tlclN1cHByZXNzRXJyb3IsIGRhdGVQYXJzZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgbmdNb2RlbEN0cmwgPSB7ICRzZXRWaWV3VmFsdWU6IGFuZ3VsYXIubm9vcCB9LCAvLyBudWxsTW9kZWxDdHJsO1xuICAgICAgbmdNb2RlbE9wdGlvbnMgPSB7fSxcbiAgICAgIHdhdGNoTGlzdGVuZXJzID0gW107XG5cbiAgJGVsZW1lbnQuYWRkQ2xhc3MoJ3VpYi1kYXRlcGlja2VyJyk7XG4gICRhdHRycy4kc2V0KCdyb2xlJywgJ2FwcGxpY2F0aW9uJyk7XG5cbiAgaWYgKCEkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMpIHtcbiAgICAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIC8vIE1vZGVzIGNoYWluXG4gIHRoaXMubW9kZXMgPSBbJ2RheScsICdtb250aCcsICd5ZWFyJ107XG5cbiAgW1xuICAgICdjdXN0b21DbGFzcycsXG4gICAgJ2RhdGVEaXNhYmxlZCcsXG4gICAgJ2RhdGVwaWNrZXJNb2RlJyxcbiAgICAnZm9ybWF0RGF5JyxcbiAgICAnZm9ybWF0RGF5SGVhZGVyJyxcbiAgICAnZm9ybWF0RGF5VGl0bGUnLFxuICAgICdmb3JtYXRNb250aCcsXG4gICAgJ2Zvcm1hdE1vbnRoVGl0bGUnLFxuICAgICdmb3JtYXRZZWFyJyxcbiAgICAnbWF4RGF0ZScsXG4gICAgJ21heE1vZGUnLFxuICAgICdtaW5EYXRlJyxcbiAgICAnbWluTW9kZScsXG4gICAgJ21vbnRoQ29sdW1ucycsXG4gICAgJ3Nob3dXZWVrcycsXG4gICAgJ3Nob3J0Y3V0UHJvcGFnYXRpb24nLFxuICAgICdzdGFydGluZ0RheScsXG4gICAgJ3llYXJDb2x1bW5zJyxcbiAgICAneWVhclJvd3MnXG4gIF0uZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSAnY3VzdG9tQ2xhc3MnOlxuICAgICAgY2FzZSAnZGF0ZURpc2FibGVkJzpcbiAgICAgICAgJHNjb3BlW2tleV0gPSAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnNba2V5XSB8fCBhbmd1bGFyLm5vb3A7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZGF0ZXBpY2tlck1vZGUnOlxuICAgICAgICAkc2NvcGUuZGF0ZXBpY2tlck1vZGUgPSBhbmd1bGFyLmlzRGVmaW5lZCgkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMuZGF0ZXBpY2tlck1vZGUpID9cbiAgICAgICAgICAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMuZGF0ZXBpY2tlck1vZGUgOiBkYXRlcGlja2VyQ29uZmlnLmRhdGVwaWNrZXJNb2RlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Zvcm1hdERheSc6XG4gICAgICBjYXNlICdmb3JtYXREYXlIZWFkZXInOlxuICAgICAgY2FzZSAnZm9ybWF0RGF5VGl0bGUnOlxuICAgICAgY2FzZSAnZm9ybWF0TW9udGgnOlxuICAgICAgY2FzZSAnZm9ybWF0TW9udGhUaXRsZSc6XG4gICAgICBjYXNlICdmb3JtYXRZZWFyJzpcbiAgICAgICAgc2VsZltrZXldID0gYW5ndWxhci5pc0RlZmluZWQoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zW2tleV0pID9cbiAgICAgICAgICAkaW50ZXJwb2xhdGUoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zW2tleV0pKCRzY29wZS4kcGFyZW50KSA6XG4gICAgICAgICAgZGF0ZXBpY2tlckNvbmZpZ1trZXldO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vbnRoQ29sdW1ucyc6XG4gICAgICBjYXNlICdzaG93V2Vla3MnOlxuICAgICAgY2FzZSAnc2hvcnRjdXRQcm9wYWdhdGlvbic6XG4gICAgICBjYXNlICd5ZWFyQ29sdW1ucyc6XG4gICAgICBjYXNlICd5ZWFyUm93cyc6XG4gICAgICAgIHNlbGZba2V5XSA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRzY29wZS5kYXRlcGlja2VyT3B0aW9uc1trZXldKSA/XG4gICAgICAgICAgJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zW2tleV0gOiBkYXRlcGlja2VyQ29uZmlnW2tleV07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhcnRpbmdEYXknOlxuICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zLnN0YXJ0aW5nRGF5KSkge1xuICAgICAgICAgIHNlbGYuc3RhcnRpbmdEYXkgPSAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMuc3RhcnRpbmdEYXk7XG4gICAgICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc051bWJlcihkYXRlcGlja2VyQ29uZmlnLnN0YXJ0aW5nRGF5KSkge1xuICAgICAgICAgIHNlbGYuc3RhcnRpbmdEYXkgPSBkYXRlcGlja2VyQ29uZmlnLnN0YXJ0aW5nRGF5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuc3RhcnRpbmdEYXkgPSAoJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTLkZJUlNUREFZT0ZXRUVLICsgOCkgJSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtYXhEYXRlJzpcbiAgICAgIGNhc2UgJ21pbkRhdGUnOlxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdkYXRlcGlja2VyT3B0aW9ucy4nICsga2V5LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEYXRlKHZhbHVlKSkge1xuICAgICAgICAgICAgICBzZWxmW2tleV0gPSBkYXRlUGFyc2VyLmZyb21UaW1lem9uZShuZXcgRGF0ZSh2YWx1ZSksIG5nTW9kZWxPcHRpb25zLmdldE9wdGlvbigndGltZXpvbmUnKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoJGRhdGVwaWNrZXJMaXRlcmFsV2FybmluZykge1xuICAgICAgICAgICAgICAgICRsb2cud2FybignTGl0ZXJhbCBkYXRlIHN1cHBvcnQgaGFzIGJlZW4gZGVwcmVjYXRlZCwgcGxlYXNlIHN3aXRjaCB0byBkYXRlIG9iamVjdCB1c2FnZScpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgc2VsZltrZXldID0gbmV3IERhdGUoZGF0ZUZpbHRlcih2YWx1ZSwgJ21lZGl1bScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZltrZXldID0gZGF0ZXBpY2tlckNvbmZpZ1trZXldID9cbiAgICAgICAgICAgICAgZGF0ZVBhcnNlci5mcm9tVGltZXpvbmUobmV3IERhdGUoZGF0ZXBpY2tlckNvbmZpZ1trZXldKSwgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpKSA6XG4gICAgICAgICAgICAgIG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5yZWZyZXNoVmlldygpO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21heE1vZGUnOlxuICAgICAgY2FzZSAnbWluTW9kZSc6XG4gICAgICAgIGlmICgkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnNba2V5XTsgfSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHNlbGZba2V5XSA9ICRzY29wZVtrZXldID0gYW5ndWxhci5pc0RlZmluZWQodmFsdWUpID8gdmFsdWUgOiAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdtaW5Nb2RlJyAmJiBzZWxmLm1vZGVzLmluZGV4T2YoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zLmRhdGVwaWNrZXJNb2RlKSA8IHNlbGYubW9kZXMuaW5kZXhPZihzZWxmW2tleV0pIHx8XG4gICAgICAgICAgICAgIGtleSA9PT0gJ21heE1vZGUnICYmIHNlbGYubW9kZXMuaW5kZXhPZigkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMuZGF0ZXBpY2tlck1vZGUpID4gc2VsZi5tb2Rlcy5pbmRleE9mKHNlbGZba2V5XSkpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLmRhdGVwaWNrZXJNb2RlID0gc2VsZltrZXldO1xuICAgICAgICAgICAgICAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMuZGF0ZXBpY2tlck1vZGUgPSBzZWxmW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZltrZXldID0gJHNjb3BlW2tleV0gPSBkYXRlcGlja2VyQ29uZmlnW2tleV0gfHwgbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSk7XG5cbiAgJHNjb3BlLnVuaXF1ZUlkID0gJ2RhdGVwaWNrZXItJyArICRzY29wZS4kaWQgKyAnLScgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMCk7XG5cbiAgJHNjb3BlLmRpc2FibGVkID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmRpc2FibGVkKSB8fCBmYWxzZTtcbiAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5uZ0Rpc2FibGVkKSkge1xuICAgIHdhdGNoTGlzdGVuZXJzLnB1c2goJHNjb3BlLiRwYXJlbnQuJHdhdGNoKCRhdHRycy5uZ0Rpc2FibGVkLCBmdW5jdGlvbihkaXNhYmxlZCkge1xuICAgICAgJHNjb3BlLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgICBzZWxmLnJlZnJlc2hWaWV3KCk7XG4gICAgfSkpO1xuICB9XG5cbiAgJHNjb3BlLmlzQWN0aXZlID0gZnVuY3Rpb24oZGF0ZU9iamVjdCkge1xuICAgIGlmIChzZWxmLmNvbXBhcmUoZGF0ZU9iamVjdC5kYXRlLCBzZWxmLmFjdGl2ZURhdGUpID09PSAwKSB7XG4gICAgICAkc2NvcGUuYWN0aXZlRGF0ZUlkID0gZGF0ZU9iamVjdC51aWQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKG5nTW9kZWxDdHJsXykge1xuICAgIG5nTW9kZWxDdHJsID0gbmdNb2RlbEN0cmxfO1xuICAgIG5nTW9kZWxPcHRpb25zID0gZXh0cmFjdE9wdGlvbnMobmdNb2RlbEN0cmwpO1xuXG4gICAgaWYgKCRzY29wZS5kYXRlcGlja2VyT3B0aW9ucy5pbml0RGF0ZSkge1xuICAgICAgc2VsZi5hY3RpdmVEYXRlID0gZGF0ZVBhcnNlci5mcm9tVGltZXpvbmUoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zLmluaXREYXRlLCBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ3RpbWV6b25lJykpIHx8IG5ldyBEYXRlKCk7XG4gICAgICAkc2NvcGUuJHdhdGNoKCdkYXRlcGlja2VyT3B0aW9ucy5pbml0RGF0ZScsIGZ1bmN0aW9uKGluaXREYXRlKSB7XG4gICAgICAgIGlmIChpbml0RGF0ZSAmJiAobmdNb2RlbEN0cmwuJGlzRW1wdHkobmdNb2RlbEN0cmwuJG1vZGVsVmFsdWUpIHx8IG5nTW9kZWxDdHJsLiRpbnZhbGlkKSkge1xuICAgICAgICAgIHNlbGYuYWN0aXZlRGF0ZSA9IGRhdGVQYXJzZXIuZnJvbVRpbWV6b25lKGluaXREYXRlLCBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ3RpbWV6b25lJykpO1xuICAgICAgICAgIHNlbGYucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuYWN0aXZlRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgfVxuXG4gICAgdmFyIGRhdGUgPSBuZ01vZGVsQ3RybC4kbW9kZWxWYWx1ZSA/IG5ldyBEYXRlKG5nTW9kZWxDdHJsLiRtb2RlbFZhbHVlKSA6IG5ldyBEYXRlKCk7XG4gICAgdGhpcy5hY3RpdmVEYXRlID0gIWlzTmFOKGRhdGUpID9cbiAgICAgIGRhdGVQYXJzZXIuZnJvbVRpbWV6b25lKGRhdGUsIG5nTW9kZWxPcHRpb25zLmdldE9wdGlvbigndGltZXpvbmUnKSkgOlxuICAgICAgZGF0ZVBhcnNlci5mcm9tVGltZXpvbmUobmV3IERhdGUoKSwgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpKTtcblxuICAgIG5nTW9kZWxDdHJsLiRyZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVuZGVyKCk7XG4gICAgfTtcbiAgfTtcblxuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChuZ01vZGVsQ3RybC4kdmlld1ZhbHVlKSB7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKG5nTW9kZWxDdHJsLiR2aWV3VmFsdWUpLFxuICAgICAgICAgIGlzVmFsaWQgPSAhaXNOYU4oZGF0ZSk7XG5cbiAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IGRhdGVQYXJzZXIuZnJvbVRpbWV6b25lKGRhdGUsIG5nTW9kZWxPcHRpb25zLmdldE9wdGlvbigndGltZXpvbmUnKSk7XG4gICAgICB9IGVsc2UgaWYgKCEkZGF0ZXBpY2tlclN1cHByZXNzRXJyb3IpIHtcbiAgICAgICAgJGxvZy5lcnJvcignRGF0ZXBpY2tlciBkaXJlY3RpdmU6IFwibmctbW9kZWxcIiB2YWx1ZSBtdXN0IGJlIGEgRGF0ZSBvYmplY3QnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWZyZXNoVmlldygpO1xuICB9O1xuXG4gIHRoaXMucmVmcmVzaFZpZXcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5lbGVtZW50KSB7XG4gICAgICAkc2NvcGUuc2VsZWN0ZWREdCA9IG51bGw7XG4gICAgICB0aGlzLl9yZWZyZXNoVmlldygpO1xuICAgICAgaWYgKCRzY29wZS5hY3RpdmVEdCkge1xuICAgICAgICAkc2NvcGUuYWN0aXZlRGF0ZUlkID0gJHNjb3BlLmFjdGl2ZUR0LnVpZDtcbiAgICAgIH1cblxuICAgICAgdmFyIGRhdGUgPSBuZ01vZGVsQ3RybC4kdmlld1ZhbHVlID8gbmV3IERhdGUobmdNb2RlbEN0cmwuJHZpZXdWYWx1ZSkgOiBudWxsO1xuICAgICAgZGF0ZSA9IGRhdGVQYXJzZXIuZnJvbVRpbWV6b25lKGRhdGUsIG5nTW9kZWxPcHRpb25zLmdldE9wdGlvbigndGltZXpvbmUnKSk7XG4gICAgICBuZ01vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ2RhdGVEaXNhYmxlZCcsICFkYXRlIHx8XG4gICAgICAgIHRoaXMuZWxlbWVudCAmJiAhdGhpcy5pc0Rpc2FibGVkKGRhdGUpKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5jcmVhdGVEYXRlT2JqZWN0ID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XG4gICAgdmFyIG1vZGVsID0gbmdNb2RlbEN0cmwuJHZpZXdWYWx1ZSA/IG5ldyBEYXRlKG5nTW9kZWxDdHJsLiR2aWV3VmFsdWUpIDogbnVsbDtcbiAgICBtb2RlbCA9IGRhdGVQYXJzZXIuZnJvbVRpbWV6b25lKG1vZGVsLCBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ3RpbWV6b25lJykpO1xuICAgIHZhciB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgdG9kYXkgPSBkYXRlUGFyc2VyLmZyb21UaW1lem9uZSh0b2RheSwgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpKTtcbiAgICB2YXIgdGltZSA9IHRoaXMuY29tcGFyZShkYXRlLCB0b2RheSk7XG4gICAgdmFyIGR0ID0ge1xuICAgICAgZGF0ZTogZGF0ZSxcbiAgICAgIGxhYmVsOiBkYXRlUGFyc2VyLmZpbHRlcihkYXRlLCBmb3JtYXQpLFxuICAgICAgc2VsZWN0ZWQ6IG1vZGVsICYmIHRoaXMuY29tcGFyZShkYXRlLCBtb2RlbCkgPT09IDAsXG4gICAgICBkaXNhYmxlZDogdGhpcy5pc0Rpc2FibGVkKGRhdGUpLFxuICAgICAgcGFzdDogdGltZSA8IDAsXG4gICAgICBjdXJyZW50OiB0aW1lID09PSAwLFxuICAgICAgZnV0dXJlOiB0aW1lID4gMCxcbiAgICAgIGN1c3RvbUNsYXNzOiB0aGlzLmN1c3RvbUNsYXNzKGRhdGUpIHx8IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKG1vZGVsICYmIHRoaXMuY29tcGFyZShkYXRlLCBtb2RlbCkgPT09IDApIHtcbiAgICAgICRzY29wZS5zZWxlY3RlZER0ID0gZHQ7XG4gICAgfVxuXG4gICAgaWYgKHNlbGYuYWN0aXZlRGF0ZSAmJiB0aGlzLmNvbXBhcmUoZHQuZGF0ZSwgc2VsZi5hY3RpdmVEYXRlKSA9PT0gMCkge1xuICAgICAgJHNjb3BlLmFjdGl2ZUR0ID0gZHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGR0O1xuICB9O1xuXG4gIHRoaXMuaXNEaXNhYmxlZCA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gJHNjb3BlLmRpc2FibGVkIHx8XG4gICAgICB0aGlzLm1pbkRhdGUgJiYgdGhpcy5jb21wYXJlKGRhdGUsIHRoaXMubWluRGF0ZSkgPCAwIHx8XG4gICAgICB0aGlzLm1heERhdGUgJiYgdGhpcy5jb21wYXJlKGRhdGUsIHRoaXMubWF4RGF0ZSkgPiAwIHx8XG4gICAgICAkc2NvcGUuZGF0ZURpc2FibGVkICYmICRzY29wZS5kYXRlRGlzYWJsZWQoe2RhdGU6IGRhdGUsIG1vZGU6ICRzY29wZS5kYXRlcGlja2VyTW9kZX0pO1xuICB9O1xuXG4gIHRoaXMuY3VzdG9tQ2xhc3MgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgcmV0dXJuICRzY29wZS5jdXN0b21DbGFzcyh7ZGF0ZTogZGF0ZSwgbW9kZTogJHNjb3BlLmRhdGVwaWNrZXJNb2RlfSk7XG4gIH07XG5cbiAgLy8gU3BsaXQgYXJyYXkgaW50byBzbWFsbGVyIGFycmF5c1xuICB0aGlzLnNwbGl0ID0gZnVuY3Rpb24oYXJyLCBzaXplKSB7XG4gICAgdmFyIGFycmF5cyA9IFtdO1xuICAgIHdoaWxlIChhcnIubGVuZ3RoID4gMCkge1xuICAgICAgYXJyYXlzLnB1c2goYXJyLnNwbGljZSgwLCBzaXplKSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheXM7XG4gIH07XG5cbiAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBpZiAoJHNjb3BlLmRhdGVwaWNrZXJNb2RlID09PSBzZWxmLm1pbk1vZGUpIHtcbiAgICAgIHZhciBkdCA9IG5nTW9kZWxDdHJsLiR2aWV3VmFsdWUgPyBkYXRlUGFyc2VyLmZyb21UaW1lem9uZShuZXcgRGF0ZShuZ01vZGVsQ3RybC4kdmlld1ZhbHVlKSwgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpKSA6IG5ldyBEYXRlKDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgICAgZHQuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpKTtcbiAgICAgIGR0ID0gZGF0ZVBhcnNlci50b1RpbWV6b25lKGR0LCBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ3RpbWV6b25lJykpO1xuICAgICAgbmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZShkdCk7XG4gICAgICBuZ01vZGVsQ3RybC4kcmVuZGVyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuYWN0aXZlRGF0ZSA9IGRhdGU7XG4gICAgICBzZXRNb2RlKHNlbGYubW9kZXNbc2VsZi5tb2Rlcy5pbmRleE9mKCRzY29wZS5kYXRlcGlja2VyTW9kZSkgLSAxXSk7XG5cbiAgICAgICRzY29wZS4kZW1pdCgndWliOmRhdGVwaWNrZXIubW9kZScpO1xuICAgIH1cblxuICAgICRzY29wZS4kYnJvYWRjYXN0KCd1aWI6ZGF0ZXBpY2tlci5mb2N1cycpO1xuICB9O1xuXG4gICRzY29wZS5tb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgdmFyIHllYXIgPSBzZWxmLmFjdGl2ZURhdGUuZ2V0RnVsbFllYXIoKSArIGRpcmVjdGlvbiAqIChzZWxmLnN0ZXAueWVhcnMgfHwgMCksXG4gICAgICAgIG1vbnRoID0gc2VsZi5hY3RpdmVEYXRlLmdldE1vbnRoKCkgKyBkaXJlY3Rpb24gKiAoc2VsZi5zdGVwLm1vbnRocyB8fCAwKTtcbiAgICBzZWxmLmFjdGl2ZURhdGUuc2V0RnVsbFllYXIoeWVhciwgbW9udGgsIDEpO1xuICAgIHNlbGYucmVmcmVzaFZpZXcoKTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlTW9kZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiB8fCAxO1xuXG4gICAgaWYgKCRzY29wZS5kYXRlcGlja2VyTW9kZSA9PT0gc2VsZi5tYXhNb2RlICYmIGRpcmVjdGlvbiA9PT0gMSB8fFxuICAgICAgJHNjb3BlLmRhdGVwaWNrZXJNb2RlID09PSBzZWxmLm1pbk1vZGUgJiYgZGlyZWN0aW9uID09PSAtMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldE1vZGUoc2VsZi5tb2Rlc1tzZWxmLm1vZGVzLmluZGV4T2YoJHNjb3BlLmRhdGVwaWNrZXJNb2RlKSArIGRpcmVjdGlvbl0pO1xuXG4gICAgJHNjb3BlLiRlbWl0KCd1aWI6ZGF0ZXBpY2tlci5tb2RlJyk7XG4gIH07XG5cbiAgLy8gS2V5IGV2ZW50IG1hcHBlclxuICAkc2NvcGUua2V5cyA9IHsgMTM6ICdlbnRlcicsIDMyOiAnc3BhY2UnLCAzMzogJ3BhZ2V1cCcsIDM0OiAncGFnZWRvd24nLCAzNTogJ2VuZCcsIDM2OiAnaG9tZScsIDM3OiAnbGVmdCcsIDM4OiAndXAnLCAzOTogJ3JpZ2h0JywgNDA6ICdkb3duJyB9O1xuXG4gIHZhciBmb2N1c0VsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmVsZW1lbnRbMF0uZm9jdXMoKTtcbiAgfTtcblxuICAvLyBMaXN0ZW4gZm9yIGZvY3VzIHJlcXVlc3RzIGZyb20gcG9wdXAgZGlyZWN0aXZlXG4gICRzY29wZS4kb24oJ3VpYjpkYXRlcGlja2VyLmZvY3VzJywgZm9jdXNFbGVtZW50KTtcblxuICAkc2NvcGUua2V5ZG93biA9IGZ1bmN0aW9uKGV2dCkge1xuICAgIHZhciBrZXkgPSAkc2NvcGUua2V5c1tldnQud2hpY2hdO1xuXG4gICAgaWYgKCFrZXkgfHwgZXZ0LnNoaWZ0S2V5IHx8IGV2dC5hbHRLZXkgfHwgJHNjb3BlLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCFzZWxmLnNob3J0Y3V0UHJvcGFnYXRpb24pIHtcbiAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5ID09PSAnZW50ZXInIHx8IGtleSA9PT0gJ3NwYWNlJykge1xuICAgICAgaWYgKHNlbGYuaXNEaXNhYmxlZChzZWxmLmFjdGl2ZURhdGUpKSB7XG4gICAgICAgIHJldHVybjsgLy8gZG8gbm90aGluZ1xuICAgICAgfVxuICAgICAgJHNjb3BlLnNlbGVjdChzZWxmLmFjdGl2ZURhdGUpO1xuICAgIH0gZWxzZSBpZiAoZXZ0LmN0cmxLZXkgJiYgKGtleSA9PT0gJ3VwJyB8fCBrZXkgPT09ICdkb3duJykpIHtcbiAgICAgICRzY29wZS50b2dnbGVNb2RlKGtleSA9PT0gJ3VwJyA/IDEgOiAtMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuaGFuZGxlS2V5RG93bihrZXksIGV2dCk7XG4gICAgICBzZWxmLnJlZnJlc2hWaWV3KCk7XG4gICAgfVxuICB9O1xuXG4gICRlbGVtZW50Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICRzY29wZS5rZXlkb3duKGV2dCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgLy9DbGVhciBhbGwgd2F0Y2ggbGlzdGVuZXJzIG9uIGRlc3Ryb3lcbiAgICB3aGlsZSAod2F0Y2hMaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICB3YXRjaExpc3RlbmVycy5zaGlmdCgpKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBzZXRNb2RlKG1vZGUpIHtcbiAgICAkc2NvcGUuZGF0ZXBpY2tlck1vZGUgPSBtb2RlO1xuICAgICRzY29wZS5kYXRlcGlja2VyT3B0aW9ucy5kYXRlcGlja2VyTW9kZSA9IG1vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0T3B0aW9ucyhuZ01vZGVsQ3RybCkge1xuICAgIHZhciBuZ01vZGVsT3B0aW9ucztcblxuICAgIGlmIChhbmd1bGFyLnZlcnNpb24ubWlub3IgPCA2KSB7IC8vIGluIGFuZ3VsYXIgPCAxLjYgJG9wdGlvbnMgY291bGQgYmUgbWlzc2luZ1xuICAgICAgLy8gZ3VhcmFudGVlIGEgdmFsdWVcbiAgICAgIG5nTW9kZWxPcHRpb25zID0gbmdNb2RlbEN0cmwuJG9wdGlvbnMgfHxcbiAgICAgICAgJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zLm5nTW9kZWxPcHRpb25zIHx8XG4gICAgICAgIGRhdGVwaWNrZXJDb25maWcubmdNb2RlbE9wdGlvbnMgfHxcbiAgICAgICAge307XG5cbiAgICAgIC8vIG1pbWljIDEuNisgYXBpXG4gICAgICBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBuZ01vZGVsT3B0aW9uc1trZXldO1xuICAgICAgfTtcbiAgICB9IGVsc2UgeyAvLyBpbiBhbmd1bGFyID49MS42ICRvcHRpb25zIGlzIGFsd2F5cyBwcmVzZW50XG4gICAgICAvLyBuZy1tb2RlbC1vcHRpb25zIGRlZmF1bHRzIHRpbWV6b25lIHRvIG51bGw7IGRvbid0IGxldCBpdHMgcHJlY2VkZW5jZSBzcXVhc2ggYSBub24tbnVsbCB2YWx1ZVxuICAgICAgdmFyIHRpbWV6b25lID0gbmdNb2RlbEN0cmwuJG9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpIHx8XG4gICAgICAgICgkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMubmdNb2RlbE9wdGlvbnMgPyAkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMubmdNb2RlbE9wdGlvbnMudGltZXpvbmUgOiBudWxsKSB8fFxuICAgICAgICAoZGF0ZXBpY2tlckNvbmZpZy5uZ01vZGVsT3B0aW9ucyA/IGRhdGVwaWNrZXJDb25maWcubmdNb2RlbE9wdGlvbnMudGltZXpvbmUgOiBudWxsKTtcblxuICAgICAgLy8gdmFsdWVzIHBhc3NlZCB0byBjcmVhdGVDaGlsZCBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXNcbiAgICAgIG5nTW9kZWxPcHRpb25zID0gbmdNb2RlbEN0cmwuJG9wdGlvbnMgLy8gc3RhcnQgd2l0aCBhIE1vZGVsT3B0aW9ucyBpbnN0YW5jZVxuICAgICAgICAuY3JlYXRlQ2hpbGQoZGF0ZXBpY2tlckNvbmZpZy5uZ01vZGVsT3B0aW9ucykgLy8gbG93ZXN0IHByZWNlZGVuY2VcbiAgICAgICAgLmNyZWF0ZUNoaWxkKCRzY29wZS5kYXRlcGlja2VyT3B0aW9ucy5uZ01vZGVsT3B0aW9ucylcbiAgICAgICAgLmNyZWF0ZUNoaWxkKG5nTW9kZWxDdHJsLiRvcHRpb25zKSAvLyBoaWdoZXN0IHByZWNlZGVuY2VcbiAgICAgICAgLmNyZWF0ZUNoaWxkKHt0aW1lem9uZTogdGltZXpvbmV9KTsgLy8gdG8ga2VlcCBmcm9tIHNxdWFzaGluZyBhIG5vbi1udWxsIHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5nTW9kZWxPcHRpb25zO1xuICB9XG59XSlcblxuLmNvbnRyb2xsZXIoJ1VpYkRheXBpY2tlckNvbnRyb2xsZXInLCBbJyRzY29wZScsICckZWxlbWVudCcsICdkYXRlRmlsdGVyJywgZnVuY3Rpb24oc2NvcGUsICRlbGVtZW50LCBkYXRlRmlsdGVyKSB7XG4gIHZhciBEQVlTX0lOX01PTlRIID0gWzMxLCAyOCwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdO1xuXG4gIHRoaXMuc3RlcCA9IHsgbW9udGhzOiAxIH07XG4gIHRoaXMuZWxlbWVudCA9ICRlbGVtZW50O1xuICBmdW5jdGlvbiBnZXREYXlzSW5Nb250aCh5ZWFyLCBtb250aCkge1xuICAgIHJldHVybiBtb250aCA9PT0gMSAmJiB5ZWFyICUgNCA9PT0gMCAmJlxuICAgICAgKHllYXIgJSAxMDAgIT09IDAgfHwgeWVhciAlIDQwMCA9PT0gMCkgPyAyOSA6IERBWVNfSU5fTU9OVEhbbW9udGhdO1xuICB9XG5cbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24oY3RybCkge1xuICAgIGFuZ3VsYXIuZXh0ZW5kKGN0cmwsIHRoaXMpO1xuICAgIHNjb3BlLnNob3dXZWVrcyA9IGN0cmwuc2hvd1dlZWtzO1xuICAgIGN0cmwucmVmcmVzaFZpZXcoKTtcbiAgfTtcblxuICB0aGlzLmdldERhdGVzID0gZnVuY3Rpb24oc3RhcnREYXRlLCBuKSB7XG4gICAgdmFyIGRhdGVzID0gbmV3IEFycmF5KG4pLCBjdXJyZW50ID0gbmV3IERhdGUoc3RhcnREYXRlKSwgaSA9IDAsIGRhdGU7XG4gICAgd2hpbGUgKGkgPCBuKSB7XG4gICAgICBkYXRlID0gbmV3IERhdGUoY3VycmVudCk7XG4gICAgICBkYXRlc1tpKytdID0gZGF0ZTtcbiAgICAgIGN1cnJlbnQuc2V0RGF0ZShjdXJyZW50LmdldERhdGUoKSArIDEpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0ZXM7XG4gIH07XG5cbiAgdGhpcy5fcmVmcmVzaFZpZXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgeWVhciA9IHRoaXMuYWN0aXZlRGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgbW9udGggPSB0aGlzLmFjdGl2ZURhdGUuZ2V0TW9udGgoKSxcbiAgICAgIGZpcnN0RGF5T2ZNb250aCA9IG5ldyBEYXRlKHRoaXMuYWN0aXZlRGF0ZSk7XG5cbiAgICBmaXJzdERheU9mTW9udGguc2V0RnVsbFllYXIoeWVhciwgbW9udGgsIDEpO1xuXG4gICAgdmFyIGRpZmZlcmVuY2UgPSB0aGlzLnN0YXJ0aW5nRGF5IC0gZmlyc3REYXlPZk1vbnRoLmdldERheSgpLFxuICAgICAgbnVtRGlzcGxheWVkRnJvbVByZXZpb3VzTW9udGggPSBkaWZmZXJlbmNlID4gMCA/XG4gICAgICAgIDcgLSBkaWZmZXJlbmNlIDogLSBkaWZmZXJlbmNlLFxuICAgICAgZmlyc3REYXRlID0gbmV3IERhdGUoZmlyc3REYXlPZk1vbnRoKTtcblxuICAgIGlmIChudW1EaXNwbGF5ZWRGcm9tUHJldmlvdXNNb250aCA+IDApIHtcbiAgICAgIGZpcnN0RGF0ZS5zZXREYXRlKC1udW1EaXNwbGF5ZWRGcm9tUHJldmlvdXNNb250aCArIDEpO1xuICAgIH1cblxuICAgIC8vIDQyIGlzIHRoZSBudW1iZXIgb2YgZGF5cyBvbiBhIHNpeC13ZWVrIGNhbGVuZGFyXG4gICAgdmFyIGRheXMgPSB0aGlzLmdldERhdGVzKGZpcnN0RGF0ZSwgNDIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDI7IGkgKyspIHtcbiAgICAgIGRheXNbaV0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLmNyZWF0ZURhdGVPYmplY3QoZGF5c1tpXSwgdGhpcy5mb3JtYXREYXkpLCB7XG4gICAgICAgIHNlY29uZGFyeTogZGF5c1tpXS5nZXRNb250aCgpICE9PSBtb250aCxcbiAgICAgICAgdWlkOiBzY29wZS51bmlxdWVJZCArICctJyArIGlcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHNjb3BlLmxhYmVscyA9IG5ldyBBcnJheSg3KTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDc7IGorKykge1xuICAgICAgc2NvcGUubGFiZWxzW2pdID0ge1xuICAgICAgICBhYmJyOiBkYXRlRmlsdGVyKGRheXNbal0uZGF0ZSwgdGhpcy5mb3JtYXREYXlIZWFkZXIpLFxuICAgICAgICBmdWxsOiBkYXRlRmlsdGVyKGRheXNbal0uZGF0ZSwgJ0VFRUUnKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBzY29wZS50aXRsZSA9IGRhdGVGaWx0ZXIodGhpcy5hY3RpdmVEYXRlLCB0aGlzLmZvcm1hdERheVRpdGxlKTtcbiAgICBzY29wZS5yb3dzID0gdGhpcy5zcGxpdChkYXlzLCA3KTtcblxuICAgIGlmIChzY29wZS5zaG93V2Vla3MpIHtcbiAgICAgIHNjb3BlLndlZWtOdW1iZXJzID0gW107XG4gICAgICB2YXIgdGh1cnNkYXlJbmRleCA9ICg0ICsgNyAtIHRoaXMuc3RhcnRpbmdEYXkpICUgNyxcbiAgICAgICAgICBudW1XZWVrcyA9IHNjb3BlLnJvd3MubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgY3VyV2VlayA9IDA7IGN1cldlZWsgPCBudW1XZWVrczsgY3VyV2VlaysrKSB7XG4gICAgICAgIHNjb3BlLndlZWtOdW1iZXJzLnB1c2goXG4gICAgICAgICAgZ2V0SVNPODYwMVdlZWtOdW1iZXIoc2NvcGUucm93c1tjdXJXZWVrXVt0aHVyc2RheUluZGV4XS5kYXRlKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHRoaXMuY29tcGFyZSA9IGZ1bmN0aW9uKGRhdGUxLCBkYXRlMikge1xuICAgIHZhciBfZGF0ZTEgPSBuZXcgRGF0ZShkYXRlMS5nZXRGdWxsWWVhcigpLCBkYXRlMS5nZXRNb250aCgpLCBkYXRlMS5nZXREYXRlKCkpO1xuICAgIHZhciBfZGF0ZTIgPSBuZXcgRGF0ZShkYXRlMi5nZXRGdWxsWWVhcigpLCBkYXRlMi5nZXRNb250aCgpLCBkYXRlMi5nZXREYXRlKCkpO1xuICAgIF9kYXRlMS5zZXRGdWxsWWVhcihkYXRlMS5nZXRGdWxsWWVhcigpKTtcbiAgICBfZGF0ZTIuc2V0RnVsbFllYXIoZGF0ZTIuZ2V0RnVsbFllYXIoKSk7XG4gICAgcmV0dXJuIF9kYXRlMSAtIF9kYXRlMjtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRJU084NjAxV2Vla051bWJlcihkYXRlKSB7XG4gICAgdmFyIGNoZWNrRGF0ZSA9IG5ldyBEYXRlKGRhdGUpO1xuICAgIGNoZWNrRGF0ZS5zZXREYXRlKGNoZWNrRGF0ZS5nZXREYXRlKCkgKyA0IC0gKGNoZWNrRGF0ZS5nZXREYXkoKSB8fCA3KSk7IC8vIFRodXJzZGF5XG4gICAgdmFyIHRpbWUgPSBjaGVja0RhdGUuZ2V0VGltZSgpO1xuICAgIGNoZWNrRGF0ZS5zZXRNb250aCgwKTsgLy8gQ29tcGFyZSB3aXRoIEphbiAxXG4gICAgY2hlY2tEYXRlLnNldERhdGUoMSk7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yb3VuZCgodGltZSAtIGNoZWNrRGF0ZSkgLyA4NjQwMDAwMCkgLyA3KSArIDE7XG4gIH1cblxuICB0aGlzLmhhbmRsZUtleURvd24gPSBmdW5jdGlvbihrZXksIGV2dCkge1xuICAgIHZhciBkYXRlID0gdGhpcy5hY3RpdmVEYXRlLmdldERhdGUoKTtcblxuICAgIGlmIChrZXkgPT09ICdsZWZ0Jykge1xuICAgICAgZGF0ZSA9IGRhdGUgLSAxO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAndXAnKSB7XG4gICAgICBkYXRlID0gZGF0ZSAtIDc7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdyaWdodCcpIHtcbiAgICAgIGRhdGUgPSBkYXRlICsgMTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2Rvd24nKSB7XG4gICAgICBkYXRlID0gZGF0ZSArIDc7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdwYWdldXAnIHx8IGtleSA9PT0gJ3BhZ2Vkb3duJykge1xuICAgICAgdmFyIG1vbnRoID0gdGhpcy5hY3RpdmVEYXRlLmdldE1vbnRoKCkgKyAoa2V5ID09PSAncGFnZXVwJyA/IC0gMSA6IDEpO1xuICAgICAgdGhpcy5hY3RpdmVEYXRlLnNldE1vbnRoKG1vbnRoLCAxKTtcbiAgICAgIGRhdGUgPSBNYXRoLm1pbihnZXREYXlzSW5Nb250aCh0aGlzLmFjdGl2ZURhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5hY3RpdmVEYXRlLmdldE1vbnRoKCkpLCBkYXRlKTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2hvbWUnKSB7XG4gICAgICBkYXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2VuZCcpIHtcbiAgICAgIGRhdGUgPSBnZXREYXlzSW5Nb250aCh0aGlzLmFjdGl2ZURhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5hY3RpdmVEYXRlLmdldE1vbnRoKCkpO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZURhdGUuc2V0RGF0ZShkYXRlKTtcbiAgfTtcbn1dKVxuXG4uY29udHJvbGxlcignVWliTW9udGhwaWNrZXJDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnZGF0ZUZpbHRlcicsIGZ1bmN0aW9uKHNjb3BlLCAkZWxlbWVudCwgZGF0ZUZpbHRlcikge1xuICB0aGlzLnN0ZXAgPSB7IHllYXJzOiAxIH07XG4gIHRoaXMuZWxlbWVudCA9ICRlbGVtZW50O1xuXG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKGN0cmwpIHtcbiAgICBhbmd1bGFyLmV4dGVuZChjdHJsLCB0aGlzKTtcbiAgICBjdHJsLnJlZnJlc2hWaWV3KCk7XG4gIH07XG5cbiAgdGhpcy5fcmVmcmVzaFZpZXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9udGhzID0gbmV3IEFycmF5KDEyKSxcbiAgICAgICAgeWVhciA9IHRoaXMuYWN0aXZlRGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgICBkYXRlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICBkYXRlID0gbmV3IERhdGUodGhpcy5hY3RpdmVEYXRlKTtcbiAgICAgIGRhdGUuc2V0RnVsbFllYXIoeWVhciwgaSwgMSk7XG4gICAgICBtb250aHNbaV0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLmNyZWF0ZURhdGVPYmplY3QoZGF0ZSwgdGhpcy5mb3JtYXRNb250aCksIHtcbiAgICAgICAgdWlkOiBzY29wZS51bmlxdWVJZCArICctJyArIGlcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHNjb3BlLnRpdGxlID0gZGF0ZUZpbHRlcih0aGlzLmFjdGl2ZURhdGUsIHRoaXMuZm9ybWF0TW9udGhUaXRsZSk7XG4gICAgc2NvcGUucm93cyA9IHRoaXMuc3BsaXQobW9udGhzLCB0aGlzLm1vbnRoQ29sdW1ucyk7XG4gICAgc2NvcGUueWVhckhlYWRlckNvbHNwYW4gPSB0aGlzLm1vbnRoQ29sdW1ucyA+IDMgPyB0aGlzLm1vbnRoQ29sdW1ucyAtIDIgOiAxO1xuICB9O1xuXG4gIHRoaXMuY29tcGFyZSA9IGZ1bmN0aW9uKGRhdGUxLCBkYXRlMikge1xuICAgIHZhciBfZGF0ZTEgPSBuZXcgRGF0ZShkYXRlMS5nZXRGdWxsWWVhcigpLCBkYXRlMS5nZXRNb250aCgpKTtcbiAgICB2YXIgX2RhdGUyID0gbmV3IERhdGUoZGF0ZTIuZ2V0RnVsbFllYXIoKSwgZGF0ZTIuZ2V0TW9udGgoKSk7XG4gICAgX2RhdGUxLnNldEZ1bGxZZWFyKGRhdGUxLmdldEZ1bGxZZWFyKCkpO1xuICAgIF9kYXRlMi5zZXRGdWxsWWVhcihkYXRlMi5nZXRGdWxsWWVhcigpKTtcbiAgICByZXR1cm4gX2RhdGUxIC0gX2RhdGUyO1xuICB9O1xuXG4gIHRoaXMuaGFuZGxlS2V5RG93biA9IGZ1bmN0aW9uKGtleSwgZXZ0KSB7XG4gICAgdmFyIGRhdGUgPSB0aGlzLmFjdGl2ZURhdGUuZ2V0TW9udGgoKTtcblxuICAgIGlmIChrZXkgPT09ICdsZWZ0Jykge1xuICAgICAgZGF0ZSA9IGRhdGUgLSAxO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAndXAnKSB7XG4gICAgICBkYXRlID0gZGF0ZSAtIHRoaXMubW9udGhDb2x1bW5zO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAncmlnaHQnKSB7XG4gICAgICBkYXRlID0gZGF0ZSArIDE7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdkb3duJykge1xuICAgICAgZGF0ZSA9IGRhdGUgKyB0aGlzLm1vbnRoQ29sdW1ucztcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3BhZ2V1cCcgfHwga2V5ID09PSAncGFnZWRvd24nKSB7XG4gICAgICB2YXIgeWVhciA9IHRoaXMuYWN0aXZlRGF0ZS5nZXRGdWxsWWVhcigpICsgKGtleSA9PT0gJ3BhZ2V1cCcgPyAtIDEgOiAxKTtcbiAgICAgIHRoaXMuYWN0aXZlRGF0ZS5zZXRGdWxsWWVhcih5ZWFyKTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2hvbWUnKSB7XG4gICAgICBkYXRlID0gMDtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2VuZCcpIHtcbiAgICAgIGRhdGUgPSAxMTtcbiAgICB9XG4gICAgdGhpcy5hY3RpdmVEYXRlLnNldE1vbnRoKGRhdGUpO1xuICB9O1xufV0pXG5cbi5jb250cm9sbGVyKCdVaWJZZWFycGlja2VyQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRlbGVtZW50JywgJ2RhdGVGaWx0ZXInLCBmdW5jdGlvbihzY29wZSwgJGVsZW1lbnQsIGRhdGVGaWx0ZXIpIHtcbiAgdmFyIGNvbHVtbnMsIHJhbmdlO1xuICB0aGlzLmVsZW1lbnQgPSAkZWxlbWVudDtcblxuICBmdW5jdGlvbiBnZXRTdGFydGluZ1llYXIoeWVhcikge1xuICAgIHJldHVybiBwYXJzZUludCgoeWVhciAtIDEpIC8gcmFuZ2UsIDEwKSAqIHJhbmdlICsgMTtcbiAgfVxuXG4gIHRoaXMueWVhcnBpY2tlckluaXQgPSBmdW5jdGlvbigpIHtcbiAgICBjb2x1bW5zID0gdGhpcy55ZWFyQ29sdW1ucztcbiAgICByYW5nZSA9IHRoaXMueWVhclJvd3MgKiBjb2x1bW5zO1xuICAgIHRoaXMuc3RlcCA9IHsgeWVhcnM6IHJhbmdlIH07XG4gIH07XG5cbiAgdGhpcy5fcmVmcmVzaFZpZXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgeWVhcnMgPSBuZXcgQXJyYXkocmFuZ2UpLCBkYXRlO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIHN0YXJ0ID0gZ2V0U3RhcnRpbmdZZWFyKHRoaXMuYWN0aXZlRGF0ZS5nZXRGdWxsWWVhcigpKTsgaSA8IHJhbmdlOyBpKyspIHtcbiAgICAgIGRhdGUgPSBuZXcgRGF0ZSh0aGlzLmFjdGl2ZURhdGUpO1xuICAgICAgZGF0ZS5zZXRGdWxsWWVhcihzdGFydCArIGksIDAsIDEpO1xuICAgICAgeWVhcnNbaV0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLmNyZWF0ZURhdGVPYmplY3QoZGF0ZSwgdGhpcy5mb3JtYXRZZWFyKSwge1xuICAgICAgICB1aWQ6IHNjb3BlLnVuaXF1ZUlkICsgJy0nICsgaVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2NvcGUudGl0bGUgPSBbeWVhcnNbMF0ubGFiZWwsIHllYXJzW3JhbmdlIC0gMV0ubGFiZWxdLmpvaW4oJyAtICcpO1xuICAgIHNjb3BlLnJvd3MgPSB0aGlzLnNwbGl0KHllYXJzLCBjb2x1bW5zKTtcbiAgICBzY29wZS5jb2x1bW5zID0gY29sdW1ucztcbiAgfTtcblxuICB0aGlzLmNvbXBhcmUgPSBmdW5jdGlvbihkYXRlMSwgZGF0ZTIpIHtcbiAgICByZXR1cm4gZGF0ZTEuZ2V0RnVsbFllYXIoKSAtIGRhdGUyLmdldEZ1bGxZZWFyKCk7XG4gIH07XG5cbiAgdGhpcy5oYW5kbGVLZXlEb3duID0gZnVuY3Rpb24oa2V5LCBldnQpIHtcbiAgICB2YXIgZGF0ZSA9IHRoaXMuYWN0aXZlRGF0ZS5nZXRGdWxsWWVhcigpO1xuXG4gICAgaWYgKGtleSA9PT0gJ2xlZnQnKSB7XG4gICAgICBkYXRlID0gZGF0ZSAtIDE7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICd1cCcpIHtcbiAgICAgIGRhdGUgPSBkYXRlIC0gY29sdW1ucztcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3JpZ2h0Jykge1xuICAgICAgZGF0ZSA9IGRhdGUgKyAxO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnZG93bicpIHtcbiAgICAgIGRhdGUgPSBkYXRlICsgY29sdW1ucztcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3BhZ2V1cCcgfHwga2V5ID09PSAncGFnZWRvd24nKSB7XG4gICAgICBkYXRlICs9IChrZXkgPT09ICdwYWdldXAnID8gLSAxIDogMSkgKiByYW5nZTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2hvbWUnKSB7XG4gICAgICBkYXRlID0gZ2V0U3RhcnRpbmdZZWFyKHRoaXMuYWN0aXZlRGF0ZS5nZXRGdWxsWWVhcigpKTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2VuZCcpIHtcbiAgICAgIGRhdGUgPSBnZXRTdGFydGluZ1llYXIodGhpcy5hY3RpdmVEYXRlLmdldEZ1bGxZZWFyKCkpICsgcmFuZ2UgLSAxO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZURhdGUuc2V0RnVsbFllYXIoZGF0ZSk7XG4gIH07XG59XSlcblxuLmRpcmVjdGl2ZSgndWliRGF0ZXBpY2tlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHRlbXBsYXRlVXJsOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xuICAgICAgcmV0dXJuIGF0dHJzLnRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci9kYXRlcGlja2VyLmh0bWwnO1xuICAgIH0sXG4gICAgc2NvcGU6IHtcbiAgICAgIGRhdGVwaWNrZXJPcHRpb25zOiAnPT8nXG4gICAgfSxcbiAgICByZXF1aXJlOiBbJ3VpYkRhdGVwaWNrZXInLCAnXm5nTW9kZWwnXSxcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIGNvbnRyb2xsZXI6ICdVaWJEYXRlcGlja2VyQ29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAnZGF0ZXBpY2tlcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgdmFyIGRhdGVwaWNrZXJDdHJsID0gY3RybHNbMF0sIG5nTW9kZWxDdHJsID0gY3RybHNbMV07XG5cbiAgICAgIGRhdGVwaWNrZXJDdHJsLmluaXQobmdNb2RlbEN0cmwpO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5kaXJlY3RpdmUoJ3VpYkRheXBpY2tlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHRlbXBsYXRlVXJsOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xuICAgICAgcmV0dXJuIGF0dHJzLnRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci9kYXkuaHRtbCc7XG4gICAgfSxcbiAgICByZXF1aXJlOiBbJ151aWJEYXRlcGlja2VyJywgJ3VpYkRheXBpY2tlciddLFxuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgY29udHJvbGxlcjogJ1VpYkRheXBpY2tlckNvbnRyb2xsZXInLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY3RybHMpIHtcbiAgICAgIHZhciBkYXRlcGlja2VyQ3RybCA9IGN0cmxzWzBdLFxuICAgICAgICBkYXlwaWNrZXJDdHJsID0gY3RybHNbMV07XG5cbiAgICAgIGRheXBpY2tlckN0cmwuaW5pdChkYXRlcGlja2VyQ3RybCk7XG4gICAgfVxuICB9O1xufSlcblxuLmRpcmVjdGl2ZSgndWliTW9udGhwaWNrZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCAndWliL3RlbXBsYXRlL2RhdGVwaWNrZXIvbW9udGguaHRtbCc7XG4gICAgfSxcbiAgICByZXF1aXJlOiBbJ151aWJEYXRlcGlja2VyJywgJ3VpYk1vbnRocGlja2VyJ10sXG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBjb250cm9sbGVyOiAnVWliTW9udGhwaWNrZXJDb250cm9sbGVyJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGN0cmxzKSB7XG4gICAgICB2YXIgZGF0ZXBpY2tlckN0cmwgPSBjdHJsc1swXSxcbiAgICAgICAgbW9udGhwaWNrZXJDdHJsID0gY3RybHNbMV07XG5cbiAgICAgIG1vbnRocGlja2VyQ3RybC5pbml0KGRhdGVwaWNrZXJDdHJsKTtcbiAgICB9XG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJZZWFycGlja2VyJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgdGVtcGxhdGVVcmw6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICByZXR1cm4gYXR0cnMudGVtcGxhdGVVcmwgfHwgJ3VpYi90ZW1wbGF0ZS9kYXRlcGlja2VyL3llYXIuaHRtbCc7XG4gICAgfSxcbiAgICByZXF1aXJlOiBbJ151aWJEYXRlcGlja2VyJywgJ3VpYlllYXJwaWNrZXInXSxcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIGNvbnRyb2xsZXI6ICdVaWJZZWFycGlja2VyQ29udHJvbGxlcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgdmFyIGN0cmwgPSBjdHJsc1swXTtcbiAgICAgIGFuZ3VsYXIuZXh0ZW5kKGN0cmwsIGN0cmxzWzFdKTtcbiAgICAgIGN0cmwueWVhcnBpY2tlckluaXQoKTtcblxuICAgICAgY3RybC5yZWZyZXNoVmlldygpO1xuICAgIH1cbiAgfTtcbn0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLnBvc2l0aW9uJywgW10pXG5cbi8qKlxuICogQSBzZXQgb2YgdXRpbGl0eSBtZXRob2RzIGZvciB3b3JraW5nIHdpdGggdGhlIERPTS5cbiAqIEl0IGlzIG1lYW50IHRvIGJlIHVzZWQgd2hlcmUgd2UgbmVlZCB0byBhYnNvbHV0ZS1wb3NpdGlvbiBlbGVtZW50cyBpblxuICogcmVsYXRpb24gdG8gYW5vdGhlciBlbGVtZW50ICh0aGlzIGlzIHRoZSBjYXNlIGZvciB0b29sdGlwcywgcG9wb3ZlcnMsXG4gKiB0eXBlYWhlYWQgc3VnZ2VzdGlvbnMgZXRjLikuXG4gKi9cbiAgLmZhY3RvcnkoJyR1aWJQb3NpdGlvbicsIFsnJGRvY3VtZW50JywgJyR3aW5kb3cnLCBmdW5jdGlvbigkZG9jdW1lbnQsICR3aW5kb3cpIHtcbiAgICAvKipcbiAgICAgKiBVc2VkIGJ5IHNjcm9sbGJhcldpZHRoKCkgZnVuY3Rpb24gdG8gY2FjaGUgc2Nyb2xsYmFyJ3Mgd2lkdGguXG4gICAgICogRG8gbm90IGFjY2VzcyB0aGlzIHZhcmlhYmxlIGRpcmVjdGx5LCB1c2Ugc2Nyb2xsYmFyV2lkdGgoKSBpbnN0ZWFkLlxuICAgICAqL1xuICAgIHZhciBTQ1JPTExCQVJfV0lEVEg7XG4gICAgLyoqXG4gICAgICogc2Nyb2xsYmFyIG9uIGJvZHkgYW5kIGh0bWwgZWxlbWVudCBpbiBJRSBhbmQgRWRnZSBvdmVybGF5XG4gICAgICogY29udGVudCBhbmQgc2hvdWxkIGJlIGNvbnNpZGVyZWQgMCB3aWR0aC5cbiAgICAgKi9cbiAgICB2YXIgQk9EWV9TQ1JPTExCQVJfV0lEVEg7XG4gICAgdmFyIE9WRVJGTE9XX1JFR0VYID0ge1xuICAgICAgbm9ybWFsOiAvKGF1dG98c2Nyb2xsKS8sXG4gICAgICBoaWRkZW46IC8oYXV0b3xzY3JvbGx8aGlkZGVuKS9cbiAgICB9O1xuICAgIHZhciBQTEFDRU1FTlRfUkVHRVggPSB7XG4gICAgICBhdXRvOiAvXFxzP2F1dG8/XFxzPy9pLFxuICAgICAgcHJpbWFyeTogL14odG9wfGJvdHRvbXxsZWZ0fHJpZ2h0KSQvLFxuICAgICAgc2Vjb25kYXJ5OiAvXih0b3B8Ym90dG9tfGxlZnR8cmlnaHR8Y2VudGVyKSQvLFxuICAgICAgdmVydGljYWw6IC9eKHRvcHxib3R0b20pJC9cbiAgICB9O1xuICAgIHZhciBCT0RZX1JFR0VYID0gLyhIVE1MfEJPRFkpLztcblxuICAgIHJldHVybiB7XG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvdmlkZXMgYSByYXcgRE9NIGVsZW1lbnQgZnJvbSBhIGpRdWVyeS9qUUxpdGUgZWxlbWVudC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge2VsZW1lbnR9IGVsZW0gLSBUaGUgZWxlbWVudCB0byBjb252ZXJ0LlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtlbGVtZW50fSBBIEhUTUwgZWxlbWVudC5cbiAgICAgICAqL1xuICAgICAgZ2V0UmF3Tm9kZTogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICByZXR1cm4gZWxlbS5ub2RlTmFtZSA/IGVsZW0gOiBlbGVtWzBdIHx8IGVsZW07XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFByb3ZpZGVzIGEgcGFyc2VkIG51bWJlciBmb3IgYSBzdHlsZSBwcm9wZXJ0eS4gIFN0cmlwc1xuICAgICAgICogdW5pdHMgYW5kIGNhc3RzIGludmFsaWQgbnVtYmVycyB0byAwLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSBzdHlsZSB2YWx1ZSB0byBwYXJzZS5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBBIHZhbGlkIG51bWJlci5cbiAgICAgICAqL1xuICAgICAgcGFyc2VTdHlsZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGlzRmluaXRlKHZhbHVlKSA/IHZhbHVlIDogMDtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvdmlkZXMgdGhlIGNsb3Nlc3QgcG9zaXRpb25lZCBhbmNlc3Rvci5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge2VsZW1lbnR9IGVsZW1lbnQgLSBUaGUgZWxlbWVudCB0byBnZXQgdGhlIG9mZmVzdCBwYXJlbnQgZm9yLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtlbGVtZW50fSBUaGUgY2xvc2VzdCBwb3NpdGlvbmVkIGFuY2VzdG9yLlxuICAgICAgICovXG4gICAgICBvZmZzZXRQYXJlbnQ6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgZWxlbSA9IHRoaXMuZ2V0UmF3Tm9kZShlbGVtKTtcblxuICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgJGRvY3VtZW50WzBdLmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICBmdW5jdGlvbiBpc1N0YXRpY1Bvc2l0aW9uZWQoZWwpIHtcbiAgICAgICAgICByZXR1cm4gKCR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkucG9zaXRpb24gfHwgJ3N0YXRpYycpID09PSAnc3RhdGljJztcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgb2Zmc2V0UGFyZW50ICE9PSAkZG9jdW1lbnRbMF0uZG9jdW1lbnRFbGVtZW50ICYmIGlzU3RhdGljUG9zaXRpb25lZChvZmZzZXRQYXJlbnQpKSB7XG4gICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgJGRvY3VtZW50WzBdLmRvY3VtZW50RWxlbWVudDtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvdmlkZXMgdGhlIHNjcm9sbGJhciB3aWR0aCwgY29uY2VwdCBmcm9tIFRXQlMgbWVhc3VyZVNjcm9sbGJhcigpXG4gICAgICAgKiBmdW5jdGlvbiBpbiBodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvanMvbW9kYWwuanNcbiAgICAgICAqIEluIElFIGFuZCBFZGdlLCBzY29sbGJhciBvbiBib2R5IGFuZCBodG1sIGVsZW1lbnQgb3ZlcmxheSBhbmQgc2hvdWxkXG4gICAgICAgKiByZXR1cm4gYSB3aWR0aCBvZiAwLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSB3aWR0aCBvZiB0aGUgYnJvd3NlciBzY29sbGJhci5cbiAgICAgICAqL1xuICAgICAgc2Nyb2xsYmFyV2lkdGg6IGZ1bmN0aW9uKGlzQm9keSkge1xuICAgICAgICBpZiAoaXNCb2R5KSB7XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoQk9EWV9TQ1JPTExCQVJfV0lEVEgpKSB7XG4gICAgICAgICAgICB2YXIgYm9keUVsZW0gPSAkZG9jdW1lbnQuZmluZCgnYm9keScpO1xuICAgICAgICAgICAgYm9keUVsZW0uYWRkQ2xhc3MoJ3VpYi1wb3NpdGlvbi1ib2R5LXNjcm9sbGJhci1tZWFzdXJlJyk7XG4gICAgICAgICAgICBCT0RZX1NDUk9MTEJBUl9XSURUSCA9ICR3aW5kb3cuaW5uZXJXaWR0aCAtIGJvZHlFbGVtWzBdLmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgQk9EWV9TQ1JPTExCQVJfV0lEVEggPSBpc0Zpbml0ZShCT0RZX1NDUk9MTEJBUl9XSURUSCkgPyBCT0RZX1NDUk9MTEJBUl9XSURUSCA6IDA7XG4gICAgICAgICAgICBib2R5RWxlbS5yZW1vdmVDbGFzcygndWliLXBvc2l0aW9uLWJvZHktc2Nyb2xsYmFyLW1lYXN1cmUnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIEJPRFlfU0NST0xMQkFSX1dJRFRIO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoU0NST0xMQkFSX1dJRFRIKSkge1xuICAgICAgICAgIHZhciBzY3JvbGxFbGVtID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2IGNsYXNzPVwidWliLXBvc2l0aW9uLXNjcm9sbGJhci1tZWFzdXJlXCI+PC9kaXY+Jyk7XG4gICAgICAgICAgJGRvY3VtZW50LmZpbmQoJ2JvZHknKS5hcHBlbmQoc2Nyb2xsRWxlbSk7XG4gICAgICAgICAgU0NST0xMQkFSX1dJRFRIID0gc2Nyb2xsRWxlbVswXS5vZmZzZXRXaWR0aCAtIHNjcm9sbEVsZW1bMF0uY2xpZW50V2lkdGg7XG4gICAgICAgICAgU0NST0xMQkFSX1dJRFRIID0gaXNGaW5pdGUoU0NST0xMQkFSX1dJRFRIKSA/IFNDUk9MTEJBUl9XSURUSCA6IDA7XG4gICAgICAgICAgc2Nyb2xsRWxlbS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTQ1JPTExCQVJfV0lEVEg7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFByb3ZpZGVzIHRoZSBwYWRkaW5nIHJlcXVpcmVkIG9uIGFuIGVsZW1lbnQgdG8gcmVwbGFjZSB0aGUgc2Nyb2xsYmFyLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgICAqICAgPHVsPlxuICAgICAgICogICAgIDxsaT4qKnNjcm9sbGJhcldpZHRoKio6IHRoZSB3aWR0aCBvZiB0aGUgc2Nyb2xsYmFyPC9saT5cbiAgICAgICAqICAgICA8bGk+Kip3aWR0aE92ZXJmbG93Kio6IHdoZXRoZXIgdGhlIHRoZSB3aWR0aCBpcyBvdmVyZmxvd2luZzwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqcmlnaHQqKjogdGhlIGFtb3VudCBvZiByaWdodCBwYWRkaW5nIG9uIHRoZSBlbGVtZW50IG5lZWRlZCB0byByZXBsYWNlIHRoZSBzY3JvbGxiYXI8L2xpPlxuICAgICAgICogICAgIDxsaT4qKnJpZ2h0T3JpZ2luYWwqKjogdGhlIGFtb3VudCBvZiByaWdodCBwYWRkaW5nIGN1cnJlbnRseSBvbiB0aGUgZWxlbWVudDwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqaGVpZ2h0T3ZlcmZsb3cqKjogd2hldGhlciB0aGUgdGhlIGhlaWdodCBpcyBvdmVyZmxvd2luZzwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqYm90dG9tKio6IHRoZSBhbW91bnQgb2YgYm90dG9tIHBhZGRpbmcgb24gdGhlIGVsZW1lbnQgbmVlZGVkIHRvIHJlcGxhY2UgdGhlIHNjcm9sbGJhcjwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqYm90dG9tT3JpZ2luYWwqKjogdGhlIGFtb3VudCBvZiBib3R0b20gcGFkZGluZyBjdXJyZW50bHkgb24gdGhlIGVsZW1lbnQ8L2xpPlxuICAgICAgICogICA8L3VsPlxuICAgICAgICovXG4gICAgICBzY3JvbGxiYXJQYWRkaW5nOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgIGVsZW0gPSB0aGlzLmdldFJhd05vZGUoZWxlbSk7XG5cbiAgICAgICAgdmFyIGVsZW1TdHlsZSA9ICR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcbiAgICAgICAgdmFyIHBhZGRpbmdSaWdodCA9IHRoaXMucGFyc2VTdHlsZShlbGVtU3R5bGUucGFkZGluZ1JpZ2h0KTtcbiAgICAgICAgdmFyIHBhZGRpbmdCb3R0b20gPSB0aGlzLnBhcnNlU3R5bGUoZWxlbVN0eWxlLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICB2YXIgc2Nyb2xsUGFyZW50ID0gdGhpcy5zY3JvbGxQYXJlbnQoZWxlbSwgZmFsc2UsIHRydWUpO1xuICAgICAgICB2YXIgc2Nyb2xsYmFyV2lkdGggPSB0aGlzLnNjcm9sbGJhcldpZHRoKEJPRFlfUkVHRVgudGVzdChzY3JvbGxQYXJlbnQudGFnTmFtZSkpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc2Nyb2xsYmFyV2lkdGg6IHNjcm9sbGJhcldpZHRoLFxuICAgICAgICAgIHdpZHRoT3ZlcmZsb3c6IHNjcm9sbFBhcmVudC5zY3JvbGxXaWR0aCA+IHNjcm9sbFBhcmVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgICByaWdodDogcGFkZGluZ1JpZ2h0ICsgc2Nyb2xsYmFyV2lkdGgsXG4gICAgICAgICAgb3JpZ2luYWxSaWdodDogcGFkZGluZ1JpZ2h0LFxuICAgICAgICAgIGhlaWdodE92ZXJmbG93OiBzY3JvbGxQYXJlbnQuc2Nyb2xsSGVpZ2h0ID4gc2Nyb2xsUGFyZW50LmNsaWVudEhlaWdodCxcbiAgICAgICAgICBib3R0b206IHBhZGRpbmdCb3R0b20gKyBzY3JvbGxiYXJXaWR0aCxcbiAgICAgICAgICBvcmlnaW5hbEJvdHRvbTogcGFkZGluZ0JvdHRvbVxuICAgICAgICAgfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQ2hlY2tzIHRvIHNlZSBpZiB0aGUgZWxlbWVudCBpcyBzY3JvbGxhYmxlLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7ZWxlbWVudH0gZWxlbSAtIFRoZSBlbGVtZW50IHRvIGNoZWNrLlxuICAgICAgICogQHBhcmFtIHtib29sZWFuPX0gW2luY2x1ZGVIaWRkZW49ZmFsc2VdIC0gU2hvdWxkIHNjcm9sbCBzdHlsZSBvZiAnaGlkZGVuJyBiZSBjb25zaWRlcmVkLFxuICAgICAgICogICBkZWZhdWx0IGlzIGZhbHNlLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIHNjcm9sbGFibGUuXG4gICAgICAgKi9cbiAgICAgIGlzU2Nyb2xsYWJsZTogZnVuY3Rpb24oZWxlbSwgaW5jbHVkZUhpZGRlbikge1xuICAgICAgICBlbGVtID0gdGhpcy5nZXRSYXdOb2RlKGVsZW0pO1xuXG4gICAgICAgIHZhciBvdmVyZmxvd1JlZ2V4ID0gaW5jbHVkZUhpZGRlbiA/IE9WRVJGTE9XX1JFR0VYLmhpZGRlbiA6IE9WRVJGTE9XX1JFR0VYLm5vcm1hbDtcbiAgICAgICAgdmFyIGVsZW1TdHlsZSA9ICR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcbiAgICAgICAgcmV0dXJuIG92ZXJmbG93UmVnZXgudGVzdChlbGVtU3R5bGUub3ZlcmZsb3cgKyBlbGVtU3R5bGUub3ZlcmZsb3dZICsgZWxlbVN0eWxlLm92ZXJmbG93WCk7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFByb3ZpZGVzIHRoZSBjbG9zZXN0IHNjcm9sbGFibGUgYW5jZXN0b3IuXG4gICAgICAgKiBBIHBvcnQgb2YgdGhlIGpRdWVyeSBVSSBzY3JvbGxQYXJlbnQgbWV0aG9kOlxuICAgICAgICogaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnktdWkvYmxvYi9tYXN0ZXIvdWkvc2Nyb2xsLXBhcmVudC5qc1xuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7ZWxlbWVudH0gZWxlbSAtIFRoZSBlbGVtZW50IHRvIGZpbmQgdGhlIHNjcm9sbCBwYXJlbnQgb2YuXG4gICAgICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBbaW5jbHVkZUhpZGRlbj1mYWxzZV0gLSBTaG91bGQgc2Nyb2xsIHN0eWxlIG9mICdoaWRkZW4nIGJlIGNvbnNpZGVyZWQsXG4gICAgICAgKiAgIGRlZmF1bHQgaXMgZmFsc2UuXG4gICAgICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBbaW5jbHVkZVNlbGY9ZmFsc2VdIC0gU2hvdWxkIHRoZSBlbGVtZW50IGJlaW5nIHBhc3NlZCBiZVxuICAgICAgICogaW5jbHVkZWQgaW4gdGhlIHNjcm9sbGFibGUgbGxva3VwLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtlbGVtZW50fSBBIEhUTUwgZWxlbWVudC5cbiAgICAgICAqL1xuICAgICAgc2Nyb2xsUGFyZW50OiBmdW5jdGlvbihlbGVtLCBpbmNsdWRlSGlkZGVuLCBpbmNsdWRlU2VsZikge1xuICAgICAgICBlbGVtID0gdGhpcy5nZXRSYXdOb2RlKGVsZW0pO1xuXG4gICAgICAgIHZhciBvdmVyZmxvd1JlZ2V4ID0gaW5jbHVkZUhpZGRlbiA/IE9WRVJGTE9XX1JFR0VYLmhpZGRlbiA6IE9WRVJGTE9XX1JFR0VYLm5vcm1hbDtcbiAgICAgICAgdmFyIGRvY3VtZW50RWwgPSAkZG9jdW1lbnRbMF0uZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICB2YXIgZWxlbVN0eWxlID0gJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuICAgICAgICBpZiAoaW5jbHVkZVNlbGYgJiYgb3ZlcmZsb3dSZWdleC50ZXN0KGVsZW1TdHlsZS5vdmVyZmxvdyArIGVsZW1TdHlsZS5vdmVyZmxvd1kgKyBlbGVtU3R5bGUub3ZlcmZsb3dYKSkge1xuICAgICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgICB9XG4gICAgICAgIHZhciBleGNsdWRlU3RhdGljID0gZWxlbVN0eWxlLnBvc2l0aW9uID09PSAnYWJzb2x1dGUnO1xuICAgICAgICB2YXIgc2Nyb2xsUGFyZW50ID0gZWxlbS5wYXJlbnRFbGVtZW50IHx8IGRvY3VtZW50RWw7XG5cbiAgICAgICAgaWYgKHNjcm9sbFBhcmVudCA9PT0gZG9jdW1lbnRFbCB8fCBlbGVtU3R5bGUucG9zaXRpb24gPT09ICdmaXhlZCcpIHtcbiAgICAgICAgICByZXR1cm4gZG9jdW1lbnRFbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChzY3JvbGxQYXJlbnQucGFyZW50RWxlbWVudCAmJiBzY3JvbGxQYXJlbnQgIT09IGRvY3VtZW50RWwpIHtcbiAgICAgICAgICB2YXIgc3BTdHlsZSA9ICR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzY3JvbGxQYXJlbnQpO1xuICAgICAgICAgIGlmIChleGNsdWRlU3RhdGljICYmIHNwU3R5bGUucG9zaXRpb24gIT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICBleGNsdWRlU3RhdGljID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFleGNsdWRlU3RhdGljICYmIG92ZXJmbG93UmVnZXgudGVzdChzcFN0eWxlLm92ZXJmbG93ICsgc3BTdHlsZS5vdmVyZmxvd1kgKyBzcFN0eWxlLm92ZXJmbG93WCkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzY3JvbGxQYXJlbnQgPSBzY3JvbGxQYXJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY3JvbGxQYXJlbnQ7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFByb3ZpZGVzIHJlYWQtb25seSBlcXVpdmFsZW50IG9mIGpRdWVyeSdzIHBvc2l0aW9uIGZ1bmN0aW9uOlxuICAgICAgICogaHR0cDovL2FwaS5qcXVlcnkuY29tL3Bvc2l0aW9uLyAtIGRpc3RhbmNlIHRvIGNsb3Nlc3QgcG9zaXRpb25lZFxuICAgICAgICogYW5jZXN0b3IuICBEb2VzIG5vdCBhY2NvdW50IGZvciBtYXJnaW5zIGJ5IGRlZmF1bHQgbGlrZSBqUXVlcnkgcG9zaXRpb24uXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtlbGVtZW50fSBlbGVtIC0gVGhlIGVsZW1lbnQgdG8gY2FjbHVsYXRlIHRoZSBwb3NpdGlvbiBvbi5cbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbj19IFtpbmNsdWRlTWFyZ2lucz1mYWxzZV0gLSBTaG91bGQgbWFyZ2lucyBiZSBhY2NvdW50ZWRcbiAgICAgICAqIGZvciwgZGVmYXVsdCBpcyBmYWxzZS5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICAgKiAgIDx1bD5cbiAgICAgICAqICAgICA8bGk+Kip3aWR0aCoqOiB0aGUgd2lkdGggb2YgdGhlIGVsZW1lbnQ8L2xpPlxuICAgICAgICogICAgIDxsaT4qKmhlaWdodCoqOiB0aGUgaGVpZ2h0IG9mIHRoZSBlbGVtZW50PC9saT5cbiAgICAgICAqICAgICA8bGk+Kip0b3AqKjogZGlzdGFuY2UgdG8gdG9wIGVkZ2Ugb2Ygb2Zmc2V0IHBhcmVudDwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqbGVmdCoqOiBkaXN0YW5jZSB0byBsZWZ0IGVkZ2Ugb2Ygb2Zmc2V0IHBhcmVudDwvbGk+XG4gICAgICAgKiAgIDwvdWw+XG4gICAgICAgKi9cbiAgICAgIHBvc2l0aW9uOiBmdW5jdGlvbihlbGVtLCBpbmNsdWRlTWFnaW5zKSB7XG4gICAgICAgIGVsZW0gPSB0aGlzLmdldFJhd05vZGUoZWxlbSk7XG5cbiAgICAgICAgdmFyIGVsZW1PZmZzZXQgPSB0aGlzLm9mZnNldChlbGVtKTtcbiAgICAgICAgaWYgKGluY2x1ZGVNYWdpbnMpIHtcbiAgICAgICAgICB2YXIgZWxlbVN0eWxlID0gJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuICAgICAgICAgIGVsZW1PZmZzZXQudG9wIC09IHRoaXMucGFyc2VTdHlsZShlbGVtU3R5bGUubWFyZ2luVG9wKTtcbiAgICAgICAgICBlbGVtT2Zmc2V0LmxlZnQgLT0gdGhpcy5wYXJzZVN0eWxlKGVsZW1TdHlsZS5tYXJnaW5MZWZ0KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5vZmZzZXRQYXJlbnQoZWxlbSk7XG4gICAgICAgIHZhciBwYXJlbnRPZmZzZXQgPSB7dG9wOiAwLCBsZWZ0OiAwfTtcblxuICAgICAgICBpZiAocGFyZW50ICE9PSAkZG9jdW1lbnRbMF0uZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICAgICAgcGFyZW50T2Zmc2V0ID0gdGhpcy5vZmZzZXQocGFyZW50KTtcbiAgICAgICAgICBwYXJlbnRPZmZzZXQudG9wICs9IHBhcmVudC5jbGllbnRUb3AgLSBwYXJlbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgIHBhcmVudE9mZnNldC5sZWZ0ICs9IHBhcmVudC5jbGllbnRMZWZ0IC0gcGFyZW50LnNjcm9sbExlZnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGFuZ3VsYXIuaXNOdW1iZXIoZWxlbU9mZnNldC53aWR0aCkgPyBlbGVtT2Zmc2V0LndpZHRoIDogZWxlbS5vZmZzZXRXaWR0aCksXG4gICAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGFuZ3VsYXIuaXNOdW1iZXIoZWxlbU9mZnNldC5oZWlnaHQpID8gZWxlbU9mZnNldC5oZWlnaHQgOiBlbGVtLm9mZnNldEhlaWdodCksXG4gICAgICAgICAgdG9wOiBNYXRoLnJvdW5kKGVsZW1PZmZzZXQudG9wIC0gcGFyZW50T2Zmc2V0LnRvcCksXG4gICAgICAgICAgbGVmdDogTWF0aC5yb3VuZChlbGVtT2Zmc2V0LmxlZnQgLSBwYXJlbnRPZmZzZXQubGVmdClcbiAgICAgICAgfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvdmlkZXMgcmVhZC1vbmx5IGVxdWl2YWxlbnQgb2YgalF1ZXJ5J3Mgb2Zmc2V0IGZ1bmN0aW9uOlxuICAgICAgICogaHR0cDovL2FwaS5qcXVlcnkuY29tL29mZnNldC8gLSBkaXN0YW5jZSB0byB2aWV3cG9ydC4gIERvZXNcbiAgICAgICAqIG5vdCBhY2NvdW50IGZvciBib3JkZXJzLCBtYXJnaW5zLCBvciBwYWRkaW5nIG9uIHRoZSBib2R5XG4gICAgICAgKiBlbGVtZW50LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7ZWxlbWVudH0gZWxlbSAtIFRoZSBlbGVtZW50IHRvIGNhbGN1bGF0ZSB0aGUgb2Zmc2V0IG9uLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgICAqICAgPHVsPlxuICAgICAgICogICAgIDxsaT4qKndpZHRoKio6IHRoZSB3aWR0aCBvZiB0aGUgZWxlbWVudDwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqaGVpZ2h0Kio6IHRoZSBoZWlnaHQgb2YgdGhlIGVsZW1lbnQ8L2xpPlxuICAgICAgICogICAgIDxsaT4qKnRvcCoqOiBkaXN0YW5jZSB0byB0b3AgZWRnZSBvZiB2aWV3cG9ydDwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqcmlnaHQqKjogZGlzdGFuY2UgdG8gYm90dG9tIGVkZ2Ugb2Ygdmlld3BvcnQ8L2xpPlxuICAgICAgICogICA8L3VsPlxuICAgICAgICovXG4gICAgICBvZmZzZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgZWxlbSA9IHRoaXMuZ2V0UmF3Tm9kZShlbGVtKTtcblxuICAgICAgICB2YXIgZWxlbUJDUiA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoYW5ndWxhci5pc051bWJlcihlbGVtQkNSLndpZHRoKSA/IGVsZW1CQ1Iud2lkdGggOiBlbGVtLm9mZnNldFdpZHRoKSxcbiAgICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoYW5ndWxhci5pc051bWJlcihlbGVtQkNSLmhlaWdodCkgPyBlbGVtQkNSLmhlaWdodCA6IGVsZW0ub2Zmc2V0SGVpZ2h0KSxcbiAgICAgICAgICB0b3A6IE1hdGgucm91bmQoZWxlbUJDUi50b3AgKyAoJHdpbmRvdy5wYWdlWU9mZnNldCB8fCAkZG9jdW1lbnRbMF0uZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkpLFxuICAgICAgICAgIGxlZnQ6IE1hdGgucm91bmQoZWxlbUJDUi5sZWZ0ICsgKCR3aW5kb3cucGFnZVhPZmZzZXQgfHwgJGRvY3VtZW50WzBdLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0KSlcbiAgICAgICAgfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvdmlkZXMgb2Zmc2V0IGRpc3RhbmNlIHRvIHRoZSBjbG9zZXN0IHNjcm9sbGFibGUgYW5jZXN0b3JcbiAgICAgICAqIG9yIHZpZXdwb3J0LiAgQWNjb3VudHMgZm9yIGJvcmRlciBhbmQgc2Nyb2xsYmFyIHdpZHRoLlxuICAgICAgICpcbiAgICAgICAqIFJpZ2h0IGFuZCBib3R0b20gZGltZW5zaW9ucyByZXByZXNlbnQgdGhlIGRpc3RhbmNlIHRvIHRoZVxuICAgICAgICogcmVzcGVjdGl2ZSBlZGdlIG9mIHRoZSB2aWV3cG9ydCBlbGVtZW50LiAgSWYgdGhlIGVsZW1lbnRcbiAgICAgICAqIGVkZ2UgZXh0ZW5kcyBiZXlvbmQgdGhlIHZpZXdwb3J0LCBhIG5lZ2F0aXZlIHZhbHVlIHdpbGwgYmVcbiAgICAgICAqIHJlcG9ydGVkLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7ZWxlbWVudH0gZWxlbSAtIFRoZSBlbGVtZW50IHRvIGdldCB0aGUgdmlld3BvcnQgb2Zmc2V0IGZvci5cbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbj19IFt1c2VEb2N1bWVudD1mYWxzZV0gLSBTaG91bGQgdGhlIHZpZXdwb3J0IGJlIHRoZSBkb2N1bWVudCBlbGVtZW50IGluc3RlYWRcbiAgICAgICAqIG9mIHRoZSBmaXJzdCBzY3JvbGxhYmxlIGVsZW1lbnQsIGRlZmF1bHQgaXMgZmFsc2UuXG4gICAgICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBbaW5jbHVkZVBhZGRpbmc9dHJ1ZV0gLSBTaG91bGQgdGhlIHBhZGRpbmcgb24gdGhlIG9mZnNldCBwYXJlbnQgZWxlbWVudFxuICAgICAgICogYmUgYWNjb3VudGVkIGZvciwgZGVmYXVsdCBpcyB0cnVlLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgICAqICAgPHVsPlxuICAgICAgICogICAgIDxsaT4qKnRvcCoqOiBkaXN0YW5jZSB0byB0aGUgdG9wIGNvbnRlbnQgZWRnZSBvZiB2aWV3cG9ydCBlbGVtZW50PC9saT5cbiAgICAgICAqICAgICA8bGk+Kipib3R0b20qKjogZGlzdGFuY2UgdG8gdGhlIGJvdHRvbSBjb250ZW50IGVkZ2Ugb2Ygdmlld3BvcnQgZWxlbWVudDwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqbGVmdCoqOiBkaXN0YW5jZSB0byB0aGUgbGVmdCBjb250ZW50IGVkZ2Ugb2Ygdmlld3BvcnQgZWxlbWVudDwvbGk+XG4gICAgICAgKiAgICAgPGxpPioqcmlnaHQqKjogZGlzdGFuY2UgdG8gdGhlIHJpZ2h0IGNvbnRlbnQgZWRnZSBvZiB2aWV3cG9ydCBlbGVtZW50PC9saT5cbiAgICAgICAqICAgPC91bD5cbiAgICAgICAqL1xuICAgICAgdmlld3BvcnRPZmZzZXQ6IGZ1bmN0aW9uKGVsZW0sIHVzZURvY3VtZW50LCBpbmNsdWRlUGFkZGluZykge1xuICAgICAgICBlbGVtID0gdGhpcy5nZXRSYXdOb2RlKGVsZW0pO1xuICAgICAgICBpbmNsdWRlUGFkZGluZyA9IGluY2x1ZGVQYWRkaW5nICE9PSBmYWxzZSA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICB2YXIgZWxlbUJDUiA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciBvZmZzZXRCQ1IgPSB7dG9wOiAwLCBsZWZ0OiAwLCBib3R0b206IDAsIHJpZ2h0OiAwfTtcblxuICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gdXNlRG9jdW1lbnQgPyAkZG9jdW1lbnRbMF0uZG9jdW1lbnRFbGVtZW50IDogdGhpcy5zY3JvbGxQYXJlbnQoZWxlbSk7XG4gICAgICAgIHZhciBvZmZzZXRQYXJlbnRCQ1IgPSBvZmZzZXRQYXJlbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgb2Zmc2V0QkNSLnRvcCA9IG9mZnNldFBhcmVudEJDUi50b3AgKyBvZmZzZXRQYXJlbnQuY2xpZW50VG9wO1xuICAgICAgICBvZmZzZXRCQ1IubGVmdCA9IG9mZnNldFBhcmVudEJDUi5sZWZ0ICsgb2Zmc2V0UGFyZW50LmNsaWVudExlZnQ7XG4gICAgICAgIGlmIChvZmZzZXRQYXJlbnQgPT09ICRkb2N1bWVudFswXS5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgICAgICBvZmZzZXRCQ1IudG9wICs9ICR3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgICAgb2Zmc2V0QkNSLmxlZnQgKz0gJHdpbmRvdy5wYWdlWE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBvZmZzZXRCQ1IuYm90dG9tID0gb2Zmc2V0QkNSLnRvcCArIG9mZnNldFBhcmVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIG9mZnNldEJDUi5yaWdodCA9IG9mZnNldEJDUi5sZWZ0ICsgb2Zmc2V0UGFyZW50LmNsaWVudFdpZHRoO1xuXG4gICAgICAgIGlmIChpbmNsdWRlUGFkZGluZykge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTdHlsZSA9ICR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuICAgICAgICAgIG9mZnNldEJDUi50b3AgKz0gdGhpcy5wYXJzZVN0eWxlKG9mZnNldFBhcmVudFN0eWxlLnBhZGRpbmdUb3ApO1xuICAgICAgICAgIG9mZnNldEJDUi5ib3R0b20gLT0gdGhpcy5wYXJzZVN0eWxlKG9mZnNldFBhcmVudFN0eWxlLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICAgIG9mZnNldEJDUi5sZWZ0ICs9IHRoaXMucGFyc2VTdHlsZShvZmZzZXRQYXJlbnRTdHlsZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgICAgb2Zmc2V0QkNSLnJpZ2h0IC09IHRoaXMucGFyc2VTdHlsZShvZmZzZXRQYXJlbnRTdHlsZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IE1hdGgucm91bmQoZWxlbUJDUi50b3AgLSBvZmZzZXRCQ1IudG9wKSxcbiAgICAgICAgICBib3R0b206IE1hdGgucm91bmQob2Zmc2V0QkNSLmJvdHRvbSAtIGVsZW1CQ1IuYm90dG9tKSxcbiAgICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKGVsZW1CQ1IubGVmdCAtIG9mZnNldEJDUi5sZWZ0KSxcbiAgICAgICAgICByaWdodDogTWF0aC5yb3VuZChvZmZzZXRCQ1IucmlnaHQgLSBlbGVtQkNSLnJpZ2h0KVxuICAgICAgICB9O1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBQcm92aWRlcyBhbiBhcnJheSBvZiBwbGFjZW1lbnQgdmFsdWVzIHBhcnNlZCBmcm9tIGEgcGxhY2VtZW50IHN0cmluZy5cbiAgICAgICAqIEFsb25nIHdpdGggdGhlICdhdXRvJyBpbmRpY2F0b3IsIHN1cHBvcnRlZCBwbGFjZW1lbnQgc3RyaW5ncyBhcmU6XG4gICAgICAgKiAgIDx1bD5cbiAgICAgICAqICAgICA8bGk+dG9wOiBlbGVtZW50IG9uIHRvcCwgaG9yaXpvbnRhbGx5IGNlbnRlcmVkIG9uIGhvc3QgZWxlbWVudC48L2xpPlxuICAgICAgICogICAgIDxsaT50b3AtbGVmdDogZWxlbWVudCBvbiB0b3AsIGxlZnQgZWRnZSBhbGlnbmVkIHdpdGggaG9zdCBlbGVtZW50IGxlZnQgZWRnZS48L2xpPlxuICAgICAgICogICAgIDxsaT50b3AtcmlnaHQ6IGVsZW1lbnQgb24gdG9wLCBsZXJpZ2h0ZnQgZWRnZSBhbGlnbmVkIHdpdGggaG9zdCBlbGVtZW50IHJpZ2h0IGVkZ2UuPC9saT5cbiAgICAgICAqICAgICA8bGk+Ym90dG9tOiBlbGVtZW50IG9uIGJvdHRvbSwgaG9yaXpvbnRhbGx5IGNlbnRlcmVkIG9uIGhvc3QgZWxlbWVudC48L2xpPlxuICAgICAgICogICAgIDxsaT5ib3R0b20tbGVmdDogZWxlbWVudCBvbiBib3R0b20sIGxlZnQgZWRnZSBhbGlnbmVkIHdpdGggaG9zdCBlbGVtZW50IGxlZnQgZWRnZS48L2xpPlxuICAgICAgICogICAgIDxsaT5ib3R0b20tcmlnaHQ6IGVsZW1lbnQgb24gYm90dG9tLCByaWdodCBlZGdlIGFsaWduZWQgd2l0aCBob3N0IGVsZW1lbnQgcmlnaHQgZWRnZS48L2xpPlxuICAgICAgICogICAgIDxsaT5sZWZ0OiBlbGVtZW50IG9uIGxlZnQsIHZlcnRpY2FsbHkgY2VudGVyZWQgb24gaG9zdCBlbGVtZW50LjwvbGk+XG4gICAgICAgKiAgICAgPGxpPmxlZnQtdG9wOiBlbGVtZW50IG9uIGxlZnQsIHRvcCBlZGdlIGFsaWduZWQgd2l0aCBob3N0IGVsZW1lbnQgdG9wIGVkZ2UuPC9saT5cbiAgICAgICAqICAgICA8bGk+bGVmdC1ib3R0b206IGVsZW1lbnQgb24gbGVmdCwgYm90dG9tIGVkZ2UgYWxpZ25lZCB3aXRoIGhvc3QgZWxlbWVudCBib3R0b20gZWRnZS48L2xpPlxuICAgICAgICogICAgIDxsaT5yaWdodDogZWxlbWVudCBvbiByaWdodCwgdmVydGljYWxseSBjZW50ZXJlZCBvbiBob3N0IGVsZW1lbnQuPC9saT5cbiAgICAgICAqICAgICA8bGk+cmlnaHQtdG9wOiBlbGVtZW50IG9uIHJpZ2h0LCB0b3AgZWRnZSBhbGlnbmVkIHdpdGggaG9zdCBlbGVtZW50IHRvcCBlZGdlLjwvbGk+XG4gICAgICAgKiAgICAgPGxpPnJpZ2h0LWJvdHRvbTogZWxlbWVudCBvbiByaWdodCwgYm90dG9tIGVkZ2UgYWxpZ25lZCB3aXRoIGhvc3QgZWxlbWVudCBib3R0b20gZWRnZS48L2xpPlxuICAgICAgICogICA8L3VsPlxuICAgICAgICogQSBwbGFjZW1lbnQgc3RyaW5nIHdpdGggYW4gJ2F1dG8nIGluZGljYXRvciBpcyBleHBlY3RlZCB0byBiZVxuICAgICAgICogc3BhY2Ugc2VwYXJhdGVkIGZyb20gdGhlIHBsYWNlbWVudCwgaS5lOiAnYXV0byBib3R0b20tbGVmdCcgIElmXG4gICAgICAgKiB0aGUgcHJpbWFyeSBhbmQgc2Vjb25kYXJ5IHBsYWNlbWVudCB2YWx1ZXMgZG8gbm90IG1hdGNoICd0b3AsXG4gICAgICAgKiBib3R0b20sIGxlZnQsIHJpZ2h0JyB0aGVuICd0b3AnIHdpbGwgYmUgdGhlIHByaW1hcnkgcGxhY2VtZW50IGFuZFxuICAgICAgICogJ2NlbnRlcicgd2lsbCBiZSB0aGUgc2Vjb25kYXJ5IHBsYWNlbWVudC4gIElmICdhdXRvJyBpcyBwYXNzZWQsIHRydWVcbiAgICAgICAqIHdpbGwgYmUgcmV0dXJuZWQgYXMgdGhlIDNyZCB2YWx1ZSBvZiB0aGUgYXJyYXkuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBsYWNlbWVudCAtIFRoZSBwbGFjZW1lbnQgc3RyaW5nIHRvIHBhcnNlLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHthcnJheX0gQW4gYXJyYXkgd2l0aCB0aGUgZm9sbG93aW5nIHZhbHVlc1xuICAgICAgICogPHVsPlxuICAgICAgICogICA8bGk+KipbMF0qKjogVGhlIHByaW1hcnkgcGxhY2VtZW50LjwvbGk+XG4gICAgICAgKiAgIDxsaT4qKlsxXSoqOiBUaGUgc2Vjb25kYXJ5IHBsYWNlbWVudC48L2xpPlxuICAgICAgICogICA8bGk+KipbMl0qKjogSWYgYXV0byBpcyBwYXNzZWQ6IHRydWUsIGVsc2UgdW5kZWZpbmVkLjwvbGk+XG4gICAgICAgKiA8L3VsPlxuICAgICAgICovXG4gICAgICBwYXJzZVBsYWNlbWVudDogZnVuY3Rpb24ocGxhY2VtZW50KSB7XG4gICAgICAgIHZhciBhdXRvUGxhY2UgPSBQTEFDRU1FTlRfUkVHRVguYXV0by50ZXN0KHBsYWNlbWVudCk7XG4gICAgICAgIGlmIChhdXRvUGxhY2UpIHtcbiAgICAgICAgICBwbGFjZW1lbnQgPSBwbGFjZW1lbnQucmVwbGFjZShQTEFDRU1FTlRfUkVHRVguYXV0bywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGxhY2VtZW50ID0gcGxhY2VtZW50LnNwbGl0KCctJyk7XG5cbiAgICAgICAgcGxhY2VtZW50WzBdID0gcGxhY2VtZW50WzBdIHx8ICd0b3AnO1xuICAgICAgICBpZiAoIVBMQUNFTUVOVF9SRUdFWC5wcmltYXJ5LnRlc3QocGxhY2VtZW50WzBdKSkge1xuICAgICAgICAgIHBsYWNlbWVudFswXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgcGxhY2VtZW50WzFdID0gcGxhY2VtZW50WzFdIHx8ICdjZW50ZXInO1xuICAgICAgICBpZiAoIVBMQUNFTUVOVF9SRUdFWC5zZWNvbmRhcnkudGVzdChwbGFjZW1lbnRbMV0pKSB7XG4gICAgICAgICAgcGxhY2VtZW50WzFdID0gJ2NlbnRlcic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXV0b1BsYWNlKSB7XG4gICAgICAgICAgcGxhY2VtZW50WzJdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGFjZW1lbnRbMl0gPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwbGFjZW1lbnQ7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFByb3ZpZGVzIGNvb3JkaW5hdGVzIGZvciBhbiBlbGVtZW50IHRvIGJlIHBvc2l0aW9uZWQgcmVsYXRpdmUgdG9cbiAgICAgICAqIGFub3RoZXIgZWxlbWVudC4gIFBhc3NpbmcgJ2F1dG8nIGFzIHBhcnQgb2YgdGhlIHBsYWNlbWVudCBwYXJhbWV0ZXJcbiAgICAgICAqIHdpbGwgZW5hYmxlIHNtYXJ0IHBsYWNlbWVudCAtIHdoZXJlIHRoZSBlbGVtZW50IGZpdHMuIGkuZTpcbiAgICAgICAqICdhdXRvIGxlZnQtdG9wJyB3aWxsIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBlbm91Z2ggc3BhY2UgdG8gdGhlIGxlZnRcbiAgICAgICAqIG9mIHRoZSBob3N0RWxlbSB0byBmaXQgdGhlIHRhcmdldEVsZW0sIGlmIG5vdCBwbGFjZSByaWdodCAoc2FtZSBmb3Igc2Vjb25kYXJ5XG4gICAgICAgKiB0b3AgcGxhY2VtZW50KS4gIEF2YWlsYWJsZSBzcGFjZSBpcyBjYWxjdWxhdGVkIHVzaW5nIHRoZSB2aWV3cG9ydE9mZnNldFxuICAgICAgICogZnVuY3Rpb24uXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtlbGVtZW50fSBob3N0RWxlbSAtIFRoZSBlbGVtZW50IHRvIHBvc2l0aW9uIGFnYWluc3QuXG4gICAgICAgKiBAcGFyYW0ge2VsZW1lbnR9IHRhcmdldEVsZW0gLSBUaGUgZWxlbWVudCB0byBwb3NpdGlvbi5cbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gW3BsYWNlbWVudD10b3BdIC0gVGhlIHBsYWNlbWVudCBmb3IgdGhlIHRhcmdldEVsZW0sXG4gICAgICAgKiAgIGRlZmF1bHQgaXMgJ3RvcCcuICdjZW50ZXInIGlzIGFzc3VtZWQgYXMgc2Vjb25kYXJ5IHBsYWNlbWVudCBmb3JcbiAgICAgICAqICAgJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgYW5kICdib3R0b20nIHBsYWNlbWVudHMuICBBdmFpbGFibGUgcGxhY2VtZW50cyBhcmU6XG4gICAgICAgKiAgIDx1bD5cbiAgICAgICAqICAgICA8bGk+dG9wPC9saT5cbiAgICAgICAqICAgICA8bGk+dG9wLXJpZ2h0PC9saT5cbiAgICAgICAqICAgICA8bGk+dG9wLWxlZnQ8L2xpPlxuICAgICAgICogICAgIDxsaT5ib3R0b208L2xpPlxuICAgICAgICogICAgIDxsaT5ib3R0b20tbGVmdDwvbGk+XG4gICAgICAgKiAgICAgPGxpPmJvdHRvbS1yaWdodDwvbGk+XG4gICAgICAgKiAgICAgPGxpPmxlZnQ8L2xpPlxuICAgICAgICogICAgIDxsaT5sZWZ0LXRvcDwvbGk+XG4gICAgICAgKiAgICAgPGxpPmxlZnQtYm90dG9tPC9saT5cbiAgICAgICAqICAgICA8bGk+cmlnaHQ8L2xpPlxuICAgICAgICogICAgIDxsaT5yaWdodC10b3A8L2xpPlxuICAgICAgICogICAgIDxsaT5yaWdodC1ib3R0b208L2xpPlxuICAgICAgICogICA8L3VsPlxuICAgICAgICogQHBhcmFtIHtib29sZWFuPX0gW2FwcGVuZFRvQm9keT1mYWxzZV0gLSBTaG91bGQgdGhlIHRvcCBhbmQgbGVmdCB2YWx1ZXMgcmV0dXJuZWRcbiAgICAgICAqICAgYmUgY2FsY3VsYXRlZCBmcm9tIHRoZSBib2R5IGVsZW1lbnQsIGRlZmF1bHQgaXMgZmFsc2UuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge29iamVjdH0gQW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAgICogICA8dWw+XG4gICAgICAgKiAgICAgPGxpPioqdG9wKio6IFZhbHVlIGZvciB0YXJnZXRFbGVtIHRvcC48L2xpPlxuICAgICAgICogICAgIDxsaT4qKmxlZnQqKjogVmFsdWUgZm9yIHRhcmdldEVsZW0gbGVmdC48L2xpPlxuICAgICAgICogICAgIDxsaT4qKnBsYWNlbWVudCoqOiBUaGUgcmVzb2x2ZWQgcGxhY2VtZW50LjwvbGk+XG4gICAgICAgKiAgIDwvdWw+XG4gICAgICAgKi9cbiAgICAgIHBvc2l0aW9uRWxlbWVudHM6IGZ1bmN0aW9uKGhvc3RFbGVtLCB0YXJnZXRFbGVtLCBwbGFjZW1lbnQsIGFwcGVuZFRvQm9keSkge1xuICAgICAgICBob3N0RWxlbSA9IHRoaXMuZ2V0UmF3Tm9kZShob3N0RWxlbSk7XG4gICAgICAgIHRhcmdldEVsZW0gPSB0aGlzLmdldFJhd05vZGUodGFyZ2V0RWxlbSk7XG5cbiAgICAgICAgLy8gbmVlZCB0byByZWFkIGZyb20gcHJvcCB0byBzdXBwb3J0IHRlc3RzLlxuICAgICAgICB2YXIgdGFyZ2V0V2lkdGggPSBhbmd1bGFyLmlzRGVmaW5lZCh0YXJnZXRFbGVtLm9mZnNldFdpZHRoKSA/IHRhcmdldEVsZW0ub2Zmc2V0V2lkdGggOiB0YXJnZXRFbGVtLnByb3AoJ29mZnNldFdpZHRoJyk7XG4gICAgICAgIHZhciB0YXJnZXRIZWlnaHQgPSBhbmd1bGFyLmlzRGVmaW5lZCh0YXJnZXRFbGVtLm9mZnNldEhlaWdodCkgPyB0YXJnZXRFbGVtLm9mZnNldEhlaWdodCA6IHRhcmdldEVsZW0ucHJvcCgnb2Zmc2V0SGVpZ2h0Jyk7XG5cbiAgICAgICAgcGxhY2VtZW50ID0gdGhpcy5wYXJzZVBsYWNlbWVudChwbGFjZW1lbnQpO1xuXG4gICAgICAgIHZhciBob3N0RWxlbVBvcyA9IGFwcGVuZFRvQm9keSA/IHRoaXMub2Zmc2V0KGhvc3RFbGVtKSA6IHRoaXMucG9zaXRpb24oaG9zdEVsZW0pO1xuICAgICAgICB2YXIgdGFyZ2V0RWxlbVBvcyA9IHt0b3A6IDAsIGxlZnQ6IDAsIHBsYWNlbWVudDogJyd9O1xuXG4gICAgICAgIGlmIChwbGFjZW1lbnRbMl0pIHtcbiAgICAgICAgICB2YXIgdmlld3BvcnRPZmZzZXQgPSB0aGlzLnZpZXdwb3J0T2Zmc2V0KGhvc3RFbGVtLCBhcHBlbmRUb0JvZHkpO1xuXG4gICAgICAgICAgdmFyIHRhcmdldEVsZW1TdHlsZSA9ICR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXRFbGVtKTtcbiAgICAgICAgICB2YXIgYWRqdXN0ZWRTaXplID0ge1xuICAgICAgICAgICAgd2lkdGg6IHRhcmdldFdpZHRoICsgTWF0aC5yb3VuZChNYXRoLmFicyh0aGlzLnBhcnNlU3R5bGUodGFyZ2V0RWxlbVN0eWxlLm1hcmdpbkxlZnQpICsgdGhpcy5wYXJzZVN0eWxlKHRhcmdldEVsZW1TdHlsZS5tYXJnaW5SaWdodCkpKSxcbiAgICAgICAgICAgIGhlaWdodDogdGFyZ2V0SGVpZ2h0ICsgTWF0aC5yb3VuZChNYXRoLmFicyh0aGlzLnBhcnNlU3R5bGUodGFyZ2V0RWxlbVN0eWxlLm1hcmdpblRvcCkgKyB0aGlzLnBhcnNlU3R5bGUodGFyZ2V0RWxlbVN0eWxlLm1hcmdpbkJvdHRvbSkpKVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBwbGFjZW1lbnRbMF0gPSBwbGFjZW1lbnRbMF0gPT09ICd0b3AnICYmIGFkanVzdGVkU2l6ZS5oZWlnaHQgPiB2aWV3cG9ydE9mZnNldC50b3AgJiYgYWRqdXN0ZWRTaXplLmhlaWdodCA8PSB2aWV3cG9ydE9mZnNldC5ib3R0b20gPyAnYm90dG9tJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50WzBdID09PSAnYm90dG9tJyAmJiBhZGp1c3RlZFNpemUuaGVpZ2h0ID4gdmlld3BvcnRPZmZzZXQuYm90dG9tICYmIGFkanVzdGVkU2l6ZS5oZWlnaHQgPD0gdmlld3BvcnRPZmZzZXQudG9wID8gJ3RvcCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFswXSA9PT0gJ2xlZnQnICYmIGFkanVzdGVkU2l6ZS53aWR0aCA+IHZpZXdwb3J0T2Zmc2V0LmxlZnQgJiYgYWRqdXN0ZWRTaXplLndpZHRoIDw9IHZpZXdwb3J0T2Zmc2V0LnJpZ2h0ID8gJ3JpZ2h0JyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50WzBdID09PSAncmlnaHQnICYmIGFkanVzdGVkU2l6ZS53aWR0aCA+IHZpZXdwb3J0T2Zmc2V0LnJpZ2h0ICYmIGFkanVzdGVkU2l6ZS53aWR0aCA8PSB2aWV3cG9ydE9mZnNldC5sZWZ0ID8gJ2xlZnQnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnRbMF07XG5cbiAgICAgICAgICBwbGFjZW1lbnRbMV0gPSBwbGFjZW1lbnRbMV0gPT09ICd0b3AnICYmIGFkanVzdGVkU2l6ZS5oZWlnaHQgLSBob3N0RWxlbVBvcy5oZWlnaHQgPiB2aWV3cG9ydE9mZnNldC5ib3R0b20gJiYgYWRqdXN0ZWRTaXplLmhlaWdodCAtIGhvc3RFbGVtUG9zLmhlaWdodCA8PSB2aWV3cG9ydE9mZnNldC50b3AgPyAnYm90dG9tJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50WzFdID09PSAnYm90dG9tJyAmJiBhZGp1c3RlZFNpemUuaGVpZ2h0IC0gaG9zdEVsZW1Qb3MuaGVpZ2h0ID4gdmlld3BvcnRPZmZzZXQudG9wICYmIGFkanVzdGVkU2l6ZS5oZWlnaHQgLSBob3N0RWxlbVBvcy5oZWlnaHQgPD0gdmlld3BvcnRPZmZzZXQuYm90dG9tID8gJ3RvcCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFsxXSA9PT0gJ2xlZnQnICYmIGFkanVzdGVkU2l6ZS53aWR0aCAtIGhvc3RFbGVtUG9zLndpZHRoID4gdmlld3BvcnRPZmZzZXQucmlnaHQgJiYgYWRqdXN0ZWRTaXplLndpZHRoIC0gaG9zdEVsZW1Qb3Mud2lkdGggPD0gdmlld3BvcnRPZmZzZXQubGVmdCA/ICdyaWdodCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFsxXSA9PT0gJ3JpZ2h0JyAmJiBhZGp1c3RlZFNpemUud2lkdGggLSBob3N0RWxlbVBvcy53aWR0aCA+IHZpZXdwb3J0T2Zmc2V0LmxlZnQgJiYgYWRqdXN0ZWRTaXplLndpZHRoIC0gaG9zdEVsZW1Qb3Mud2lkdGggPD0gdmlld3BvcnRPZmZzZXQucmlnaHQgPyAnbGVmdCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFsxXTtcblxuICAgICAgICAgIGlmIChwbGFjZW1lbnRbMV0gPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBpZiAoUExBQ0VNRU5UX1JFR0VYLnZlcnRpY2FsLnRlc3QocGxhY2VtZW50WzBdKSkge1xuICAgICAgICAgICAgICB2YXIgeE92ZXJmbG93ID0gaG9zdEVsZW1Qb3Mud2lkdGggLyAyIC0gdGFyZ2V0V2lkdGggLyAyO1xuICAgICAgICAgICAgICBpZiAodmlld3BvcnRPZmZzZXQubGVmdCArIHhPdmVyZmxvdyA8IDAgJiYgYWRqdXN0ZWRTaXplLndpZHRoIC0gaG9zdEVsZW1Qb3Mud2lkdGggPD0gdmlld3BvcnRPZmZzZXQucmlnaHQpIHtcbiAgICAgICAgICAgICAgICBwbGFjZW1lbnRbMV0gPSAnbGVmdCc7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodmlld3BvcnRPZmZzZXQucmlnaHQgKyB4T3ZlcmZsb3cgPCAwICYmIGFkanVzdGVkU2l6ZS53aWR0aCAtIGhvc3RFbGVtUG9zLndpZHRoIDw9IHZpZXdwb3J0T2Zmc2V0LmxlZnQpIHtcbiAgICAgICAgICAgICAgICBwbGFjZW1lbnRbMV0gPSAncmlnaHQnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgeU92ZXJmbG93ID0gaG9zdEVsZW1Qb3MuaGVpZ2h0IC8gMiAtIGFkanVzdGVkU2l6ZS5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICBpZiAodmlld3BvcnRPZmZzZXQudG9wICsgeU92ZXJmbG93IDwgMCAmJiBhZGp1c3RlZFNpemUuaGVpZ2h0IC0gaG9zdEVsZW1Qb3MuaGVpZ2h0IDw9IHZpZXdwb3J0T2Zmc2V0LmJvdHRvbSkge1xuICAgICAgICAgICAgICAgIHBsYWNlbWVudFsxXSA9ICd0b3AnO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZpZXdwb3J0T2Zmc2V0LmJvdHRvbSArIHlPdmVyZmxvdyA8IDAgJiYgYWRqdXN0ZWRTaXplLmhlaWdodCAtIGhvc3RFbGVtUG9zLmhlaWdodCA8PSB2aWV3cG9ydE9mZnNldC50b3ApIHtcbiAgICAgICAgICAgICAgICBwbGFjZW1lbnRbMV0gPSAnYm90dG9tJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAocGxhY2VtZW50WzBdKSB7XG4gICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgIHRhcmdldEVsZW1Qb3MudG9wID0gaG9zdEVsZW1Qb3MudG9wIC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgIHRhcmdldEVsZW1Qb3MudG9wID0gaG9zdEVsZW1Qb3MudG9wICsgaG9zdEVsZW1Qb3MuaGVpZ2h0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICB0YXJnZXRFbGVtUG9zLmxlZnQgPSBob3N0RWxlbVBvcy5sZWZ0IC0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICB0YXJnZXRFbGVtUG9zLmxlZnQgPSBob3N0RWxlbVBvcy5sZWZ0ICsgaG9zdEVsZW1Qb3Mud2lkdGg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAocGxhY2VtZW50WzFdKSB7XG4gICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgIHRhcmdldEVsZW1Qb3MudG9wID0gaG9zdEVsZW1Qb3MudG9wO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgIHRhcmdldEVsZW1Qb3MudG9wID0gaG9zdEVsZW1Qb3MudG9wICsgaG9zdEVsZW1Qb3MuaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICB0YXJnZXRFbGVtUG9zLmxlZnQgPSBob3N0RWxlbVBvcy5sZWZ0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgdGFyZ2V0RWxlbVBvcy5sZWZ0ID0gaG9zdEVsZW1Qb3MubGVmdCArIGhvc3RFbGVtUG9zLndpZHRoIC0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICAgICAgaWYgKFBMQUNFTUVOVF9SRUdFWC52ZXJ0aWNhbC50ZXN0KHBsYWNlbWVudFswXSkpIHtcbiAgICAgICAgICAgICAgdGFyZ2V0RWxlbVBvcy5sZWZ0ID0gaG9zdEVsZW1Qb3MubGVmdCArIGhvc3RFbGVtUG9zLndpZHRoIC8gMiAtIHRhcmdldFdpZHRoIC8gMjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRhcmdldEVsZW1Qb3MudG9wID0gaG9zdEVsZW1Qb3MudG9wICsgaG9zdEVsZW1Qb3MuaGVpZ2h0IC8gMiAtIHRhcmdldEhlaWdodCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldEVsZW1Qb3MudG9wID0gTWF0aC5yb3VuZCh0YXJnZXRFbGVtUG9zLnRvcCk7XG4gICAgICAgIHRhcmdldEVsZW1Qb3MubGVmdCA9IE1hdGgucm91bmQodGFyZ2V0RWxlbVBvcy5sZWZ0KTtcbiAgICAgICAgdGFyZ2V0RWxlbVBvcy5wbGFjZW1lbnQgPSBwbGFjZW1lbnRbMV0gPT09ICdjZW50ZXInID8gcGxhY2VtZW50WzBdIDogcGxhY2VtZW50WzBdICsgJy0nICsgcGxhY2VtZW50WzFdO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRFbGVtUG9zO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBQcm92aWRlcyBhIHdheSB0byBhZGp1c3QgdGhlIHRvcCBwb3NpdGlvbmluZyBhZnRlciBmaXJzdFxuICAgICAgICogcmVuZGVyIHRvIGNvcnJlY3RseSBhbGlnbiBlbGVtZW50IHRvIHRvcCBhZnRlciBjb250ZW50XG4gICAgICAgKiByZW5kZXJpbmcgY2F1c2VzIHJlc2l6ZWQgZWxlbWVudCBoZWlnaHRcbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge2FycmF5fSBwbGFjZW1lbnRDbGFzc2VzIC0gVGhlIGFycmF5IG9mIHN0cmluZ3Mgb2YgY2xhc3Nlc1xuICAgICAgICogZWxlbWVudCBzaG91bGQgaGF2ZS5cbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb250YWluZXJQb3NpdGlvbiAtIFRoZSBvYmplY3Qgd2l0aCBjb250YWluZXJcbiAgICAgICAqIHBvc2l0aW9uIGluZm9ybWF0aW9uXG4gICAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5pdGlhbEhlaWdodCAtIFRoZSBpbml0aWFsIGhlaWdodCBmb3IgdGhlIGVsZW0uXG4gICAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudEhlaWdodCAtIFRoZSBjdXJyZW50IGhlaWdodCBmb3IgdGhlIGVsZW0uXG4gICAgICAgKi9cbiAgICAgIGFkanVzdFRvcDogZnVuY3Rpb24ocGxhY2VtZW50Q2xhc3NlcywgY29udGFpbmVyUG9zaXRpb24sIGluaXRpYWxIZWlnaHQsIGN1cnJlbnRIZWlnaHQpIHtcbiAgICAgICAgaWYgKHBsYWNlbWVudENsYXNzZXMuaW5kZXhPZigndG9wJykgIT09IC0xICYmIGluaXRpYWxIZWlnaHQgIT09IGN1cnJlbnRIZWlnaHQpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiBjb250YWluZXJQb3NpdGlvbi50b3AgLSBjdXJyZW50SGVpZ2h0ICsgJ3B4J1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUHJvdmlkZXMgYSB3YXkgZm9yIHBvc2l0aW9uaW5nIHRvb2x0aXAgJiBkcm9wZG93blxuICAgICAgICogYXJyb3dzIHdoZW4gdXNpbmcgcGxhY2VtZW50IG9wdGlvbnMgYmV5b25kIHRoZSBzdGFuZGFyZFxuICAgICAgICogbGVmdCwgcmlnaHQsIHRvcCwgb3IgYm90dG9tLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7ZWxlbWVudH0gZWxlbSAtIFRoZSB0b29sdGlwL2Ryb3Bkb3duIGVsZW1lbnQuXG4gICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGxhY2VtZW50IC0gVGhlIHBsYWNlbWVudCBmb3IgdGhlIGVsZW0uXG4gICAgICAgKi9cbiAgICAgIHBvc2l0aW9uQXJyb3c6IGZ1bmN0aW9uKGVsZW0sIHBsYWNlbWVudCkge1xuICAgICAgICBlbGVtID0gdGhpcy5nZXRSYXdOb2RlKGVsZW0pO1xuXG4gICAgICAgIHZhciBpbm5lckVsZW0gPSBlbGVtLnF1ZXJ5U2VsZWN0b3IoJy50b29sdGlwLWlubmVyLCAucG9wb3Zlci1pbm5lcicpO1xuICAgICAgICBpZiAoIWlubmVyRWxlbSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpc1Rvb2x0aXAgPSBhbmd1bGFyLmVsZW1lbnQoaW5uZXJFbGVtKS5oYXNDbGFzcygndG9vbHRpcC1pbm5lcicpO1xuXG4gICAgICAgIHZhciBhcnJvd0VsZW0gPSBpc1Rvb2x0aXAgPyBlbGVtLnF1ZXJ5U2VsZWN0b3IoJy50b29sdGlwLWFycm93JykgOiBlbGVtLnF1ZXJ5U2VsZWN0b3IoJy5hcnJvdycpO1xuICAgICAgICBpZiAoIWFycm93RWxlbSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhcnJvd0NzcyA9IHtcbiAgICAgICAgICB0b3A6ICcnLFxuICAgICAgICAgIGJvdHRvbTogJycsXG4gICAgICAgICAgbGVmdDogJycsXG4gICAgICAgICAgcmlnaHQ6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgcGxhY2VtZW50ID0gdGhpcy5wYXJzZVBsYWNlbWVudChwbGFjZW1lbnQpO1xuICAgICAgICBpZiAocGxhY2VtZW50WzFdID09PSAnY2VudGVyJykge1xuICAgICAgICAgIC8vIG5vIGFkanVzdG1lbnQgbmVjZXNzYXJ5IC0ganVzdCByZXNldCBzdHlsZXNcbiAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoYXJyb3dFbGVtKS5jc3MoYXJyb3dDc3MpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBib3JkZXJQcm9wID0gJ2JvcmRlci0nICsgcGxhY2VtZW50WzBdICsgJy13aWR0aCc7XG4gICAgICAgIHZhciBib3JkZXJXaWR0aCA9ICR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShhcnJvd0VsZW0pW2JvcmRlclByb3BdO1xuXG4gICAgICAgIHZhciBib3JkZXJSYWRpdXNQcm9wID0gJ2JvcmRlci0nO1xuICAgICAgICBpZiAoUExBQ0VNRU5UX1JFR0VYLnZlcnRpY2FsLnRlc3QocGxhY2VtZW50WzBdKSkge1xuICAgICAgICAgIGJvcmRlclJhZGl1c1Byb3AgKz0gcGxhY2VtZW50WzBdICsgJy0nICsgcGxhY2VtZW50WzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJvcmRlclJhZGl1c1Byb3AgKz0gcGxhY2VtZW50WzFdICsgJy0nICsgcGxhY2VtZW50WzBdO1xuICAgICAgICB9XG4gICAgICAgIGJvcmRlclJhZGl1c1Byb3AgKz0gJy1yYWRpdXMnO1xuICAgICAgICB2YXIgYm9yZGVyUmFkaXVzID0gJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGlzVG9vbHRpcCA/IGlubmVyRWxlbSA6IGVsZW0pW2JvcmRlclJhZGl1c1Byb3BdO1xuXG4gICAgICAgIHN3aXRjaCAocGxhY2VtZW50WzBdKSB7XG4gICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgIGFycm93Q3NzLmJvdHRvbSA9IGlzVG9vbHRpcCA/ICcwJyA6ICctJyArIGJvcmRlcldpZHRoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgIGFycm93Q3NzLnRvcCA9IGlzVG9vbHRpcCA/ICcwJyA6ICctJyArIGJvcmRlcldpZHRoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICBhcnJvd0Nzcy5yaWdodCA9IGlzVG9vbHRpcCA/ICcwJyA6ICctJyArIGJvcmRlcldpZHRoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgYXJyb3dDc3MubGVmdCA9IGlzVG9vbHRpcCA/ICcwJyA6ICctJyArIGJvcmRlcldpZHRoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBhcnJvd0Nzc1twbGFjZW1lbnRbMV1dID0gYm9yZGVyUmFkaXVzO1xuXG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudChhcnJvd0VsZW0pLmNzcyhhcnJvd0Nzcyk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLmRhdGVwaWNrZXJQb3B1cCcsIFsndWkuYm9vdHN0cmFwLmRhdGVwaWNrZXInLCAndWkuYm9vdHN0cmFwLnBvc2l0aW9uJ10pXG5cbi52YWx1ZSgnJGRhdGVwaWNrZXJQb3B1cExpdGVyYWxXYXJuaW5nJywgdHJ1ZSlcblxuLmNvbnN0YW50KCd1aWJEYXRlcGlja2VyUG9wdXBDb25maWcnLCB7XG4gIGFsdElucHV0Rm9ybWF0czogW10sXG4gIGFwcGVuZFRvQm9keTogZmFsc2UsXG4gIGNsZWFyVGV4dDogJ0NsZWFyJyxcbiAgY2xvc2VPbkRhdGVTZWxlY3Rpb246IHRydWUsXG4gIGNsb3NlVGV4dDogJ0RvbmUnLFxuICBjdXJyZW50VGV4dDogJ1RvZGF5JyxcbiAgZGF0ZXBpY2tlclBvcHVwOiAneXl5eS1NTS1kZCcsXG4gIGRhdGVwaWNrZXJQb3B1cFRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL2RhdGVwaWNrZXJQb3B1cC9wb3B1cC5odG1sJyxcbiAgZGF0ZXBpY2tlclRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL2RhdGVwaWNrZXIvZGF0ZXBpY2tlci5odG1sJyxcbiAgaHRtbDVUeXBlczoge1xuICAgIGRhdGU6ICd5eXl5LU1NLWRkJyxcbiAgICAnZGF0ZXRpbWUtbG9jYWwnOiAneXl5eS1NTS1kZFRISDptbTpzcy5zc3MnLFxuICAgICdtb250aCc6ICd5eXl5LU1NJ1xuICB9LFxuICBvbk9wZW5Gb2N1czogdHJ1ZSxcbiAgc2hvd0J1dHRvbkJhcjogdHJ1ZSxcbiAgcGxhY2VtZW50OiAnYXV0byBib3R0b20tbGVmdCdcbn0pXG5cbi5jb250cm9sbGVyKCdVaWJEYXRlcGlja2VyUG9wdXBDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJGF0dHJzJywgJyRjb21waWxlJywgJyRsb2cnLCAnJHBhcnNlJywgJyR3aW5kb3cnLCAnJGRvY3VtZW50JywgJyRyb290U2NvcGUnLCAnJHVpYlBvc2l0aW9uJywgJ2RhdGVGaWx0ZXInLCAndWliRGF0ZVBhcnNlcicsICd1aWJEYXRlcGlja2VyUG9wdXBDb25maWcnLCAnJHRpbWVvdXQnLCAndWliRGF0ZXBpY2tlckNvbmZpZycsICckZGF0ZXBpY2tlclBvcHVwTGl0ZXJhbFdhcm5pbmcnLFxuZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkY29tcGlsZSwgJGxvZywgJHBhcnNlLCAkd2luZG93LCAkZG9jdW1lbnQsICRyb290U2NvcGUsICRwb3NpdGlvbiwgZGF0ZUZpbHRlciwgZGF0ZVBhcnNlciwgZGF0ZXBpY2tlclBvcHVwQ29uZmlnLCAkdGltZW91dCwgZGF0ZXBpY2tlckNvbmZpZywgJGRhdGVwaWNrZXJQb3B1cExpdGVyYWxXYXJuaW5nKSB7XG4gIHZhciBjYWNoZSA9IHt9LFxuICAgIGlzSHRtbDVEYXRlSW5wdXQgPSBmYWxzZTtcbiAgdmFyIGRhdGVGb3JtYXQsIGNsb3NlT25EYXRlU2VsZWN0aW9uLCBhcHBlbmRUb0JvZHksIG9uT3BlbkZvY3VzLFxuICAgIGRhdGVwaWNrZXJQb3B1cFRlbXBsYXRlVXJsLCBkYXRlcGlja2VyVGVtcGxhdGVVcmwsIHBvcHVwRWwsIGRhdGVwaWNrZXJFbCwgc2Nyb2xsUGFyZW50RWwsXG4gICAgbmdNb2RlbCwgbmdNb2RlbE9wdGlvbnMsICRwb3B1cCwgYWx0SW5wdXRGb3JtYXRzLCB3YXRjaExpc3RlbmVycyA9IFtdO1xuXG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKF9uZ01vZGVsXykge1xuICAgIG5nTW9kZWwgPSBfbmdNb2RlbF87XG4gICAgbmdNb2RlbE9wdGlvbnMgPSBleHRyYWN0T3B0aW9ucyhuZ01vZGVsKTtcbiAgICBjbG9zZU9uRGF0ZVNlbGVjdGlvbiA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5jbG9zZU9uRGF0ZVNlbGVjdGlvbikgP1xuICAgICAgJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLmNsb3NlT25EYXRlU2VsZWN0aW9uKSA6XG4gICAgICBkYXRlcGlja2VyUG9wdXBDb25maWcuY2xvc2VPbkRhdGVTZWxlY3Rpb247XG4gICAgYXBwZW5kVG9Cb2R5ID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmRhdGVwaWNrZXJBcHBlbmRUb0JvZHkpID9cbiAgICAgICRzY29wZS4kcGFyZW50LiRldmFsKCRhdHRycy5kYXRlcGlja2VyQXBwZW5kVG9Cb2R5KSA6XG4gICAgICBkYXRlcGlja2VyUG9wdXBDb25maWcuYXBwZW5kVG9Cb2R5O1xuICAgIG9uT3BlbkZvY3VzID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLm9uT3BlbkZvY3VzKSA/XG4gICAgICAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMub25PcGVuRm9jdXMpIDogZGF0ZXBpY2tlclBvcHVwQ29uZmlnLm9uT3BlbkZvY3VzO1xuICAgIGRhdGVwaWNrZXJQb3B1cFRlbXBsYXRlVXJsID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmRhdGVwaWNrZXJQb3B1cFRlbXBsYXRlVXJsKSA/XG4gICAgICAkYXR0cnMuZGF0ZXBpY2tlclBvcHVwVGVtcGxhdGVVcmwgOlxuICAgICAgZGF0ZXBpY2tlclBvcHVwQ29uZmlnLmRhdGVwaWNrZXJQb3B1cFRlbXBsYXRlVXJsO1xuICAgIGRhdGVwaWNrZXJUZW1wbGF0ZVVybCA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5kYXRlcGlja2VyVGVtcGxhdGVVcmwpID9cbiAgICAgICRhdHRycy5kYXRlcGlja2VyVGVtcGxhdGVVcmwgOiBkYXRlcGlja2VyUG9wdXBDb25maWcuZGF0ZXBpY2tlclRlbXBsYXRlVXJsO1xuICAgIGFsdElucHV0Rm9ybWF0cyA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5hbHRJbnB1dEZvcm1hdHMpID9cbiAgICAgICRzY29wZS4kcGFyZW50LiRldmFsKCRhdHRycy5hbHRJbnB1dEZvcm1hdHMpIDpcbiAgICAgIGRhdGVwaWNrZXJQb3B1cENvbmZpZy5hbHRJbnB1dEZvcm1hdHM7XG5cbiAgICAkc2NvcGUuc2hvd0J1dHRvbkJhciA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5zaG93QnV0dG9uQmFyKSA/XG4gICAgICAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMuc2hvd0J1dHRvbkJhcikgOlxuICAgICAgZGF0ZXBpY2tlclBvcHVwQ29uZmlnLnNob3dCdXR0b25CYXI7XG5cbiAgICBpZiAoZGF0ZXBpY2tlclBvcHVwQ29uZmlnLmh0bWw1VHlwZXNbJGF0dHJzLnR5cGVdKSB7XG4gICAgICBkYXRlRm9ybWF0ID0gZGF0ZXBpY2tlclBvcHVwQ29uZmlnLmh0bWw1VHlwZXNbJGF0dHJzLnR5cGVdO1xuICAgICAgaXNIdG1sNURhdGVJbnB1dCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGVGb3JtYXQgPSAkYXR0cnMudWliRGF0ZXBpY2tlclBvcHVwIHx8IGRhdGVwaWNrZXJQb3B1cENvbmZpZy5kYXRlcGlja2VyUG9wdXA7XG4gICAgICAkYXR0cnMuJG9ic2VydmUoJ3VpYkRhdGVwaWNrZXJQb3B1cCcsIGZ1bmN0aW9uKHZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICB2YXIgbmV3RGF0ZUZvcm1hdCA9IHZhbHVlIHx8IGRhdGVwaWNrZXJQb3B1cENvbmZpZy5kYXRlcGlja2VyUG9wdXA7XG4gICAgICAgIC8vIEludmFsaWRhdGUgdGhlICRtb2RlbFZhbHVlIHRvIGVuc3VyZSB0aGF0IGZvcm1hdHRlcnMgcmUtcnVuXG4gICAgICAgIC8vIEZJWE1FOiBSZWZhY3RvciB3aGVuIFBSIGlzIG1lcmdlZDogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci5qcy9wdWxsLzEwNzY0XG4gICAgICAgIGlmIChuZXdEYXRlRm9ybWF0ICE9PSBkYXRlRm9ybWF0KSB7XG4gICAgICAgICAgZGF0ZUZvcm1hdCA9IG5ld0RhdGVGb3JtYXQ7XG4gICAgICAgICAgbmdNb2RlbC4kbW9kZWxWYWx1ZSA9IG51bGw7XG5cbiAgICAgICAgICBpZiAoIWRhdGVGb3JtYXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndWliRGF0ZXBpY2tlclBvcHVwIG11c3QgaGF2ZSBhIGRhdGUgZm9ybWF0IHNwZWNpZmllZC4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghZGF0ZUZvcm1hdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1aWJEYXRlcGlja2VyUG9wdXAgbXVzdCBoYXZlIGEgZGF0ZSBmb3JtYXQgc3BlY2lmaWVkLicpO1xuICAgIH1cblxuICAgIGlmIChpc0h0bWw1RGF0ZUlucHV0ICYmICRhdHRycy51aWJEYXRlcGlja2VyUG9wdXApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSFRNTDUgZGF0ZSBpbnB1dCB0eXBlcyBkbyBub3Qgc3VwcG9ydCBjdXN0b20gZm9ybWF0cy4nKTtcbiAgICB9XG5cbiAgICAvLyBwb3B1cCBlbGVtZW50IHVzZWQgdG8gZGlzcGxheSBjYWxlbmRhclxuICAgIHBvcHVwRWwgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgdWliLWRhdGVwaWNrZXItcG9wdXAtd3JhcD48ZGl2IHVpYi1kYXRlcGlja2VyPjwvZGl2PjwvZGl2PicpO1xuXG4gICAgcG9wdXBFbC5hdHRyKHtcbiAgICAgICduZy1tb2RlbCc6ICdkYXRlJyxcbiAgICAgICduZy1jaGFuZ2UnOiAnZGF0ZVNlbGVjdGlvbihkYXRlKScsXG4gICAgICAndGVtcGxhdGUtdXJsJzogZGF0ZXBpY2tlclBvcHVwVGVtcGxhdGVVcmxcbiAgICB9KTtcblxuICAgIC8vIGRhdGVwaWNrZXIgZWxlbWVudFxuICAgIGRhdGVwaWNrZXJFbCA9IGFuZ3VsYXIuZWxlbWVudChwb3B1cEVsLmNoaWxkcmVuKClbMF0pO1xuICAgIGRhdGVwaWNrZXJFbC5hdHRyKCd0ZW1wbGF0ZS11cmwnLCBkYXRlcGlja2VyVGVtcGxhdGVVcmwpO1xuXG4gICAgaWYgKCEkc2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMpIHtcbiAgICAgICRzY29wZS5kYXRlcGlja2VyT3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIGlmIChpc0h0bWw1RGF0ZUlucHV0KSB7XG4gICAgICBpZiAoJGF0dHJzLnR5cGUgPT09ICdtb250aCcpIHtcbiAgICAgICAgJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zLmRhdGVwaWNrZXJNb2RlID0gJ21vbnRoJztcbiAgICAgICAgJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zLm1pbk1vZGUgPSAnbW9udGgnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGVwaWNrZXJFbC5hdHRyKCdkYXRlcGlja2VyLW9wdGlvbnMnLCAnZGF0ZXBpY2tlck9wdGlvbnMnKTtcblxuICAgIGlmICghaXNIdG1sNURhdGVJbnB1dCkge1xuICAgICAgLy8gSW50ZXJuYWwgQVBJIHRvIG1haW50YWluIHRoZSBjb3JyZWN0IG5nLWludmFsaWQtW2tleV0gY2xhc3NcbiAgICAgIG5nTW9kZWwuJCRwYXJzZXJOYW1lID0gJ2RhdGUnO1xuICAgICAgbmdNb2RlbC4kdmFsaWRhdG9ycy5kYXRlID0gdmFsaWRhdG9yO1xuICAgICAgbmdNb2RlbC4kcGFyc2Vycy51bnNoaWZ0KHBhcnNlRGF0ZSk7XG4gICAgICBuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKG5nTW9kZWwuJGlzRW1wdHkodmFsdWUpKSB7XG4gICAgICAgICAgJHNjb3BlLmRhdGUgPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYW5ndWxhci5pc051bWJlcih2YWx1ZSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgICRzY29wZS5kYXRlID0gZGF0ZVBhcnNlci5mcm9tVGltZXpvbmUodmFsdWUsIG5nTW9kZWxPcHRpb25zLmdldE9wdGlvbigndGltZXpvbmUnKSk7XG5cbiAgICAgICAgcmV0dXJuIGRhdGVQYXJzZXIuZmlsdGVyKCRzY29wZS5kYXRlLCBkYXRlRm9ybWF0KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgJHNjb3BlLmRhdGUgPSBkYXRlUGFyc2VyLmZyb21UaW1lem9uZSh2YWx1ZSwgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRGV0ZWN0IGNoYW5nZXMgaW4gdGhlIHZpZXcgZnJvbSB0aGUgdGV4dCBib3hcbiAgICBuZ01vZGVsLiR2aWV3Q2hhbmdlTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuZGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhuZ01vZGVsLiR2aWV3VmFsdWUpO1xuICAgIH0pO1xuXG4gICAgJGVsZW1lbnQub24oJ2tleWRvd24nLCBpbnB1dEtleWRvd25CaW5kKTtcblxuICAgICRwb3B1cCA9ICRjb21waWxlKHBvcHVwRWwpKCRzY29wZSk7XG4gICAgLy8gUHJldmVudCBqUXVlcnkgY2FjaGUgbWVtb3J5IGxlYWsgKHRlbXBsYXRlIGlzIG5vdyByZWR1bmRhbnQgYWZ0ZXIgbGlua2luZylcbiAgICBwb3B1cEVsLnJlbW92ZSgpO1xuXG4gICAgaWYgKGFwcGVuZFRvQm9keSkge1xuICAgICAgJGRvY3VtZW50LmZpbmQoJ2JvZHknKS5hcHBlbmQoJHBvcHVwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJGVsZW1lbnQuYWZ0ZXIoJHBvcHVwKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCRzY29wZS5pc09wZW4gPT09IHRydWUpIHtcbiAgICAgICAgaWYgKCEkcm9vdFNjb3BlLiQkcGhhc2UpIHtcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgICRwb3B1cC5yZW1vdmUoKTtcbiAgICAgICRlbGVtZW50Lm9mZigna2V5ZG93bicsIGlucHV0S2V5ZG93bkJpbmQpO1xuICAgICAgJGRvY3VtZW50Lm9mZignY2xpY2snLCBkb2N1bWVudENsaWNrQmluZCk7XG4gICAgICBpZiAoc2Nyb2xsUGFyZW50RWwpIHtcbiAgICAgICAgc2Nyb2xsUGFyZW50RWwub2ZmKCdzY3JvbGwnLCBwb3NpdGlvblBvcHVwKTtcbiAgICAgIH1cbiAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5vZmYoJ3Jlc2l6ZScsIHBvc2l0aW9uUG9wdXApO1xuXG4gICAgICAvL0NsZWFyIGFsbCB3YXRjaCBsaXN0ZW5lcnMgb24gZGVzdHJveVxuICAgICAgd2hpbGUgKHdhdGNoTGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICB3YXRjaExpc3RlbmVycy5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmdldFRleHQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gJHNjb3BlW2tleSArICdUZXh0J10gfHwgZGF0ZXBpY2tlclBvcHVwQ29uZmlnW2tleSArICdUZXh0J107XG4gIH07XG5cbiAgJHNjb3BlLmlzRGlzYWJsZWQgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgaWYgKGRhdGUgPT09ICd0b2RheScpIHtcbiAgICAgIGRhdGUgPSBkYXRlUGFyc2VyLmZyb21UaW1lem9uZShuZXcgRGF0ZSgpLCBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ3RpbWV6b25lJykpO1xuICAgIH1cblxuICAgIHZhciBkYXRlcyA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChbJ21pbkRhdGUnLCAnbWF4RGF0ZSddLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmICghJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zW2tleV0pIHtcbiAgICAgICAgZGF0ZXNba2V5XSA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNEYXRlKCRzY29wZS5kYXRlcGlja2VyT3B0aW9uc1trZXldKSkge1xuICAgICAgICBkYXRlc1trZXldID0gbmV3IERhdGUoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zW2tleV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCRkYXRlcGlja2VyUG9wdXBMaXRlcmFsV2FybmluZykge1xuICAgICAgICAgICRsb2cud2FybignTGl0ZXJhbCBkYXRlIHN1cHBvcnQgaGFzIGJlZW4gZGVwcmVjYXRlZCwgcGxlYXNlIHN3aXRjaCB0byBkYXRlIG9iamVjdCB1c2FnZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0ZXNba2V5XSA9IG5ldyBEYXRlKGRhdGVGaWx0ZXIoJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zW2tleV0sICdtZWRpdW0nKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHNjb3BlLmRhdGVwaWNrZXJPcHRpb25zICYmXG4gICAgICBkYXRlcy5taW5EYXRlICYmICRzY29wZS5jb21wYXJlKGRhdGUsIGRhdGVzLm1pbkRhdGUpIDwgMCB8fFxuICAgICAgZGF0ZXMubWF4RGF0ZSAmJiAkc2NvcGUuY29tcGFyZShkYXRlLCBkYXRlcy5tYXhEYXRlKSA+IDA7XG4gIH07XG5cbiAgJHNjb3BlLmNvbXBhcmUgPSBmdW5jdGlvbihkYXRlMSwgZGF0ZTIpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZTEuZ2V0RnVsbFllYXIoKSwgZGF0ZTEuZ2V0TW9udGgoKSwgZGF0ZTEuZ2V0RGF0ZSgpKSAtIG5ldyBEYXRlKGRhdGUyLmdldEZ1bGxZZWFyKCksIGRhdGUyLmdldE1vbnRoKCksIGRhdGUyLmdldERhdGUoKSk7XG4gIH07XG5cbiAgLy8gSW5uZXIgY2hhbmdlXG4gICRzY29wZS5kYXRlU2VsZWN0aW9uID0gZnVuY3Rpb24oZHQpIHtcbiAgICAkc2NvcGUuZGF0ZSA9IGR0O1xuICAgIHZhciBkYXRlID0gJHNjb3BlLmRhdGUgPyBkYXRlUGFyc2VyLmZpbHRlcigkc2NvcGUuZGF0ZSwgZGF0ZUZvcm1hdCkgOiBudWxsOyAvLyBTZXR0aW5nIHRvIE5VTEwgaXMgbmVjZXNzYXJ5IGZvciBmb3JtIHZhbGlkYXRvcnMgdG8gZnVuY3Rpb25cbiAgICAkZWxlbWVudC52YWwoZGF0ZSk7XG4gICAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKGRhdGUpO1xuXG4gICAgaWYgKGNsb3NlT25EYXRlU2VsZWN0aW9uKSB7XG4gICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAkZWxlbWVudFswXS5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUua2V5ZG93biA9IGZ1bmN0aW9uKGV2dCkge1xuICAgIGlmIChldnQud2hpY2ggPT09IDI3KSB7XG4gICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAkZWxlbWVudFswXS5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oZGF0ZSwgZXZ0KSB7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgaWYgKGRhdGUgPT09ICd0b2RheScpIHtcbiAgICAgIHZhciB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICBpZiAoYW5ndWxhci5pc0RhdGUoJHNjb3BlLmRhdGUpKSB7XG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgkc2NvcGUuZGF0ZSk7XG4gICAgICAgIGRhdGUuc2V0RnVsbFllYXIodG9kYXkuZ2V0RnVsbFllYXIoKSwgdG9kYXkuZ2V0TW9udGgoKSwgdG9kYXkuZ2V0RGF0ZSgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGUgPSBkYXRlUGFyc2VyLmZyb21UaW1lem9uZSh0b2RheSwgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCd0aW1lem9uZScpKTtcbiAgICAgICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgJHNjb3BlLmRhdGVTZWxlY3Rpb24oZGF0ZSk7XG4gIH07XG5cbiAgJHNjb3BlLmNsb3NlID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICRlbGVtZW50WzBdLmZvY3VzKCk7XG4gIH07XG5cbiAgJHNjb3BlLmRpc2FibGVkID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmRpc2FibGVkKSB8fCBmYWxzZTtcbiAgaWYgKCRhdHRycy5uZ0Rpc2FibGVkKSB7XG4gICAgd2F0Y2hMaXN0ZW5lcnMucHVzaCgkc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKCRhdHRycy5uZ0Rpc2FibGVkKSwgZnVuY3Rpb24oZGlzYWJsZWQpIHtcbiAgICAgICRzY29wZS5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH0pKTtcbiAgfVxuXG4gICRzY29wZS4kd2F0Y2goJ2lzT3BlbicsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBpZiAoISRzY29wZS5kaXNhYmxlZCkge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBwb3NpdGlvblBvcHVwKCk7XG5cbiAgICAgICAgICBpZiAob25PcGVuRm9jdXMpIHtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCd1aWI6ZGF0ZXBpY2tlci5mb2N1cycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgICRkb2N1bWVudC5vbignY2xpY2snLCBkb2N1bWVudENsaWNrQmluZCk7XG5cbiAgICAgICAgICB2YXIgcGxhY2VtZW50ID0gJGF0dHJzLnBvcHVwUGxhY2VtZW50ID8gJGF0dHJzLnBvcHVwUGxhY2VtZW50IDogZGF0ZXBpY2tlclBvcHVwQ29uZmlnLnBsYWNlbWVudDtcbiAgICAgICAgICBpZiAoYXBwZW5kVG9Cb2R5IHx8ICRwb3NpdGlvbi5wYXJzZVBsYWNlbWVudChwbGFjZW1lbnQpWzJdKSB7XG4gICAgICAgICAgICBzY3JvbGxQYXJlbnRFbCA9IHNjcm9sbFBhcmVudEVsIHx8IGFuZ3VsYXIuZWxlbWVudCgkcG9zaXRpb24uc2Nyb2xsUGFyZW50KCRlbGVtZW50KSk7XG4gICAgICAgICAgICBpZiAoc2Nyb2xsUGFyZW50RWwpIHtcbiAgICAgICAgICAgICAgc2Nyb2xsUGFyZW50RWwub24oJ3Njcm9sbCcsIHBvc2l0aW9uUG9wdXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JvbGxQYXJlbnRFbCA9IG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLm9uKCdyZXNpemUnLCBwb3NpdGlvblBvcHVwKTtcbiAgICAgICAgfSwgMCwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAkZG9jdW1lbnQub2ZmKCdjbGljaycsIGRvY3VtZW50Q2xpY2tCaW5kKTtcbiAgICAgIGlmIChzY3JvbGxQYXJlbnRFbCkge1xuICAgICAgICBzY3JvbGxQYXJlbnRFbC5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uUG9wdXApO1xuICAgICAgfVxuICAgICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLm9mZigncmVzaXplJywgcG9zaXRpb25Qb3B1cCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBjYW1lbHRvRGFzaChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oJDEpIHsgcmV0dXJuICctJyArICQxLnRvTG93ZXJDYXNlKCk7IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VEYXRlU3RyaW5nKHZpZXdWYWx1ZSkge1xuICAgIHZhciBkYXRlID0gZGF0ZVBhcnNlci5wYXJzZSh2aWV3VmFsdWUsIGRhdGVGb3JtYXQsICRzY29wZS5kYXRlKTtcbiAgICBpZiAoaXNOYU4oZGF0ZSkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWx0SW5wdXRGb3JtYXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRhdGUgPSBkYXRlUGFyc2VyLnBhcnNlKHZpZXdWYWx1ZSwgYWx0SW5wdXRGb3JtYXRzW2ldLCAkc2NvcGUuZGF0ZSk7XG4gICAgICAgIGlmICghaXNOYU4oZGF0ZSkpIHtcbiAgICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlRGF0ZSh2aWV3VmFsdWUpIHtcbiAgICBpZiAoYW5ndWxhci5pc051bWJlcih2aWV3VmFsdWUpKSB7XG4gICAgICAvLyBwcmVzdW1hYmx5IHRpbWVzdGFtcCB0byBkYXRlIG9iamVjdFxuICAgICAgdmlld1ZhbHVlID0gbmV3IERhdGUodmlld1ZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAoIXZpZXdWYWx1ZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGFuZ3VsYXIuaXNEYXRlKHZpZXdWYWx1ZSkgJiYgIWlzTmFOKHZpZXdWYWx1ZSkpIHtcbiAgICAgIHJldHVybiB2aWV3VmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKGFuZ3VsYXIuaXNTdHJpbmcodmlld1ZhbHVlKSkge1xuICAgICAgdmFyIGRhdGUgPSBwYXJzZURhdGVTdHJpbmcodmlld1ZhbHVlKTtcbiAgICAgIGlmICghaXNOYU4oZGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGRhdGVQYXJzZXIudG9UaW1lem9uZShkYXRlLCBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ3RpbWV6b25lJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ2FsbG93SW52YWxpZCcpID8gdmlld1ZhbHVlIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gdmFsaWRhdG9yKG1vZGVsVmFsdWUsIHZpZXdWYWx1ZSkge1xuICAgIHZhciB2YWx1ZSA9IG1vZGVsVmFsdWUgfHwgdmlld1ZhbHVlO1xuXG4gICAgaWYgKCEkYXR0cnMubmdSZXF1aXJlZCAmJiAhdmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChhbmd1bGFyLmlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSBuZXcgRGF0ZSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGFuZ3VsYXIuaXNEYXRlKHZhbHVlKSAmJiAhaXNOYU4odmFsdWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoYW5ndWxhci5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiAhaXNOYU4ocGFyc2VEYXRlU3RyaW5nKHZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gZG9jdW1lbnRDbGlja0JpbmQoZXZlbnQpIHtcbiAgICBpZiAoISRzY29wZS5pc09wZW4gJiYgJHNjb3BlLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHBvcHVwID0gJHBvcHVwWzBdO1xuICAgIHZhciBkcENvbnRhaW5zVGFyZ2V0ID0gJGVsZW1lbnRbMF0uY29udGFpbnMoZXZlbnQudGFyZ2V0KTtcbiAgICAvLyBUaGUgcG9wdXAgbm9kZSBtYXkgbm90IGJlIGFuIGVsZW1lbnQgbm9kZVxuICAgIC8vIEluIHNvbWUgYnJvd3NlcnMgKElFKSBvbmx5IGVsZW1lbnQgbm9kZXMgaGF2ZSB0aGUgJ2NvbnRhaW5zJyBmdW5jdGlvblxuICAgIHZhciBwb3B1cENvbnRhaW5zVGFyZ2V0ID0gcG9wdXAuY29udGFpbnMgIT09IHVuZGVmaW5lZCAmJiBwb3B1cC5jb250YWlucyhldmVudC50YXJnZXQpO1xuICAgIGlmICgkc2NvcGUuaXNPcGVuICYmICEoZHBDb250YWluc1RhcmdldCB8fCBwb3B1cENvbnRhaW5zVGFyZ2V0KSkge1xuICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5wdXRLZXlkb3duQmluZChldnQpIHtcbiAgICBpZiAoZXZ0LndoaWNoID09PSAyNyAmJiAkc2NvcGUuaXNPcGVuKSB7XG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgICAgJGVsZW1lbnRbMF0uZm9jdXMoKTtcbiAgICB9IGVsc2UgaWYgKGV2dC53aGljaCA9PT0gNDAgJiYgISRzY29wZS5pc09wZW4pIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwb3NpdGlvblBvcHVwKCkge1xuICAgIGlmICgkc2NvcGUuaXNPcGVuKSB7XG4gICAgICB2YXIgZHBFbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KCRwb3B1cFswXS5xdWVyeVNlbGVjdG9yKCcudWliLWRhdGVwaWNrZXItcG9wdXAnKSk7XG4gICAgICB2YXIgcGxhY2VtZW50ID0gJGF0dHJzLnBvcHVwUGxhY2VtZW50ID8gJGF0dHJzLnBvcHVwUGxhY2VtZW50IDogZGF0ZXBpY2tlclBvcHVwQ29uZmlnLnBsYWNlbWVudDtcbiAgICAgIHZhciBwb3NpdGlvbiA9ICRwb3NpdGlvbi5wb3NpdGlvbkVsZW1lbnRzKCRlbGVtZW50LCBkcEVsZW1lbnQsIHBsYWNlbWVudCwgYXBwZW5kVG9Cb2R5KTtcbiAgICAgIGRwRWxlbWVudC5jc3Moe3RvcDogcG9zaXRpb24udG9wICsgJ3B4JywgbGVmdDogcG9zaXRpb24ubGVmdCArICdweCd9KTtcbiAgICAgIGlmIChkcEVsZW1lbnQuaGFzQ2xhc3MoJ3VpYi1wb3NpdGlvbi1tZWFzdXJlJykpIHtcbiAgICAgICAgZHBFbGVtZW50LnJlbW92ZUNsYXNzKCd1aWItcG9zaXRpb24tbWVhc3VyZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3RPcHRpb25zKG5nTW9kZWxDdHJsKSB7XG4gICAgdmFyIG5nTW9kZWxPcHRpb25zO1xuXG4gICAgaWYgKGFuZ3VsYXIudmVyc2lvbi5taW5vciA8IDYpIHsgLy8gaW4gYW5ndWxhciA8IDEuNiAkb3B0aW9ucyBjb3VsZCBiZSBtaXNzaW5nXG4gICAgICAvLyBndWFyYW50ZWUgYSB2YWx1ZVxuICAgICAgbmdNb2RlbE9wdGlvbnMgPSBhbmd1bGFyLmlzT2JqZWN0KG5nTW9kZWxDdHJsLiRvcHRpb25zKSA/XG4gICAgICAgIG5nTW9kZWxDdHJsLiRvcHRpb25zIDpcbiAgICAgICAge1xuICAgICAgICAgIHRpbWV6b25lOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgIC8vIG1pbWljIDEuNisgYXBpXG4gICAgICBuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBuZ01vZGVsT3B0aW9uc1trZXldO1xuICAgICAgfTtcbiAgICB9IGVsc2UgeyAvLyBpbiBhbmd1bGFyID49MS42ICRvcHRpb25zIGlzIGFsd2F5cyBwcmVzZW50XG4gICAgICBuZ01vZGVsT3B0aW9ucyA9IG5nTW9kZWxDdHJsLiRvcHRpb25zO1xuICAgIH1cblxuICAgIHJldHVybiBuZ01vZGVsT3B0aW9ucztcbiAgfVxuXG4gICRzY29wZS4kb24oJ3VpYjpkYXRlcGlja2VyLm1vZGUnLCBmdW5jdGlvbigpIHtcbiAgICAkdGltZW91dChwb3NpdGlvblBvcHVwLCAwLCBmYWxzZSk7XG4gIH0pO1xufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYkRhdGVwaWNrZXJQb3B1cCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlcXVpcmU6IFsnbmdNb2RlbCcsICd1aWJEYXRlcGlja2VyUG9wdXAnXSxcbiAgICBjb250cm9sbGVyOiAnVWliRGF0ZXBpY2tlclBvcHVwQ29udHJvbGxlcicsXG4gICAgc2NvcGU6IHtcbiAgICAgIGRhdGVwaWNrZXJPcHRpb25zOiAnPT8nLFxuICAgICAgaXNPcGVuOiAnPT8nLFxuICAgICAgY3VycmVudFRleHQ6ICdAJyxcbiAgICAgIGNsZWFyVGV4dDogJ0AnLFxuICAgICAgY2xvc2VUZXh0OiAnQCdcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY3RybHMpIHtcbiAgICAgIHZhciBuZ01vZGVsID0gY3RybHNbMF0sXG4gICAgICAgIGN0cmwgPSBjdHJsc1sxXTtcblxuICAgICAgY3RybC5pbml0KG5nTW9kZWwpO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5kaXJlY3RpdmUoJ3VpYkRhdGVwaWNrZXJQb3B1cFdyYXAnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgdGVtcGxhdGVVcmw6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICByZXR1cm4gYXR0cnMudGVtcGxhdGVVcmwgfHwgJ3VpYi90ZW1wbGF0ZS9kYXRlcGlja2VyUG9wdXAvcG9wdXAuaHRtbCc7XG4gICAgfVxuICB9O1xufSk7XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5ib290c3RyYXAuZGVib3VuY2UnLCBbXSlcbi8qKlxuICogQSBoZWxwZXIsIGludGVybmFsIHNlcnZpY2UgdGhhdCBkZWJvdW5jZXMgYSBmdW5jdGlvblxuICovXG4gIC5mYWN0b3J5KCckJGRlYm91bmNlJywgWyckdGltZW91dCcsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrLCBkZWJvdW5jZVRpbWUpIHtcbiAgICAgIHZhciB0aW1lb3V0UHJvbWlzZTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKHRpbWVvdXRQcm9taXNlKSB7XG4gICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0sIGRlYm91bmNlVGltZSk7XG4gICAgICB9O1xuICAgIH07XG4gIH1dKTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5tdWx0aU1hcCcsIFtdKVxuLyoqXG4gKiBBIGhlbHBlciwgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBzdG9yZXMgYWxsIHJlZmVyZW5jZXMgYXR0YWNoZWQgdG8ga2V5XG4gKi9cbiAgLmZhY3RvcnkoJyQkbXVsdGlNYXAnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY3JlYXRlTmV3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hcCA9IHt9O1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobWFwKS5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1hcFtrZXldXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwW2tleV07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBoYXNLZXk6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICEhbWFwW2tleV07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBrZXlzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhtYXApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcHV0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIW1hcFtrZXldKSB7XG4gICAgICAgICAgICAgIG1hcFtrZXldID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1hcFtrZXldLnB1c2godmFsdWUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gbWFwW2tleV07XG5cbiAgICAgICAgICAgIGlmICghdmFsdWVzKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGlkeCA9IHZhbHVlcy5pbmRleE9mKHZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgdmFsdWVzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgZGVsZXRlIG1hcFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5kcm9wZG93bicsIFsndWkuYm9vdHN0cmFwLm11bHRpTWFwJywgJ3VpLmJvb3RzdHJhcC5wb3NpdGlvbiddKVxuXG4uY29uc3RhbnQoJ3VpYkRyb3Bkb3duQ29uZmlnJywge1xuICBhcHBlbmRUb09wZW5DbGFzczogJ3VpYi1kcm9wZG93bi1vcGVuJyxcbiAgb3BlbkNsYXNzOiAnb3Blbidcbn0pXG5cbi5zZXJ2aWNlKCd1aWJEcm9wZG93blNlcnZpY2UnLCBbJyRkb2N1bWVudCcsICckcm9vdFNjb3BlJywgJyQkbXVsdGlNYXAnLCBmdW5jdGlvbigkZG9jdW1lbnQsICRyb290U2NvcGUsICQkbXVsdGlNYXApIHtcbiAgdmFyIG9wZW5TY29wZSA9IG51bGw7XG4gIHZhciBvcGVuZWRDb250YWluZXJzID0gJCRtdWx0aU1hcC5jcmVhdGVOZXcoKTtcblxuICB0aGlzLmlzT25seU9wZW4gPSBmdW5jdGlvbihkcm9wZG93blNjb3BlLCBhcHBlbmRUbykge1xuICAgIHZhciBvcGVuZWREcm9wZG93bnMgPSBvcGVuZWRDb250YWluZXJzLmdldChhcHBlbmRUbyk7XG4gICAgaWYgKG9wZW5lZERyb3Bkb3ducykge1xuICAgICAgdmFyIG9wZW5Ecm9wZG93biA9IG9wZW5lZERyb3Bkb3ducy5yZWR1Y2UoZnVuY3Rpb24odG9DbG9zZSwgZHJvcGRvd24pIHtcbiAgICAgICAgaWYgKGRyb3Bkb3duLnNjb3BlID09PSBkcm9wZG93blNjb3BlKSB7XG4gICAgICAgICAgcmV0dXJuIGRyb3Bkb3duO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRvQ2xvc2U7XG4gICAgICB9LCB7fSk7XG4gICAgICBpZiAob3BlbkRyb3Bkb3duKSB7XG4gICAgICAgIHJldHVybiBvcGVuZWREcm9wZG93bnMubGVuZ3RoID09PSAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICB0aGlzLm9wZW4gPSBmdW5jdGlvbihkcm9wZG93blNjb3BlLCBlbGVtZW50LCBhcHBlbmRUbykge1xuICAgIGlmICghb3BlblNjb3BlKSB7XG4gICAgICAkZG9jdW1lbnQub24oJ2NsaWNrJywgY2xvc2VEcm9wZG93bik7XG4gICAgfVxuXG4gICAgaWYgKG9wZW5TY29wZSAmJiBvcGVuU2NvcGUgIT09IGRyb3Bkb3duU2NvcGUpIHtcbiAgICAgIG9wZW5TY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICB9XG5cbiAgICBvcGVuU2NvcGUgPSBkcm9wZG93blNjb3BlO1xuXG4gICAgaWYgKCFhcHBlbmRUbykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBvcGVuZWREcm9wZG93bnMgPSBvcGVuZWRDb250YWluZXJzLmdldChhcHBlbmRUbyk7XG4gICAgaWYgKG9wZW5lZERyb3Bkb3ducykge1xuICAgICAgdmFyIG9wZW5lZFNjb3BlcyA9IG9wZW5lZERyb3Bkb3ducy5tYXAoZnVuY3Rpb24oZHJvcGRvd24pIHtcbiAgICAgICAgcmV0dXJuIGRyb3Bkb3duLnNjb3BlO1xuICAgICAgfSk7XG4gICAgICBpZiAob3BlbmVkU2NvcGVzLmluZGV4T2YoZHJvcGRvd25TY29wZSkgPT09IC0xKSB7XG4gICAgICAgIG9wZW5lZENvbnRhaW5lcnMucHV0KGFwcGVuZFRvLCB7XG4gICAgICAgICAgc2NvcGU6IGRyb3Bkb3duU2NvcGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wZW5lZENvbnRhaW5lcnMucHV0KGFwcGVuZFRvLCB7XG4gICAgICAgIHNjb3BlOiBkcm9wZG93blNjb3BlXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uKGRyb3Bkb3duU2NvcGUsIGVsZW1lbnQsIGFwcGVuZFRvKSB7XG4gICAgaWYgKG9wZW5TY29wZSA9PT0gZHJvcGRvd25TY29wZSkge1xuICAgICAgJGRvY3VtZW50Lm9mZignY2xpY2snLCBjbG9zZURyb3Bkb3duKTtcbiAgICAgICRkb2N1bWVudC5vZmYoJ2tleWRvd24nLCB0aGlzLmtleWJpbmRGaWx0ZXIpO1xuICAgICAgb3BlblNjb3BlID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIWFwcGVuZFRvKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG9wZW5lZERyb3Bkb3ducyA9IG9wZW5lZENvbnRhaW5lcnMuZ2V0KGFwcGVuZFRvKTtcbiAgICBpZiAob3BlbmVkRHJvcGRvd25zKSB7XG4gICAgICB2YXIgZHJvcGRvd25Ub0Nsb3NlID0gb3BlbmVkRHJvcGRvd25zLnJlZHVjZShmdW5jdGlvbih0b0Nsb3NlLCBkcm9wZG93bikge1xuICAgICAgICBpZiAoZHJvcGRvd24uc2NvcGUgPT09IGRyb3Bkb3duU2NvcGUpIHtcbiAgICAgICAgICByZXR1cm4gZHJvcGRvd247XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9DbG9zZTtcbiAgICAgIH0sIHt9KTtcbiAgICAgIGlmIChkcm9wZG93blRvQ2xvc2UpIHtcbiAgICAgICAgb3BlbmVkQ29udGFpbmVycy5yZW1vdmUoYXBwZW5kVG8sIGRyb3Bkb3duVG9DbG9zZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHZhciBjbG9zZURyb3Bkb3duID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgLy8gVGhpcyBtZXRob2QgbWF5IHN0aWxsIGJlIGNhbGxlZCBkdXJpbmcgdGhlIHNhbWUgbW91c2UgZXZlbnQgdGhhdFxuICAgIC8vIHVuYm91bmQgdGhpcyBldmVudCBoYW5kbGVyLiBTbyBjaGVjayBvcGVuU2NvcGUgYmVmb3JlIHByb2NlZWRpbmcuXG4gICAgaWYgKCFvcGVuU2NvcGUgfHwgIW9wZW5TY29wZS5pc09wZW4pIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAoZXZ0ICYmIG9wZW5TY29wZS5nZXRBdXRvQ2xvc2UoKSA9PT0gJ2Rpc2FibGVkJykgeyByZXR1cm47IH1cblxuICAgIGlmIChldnQgJiYgZXZ0LndoaWNoID09PSAzKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHRvZ2dsZUVsZW1lbnQgPSBvcGVuU2NvcGUuZ2V0VG9nZ2xlRWxlbWVudCgpO1xuICAgIGlmIChldnQgJiYgdG9nZ2xlRWxlbWVudCAmJiB0b2dnbGVFbGVtZW50WzBdLmNvbnRhaW5zKGV2dC50YXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRyb3Bkb3duRWxlbWVudCA9IG9wZW5TY29wZS5nZXREcm9wZG93bkVsZW1lbnQoKTtcbiAgICBpZiAoZXZ0ICYmIG9wZW5TY29wZS5nZXRBdXRvQ2xvc2UoKSA9PT0gJ291dHNpZGVDbGljaycgJiZcbiAgICAgIGRyb3Bkb3duRWxlbWVudCAmJiBkcm9wZG93bkVsZW1lbnRbMF0uY29udGFpbnMoZXZ0LnRhcmdldCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvcGVuU2NvcGUuZm9jdXNUb2dnbGVFbGVtZW50KCk7XG4gICAgb3BlblNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuXG4gICAgaWYgKCEkcm9vdFNjb3BlLiQkcGhhc2UpIHtcbiAgICAgIG9wZW5TY29wZS4kYXBwbHkoKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5rZXliaW5kRmlsdGVyID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgaWYgKCFvcGVuU2NvcGUpIHtcbiAgICAgIC8vIHNlZSB0aGlzLmNsb3NlIGFzIEVTQyBjb3VsZCBoYXZlIGJlZW4gcHJlc3NlZCB3aGljaCBraWxscyB0aGUgc2NvcGUgc28gd2UgY2FuIG5vdCBwcm9jZWVkXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRyb3Bkb3duRWxlbWVudCA9IG9wZW5TY29wZS5nZXREcm9wZG93bkVsZW1lbnQoKTtcbiAgICB2YXIgdG9nZ2xlRWxlbWVudCA9IG9wZW5TY29wZS5nZXRUb2dnbGVFbGVtZW50KCk7XG4gICAgdmFyIGRyb3Bkb3duRWxlbWVudFRhcmdldGVkID0gZHJvcGRvd25FbGVtZW50ICYmIGRyb3Bkb3duRWxlbWVudFswXS5jb250YWlucyhldnQudGFyZ2V0KTtcbiAgICB2YXIgdG9nZ2xlRWxlbWVudFRhcmdldGVkID0gdG9nZ2xlRWxlbWVudCAmJiB0b2dnbGVFbGVtZW50WzBdLmNvbnRhaW5zKGV2dC50YXJnZXQpO1xuICAgIGlmIChldnQud2hpY2ggPT09IDI3KSB7XG4gICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBvcGVuU2NvcGUuZm9jdXNUb2dnbGVFbGVtZW50KCk7XG4gICAgICBjbG9zZURyb3Bkb3duKCk7XG4gICAgfSBlbHNlIGlmIChvcGVuU2NvcGUuaXNLZXluYXZFbmFibGVkKCkgJiYgWzM4LCA0MF0uaW5kZXhPZihldnQud2hpY2gpICE9PSAtMSAmJiBvcGVuU2NvcGUuaXNPcGVuICYmIChkcm9wZG93bkVsZW1lbnRUYXJnZXRlZCB8fCB0b2dnbGVFbGVtZW50VGFyZ2V0ZWQpKSB7XG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG9wZW5TY29wZS5mb2N1c0Ryb3Bkb3duRW50cnkoZXZ0LndoaWNoKTtcbiAgICB9XG4gIH07XG59XSlcblxuLmNvbnRyb2xsZXIoJ1VpYkRyb3Bkb3duQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRlbGVtZW50JywgJyRhdHRycycsICckcGFyc2UnLCAndWliRHJvcGRvd25Db25maWcnLCAndWliRHJvcGRvd25TZXJ2aWNlJywgJyRhbmltYXRlJywgJyR1aWJQb3NpdGlvbicsICckZG9jdW1lbnQnLCAnJGNvbXBpbGUnLCAnJHRlbXBsYXRlUmVxdWVzdCcsIGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJHBhcnNlLCBkcm9wZG93bkNvbmZpZywgdWliRHJvcGRvd25TZXJ2aWNlLCAkYW5pbWF0ZSwgJHBvc2l0aW9uLCAkZG9jdW1lbnQsICRjb21waWxlLCAkdGVtcGxhdGVSZXF1ZXN0KSB7XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICBzY29wZSA9ICRzY29wZS4kbmV3KCksIC8vIGNyZWF0ZSBhIGNoaWxkIHNjb3BlIHNvIHdlIGFyZSBub3QgcG9sbHV0aW5nIG9yaWdpbmFsIG9uZVxuICAgIHRlbXBsYXRlU2NvcGUsXG4gICAgYXBwZW5kVG9PcGVuQ2xhc3MgPSBkcm9wZG93bkNvbmZpZy5hcHBlbmRUb09wZW5DbGFzcyxcbiAgICBvcGVuQ2xhc3MgPSBkcm9wZG93bkNvbmZpZy5vcGVuQ2xhc3MsXG4gICAgZ2V0SXNPcGVuLFxuICAgIHNldElzT3BlbiA9IGFuZ3VsYXIubm9vcCxcbiAgICB0b2dnbGVJbnZva2VyID0gJGF0dHJzLm9uVG9nZ2xlID8gJHBhcnNlKCRhdHRycy5vblRvZ2dsZSkgOiBhbmd1bGFyLm5vb3AsXG4gICAga2V5bmF2RW5hYmxlZCA9IGZhbHNlLFxuICAgIHNlbGVjdGVkT3B0aW9uID0gbnVsbCxcbiAgICBib2R5ID0gJGRvY3VtZW50LmZpbmQoJ2JvZHknKTtcblxuICAkZWxlbWVudC5hZGRDbGFzcygnZHJvcGRvd24nKTtcblxuICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoJGF0dHJzLmlzT3Blbikge1xuICAgICAgZ2V0SXNPcGVuID0gJHBhcnNlKCRhdHRycy5pc09wZW4pO1xuICAgICAgc2V0SXNPcGVuID0gZ2V0SXNPcGVuLmFzc2lnbjtcblxuICAgICAgJHNjb3BlLiR3YXRjaChnZXRJc09wZW4sIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHNjb3BlLmlzT3BlbiA9ICEhdmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBrZXluYXZFbmFibGVkID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmtleWJvYXJkTmF2KTtcbiAgfTtcblxuICB0aGlzLnRvZ2dsZSA9IGZ1bmN0aW9uKG9wZW4pIHtcbiAgICBzY29wZS5pc09wZW4gPSBhcmd1bWVudHMubGVuZ3RoID8gISFvcGVuIDogIXNjb3BlLmlzT3BlbjtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKHNldElzT3BlbikpIHtcbiAgICAgIHNldElzT3BlbihzY29wZSwgc2NvcGUuaXNPcGVuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2NvcGUuaXNPcGVuO1xuICB9O1xuXG4gIC8vIEFsbG93IG90aGVyIGRpcmVjdGl2ZXMgdG8gd2F0Y2ggc3RhdHVzXG4gIHRoaXMuaXNPcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjb3BlLmlzT3BlbjtcbiAgfTtcblxuICBzY29wZS5nZXRUb2dnbGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYudG9nZ2xlRWxlbWVudDtcbiAgfTtcblxuICBzY29wZS5nZXRBdXRvQ2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJGF0dHJzLmF1dG9DbG9zZSB8fCAnYWx3YXlzJzsgLy9vciAnb3V0c2lkZUNsaWNrJyBvciAnZGlzYWJsZWQnXG4gIH07XG5cbiAgc2NvcGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkZWxlbWVudDtcbiAgfTtcblxuICBzY29wZS5pc0tleW5hdkVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ga2V5bmF2RW5hYmxlZDtcbiAgfTtcblxuICBzY29wZS5mb2N1c0Ryb3Bkb3duRW50cnkgPSBmdW5jdGlvbihrZXlDb2RlKSB7XG4gICAgdmFyIGVsZW1zID0gc2VsZi5kcm9wZG93bk1lbnUgPyAvL0lmIGFwcGVuZCB0byBib2R5IGlzIHVzZWQuXG4gICAgICBhbmd1bGFyLmVsZW1lbnQoc2VsZi5kcm9wZG93bk1lbnUpLmZpbmQoJ2EnKSA6XG4gICAgICAkZWxlbWVudC5maW5kKCd1bCcpLmVxKDApLmZpbmQoJ2EnKTtcblxuICAgIHN3aXRjaCAoa2V5Q29kZSkge1xuICAgICAgY2FzZSA0MDoge1xuICAgICAgICBpZiAoIWFuZ3VsYXIuaXNOdW1iZXIoc2VsZi5zZWxlY3RlZE9wdGlvbikpIHtcbiAgICAgICAgICBzZWxmLnNlbGVjdGVkT3B0aW9uID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLnNlbGVjdGVkT3B0aW9uID0gc2VsZi5zZWxlY3RlZE9wdGlvbiA9PT0gZWxlbXMubGVuZ3RoIC0gMSA/XG4gICAgICAgICAgICBzZWxmLnNlbGVjdGVkT3B0aW9uIDpcbiAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWRPcHRpb24gKyAxO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAzODoge1xuICAgICAgICBpZiAoIWFuZ3VsYXIuaXNOdW1iZXIoc2VsZi5zZWxlY3RlZE9wdGlvbikpIHtcbiAgICAgICAgICBzZWxmLnNlbGVjdGVkT3B0aW9uID0gZWxlbXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLnNlbGVjdGVkT3B0aW9uID0gc2VsZi5zZWxlY3RlZE9wdGlvbiA9PT0gMCA/XG4gICAgICAgICAgICAwIDogc2VsZi5zZWxlY3RlZE9wdGlvbiAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGVsZW1zW3NlbGYuc2VsZWN0ZWRPcHRpb25dLmZvY3VzKCk7XG4gIH07XG5cbiAgc2NvcGUuZ2V0RHJvcGRvd25FbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZHJvcGRvd25NZW51O1xuICB9O1xuXG4gIHNjb3BlLmZvY3VzVG9nZ2xlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnRvZ2dsZUVsZW1lbnQpIHtcbiAgICAgIHNlbGYudG9nZ2xlRWxlbWVudFswXS5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiByZW1vdmVEcm9wZG93bk1lbnUoKSB7XG4gICAgJGVsZW1lbnQuYXBwZW5kKHNlbGYuZHJvcGRvd25NZW51KTtcbiAgfVxuXG4gIHNjb3BlLiR3YXRjaCgnaXNPcGVuJywgZnVuY3Rpb24oaXNPcGVuLCB3YXNPcGVuKSB7XG4gICAgdmFyIGFwcGVuZFRvID0gbnVsbCxcbiAgICAgIGFwcGVuZFRvQm9keSA9IGZhbHNlO1xuXG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5kcm9wZG93bkFwcGVuZFRvKSkge1xuICAgICAgdmFyIGFwcGVuZFRvRWwgPSAkcGFyc2UoJGF0dHJzLmRyb3Bkb3duQXBwZW5kVG8pKHNjb3BlKTtcbiAgICAgIGlmIChhcHBlbmRUb0VsKSB7XG4gICAgICAgIGFwcGVuZFRvID0gYW5ndWxhci5lbGVtZW50KGFwcGVuZFRvRWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuZHJvcGRvd25BcHBlbmRUb0JvZHkpKSB7XG4gICAgICB2YXIgYXBwZW5kVG9Cb2R5VmFsdWUgPSAkcGFyc2UoJGF0dHJzLmRyb3Bkb3duQXBwZW5kVG9Cb2R5KShzY29wZSk7XG4gICAgICBpZiAoYXBwZW5kVG9Cb2R5VmFsdWUgIT09IGZhbHNlKSB7XG4gICAgICAgIGFwcGVuZFRvQm9keSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFwcGVuZFRvQm9keSAmJiAhYXBwZW5kVG8pIHtcbiAgICAgIGFwcGVuZFRvID0gYm9keTtcbiAgICB9XG5cbiAgICBpZiAoYXBwZW5kVG8gJiYgc2VsZi5kcm9wZG93bk1lbnUpIHtcbiAgICAgIGlmIChpc09wZW4pIHtcbiAgICAgICAgYXBwZW5kVG8uYXBwZW5kKHNlbGYuZHJvcGRvd25NZW51KTtcbiAgICAgICAgJGVsZW1lbnQub24oJyRkZXN0cm95JywgcmVtb3ZlRHJvcGRvd25NZW51KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRlbGVtZW50Lm9mZignJGRlc3Ryb3knLCByZW1vdmVEcm9wZG93bk1lbnUpO1xuICAgICAgICByZW1vdmVEcm9wZG93bk1lbnUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYXBwZW5kVG8gJiYgc2VsZi5kcm9wZG93bk1lbnUpIHtcbiAgICAgIHZhciBwb3MgPSAkcG9zaXRpb24ucG9zaXRpb25FbGVtZW50cygkZWxlbWVudCwgc2VsZi5kcm9wZG93bk1lbnUsICdib3R0b20tbGVmdCcsIHRydWUpLFxuICAgICAgICBjc3MsXG4gICAgICAgIHJpZ2h0YWxpZ24sXG4gICAgICAgIHNjcm9sbGJhclBhZGRpbmcsXG4gICAgICAgIHNjcm9sbGJhcldpZHRoID0gMDtcblxuICAgICAgY3NzID0ge1xuICAgICAgICB0b3A6IHBvcy50b3AgKyAncHgnLFxuICAgICAgICBkaXNwbGF5OiBpc09wZW4gPyAnYmxvY2snIDogJ25vbmUnXG4gICAgICB9O1xuXG4gICAgICByaWdodGFsaWduID0gc2VsZi5kcm9wZG93bk1lbnUuaGFzQ2xhc3MoJ2Ryb3Bkb3duLW1lbnUtcmlnaHQnKTtcbiAgICAgIGlmICghcmlnaHRhbGlnbikge1xuICAgICAgICBjc3MubGVmdCA9IHBvcy5sZWZ0ICsgJ3B4JztcbiAgICAgICAgY3NzLnJpZ2h0ID0gJ2F1dG8nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3NzLmxlZnQgPSAnYXV0byc7XG4gICAgICAgIHNjcm9sbGJhclBhZGRpbmcgPSAkcG9zaXRpb24uc2Nyb2xsYmFyUGFkZGluZyhhcHBlbmRUbyk7XG5cbiAgICAgICAgaWYgKHNjcm9sbGJhclBhZGRpbmcuaGVpZ2h0T3ZlcmZsb3cgJiYgc2Nyb2xsYmFyUGFkZGluZy5zY3JvbGxiYXJXaWR0aCkge1xuICAgICAgICAgIHNjcm9sbGJhcldpZHRoID0gc2Nyb2xsYmFyUGFkZGluZy5zY3JvbGxiYXJXaWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNzcy5yaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gc2Nyb2xsYmFyV2lkdGggLVxuICAgICAgICAgIChwb3MubGVmdCArICRlbGVtZW50LnByb3AoJ29mZnNldFdpZHRoJykpICsgJ3B4JztcbiAgICAgIH1cblxuICAgICAgLy8gTmVlZCB0byBhZGp1c3Qgb3VyIHBvc2l0aW9uaW5nIHRvIGJlIHJlbGF0aXZlIHRvIHRoZSBhcHBlbmRUbyBjb250YWluZXJcbiAgICAgIC8vIGlmIGl0J3Mgbm90IHRoZSBib2R5IGVsZW1lbnRcbiAgICAgIGlmICghYXBwZW5kVG9Cb2R5KSB7XG4gICAgICAgIHZhciBhcHBlbmRPZmZzZXQgPSAkcG9zaXRpb24ub2Zmc2V0KGFwcGVuZFRvKTtcblxuICAgICAgICBjc3MudG9wID0gcG9zLnRvcCAtIGFwcGVuZE9mZnNldC50b3AgKyAncHgnO1xuXG4gICAgICAgIGlmICghcmlnaHRhbGlnbikge1xuICAgICAgICAgIGNzcy5sZWZ0ID0gcG9zLmxlZnQgLSBhcHBlbmRPZmZzZXQubGVmdCArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3NzLnJpZ2h0ID0gd2luZG93LmlubmVyV2lkdGggLVxuICAgICAgICAgICAgKHBvcy5sZWZ0IC0gYXBwZW5kT2Zmc2V0LmxlZnQgKyAkZWxlbWVudC5wcm9wKCdvZmZzZXRXaWR0aCcpKSArICdweCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5kcm9wZG93bk1lbnUuY3NzKGNzcyk7XG4gICAgfVxuXG4gICAgdmFyIG9wZW5Db250YWluZXIgPSBhcHBlbmRUbyA/IGFwcGVuZFRvIDogJGVsZW1lbnQ7XG4gICAgdmFyIGRyb3Bkb3duT3BlbkNsYXNzID0gYXBwZW5kVG8gPyBhcHBlbmRUb09wZW5DbGFzcyA6IG9wZW5DbGFzcztcbiAgICB2YXIgaGFzT3BlbkNsYXNzID0gb3BlbkNvbnRhaW5lci5oYXNDbGFzcyhkcm9wZG93bk9wZW5DbGFzcyk7XG4gICAgdmFyIGlzT25seU9wZW4gPSB1aWJEcm9wZG93blNlcnZpY2UuaXNPbmx5T3Blbigkc2NvcGUsIGFwcGVuZFRvKTtcblxuICAgIGlmIChoYXNPcGVuQ2xhc3MgPT09ICFpc09wZW4pIHtcbiAgICAgIHZhciB0b2dnbGVDbGFzcztcbiAgICAgIGlmIChhcHBlbmRUbykge1xuICAgICAgICB0b2dnbGVDbGFzcyA9ICFpc09ubHlPcGVuID8gJ2FkZENsYXNzJyA6ICdyZW1vdmVDbGFzcyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b2dnbGVDbGFzcyA9IGlzT3BlbiA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnO1xuICAgICAgfVxuICAgICAgJGFuaW1hdGVbdG9nZ2xlQ2xhc3NdKG9wZW5Db250YWluZXIsIGRyb3Bkb3duT3BlbkNsYXNzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoaXNPcGVuKSAmJiBpc09wZW4gIT09IHdhc09wZW4pIHtcbiAgICAgICAgICB0b2dnbGVJbnZva2VyKCRzY29wZSwgeyBvcGVuOiAhIWlzT3BlbiB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGlzT3Blbikge1xuICAgICAgaWYgKHNlbGYuZHJvcGRvd25NZW51VGVtcGxhdGVVcmwpIHtcbiAgICAgICAgJHRlbXBsYXRlUmVxdWVzdChzZWxmLmRyb3Bkb3duTWVudVRlbXBsYXRlVXJsKS50aGVuKGZ1bmN0aW9uKHRwbENvbnRlbnQpIHtcbiAgICAgICAgICB0ZW1wbGF0ZVNjb3BlID0gc2NvcGUuJG5ldygpO1xuICAgICAgICAgICRjb21waWxlKHRwbENvbnRlbnQudHJpbSgpKSh0ZW1wbGF0ZVNjb3BlLCBmdW5jdGlvbihkcm9wZG93bkVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBuZXdFbCA9IGRyb3Bkb3duRWxlbWVudDtcbiAgICAgICAgICAgIHNlbGYuZHJvcGRvd25NZW51LnJlcGxhY2VXaXRoKG5ld0VsKTtcbiAgICAgICAgICAgIHNlbGYuZHJvcGRvd25NZW51ID0gbmV3RWw7XG4gICAgICAgICAgICAkZG9jdW1lbnQub24oJ2tleWRvd24nLCB1aWJEcm9wZG93blNlcnZpY2Uua2V5YmluZEZpbHRlcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJGRvY3VtZW50Lm9uKCdrZXlkb3duJywgdWliRHJvcGRvd25TZXJ2aWNlLmtleWJpbmRGaWx0ZXIpO1xuICAgICAgfVxuXG4gICAgICBzY29wZS5mb2N1c1RvZ2dsZUVsZW1lbnQoKTtcbiAgICAgIHVpYkRyb3Bkb3duU2VydmljZS5vcGVuKHNjb3BlLCAkZWxlbWVudCwgYXBwZW5kVG8pO1xuICAgIH0gZWxzZSB7XG4gICAgICB1aWJEcm9wZG93blNlcnZpY2UuY2xvc2Uoc2NvcGUsICRlbGVtZW50LCBhcHBlbmRUbyk7XG4gICAgICBpZiAoc2VsZi5kcm9wZG93bk1lbnVUZW1wbGF0ZVVybCkge1xuICAgICAgICBpZiAodGVtcGxhdGVTY29wZSkge1xuICAgICAgICAgIHRlbXBsYXRlU2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV3RWwgPSBhbmd1bGFyLmVsZW1lbnQoJzx1bCBjbGFzcz1cImRyb3Bkb3duLW1lbnVcIj48L3VsPicpO1xuICAgICAgICBzZWxmLmRyb3Bkb3duTWVudS5yZXBsYWNlV2l0aChuZXdFbCk7XG4gICAgICAgIHNlbGYuZHJvcGRvd25NZW51ID0gbmV3RWw7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuc2VsZWN0ZWRPcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oc2V0SXNPcGVuKSkge1xuICAgICAgc2V0SXNPcGVuKCRzY29wZSwgaXNPcGVuKTtcbiAgICB9XG4gIH0pO1xufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYkRyb3Bkb3duJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgY29udHJvbGxlcjogJ1VpYkRyb3Bkb3duQ29udHJvbGxlcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBkcm9wZG93bkN0cmwpIHtcbiAgICAgIGRyb3Bkb3duQ3RybC5pbml0KCk7XG4gICAgfVxuICB9O1xufSlcblxuLmRpcmVjdGl2ZSgndWliRHJvcGRvd25NZW51JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICByZXF1aXJlOiAnP151aWJEcm9wZG93bicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBkcm9wZG93bkN0cmwpIHtcbiAgICAgIGlmICghZHJvcGRvd25DdHJsIHx8IGFuZ3VsYXIuaXNEZWZpbmVkKGF0dHJzLmRyb3Bkb3duTmVzdGVkKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2Ryb3Bkb3duLW1lbnUnKTtcblxuICAgICAgdmFyIHRwbFVybCA9IGF0dHJzLnRlbXBsYXRlVXJsO1xuICAgICAgaWYgKHRwbFVybCkge1xuICAgICAgICBkcm9wZG93bkN0cmwuZHJvcGRvd25NZW51VGVtcGxhdGVVcmwgPSB0cGxVcmw7XG4gICAgICB9XG5cbiAgICAgIGlmICghZHJvcGRvd25DdHJsLmRyb3Bkb3duTWVudSkge1xuICAgICAgICBkcm9wZG93bkN0cmwuZHJvcGRvd25NZW51ID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJEcm9wZG93blRvZ2dsZScsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlcXVpcmU6ICc/XnVpYkRyb3Bkb3duJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGRyb3Bkb3duQ3RybCkge1xuICAgICAgaWYgKCFkcm9wZG93bkN0cmwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBlbGVtZW50LmFkZENsYXNzKCdkcm9wZG93bi10b2dnbGUnKTtcblxuICAgICAgZHJvcGRvd25DdHJsLnRvZ2dsZUVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgICB2YXIgdG9nZ2xlRHJvcGRvd24gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICghZWxlbWVudC5oYXNDbGFzcygnZGlzYWJsZWQnKSAmJiAhYXR0cnMuZGlzYWJsZWQpIHtcbiAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkcm9wZG93bkN0cmwudG9nZ2xlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgdG9nZ2xlRHJvcGRvd24pO1xuXG4gICAgICAvLyBXQUktQVJJQVxuICAgICAgZWxlbWVudC5hdHRyKHsgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLCAnYXJpYS1leHBhbmRlZCc6IGZhbHNlIH0pO1xuICAgICAgc2NvcGUuJHdhdGNoKGRyb3Bkb3duQ3RybC5pc09wZW4sIGZ1bmN0aW9uKGlzT3Blbikge1xuICAgICAgICBlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAhIWlzT3Blbik7XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBlbGVtZW50Lm9mZignY2xpY2snLCB0b2dnbGVEcm9wZG93bik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5zdGFja2VkTWFwJywgW10pXG4vKipcbiAqIEEgaGVscGVyLCBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB0aGF0IGFjdHMgYXMgYSBtYXAgYnV0IGFsc28gYWxsb3dzIGdldHRpbmcgLyByZW1vdmluZ1xuICogZWxlbWVudHMgaW4gdGhlIExJRk8gb3JkZXJcbiAqL1xuICAuZmFjdG9yeSgnJCRzdGFja2VkTWFwJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWF0ZU5ldzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFjayA9IFtdO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgYWRkOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBpZiAoa2V5ID09PSBzdGFja1tpXS5rZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhY2tbaV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGtleXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAga2V5cy5wdXNoKHN0YWNrW2ldLmtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgdmFyIGlkeCA9IC0xO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBpZiAoa2V5ID09PSBzdGFja1tpXS5rZXkpIHtcbiAgICAgICAgICAgICAgICBpZHggPSBpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RhY2suc3BsaWNlKGlkeCwgMSlbMF07XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZW1vdmVUb3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YWNrLnBvcCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGFjay5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5tb2RhbCcsIFsndWkuYm9vdHN0cmFwLm11bHRpTWFwJywgJ3VpLmJvb3RzdHJhcC5zdGFja2VkTWFwJywgJ3VpLmJvb3RzdHJhcC5wb3NpdGlvbiddKVxuLyoqXG4gKiBQbHVnZ2FibGUgcmVzb2x2ZSBtZWNoYW5pc20gZm9yIHRoZSBtb2RhbCByZXNvbHZlIHJlc29sdXRpb25cbiAqIFN1cHBvcnRzIFVJIFJvdXRlcidzICRyZXNvbHZlIHNlcnZpY2VcbiAqL1xuICAucHJvdmlkZXIoJyR1aWJSZXNvbHZlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc29sdmUgPSB0aGlzO1xuICAgIHRoaXMucmVzb2x2ZXIgPSBudWxsO1xuXG4gICAgdGhpcy5zZXRSZXNvbHZlciA9IGZ1bmN0aW9uKHJlc29sdmVyKSB7XG4gICAgICB0aGlzLnJlc29sdmVyID0gcmVzb2x2ZXI7XG4gICAgfTtcblxuICAgIHRoaXMuJGdldCA9IFsnJGluamVjdG9yJywgJyRxJywgZnVuY3Rpb24oJGluamVjdG9yLCAkcSkge1xuICAgICAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZS5yZXNvbHZlciA/ICRpbmplY3Rvci5nZXQocmVzb2x2ZS5yZXNvbHZlcikgOiBudWxsO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzb2x2ZTogZnVuY3Rpb24oaW52b2NhYmxlcywgbG9jYWxzLCBwYXJlbnQsIHNlbGYpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlci5yZXNvbHZlKGludm9jYWJsZXMsIGxvY2FscywgcGFyZW50LCBzZWxmKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgcHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChpbnZvY2FibGVzLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbih2YWx1ZSkgfHwgYW5ndWxhci5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKCRxLnJlc29sdmUoJGluamVjdG9yLmludm9rZSh2YWx1ZSkpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaCgkcS5yZXNvbHZlKCRpbmplY3Rvci5nZXQodmFsdWUpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKCRxLnJlc29sdmUodmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24ocmVzb2x2ZXMpIHtcbiAgICAgICAgICAgIHZhciByZXNvbHZlT2JqID0ge307XG4gICAgICAgICAgICB2YXIgcmVzb2x2ZUl0ZXIgPSAwO1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGludm9jYWJsZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZU9ialtrZXldID0gcmVzb2x2ZXNbcmVzb2x2ZUl0ZXIrK107XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVPYmo7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfV07XG4gIH0pXG5cbi8qKlxuICogQSBoZWxwZXIgZGlyZWN0aXZlIGZvciB0aGUgJG1vZGFsIHNlcnZpY2UuIEl0IGNyZWF0ZXMgYSBiYWNrZHJvcCBlbGVtZW50LlxuICovXG4gIC5kaXJlY3RpdmUoJ3VpYk1vZGFsQmFja2Ryb3AnLCBbJyRhbmltYXRlJywgJyRpbmplY3RvcicsICckdWliTW9kYWxTdGFjaycsXG4gIGZ1bmN0aW9uKCRhbmltYXRlLCAkaW5qZWN0b3IsICRtb2RhbFN0YWNrKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBjb21waWxlOiBmdW5jdGlvbih0RWxlbWVudCwgdEF0dHJzKSB7XG4gICAgICAgIHRFbGVtZW50LmFkZENsYXNzKHRBdHRycy5iYWNrZHJvcENsYXNzKTtcbiAgICAgICAgcmV0dXJuIGxpbmtGbjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbGlua0ZuKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgaWYgKGF0dHJzLm1vZGFsSW5DbGFzcykge1xuICAgICAgICAkYW5pbWF0ZS5hZGRDbGFzcyhlbGVtZW50LCBhdHRycy5tb2RhbEluQ2xhc3MpO1xuXG4gICAgICAgIHNjb3BlLiRvbigkbW9kYWxTdGFjay5OT1dfQ0xPU0lOR19FVkVOVCwgZnVuY3Rpb24oZSwgc2V0SXNBc3luYykge1xuICAgICAgICAgIHZhciBkb25lID0gc2V0SXNBc3luYygpO1xuICAgICAgICAgIGlmIChzY29wZS5tb2RhbE9wdGlvbnMuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAkYW5pbWF0ZS5yZW1vdmVDbGFzcyhlbGVtZW50LCBhdHRycy5tb2RhbEluQ2xhc3MpLnRoZW4oZG9uZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfV0pXG5cbiAgLmRpcmVjdGl2ZSgndWliTW9kYWxXaW5kb3cnLCBbJyR1aWJNb2RhbFN0YWNrJywgJyRxJywgJyRhbmltYXRlQ3NzJywgJyRkb2N1bWVudCcsXG4gIGZ1bmN0aW9uKCRtb2RhbFN0YWNrLCAkcSwgJGFuaW1hdGVDc3MsICRkb2N1bWVudCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZToge1xuICAgICAgICBpbmRleDogJ0AnXG4gICAgICB9LFxuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24odEVsZW1lbnQsIHRBdHRycykge1xuICAgICAgICByZXR1cm4gdEF0dHJzLnRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvbW9kYWwvd2luZG93Lmh0bWwnO1xuICAgICAgfSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmFkZENsYXNzKGF0dHJzLndpbmRvd1RvcENsYXNzIHx8ICcnKTtcbiAgICAgICAgc2NvcGUuc2l6ZSA9IGF0dHJzLnNpemU7XG5cbiAgICAgICAgc2NvcGUuY2xvc2UgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWxTdGFjay5nZXRUb3AoKTtcbiAgICAgICAgICBpZiAobW9kYWwgJiYgbW9kYWwudmFsdWUuYmFja2Ryb3AgJiZcbiAgICAgICAgICAgIG1vZGFsLnZhbHVlLmJhY2tkcm9wICE9PSAnc3RhdGljJyAmJlxuICAgICAgICAgICAgZXZ0LnRhcmdldCA9PT0gZXZ0LmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgJG1vZGFsU3RhY2suZGlzbWlzcyhtb2RhbC5rZXksICdiYWNrZHJvcCBjbGljaycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBtb3ZlZCBmcm9tIHRlbXBsYXRlIHRvIGZpeCBpc3N1ZSAjMjI4MFxuICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIHNjb3BlLmNsb3NlKTtcblxuICAgICAgICAvLyBUaGlzIHByb3BlcnR5IGlzIG9ubHkgYWRkZWQgdG8gdGhlIHNjb3BlIGZvciB0aGUgcHVycG9zZSBvZiBkZXRlY3Rpbmcgd2hlbiB0aGlzIGRpcmVjdGl2ZSBpcyByZW5kZXJlZC5cbiAgICAgICAgLy8gV2UgY2FuIGRldGVjdCB0aGF0IGJ5IHVzaW5nIHRoaXMgcHJvcGVydHkgaW4gdGhlIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGRpcmVjdGl2ZSBhbmQgdGhlbiB1c2VcbiAgICAgICAgLy8ge0BsaW5rIEF0dHJpYnV0ZSMkb2JzZXJ2ZX0gb24gaXQuIEZvciBtb3JlIGRldGFpbHMgcGxlYXNlIHNlZSB7QGxpbmsgVGFibGVDb2x1bW5SZXNpemV9LlxuICAgICAgICBzY29wZS4kaXNSZW5kZXJlZCA9IHRydWU7XG5cbiAgICAgICAgLy8gRGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoaXMgbW9kYWwgaXMgcmVuZGVyZWQuXG4gICAgICAgIHZhciBtb2RhbFJlbmRlckRlZmVyT2JqID0gJHEuZGVmZXIoKTtcbiAgICAgICAgLy8gUmVzb2x2ZSByZW5kZXIgcHJvbWlzZSBwb3N0LWRpZ2VzdFxuICAgICAgICBzY29wZS4kJHBvc3REaWdlc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbW9kYWxSZW5kZXJEZWZlck9iai5yZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZGFsUmVuZGVyRGVmZXJPYmoucHJvbWlzZS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhbmltYXRpb25Qcm9taXNlID0gbnVsbDtcblxuICAgICAgICAgIGlmIChhdHRycy5tb2RhbEluQ2xhc3MpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvblByb21pc2UgPSAkYW5pbWF0ZUNzcyhlbGVtZW50LCB7XG4gICAgICAgICAgICAgIGFkZENsYXNzOiBhdHRycy5tb2RhbEluQ2xhc3NcbiAgICAgICAgICAgIH0pLnN0YXJ0KCk7XG5cbiAgICAgICAgICAgIHNjb3BlLiRvbigkbW9kYWxTdGFjay5OT1dfQ0xPU0lOR19FVkVOVCwgZnVuY3Rpb24oZSwgc2V0SXNBc3luYykge1xuICAgICAgICAgICAgICB2YXIgZG9uZSA9IHNldElzQXN5bmMoKTtcbiAgICAgICAgICAgICAgJGFuaW1hdGVDc3MoZWxlbWVudCwge1xuICAgICAgICAgICAgICAgIHJlbW92ZUNsYXNzOiBhdHRycy5tb2RhbEluQ2xhc3NcbiAgICAgICAgICAgICAgfSkuc3RhcnQoKS50aGVuKGRvbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG5cbiAgICAgICAgICAkcS53aGVuKGFuaW1hdGlvblByb21pc2UpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBOb3RpZnkge0BsaW5rICRtb2RhbFN0YWNrfSB0aGF0IG1vZGFsIGlzIHJlbmRlcmVkLlxuICAgICAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsU3RhY2suZ2V0VG9wKCk7XG4gICAgICAgICAgICBpZiAobW9kYWwpIHtcbiAgICAgICAgICAgICAgJG1vZGFsU3RhY2subW9kYWxSZW5kZXJlZChtb2RhbC5rZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIElmIHNvbWV0aGluZyB3aXRoaW4gdGhlIGZyZXNobHktb3BlbmVkIG1vZGFsIGFscmVhZHkgaGFzIGZvY3VzIChwZXJoYXBzIHZpYSBhXG4gICAgICAgICAgICAgKiBkaXJlY3RpdmUgdGhhdCBjYXVzZXMgZm9jdXMpIHRoZW4gdGhlcmUncyBubyBuZWVkIHRvIHRyeSB0byBmb2N1cyBhbnl0aGluZy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKCEoJGRvY3VtZW50WzBdLmFjdGl2ZUVsZW1lbnQgJiYgZWxlbWVudFswXS5jb250YWlucygkZG9jdW1lbnRbMF0uYWN0aXZlRWxlbWVudCkpKSB7XG4gICAgICAgICAgICAgIHZhciBpbnB1dFdpdGhBdXRvZm9jdXMgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ1thdXRvZm9jdXNdJyk7XG4gICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgKiBBdXRvLWZvY3VzaW5nIG9mIGEgZnJlc2hseS1vcGVuZWQgbW9kYWwgZWxlbWVudCBjYXVzZXMgYW55IGNoaWxkIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAqIHdpdGggdGhlIGF1dG9mb2N1cyBhdHRyaWJ1dGUgdG8gbG9zZSBmb2N1cy4gVGhpcyBpcyBhbiBpc3N1ZSBvbiB0b3VjaFxuICAgICAgICAgICAgICAgKiBiYXNlZCBkZXZpY2VzIHdoaWNoIHdpbGwgc2hvdyBhbmQgdGhlbiBoaWRlIHRoZSBvbnNjcmVlbiBrZXlib2FyZC5cbiAgICAgICAgICAgICAgICogQXR0ZW1wdHMgdG8gcmVmb2N1cyB0aGUgYXV0b2ZvY3VzIGVsZW1lbnQgdmlhIEphdmFTY3JpcHQgd2lsbCBub3QgcmVvcGVuXG4gICAgICAgICAgICAgICAqIHRoZSBvbnNjcmVlbiBrZXlib2FyZC4gRml4ZWQgYnkgdXBkYXRlZCB0aGUgZm9jdXNpbmcgbG9naWMgdG8gb25seSBhdXRvZm9jdXNcbiAgICAgICAgICAgICAgICogdGhlIG1vZGFsIGVsZW1lbnQgaWYgdGhlIG1vZGFsIGRvZXMgbm90IGNvbnRhaW4gYW4gYXV0b2ZvY3VzIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICBpZiAoaW5wdXRXaXRoQXV0b2ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgaW5wdXRXaXRoQXV0b2ZvY3VzLmZvY3VzKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudFswXS5mb2N1cygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1dKVxuXG4gIC5kaXJlY3RpdmUoJ3VpYk1vZGFsQW5pbWF0aW9uQ2xhc3MnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcGlsZTogZnVuY3Rpb24odEVsZW1lbnQsIHRBdHRycykge1xuICAgICAgICBpZiAodEF0dHJzLm1vZGFsQW5pbWF0aW9uKSB7XG4gICAgICAgICAgdEVsZW1lbnQuYWRkQ2xhc3ModEF0dHJzLnVpYk1vZGFsQW5pbWF0aW9uQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfSlcblxuICAuZGlyZWN0aXZlKCd1aWJNb2RhbFRyYW5zY2x1ZGUnLCBbJyRhbmltYXRlJywgZnVuY3Rpb24oJGFuaW1hdGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyLCB0cmFuc2NsdWRlKSB7XG4gICAgICAgIHRyYW5zY2x1ZGUoc2NvcGUuJHBhcmVudCwgZnVuY3Rpb24oY2xvbmUpIHtcbiAgICAgICAgICBlbGVtZW50LmVtcHR5KCk7XG4gICAgICAgICAgJGFuaW1hdGUuZW50ZXIoY2xvbmUsIGVsZW1lbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSlcblxuICAuZmFjdG9yeSgnJHVpYk1vZGFsU3RhY2snLCBbJyRhbmltYXRlJywgJyRhbmltYXRlQ3NzJywgJyRkb2N1bWVudCcsXG4gICAgJyRjb21waWxlJywgJyRyb290U2NvcGUnLCAnJHEnLCAnJCRtdWx0aU1hcCcsICckJHN0YWNrZWRNYXAnLCAnJHVpYlBvc2l0aW9uJyxcbiAgICBmdW5jdGlvbigkYW5pbWF0ZSwgJGFuaW1hdGVDc3MsICRkb2N1bWVudCwgJGNvbXBpbGUsICRyb290U2NvcGUsICRxLCAkJG11bHRpTWFwLCAkJHN0YWNrZWRNYXAsICR1aWJQb3NpdGlvbikge1xuICAgICAgdmFyIE9QRU5FRF9NT0RBTF9DTEFTUyA9ICdtb2RhbC1vcGVuJztcblxuICAgICAgdmFyIGJhY2tkcm9wRG9tRWwsIGJhY2tkcm9wU2NvcGU7XG4gICAgICB2YXIgb3BlbmVkV2luZG93cyA9ICQkc3RhY2tlZE1hcC5jcmVhdGVOZXcoKTtcbiAgICAgIHZhciBvcGVuZWRDbGFzc2VzID0gJCRtdWx0aU1hcC5jcmVhdGVOZXcoKTtcbiAgICAgIHZhciAkbW9kYWxTdGFjayA9IHtcbiAgICAgICAgTk9XX0NMT1NJTkdfRVZFTlQ6ICdtb2RhbC5zdGFjay5ub3ctY2xvc2luZydcbiAgICAgIH07XG4gICAgICB2YXIgdG9wTW9kYWxJbmRleCA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNUb3BPcGVuZWRNb2RhbCA9IG51bGw7XG4gICAgICB2YXIgQVJJQV9ISURERU5fQVRUUklCVVRFX05BTUUgPSAnZGF0YS1ib290c3RyYXAtbW9kYWwtYXJpYS1oaWRkZW4tY291bnQnO1xuXG4gICAgICAvL01vZGFsIGZvY3VzIGJlaGF2aW9yXG4gICAgICB2YXIgdGFiYmFibGVTZWxlY3RvciA9ICdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSk6bm90KFt0YWJpbmRleD1cXCctMVxcJ10pLCAnICtcbiAgICAgICAgJ2J1dHRvbjpub3QoW2Rpc2FibGVkXSk6bm90KFt0YWJpbmRleD1cXCctMVxcJ10pLHNlbGVjdDpub3QoW2Rpc2FibGVkXSk6bm90KFt0YWJpbmRleD1cXCctMVxcJ10pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSk6bm90KFt0YWJpbmRleD1cXCctMVxcJ10pLCAnICtcbiAgICAgICAgJ2lmcmFtZSwgb2JqZWN0LCBlbWJlZCwgKlt0YWJpbmRleF06bm90KFt0YWJpbmRleD1cXCctMVxcJ10pLCAqW2NvbnRlbnRlZGl0YWJsZT10cnVlXSc7XG4gICAgICB2YXIgc2Nyb2xsYmFyUGFkZGluZztcbiAgICAgIHZhciBTTkFLRV9DQVNFX1JFR0VYUCA9IC9bQS1aXS9nO1xuXG4gICAgICAvLyBUT0RPOiBleHRyYWN0IGludG8gY29tbW9uIGRlcGVuZGVuY3kgd2l0aCB0b29sdGlwXG4gICAgICBmdW5jdGlvbiBzbmFrZV9jYXNlKG5hbWUpIHtcbiAgICAgICAgdmFyIHNlcGFyYXRvciA9ICctJztcbiAgICAgICAgcmV0dXJuIG5hbWUucmVwbGFjZShTTkFLRV9DQVNFX1JFR0VYUCwgZnVuY3Rpb24obGV0dGVyLCBwb3MpIHtcbiAgICAgICAgICByZXR1cm4gKHBvcyA/IHNlcGFyYXRvciA6ICcnKSArIGxldHRlci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaXNWaXNpYmxlKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuICEhKGVsZW1lbnQub2Zmc2V0V2lkdGggfHxcbiAgICAgICAgICBlbGVtZW50Lm9mZnNldEhlaWdodCB8fFxuICAgICAgICAgIGVsZW1lbnQuZ2V0Q2xpZW50UmVjdHMoKS5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBiYWNrZHJvcEluZGV4KCkge1xuICAgICAgICB2YXIgdG9wQmFja2Ryb3BJbmRleCA9IC0xO1xuICAgICAgICB2YXIgb3BlbmVkID0gb3BlbmVkV2luZG93cy5rZXlzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3BlbmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKG9wZW5lZFdpbmRvd3MuZ2V0KG9wZW5lZFtpXSkudmFsdWUuYmFja2Ryb3ApIHtcbiAgICAgICAgICAgIHRvcEJhY2tkcm9wSW5kZXggPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGFueSBiYWNrZHJvcCBleGlzdCwgZW5zdXJlIHRoYXQgaXQncyBpbmRleCBpcyBhbHdheXNcbiAgICAgICAgLy8gcmlnaHQgYmVsb3cgdGhlIHRvcCBtb2RhbFxuICAgICAgICBpZiAodG9wQmFja2Ryb3BJbmRleCA+IC0xICYmIHRvcEJhY2tkcm9wSW5kZXggPCB0b3BNb2RhbEluZGV4KSB7XG4gICAgICAgICAgdG9wQmFja2Ryb3BJbmRleCA9IHRvcE1vZGFsSW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvcEJhY2tkcm9wSW5kZXg7XG4gICAgICB9XG5cbiAgICAgICRyb290U2NvcGUuJHdhdGNoKGJhY2tkcm9wSW5kZXgsIGZ1bmN0aW9uKG5ld0JhY2tkcm9wSW5kZXgpIHtcbiAgICAgICAgaWYgKGJhY2tkcm9wU2NvcGUpIHtcbiAgICAgICAgICBiYWNrZHJvcFNjb3BlLmluZGV4ID0gbmV3QmFja2Ryb3BJbmRleDtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZU1vZGFsV2luZG93KG1vZGFsSW5zdGFuY2UsIGVsZW1lbnRUb1JlY2VpdmVGb2N1cykge1xuICAgICAgICB2YXIgbW9kYWxXaW5kb3cgPSBvcGVuZWRXaW5kb3dzLmdldChtb2RhbEluc3RhbmNlKS52YWx1ZTtcbiAgICAgICAgdmFyIGFwcGVuZFRvRWxlbWVudCA9IG1vZGFsV2luZG93LmFwcGVuZFRvO1xuXG4gICAgICAgIC8vY2xlYW4gdXAgdGhlIHN0YWNrXG4gICAgICAgIG9wZW5lZFdpbmRvd3MucmVtb3ZlKG1vZGFsSW5zdGFuY2UpO1xuICAgICAgICBwcmV2aW91c1RvcE9wZW5lZE1vZGFsID0gb3BlbmVkV2luZG93cy50b3AoKTtcbiAgICAgICAgaWYgKHByZXZpb3VzVG9wT3BlbmVkTW9kYWwpIHtcbiAgICAgICAgICB0b3BNb2RhbEluZGV4ID0gcGFyc2VJbnQocHJldmlvdXNUb3BPcGVuZWRNb2RhbC52YWx1ZS5tb2RhbERvbUVsLmF0dHIoJ2luZGV4JyksIDEwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbW92ZUFmdGVyQW5pbWF0ZShtb2RhbFdpbmRvdy5tb2RhbERvbUVsLCBtb2RhbFdpbmRvdy5tb2RhbFNjb3BlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgbW9kYWxCb2R5Q2xhc3MgPSBtb2RhbFdpbmRvdy5vcGVuZWRDbGFzcyB8fCBPUEVORURfTU9EQUxfQ0xBU1M7XG4gICAgICAgICAgb3BlbmVkQ2xhc3Nlcy5yZW1vdmUobW9kYWxCb2R5Q2xhc3MsIG1vZGFsSW5zdGFuY2UpO1xuICAgICAgICAgIHZhciBhcmVBbnlPcGVuID0gb3BlbmVkQ2xhc3Nlcy5oYXNLZXkobW9kYWxCb2R5Q2xhc3MpO1xuICAgICAgICAgIGFwcGVuZFRvRWxlbWVudC50b2dnbGVDbGFzcyhtb2RhbEJvZHlDbGFzcywgYXJlQW55T3Blbik7XG4gICAgICAgICAgaWYgKCFhcmVBbnlPcGVuICYmIHNjcm9sbGJhclBhZGRpbmcgJiYgc2Nyb2xsYmFyUGFkZGluZy5oZWlnaHRPdmVyZmxvdyAmJiBzY3JvbGxiYXJQYWRkaW5nLnNjcm9sbGJhcldpZHRoKSB7XG4gICAgICAgICAgICBpZiAoc2Nyb2xsYmFyUGFkZGluZy5vcmlnaW5hbFJpZ2h0KSB7XG4gICAgICAgICAgICAgIGFwcGVuZFRvRWxlbWVudC5jc3Moe3BhZGRpbmdSaWdodDogc2Nyb2xsYmFyUGFkZGluZy5vcmlnaW5hbFJpZ2h0ICsgJ3B4J30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXBwZW5kVG9FbGVtZW50LmNzcyh7cGFkZGluZ1JpZ2h0OiAnJ30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2Nyb2xsYmFyUGFkZGluZyA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRvZ2dsZVRvcFdpbmRvd0NsYXNzKHRydWUpO1xuICAgICAgICB9LCBtb2RhbFdpbmRvdy5jbG9zZWREZWZlcnJlZCk7XG4gICAgICAgIGNoZWNrUmVtb3ZlQmFja2Ryb3AoKTtcblxuICAgICAgICAvL21vdmUgZm9jdXMgdG8gc3BlY2lmaWVkIGVsZW1lbnQgaWYgYXZhaWxhYmxlLCBvciBlbHNlIHRvIGJvZHlcbiAgICAgICAgaWYgKGVsZW1lbnRUb1JlY2VpdmVGb2N1cyAmJiBlbGVtZW50VG9SZWNlaXZlRm9jdXMuZm9jdXMpIHtcbiAgICAgICAgICBlbGVtZW50VG9SZWNlaXZlRm9jdXMuZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcHBlbmRUb0VsZW1lbnQuZm9jdXMpIHtcbiAgICAgICAgICBhcHBlbmRUb0VsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgb3IgcmVtb3ZlIFwid2luZG93VG9wQ2xhc3NcIiBmcm9tIHRoZSB0b3Agd2luZG93IGluIHRoZSBzdGFja1xuICAgICAgZnVuY3Rpb24gdG9nZ2xlVG9wV2luZG93Q2xhc3ModG9nZ2xlU3dpdGNoKSB7XG4gICAgICAgIHZhciBtb2RhbFdpbmRvdztcblxuICAgICAgICBpZiAob3BlbmVkV2luZG93cy5sZW5ndGgoKSA+IDApIHtcbiAgICAgICAgICBtb2RhbFdpbmRvdyA9IG9wZW5lZFdpbmRvd3MudG9wKCkudmFsdWU7XG4gICAgICAgICAgbW9kYWxXaW5kb3cubW9kYWxEb21FbC50b2dnbGVDbGFzcyhtb2RhbFdpbmRvdy53aW5kb3dUb3BDbGFzcyB8fCAnJywgdG9nZ2xlU3dpdGNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjaGVja1JlbW92ZUJhY2tkcm9wKCkge1xuICAgICAgICAvL3JlbW92ZSBiYWNrZHJvcCBpZiBubyBsb25nZXIgbmVlZGVkXG4gICAgICAgIGlmIChiYWNrZHJvcERvbUVsICYmIGJhY2tkcm9wSW5kZXgoKSA9PT0gLTEpIHtcbiAgICAgICAgICB2YXIgYmFja2Ryb3BTY29wZVJlZiA9IGJhY2tkcm9wU2NvcGU7XG4gICAgICAgICAgcmVtb3ZlQWZ0ZXJBbmltYXRlKGJhY2tkcm9wRG9tRWwsIGJhY2tkcm9wU2NvcGUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYmFja2Ryb3BTY29wZVJlZiA9IG51bGw7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYmFja2Ryb3BEb21FbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBiYWNrZHJvcFNjb3BlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZUFmdGVyQW5pbWF0ZShkb21FbCwgc2NvcGUsIGRvbmUsIGNsb3NlZERlZmVycmVkKSB7XG4gICAgICAgIHZhciBhc3luY0RlZmVycmVkO1xuICAgICAgICB2YXIgYXN5bmNQcm9taXNlID0gbnVsbDtcbiAgICAgICAgdmFyIHNldElzQXN5bmMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoIWFzeW5jRGVmZXJyZWQpIHtcbiAgICAgICAgICAgIGFzeW5jRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgYXN5bmNQcm9taXNlID0gYXN5bmNEZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBhc3luY0RvbmUoKSB7XG4gICAgICAgICAgICBhc3luY0RlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBzY29wZS4kYnJvYWRjYXN0KCRtb2RhbFN0YWNrLk5PV19DTE9TSU5HX0VWRU5ULCBzZXRJc0FzeW5jKTtcblxuICAgICAgICAvLyBOb3RlIHRoYXQgaXQncyBpbnRlbnRpb25hbCB0aGF0IGFzeW5jUHJvbWlzZSBtaWdodCBiZSBudWxsLlxuICAgICAgICAvLyBUaGF0J3Mgd2hlbiBzZXRJc0FzeW5jIGhhcyBub3QgYmVlbiBjYWxsZWQgZHVyaW5nIHRoZVxuICAgICAgICAvLyBOT1dfQ0xPU0lOR19FVkVOVCBicm9hZGNhc3QuXG4gICAgICAgIHJldHVybiAkcS53aGVuKGFzeW5jUHJvbWlzZSkudGhlbihhZnRlckFuaW1hdGluZyk7XG5cbiAgICAgICAgZnVuY3Rpb24gYWZ0ZXJBbmltYXRpbmcoKSB7XG4gICAgICAgICAgaWYgKGFmdGVyQW5pbWF0aW5nLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWZ0ZXJBbmltYXRpbmcuZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAkYW5pbWF0ZS5sZWF2ZShkb21FbCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9tRWwucmVtb3ZlKCk7XG4gICAgICAgICAgICBpZiAoY2xvc2VkRGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgY2xvc2VkRGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAkZG9jdW1lbnQub24oJ2tleWRvd24nLCBrZXlkb3duTGlzdGVuZXIpO1xuXG4gICAgICAkcm9vdFNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGRvY3VtZW50Lm9mZigna2V5ZG93bicsIGtleWRvd25MaXN0ZW5lcik7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24ga2V5ZG93bkxpc3RlbmVyKGV2dCkge1xuICAgICAgICBpZiAoZXZ0LmlzRGVmYXVsdFByZXZlbnRlZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGV2dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtb2RhbCA9IG9wZW5lZFdpbmRvd3MudG9wKCk7XG4gICAgICAgIGlmIChtb2RhbCkge1xuICAgICAgICAgIHN3aXRjaCAoZXZ0LndoaWNoKSB7XG4gICAgICAgICAgICBjYXNlIDI3OiB7XG4gICAgICAgICAgICAgIGlmIChtb2RhbC52YWx1ZS5rZXlib2FyZCkge1xuICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgJG1vZGFsU3RhY2suZGlzbWlzcyhtb2RhbC5rZXksICdlc2NhcGUga2V5IHByZXNzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIDk6IHtcbiAgICAgICAgICAgICAgdmFyIGxpc3QgPSAkbW9kYWxTdGFjay5sb2FkRm9jdXNFbGVtZW50TGlzdChtb2RhbCk7XG4gICAgICAgICAgICAgIHZhciBmb2N1c0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgaWYgKGV2dC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIGlmICgkbW9kYWxTdGFjay5pc0ZvY3VzSW5GaXJzdEl0ZW0oZXZ0LCBsaXN0KSB8fCAkbW9kYWxTdGFjay5pc01vZGFsRm9jdXNlZChldnQsIG1vZGFsKSkge1xuICAgICAgICAgICAgICAgICAgZm9jdXNDaGFuZ2VkID0gJG1vZGFsU3RhY2suZm9jdXNMYXN0Rm9jdXNhYmxlRWxlbWVudChsaXN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCRtb2RhbFN0YWNrLmlzRm9jdXNJbkxhc3RJdGVtKGV2dCwgbGlzdCkpIHtcbiAgICAgICAgICAgICAgICAgIGZvY3VzQ2hhbmdlZCA9ICRtb2RhbFN0YWNrLmZvY3VzRmlyc3RGb2N1c2FibGVFbGVtZW50KGxpc3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChmb2N1c0NoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgJG1vZGFsU3RhY2sub3BlbiA9IGZ1bmN0aW9uKG1vZGFsSW5zdGFuY2UsIG1vZGFsKSB7XG4gICAgICAgIHZhciBtb2RhbE9wZW5lciA9ICRkb2N1bWVudFswXS5hY3RpdmVFbGVtZW50LFxuICAgICAgICAgIG1vZGFsQm9keUNsYXNzID0gbW9kYWwub3BlbmVkQ2xhc3MgfHwgT1BFTkVEX01PREFMX0NMQVNTO1xuXG4gICAgICAgIHRvZ2dsZVRvcFdpbmRvd0NsYXNzKGZhbHNlKTtcblxuICAgICAgICAvLyBTdG9yZSB0aGUgY3VycmVudCB0b3AgZmlyc3QsIHRvIGRldGVybWluZSB3aGF0IGluZGV4IHdlIG91Z2h0IHRvIHVzZVxuICAgICAgICAvLyBmb3IgdGhlIGN1cnJlbnQgdG9wIG1vZGFsXG4gICAgICAgIHByZXZpb3VzVG9wT3BlbmVkTW9kYWwgPSBvcGVuZWRXaW5kb3dzLnRvcCgpO1xuXG4gICAgICAgIG9wZW5lZFdpbmRvd3MuYWRkKG1vZGFsSW5zdGFuY2UsIHtcbiAgICAgICAgICBkZWZlcnJlZDogbW9kYWwuZGVmZXJyZWQsXG4gICAgICAgICAgcmVuZGVyRGVmZXJyZWQ6IG1vZGFsLnJlbmRlckRlZmVycmVkLFxuICAgICAgICAgIGNsb3NlZERlZmVycmVkOiBtb2RhbC5jbG9zZWREZWZlcnJlZCxcbiAgICAgICAgICBtb2RhbFNjb3BlOiBtb2RhbC5zY29wZSxcbiAgICAgICAgICBiYWNrZHJvcDogbW9kYWwuYmFja2Ryb3AsXG4gICAgICAgICAga2V5Ym9hcmQ6IG1vZGFsLmtleWJvYXJkLFxuICAgICAgICAgIG9wZW5lZENsYXNzOiBtb2RhbC5vcGVuZWRDbGFzcyxcbiAgICAgICAgICB3aW5kb3dUb3BDbGFzczogbW9kYWwud2luZG93VG9wQ2xhc3MsXG4gICAgICAgICAgYW5pbWF0aW9uOiBtb2RhbC5hbmltYXRpb24sXG4gICAgICAgICAgYXBwZW5kVG86IG1vZGFsLmFwcGVuZFRvXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9wZW5lZENsYXNzZXMucHV0KG1vZGFsQm9keUNsYXNzLCBtb2RhbEluc3RhbmNlKTtcblxuICAgICAgICB2YXIgYXBwZW5kVG9FbGVtZW50ID0gbW9kYWwuYXBwZW5kVG8sXG4gICAgICAgICAgICBjdXJyQmFja2Ryb3BJbmRleCA9IGJhY2tkcm9wSW5kZXgoKTtcblxuICAgICAgICBpZiAoY3VyckJhY2tkcm9wSW5kZXggPj0gMCAmJiAhYmFja2Ryb3BEb21FbCkge1xuICAgICAgICAgIGJhY2tkcm9wU2NvcGUgPSAkcm9vdFNjb3BlLiRuZXcodHJ1ZSk7XG4gICAgICAgICAgYmFja2Ryb3BTY29wZS5tb2RhbE9wdGlvbnMgPSBtb2RhbDtcbiAgICAgICAgICBiYWNrZHJvcFNjb3BlLmluZGV4ID0gY3VyckJhY2tkcm9wSW5kZXg7XG4gICAgICAgICAgYmFja2Ryb3BEb21FbCA9IGFuZ3VsYXIuZWxlbWVudCgnPGRpdiB1aWItbW9kYWwtYmFja2Ryb3A9XCJtb2RhbC1iYWNrZHJvcFwiPjwvZGl2PicpO1xuICAgICAgICAgIGJhY2tkcm9wRG9tRWwuYXR0cih7XG4gICAgICAgICAgICAnY2xhc3MnOiAnbW9kYWwtYmFja2Ryb3AnLFxuICAgICAgICAgICAgJ25nLXN0eWxlJzogJ3tcXCd6LWluZGV4XFwnOiAxMDQwICsgKGluZGV4ICYmIDEgfHwgMCkgKyBpbmRleCoxMH0nLFxuICAgICAgICAgICAgJ3VpYi1tb2RhbC1hbmltYXRpb24tY2xhc3MnOiAnZmFkZScsXG4gICAgICAgICAgICAnbW9kYWwtaW4tY2xhc3MnOiAnaW4nXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKG1vZGFsLmJhY2tkcm9wQ2xhc3MpIHtcbiAgICAgICAgICAgIGJhY2tkcm9wRG9tRWwuYWRkQ2xhc3MobW9kYWwuYmFja2Ryb3BDbGFzcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG1vZGFsLmFuaW1hdGlvbikge1xuICAgICAgICAgICAgYmFja2Ryb3BEb21FbC5hdHRyKCdtb2RhbC1hbmltYXRpb24nLCAndHJ1ZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkY29tcGlsZShiYWNrZHJvcERvbUVsKShiYWNrZHJvcFNjb3BlKTtcbiAgICAgICAgICAkYW5pbWF0ZS5lbnRlcihiYWNrZHJvcERvbUVsLCBhcHBlbmRUb0VsZW1lbnQpO1xuICAgICAgICAgIGlmICgkdWliUG9zaXRpb24uaXNTY3JvbGxhYmxlKGFwcGVuZFRvRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHNjcm9sbGJhclBhZGRpbmcgPSAkdWliUG9zaXRpb24uc2Nyb2xsYmFyUGFkZGluZyhhcHBlbmRUb0VsZW1lbnQpO1xuICAgICAgICAgICAgaWYgKHNjcm9sbGJhclBhZGRpbmcuaGVpZ2h0T3ZlcmZsb3cgJiYgc2Nyb2xsYmFyUGFkZGluZy5zY3JvbGxiYXJXaWR0aCkge1xuICAgICAgICAgICAgICBhcHBlbmRUb0VsZW1lbnQuY3NzKHtwYWRkaW5nUmlnaHQ6IHNjcm9sbGJhclBhZGRpbmcucmlnaHQgKyAncHgnfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbnRlbnQ7XG4gICAgICAgIGlmIChtb2RhbC5jb21wb25lbnQpIHtcbiAgICAgICAgICBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChzbmFrZV9jYXNlKG1vZGFsLmNvbXBvbmVudC5uYW1lKSk7XG4gICAgICAgICAgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudChjb250ZW50KTtcbiAgICAgICAgICBjb250ZW50LmF0dHIoe1xuICAgICAgICAgICAgcmVzb2x2ZTogJyRyZXNvbHZlJyxcbiAgICAgICAgICAgICdtb2RhbC1pbnN0YW5jZSc6ICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICBjbG9zZTogJyRjbG9zZSgkdmFsdWUpJyxcbiAgICAgICAgICAgIGRpc21pc3M6ICckZGlzbWlzcygkdmFsdWUpJ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnRlbnQgPSBtb2RhbC5jb250ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRoZSB0b3AgbW9kYWwgaW5kZXggYmFzZWQgb24gdGhlIGluZGV4IG9mIHRoZSBwcmV2aW91cyB0b3AgbW9kYWxcbiAgICAgICAgdG9wTW9kYWxJbmRleCA9IHByZXZpb3VzVG9wT3BlbmVkTW9kYWwgPyBwYXJzZUludChwcmV2aW91c1RvcE9wZW5lZE1vZGFsLnZhbHVlLm1vZGFsRG9tRWwuYXR0cignaW5kZXgnKSwgMTApICsgMSA6IDA7XG4gICAgICAgIHZhciBhbmd1bGFyRG9tRWwgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgdWliLW1vZGFsLXdpbmRvdz1cIm1vZGFsLXdpbmRvd1wiPjwvZGl2PicpO1xuICAgICAgICBhbmd1bGFyRG9tRWwuYXR0cih7XG4gICAgICAgICAgJ2NsYXNzJzogJ21vZGFsJyxcbiAgICAgICAgICAndGVtcGxhdGUtdXJsJzogbW9kYWwud2luZG93VGVtcGxhdGVVcmwsXG4gICAgICAgICAgJ3dpbmRvdy10b3AtY2xhc3MnOiBtb2RhbC53aW5kb3dUb3BDbGFzcyxcbiAgICAgICAgICAncm9sZSc6ICdkaWFsb2cnLFxuICAgICAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBtb2RhbC5hcmlhTGFiZWxsZWRCeSxcbiAgICAgICAgICAnYXJpYS1kZXNjcmliZWRieSc6IG1vZGFsLmFyaWFEZXNjcmliZWRCeSxcbiAgICAgICAgICAnc2l6ZSc6IG1vZGFsLnNpemUsXG4gICAgICAgICAgJ2luZGV4JzogdG9wTW9kYWxJbmRleCxcbiAgICAgICAgICAnYW5pbWF0ZSc6ICdhbmltYXRlJyxcbiAgICAgICAgICAnbmctc3R5bGUnOiAne1xcJ3otaW5kZXhcXCc6IDEwNTAgKyAkJHRvcE1vZGFsSW5kZXgqMTAsIGRpc3BsYXk6IFxcJ2Jsb2NrXFwnfScsXG4gICAgICAgICAgJ3RhYmluZGV4JzogLTEsXG4gICAgICAgICAgJ3VpYi1tb2RhbC1hbmltYXRpb24tY2xhc3MnOiAnZmFkZScsXG4gICAgICAgICAgJ21vZGFsLWluLWNsYXNzJzogJ2luJ1xuICAgICAgICB9KS5hcHBlbmQoY29udGVudCk7XG4gICAgICAgIGlmIChtb2RhbC53aW5kb3dDbGFzcykge1xuICAgICAgICAgIGFuZ3VsYXJEb21FbC5hZGRDbGFzcyhtb2RhbC53aW5kb3dDbGFzcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9kYWwuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgYW5ndWxhckRvbUVsLmF0dHIoJ21vZGFsLWFuaW1hdGlvbicsICd0cnVlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBhcHBlbmRUb0VsZW1lbnQuYWRkQ2xhc3MobW9kYWxCb2R5Q2xhc3MpO1xuICAgICAgICBpZiAobW9kYWwuc2NvcGUpIHtcbiAgICAgICAgICAvLyB3ZSBuZWVkIHRvIGV4cGxpY2l0bHkgYWRkIHRoZSBtb2RhbCBpbmRleCB0byB0aGUgbW9kYWwgc2NvcGVcbiAgICAgICAgICAvLyBiZWNhdXNlIGl0IGlzIG5lZWRlZCBieSBuZ1N0eWxlIHRvIGNvbXB1dGUgdGhlIHpJbmRleCBwcm9wZXJ0eS5cbiAgICAgICAgICBtb2RhbC5zY29wZS4kJHRvcE1vZGFsSW5kZXggPSB0b3BNb2RhbEluZGV4O1xuICAgICAgICB9XG4gICAgICAgICRhbmltYXRlLmVudGVyKCRjb21waWxlKGFuZ3VsYXJEb21FbCkobW9kYWwuc2NvcGUpLCBhcHBlbmRUb0VsZW1lbnQpO1xuXG4gICAgICAgIG9wZW5lZFdpbmRvd3MudG9wKCkudmFsdWUubW9kYWxEb21FbCA9IGFuZ3VsYXJEb21FbDtcbiAgICAgICAgb3BlbmVkV2luZG93cy50b3AoKS52YWx1ZS5tb2RhbE9wZW5lciA9IG1vZGFsT3BlbmVyO1xuXG4gICAgICAgIGFwcGx5QXJpYUhpZGRlbihhbmd1bGFyRG9tRWwpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFwcGx5QXJpYUhpZGRlbihlbCkge1xuICAgICAgICAgIGlmICghZWwgfHwgZWxbMF0udGFnTmFtZSA9PT0gJ0JPRFknKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ2V0U2libGluZ3MoZWwpLmZvckVhY2goZnVuY3Rpb24oc2libGluZykge1xuICAgICAgICAgICAgdmFyIGVsZW1Jc0FscmVhZHlIaWRkZW4gPSBzaWJsaW5nLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSA9PT0gJ3RydWUnLFxuICAgICAgICAgICAgICBhcmlhSGlkZGVuQ291bnQgPSBwYXJzZUludChzaWJsaW5nLmdldEF0dHJpYnV0ZShBUklBX0hJRERFTl9BVFRSSUJVVEVfTkFNRSksIDEwKTtcblxuICAgICAgICAgICAgaWYgKCFhcmlhSGlkZGVuQ291bnQpIHtcbiAgICAgICAgICAgICAgYXJpYUhpZGRlbkNvdW50ID0gZWxlbUlzQWxyZWFkeUhpZGRlbiA/IDEgOiAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzaWJsaW5nLnNldEF0dHJpYnV0ZShBUklBX0hJRERFTl9BVFRSSUJVVEVfTkFNRSwgYXJpYUhpZGRlbkNvdW50ICsgMSk7XG4gICAgICAgICAgICBzaWJsaW5nLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIGFwcGx5QXJpYUhpZGRlbihlbC5wYXJlbnQoKSk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBnZXRTaWJsaW5ncyhlbCkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gZWwucGFyZW50KCkgPyBlbC5wYXJlbnQoKS5jaGlsZHJlbigpIDogW107XG5cbiAgICAgICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZmlsdGVyLmNhbGwoY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZCAhPT0gZWxbMF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGJyb2FkY2FzdENsb3NpbmcobW9kYWxXaW5kb3csIHJlc3VsdE9yUmVhc29uLCBjbG9zaW5nKSB7XG4gICAgICAgIHJldHVybiAhbW9kYWxXaW5kb3cudmFsdWUubW9kYWxTY29wZS4kYnJvYWRjYXN0KCdtb2RhbC5jbG9zaW5nJywgcmVzdWx0T3JSZWFzb24sIGNsb3NpbmcpLmRlZmF1bHRQcmV2ZW50ZWQ7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVuaGlkZUJhY2tncm91bmRFbGVtZW50cygpIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChcbiAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbJyArIEFSSUFfSElEREVOX0FUVFJJQlVURV9OQU1FICsgJ10nKSxcbiAgICAgICAgICBmdW5jdGlvbihoaWRkZW5FbCkge1xuICAgICAgICAgICAgdmFyIGFyaWFIaWRkZW5Db3VudCA9IHBhcnNlSW50KGhpZGRlbkVsLmdldEF0dHJpYnV0ZShBUklBX0hJRERFTl9BVFRSSUJVVEVfTkFNRSksIDEwKSxcbiAgICAgICAgICAgICAgbmV3SGlkZGVuQ291bnQgPSBhcmlhSGlkZGVuQ291bnQgLSAxO1xuICAgICAgICAgICAgaGlkZGVuRWwuc2V0QXR0cmlidXRlKEFSSUFfSElEREVOX0FUVFJJQlVURV9OQU1FLCBuZXdIaWRkZW5Db3VudCk7XG5cbiAgICAgICAgICAgIGlmICghbmV3SGlkZGVuQ291bnQpIHtcbiAgICAgICAgICAgICAgaGlkZGVuRWwucmVtb3ZlQXR0cmlidXRlKEFSSUFfSElEREVOX0FUVFJJQlVURV9OQU1FKTtcbiAgICAgICAgICAgICAgaGlkZGVuRWwucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgJG1vZGFsU3RhY2suY2xvc2UgPSBmdW5jdGlvbihtb2RhbEluc3RhbmNlLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIG1vZGFsV2luZG93ID0gb3BlbmVkV2luZG93cy5nZXQobW9kYWxJbnN0YW5jZSk7XG4gICAgICAgIHVuaGlkZUJhY2tncm91bmRFbGVtZW50cygpO1xuICAgICAgICBpZiAobW9kYWxXaW5kb3cgJiYgYnJvYWRjYXN0Q2xvc2luZyhtb2RhbFdpbmRvdywgcmVzdWx0LCB0cnVlKSkge1xuICAgICAgICAgIG1vZGFsV2luZG93LnZhbHVlLm1vZGFsU2NvcGUuJCR1aWJEZXN0cnVjdGlvblNjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgICAgbW9kYWxXaW5kb3cudmFsdWUuZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgIHJlbW92ZU1vZGFsV2luZG93KG1vZGFsSW5zdGFuY2UsIG1vZGFsV2luZG93LnZhbHVlLm1vZGFsT3BlbmVyKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhbW9kYWxXaW5kb3c7XG4gICAgICB9O1xuXG4gICAgICAkbW9kYWxTdGFjay5kaXNtaXNzID0gZnVuY3Rpb24obW9kYWxJbnN0YW5jZSwgcmVhc29uKSB7XG4gICAgICAgIHZhciBtb2RhbFdpbmRvdyA9IG9wZW5lZFdpbmRvd3MuZ2V0KG1vZGFsSW5zdGFuY2UpO1xuICAgICAgICB1bmhpZGVCYWNrZ3JvdW5kRWxlbWVudHMoKTtcbiAgICAgICAgaWYgKG1vZGFsV2luZG93ICYmIGJyb2FkY2FzdENsb3NpbmcobW9kYWxXaW5kb3csIHJlYXNvbiwgZmFsc2UpKSB7XG4gICAgICAgICAgbW9kYWxXaW5kb3cudmFsdWUubW9kYWxTY29wZS4kJHVpYkRlc3RydWN0aW9uU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgICBtb2RhbFdpbmRvdy52YWx1ZS5kZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICAgICAgICByZW1vdmVNb2RhbFdpbmRvdyhtb2RhbEluc3RhbmNlLCBtb2RhbFdpbmRvdy52YWx1ZS5tb2RhbE9wZW5lcik7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICFtb2RhbFdpbmRvdztcbiAgICAgIH07XG5cbiAgICAgICRtb2RhbFN0YWNrLmRpc21pc3NBbGwgPSBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgdmFyIHRvcE1vZGFsID0gdGhpcy5nZXRUb3AoKTtcbiAgICAgICAgd2hpbGUgKHRvcE1vZGFsICYmIHRoaXMuZGlzbWlzcyh0b3BNb2RhbC5rZXksIHJlYXNvbikpIHtcbiAgICAgICAgICB0b3BNb2RhbCA9IHRoaXMuZ2V0VG9wKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRtb2RhbFN0YWNrLmdldFRvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gb3BlbmVkV2luZG93cy50b3AoKTtcbiAgICAgIH07XG5cbiAgICAgICRtb2RhbFN0YWNrLm1vZGFsUmVuZGVyZWQgPSBmdW5jdGlvbihtb2RhbEluc3RhbmNlKSB7XG4gICAgICAgIHZhciBtb2RhbFdpbmRvdyA9IG9wZW5lZFdpbmRvd3MuZ2V0KG1vZGFsSW5zdGFuY2UpO1xuICAgICAgICBpZiAobW9kYWxXaW5kb3cpIHtcbiAgICAgICAgICBtb2RhbFdpbmRvdy52YWx1ZS5yZW5kZXJEZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRtb2RhbFN0YWNrLmZvY3VzRmlyc3RGb2N1c2FibGVFbGVtZW50ID0gZnVuY3Rpb24obGlzdCkge1xuICAgICAgICBpZiAobGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbGlzdFswXS5mb2N1cygpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH07XG5cbiAgICAgICRtb2RhbFN0YWNrLmZvY3VzTGFzdEZvY3VzYWJsZUVsZW1lbnQgPSBmdW5jdGlvbihsaXN0KSB7XG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsaXN0W2xpc3QubGVuZ3RoIC0gMV0uZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuXG4gICAgICAkbW9kYWxTdGFjay5pc01vZGFsRm9jdXNlZCA9IGZ1bmN0aW9uKGV2dCwgbW9kYWxXaW5kb3cpIHtcbiAgICAgICAgaWYgKGV2dCAmJiBtb2RhbFdpbmRvdykge1xuICAgICAgICAgIHZhciBtb2RhbERvbUVsID0gbW9kYWxXaW5kb3cudmFsdWUubW9kYWxEb21FbDtcbiAgICAgICAgICBpZiAobW9kYWxEb21FbCAmJiBtb2RhbERvbUVsLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIChldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50KSA9PT0gbW9kYWxEb21FbFswXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfTtcblxuICAgICAgJG1vZGFsU3RhY2suaXNGb2N1c0luRmlyc3RJdGVtID0gZnVuY3Rpb24oZXZ0LCBsaXN0KSB7XG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gKGV2dC50YXJnZXQgfHwgZXZ0LnNyY0VsZW1lbnQpID09PSBsaXN0WzBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH07XG5cbiAgICAgICRtb2RhbFN0YWNrLmlzRm9jdXNJbkxhc3RJdGVtID0gZnVuY3Rpb24oZXZ0LCBsaXN0KSB7XG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gKGV2dC50YXJnZXQgfHwgZXZ0LnNyY0VsZW1lbnQpID09PSBsaXN0W2xpc3QubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfTtcblxuICAgICAgJG1vZGFsU3RhY2subG9hZEZvY3VzRWxlbWVudExpc3QgPSBmdW5jdGlvbihtb2RhbFdpbmRvdykge1xuICAgICAgICBpZiAobW9kYWxXaW5kb3cpIHtcbiAgICAgICAgICB2YXIgbW9kYWxEb21FMSA9IG1vZGFsV2luZG93LnZhbHVlLm1vZGFsRG9tRWw7XG4gICAgICAgICAgaWYgKG1vZGFsRG9tRTEgJiYgbW9kYWxEb21FMS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IG1vZGFsRG9tRTFbMF0ucXVlcnlTZWxlY3RvckFsbCh0YWJiYWJsZVNlbGVjdG9yKTtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50cyA/XG4gICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChlbGVtZW50cywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc1Zpc2libGUoZWxlbWVudCk7XG4gICAgICAgICAgICAgIH0pIDogZWxlbWVudHM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gJG1vZGFsU3RhY2s7XG4gICAgfV0pXG5cbiAgLnByb3ZpZGVyKCckdWliTW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgJG1vZGFsUHJvdmlkZXIgPSB7XG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGFuaW1hdGlvbjogdHJ1ZSxcbiAgICAgICAgYmFja2Ryb3A6IHRydWUsIC8vY2FuIGFsc28gYmUgZmFsc2Ugb3IgJ3N0YXRpYydcbiAgICAgICAga2V5Ym9hcmQ6IHRydWVcbiAgICAgIH0sXG4gICAgICAkZ2V0OiBbJyRyb290U2NvcGUnLCAnJHEnLCAnJGRvY3VtZW50JywgJyR0ZW1wbGF0ZVJlcXVlc3QnLCAnJGNvbnRyb2xsZXInLCAnJHVpYlJlc29sdmUnLCAnJHVpYk1vZGFsU3RhY2snLFxuICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsICRkb2N1bWVudCwgJHRlbXBsYXRlUmVxdWVzdCwgJGNvbnRyb2xsZXIsICR1aWJSZXNvbHZlLCAkbW9kYWxTdGFjaykge1xuICAgICAgICAgIHZhciAkbW9kYWwgPSB7fTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGdldFRlbXBsYXRlUHJvbWlzZShvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZSA/ICRxLndoZW4ob3B0aW9ucy50ZW1wbGF0ZSkgOlxuICAgICAgICAgICAgICAkdGVtcGxhdGVSZXF1ZXN0KGFuZ3VsYXIuaXNGdW5jdGlvbihvcHRpb25zLnRlbXBsYXRlVXJsKSA/XG4gICAgICAgICAgICAgICAgb3B0aW9ucy50ZW1wbGF0ZVVybCgpIDogb3B0aW9ucy50ZW1wbGF0ZVVybCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHByb21pc2VDaGFpbiA9IG51bGw7XG4gICAgICAgICAgJG1vZGFsLmdldFByb21pc2VDaGFpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VDaGFpbjtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgJG1vZGFsLm9wZW4gPSBmdW5jdGlvbihtb2RhbE9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBtb2RhbFJlc3VsdERlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIHZhciBtb2RhbE9wZW5lZERlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIHZhciBtb2RhbENsb3NlZERlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIHZhciBtb2RhbFJlbmRlckRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgLy9wcmVwYXJlIGFuIGluc3RhbmNlIG9mIGEgbW9kYWwgdG8gYmUgaW5qZWN0ZWQgaW50byBjb250cm9sbGVycyBhbmQgcmV0dXJuZWQgdG8gYSBjYWxsZXJcbiAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0ge1xuICAgICAgICAgICAgICByZXN1bHQ6IG1vZGFsUmVzdWx0RGVmZXJyZWQucHJvbWlzZSxcbiAgICAgICAgICAgICAgb3BlbmVkOiBtb2RhbE9wZW5lZERlZmVycmVkLnByb21pc2UsXG4gICAgICAgICAgICAgIGNsb3NlZDogbW9kYWxDbG9zZWREZWZlcnJlZC5wcm9taXNlLFxuICAgICAgICAgICAgICByZW5kZXJlZDogbW9kYWxSZW5kZXJEZWZlcnJlZC5wcm9taXNlLFxuICAgICAgICAgICAgICBjbG9zZTogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkbW9kYWxTdGFjay5jbG9zZShtb2RhbEluc3RhbmNlLCByZXN1bHQpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBkaXNtaXNzOiBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRtb2RhbFN0YWNrLmRpc21pc3MobW9kYWxJbnN0YW5jZSwgcmVhc29uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy9tZXJnZSBhbmQgY2xlYW4gdXAgb3B0aW9uc1xuICAgICAgICAgICAgbW9kYWxPcHRpb25zID0gYW5ndWxhci5leHRlbmQoe30sICRtb2RhbFByb3ZpZGVyLm9wdGlvbnMsIG1vZGFsT3B0aW9ucyk7XG4gICAgICAgICAgICBtb2RhbE9wdGlvbnMucmVzb2x2ZSA9IG1vZGFsT3B0aW9ucy5yZXNvbHZlIHx8IHt9O1xuICAgICAgICAgICAgbW9kYWxPcHRpb25zLmFwcGVuZFRvID0gbW9kYWxPcHRpb25zLmFwcGVuZFRvIHx8ICRkb2N1bWVudC5maW5kKCdib2R5JykuZXEoMCk7XG5cbiAgICAgICAgICAgIGlmICghbW9kYWxPcHRpb25zLmFwcGVuZFRvLmxlbmd0aCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FwcGVuZFRvIGVsZW1lbnQgbm90IGZvdW5kLiBNYWtlIHN1cmUgdGhhdCB0aGUgZWxlbWVudCBwYXNzZWQgaXMgaW4gRE9NLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3ZlcmlmeSBvcHRpb25zXG4gICAgICAgICAgICBpZiAoIW1vZGFsT3B0aW9ucy5jb21wb25lbnQgJiYgIW1vZGFsT3B0aW9ucy50ZW1wbGF0ZSAmJiAhbW9kYWxPcHRpb25zLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT25lIG9mIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBvciB0ZW1wbGF0ZVVybCBvcHRpb25zIGlzIHJlcXVpcmVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGVtcGxhdGVBbmRSZXNvbHZlUHJvbWlzZTtcbiAgICAgICAgICAgIGlmIChtb2RhbE9wdGlvbnMuY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgIHRlbXBsYXRlQW5kUmVzb2x2ZVByb21pc2UgPSAkcS53aGVuKCR1aWJSZXNvbHZlLnJlc29sdmUobW9kYWxPcHRpb25zLnJlc29sdmUsIHt9LCBudWxsLCBudWxsKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0ZW1wbGF0ZUFuZFJlc29sdmVQcm9taXNlID1cbiAgICAgICAgICAgICAgICAkcS5hbGwoW2dldFRlbXBsYXRlUHJvbWlzZShtb2RhbE9wdGlvbnMpLCAkdWliUmVzb2x2ZS5yZXNvbHZlKG1vZGFsT3B0aW9ucy5yZXNvbHZlLCB7fSwgbnVsbCwgbnVsbCldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVzb2x2ZVdpdGhUZW1wbGF0ZSgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlQW5kUmVzb2x2ZVByb21pc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdhaXQgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBleGlzdGluZyBwcm9taXNlIGNoYWluLlxuICAgICAgICAgICAgLy8gVGhlbiBzd2l0Y2ggdG8gb3VyIG93biBjb21iaW5lZCBwcm9taXNlIGRlcGVuZGVuY3kgKHJlZ2FyZGxlc3Mgb2YgaG93IHRoZSBwcmV2aW91cyBtb2RhbCBmYXJlZCkuXG4gICAgICAgICAgICAvLyBUaGVuIGFkZCB0byAkbW9kYWxTdGFjayBhbmQgcmVzb2x2ZSBvcGVuZWQuXG4gICAgICAgICAgICAvLyBGaW5hbGx5IGNsZWFuIHVwIHRoZSBjaGFpbiB2YXJpYWJsZSBpZiBubyBzdWJzZXF1ZW50IG1vZGFsIGhhcyBvdmVyd3JpdHRlbiBpdC5cbiAgICAgICAgICAgIHZhciBzYW1lUHJvbWlzZTtcbiAgICAgICAgICAgIHNhbWVQcm9taXNlID0gcHJvbWlzZUNoYWluID0gJHEuYWxsKFtwcm9taXNlQ2hhaW5dKVxuICAgICAgICAgICAgICAudGhlbihyZXNvbHZlV2l0aFRlbXBsYXRlLCByZXNvbHZlV2l0aFRlbXBsYXRlKVxuICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiByZXNvbHZlU3VjY2Vzcyh0cGxBbmRWYXJzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb3ZpZGVkU2NvcGUgPSBtb2RhbE9wdGlvbnMuc2NvcGUgfHwgJHJvb3RTY29wZTtcblxuICAgICAgICAgICAgICAgIHZhciBtb2RhbFNjb3BlID0gcHJvdmlkZWRTY29wZS4kbmV3KCk7XG4gICAgICAgICAgICAgICAgbW9kYWxTY29wZS4kY2xvc2UgPSBtb2RhbEluc3RhbmNlLmNsb3NlO1xuICAgICAgICAgICAgICAgIG1vZGFsU2NvcGUuJGRpc21pc3MgPSBtb2RhbEluc3RhbmNlLmRpc21pc3M7XG5cbiAgICAgICAgICAgICAgICBtb2RhbFNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghbW9kYWxTY29wZS4kJHVpYkRlc3RydWN0aW9uU2NoZWR1bGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGFsU2NvcGUuJGRpc21pc3MoJyR1aWJVbnNjaGVkdWxlZERlc3RydWN0aW9uJyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgbW9kYWwgPSB7XG4gICAgICAgICAgICAgICAgICBzY29wZTogbW9kYWxTY29wZSxcbiAgICAgICAgICAgICAgICAgIGRlZmVycmVkOiBtb2RhbFJlc3VsdERlZmVycmVkLFxuICAgICAgICAgICAgICAgICAgcmVuZGVyRGVmZXJyZWQ6IG1vZGFsUmVuZGVyRGVmZXJyZWQsXG4gICAgICAgICAgICAgICAgICBjbG9zZWREZWZlcnJlZDogbW9kYWxDbG9zZWREZWZlcnJlZCxcbiAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogbW9kYWxPcHRpb25zLmFuaW1hdGlvbixcbiAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiBtb2RhbE9wdGlvbnMuYmFja2Ryb3AsXG4gICAgICAgICAgICAgICAgICBrZXlib2FyZDogbW9kYWxPcHRpb25zLmtleWJvYXJkLFxuICAgICAgICAgICAgICAgICAgYmFja2Ryb3BDbGFzczogbW9kYWxPcHRpb25zLmJhY2tkcm9wQ2xhc3MsXG4gICAgICAgICAgICAgICAgICB3aW5kb3dUb3BDbGFzczogbW9kYWxPcHRpb25zLndpbmRvd1RvcENsYXNzLFxuICAgICAgICAgICAgICAgICAgd2luZG93Q2xhc3M6IG1vZGFsT3B0aW9ucy53aW5kb3dDbGFzcyxcbiAgICAgICAgICAgICAgICAgIHdpbmRvd1RlbXBsYXRlVXJsOiBtb2RhbE9wdGlvbnMud2luZG93VGVtcGxhdGVVcmwsXG4gICAgICAgICAgICAgICAgICBhcmlhTGFiZWxsZWRCeTogbW9kYWxPcHRpb25zLmFyaWFMYWJlbGxlZEJ5LFxuICAgICAgICAgICAgICAgICAgYXJpYURlc2NyaWJlZEJ5OiBtb2RhbE9wdGlvbnMuYXJpYURlc2NyaWJlZEJ5LFxuICAgICAgICAgICAgICAgICAgc2l6ZTogbW9kYWxPcHRpb25zLnNpemUsXG4gICAgICAgICAgICAgICAgICBvcGVuZWRDbGFzczogbW9kYWxPcHRpb25zLm9wZW5lZENsYXNzLFxuICAgICAgICAgICAgICAgICAgYXBwZW5kVG86IG1vZGFsT3B0aW9ucy5hcHBlbmRUb1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50ID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGN0cmxJbnN0YW5jZSwgY3RybEluc3RhbnRpYXRlLCBjdHJsTG9jYWxzID0ge307XG5cbiAgICAgICAgICAgICAgICBpZiAobW9kYWxPcHRpb25zLmNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgY29uc3RydWN0TG9jYWxzKGNvbXBvbmVudCwgZmFsc2UsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5uYW1lID0gbW9kYWxPcHRpb25zLmNvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgIG1vZGFsLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGFsT3B0aW9ucy5jb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdHJ1Y3RMb2NhbHMoY3RybExvY2FscywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAvLyB0aGUgdGhpcmQgcGFyYW0gd2lsbCBtYWtlIHRoZSBjb250cm9sbGVyIGluc3RhbnRpYXRlIGxhdGVyLHByaXZhdGUgYXBpXG4gICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIuanMvYmxvYi9tYXN0ZXIvc3JjL25nL2NvbnRyb2xsZXIuanMjTDEyNlxuICAgICAgICAgICAgICAgICAgY3RybEluc3RhbnRpYXRlID0gJGNvbnRyb2xsZXIobW9kYWxPcHRpb25zLmNvbnRyb2xsZXIsIGN0cmxMb2NhbHMsIHRydWUsIG1vZGFsT3B0aW9ucy5jb250cm9sbGVyQXMpO1xuICAgICAgICAgICAgICAgICAgaWYgKG1vZGFsT3B0aW9ucy5jb250cm9sbGVyQXMgJiYgbW9kYWxPcHRpb25zLmJpbmRUb0NvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY3RybEluc3RhbmNlID0gY3RybEluc3RhbnRpYXRlLmluc3RhbmNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsSW5zdGFuY2UuJGNsb3NlID0gbW9kYWxTY29wZS4kY2xvc2U7XG4gICAgICAgICAgICAgICAgICAgIGN0cmxJbnN0YW5jZS4kZGlzbWlzcyA9IG1vZGFsU2NvcGUuJGRpc21pc3M7XG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGN0cmxJbnN0YW5jZSwge1xuICAgICAgICAgICAgICAgICAgICAgICRyZXNvbHZlOiBjdHJsTG9jYWxzLiRzY29wZS4kcmVzb2x2ZVxuICAgICAgICAgICAgICAgICAgICB9LCBwcm92aWRlZFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgY3RybEluc3RhbmNlID0gY3RybEluc3RhbnRpYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oY3RybEluc3RhbmNlLiRvbkluaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmxJbnN0YW5jZS4kb25Jbml0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFtb2RhbE9wdGlvbnMuY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICBtb2RhbC5jb250ZW50ID0gdHBsQW5kVmFyc1swXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkbW9kYWxTdGFjay5vcGVuKG1vZGFsSW5zdGFuY2UsIG1vZGFsKTtcbiAgICAgICAgICAgICAgICBtb2RhbE9wZW5lZERlZmVycmVkLnJlc29sdmUodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb25zdHJ1Y3RMb2NhbHMob2JqLCB0ZW1wbGF0ZSwgaW5zdGFuY2VPblNjb3BlLCBpbmplY3RhYmxlKSB7XG4gICAgICAgICAgICAgICAgICBvYmouJHNjb3BlID0gbW9kYWxTY29wZTtcbiAgICAgICAgICAgICAgICAgIG9iai4kc2NvcGUuJHJlc29sdmUgPSB7fTtcbiAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZU9uU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLiRzY29wZS4kdWliTW9kYWxJbnN0YW5jZSA9IG1vZGFsSW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmouJHVpYk1vZGFsSW5zdGFuY2UgPSBtb2RhbEluc3RhbmNlO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICB2YXIgcmVzb2x2ZXMgPSB0ZW1wbGF0ZSA/IHRwbEFuZFZhcnNbMV0gOiB0cGxBbmRWYXJzO1xuICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHJlc29sdmVzLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmplY3RhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgb2JqW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG9iai4kc2NvcGUuJHJlc29sdmVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gcmVzb2x2ZUVycm9yKHJlYXNvbikge1xuICAgICAgICAgICAgICBtb2RhbE9wZW5lZERlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICBtb2RhbFJlc3VsdERlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgfSlbJ2ZpbmFsbHknXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKHByb21pc2VDaGFpbiA9PT0gc2FtZVByb21pc2UpIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlQ2hhaW4gPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIG1vZGFsSW5zdGFuY2U7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJldHVybiAkbW9kYWw7XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9O1xuXG4gICAgcmV0dXJuICRtb2RhbFByb3ZpZGVyO1xuICB9KTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5wYWdpbmcnLCBbXSlcbi8qKlxuICogSGVscGVyIGludGVybmFsIHNlcnZpY2UgZm9yIGdlbmVyYXRpbmcgY29tbW9uIGNvbnRyb2xsZXIgY29kZSBiZXR3ZWVuIHRoZVxuICogcGFnZXIgYW5kIHBhZ2luYXRpb24gY29tcG9uZW50c1xuICovXG4uZmFjdG9yeSgndWliUGFnaW5nJywgWyckcGFyc2UnLCBmdW5jdGlvbigkcGFyc2UpIHtcbiAgcmV0dXJuIHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKGN0cmwsICRzY29wZSwgJGF0dHJzKSB7XG4gICAgICBjdHJsLnNldE51bVBhZ2VzID0gJGF0dHJzLm51bVBhZ2VzID8gJHBhcnNlKCRhdHRycy5udW1QYWdlcykuYXNzaWduIDogYW5ndWxhci5ub29wO1xuICAgICAgY3RybC5uZ01vZGVsQ3RybCA9IHsgJHNldFZpZXdWYWx1ZTogYW5ndWxhci5ub29wIH07IC8vIG51bGxNb2RlbEN0cmxcbiAgICAgIGN0cmwuX3dhdGNoZXJzID0gW107XG5cbiAgICAgIGN0cmwuaW5pdCA9IGZ1bmN0aW9uKG5nTW9kZWxDdHJsLCBjb25maWcpIHtcbiAgICAgICAgY3RybC5uZ01vZGVsQ3RybCA9IG5nTW9kZWxDdHJsO1xuICAgICAgICBjdHJsLmNvbmZpZyA9IGNvbmZpZztcblxuICAgICAgICBuZ01vZGVsQ3RybC4kcmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY3RybC5yZW5kZXIoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoJGF0dHJzLml0ZW1zUGVyUGFnZSkge1xuICAgICAgICAgIGN0cmwuX3dhdGNoZXJzLnB1c2goJHNjb3BlLiRwYXJlbnQuJHdhdGNoKCRhdHRycy5pdGVtc1BlclBhZ2UsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBjdHJsLml0ZW1zUGVyUGFnZSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICAkc2NvcGUudG90YWxQYWdlcyA9IGN0cmwuY2FsY3VsYXRlVG90YWxQYWdlcygpO1xuICAgICAgICAgICAgY3RybC51cGRhdGVQYWdlKCk7XG4gICAgICAgICAgfSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN0cmwuaXRlbXNQZXJQYWdlID0gY29uZmlnLml0ZW1zUGVyUGFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3RvdGFsSXRlbXMnLCBmdW5jdGlvbihuZXdUb3RhbCwgb2xkVG90YWwpIHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQobmV3VG90YWwpIHx8IG5ld1RvdGFsICE9PSBvbGRUb3RhbCkge1xuICAgICAgICAgICAgJHNjb3BlLnRvdGFsUGFnZXMgPSBjdHJsLmNhbGN1bGF0ZVRvdGFsUGFnZXMoKTtcbiAgICAgICAgICAgIGN0cmwudXBkYXRlUGFnZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBjdHJsLmNhbGN1bGF0ZVRvdGFsUGFnZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRvdGFsUGFnZXMgPSBjdHJsLml0ZW1zUGVyUGFnZSA8IDEgPyAxIDogTWF0aC5jZWlsKCRzY29wZS50b3RhbEl0ZW1zIC8gY3RybC5pdGVtc1BlclBhZ2UpO1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgodG90YWxQYWdlcyB8fCAwLCAxKTtcbiAgICAgIH07XG5cbiAgICAgIGN0cmwucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5wYWdlID0gcGFyc2VJbnQoY3RybC5uZ01vZGVsQ3RybC4kdmlld1ZhbHVlLCAxMCkgfHwgMTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zZWxlY3RQYWdlID0gZnVuY3Rpb24ocGFnZSwgZXZ0KSB7XG4gICAgICAgIGlmIChldnQpIHtcbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjbGlja0FsbG93ZWQgPSAhJHNjb3BlLm5nRGlzYWJsZWQgfHwgIWV2dDtcbiAgICAgICAgaWYgKGNsaWNrQWxsb3dlZCAmJiAkc2NvcGUucGFnZSAhPT0gcGFnZSAmJiBwYWdlID4gMCAmJiBwYWdlIDw9ICRzY29wZS50b3RhbFBhZ2VzKSB7XG4gICAgICAgICAgaWYgKGV2dCAmJiBldnQudGFyZ2V0KSB7XG4gICAgICAgICAgICBldnQudGFyZ2V0LmJsdXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3RybC5uZ01vZGVsQ3RybC4kc2V0Vmlld1ZhbHVlKHBhZ2UpO1xuICAgICAgICAgIGN0cmwubmdNb2RlbEN0cmwuJHJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuZ2V0VGV4dCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gJHNjb3BlW2tleSArICdUZXh0J10gfHwgY3RybC5jb25maWdba2V5ICsgJ1RleHQnXTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5ub1ByZXZpb3VzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkc2NvcGUucGFnZSA9PT0gMTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5ub05leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICRzY29wZS5wYWdlID09PSAkc2NvcGUudG90YWxQYWdlcztcbiAgICAgIH07XG5cbiAgICAgIGN0cmwudXBkYXRlUGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjdHJsLnNldE51bVBhZ2VzKCRzY29wZS4kcGFyZW50LCAkc2NvcGUudG90YWxQYWdlcyk7IC8vIFJlYWRvbmx5IHZhcmlhYmxlXG5cbiAgICAgICAgaWYgKCRzY29wZS5wYWdlID4gJHNjb3BlLnRvdGFsUGFnZXMpIHtcbiAgICAgICAgICAkc2NvcGUuc2VsZWN0UGFnZSgkc2NvcGUudG90YWxQYWdlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3RybC5uZ01vZGVsQ3RybC4kcmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaWxlIChjdHJsLl93YXRjaGVycy5sZW5ndGgpIHtcbiAgICAgICAgICBjdHJsLl93YXRjaGVycy5zaGlmdCgpKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5wYWdlcicsIFsndWkuYm9vdHN0cmFwLnBhZ2luZycsICd1aS5ib290c3RyYXAudGFiaW5kZXgnXSlcblxuLmNvbnRyb2xsZXIoJ1VpYlBhZ2VyQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRhdHRycycsICd1aWJQYWdpbmcnLCAndWliUGFnZXJDb25maWcnLCBmdW5jdGlvbigkc2NvcGUsICRhdHRycywgdWliUGFnaW5nLCB1aWJQYWdlckNvbmZpZykge1xuICAkc2NvcGUuYWxpZ24gPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuYWxpZ24pID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLmFsaWduKSA6IHVpYlBhZ2VyQ29uZmlnLmFsaWduO1xuXG4gIHVpYlBhZ2luZy5jcmVhdGUodGhpcywgJHNjb3BlLCAkYXR0cnMpO1xufV0pXG5cbi5jb25zdGFudCgndWliUGFnZXJDb25maWcnLCB7XG4gIGl0ZW1zUGVyUGFnZTogMTAsXG4gIHByZXZpb3VzVGV4dDogJ8KrIFByZXZpb3VzJyxcbiAgbmV4dFRleHQ6ICdOZXh0IMK7JyxcbiAgYWxpZ246IHRydWVcbn0pXG5cbi5kaXJlY3RpdmUoJ3VpYlBhZ2VyJywgWyd1aWJQYWdlckNvbmZpZycsIGZ1bmN0aW9uKHVpYlBhZ2VyQ29uZmlnKSB7XG4gIHJldHVybiB7XG4gICAgc2NvcGU6IHtcbiAgICAgIHRvdGFsSXRlbXM6ICc9JyxcbiAgICAgIHByZXZpb3VzVGV4dDogJ0AnLFxuICAgICAgbmV4dFRleHQ6ICdAJyxcbiAgICAgIG5nRGlzYWJsZWQ6ICc9J1xuICAgIH0sXG4gICAgcmVxdWlyZTogWyd1aWJQYWdlcicsICc/bmdNb2RlbCddLFxuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgY29udHJvbGxlcjogJ1VpYlBhZ2VyQ29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAncGFnZXInLFxuICAgIHRlbXBsYXRlVXJsOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xuICAgICAgcmV0dXJuIGF0dHJzLnRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvcGFnZXIvcGFnZXIuaHRtbCc7XG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGN0cmxzKSB7XG4gICAgICBlbGVtZW50LmFkZENsYXNzKCdwYWdlcicpO1xuICAgICAgdmFyIHBhZ2luYXRpb25DdHJsID0gY3RybHNbMF0sIG5nTW9kZWxDdHJsID0gY3RybHNbMV07XG5cbiAgICAgIGlmICghbmdNb2RlbEN0cmwpIHtcbiAgICAgICAgcmV0dXJuOyAvLyBkbyBub3RoaW5nIGlmIG5vIG5nLW1vZGVsXG4gICAgICB9XG5cbiAgICAgIHBhZ2luYXRpb25DdHJsLmluaXQobmdNb2RlbEN0cmwsIHVpYlBhZ2VyQ29uZmlnKTtcbiAgICB9XG4gIH07XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5ib290c3RyYXAucGFnaW5hdGlvbicsIFsndWkuYm9vdHN0cmFwLnBhZ2luZycsICd1aS5ib290c3RyYXAudGFiaW5kZXgnXSlcbi5jb250cm9sbGVyKCdVaWJQYWdpbmF0aW9uQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRhdHRycycsICckcGFyc2UnLCAndWliUGFnaW5nJywgJ3VpYlBhZ2luYXRpb25Db25maWcnLCBmdW5jdGlvbigkc2NvcGUsICRhdHRycywgJHBhcnNlLCB1aWJQYWdpbmcsIHVpYlBhZ2luYXRpb25Db25maWcpIHtcbiAgdmFyIGN0cmwgPSB0aGlzO1xuICAvLyBTZXR1cCBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnNcbiAgdmFyIG1heFNpemUgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMubWF4U2l6ZSkgPyAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMubWF4U2l6ZSkgOiB1aWJQYWdpbmF0aW9uQ29uZmlnLm1heFNpemUsXG4gICAgcm90YXRlID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLnJvdGF0ZSkgPyAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMucm90YXRlKSA6IHVpYlBhZ2luYXRpb25Db25maWcucm90YXRlLFxuICAgIGZvcmNlRWxsaXBzZXMgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuZm9yY2VFbGxpcHNlcykgPyAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMuZm9yY2VFbGxpcHNlcykgOiB1aWJQYWdpbmF0aW9uQ29uZmlnLmZvcmNlRWxsaXBzZXMsXG4gICAgYm91bmRhcnlMaW5rTnVtYmVycyA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5ib3VuZGFyeUxpbmtOdW1iZXJzKSA/ICRzY29wZS4kcGFyZW50LiRldmFsKCRhdHRycy5ib3VuZGFyeUxpbmtOdW1iZXJzKSA6IHVpYlBhZ2luYXRpb25Db25maWcuYm91bmRhcnlMaW5rTnVtYmVycyxcbiAgICBwYWdlTGFiZWwgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMucGFnZUxhYmVsKSA/IGZ1bmN0aW9uKGlkeCkgeyByZXR1cm4gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLnBhZ2VMYWJlbCwgeyRwYWdlOiBpZHh9KTsgfSA6IGFuZ3VsYXIuaWRlbnRpdHk7XG4gICRzY29wZS5ib3VuZGFyeUxpbmtzID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmJvdW5kYXJ5TGlua3MpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLmJvdW5kYXJ5TGlua3MpIDogdWliUGFnaW5hdGlvbkNvbmZpZy5ib3VuZGFyeUxpbmtzO1xuICAkc2NvcGUuZGlyZWN0aW9uTGlua3MgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuZGlyZWN0aW9uTGlua3MpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLmRpcmVjdGlvbkxpbmtzKSA6IHVpYlBhZ2luYXRpb25Db25maWcuZGlyZWN0aW9uTGlua3M7XG4gICRhdHRycy4kc2V0KCdyb2xlJywgJ21lbnUnKTtcblxuICB1aWJQYWdpbmcuY3JlYXRlKHRoaXMsICRzY29wZSwgJGF0dHJzKTtcblxuICBpZiAoJGF0dHJzLm1heFNpemUpIHtcbiAgICBjdHJsLl93YXRjaGVycy5wdXNoKCRzY29wZS4kcGFyZW50LiR3YXRjaCgkcGFyc2UoJGF0dHJzLm1heFNpemUpLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgbWF4U2l6ZSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICBjdHJsLnJlbmRlcigpO1xuICAgIH0pKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBwYWdlIG9iamVjdCB1c2VkIGluIHRlbXBsYXRlXG4gIGZ1bmN0aW9uIG1ha2VQYWdlKG51bWJlciwgdGV4dCwgaXNBY3RpdmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbnVtYmVyOiBudW1iZXIsXG4gICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgYWN0aXZlOiBpc0FjdGl2ZVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRQYWdlcyhjdXJyZW50UGFnZSwgdG90YWxQYWdlcykge1xuICAgIHZhciBwYWdlcyA9IFtdO1xuXG4gICAgLy8gRGVmYXVsdCBwYWdlIGxpbWl0c1xuICAgIHZhciBzdGFydFBhZ2UgPSAxLCBlbmRQYWdlID0gdG90YWxQYWdlcztcbiAgICB2YXIgaXNNYXhTaXplZCA9IGFuZ3VsYXIuaXNEZWZpbmVkKG1heFNpemUpICYmIG1heFNpemUgPCB0b3RhbFBhZ2VzO1xuXG4gICAgLy8gcmVjb21wdXRlIGlmIG1heFNpemVcbiAgICBpZiAoaXNNYXhTaXplZCkge1xuICAgICAgaWYgKHJvdGF0ZSkge1xuICAgICAgICAvLyBDdXJyZW50IHBhZ2UgaXMgZGlzcGxheWVkIGluIHRoZSBtaWRkbGUgb2YgdGhlIHZpc2libGUgb25lc1xuICAgICAgICBzdGFydFBhZ2UgPSBNYXRoLm1heChjdXJyZW50UGFnZSAtIE1hdGguZmxvb3IobWF4U2l6ZSAvIDIpLCAxKTtcbiAgICAgICAgZW5kUGFnZSA9IHN0YXJ0UGFnZSArIG1heFNpemUgLSAxO1xuXG4gICAgICAgIC8vIEFkanVzdCBpZiBsaW1pdCBpcyBleGNlZWRlZFxuICAgICAgICBpZiAoZW5kUGFnZSA+IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgICBlbmRQYWdlID0gdG90YWxQYWdlcztcbiAgICAgICAgICBzdGFydFBhZ2UgPSBlbmRQYWdlIC0gbWF4U2l6ZSArIDE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFZpc2libGUgcGFnZXMgYXJlIHBhZ2luYXRlZCB3aXRoIG1heFNpemVcbiAgICAgICAgc3RhcnRQYWdlID0gKE1hdGguY2VpbChjdXJyZW50UGFnZSAvIG1heFNpemUpIC0gMSkgKiBtYXhTaXplICsgMTtcblxuICAgICAgICAvLyBBZGp1c3QgbGFzdCBwYWdlIGlmIGxpbWl0IGlzIGV4Y2VlZGVkXG4gICAgICAgIGVuZFBhZ2UgPSBNYXRoLm1pbihzdGFydFBhZ2UgKyBtYXhTaXplIC0gMSwgdG90YWxQYWdlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWRkIHBhZ2UgbnVtYmVyIGxpbmtzXG4gICAgZm9yICh2YXIgbnVtYmVyID0gc3RhcnRQYWdlOyBudW1iZXIgPD0gZW5kUGFnZTsgbnVtYmVyKyspIHtcbiAgICAgIHZhciBwYWdlID0gbWFrZVBhZ2UobnVtYmVyLCBwYWdlTGFiZWwobnVtYmVyKSwgbnVtYmVyID09PSBjdXJyZW50UGFnZSk7XG4gICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgIH1cblxuICAgIC8vIEFkZCBsaW5rcyB0byBtb3ZlIGJldHdlZW4gcGFnZSBzZXRzXG4gICAgaWYgKGlzTWF4U2l6ZWQgJiYgbWF4U2l6ZSA+IDAgJiYgKCFyb3RhdGUgfHwgZm9yY2VFbGxpcHNlcyB8fCBib3VuZGFyeUxpbmtOdW1iZXJzKSkge1xuICAgICAgaWYgKHN0YXJ0UGFnZSA+IDEpIHtcbiAgICAgICAgaWYgKCFib3VuZGFyeUxpbmtOdW1iZXJzIHx8IHN0YXJ0UGFnZSA+IDMpIHsgLy9uZWVkIGVsbGlwc2lzIGZvciBhbGwgb3B0aW9ucyB1bmxlc3MgcmFuZ2UgaXMgdG9vIGNsb3NlIHRvIGJlZ2lubmluZ1xuICAgICAgICB2YXIgcHJldmlvdXNQYWdlU2V0ID0gbWFrZVBhZ2Uoc3RhcnRQYWdlIC0gMSwgJy4uLicsIGZhbHNlKTtcbiAgICAgICAgcGFnZXMudW5zaGlmdChwcmV2aW91c1BhZ2VTZXQpO1xuICAgICAgfVxuICAgICAgICBpZiAoYm91bmRhcnlMaW5rTnVtYmVycykge1xuICAgICAgICAgIGlmIChzdGFydFBhZ2UgPT09IDMpIHsgLy9uZWVkIHRvIHJlcGxhY2UgZWxsaXBzaXMgd2hlbiB0aGUgYnV0dG9ucyB3b3VsZCBiZSBzZXF1ZW50aWFsXG4gICAgICAgICAgICB2YXIgc2Vjb25kUGFnZUxpbmsgPSBtYWtlUGFnZSgyLCAnMicsIGZhbHNlKTtcbiAgICAgICAgICAgIHBhZ2VzLnVuc2hpZnQoc2Vjb25kUGFnZUxpbmspO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL2FkZCB0aGUgZmlyc3QgcGFnZVxuICAgICAgICAgIHZhciBmaXJzdFBhZ2VMaW5rID0gbWFrZVBhZ2UoMSwgJzEnLCBmYWxzZSk7XG4gICAgICAgICAgcGFnZXMudW5zaGlmdChmaXJzdFBhZ2VMaW5rKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZW5kUGFnZSA8IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgaWYgKCFib3VuZGFyeUxpbmtOdW1iZXJzIHx8IGVuZFBhZ2UgPCB0b3RhbFBhZ2VzIC0gMikgeyAvL25lZWQgZWxsaXBzaXMgZm9yIGFsbCBvcHRpb25zIHVubGVzcyByYW5nZSBpcyB0b28gY2xvc2UgdG8gZW5kXG4gICAgICAgIHZhciBuZXh0UGFnZVNldCA9IG1ha2VQYWdlKGVuZFBhZ2UgKyAxLCAnLi4uJywgZmFsc2UpO1xuICAgICAgICBwYWdlcy5wdXNoKG5leHRQYWdlU2V0KTtcbiAgICAgIH1cbiAgICAgICAgaWYgKGJvdW5kYXJ5TGlua051bWJlcnMpIHtcbiAgICAgICAgICBpZiAoZW5kUGFnZSA9PT0gdG90YWxQYWdlcyAtIDIpIHsgLy9uZWVkIHRvIHJlcGxhY2UgZWxsaXBzaXMgd2hlbiB0aGUgYnV0dG9ucyB3b3VsZCBiZSBzZXF1ZW50aWFsXG4gICAgICAgICAgICB2YXIgc2Vjb25kVG9MYXN0UGFnZUxpbmsgPSBtYWtlUGFnZSh0b3RhbFBhZ2VzIC0gMSwgdG90YWxQYWdlcyAtIDEsIGZhbHNlKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2goc2Vjb25kVG9MYXN0UGFnZUxpbmspO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL2FkZCB0aGUgbGFzdCBwYWdlXG4gICAgICAgICAgdmFyIGxhc3RQYWdlTGluayA9IG1ha2VQYWdlKHRvdGFsUGFnZXMsIHRvdGFsUGFnZXMsIGZhbHNlKTtcbiAgICAgICAgICBwYWdlcy5wdXNoKGxhc3RQYWdlTGluayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VzO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsUmVuZGVyID0gdGhpcy5yZW5kZXI7XG4gIHRoaXMucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgb3JpZ2luYWxSZW5kZXIoKTtcbiAgICBpZiAoJHNjb3BlLnBhZ2UgPiAwICYmICRzY29wZS5wYWdlIDw9ICRzY29wZS50b3RhbFBhZ2VzKSB7XG4gICAgICAkc2NvcGUucGFnZXMgPSBnZXRQYWdlcygkc2NvcGUucGFnZSwgJHNjb3BlLnRvdGFsUGFnZXMpO1xuICAgIH1cbiAgfTtcbn1dKVxuXG4uY29uc3RhbnQoJ3VpYlBhZ2luYXRpb25Db25maWcnLCB7XG4gIGl0ZW1zUGVyUGFnZTogMTAsXG4gIGJvdW5kYXJ5TGlua3M6IGZhbHNlLFxuICBib3VuZGFyeUxpbmtOdW1iZXJzOiBmYWxzZSxcbiAgZGlyZWN0aW9uTGlua3M6IHRydWUsXG4gIGZpcnN0VGV4dDogJ0ZpcnN0JyxcbiAgcHJldmlvdXNUZXh0OiAnUHJldmlvdXMnLFxuICBuZXh0VGV4dDogJ05leHQnLFxuICBsYXN0VGV4dDogJ0xhc3QnLFxuICByb3RhdGU6IHRydWUsXG4gIGZvcmNlRWxsaXBzZXM6IGZhbHNlXG59KVxuXG4uZGlyZWN0aXZlKCd1aWJQYWdpbmF0aW9uJywgWyckcGFyc2UnLCAndWliUGFnaW5hdGlvbkNvbmZpZycsIGZ1bmN0aW9uKCRwYXJzZSwgdWliUGFnaW5hdGlvbkNvbmZpZykge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICB0b3RhbEl0ZW1zOiAnPScsXG4gICAgICBmaXJzdFRleHQ6ICdAJyxcbiAgICAgIHByZXZpb3VzVGV4dDogJ0AnLFxuICAgICAgbmV4dFRleHQ6ICdAJyxcbiAgICAgIGxhc3RUZXh0OiAnQCcsXG4gICAgICBuZ0Rpc2FibGVkOic9J1xuICAgIH0sXG4gICAgcmVxdWlyZTogWyd1aWJQYWdpbmF0aW9uJywgJz9uZ01vZGVsJ10sXG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBjb250cm9sbGVyOiAnVWliUGFnaW5hdGlvbkNvbnRyb2xsZXInLFxuICAgIGNvbnRyb2xsZXJBczogJ3BhZ2luYXRpb24nLFxuICAgIHRlbXBsYXRlVXJsOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xuICAgICAgcmV0dXJuIGF0dHJzLnRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvcGFnaW5hdGlvbi9wYWdpbmF0aW9uLmh0bWwnO1xuICAgIH0sXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgZWxlbWVudC5hZGRDbGFzcygncGFnaW5hdGlvbicpO1xuICAgICAgdmFyIHBhZ2luYXRpb25DdHJsID0gY3RybHNbMF0sIG5nTW9kZWxDdHJsID0gY3RybHNbMV07XG5cbiAgICAgIGlmICghbmdNb2RlbEN0cmwpIHtcbiAgICAgICAgIHJldHVybjsgLy8gZG8gbm90aGluZyBpZiBubyBuZy1tb2RlbFxuICAgICAgfVxuXG4gICAgICBwYWdpbmF0aW9uQ3RybC5pbml0KG5nTW9kZWxDdHJsLCB1aWJQYWdpbmF0aW9uQ29uZmlnKTtcbiAgICB9XG4gIH07XG59XSk7XG5cbi8qKlxuICogVGhlIGZvbGxvd2luZyBmZWF0dXJlcyBhcmUgc3RpbGwgb3V0c3RhbmRpbmc6IGFuaW1hdGlvbiBhcyBhXG4gKiBmdW5jdGlvbiwgcGxhY2VtZW50IGFzIGEgZnVuY3Rpb24sIGluc2lkZSwgc3VwcG9ydCBmb3IgbW9yZSB0cmlnZ2VycyB0aGFuXG4gKiBqdXN0IG1vdXNlIGVudGVyL2xlYXZlLCBodG1sIHRvb2x0aXBzLCBhbmQgc2VsZWN0b3IgZGVsZWdhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC50b29sdGlwJywgWyd1aS5ib290c3RyYXAucG9zaXRpb24nLCAndWkuYm9vdHN0cmFwLnN0YWNrZWRNYXAnXSlcblxuLyoqXG4gKiBUaGUgJHRvb2x0aXAgc2VydmljZSBjcmVhdGVzIHRvb2x0aXAtIGFuZCBwb3BvdmVyLWxpa2UgZGlyZWN0aXZlcyBhcyB3ZWxsIGFzXG4gKiBob3VzZXMgZ2xvYmFsIG9wdGlvbnMgZm9yIHRoZW0uXG4gKi9cbi5wcm92aWRlcignJHVpYlRvb2x0aXAnLCBmdW5jdGlvbigpIHtcbiAgLy8gVGhlIGRlZmF1bHQgb3B0aW9ucyB0b29sdGlwIGFuZCBwb3BvdmVyLlxuICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgcGxhY2VtZW50OiAndG9wJyxcbiAgICBwbGFjZW1lbnRDbGFzc1ByZWZpeDogJycsXG4gICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgIHBvcHVwRGVsYXk6IDAsXG4gICAgcG9wdXBDbG9zZURlbGF5OiAwLFxuICAgIHVzZUNvbnRlbnRFeHA6IGZhbHNlXG4gIH07XG5cbiAgLy8gRGVmYXVsdCBoaWRlIHRyaWdnZXJzIGZvciBlYWNoIHNob3cgdHJpZ2dlclxuICB2YXIgdHJpZ2dlck1hcCA9IHtcbiAgICAnbW91c2VlbnRlcic6ICdtb3VzZWxlYXZlJyxcbiAgICAnY2xpY2snOiAnY2xpY2snLFxuICAgICdvdXRzaWRlQ2xpY2snOiAnb3V0c2lkZUNsaWNrJyxcbiAgICAnZm9jdXMnOiAnYmx1cicsXG4gICAgJ25vbmUnOiAnJ1xuICB9O1xuXG4gIC8vIFRoZSBvcHRpb25zIHNwZWNpZmllZCB0byB0aGUgcHJvdmlkZXIgZ2xvYmFsbHkuXG4gIHZhciBnbG9iYWxPcHRpb25zID0ge307XG5cbiAgLyoqXG4gICAqIGBvcHRpb25zKHt9KWAgYWxsb3dzIGdsb2JhbCBjb25maWd1cmF0aW9uIG9mIGFsbCB0b29sdGlwcyBpbiB0aGVcbiAgICogYXBwbGljYXRpb24uXG4gICAqXG4gICAqICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCAnQXBwJywgWyd1aS5ib290c3RyYXAudG9vbHRpcCddLCBmdW5jdGlvbiggJHRvb2x0aXBQcm92aWRlciApIHtcbiAgICogICAgIC8vIHBsYWNlIHRvb2x0aXBzIGxlZnQgaW5zdGVhZCBvZiB0b3AgYnkgZGVmYXVsdFxuICAgKiAgICAgJHRvb2x0aXBQcm92aWRlci5vcHRpb25zKCB7IHBsYWNlbWVudDogJ2xlZnQnIH0gKTtcbiAgICogICB9KTtcbiAgICovXG5cdHRoaXMub3B0aW9ucyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0YW5ndWxhci5leHRlbmQoZ2xvYmFsT3B0aW9ucywgdmFsdWUpO1xuXHR9O1xuXG4gIC8qKlxuICAgKiBUaGlzIGFsbG93cyB5b3UgdG8gZXh0ZW5kIHRoZSBzZXQgb2YgdHJpZ2dlciBtYXBwaW5ncyBhdmFpbGFibGUuIEUuZy46XG4gICAqXG4gICAqICAgJHRvb2x0aXBQcm92aWRlci5zZXRUcmlnZ2VycyggeyAnb3BlblRyaWdnZXInOiAnY2xvc2VUcmlnZ2VyJyB9ICk7XG4gICAqL1xuICB0aGlzLnNldFRyaWdnZXJzID0gZnVuY3Rpb24gc2V0VHJpZ2dlcnModHJpZ2dlcnMpIHtcbiAgICBhbmd1bGFyLmV4dGVuZCh0cmlnZ2VyTWFwLCB0cmlnZ2Vycyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYSBoZWxwZXIgZnVuY3Rpb24gZm9yIHRyYW5zbGF0aW5nIGNhbWVsLWNhc2UgdG8gc25ha2VfY2FzZS5cbiAgICovXG4gIGZ1bmN0aW9uIHNuYWtlX2Nhc2UobmFtZSkge1xuICAgIHZhciByZWdleHAgPSAvW0EtWl0vZztcbiAgICB2YXIgc2VwYXJhdG9yID0gJy0nO1xuICAgIHJldHVybiBuYW1lLnJlcGxhY2UocmVnZXhwLCBmdW5jdGlvbihsZXR0ZXIsIHBvcykge1xuICAgICAgcmV0dXJuIChwb3MgPyBzZXBhcmF0b3IgOiAnJykgKyBsZXR0ZXIudG9Mb3dlckNhc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhY3R1YWwgaW5zdGFuY2Ugb2YgdGhlICR0b29sdGlwIHNlcnZpY2UuXG4gICAqIFRPRE8gc3VwcG9ydCBtdWx0aXBsZSB0cmlnZ2Vyc1xuICAgKi9cbiAgdGhpcy4kZ2V0ID0gWyckd2luZG93JywgJyRjb21waWxlJywgJyR0aW1lb3V0JywgJyRkb2N1bWVudCcsICckdWliUG9zaXRpb24nLCAnJGludGVycG9sYXRlJywgJyRyb290U2NvcGUnLCAnJHBhcnNlJywgJyQkc3RhY2tlZE1hcCcsIGZ1bmN0aW9uKCR3aW5kb3csICRjb21waWxlLCAkdGltZW91dCwgJGRvY3VtZW50LCAkcG9zaXRpb24sICRpbnRlcnBvbGF0ZSwgJHJvb3RTY29wZSwgJHBhcnNlLCAkJHN0YWNrZWRNYXApIHtcbiAgICB2YXIgb3BlbmVkVG9vbHRpcHMgPSAkJHN0YWNrZWRNYXAuY3JlYXRlTmV3KCk7XG4gICAgJGRvY3VtZW50Lm9uKCdrZXl1cCcsIGtleXByZXNzTGlzdGVuZXIpO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAkZG9jdW1lbnQub2ZmKCdrZXl1cCcsIGtleXByZXNzTGlzdGVuZXIpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24ga2V5cHJlc3NMaXN0ZW5lcihlKSB7XG4gICAgICBpZiAoZS53aGljaCA9PT0gMjcpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBvcGVuZWRUb29sdGlwcy50b3AoKTtcbiAgICAgICAgaWYgKGxhc3QpIHtcbiAgICAgICAgICBsYXN0LnZhbHVlLmNsb3NlKCk7XG4gICAgICAgICAgbGFzdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gJHRvb2x0aXAodHRUeXBlLCBwcmVmaXgsIGRlZmF1bHRUcmlnZ2VyU2hvdywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgZ2xvYmFsT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJucyBhbiBvYmplY3Qgb2Ygc2hvdyBhbmQgaGlkZSB0cmlnZ2Vycy5cbiAgICAgICAqXG4gICAgICAgKiBJZiBhIHRyaWdnZXIgaXMgc3VwcGxpZWQsXG4gICAgICAgKiBpdCBpcyB1c2VkIHRvIHNob3cgdGhlIHRvb2x0aXA7IG90aGVyd2lzZSwgaXQgd2lsbCB1c2UgdGhlIGB0cmlnZ2VyYFxuICAgICAgICogb3B0aW9uIHBhc3NlZCB0byB0aGUgYCR0b29sdGlwUHJvdmlkZXIub3B0aW9uc2AgbWV0aG9kOyBlbHNlIGl0IHdpbGxcbiAgICAgICAqIGRlZmF1bHQgdG8gdGhlIHRyaWdnZXIgc3VwcGxpZWQgdG8gdGhpcyBkaXJlY3RpdmUgZmFjdG9yeS5cbiAgICAgICAqXG4gICAgICAgKiBUaGUgaGlkZSB0cmlnZ2VyIGlzIGJhc2VkIG9uIHRoZSBzaG93IHRyaWdnZXIuIElmIHRoZSBgdHJpZ2dlcmAgb3B0aW9uXG4gICAgICAgKiB3YXMgcGFzc2VkIHRvIHRoZSBgJHRvb2x0aXBQcm92aWRlci5vcHRpb25zYCBtZXRob2QsIGl0IHdpbGwgdXNlIHRoZVxuICAgICAgICogbWFwcGVkIHRyaWdnZXIgZnJvbSBgdHJpZ2dlck1hcGAgb3IgdGhlIHBhc3NlZCB0cmlnZ2VyIGlmIHRoZSBtYXAgaXNcbiAgICAgICAqIHVuZGVmaW5lZDsgb3RoZXJ3aXNlLCBpdCB1c2VzIHRoZSBgdHJpZ2dlck1hcGAgdmFsdWUgb2YgdGhlIHNob3dcbiAgICAgICAqIHRyaWdnZXI7IGVsc2UgaXQgd2lsbCBqdXN0IHVzZSB0aGUgc2hvdyB0cmlnZ2VyLlxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBnZXRUcmlnZ2Vycyh0cmlnZ2VyKSB7XG4gICAgICAgIHZhciBzaG93ID0gKHRyaWdnZXIgfHwgb3B0aW9ucy50cmlnZ2VyIHx8IGRlZmF1bHRUcmlnZ2VyU2hvdykuc3BsaXQoJyAnKTtcbiAgICAgICAgdmFyIGhpZGUgPSBzaG93Lm1hcChmdW5jdGlvbih0cmlnZ2VyKSB7XG4gICAgICAgICAgcmV0dXJuIHRyaWdnZXJNYXBbdHJpZ2dlcl0gfHwgdHJpZ2dlcjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc2hvdzogc2hvdyxcbiAgICAgICAgICBoaWRlOiBoaWRlXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHZhciBkaXJlY3RpdmVOYW1lID0gc25ha2VfY2FzZSh0dFR5cGUpO1xuXG4gICAgICB2YXIgc3RhcnRTeW0gPSAkaW50ZXJwb2xhdGUuc3RhcnRTeW1ib2woKTtcbiAgICAgIHZhciBlbmRTeW0gPSAkaW50ZXJwb2xhdGUuZW5kU3ltYm9sKCk7XG4gICAgICB2YXIgdGVtcGxhdGUgPVxuICAgICAgICAnPGRpdiAnKyBkaXJlY3RpdmVOYW1lICsgJy1wb3B1cCAnICtcbiAgICAgICAgICAndWliLXRpdGxlPVwiJyArIHN0YXJ0U3ltICsgJ3RpdGxlJyArIGVuZFN5bSArICdcIiAnICtcbiAgICAgICAgICAob3B0aW9ucy51c2VDb250ZW50RXhwID9cbiAgICAgICAgICAgICdjb250ZW50LWV4cD1cImNvbnRlbnRFeHAoKVwiICcgOlxuICAgICAgICAgICAgJ2NvbnRlbnQ9XCInICsgc3RhcnRTeW0gKyAnY29udGVudCcgKyBlbmRTeW0gKyAnXCIgJykgK1xuICAgICAgICAgICdvcmlnaW4tc2NvcGU9XCJvcmlnU2NvcGVcIiAnICtcbiAgICAgICAgICAnY2xhc3M9XCJ1aWItcG9zaXRpb24tbWVhc3VyZSAnICsgcHJlZml4ICsgJ1wiICcgK1xuICAgICAgICAgICd0b29sdGlwLWFuaW1hdGlvbi1jbGFzcz1cImZhZGVcIicgK1xuICAgICAgICAgICd1aWItdG9vbHRpcC1jbGFzc2VzICcgK1xuICAgICAgICAgICduZy1jbGFzcz1cInsgaW46IGlzT3BlbiB9XCIgJyArXG4gICAgICAgICAgJz4nICtcbiAgICAgICAgJzwvZGl2Pic7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uKHRFbGVtLCB0QXR0cnMpIHtcbiAgICAgICAgICB2YXIgdG9vbHRpcExpbmtlciA9ICRjb21waWxlKHRlbXBsYXRlKTtcblxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycywgdG9vbHRpcEN0cmwpIHtcbiAgICAgICAgICAgIHZhciB0b29sdGlwO1xuICAgICAgICAgICAgdmFyIHRvb2x0aXBMaW5rZWRTY29wZTtcbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uVGltZW91dDtcbiAgICAgICAgICAgIHZhciBzaG93VGltZW91dDtcbiAgICAgICAgICAgIHZhciBoaWRlVGltZW91dDtcbiAgICAgICAgICAgIHZhciBwb3NpdGlvblRpbWVvdXQ7XG4gICAgICAgICAgICB2YXIgYWRqdXN0bWVudFRpbWVvdXQ7XG4gICAgICAgICAgICB2YXIgYXBwZW5kVG9Cb2R5ID0gYW5ndWxhci5pc0RlZmluZWQob3B0aW9ucy5hcHBlbmRUb0JvZHkpID8gb3B0aW9ucy5hcHBlbmRUb0JvZHkgOiBmYWxzZTtcbiAgICAgICAgICAgIHZhciB0cmlnZ2VycyA9IGdldFRyaWdnZXJzKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB2YXIgaGFzRW5hYmxlRXhwID0gYW5ndWxhci5pc0RlZmluZWQoYXR0cnNbcHJlZml4ICsgJ0VuYWJsZSddKTtcbiAgICAgICAgICAgIHZhciB0dFNjb3BlID0gc2NvcGUuJG5ldyh0cnVlKTtcbiAgICAgICAgICAgIHZhciByZXBvc2l0aW9uU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgaXNPcGVuUGFyc2UgPSBhbmd1bGFyLmlzRGVmaW5lZChhdHRyc1twcmVmaXggKyAnSXNPcGVuJ10pID8gJHBhcnNlKGF0dHJzW3ByZWZpeCArICdJc09wZW4nXSkgOiBmYWxzZTtcbiAgICAgICAgICAgIHZhciBjb250ZW50UGFyc2UgPSBvcHRpb25zLnVzZUNvbnRlbnRFeHAgPyAkcGFyc2UoYXR0cnNbdHRUeXBlXSkgOiBmYWxzZTtcbiAgICAgICAgICAgIHZhciBvYnNlcnZlcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBsYXN0UGxhY2VtZW50O1xuXG4gICAgICAgICAgICB2YXIgcG9zaXRpb25Ub29sdGlwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRvb2x0aXAgZXhpc3RzIGFuZCBpcyBub3QgZW1wdHlcbiAgICAgICAgICAgICAgaWYgKCF0b29sdGlwIHx8ICF0b29sdGlwLmh0bWwoKSkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgICBpZiAoIXBvc2l0aW9uVGltZW91dCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uVGltZW91dCA9ICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgdmFyIHR0UG9zaXRpb24gPSAkcG9zaXRpb24ucG9zaXRpb25FbGVtZW50cyhlbGVtZW50LCB0b29sdGlwLCB0dFNjb3BlLnBsYWNlbWVudCwgYXBwZW5kVG9Cb2R5KTtcbiAgICAgICAgICAgICAgICAgIHZhciBpbml0aWFsSGVpZ2h0ID0gYW5ndWxhci5pc0RlZmluZWQodG9vbHRpcC5vZmZzZXRIZWlnaHQpID8gdG9vbHRpcC5vZmZzZXRIZWlnaHQgOiB0b29sdGlwLnByb3AoJ29mZnNldEhlaWdodCcpO1xuICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRQb3MgPSBhcHBlbmRUb0JvZHkgPyAkcG9zaXRpb24ub2Zmc2V0KGVsZW1lbnQpIDogJHBvc2l0aW9uLnBvc2l0aW9uKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgdG9vbHRpcC5jc3MoeyB0b3A6IHR0UG9zaXRpb24udG9wICsgJ3B4JywgbGVmdDogdHRQb3NpdGlvbi5sZWZ0ICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgIHZhciBwbGFjZW1lbnRDbGFzc2VzID0gdHRQb3NpdGlvbi5wbGFjZW1lbnQuc3BsaXQoJy0nKTtcblxuICAgICAgICAgICAgICAgICAgaWYgKCF0b29sdGlwLmhhc0NsYXNzKHBsYWNlbWVudENsYXNzZXNbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXAucmVtb3ZlQ2xhc3MobGFzdFBsYWNlbWVudC5zcGxpdCgnLScpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcC5hZGRDbGFzcyhwbGFjZW1lbnRDbGFzc2VzWzBdKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKCF0b29sdGlwLmhhc0NsYXNzKG9wdGlvbnMucGxhY2VtZW50Q2xhc3NQcmVmaXggKyB0dFBvc2l0aW9uLnBsYWNlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcC5yZW1vdmVDbGFzcyhvcHRpb25zLnBsYWNlbWVudENsYXNzUHJlZml4ICsgbGFzdFBsYWNlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXAuYWRkQ2xhc3Mob3B0aW9ucy5wbGFjZW1lbnRDbGFzc1ByZWZpeCArIHR0UG9zaXRpb24ucGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgYWRqdXN0bWVudFRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRIZWlnaHQgPSBhbmd1bGFyLmlzRGVmaW5lZCh0b29sdGlwLm9mZnNldEhlaWdodCkgPyB0b29sdGlwLm9mZnNldEhlaWdodCA6IHRvb2x0aXAucHJvcCgnb2Zmc2V0SGVpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhZGp1c3RtZW50ID0gJHBvc2l0aW9uLmFkanVzdFRvcChwbGFjZW1lbnRDbGFzc2VzLCBlbGVtZW50UG9zLCBpbml0aWFsSGVpZ2h0LCBjdXJyZW50SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFkanVzdG1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwLmNzcyhhZGp1c3RtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhZGp1c3RtZW50VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9LCAwLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIGZpcnN0IHRpbWUgdGhyb3VnaCB0dCBlbGVtZW50IHdpbGwgaGF2ZSB0aGVcbiAgICAgICAgICAgICAgICAgIC8vIHVpYi1wb3NpdGlvbi1tZWFzdXJlIGNsYXNzIG9yIGlmIHRoZSBwbGFjZW1lbnRcbiAgICAgICAgICAgICAgICAgIC8vIGhhcyBjaGFuZ2VkIHdlIG5lZWQgdG8gcG9zaXRpb24gdGhlIGFycm93LlxuICAgICAgICAgICAgICAgICAgaWYgKHRvb2x0aXAuaGFzQ2xhc3MoJ3VpYi1wb3NpdGlvbi1tZWFzdXJlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgJHBvc2l0aW9uLnBvc2l0aW9uQXJyb3codG9vbHRpcCwgdHRQb3NpdGlvbi5wbGFjZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwLnJlbW92ZUNsYXNzKCd1aWItcG9zaXRpb24tbWVhc3VyZScpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0UGxhY2VtZW50ICE9PSB0dFBvc2l0aW9uLnBsYWNlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAkcG9zaXRpb24ucG9zaXRpb25BcnJvdyh0b29sdGlwLCB0dFBvc2l0aW9uLnBsYWNlbWVudCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBsYXN0UGxhY2VtZW50ID0gdHRQb3NpdGlvbi5wbGFjZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uVGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSwgMCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBTZXQgdXAgdGhlIGNvcnJlY3Qgc2NvcGUgdG8gYWxsb3cgdHJhbnNjbHVzaW9uIGxhdGVyXG4gICAgICAgICAgICB0dFNjb3BlLm9yaWdTY29wZSA9IHNjb3BlO1xuXG4gICAgICAgICAgICAvLyBCeSBkZWZhdWx0LCB0aGUgdG9vbHRpcCBpcyBub3Qgb3Blbi5cbiAgICAgICAgICAgIC8vIFRPRE8gYWRkIGFiaWxpdHkgdG8gc3RhcnQgdG9vbHRpcCBvcGVuZWRcbiAgICAgICAgICAgIHR0U2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRvZ2dsZVRvb2x0aXBCaW5kKCkge1xuICAgICAgICAgICAgICBpZiAoIXR0U2NvcGUuaXNPcGVuKSB7XG4gICAgICAgICAgICAgICAgc2hvd1Rvb2x0aXBCaW5kKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGlkZVRvb2x0aXBCaW5kKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2hvdyB0aGUgdG9vbHRpcCB3aXRoIGRlbGF5IGlmIHNwZWNpZmllZCwgb3RoZXJ3aXNlIHNob3cgaXQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGZ1bmN0aW9uIHNob3dUb29sdGlwQmluZCgpIHtcbiAgICAgICAgICAgICAgaWYgKGhhc0VuYWJsZUV4cCAmJiAhc2NvcGUuJGV2YWwoYXR0cnNbcHJlZml4ICsgJ0VuYWJsZSddKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNhbmNlbEhpZGUoKTtcbiAgICAgICAgICAgICAgcHJlcGFyZVRvb2x0aXAoKTtcblxuICAgICAgICAgICAgICBpZiAodHRTY29wZS5wb3B1cERlbGF5KSB7XG4gICAgICAgICAgICAgICAgLy8gRG8gbm90aGluZyBpZiB0aGUgdG9vbHRpcCB3YXMgYWxyZWFkeSBzY2hlZHVsZWQgdG8gcG9wLXVwLlxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaGFwcGVucyBpZiBzaG93IGlzIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcyBiZWZvcmUgYW55IGhpZGUgaXMgdHJpZ2dlcmVkLlxuICAgICAgICAgICAgICAgIGlmICghc2hvd1RpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgIHNob3dUaW1lb3V0ID0gJHRpbWVvdXQoc2hvdywgdHRTY29wZS5wb3B1cERlbGF5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNob3coKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoaWRlVG9vbHRpcEJpbmQoKSB7XG4gICAgICAgICAgICAgIGNhbmNlbFNob3coKTtcblxuICAgICAgICAgICAgICBpZiAodHRTY29wZS5wb3B1cENsb3NlRGVsYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhpZGVUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICBoaWRlVGltZW91dCA9ICR0aW1lb3V0KGhpZGUsIHR0U2NvcGUucG9wdXBDbG9zZURlbGF5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhpZGUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTaG93IHRoZSB0b29sdGlwIHBvcHVwIGVsZW1lbnQuXG4gICAgICAgICAgICBmdW5jdGlvbiBzaG93KCkge1xuICAgICAgICAgICAgICBjYW5jZWxTaG93KCk7XG4gICAgICAgICAgICAgIGNhbmNlbEhpZGUoKTtcblxuICAgICAgICAgICAgICAvLyBEb24ndCBzaG93IGVtcHR5IHRvb2x0aXBzLlxuICAgICAgICAgICAgICBpZiAoIXR0U2NvcGUuY29udGVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLm5vb3A7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjcmVhdGVUb29sdGlwKCk7XG5cbiAgICAgICAgICAgICAgLy8gQW5kIHNob3cgdGhlIHRvb2x0aXAuXG4gICAgICAgICAgICAgIHR0U2NvcGUuJGV2YWxBc3luYyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0dFNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgYXNzaWduSXNPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uVG9vbHRpcCgpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2FuY2VsU2hvdygpIHtcbiAgICAgICAgICAgICAgaWYgKHNob3dUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKHNob3dUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICBzaG93VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAocG9zaXRpb25UaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKHBvc2l0aW9uVGltZW91dCk7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25UaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBIaWRlIHRoZSB0b29sdGlwIHBvcHVwIGVsZW1lbnQuXG4gICAgICAgICAgICBmdW5jdGlvbiBoaWRlKCkge1xuICAgICAgICAgICAgICBpZiAoIXR0U2NvcGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBGaXJzdCB0aGluZ3MgZmlyc3Q6IHdlIGRvbid0IHNob3cgaXQgYW55bW9yZS5cbiAgICAgICAgICAgICAgdHRTY29wZS4kZXZhbEFzeW5jKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0dFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICB0dFNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgYXNzaWduSXNPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgIC8vIEFuZCBub3cgd2UgcmVtb3ZlIGl0IGZyb20gdGhlIERPTS4gSG93ZXZlciwgaWYgd2UgaGF2ZSBhbmltYXRpb24sIHdlXG4gICAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIHdhaXQgZm9yIGl0IHRvIGV4cGlyZSBiZWZvcmVoYW5kLlxuICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBwb3J0IG9mIHRoZSB0cmFuc2l0aW9ucyBsaWJyYXJ5LlxuICAgICAgICAgICAgICAgICAgLy8gVGhlIGZhZGUgdHJhbnNpdGlvbiBpbiBUV0JTIGlzIDE1MG1zLlxuICAgICAgICAgICAgICAgICAgaWYgKHR0U2NvcGUuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhbnNpdGlvblRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uVGltZW91dCA9ICR0aW1lb3V0KHJlbW92ZVRvb2x0aXAsIDE1MCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVUb29sdGlwKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2FuY2VsSGlkZSgpIHtcbiAgICAgICAgICAgICAgaWYgKGhpZGVUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKGhpZGVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICBoaWRlVGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodHJhbnNpdGlvblRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodHJhbnNpdGlvblRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25UaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVUb29sdGlwKCkge1xuICAgICAgICAgICAgICAvLyBUaGVyZSBjYW4gb25seSBiZSBvbmUgdG9vbHRpcCBlbGVtZW50IHBlciBkaXJlY3RpdmUgc2hvd24gYXQgb25jZS5cbiAgICAgICAgICAgICAgaWYgKHRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0b29sdGlwTGlua2VkU2NvcGUgPSB0dFNjb3BlLiRuZXcoKTtcbiAgICAgICAgICAgICAgdG9vbHRpcCA9IHRvb2x0aXBMaW5rZXIodG9vbHRpcExpbmtlZFNjb3BlLCBmdW5jdGlvbih0b29sdGlwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFwcGVuZFRvQm9keSkge1xuICAgICAgICAgICAgICAgICAgJGRvY3VtZW50LmZpbmQoJ2JvZHknKS5hcHBlbmQodG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWZ0ZXIodG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICBvcGVuZWRUb29sdGlwcy5hZGQodHRTY29wZSwge1xuICAgICAgICAgICAgICAgIGNsb3NlOiBoaWRlXG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHByZXBPYnNlcnZlcnMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlVG9vbHRpcCgpIHtcbiAgICAgICAgICAgICAgY2FuY2VsU2hvdygpO1xuICAgICAgICAgICAgICBjYW5jZWxIaWRlKCk7XG4gICAgICAgICAgICAgIHVucmVnaXN0ZXJPYnNlcnZlcnMoKTtcblxuICAgICAgICAgICAgICBpZiAodG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRvb2x0aXAucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdG9vbHRpcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGFkanVzdG1lbnRUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAkdGltZW91dC5jYW5jZWwoYWRqdXN0bWVudFRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG9wZW5lZFRvb2x0aXBzLnJlbW92ZSh0dFNjb3BlKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmICh0b29sdGlwTGlua2VkU2NvcGUpIHtcbiAgICAgICAgICAgICAgICB0b29sdGlwTGlua2VkU2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0b29sdGlwTGlua2VkU2NvcGUgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0IHRoZSBpbml0aWFsIHNjb3BlIHZhbHVlcy4gT25jZVxuICAgICAgICAgICAgICogdGhlIHRvb2x0aXAgaXMgY3JlYXRlZCwgdGhlIG9ic2VydmVyc1xuICAgICAgICAgICAgICogd2lsbCBiZSBhZGRlZCB0byBrZWVwIHRoaW5ncyBpbiBzeW5jLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBwcmVwYXJlVG9vbHRpcCgpIHtcbiAgICAgICAgICAgICAgdHRTY29wZS50aXRsZSA9IGF0dHJzW3ByZWZpeCArICdUaXRsZSddO1xuICAgICAgICAgICAgICBpZiAoY29udGVudFBhcnNlKSB7XG4gICAgICAgICAgICAgICAgdHRTY29wZS5jb250ZW50ID0gY29udGVudFBhcnNlKHNjb3BlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0dFNjb3BlLmNvbnRlbnQgPSBhdHRyc1t0dFR5cGVdO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdHRTY29wZS5wb3B1cENsYXNzID0gYXR0cnNbcHJlZml4ICsgJ0NsYXNzJ107XG4gICAgICAgICAgICAgIHR0U2NvcGUucGxhY2VtZW50ID0gYW5ndWxhci5pc0RlZmluZWQoYXR0cnNbcHJlZml4ICsgJ1BsYWNlbWVudCddKSA/IGF0dHJzW3ByZWZpeCArICdQbGFjZW1lbnQnXSA6IG9wdGlvbnMucGxhY2VtZW50O1xuICAgICAgICAgICAgICB2YXIgcGxhY2VtZW50ID0gJHBvc2l0aW9uLnBhcnNlUGxhY2VtZW50KHR0U2NvcGUucGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgbGFzdFBsYWNlbWVudCA9IHBsYWNlbWVudFsxXSA/IHBsYWNlbWVudFswXSArICctJyArIHBsYWNlbWVudFsxXSA6IHBsYWNlbWVudFswXTtcblxuICAgICAgICAgICAgICB2YXIgZGVsYXkgPSBwYXJzZUludChhdHRyc1twcmVmaXggKyAnUG9wdXBEZWxheSddLCAxMCk7XG4gICAgICAgICAgICAgIHZhciBjbG9zZURlbGF5ID0gcGFyc2VJbnQoYXR0cnNbcHJlZml4ICsgJ1BvcHVwQ2xvc2VEZWxheSddLCAxMCk7XG4gICAgICAgICAgICAgIHR0U2NvcGUucG9wdXBEZWxheSA9ICFpc05hTihkZWxheSkgPyBkZWxheSA6IG9wdGlvbnMucG9wdXBEZWxheTtcbiAgICAgICAgICAgICAgdHRTY29wZS5wb3B1cENsb3NlRGVsYXkgPSAhaXNOYU4oY2xvc2VEZWxheSkgPyBjbG9zZURlbGF5IDogb3B0aW9ucy5wb3B1cENsb3NlRGVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFzc2lnbklzT3Blbihpc09wZW4pIHtcbiAgICAgICAgICAgICAgaWYgKGlzT3BlblBhcnNlICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihpc09wZW5QYXJzZS5hc3NpZ24pKSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuUGFyc2UuYXNzaWduKHNjb3BlLCBpc09wZW4pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHR0U2NvcGUuY29udGVudEV4cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gdHRTY29wZS5jb250ZW50O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBPYnNlcnZlIHRoZSByZWxldmFudCBhdHRyaWJ1dGVzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhdHRycy4kb2JzZXJ2ZSgnZGlzYWJsZWQnLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgIGNhbmNlbFNob3coKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh2YWwgJiYgdHRTY29wZS5pc09wZW4pIHtcbiAgICAgICAgICAgICAgICBoaWRlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoaXNPcGVuUGFyc2UpIHtcbiAgICAgICAgICAgICAgc2NvcGUuJHdhdGNoKGlzT3BlblBhcnNlLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodHRTY29wZSAmJiAhdmFsID09PSB0dFNjb3BlLmlzT3Blbikge1xuICAgICAgICAgICAgICAgICAgdG9nZ2xlVG9vbHRpcEJpbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwcmVwT2JzZXJ2ZXJzKCkge1xuICAgICAgICAgICAgICBvYnNlcnZlcnMubGVuZ3RoID0gMDtcblxuICAgICAgICAgICAgICBpZiAoY29udGVudFBhcnNlKSB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXJzLnB1c2goXG4gICAgICAgICAgICAgICAgICBzY29wZS4kd2F0Y2goY29udGVudFBhcnNlLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdHRTY29wZS5jb250ZW50ID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbCAmJiB0dFNjb3BlLmlzT3Blbikge1xuICAgICAgICAgICAgICAgICAgICAgIGhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXJzLnB1c2goXG4gICAgICAgICAgICAgICAgICB0b29sdGlwTGlua2VkU2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcG9zaXRpb25TY2hlZHVsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXBvc2l0aW9uU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwTGlua2VkU2NvcGUuJCRwb3N0RGlnZXN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3NpdGlvblNjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR0U2NvcGUgJiYgdHRTY29wZS5pc09wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25Ub29sdGlwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYnNlcnZlcnMucHVzaChcbiAgICAgICAgICAgICAgICAgIGF0dHJzLiRvYnNlcnZlKHR0VHlwZSwgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHR0U2NvcGUuY29udGVudCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWwgJiYgdHRTY29wZS5pc09wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICBoaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25Ub29sdGlwKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG9ic2VydmVycy5wdXNoKFxuICAgICAgICAgICAgICAgIGF0dHJzLiRvYnNlcnZlKHByZWZpeCArICdUaXRsZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgICAgICAgdHRTY29wZS50aXRsZSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgIGlmICh0dFNjb3BlLmlzT3Blbikge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvblRvb2x0aXAoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIG9ic2VydmVycy5wdXNoKFxuICAgICAgICAgICAgICAgIGF0dHJzLiRvYnNlcnZlKHByZWZpeCArICdQbGFjZW1lbnQnLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgICAgIHR0U2NvcGUucGxhY2VtZW50ID0gdmFsID8gdmFsIDogb3B0aW9ucy5wbGFjZW1lbnQ7XG4gICAgICAgICAgICAgICAgICBpZiAodHRTY29wZS5pc09wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25Ub29sdGlwKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdW5yZWdpc3Rlck9ic2VydmVycygpIHtcbiAgICAgICAgICAgICAgaWYgKG9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2gob2JzZXJ2ZXJzLCBmdW5jdGlvbihvYnNlcnZlcikge1xuICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBvYnNlcnZlcnMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBoaWRlIHRvb2x0aXBzL3BvcG92ZXJzIGZvciBvdXRzaWRlQ2xpY2sgdHJpZ2dlclxuICAgICAgICAgICAgZnVuY3Rpb24gYm9keUhpZGVUb29sdGlwQmluZChlKSB7XG4gICAgICAgICAgICAgIGlmICghdHRTY29wZSB8fCAhdHRTY29wZS5pc09wZW4gfHwgIXRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSB0b29sdGlwL3BvcG92ZXIgbGluayBvciB0b29sIHRvb2x0aXAvcG9wb3ZlciBpdHNlbGYgd2VyZSBub3QgY2xpY2tlZFxuICAgICAgICAgICAgICBpZiAoIWVsZW1lbnRbMF0uY29udGFpbnMoZS50YXJnZXQpICYmICF0b29sdGlwWzBdLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIGhpZGVUb29sdGlwQmluZCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEtleWJvYXJkRXZlbnQgaGFuZGxlciB0byBoaWRlIHRoZSB0b29sdGlwIG9uIEVzY2FwZSBrZXkgcHJlc3NcbiAgICAgICAgICAgIGZ1bmN0aW9uIGhpZGVPbkVzY2FwZUtleShlKSB7XG4gICAgICAgICAgICAgIGlmIChlLndoaWNoID09PSAyNykge1xuICAgICAgICAgICAgICAgIGhpZGVUb29sdGlwQmluZCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB1bnJlZ2lzdGVyVHJpZ2dlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdHJpZ2dlcnMuc2hvdy5mb3JFYWNoKGZ1bmN0aW9uKHRyaWdnZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAodHJpZ2dlciA9PT0gJ291dHNpZGVDbGljaycpIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQub2ZmKCdjbGljaycsIHRvZ2dsZVRvb2x0aXBCaW5kKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5vZmYodHJpZ2dlciwgc2hvd1Rvb2x0aXBCaW5kKTtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQub2ZmKHRyaWdnZXIsIHRvZ2dsZVRvb2x0aXBCaW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxlbWVudC5vZmYoJ2tleXByZXNzJywgaGlkZU9uRXNjYXBlS2V5KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHRyaWdnZXJzLmhpZGUuZm9yRWFjaChmdW5jdGlvbih0cmlnZ2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRyaWdnZXIgPT09ICdvdXRzaWRlQ2xpY2snKSB7XG4gICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub2ZmKCdjbGljaycsIGJvZHlIaWRlVG9vbHRpcEJpbmQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50Lm9mZih0cmlnZ2VyLCBoaWRlVG9vbHRpcEJpbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBwcmVwVHJpZ2dlcnMoKSB7XG4gICAgICAgICAgICAgIHZhciBzaG93VHJpZ2dlcnMgPSBbXSwgaGlkZVRyaWdnZXJzID0gW107XG4gICAgICAgICAgICAgIHZhciB2YWwgPSBzY29wZS4kZXZhbChhdHRyc1twcmVmaXggKyAnVHJpZ2dlciddKTtcbiAgICAgICAgICAgICAgdW5yZWdpc3RlclRyaWdnZXJzKCk7XG5cbiAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNPYmplY3QodmFsKSkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHZhbCkuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICAgIHNob3dUcmlnZ2Vycy5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgICBoaWRlVHJpZ2dlcnMucHVzaCh2YWxba2V5XSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdHJpZ2dlcnMgPSB7XG4gICAgICAgICAgICAgICAgICBzaG93OiBzaG93VHJpZ2dlcnMsXG4gICAgICAgICAgICAgICAgICBoaWRlOiBoaWRlVHJpZ2dlcnNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyaWdnZXJzID0gZ2V0VHJpZ2dlcnModmFsKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0cmlnZ2Vycy5zaG93ICE9PSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICB0cmlnZ2Vycy5zaG93LmZvckVhY2goZnVuY3Rpb24odHJpZ2dlciwgaWR4KSB7XG4gICAgICAgICAgICAgICAgICBpZiAodHJpZ2dlciA9PT0gJ291dHNpZGVDbGljaycpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5vbignY2xpY2snLCB0b2dnbGVUb29sdGlwQmluZCk7XG4gICAgICAgICAgICAgICAgICAgICRkb2N1bWVudC5vbignY2xpY2snLCBib2R5SGlkZVRvb2x0aXBCaW5kKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHJpZ2dlciA9PT0gdHJpZ2dlcnMuaGlkZVtpZHhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQub24odHJpZ2dlciwgdG9nZ2xlVG9vbHRpcEJpbmQpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0cmlnZ2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQub24odHJpZ2dlciwgc2hvd1Rvb2x0aXBCaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5vbih0cmlnZ2Vycy5oaWRlW2lkeF0sIGhpZGVUb29sdGlwQmluZCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBlbGVtZW50Lm9uKCdrZXlwcmVzcycsIGhpZGVPbkVzY2FwZUtleSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJlcFRyaWdnZXJzKCk7XG5cbiAgICAgICAgICAgIHZhciBhbmltYXRpb24gPSBzY29wZS4kZXZhbChhdHRyc1twcmVmaXggKyAnQW5pbWF0aW9uJ10pO1xuICAgICAgICAgICAgdHRTY29wZS5hbmltYXRpb24gPSBhbmd1bGFyLmlzRGVmaW5lZChhbmltYXRpb24pID8gISFhbmltYXRpb24gOiBvcHRpb25zLmFuaW1hdGlvbjtcblxuICAgICAgICAgICAgdmFyIGFwcGVuZFRvQm9keVZhbDtcbiAgICAgICAgICAgIHZhciBhcHBlbmRLZXkgPSBwcmVmaXggKyAnQXBwZW5kVG9Cb2R5JztcbiAgICAgICAgICAgIGlmIChhcHBlbmRLZXkgaW4gYXR0cnMgJiYgYXR0cnNbYXBwZW5kS2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGFwcGVuZFRvQm9keVZhbCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcHBlbmRUb0JvZHlWYWwgPSBzY29wZS4kZXZhbChhdHRyc1thcHBlbmRLZXldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXBwZW5kVG9Cb2R5ID0gYW5ndWxhci5pc0RlZmluZWQoYXBwZW5kVG9Cb2R5VmFsKSA/IGFwcGVuZFRvQm9keVZhbCA6IGFwcGVuZFRvQm9keTtcblxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRvb2x0aXAgaXMgZGVzdHJveWVkIGFuZCByZW1vdmVkLlxuICAgICAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uIG9uRGVzdHJveVRvb2x0aXAoKSB7XG4gICAgICAgICAgICAgIHVucmVnaXN0ZXJUcmlnZ2VycygpO1xuICAgICAgICAgICAgICByZW1vdmVUb29sdGlwKCk7XG4gICAgICAgICAgICAgIHR0U2NvcGUgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9O1xuICB9XTtcbn0pXG5cbi8vIFRoaXMgaXMgbW9zdGx5IG5nSW5jbHVkZSBjb2RlIGJ1dCB3aXRoIGEgY3VzdG9tIHNjb3BlXG4uZGlyZWN0aXZlKCd1aWJUb29sdGlwVGVtcGxhdGVUcmFuc2NsdWRlJywgW1xuICAgICAgICAgJyRhbmltYXRlJywgJyRzY2UnLCAnJGNvbXBpbGUnLCAnJHRlbXBsYXRlUmVxdWVzdCcsXG5mdW5jdGlvbiAoJGFuaW1hdGUsICRzY2UsICRjb21waWxlLCAkdGVtcGxhdGVSZXF1ZXN0KSB7XG4gIHJldHVybiB7XG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHJzKSB7XG4gICAgICB2YXIgb3JpZ1Njb3BlID0gc2NvcGUuJGV2YWwoYXR0cnMudG9vbHRpcFRlbXBsYXRlVHJhbnNjbHVkZVNjb3BlKTtcblxuICAgICAgdmFyIGNoYW5nZUNvdW50ZXIgPSAwLFxuICAgICAgICBjdXJyZW50U2NvcGUsXG4gICAgICAgIHByZXZpb3VzRWxlbWVudCxcbiAgICAgICAgY3VycmVudEVsZW1lbnQ7XG5cbiAgICAgIHZhciBjbGVhbnVwTGFzdEluY2x1ZGVDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChwcmV2aW91c0VsZW1lbnQpIHtcbiAgICAgICAgICBwcmV2aW91c0VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgcHJldmlvdXNFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjdXJyZW50U2NvcGUpIHtcbiAgICAgICAgICBjdXJyZW50U2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICBjdXJyZW50U2NvcGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGN1cnJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgJGFuaW1hdGUubGVhdmUoY3VycmVudEVsZW1lbnQpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwcmV2aW91c0VsZW1lbnQgPSBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHByZXZpb3VzRWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuICAgICAgICAgIGN1cnJlbnRFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NvcGUuJHdhdGNoKCRzY2UucGFyc2VBc1Jlc291cmNlVXJsKGF0dHJzLnVpYlRvb2x0aXBUZW1wbGF0ZVRyYW5zY2x1ZGUpLCBmdW5jdGlvbihzcmMpIHtcbiAgICAgICAgdmFyIHRoaXNDaGFuZ2VJZCA9ICsrY2hhbmdlQ291bnRlcjtcblxuICAgICAgICBpZiAoc3JjKSB7XG4gICAgICAgICAgLy9zZXQgdGhlIDJuZCBwYXJhbSB0byB0cnVlIHRvIGlnbm9yZSB0aGUgdGVtcGxhdGUgcmVxdWVzdCBlcnJvciBzbyB0aGF0IHRoZSBpbm5lclxuICAgICAgICAgIC8vY29udGVudHMgYW5kIHNjb3BlIGNhbiBiZSBjbGVhbmVkIHVwLlxuICAgICAgICAgICR0ZW1wbGF0ZVJlcXVlc3Qoc3JjLCB0cnVlKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAodGhpc0NoYW5nZUlkICE9PSBjaGFuZ2VDb3VudGVyKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgdmFyIG5ld1Njb3BlID0gb3JpZ1Njb3BlLiRuZXcoKTtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHJlc3BvbnNlO1xuXG4gICAgICAgICAgICB2YXIgY2xvbmUgPSAkY29tcGlsZSh0ZW1wbGF0ZSkobmV3U2NvcGUsIGZ1bmN0aW9uKGNsb25lKSB7XG4gICAgICAgICAgICAgIGNsZWFudXBMYXN0SW5jbHVkZUNvbnRlbnQoKTtcbiAgICAgICAgICAgICAgJGFuaW1hdGUuZW50ZXIoY2xvbmUsIGVsZW0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGN1cnJlbnRTY29wZSA9IG5ld1Njb3BlO1xuICAgICAgICAgICAgY3VycmVudEVsZW1lbnQgPSBjbG9uZTtcblxuICAgICAgICAgICAgY3VycmVudFNjb3BlLiRlbWl0KCckaW5jbHVkZUNvbnRlbnRMb2FkZWQnLCBzcmMpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXNDaGFuZ2VJZCA9PT0gY2hhbmdlQ291bnRlcikge1xuICAgICAgICAgICAgICBjbGVhbnVwTGFzdEluY2x1ZGVDb250ZW50KCk7XG4gICAgICAgICAgICAgIHNjb3BlLiRlbWl0KCckaW5jbHVkZUNvbnRlbnRFcnJvcicsIHNyYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2NvcGUuJGVtaXQoJyRpbmNsdWRlQ29udGVudFJlcXVlc3RlZCcsIHNyYyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xlYW51cExhc3RJbmNsdWRlQ29udGVudCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGNsZWFudXBMYXN0SW5jbHVkZUNvbnRlbnQpO1xuICAgIH1cbiAgfTtcbn1dKVxuXG4vKipcbiAqIE5vdGUgdGhhdCBpdCdzIGludGVudGlvbmFsIHRoYXQgdGhlc2UgY2xhc3NlcyBhcmUgKm5vdCogYXBwbGllZCB0aHJvdWdoICRhbmltYXRlLlxuICogVGhleSBtdXN0IG5vdCBiZSBhbmltYXRlZCBhcyB0aGV5J3JlIGV4cGVjdGVkIHRvIGJlIHByZXNlbnQgb24gdGhlIHRvb2x0aXAgb25cbiAqIGluaXRpYWxpemF0aW9uLlxuICovXG4uZGlyZWN0aXZlKCd1aWJUb29sdGlwQ2xhc3NlcycsIFsnJHVpYlBvc2l0aW9uJywgZnVuY3Rpb24oJHVpYlBvc2l0aW9uKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIC8vIG5lZWQgdG8gc2V0IHRoZSBwcmltYXJ5IHBvc2l0aW9uIHNvIHRoZVxuICAgICAgLy8gYXJyb3cgaGFzIHNwYWNlIGR1cmluZyBwb3NpdGlvbiBtZWFzdXJlLlxuICAgICAgLy8gdG9vbHRpcC5wb3NpdGlvblRvb2x0aXAoKVxuICAgICAgaWYgKHNjb3BlLnBsYWNlbWVudCkge1xuICAgICAgICAvLyAvLyBUaGVyZSBhcmUgbm8gdG9wLWxlZnQgZXRjLi4uIGNsYXNzZXNcbiAgICAgICAgLy8gLy8gaW4gVFdCUywgc28gd2UgbmVlZCB0aGUgcHJpbWFyeSBwb3NpdGlvbi5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gJHVpYlBvc2l0aW9uLnBhcnNlUGxhY2VtZW50KHNjb3BlLnBsYWNlbWVudCk7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MocG9zaXRpb25bMF0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2NvcGUucG9wdXBDbGFzcykge1xuICAgICAgICBlbGVtZW50LmFkZENsYXNzKHNjb3BlLnBvcHVwQ2xhc3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2NvcGUuYW5pbWF0aW9uKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoYXR0cnMudG9vbHRpcEFuaW1hdGlvbkNsYXNzKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XSlcblxuLmRpcmVjdGl2ZSgndWliVG9vbHRpcFBvcHVwJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBzY29wZTogeyBjb250ZW50OiAnQCcgfSxcbiAgICB0ZW1wbGF0ZVVybDogJ3VpYi90ZW1wbGF0ZS90b29sdGlwL3Rvb2x0aXAtcG9wdXAuaHRtbCdcbiAgfTtcbn0pXG5cbi5kaXJlY3RpdmUoJ3VpYlRvb2x0aXAnLCBbICckdWliVG9vbHRpcCcsIGZ1bmN0aW9uKCR1aWJUb29sdGlwKSB7XG4gIHJldHVybiAkdWliVG9vbHRpcCgndWliVG9vbHRpcCcsICd0b29sdGlwJywgJ21vdXNlZW50ZXInKTtcbn1dKVxuXG4uZGlyZWN0aXZlKCd1aWJUb29sdGlwVGVtcGxhdGVQb3B1cCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgc2NvcGU6IHsgY29udGVudEV4cDogJyYnLCBvcmlnaW5TY29wZTogJyYnIH0sXG4gICAgdGVtcGxhdGVVcmw6ICd1aWIvdGVtcGxhdGUvdG9vbHRpcC90b29sdGlwLXRlbXBsYXRlLXBvcHVwLmh0bWwnXG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJUb29sdGlwVGVtcGxhdGUnLCBbJyR1aWJUb29sdGlwJywgZnVuY3Rpb24oJHVpYlRvb2x0aXApIHtcbiAgcmV0dXJuICR1aWJUb29sdGlwKCd1aWJUb29sdGlwVGVtcGxhdGUnLCAndG9vbHRpcCcsICdtb3VzZWVudGVyJywge1xuICAgIHVzZUNvbnRlbnRFeHA6IHRydWVcbiAgfSk7XG59XSlcblxuLmRpcmVjdGl2ZSgndWliVG9vbHRpcEh0bWxQb3B1cCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgc2NvcGU6IHsgY29udGVudEV4cDogJyYnIH0sXG4gICAgdGVtcGxhdGVVcmw6ICd1aWIvdGVtcGxhdGUvdG9vbHRpcC90b29sdGlwLWh0bWwtcG9wdXAuaHRtbCdcbiAgfTtcbn0pXG5cbi5kaXJlY3RpdmUoJ3VpYlRvb2x0aXBIdG1sJywgWyckdWliVG9vbHRpcCcsIGZ1bmN0aW9uKCR1aWJUb29sdGlwKSB7XG4gIHJldHVybiAkdWliVG9vbHRpcCgndWliVG9vbHRpcEh0bWwnLCAndG9vbHRpcCcsICdtb3VzZWVudGVyJywge1xuICAgIHVzZUNvbnRlbnRFeHA6IHRydWVcbiAgfSk7XG59XSk7XG5cbi8qKlxuICogVGhlIGZvbGxvd2luZyBmZWF0dXJlcyBhcmUgc3RpbGwgb3V0c3RhbmRpbmc6IHBvcHVwIGRlbGF5LCBhbmltYXRpb24gYXMgYVxuICogZnVuY3Rpb24sIHBsYWNlbWVudCBhcyBhIGZ1bmN0aW9uLCBpbnNpZGUsIHN1cHBvcnQgZm9yIG1vcmUgdHJpZ2dlcnMgdGhhblxuICoganVzdCBtb3VzZSBlbnRlci9sZWF2ZSwgYW5kIHNlbGVjdG9yIGRlbGVnYXRhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5wb3BvdmVyJywgWyd1aS5ib290c3RyYXAudG9vbHRpcCddKVxuXG4uZGlyZWN0aXZlKCd1aWJQb3BvdmVyVGVtcGxhdGVQb3B1cCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgc2NvcGU6IHsgdWliVGl0bGU6ICdAJywgY29udGVudEV4cDogJyYnLCBvcmlnaW5TY29wZTogJyYnIH0sXG4gICAgdGVtcGxhdGVVcmw6ICd1aWIvdGVtcGxhdGUvcG9wb3Zlci9wb3BvdmVyLXRlbXBsYXRlLmh0bWwnXG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJQb3BvdmVyVGVtcGxhdGUnLCBbJyR1aWJUb29sdGlwJywgZnVuY3Rpb24oJHVpYlRvb2x0aXApIHtcbiAgcmV0dXJuICR1aWJUb29sdGlwKCd1aWJQb3BvdmVyVGVtcGxhdGUnLCAncG9wb3ZlcicsICdjbGljaycsIHtcbiAgICB1c2VDb250ZW50RXhwOiB0cnVlXG4gIH0pO1xufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYlBvcG92ZXJIdG1sUG9wdXAnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHNjb3BlOiB7IGNvbnRlbnRFeHA6ICcmJywgdWliVGl0bGU6ICdAJyB9LFxuICAgIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3BvcG92ZXIvcG9wb3Zlci1odG1sLmh0bWwnXG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJQb3BvdmVySHRtbCcsIFsnJHVpYlRvb2x0aXAnLCBmdW5jdGlvbigkdWliVG9vbHRpcCkge1xuICByZXR1cm4gJHVpYlRvb2x0aXAoJ3VpYlBvcG92ZXJIdG1sJywgJ3BvcG92ZXInLCAnY2xpY2snLCB7XG4gICAgdXNlQ29udGVudEV4cDogdHJ1ZVxuICB9KTtcbn1dKVxuXG4uZGlyZWN0aXZlKCd1aWJQb3BvdmVyUG9wdXAnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHNjb3BlOiB7IHVpYlRpdGxlOiAnQCcsIGNvbnRlbnQ6ICdAJyB9LFxuICAgIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3BvcG92ZXIvcG9wb3Zlci5odG1sJ1xuICB9O1xufSlcblxuLmRpcmVjdGl2ZSgndWliUG9wb3ZlcicsIFsnJHVpYlRvb2x0aXAnLCBmdW5jdGlvbigkdWliVG9vbHRpcCkge1xuICByZXR1cm4gJHVpYlRvb2x0aXAoJ3VpYlBvcG92ZXInLCAncG9wb3ZlcicsICdjbGljaycpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLnByb2dyZXNzYmFyJywgW10pXG5cbi5jb25zdGFudCgndWliUHJvZ3Jlc3NDb25maWcnLCB7XG4gIGFuaW1hdGU6IHRydWUsXG4gIG1heDogMTAwXG59KVxuXG4uY29udHJvbGxlcignVWliUHJvZ3Jlc3NDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGF0dHJzJywgJ3VpYlByb2dyZXNzQ29uZmlnJywgZnVuY3Rpb24oJHNjb3BlLCAkYXR0cnMsIHByb2dyZXNzQ29uZmlnKSB7XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIGFuaW1hdGUgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuYW5pbWF0ZSkgPyAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMuYW5pbWF0ZSkgOiBwcm9ncmVzc0NvbmZpZy5hbmltYXRlO1xuXG4gIHRoaXMuYmFycyA9IFtdO1xuICAkc2NvcGUubWF4ID0gZ2V0TWF4T3JEZWZhdWx0KCk7XG5cbiAgdGhpcy5hZGRCYXIgPSBmdW5jdGlvbihiYXIsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgaWYgKCFhbmltYXRlKSB7XG4gICAgICBlbGVtZW50LmNzcyh7J3RyYW5zaXRpb24nOiAnbm9uZSd9KTtcbiAgICB9XG5cbiAgICB0aGlzLmJhcnMucHVzaChiYXIpO1xuXG4gICAgYmFyLm1heCA9IGdldE1heE9yRGVmYXVsdCgpO1xuICAgIGJhci50aXRsZSA9IGF0dHJzICYmIGFuZ3VsYXIuaXNEZWZpbmVkKGF0dHJzLnRpdGxlKSA/IGF0dHJzLnRpdGxlIDogJ3Byb2dyZXNzYmFyJztcblxuICAgIGJhci4kd2F0Y2goJ3ZhbHVlJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGJhci5yZWNhbGN1bGF0ZVBlcmNlbnRhZ2UoKTtcbiAgICB9KTtcblxuICAgIGJhci5yZWNhbGN1bGF0ZVBlcmNlbnRhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0b3RhbFBlcmNlbnRhZ2UgPSBzZWxmLmJhcnMucmVkdWNlKGZ1bmN0aW9uKHRvdGFsLCBiYXIpIHtcbiAgICAgICAgYmFyLnBlcmNlbnQgPSArKDEwMCAqIGJhci52YWx1ZSAvIGJhci5tYXgpLnRvRml4ZWQoMik7XG4gICAgICAgIHJldHVybiB0b3RhbCArIGJhci5wZXJjZW50O1xuICAgICAgfSwgMCk7XG5cbiAgICAgIGlmICh0b3RhbFBlcmNlbnRhZ2UgPiAxMDApIHtcbiAgICAgICAgYmFyLnBlcmNlbnQgLT0gdG90YWxQZXJjZW50YWdlIC0gMTAwO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBiYXIuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgZWxlbWVudCA9IG51bGw7XG4gICAgICBzZWxmLnJlbW92ZUJhcihiYXIpO1xuICAgIH0pO1xuICB9O1xuXG4gIHRoaXMucmVtb3ZlQmFyID0gZnVuY3Rpb24oYmFyKSB7XG4gICAgdGhpcy5iYXJzLnNwbGljZSh0aGlzLmJhcnMuaW5kZXhPZihiYXIpLCAxKTtcbiAgICB0aGlzLmJhcnMuZm9yRWFjaChmdW5jdGlvbiAoYmFyKSB7XG4gICAgICBiYXIucmVjYWxjdWxhdGVQZXJjZW50YWdlKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8kYXR0cnMuJG9ic2VydmUoJ21heFBhcmFtJywgZnVuY3Rpb24obWF4UGFyYW0pIHtcbiAgJHNjb3BlLiR3YXRjaCgnbWF4UGFyYW0nLCBmdW5jdGlvbihtYXhQYXJhbSkge1xuICAgIHNlbGYuYmFycy5mb3JFYWNoKGZ1bmN0aW9uKGJhcikge1xuICAgICAgYmFyLm1heCA9IGdldE1heE9yRGVmYXVsdCgpO1xuICAgICAgYmFyLnJlY2FsY3VsYXRlUGVyY2VudGFnZSgpO1xuICAgIH0pO1xuICB9KTtcblxuICBmdW5jdGlvbiBnZXRNYXhPckRlZmF1bHQgKCkge1xuICAgIHJldHVybiBhbmd1bGFyLmlzRGVmaW5lZCgkc2NvcGUubWF4UGFyYW0pID8gJHNjb3BlLm1heFBhcmFtIDogcHJvZ3Jlc3NDb25maWcubWF4O1xuICB9XG59XSlcblxuLmRpcmVjdGl2ZSgndWliUHJvZ3Jlc3MnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXBsYWNlOiB0cnVlLFxuICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgY29udHJvbGxlcjogJ1VpYlByb2dyZXNzQ29udHJvbGxlcicsXG4gICAgcmVxdWlyZTogJ3VpYlByb2dyZXNzJyxcbiAgICBzY29wZToge1xuICAgICAgbWF4UGFyYW06ICc9P21heCdcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL3Byb2dyZXNzLmh0bWwnXG4gIH07XG59KVxuXG4uZGlyZWN0aXZlKCd1aWJCYXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXBsYWNlOiB0cnVlLFxuICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgcmVxdWlyZTogJ151aWJQcm9ncmVzcycsXG4gICAgc2NvcGU6IHtcbiAgICAgIHZhbHVlOiAnPScsXG4gICAgICB0eXBlOiAnQCdcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL2Jhci5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHByb2dyZXNzQ3RybCkge1xuICAgICAgcHJvZ3Jlc3NDdHJsLmFkZEJhcihzY29wZSwgZWxlbWVudCwgYXR0cnMpO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5kaXJlY3RpdmUoJ3VpYlByb2dyZXNzYmFyJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgIGNvbnRyb2xsZXI6ICdVaWJQcm9ncmVzc0NvbnRyb2xsZXInLFxuICAgIHNjb3BlOiB7XG4gICAgICB2YWx1ZTogJz0nLFxuICAgICAgbWF4UGFyYW06ICc9P21heCcsXG4gICAgICB0eXBlOiAnQCdcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL3Byb2dyZXNzYmFyLmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgcHJvZ3Jlc3NDdHJsKSB7XG4gICAgICBwcm9ncmVzc0N0cmwuYWRkQmFyKHNjb3BlLCBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudC5jaGlsZHJlbigpWzBdKSwge3RpdGxlOiBhdHRycy50aXRsZX0pO1xuICAgIH1cbiAgfTtcbn0pO1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLnJhdGluZycsIFtdKVxuXG4uY29uc3RhbnQoJ3VpYlJhdGluZ0NvbmZpZycsIHtcbiAgbWF4OiA1LFxuICBzdGF0ZU9uOiBudWxsLFxuICBzdGF0ZU9mZjogbnVsbCxcbiAgZW5hYmxlUmVzZXQ6IHRydWUsXG4gIHRpdGxlczogWydvbmUnLCAndHdvJywgJ3RocmVlJywgJ2ZvdXInLCAnZml2ZSddXG59KVxuXG4uY29udHJvbGxlcignVWliUmF0aW5nQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRhdHRycycsICd1aWJSYXRpbmdDb25maWcnLCBmdW5jdGlvbigkc2NvcGUsICRhdHRycywgcmF0aW5nQ29uZmlnKSB7XG4gIHZhciBuZ01vZGVsQ3RybCA9IHsgJHNldFZpZXdWYWx1ZTogYW5ndWxhci5ub29wIH0sXG4gICAgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24obmdNb2RlbEN0cmxfKSB7XG4gICAgbmdNb2RlbEN0cmwgPSBuZ01vZGVsQ3RybF87XG4gICAgbmdNb2RlbEN0cmwuJHJlbmRlciA9IHRoaXMucmVuZGVyO1xuXG4gICAgbmdNb2RlbEN0cmwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKGFuZ3VsYXIuaXNOdW1iZXIodmFsdWUpICYmIHZhbHVlIDw8IDAgIT09IHZhbHVlKSB7XG4gICAgICAgIHZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3RhdGVPbiA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5zdGF0ZU9uKSA/ICRzY29wZS4kcGFyZW50LiRldmFsKCRhdHRycy5zdGF0ZU9uKSA6IHJhdGluZ0NvbmZpZy5zdGF0ZU9uO1xuICAgIHRoaXMuc3RhdGVPZmYgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMuc3RhdGVPZmYpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLnN0YXRlT2ZmKSA6IHJhdGluZ0NvbmZpZy5zdGF0ZU9mZjtcbiAgICB0aGlzLmVuYWJsZVJlc2V0ID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmVuYWJsZVJlc2V0KSA/XG4gICAgICAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMuZW5hYmxlUmVzZXQpIDogcmF0aW5nQ29uZmlnLmVuYWJsZVJlc2V0O1xuICAgIHZhciB0bXBUaXRsZXMgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMudGl0bGVzKSA/ICRzY29wZS4kcGFyZW50LiRldmFsKCRhdHRycy50aXRsZXMpIDogcmF0aW5nQ29uZmlnLnRpdGxlcztcbiAgICB0aGlzLnRpdGxlcyA9IGFuZ3VsYXIuaXNBcnJheSh0bXBUaXRsZXMpICYmIHRtcFRpdGxlcy5sZW5ndGggPiAwID9cbiAgICAgIHRtcFRpdGxlcyA6IHJhdGluZ0NvbmZpZy50aXRsZXM7XG5cbiAgICB2YXIgcmF0aW5nU3RhdGVzID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLnJhdGluZ1N0YXRlcykgP1xuICAgICAgJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLnJhdGluZ1N0YXRlcykgOlxuICAgICAgbmV3IEFycmF5KGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5tYXgpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLm1heCkgOiByYXRpbmdDb25maWcubWF4KTtcbiAgICAkc2NvcGUucmFuZ2UgPSB0aGlzLmJ1aWxkVGVtcGxhdGVPYmplY3RzKHJhdGluZ1N0YXRlcyk7XG4gIH07XG5cbiAgdGhpcy5idWlsZFRlbXBsYXRlT2JqZWN0cyA9IGZ1bmN0aW9uKHN0YXRlcykge1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gc3RhdGVzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgc3RhdGVzW2ldID0gYW5ndWxhci5leHRlbmQoeyBpbmRleDogaSB9LCB7IHN0YXRlT246IHRoaXMuc3RhdGVPbiwgc3RhdGVPZmY6IHRoaXMuc3RhdGVPZmYsIHRpdGxlOiB0aGlzLmdldFRpdGxlKGkpIH0sIHN0YXRlc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZXM7XG4gIH07XG5cbiAgdGhpcy5nZXRUaXRsZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID49IHRoaXMudGl0bGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGluZGV4ICsgMTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50aXRsZXNbaW5kZXhdO1xuICB9O1xuXG4gICRzY29wZS5yYXRlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAoISRzY29wZS5yZWFkb25seSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9ICRzY29wZS5yYW5nZS5sZW5ndGgpIHtcbiAgICAgIHZhciBuZXdWaWV3VmFsdWUgPSBzZWxmLmVuYWJsZVJlc2V0ICYmIG5nTW9kZWxDdHJsLiR2aWV3VmFsdWUgPT09IHZhbHVlID8gMCA6IHZhbHVlO1xuICAgICAgbmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZShuZXdWaWV3VmFsdWUpO1xuICAgICAgbmdNb2RlbEN0cmwuJHJlbmRlcigpO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZW50ZXIgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICghJHNjb3BlLnJlYWRvbmx5KSB7XG4gICAgICAkc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgJHNjb3BlLm9uSG92ZXIoe3ZhbHVlOiB2YWx1ZX0pO1xuICB9O1xuXG4gICRzY29wZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS52YWx1ZSA9IG5nTW9kZWxDdHJsLiR2aWV3VmFsdWU7XG4gICAgJHNjb3BlLm9uTGVhdmUoKTtcbiAgfTtcblxuICAkc2NvcGUub25LZXlkb3duID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgaWYgKC8oMzd8Mzh8Mzl8NDApLy50ZXN0KGV2dC53aGljaCkpIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgJHNjb3BlLnJhdGUoJHNjb3BlLnZhbHVlICsgKGV2dC53aGljaCA9PT0gMzggfHwgZXZ0LndoaWNoID09PSAzOSA/IDEgOiAtMSkpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS52YWx1ZSA9IG5nTW9kZWxDdHJsLiR2aWV3VmFsdWU7XG4gICAgJHNjb3BlLnRpdGxlID0gc2VsZi5nZXRUaXRsZSgkc2NvcGUudmFsdWUgLSAxKTtcbiAgfTtcbn1dKVxuXG4uZGlyZWN0aXZlKCd1aWJSYXRpbmcnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiBbJ3VpYlJhdGluZycsICduZ01vZGVsJ10sXG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBzY29wZToge1xuICAgICAgcmVhZG9ubHk6ICc9P3JlYWRPbmx5JyxcbiAgICAgIG9uSG92ZXI6ICcmJyxcbiAgICAgIG9uTGVhdmU6ICcmJ1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogJ1VpYlJhdGluZ0NvbnRyb2xsZXInLFxuICAgIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3JhdGluZy9yYXRpbmcuaHRtbCcsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgdmFyIHJhdGluZ0N0cmwgPSBjdHJsc1swXSwgbmdNb2RlbEN0cmwgPSBjdHJsc1sxXTtcbiAgICAgIHJhdGluZ0N0cmwuaW5pdChuZ01vZGVsQ3RybCk7XG4gICAgfVxuICB9O1xufSk7XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5ib290c3RyYXAudGFicycsIFtdKVxuXG4uY29udHJvbGxlcignVWliVGFic2V0Q29udHJvbGxlcicsIFsnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICB2YXIgY3RybCA9IHRoaXMsXG4gICAgb2xkSW5kZXg7XG4gIGN0cmwudGFicyA9IFtdO1xuXG4gIGN0cmwuc2VsZWN0ID0gZnVuY3Rpb24oaW5kZXgsIGV2dCkge1xuICAgIGlmICghZGVzdHJveWVkKSB7XG4gICAgICB2YXIgcHJldmlvdXNJbmRleCA9IGZpbmRUYWJJbmRleChvbGRJbmRleCk7XG4gICAgICB2YXIgcHJldmlvdXNTZWxlY3RlZCA9IGN0cmwudGFic1twcmV2aW91c0luZGV4XTtcbiAgICAgIGlmIChwcmV2aW91c1NlbGVjdGVkKSB7XG4gICAgICAgIHByZXZpb3VzU2VsZWN0ZWQudGFiLm9uRGVzZWxlY3Qoe1xuICAgICAgICAgICRldmVudDogZXZ0LFxuICAgICAgICAgICRzZWxlY3RlZEluZGV4OiBpbmRleFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGV2dCAmJiBldnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlvdXNTZWxlY3RlZC50YWIuYWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBzZWxlY3RlZCA9IGN0cmwudGFic1tpbmRleF07XG4gICAgICBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgICAgc2VsZWN0ZWQudGFiLm9uU2VsZWN0KHtcbiAgICAgICAgICAkZXZlbnQ6IGV2dFxuICAgICAgICB9KTtcbiAgICAgICAgc2VsZWN0ZWQudGFiLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIGN0cmwuYWN0aXZlID0gc2VsZWN0ZWQuaW5kZXg7XG4gICAgICAgIG9sZEluZGV4ID0gc2VsZWN0ZWQuaW5kZXg7XG4gICAgICB9IGVsc2UgaWYgKCFzZWxlY3RlZCAmJiBhbmd1bGFyLmlzRGVmaW5lZChvbGRJbmRleCkpIHtcbiAgICAgICAgY3RybC5hY3RpdmUgPSBudWxsO1xuICAgICAgICBvbGRJbmRleCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGN0cmwuYWRkVGFiID0gZnVuY3Rpb24gYWRkVGFiKHRhYikge1xuICAgIGN0cmwudGFicy5wdXNoKHtcbiAgICAgIHRhYjogdGFiLFxuICAgICAgaW5kZXg6IHRhYi5pbmRleFxuICAgIH0pO1xuICAgIGN0cmwudGFicy5zb3J0KGZ1bmN0aW9uKHQxLCB0Mikge1xuICAgICAgaWYgKHQxLmluZGV4ID4gdDIuaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIGlmICh0MS5pbmRleCA8IHQyLmluZGV4KSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG5cbiAgICBpZiAodGFiLmluZGV4ID09PSBjdHJsLmFjdGl2ZSB8fCAhYW5ndWxhci5pc0RlZmluZWQoY3RybC5hY3RpdmUpICYmIGN0cmwudGFicy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBuZXdBY3RpdmVJbmRleCA9IGZpbmRUYWJJbmRleCh0YWIuaW5kZXgpO1xuICAgICAgY3RybC5zZWxlY3QobmV3QWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgfTtcblxuICBjdHJsLnJlbW92ZVRhYiA9IGZ1bmN0aW9uIHJlbW92ZVRhYih0YWIpIHtcbiAgICB2YXIgaW5kZXg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdHJsLnRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChjdHJsLnRhYnNbaV0udGFiID09PSB0YWIpIHtcbiAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY3RybC50YWJzW2luZGV4XS5pbmRleCA9PT0gY3RybC5hY3RpdmUpIHtcbiAgICAgIHZhciBuZXdBY3RpdmVUYWJJbmRleCA9IGluZGV4ID09PSBjdHJsLnRhYnMubGVuZ3RoIC0gMSA/XG4gICAgICAgIGluZGV4IC0gMSA6IGluZGV4ICsgMSAlIGN0cmwudGFicy5sZW5ndGg7XG4gICAgICBjdHJsLnNlbGVjdChuZXdBY3RpdmVUYWJJbmRleCk7XG4gICAgfVxuXG4gICAgY3RybC50YWJzLnNwbGljZShpbmRleCwgMSk7XG4gIH07XG5cbiAgJHNjb3BlLiR3YXRjaCgndGFic2V0LmFjdGl2ZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWwpICYmIHZhbCAhPT0gb2xkSW5kZXgpIHtcbiAgICAgIGN0cmwuc2VsZWN0KGZpbmRUYWJJbmRleCh2YWwpKTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBkZXN0cm95ZWQ7XG4gICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gZmluZFRhYkluZGV4KGluZGV4KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdHJsLnRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChjdHJsLnRhYnNbaV0uaW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYlRhYnNldCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICBzY29wZToge30sXG4gICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgYWN0aXZlOiAnPT8nLFxuICAgICAgdHlwZTogJ0AnXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiAnVWliVGFic2V0Q29udHJvbGxlcicsXG4gICAgY29udHJvbGxlckFzOiAndGFic2V0JyxcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCAndWliL3RlbXBsYXRlL3RhYnMvdGFic2V0Lmh0bWwnO1xuICAgIH0sXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBzY29wZS52ZXJ0aWNhbCA9IGFuZ3VsYXIuaXNEZWZpbmVkKGF0dHJzLnZlcnRpY2FsKSA/XG4gICAgICAgIHNjb3BlLiRwYXJlbnQuJGV2YWwoYXR0cnMudmVydGljYWwpIDogZmFsc2U7XG4gICAgICBzY29wZS5qdXN0aWZpZWQgPSBhbmd1bGFyLmlzRGVmaW5lZChhdHRycy5qdXN0aWZpZWQpID9cbiAgICAgICAgc2NvcGUuJHBhcmVudC4kZXZhbChhdHRycy5qdXN0aWZpZWQpIDogZmFsc2U7XG4gICAgfVxuICB9O1xufSlcblxuLmRpcmVjdGl2ZSgndWliVGFiJywgWyckcGFyc2UnLCBmdW5jdGlvbigkcGFyc2UpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiAnXnVpYlRhYnNldCcsXG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCAndWliL3RlbXBsYXRlL3RhYnMvdGFiLmh0bWwnO1xuICAgIH0sXG4gICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICBzY29wZToge1xuICAgICAgaGVhZGluZzogJ0AnLFxuICAgICAgaW5kZXg6ICc9PycsXG4gICAgICBjbGFzc2VzOiAnQD8nLFxuICAgICAgb25TZWxlY3Q6ICcmc2VsZWN0JywgLy9UaGlzIGNhbGxiYWNrIGlzIGNhbGxlZCBpbiBjb250ZW50SGVhZGluZ1RyYW5zY2x1ZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy9vbmNlIGl0IGluc2VydHMgdGhlIHRhYidzIGNvbnRlbnQgaW50byB0aGUgZG9tXG4gICAgICBvbkRlc2VsZWN0OiAnJmRlc2VsZWN0J1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oKSB7XG4gICAgICAvL0VtcHR5IGNvbnRyb2xsZXIgc28gb3RoZXIgZGlyZWN0aXZlcyBjYW4gcmVxdWlyZSBiZWluZyAndW5kZXInIGEgdGFiXG4gICAgfSxcbiAgICBjb250cm9sbGVyQXM6ICd0YWInLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbG0sIGF0dHJzLCB0YWJzZXRDdHJsLCB0cmFuc2NsdWRlKSB7XG4gICAgICBzY29wZS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgaWYgKGF0dHJzLmRpc2FibGUpIHtcbiAgICAgICAgc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKGF0dHJzLmRpc2FibGUpLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIHNjb3BlLmRpc2FibGVkID0gISEgdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChhdHRycy5pbmRleCkpIHtcbiAgICAgICAgaWYgKHRhYnNldEN0cmwudGFicyAmJiB0YWJzZXRDdHJsLnRhYnMubGVuZ3RoKSB7XG4gICAgICAgICAgc2NvcGUuaW5kZXggPSBNYXRoLm1heC5hcHBseShudWxsLCB0YWJzZXRDdHJsLnRhYnMubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIHQuaW5kZXg7IH0pKSArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2NvcGUuaW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGF0dHJzLmNsYXNzZXMpKSB7XG4gICAgICAgIHNjb3BlLmNsYXNzZXMgPSAnJztcbiAgICAgIH1cblxuICAgICAgc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgIGlmICghc2NvcGUuZGlzYWJsZWQpIHtcbiAgICAgICAgICB2YXIgaW5kZXg7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWJzZXRDdHJsLnRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0YWJzZXRDdHJsLnRhYnNbaV0udGFiID09PSBzY29wZSkge1xuICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRhYnNldEN0cmwuc2VsZWN0KGluZGV4LCBldnQpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB0YWJzZXRDdHJsLmFkZFRhYihzY29wZSk7XG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRhYnNldEN0cmwucmVtb3ZlVGFiKHNjb3BlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvL1dlIG5lZWQgdG8gdHJhbnNjbHVkZSBsYXRlciwgb25jZSB0aGUgY29udGVudCBjb250YWluZXIgaXMgcmVhZHkuXG4gICAgICAvL3doZW4gdGhpcyBsaW5rIGhhcHBlbnMsIHdlJ3JlIGluc2lkZSBhIHRhYiBoZWFkaW5nLlxuICAgICAgc2NvcGUuJHRyYW5zY2x1ZGVGbiA9IHRyYW5zY2x1ZGU7XG4gICAgfVxuICB9O1xufV0pXG5cbi5kaXJlY3RpdmUoJ3VpYlRhYkhlYWRpbmdUcmFuc2NsdWRlJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICByZXF1aXJlOiAnXnVpYlRhYicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsbSkge1xuICAgICAgc2NvcGUuJHdhdGNoKCdoZWFkaW5nRWxlbWVudCcsIGZ1bmN0aW9uIHVwZGF0ZUhlYWRpbmdFbGVtZW50KGhlYWRpbmcpIHtcbiAgICAgICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgICAgICBlbG0uaHRtbCgnJyk7XG4gICAgICAgICAgZWxtLmFwcGVuZChoZWFkaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSlcblxuLmRpcmVjdGl2ZSgndWliVGFiQ29udGVudFRyYW5zY2x1ZGUnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHJlcXVpcmU6ICdedWliVGFic2V0JyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxtLCBhdHRycykge1xuICAgICAgdmFyIHRhYiA9IHNjb3BlLiRldmFsKGF0dHJzLnVpYlRhYkNvbnRlbnRUcmFuc2NsdWRlKS50YWI7XG5cbiAgICAgIC8vTm93IG91ciB0YWIgaXMgcmVhZHkgdG8gYmUgdHJhbnNjbHVkZWQ6IGJvdGggdGhlIHRhYiBoZWFkaW5nIGFyZWFcbiAgICAgIC8vYW5kIHRoZSB0YWIgY29udGVudCBhcmVhIGFyZSBsb2FkZWQuICBUcmFuc2NsdWRlICdlbSBib3RoLlxuICAgICAgdGFiLiR0cmFuc2NsdWRlRm4odGFiLiRwYXJlbnQsIGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb250ZW50cywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIGlmIChpc1RhYkhlYWRpbmcobm9kZSkpIHtcbiAgICAgICAgICAgIC8vTGV0IHRhYkhlYWRpbmdUcmFuc2NsdWRlIGtub3cuXG4gICAgICAgICAgICB0YWIuaGVhZGluZ0VsZW1lbnQgPSBub2RlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbG0uYXBwZW5kKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gaXNUYWJIZWFkaW5nKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50YWdOYW1lICYmIChcbiAgICAgIG5vZGUuaGFzQXR0cmlidXRlKCd1aWItdGFiLWhlYWRpbmcnKSB8fFxuICAgICAgbm9kZS5oYXNBdHRyaWJ1dGUoJ2RhdGEtdWliLXRhYi1oZWFkaW5nJykgfHxcbiAgICAgIG5vZGUuaGFzQXR0cmlidXRlKCd4LXVpYi10YWItaGVhZGluZycpIHx8XG4gICAgICBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3VpYi10YWItaGVhZGluZycgfHxcbiAgICAgIG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZGF0YS11aWItdGFiLWhlYWRpbmcnIHx8XG4gICAgICBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3gtdWliLXRhYi1oZWFkaW5nJyB8fFxuICAgICAgbm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd1aWI6dGFiLWhlYWRpbmcnXG4gICAgKTtcbiAgfVxufSk7XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5ib290c3RyYXAudGltZXBpY2tlcicsIFtdKVxuXG4uY29uc3RhbnQoJ3VpYlRpbWVwaWNrZXJDb25maWcnLCB7XG4gIGhvdXJTdGVwOiAxLFxuICBtaW51dGVTdGVwOiAxLFxuICBzZWNvbmRTdGVwOiAxLFxuICBzaG93TWVyaWRpYW46IHRydWUsXG4gIHNob3dTZWNvbmRzOiBmYWxzZSxcbiAgbWVyaWRpYW5zOiBudWxsLFxuICByZWFkb25seUlucHV0OiBmYWxzZSxcbiAgbW91c2V3aGVlbDogdHJ1ZSxcbiAgYXJyb3drZXlzOiB0cnVlLFxuICBzaG93U3Bpbm5lcnM6IHRydWUsXG4gIHRlbXBsYXRlVXJsOiAndWliL3RlbXBsYXRlL3RpbWVwaWNrZXIvdGltZXBpY2tlci5odG1sJ1xufSlcblxuLmNvbnRyb2xsZXIoJ1VpYlRpbWVwaWNrZXJDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJGF0dHJzJywgJyRwYXJzZScsICckbG9nJywgJyRsb2NhbGUnLCAndWliVGltZXBpY2tlckNvbmZpZycsIGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJHBhcnNlLCAkbG9nLCAkbG9jYWxlLCB0aW1lcGlja2VyQ29uZmlnKSB7XG4gIHZhciBob3Vyc01vZGVsQ3RybCwgbWludXRlc01vZGVsQ3RybCwgc2Vjb25kc01vZGVsQ3RybDtcbiAgdmFyIHNlbGVjdGVkID0gbmV3IERhdGUoKSxcbiAgICB3YXRjaGVycyA9IFtdLFxuICAgIG5nTW9kZWxDdHJsID0geyAkc2V0Vmlld1ZhbHVlOiBhbmd1bGFyLm5vb3AgfSwgLy8gbnVsbE1vZGVsQ3RybFxuICAgIG1lcmlkaWFucyA9IGFuZ3VsYXIuaXNEZWZpbmVkKCRhdHRycy5tZXJpZGlhbnMpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLm1lcmlkaWFucykgOiB0aW1lcGlja2VyQ29uZmlnLm1lcmlkaWFucyB8fCAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFMuQU1QTVMsXG4gICAgcGFkSG91cnMgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMucGFkSG91cnMpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLnBhZEhvdXJzKSA6IHRydWU7XG5cbiAgJHNjb3BlLnRhYmluZGV4ID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLnRhYmluZGV4KSA/ICRhdHRycy50YWJpbmRleCA6IDA7XG4gICRlbGVtZW50LnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG5cbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24obmdNb2RlbEN0cmxfLCBpbnB1dHMpIHtcbiAgICBuZ01vZGVsQ3RybCA9IG5nTW9kZWxDdHJsXztcbiAgICBuZ01vZGVsQ3RybC4kcmVuZGVyID0gdGhpcy5yZW5kZXI7XG5cbiAgICBuZ01vZGVsQ3RybC4kZm9ybWF0dGVycy51bnNoaWZ0KGZ1bmN0aW9uKG1vZGVsVmFsdWUpIHtcbiAgICAgIHJldHVybiBtb2RlbFZhbHVlID8gbmV3IERhdGUobW9kZWxWYWx1ZSkgOiBudWxsO1xuICAgIH0pO1xuXG4gICAgdmFyIGhvdXJzSW5wdXRFbCA9IGlucHV0cy5lcSgwKSxcbiAgICAgICAgbWludXRlc0lucHV0RWwgPSBpbnB1dHMuZXEoMSksXG4gICAgICAgIHNlY29uZHNJbnB1dEVsID0gaW5wdXRzLmVxKDIpO1xuXG4gICAgaG91cnNNb2RlbEN0cmwgPSBob3Vyc0lucHV0RWwuY29udHJvbGxlcignbmdNb2RlbCcpO1xuICAgIG1pbnV0ZXNNb2RlbEN0cmwgPSBtaW51dGVzSW5wdXRFbC5jb250cm9sbGVyKCduZ01vZGVsJyk7XG4gICAgc2Vjb25kc01vZGVsQ3RybCA9IHNlY29uZHNJbnB1dEVsLmNvbnRyb2xsZXIoJ25nTW9kZWwnKTtcblxuICAgIHZhciBtb3VzZXdoZWVsID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLm1vdXNld2hlZWwpID8gJHNjb3BlLiRwYXJlbnQuJGV2YWwoJGF0dHJzLm1vdXNld2hlZWwpIDogdGltZXBpY2tlckNvbmZpZy5tb3VzZXdoZWVsO1xuXG4gICAgaWYgKG1vdXNld2hlZWwpIHtcbiAgICAgIHRoaXMuc2V0dXBNb3VzZXdoZWVsRXZlbnRzKGhvdXJzSW5wdXRFbCwgbWludXRlc0lucHV0RWwsIHNlY29uZHNJbnB1dEVsKTtcbiAgICB9XG5cbiAgICB2YXIgYXJyb3drZXlzID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLmFycm93a2V5cykgPyAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMuYXJyb3drZXlzKSA6IHRpbWVwaWNrZXJDb25maWcuYXJyb3drZXlzO1xuICAgIGlmIChhcnJvd2tleXMpIHtcbiAgICAgIHRoaXMuc2V0dXBBcnJvd2tleUV2ZW50cyhob3Vyc0lucHV0RWwsIG1pbnV0ZXNJbnB1dEVsLCBzZWNvbmRzSW5wdXRFbCk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlYWRvbmx5SW5wdXQgPSBhbmd1bGFyLmlzRGVmaW5lZCgkYXR0cnMucmVhZG9ubHlJbnB1dCkgPyAkc2NvcGUuJHBhcmVudC4kZXZhbCgkYXR0cnMucmVhZG9ubHlJbnB1dCkgOiB0aW1lcGlja2VyQ29uZmlnLnJlYWRvbmx5SW5wdXQ7XG4gICAgdGhpcy5zZXR1cElucHV0RXZlbnRzKGhvdXJzSW5wdXRFbCwgbWludXRlc0lucHV0RWwsIHNlY29uZHNJbnB1dEVsKTtcbiAgfTtcblxuICB2YXIgaG91clN0ZXAgPSB0aW1lcGlja2VyQ29uZmlnLmhvdXJTdGVwO1xuICBpZiAoJGF0dHJzLmhvdXJTdGVwKSB7XG4gICAgd2F0Y2hlcnMucHVzaCgkc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKCRhdHRycy5ob3VyU3RlcCksIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBob3VyU3RlcCA9ICt2YWx1ZTtcbiAgICB9KSk7XG4gIH1cblxuICB2YXIgbWludXRlU3RlcCA9IHRpbWVwaWNrZXJDb25maWcubWludXRlU3RlcDtcbiAgaWYgKCRhdHRycy5taW51dGVTdGVwKSB7XG4gICAgd2F0Y2hlcnMucHVzaCgkc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKCRhdHRycy5taW51dGVTdGVwKSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIG1pbnV0ZVN0ZXAgPSArdmFsdWU7XG4gICAgfSkpO1xuICB9XG5cbiAgdmFyIG1pbjtcbiAgd2F0Y2hlcnMucHVzaCgkc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKCRhdHRycy5taW4pLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBkdCA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICBtaW4gPSBpc05hTihkdCkgPyB1bmRlZmluZWQgOiBkdDtcbiAgfSkpO1xuXG4gIHZhciBtYXg7XG4gIHdhdGNoZXJzLnB1c2goJHNjb3BlLiRwYXJlbnQuJHdhdGNoKCRwYXJzZSgkYXR0cnMubWF4KSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgZHQgPSBuZXcgRGF0ZSh2YWx1ZSk7XG4gICAgbWF4ID0gaXNOYU4oZHQpID8gdW5kZWZpbmVkIDogZHQ7XG4gIH0pKTtcblxuICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgaWYgKCRhdHRycy5uZ0Rpc2FibGVkKSB7XG4gICAgd2F0Y2hlcnMucHVzaCgkc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKCRhdHRycy5uZ0Rpc2FibGVkKSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGRpc2FibGVkID0gdmFsdWU7XG4gICAgfSkpO1xuICB9XG5cbiAgJHNjb3BlLm5vSW5jcmVtZW50SG91cnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5jcmVtZW50ZWRTZWxlY3RlZCA9IGFkZE1pbnV0ZXMoc2VsZWN0ZWQsIGhvdXJTdGVwICogNjApO1xuICAgIHJldHVybiBkaXNhYmxlZCB8fCBpbmNyZW1lbnRlZFNlbGVjdGVkID4gbWF4IHx8XG4gICAgICBpbmNyZW1lbnRlZFNlbGVjdGVkIDwgc2VsZWN0ZWQgJiYgaW5jcmVtZW50ZWRTZWxlY3RlZCA8IG1pbjtcbiAgfTtcblxuICAkc2NvcGUubm9EZWNyZW1lbnRIb3VycyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWNyZW1lbnRlZFNlbGVjdGVkID0gYWRkTWludXRlcyhzZWxlY3RlZCwgLWhvdXJTdGVwICogNjApO1xuICAgIHJldHVybiBkaXNhYmxlZCB8fCBkZWNyZW1lbnRlZFNlbGVjdGVkIDwgbWluIHx8XG4gICAgICBkZWNyZW1lbnRlZFNlbGVjdGVkID4gc2VsZWN0ZWQgJiYgZGVjcmVtZW50ZWRTZWxlY3RlZCA+IG1heDtcbiAgfTtcblxuICAkc2NvcGUubm9JbmNyZW1lbnRNaW51dGVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluY3JlbWVudGVkU2VsZWN0ZWQgPSBhZGRNaW51dGVzKHNlbGVjdGVkLCBtaW51dGVTdGVwKTtcbiAgICByZXR1cm4gZGlzYWJsZWQgfHwgaW5jcmVtZW50ZWRTZWxlY3RlZCA+IG1heCB8fFxuICAgICAgaW5jcmVtZW50ZWRTZWxlY3RlZCA8IHNlbGVjdGVkICYmIGluY3JlbWVudGVkU2VsZWN0ZWQgPCBtaW47XG4gIH07XG5cbiAgJHNjb3BlLm5vRGVjcmVtZW50TWludXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWNyZW1lbnRlZFNlbGVjdGVkID0gYWRkTWludXRlcyhzZWxlY3RlZCwgLW1pbnV0ZVN0ZXApO1xuICAgIHJldHVybiBkaXNhYmxlZCB8fCBkZWNyZW1lbnRlZFNlbGVjdGVkIDwgbWluIHx8XG4gICAgICBkZWNyZW1lbnRlZFNlbGVjdGVkID4gc2VsZWN0ZWQgJiYgZGVjcmVtZW50ZWRTZWxlY3RlZCA+IG1heDtcbiAgfTtcblxuICAkc2NvcGUubm9JbmNyZW1lbnRTZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluY3JlbWVudGVkU2VsZWN0ZWQgPSBhZGRTZWNvbmRzKHNlbGVjdGVkLCBzZWNvbmRTdGVwKTtcbiAgICByZXR1cm4gZGlzYWJsZWQgfHwgaW5jcmVtZW50ZWRTZWxlY3RlZCA+IG1heCB8fFxuICAgICAgaW5jcmVtZW50ZWRTZWxlY3RlZCA8IHNlbGVjdGVkICYmIGluY3JlbWVudGVkU2VsZWN0ZWQgPCBtaW47XG4gIH07XG5cbiAgJHNjb3BlLm5vRGVjcmVtZW50U2Vjb25kcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWNyZW1lbnRlZFNlbGVjdGVkID0gYWRkU2Vjb25kcyhzZWxlY3RlZCwgLXNlY29uZFN0ZXApO1xuICAgIHJldHVybiBkaXNhYmxlZCB8fCBkZWNyZW1lbnRlZFNlbGVjdGVkIDwgbWluIHx8XG4gICAgICBkZWNyZW1lbnRlZFNlbGVjdGVkID4gc2VsZWN0ZWQgJiYgZGVjcmVtZW50ZWRTZWxlY3RlZCA+IG1heDtcbiAgfTtcblxuICAkc2NvcGUubm9Ub2dnbGVNZXJpZGlhbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxlY3RlZC5nZXRIb3VycygpIDwgMTIpIHtcbiAgICAgIHJldHVybiBkaXNhYmxlZCB8fCBhZGRNaW51dGVzKHNlbGVjdGVkLCAxMiAqIDYwKSA+IG1heDtcbiAgICB9XG5cbiAgICByZXR1cm4gZGlzYWJsZWQgfHwgYWRkTWludXRlcyhzZWxlY3RlZCwgLTEyICogNjApIDwgbWluO1xuICB9O1xuXG4gIHZhciBzZWNvbmRTdGVwID0gdGltZXBpY2tlckNvbmZpZy5zZWNvbmRTdGVwO1xuICBpZiAoJGF0dHJzLnNlY29uZFN0ZXApIHtcbiAgICB3YXRjaGVycy5wdXNoKCRzY29wZS4kcGFyZW50LiR3YXRjaCgkcGFyc2UoJGF0dHJzLnNlY29uZFN0ZXApLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgc2Vjb25kU3RlcCA9ICt2YWx1ZTtcbiAgICB9KSk7XG4gIH1cblxuICAkc2NvcGUuc2hvd1NlY29uZHMgPSB0aW1lcGlja2VyQ29uZmlnLnNob3dTZWNvbmRzO1xuICBpZiAoJGF0dHJzLnNob3dTZWNvbmRzKSB7XG4gICAgd2F0Y2hlcnMucHVzaCgkc2NvcGUuJHBhcmVudC4kd2F0Y2goJHBhcnNlKCRhdHRycy5zaG93U2Vjb25kcyksIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAkc2NvcGUuc2hvd1NlY29uZHMgPSAhIXZhbHVlO1xuICAgIH0pKTtcbiAgfVxuXG4gIC8vIDEySCAvIDI0SCBtb2RlXG4gICRzY29wZS5zaG93TWVyaWRpYW4gPSB0aW1lcGlja2VyQ29uZmlnLnNob3dNZXJpZGlhbjtcbiAgaWYgKCRhdHRycy5zaG93TWVyaWRpYW4pIHtcbiAgICB3YXRjaGVycy5wdXNoKCRzY29wZS4kcGFyZW50LiR3YXRjaCgkcGFyc2UoJGF0dHJzLnNob3dNZXJpZGlhbiksIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAkc2NvcGUuc2hvd01lcmlkaWFuID0gISF2YWx1ZTtcblxuICAgICAgaWYgKG5nTW9kZWxDdHJsLiRlcnJvci50aW1lKSB7XG4gICAgICAgIC8vIEV2YWx1YXRlIGZyb20gdGVtcGxhdGVcbiAgICAgICAgdmFyIGhvdXJzID0gZ2V0SG91cnNGcm9tVGVtcGxhdGUoKSwgbWludXRlcyA9IGdldE1pbnV0ZXNGcm9tVGVtcGxhdGUoKTtcbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGhvdXJzKSAmJiBhbmd1bGFyLmlzRGVmaW5lZChtaW51dGVzKSkge1xuICAgICAgICAgIHNlbGVjdGVkLnNldEhvdXJzKGhvdXJzKTtcbiAgICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwZGF0ZVRlbXBsYXRlKCk7XG4gICAgICB9XG4gICAgfSkpO1xuICB9XG5cbiAgLy8gR2V0ICRzY29wZS5ob3VycyBpbiAyNEggbW9kZSBpZiB2YWxpZFxuICBmdW5jdGlvbiBnZXRIb3Vyc0Zyb21UZW1wbGF0ZSgpIHtcbiAgICB2YXIgaG91cnMgPSArJHNjb3BlLmhvdXJzO1xuICAgIHZhciB2YWxpZCA9ICRzY29wZS5zaG93TWVyaWRpYW4gPyBob3VycyA+IDAgJiYgaG91cnMgPCAxMyA6XG4gICAgICBob3VycyA+PSAwICYmIGhvdXJzIDwgMjQ7XG4gICAgaWYgKCF2YWxpZCB8fCAkc2NvcGUuaG91cnMgPT09ICcnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICgkc2NvcGUuc2hvd01lcmlkaWFuKSB7XG4gICAgICBpZiAoaG91cnMgPT09IDEyKSB7XG4gICAgICAgIGhvdXJzID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICgkc2NvcGUubWVyaWRpYW4gPT09IG1lcmlkaWFuc1sxXSkge1xuICAgICAgICBob3VycyA9IGhvdXJzICsgMTI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBob3VycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE1pbnV0ZXNGcm9tVGVtcGxhdGUoKSB7XG4gICAgdmFyIG1pbnV0ZXMgPSArJHNjb3BlLm1pbnV0ZXM7XG4gICAgdmFyIHZhbGlkID0gbWludXRlcyA+PSAwICYmIG1pbnV0ZXMgPCA2MDtcbiAgICBpZiAoIXZhbGlkIHx8ICRzY29wZS5taW51dGVzID09PSAnJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbnV0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTZWNvbmRzRnJvbVRlbXBsYXRlKCkge1xuICAgIHZhciBzZWNvbmRzID0gKyRzY29wZS5zZWNvbmRzO1xuICAgIHJldHVybiBzZWNvbmRzID49IDAgJiYgc2Vjb25kcyA8IDYwID8gc2Vjb25kcyA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhZCh2YWx1ZSwgbm9QYWQpIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gYW5ndWxhci5pc0RlZmluZWQodmFsdWUpICYmIHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoIDwgMiAmJiAhbm9QYWQgP1xuICAgICAgJzAnICsgdmFsdWUgOiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG5cbiAgLy8gUmVzcG9uZCBvbiBtb3VzZXdoZWVsIHNwaW5cbiAgdGhpcy5zZXR1cE1vdXNld2hlZWxFdmVudHMgPSBmdW5jdGlvbihob3Vyc0lucHV0RWwsIG1pbnV0ZXNJbnB1dEVsLCBzZWNvbmRzSW5wdXRFbCkge1xuICAgIHZhciBpc1Njcm9sbGluZ1VwID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUub3JpZ2luYWxFdmVudCkge1xuICAgICAgICBlID0gZS5vcmlnaW5hbEV2ZW50O1xuICAgICAgfVxuICAgICAgLy9waWNrIGNvcnJlY3QgZGVsdGEgdmFyaWFibGUgZGVwZW5kaW5nIG9uIGV2ZW50XG4gICAgICB2YXIgZGVsdGEgPSBlLndoZWVsRGVsdGEgPyBlLndoZWVsRGVsdGEgOiAtZS5kZWx0YVk7XG4gICAgICByZXR1cm4gZS5kZXRhaWwgfHwgZGVsdGEgPiAwO1xuICAgIH07XG5cbiAgICBob3Vyc0lucHV0RWwub24oJ21vdXNld2hlZWwgd2hlZWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgICRzY29wZS4kYXBwbHkoaXNTY3JvbGxpbmdVcChlKSA/ICRzY29wZS5pbmNyZW1lbnRIb3VycygpIDogJHNjb3BlLmRlY3JlbWVudEhvdXJzKCkpO1xuICAgICAgfVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuXG4gICAgbWludXRlc0lucHV0RWwub24oJ21vdXNld2hlZWwgd2hlZWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgICRzY29wZS4kYXBwbHkoaXNTY3JvbGxpbmdVcChlKSA/ICRzY29wZS5pbmNyZW1lbnRNaW51dGVzKCkgOiAkc2NvcGUuZGVjcmVtZW50TWludXRlcygpKTtcbiAgICAgIH1cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9KTtcblxuICAgICBzZWNvbmRzSW5wdXRFbC5vbignbW91c2V3aGVlbCB3aGVlbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghZGlzYWJsZWQpIHtcbiAgICAgICAgJHNjb3BlLiRhcHBseShpc1Njcm9sbGluZ1VwKGUpID8gJHNjb3BlLmluY3JlbWVudFNlY29uZHMoKSA6ICRzY29wZS5kZWNyZW1lbnRTZWNvbmRzKCkpO1xuICAgICAgfVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFJlc3BvbmQgb24gdXAvZG93biBhcnJvd2tleXNcbiAgdGhpcy5zZXR1cEFycm93a2V5RXZlbnRzID0gZnVuY3Rpb24oaG91cnNJbnB1dEVsLCBtaW51dGVzSW5wdXRFbCwgc2Vjb25kc0lucHV0RWwpIHtcbiAgICBob3Vyc0lucHV0RWwub24oJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgIGlmIChlLndoaWNoID09PSAzOCkgeyAvLyB1cFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAkc2NvcGUuaW5jcmVtZW50SG91cnMoKTtcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gNDApIHsgLy8gZG93blxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAkc2NvcGUuZGVjcmVtZW50SG91cnMoKTtcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIG1pbnV0ZXNJbnB1dEVsLm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCFkaXNhYmxlZCkge1xuICAgICAgICBpZiAoZS53aGljaCA9PT0gMzgpIHsgLy8gdXBcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgJHNjb3BlLmluY3JlbWVudE1pbnV0ZXMoKTtcbiAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gNDApIHsgLy8gZG93blxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAkc2NvcGUuZGVjcmVtZW50TWludXRlcygpO1xuICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2Vjb25kc0lucHV0RWwub24oJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgIGlmIChlLndoaWNoID09PSAzOCkgeyAvLyB1cFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAkc2NvcGUuaW5jcmVtZW50U2Vjb25kcygpO1xuICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlLndoaWNoID09PSA0MCkgeyAvLyBkb3duXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICRzY29wZS5kZWNyZW1lbnRTZWNvbmRzKCk7XG4gICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdGhpcy5zZXR1cElucHV0RXZlbnRzID0gZnVuY3Rpb24oaG91cnNJbnB1dEVsLCBtaW51dGVzSW5wdXRFbCwgc2Vjb25kc0lucHV0RWwpIHtcbiAgICBpZiAoJHNjb3BlLnJlYWRvbmx5SW5wdXQpIHtcbiAgICAgICRzY29wZS51cGRhdGVIb3VycyA9IGFuZ3VsYXIubm9vcDtcbiAgICAgICRzY29wZS51cGRhdGVNaW51dGVzID0gYW5ndWxhci5ub29wO1xuICAgICAgJHNjb3BlLnVwZGF0ZVNlY29uZHMgPSBhbmd1bGFyLm5vb3A7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGludmFsaWRhdGUgPSBmdW5jdGlvbihpbnZhbGlkSG91cnMsIGludmFsaWRNaW51dGVzLCBpbnZhbGlkU2Vjb25kcykge1xuICAgICAgbmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZShudWxsKTtcbiAgICAgIG5nTW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgndGltZScsIGZhbHNlKTtcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChpbnZhbGlkSG91cnMpKSB7XG4gICAgICAgICRzY29wZS5pbnZhbGlkSG91cnMgPSBpbnZhbGlkSG91cnM7XG4gICAgICAgIGlmIChob3Vyc01vZGVsQ3RybCkge1xuICAgICAgICAgIGhvdXJzTW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgnaG91cnMnLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGludmFsaWRNaW51dGVzKSkge1xuICAgICAgICAkc2NvcGUuaW52YWxpZE1pbnV0ZXMgPSBpbnZhbGlkTWludXRlcztcbiAgICAgICAgaWYgKG1pbnV0ZXNNb2RlbEN0cmwpIHtcbiAgICAgICAgICBtaW51dGVzTW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgnbWludXRlcycsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoaW52YWxpZFNlY29uZHMpKSB7XG4gICAgICAgICRzY29wZS5pbnZhbGlkU2Vjb25kcyA9IGludmFsaWRTZWNvbmRzO1xuICAgICAgICBpZiAoc2Vjb25kc01vZGVsQ3RybCkge1xuICAgICAgICAgIHNlY29uZHNNb2RlbEN0cmwuJHNldFZhbGlkaXR5KCdzZWNvbmRzJywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS51cGRhdGVIb3VycyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGhvdXJzID0gZ2V0SG91cnNGcm9tVGVtcGxhdGUoKSxcbiAgICAgICAgbWludXRlcyA9IGdldE1pbnV0ZXNGcm9tVGVtcGxhdGUoKTtcblxuICAgICAgbmdNb2RlbEN0cmwuJHNldERpcnR5KCk7XG5cbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChob3VycykgJiYgYW5ndWxhci5pc0RlZmluZWQobWludXRlcykpIHtcbiAgICAgICAgc2VsZWN0ZWQuc2V0SG91cnMoaG91cnMpO1xuICAgICAgICBzZWxlY3RlZC5zZXRNaW51dGVzKG1pbnV0ZXMpO1xuICAgICAgICBpZiAoc2VsZWN0ZWQgPCBtaW4gfHwgc2VsZWN0ZWQgPiBtYXgpIHtcbiAgICAgICAgICBpbnZhbGlkYXRlKHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlZnJlc2goJ2gnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaG91cnNJbnB1dEVsLm9uKCdibHVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgbmdNb2RlbEN0cmwuJHNldFRvdWNoZWQoKTtcbiAgICAgIGlmIChtb2RlbElzRW1wdHkoKSkge1xuICAgICAgICBtYWtlVmFsaWQoKTtcbiAgICAgIH0gZWxzZSBpZiAoJHNjb3BlLmhvdXJzID09PSBudWxsIHx8ICRzY29wZS5ob3VycyA9PT0gJycpIHtcbiAgICAgICAgaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAoISRzY29wZS5pbnZhbGlkSG91cnMgJiYgJHNjb3BlLmhvdXJzIDwgMTApIHtcbiAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAkc2NvcGUuaG91cnMgPSBwYWQoJHNjb3BlLmhvdXJzLCAhcGFkSG91cnMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRzY29wZS51cGRhdGVNaW51dGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbWludXRlcyA9IGdldE1pbnV0ZXNGcm9tVGVtcGxhdGUoKSxcbiAgICAgICAgaG91cnMgPSBnZXRIb3Vyc0Zyb21UZW1wbGF0ZSgpO1xuXG4gICAgICBuZ01vZGVsQ3RybC4kc2V0RGlydHkoKTtcblxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKG1pbnV0ZXMpICYmIGFuZ3VsYXIuaXNEZWZpbmVkKGhvdXJzKSkge1xuICAgICAgICBzZWxlY3RlZC5zZXRIb3Vycyhob3Vycyk7XG4gICAgICAgIHNlbGVjdGVkLnNldE1pbnV0ZXMobWludXRlcyk7XG4gICAgICAgIGlmIChzZWxlY3RlZCA8IG1pbiB8fCBzZWxlY3RlZCA+IG1heCkge1xuICAgICAgICAgIGludmFsaWRhdGUodW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWZyZXNoKCdtJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGludmFsaWRhdGUodW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbWludXRlc0lucHV0RWwub24oJ2JsdXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBuZ01vZGVsQ3RybC4kc2V0VG91Y2hlZCgpO1xuICAgICAgaWYgKG1vZGVsSXNFbXB0eSgpKSB7XG4gICAgICAgIG1ha2VWYWxpZCgpO1xuICAgICAgfSBlbHNlIGlmICgkc2NvcGUubWludXRlcyA9PT0gbnVsbCkge1xuICAgICAgICBpbnZhbGlkYXRlKHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCEkc2NvcGUuaW52YWxpZE1pbnV0ZXMgJiYgJHNjb3BlLm1pbnV0ZXMgPCAxMCkge1xuICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRzY29wZS5taW51dGVzID0gcGFkKCRzY29wZS5taW51dGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkc2NvcGUudXBkYXRlU2Vjb25kcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlY29uZHMgPSBnZXRTZWNvbmRzRnJvbVRlbXBsYXRlKCk7XG5cbiAgICAgIG5nTW9kZWxDdHJsLiRzZXREaXJ0eSgpO1xuXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2Vjb25kcykpIHtcbiAgICAgICAgc2VsZWN0ZWQuc2V0U2Vjb25kcyhzZWNvbmRzKTtcbiAgICAgICAgcmVmcmVzaCgncycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW52YWxpZGF0ZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNlY29uZHNJbnB1dEVsLm9uKCdibHVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKG1vZGVsSXNFbXB0eSgpKSB7XG4gICAgICAgIG1ha2VWYWxpZCgpO1xuICAgICAgfSBlbHNlIGlmICghJHNjb3BlLmludmFsaWRTZWNvbmRzICYmICRzY29wZS5zZWNvbmRzIDwgMTApIHtcbiAgICAgICAgJHNjb3BlLiRhcHBseSggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLnNlY29uZHMgPSBwYWQoJHNjb3BlLnNlY29uZHMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICB9O1xuXG4gIHRoaXMucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGUgPSBuZ01vZGVsQ3RybC4kdmlld1ZhbHVlO1xuXG4gICAgaWYgKGlzTmFOKGRhdGUpKSB7XG4gICAgICBuZ01vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ3RpbWUnLCBmYWxzZSk7XG4gICAgICAkbG9nLmVycm9yKCdUaW1lcGlja2VyIGRpcmVjdGl2ZTogXCJuZy1tb2RlbFwiIHZhbHVlIG11c3QgYmUgYSBEYXRlIG9iamVjdCwgYSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHNpbmNlIDAxLjAxLjE5NzAgb3IgYSBzdHJpbmcgcmVwcmVzZW50aW5nIGFuIFJGQzI4MjIgb3IgSVNPIDg2MDEgZGF0ZS4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGRhdGUpIHtcbiAgICAgICAgc2VsZWN0ZWQgPSBkYXRlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0ZWQgPCBtaW4gfHwgc2VsZWN0ZWQgPiBtYXgpIHtcbiAgICAgICAgbmdNb2RlbEN0cmwuJHNldFZhbGlkaXR5KCd0aW1lJywgZmFsc2UpO1xuICAgICAgICAkc2NvcGUuaW52YWxpZEhvdXJzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmludmFsaWRNaW51dGVzID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1ha2VWYWxpZCgpO1xuICAgICAgfVxuICAgICAgdXBkYXRlVGVtcGxhdGUoKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gQ2FsbCBpbnRlcm5hbGx5IHdoZW4gd2Uga25vdyB0aGF0IG1vZGVsIGlzIHZhbGlkLlxuICBmdW5jdGlvbiByZWZyZXNoKGtleWJvYXJkQ2hhbmdlKSB7XG4gICAgbWFrZVZhbGlkKCk7XG4gICAgbmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZShuZXcgRGF0ZShzZWxlY3RlZCkpO1xuICAgIHVwZGF0ZVRlbXBsYXRlKGtleWJvYXJkQ2hhbmdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VWYWxpZCgpIHtcbiAgICBpZiAoaG91cnNNb2RlbEN0cmwpIHtcbiAgICAgIGhvdXJzTW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgnaG91cnMnLCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAobWludXRlc01vZGVsQ3RybCkge1xuICAgICAgbWludXRlc01vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ21pbnV0ZXMnLCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAoc2Vjb25kc01vZGVsQ3RybCkge1xuICAgICAgc2Vjb25kc01vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ3NlY29uZHMnLCB0cnVlKTtcbiAgICB9XG5cbiAgICBuZ01vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ3RpbWUnLCB0cnVlKTtcbiAgICAkc2NvcGUuaW52YWxpZEhvdXJzID0gZmFsc2U7XG4gICAgJHNjb3BlLmludmFsaWRNaW51dGVzID0gZmFsc2U7XG4gICAgJHNjb3BlLmludmFsaWRTZWNvbmRzID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVUZW1wbGF0ZShrZXlib2FyZENoYW5nZSkge1xuICAgIGlmICghbmdNb2RlbEN0cmwuJG1vZGVsVmFsdWUpIHtcbiAgICAgICRzY29wZS5ob3VycyA9IG51bGw7XG4gICAgICAkc2NvcGUubWludXRlcyA9IG51bGw7XG4gICAgICAkc2NvcGUuc2Vjb25kcyA9IG51bGw7XG4gICAgICAkc2NvcGUubWVyaWRpYW4gPSBtZXJpZGlhbnNbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBob3VycyA9IHNlbGVjdGVkLmdldEhvdXJzKCksXG4gICAgICAgIG1pbnV0ZXMgPSBzZWxlY3RlZC5nZXRNaW51dGVzKCksXG4gICAgICAgIHNlY29uZHMgPSBzZWxlY3RlZC5nZXRTZWNvbmRzKCk7XG5cbiAgICAgIGlmICgkc2NvcGUuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgIGhvdXJzID0gaG91cnMgPT09IDAgfHwgaG91cnMgPT09IDEyID8gMTIgOiBob3VycyAlIDEyOyAvLyBDb252ZXJ0IDI0IHRvIDEyIGhvdXIgc3lzdGVtXG4gICAgICB9XG5cbiAgICAgICRzY29wZS5ob3VycyA9IGtleWJvYXJkQ2hhbmdlID09PSAnaCcgPyBob3VycyA6IHBhZChob3VycywgIXBhZEhvdXJzKTtcbiAgICAgIGlmIChrZXlib2FyZENoYW5nZSAhPT0gJ20nKSB7XG4gICAgICAgICRzY29wZS5taW51dGVzID0gcGFkKG1pbnV0ZXMpO1xuICAgICAgfVxuICAgICAgJHNjb3BlLm1lcmlkaWFuID0gc2VsZWN0ZWQuZ2V0SG91cnMoKSA8IDEyID8gbWVyaWRpYW5zWzBdIDogbWVyaWRpYW5zWzFdO1xuXG4gICAgICBpZiAoa2V5Ym9hcmRDaGFuZ2UgIT09ICdzJykge1xuICAgICAgICAkc2NvcGUuc2Vjb25kcyA9IHBhZChzZWNvbmRzKTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5tZXJpZGlhbiA9IHNlbGVjdGVkLmdldEhvdXJzKCkgPCAxMiA/IG1lcmlkaWFuc1swXSA6IG1lcmlkaWFuc1sxXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTZWNvbmRzVG9TZWxlY3RlZChzZWNvbmRzKSB7XG4gICAgc2VsZWN0ZWQgPSBhZGRTZWNvbmRzKHNlbGVjdGVkLCBzZWNvbmRzKTtcbiAgICByZWZyZXNoKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRNaW51dGVzKHNlbGVjdGVkLCBtaW51dGVzKSB7XG4gICAgcmV0dXJuIGFkZFNlY29uZHMoc2VsZWN0ZWQsIG1pbnV0ZXMqNjApO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2Vjb25kcyhkYXRlLCBzZWNvbmRzKSB7XG4gICAgdmFyIGR0ID0gbmV3IERhdGUoZGF0ZS5nZXRUaW1lKCkgKyBzZWNvbmRzICogMTAwMCk7XG4gICAgdmFyIG5ld0RhdGUgPSBuZXcgRGF0ZShkYXRlKTtcbiAgICBuZXdEYXRlLnNldEhvdXJzKGR0LmdldEhvdXJzKCksIGR0LmdldE1pbnV0ZXMoKSwgZHQuZ2V0U2Vjb25kcygpKTtcbiAgICByZXR1cm4gbmV3RGF0ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vZGVsSXNFbXB0eSgpIHtcbiAgICByZXR1cm4gKCRzY29wZS5ob3VycyA9PT0gbnVsbCB8fCAkc2NvcGUuaG91cnMgPT09ICcnKSAmJlxuICAgICAgKCRzY29wZS5taW51dGVzID09PSBudWxsIHx8ICRzY29wZS5taW51dGVzID09PSAnJykgJiZcbiAgICAgICghJHNjb3BlLnNob3dTZWNvbmRzIHx8ICRzY29wZS5zaG93U2Vjb25kcyAmJiAoJHNjb3BlLnNlY29uZHMgPT09IG51bGwgfHwgJHNjb3BlLnNlY29uZHMgPT09ICcnKSk7XG4gIH1cblxuICAkc2NvcGUuc2hvd1NwaW5uZXJzID0gYW5ndWxhci5pc0RlZmluZWQoJGF0dHJzLnNob3dTcGlubmVycykgP1xuICAgICRzY29wZS4kcGFyZW50LiRldmFsKCRhdHRycy5zaG93U3Bpbm5lcnMpIDogdGltZXBpY2tlckNvbmZpZy5zaG93U3Bpbm5lcnM7XG5cbiAgJHNjb3BlLmluY3JlbWVudEhvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEkc2NvcGUubm9JbmNyZW1lbnRIb3VycygpKSB7XG4gICAgICBhZGRTZWNvbmRzVG9TZWxlY3RlZChob3VyU3RlcCAqIDYwICogNjApO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZGVjcmVtZW50SG91cnMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoISRzY29wZS5ub0RlY3JlbWVudEhvdXJzKCkpIHtcbiAgICAgIGFkZFNlY29uZHNUb1NlbGVjdGVkKC1ob3VyU3RlcCAqIDYwICogNjApO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuaW5jcmVtZW50TWludXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghJHNjb3BlLm5vSW5jcmVtZW50TWludXRlcygpKSB7XG4gICAgICBhZGRTZWNvbmRzVG9TZWxlY3RlZChtaW51dGVTdGVwICogNjApO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuZGVjcmVtZW50TWludXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghJHNjb3BlLm5vRGVjcmVtZW50TWludXRlcygpKSB7XG4gICAgICBhZGRTZWNvbmRzVG9TZWxlY3RlZCgtbWludXRlU3RlcCAqIDYwKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmluY3JlbWVudFNlY29uZHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoISRzY29wZS5ub0luY3JlbWVudFNlY29uZHMoKSkge1xuICAgICAgYWRkU2Vjb25kc1RvU2VsZWN0ZWQoc2Vjb25kU3RlcCk7XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5kZWNyZW1lbnRTZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEkc2NvcGUubm9EZWNyZW1lbnRTZWNvbmRzKCkpIHtcbiAgICAgIGFkZFNlY29uZHNUb1NlbGVjdGVkKC1zZWNvbmRTdGVwKTtcbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZU1lcmlkaWFuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1pbnV0ZXMgPSBnZXRNaW51dGVzRnJvbVRlbXBsYXRlKCksXG4gICAgICAgIGhvdXJzID0gZ2V0SG91cnNGcm9tVGVtcGxhdGUoKTtcblxuICAgIGlmICghJHNjb3BlLm5vVG9nZ2xlTWVyaWRpYW4oKSkge1xuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKG1pbnV0ZXMpICYmIGFuZ3VsYXIuaXNEZWZpbmVkKGhvdXJzKSkge1xuICAgICAgICBhZGRTZWNvbmRzVG9TZWxlY3RlZCgxMiAqIDYwICogKHNlbGVjdGVkLmdldEhvdXJzKCkgPCAxMiA/IDYwIDogLTYwKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUubWVyaWRpYW4gPSAkc2NvcGUubWVyaWRpYW4gPT09IG1lcmlkaWFuc1swXSA/IG1lcmlkaWFuc1sxXSA6IG1lcmlkaWFuc1swXTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLmJsdXIgPSBmdW5jdGlvbigpIHtcbiAgICBuZ01vZGVsQ3RybC4kc2V0VG91Y2hlZCgpO1xuICB9O1xuXG4gICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgd2hpbGUgKHdhdGNoZXJzLmxlbmd0aCkge1xuICAgICAgd2F0Y2hlcnMuc2hpZnQoKSgpO1xuICAgIH1cbiAgfSk7XG59XSlcblxuLmRpcmVjdGl2ZSgndWliVGltZXBpY2tlcicsIFsndWliVGltZXBpY2tlckNvbmZpZycsIGZ1bmN0aW9uKHVpYlRpbWVwaWNrZXJDb25maWcpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiBbJ3VpYlRpbWVwaWNrZXInLCAnP15uZ01vZGVsJ10sXG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBjb250cm9sbGVyOiAnVWliVGltZXBpY2tlckNvbnRyb2xsZXInLFxuICAgIGNvbnRyb2xsZXJBczogJ3RpbWVwaWNrZXInLFxuICAgIHNjb3BlOiB7fSxcbiAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHJldHVybiBhdHRycy50ZW1wbGF0ZVVybCB8fCB1aWJUaW1lcGlja2VyQ29uZmlnLnRlbXBsYXRlVXJsO1xuICAgIH0sXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgdmFyIHRpbWVwaWNrZXJDdHJsID0gY3RybHNbMF0sIG5nTW9kZWxDdHJsID0gY3RybHNbMV07XG5cbiAgICAgIGlmIChuZ01vZGVsQ3RybCkge1xuICAgICAgICB0aW1lcGlja2VyQ3RybC5pbml0KG5nTW9kZWxDdHJsLCBlbGVtZW50LmZpbmQoJ2lucHV0JykpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC50eXBlYWhlYWQnLCBbJ3VpLmJvb3RzdHJhcC5kZWJvdW5jZScsICd1aS5ib290c3RyYXAucG9zaXRpb24nXSlcblxuLyoqXG4gKiBBIGhlbHBlciBzZXJ2aWNlIHRoYXQgY2FuIHBhcnNlIHR5cGVhaGVhZCdzIHN5bnRheCAoc3RyaW5nIHByb3ZpZGVkIGJ5IHVzZXJzKVxuICogRXh0cmFjdGVkIHRvIGEgc2VwYXJhdGUgc2VydmljZSBmb3IgZWFzZSBvZiB1bml0IHRlc3RpbmdcbiAqL1xuICAuZmFjdG9yeSgndWliVHlwZWFoZWFkUGFyc2VyJywgWyckcGFyc2UnLCBmdW5jdGlvbigkcGFyc2UpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAwMDAwMDExMTExMTExMDAwMDAwMDAwMDAwMDIyMjIyMjIyMDAwMDAwMDAwMDAwMDAwMDMzMzMzMzMzMzMzMzMzMzAwMDAwMDAwMDAwNDQ0NDQ0NDQwMDBcbiAgICB2YXIgVFlQRUFIRUFEX1JFR0VYUCA9IC9eXFxzKihbXFxzXFxTXSs/KSg/Olxccythc1xccysoW1xcc1xcU10rPykpP1xccytmb3JcXHMrKD86KFtcXCRcXHddW1xcJFxcd1xcZF0qKSlcXHMraW5cXHMrKFtcXHNcXFNdKz8pJC87XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhcnNlOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgbWF0Y2ggPSBpbnB1dC5tYXRjaChUWVBFQUhFQURfUkVHRVhQKTtcbiAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdFeHBlY3RlZCB0eXBlYWhlYWQgc3BlY2lmaWNhdGlvbiBpbiBmb3JtIG9mIFwiX21vZGVsVmFsdWVfIChhcyBfbGFiZWxfKT8gZm9yIF9pdGVtXyBpbiBfY29sbGVjdGlvbl9cIicgK1xuICAgICAgICAgICAgICAnIGJ1dCBnb3QgXCInICsgaW5wdXQgKyAnXCIuJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGl0ZW1OYW1lOiBtYXRjaFszXSxcbiAgICAgICAgICBzb3VyY2U6ICRwYXJzZShtYXRjaFs0XSksXG4gICAgICAgICAgdmlld01hcHBlcjogJHBhcnNlKG1hdGNoWzJdIHx8IG1hdGNoWzFdKSxcbiAgICAgICAgICBtb2RlbE1hcHBlcjogJHBhcnNlKG1hdGNoWzFdKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG4gIH1dKVxuXG4gIC5jb250cm9sbGVyKCdVaWJUeXBlYWhlYWRDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJGF0dHJzJywgJyRjb21waWxlJywgJyRwYXJzZScsICckcScsICckdGltZW91dCcsICckZG9jdW1lbnQnLCAnJHdpbmRvdycsICckcm9vdFNjb3BlJywgJyQkZGVib3VuY2UnLCAnJHVpYlBvc2l0aW9uJywgJ3VpYlR5cGVhaGVhZFBhcnNlcicsXG4gICAgZnVuY3Rpb24ob3JpZ2luYWxTY29wZSwgZWxlbWVudCwgYXR0cnMsICRjb21waWxlLCAkcGFyc2UsICRxLCAkdGltZW91dCwgJGRvY3VtZW50LCAkd2luZG93LCAkcm9vdFNjb3BlLCAkJGRlYm91bmNlLCAkcG9zaXRpb24sIHR5cGVhaGVhZFBhcnNlcikge1xuICAgIHZhciBIT1RfS0VZUyA9IFs5LCAxMywgMjcsIDM4LCA0MF07XG4gICAgdmFyIGV2ZW50RGVib3VuY2VUaW1lID0gMjAwO1xuICAgIHZhciBtb2RlbEN0cmwsIG5nTW9kZWxPcHRpb25zO1xuICAgIC8vU1VQUE9SVEVEIEFUVFJJQlVURVMgKE9QVElPTlMpXG5cbiAgICAvL21pbmltYWwgbm8gb2YgY2hhcmFjdGVycyB0aGF0IG5lZWRzIHRvIGJlIGVudGVyZWQgYmVmb3JlIHR5cGVhaGVhZCBraWNrcy1pblxuICAgIHZhciBtaW5MZW5ndGggPSBvcmlnaW5hbFNjb3BlLiRldmFsKGF0dHJzLnR5cGVhaGVhZE1pbkxlbmd0aCk7XG4gICAgaWYgKCFtaW5MZW5ndGggJiYgbWluTGVuZ3RoICE9PSAwKSB7XG4gICAgICBtaW5MZW5ndGggPSAxO1xuICAgIH1cblxuICAgIG9yaWdpbmFsU2NvcGUuJHdhdGNoKGF0dHJzLnR5cGVhaGVhZE1pbkxlbmd0aCwgZnVuY3Rpb24gKG5ld1ZhbCkge1xuICAgICAgICBtaW5MZW5ndGggPSAhbmV3VmFsICYmIG5ld1ZhbCAhPT0gMCA/IDEgOiBuZXdWYWw7XG4gICAgfSk7XG5cbiAgICAvL21pbmltYWwgd2FpdCB0aW1lIGFmdGVyIGxhc3QgY2hhcmFjdGVyIHR5cGVkIGJlZm9yZSB0eXBlYWhlYWQga2lja3MtaW5cbiAgICB2YXIgd2FpdFRpbWUgPSBvcmlnaW5hbFNjb3BlLiRldmFsKGF0dHJzLnR5cGVhaGVhZFdhaXRNcykgfHwgMDtcblxuICAgIC8vc2hvdWxkIGl0IHJlc3RyaWN0IG1vZGVsIHZhbHVlcyB0byB0aGUgb25lcyBzZWxlY3RlZCBmcm9tIHRoZSBwb3B1cCBvbmx5P1xuICAgIHZhciBpc0VkaXRhYmxlID0gb3JpZ2luYWxTY29wZS4kZXZhbChhdHRycy50eXBlYWhlYWRFZGl0YWJsZSkgIT09IGZhbHNlO1xuICAgIG9yaWdpbmFsU2NvcGUuJHdhdGNoKGF0dHJzLnR5cGVhaGVhZEVkaXRhYmxlLCBmdW5jdGlvbiAobmV3VmFsKSB7XG4gICAgICBpc0VkaXRhYmxlID0gbmV3VmFsICE9PSBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8vYmluZGluZyB0byBhIHZhcmlhYmxlIHRoYXQgaW5kaWNhdGVzIGlmIG1hdGNoZXMgYXJlIGJlaW5nIHJldHJpZXZlZCBhc3luY2hyb25vdXNseVxuICAgIHZhciBpc0xvYWRpbmdTZXR0ZXIgPSAkcGFyc2UoYXR0cnMudHlwZWFoZWFkTG9hZGluZykuYXNzaWduIHx8IGFuZ3VsYXIubm9vcDtcblxuICAgIC8vYSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgaWYgYW4gZXZlbnQgc2hvdWxkIGNhdXNlIHNlbGVjdGlvblxuICAgIHZhciBpc1NlbGVjdEV2ZW50ID0gYXR0cnMudHlwZWFoZWFkU2hvdWxkU2VsZWN0ID8gJHBhcnNlKGF0dHJzLnR5cGVhaGVhZFNob3VsZFNlbGVjdCkgOiBmdW5jdGlvbihzY29wZSwgdmFscykge1xuICAgICAgdmFyIGV2dCA9IHZhbHMuJGV2ZW50O1xuICAgICAgcmV0dXJuIGV2dC53aGljaCA9PT0gMTMgfHwgZXZ0LndoaWNoID09PSA5O1xuICAgIH07XG5cbiAgICAvL2EgY2FsbGJhY2sgZXhlY3V0ZWQgd2hlbiBhIG1hdGNoIGlzIHNlbGVjdGVkXG4gICAgdmFyIG9uU2VsZWN0Q2FsbGJhY2sgPSAkcGFyc2UoYXR0cnMudHlwZWFoZWFkT25TZWxlY3QpO1xuXG4gICAgLy9zaG91bGQgaXQgc2VsZWN0IGhpZ2hsaWdodGVkIHBvcHVwIHZhbHVlIHdoZW4gbG9zaW5nIGZvY3VzP1xuICAgIHZhciBpc1NlbGVjdE9uQmx1ciA9IGFuZ3VsYXIuaXNEZWZpbmVkKGF0dHJzLnR5cGVhaGVhZFNlbGVjdE9uQmx1cikgPyBvcmlnaW5hbFNjb3BlLiRldmFsKGF0dHJzLnR5cGVhaGVhZFNlbGVjdE9uQmx1cikgOiBmYWxzZTtcblxuICAgIC8vYmluZGluZyB0byBhIHZhcmlhYmxlIHRoYXQgaW5kaWNhdGVzIGlmIHRoZXJlIHdlcmUgbm8gcmVzdWx0cyBhZnRlciB0aGUgcXVlcnkgaXMgY29tcGxldGVkXG4gICAgdmFyIGlzTm9SZXN1bHRzU2V0dGVyID0gJHBhcnNlKGF0dHJzLnR5cGVhaGVhZE5vUmVzdWx0cykuYXNzaWduIHx8IGFuZ3VsYXIubm9vcDtcblxuICAgIHZhciBpbnB1dEZvcm1hdHRlciA9IGF0dHJzLnR5cGVhaGVhZElucHV0Rm9ybWF0dGVyID8gJHBhcnNlKGF0dHJzLnR5cGVhaGVhZElucHV0Rm9ybWF0dGVyKSA6IHVuZGVmaW5lZDtcblxuICAgIHZhciBhcHBlbmRUb0JvZHkgPSBhdHRycy50eXBlYWhlYWRBcHBlbmRUb0JvZHkgPyBvcmlnaW5hbFNjb3BlLiRldmFsKGF0dHJzLnR5cGVhaGVhZEFwcGVuZFRvQm9keSkgOiBmYWxzZTtcblxuICAgIHZhciBhcHBlbmRUbyA9IGF0dHJzLnR5cGVhaGVhZEFwcGVuZFRvID9cbiAgICAgIG9yaWdpbmFsU2NvcGUuJGV2YWwoYXR0cnMudHlwZWFoZWFkQXBwZW5kVG8pIDogbnVsbDtcblxuICAgIHZhciBmb2N1c0ZpcnN0ID0gb3JpZ2luYWxTY29wZS4kZXZhbChhdHRycy50eXBlYWhlYWRGb2N1c0ZpcnN0KSAhPT0gZmFsc2U7XG5cbiAgICAvL0lmIGlucHV0IG1hdGNoZXMgYW4gaXRlbSBvZiB0aGUgbGlzdCBleGFjdGx5LCBzZWxlY3QgaXQgYXV0b21hdGljYWxseVxuICAgIHZhciBzZWxlY3RPbkV4YWN0ID0gYXR0cnMudHlwZWFoZWFkU2VsZWN0T25FeGFjdCA/IG9yaWdpbmFsU2NvcGUuJGV2YWwoYXR0cnMudHlwZWFoZWFkU2VsZWN0T25FeGFjdCkgOiBmYWxzZTtcblxuICAgIC8vYmluZGluZyB0byBhIHZhcmlhYmxlIHRoYXQgaW5kaWNhdGVzIGlmIGRyb3Bkb3duIGlzIG9wZW5cbiAgICB2YXIgaXNPcGVuU2V0dGVyID0gJHBhcnNlKGF0dHJzLnR5cGVhaGVhZElzT3BlbikuYXNzaWduIHx8IGFuZ3VsYXIubm9vcDtcblxuICAgIHZhciBzaG93SGludCA9IG9yaWdpbmFsU2NvcGUuJGV2YWwoYXR0cnMudHlwZWFoZWFkU2hvd0hpbnQpIHx8IGZhbHNlO1xuXG4gICAgLy9JTlRFUk5BTCBWQVJJQUJMRVNcblxuICAgIC8vbW9kZWwgc2V0dGVyIGV4ZWN1dGVkIHVwb24gbWF0Y2ggc2VsZWN0aW9uXG4gICAgdmFyIHBhcnNlZE1vZGVsID0gJHBhcnNlKGF0dHJzLm5nTW9kZWwpO1xuICAgIHZhciBpbnZva2VNb2RlbFNldHRlciA9ICRwYXJzZShhdHRycy5uZ01vZGVsICsgJygkJCRwKScpO1xuICAgIHZhciAkc2V0TW9kZWxWYWx1ZSA9IGZ1bmN0aW9uKHNjb3BlLCBuZXdWYWx1ZSkge1xuICAgICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbihwYXJzZWRNb2RlbChvcmlnaW5hbFNjb3BlKSkgJiZcbiAgICAgICAgbmdNb2RlbE9wdGlvbnMuZ2V0T3B0aW9uKCdnZXR0ZXJTZXR0ZXInKSkge1xuICAgICAgICByZXR1cm4gaW52b2tlTW9kZWxTZXR0ZXIoc2NvcGUsIHskJCRwOiBuZXdWYWx1ZX0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFyc2VkTW9kZWwuYXNzaWduKHNjb3BlLCBuZXdWYWx1ZSk7XG4gICAgfTtcblxuICAgIC8vZXhwcmVzc2lvbnMgdXNlZCBieSB0eXBlYWhlYWRcbiAgICB2YXIgcGFyc2VyUmVzdWx0ID0gdHlwZWFoZWFkUGFyc2VyLnBhcnNlKGF0dHJzLnVpYlR5cGVhaGVhZCk7XG5cbiAgICB2YXIgaGFzRm9jdXM7XG5cbiAgICAvL1VzZWQgdG8gYXZvaWQgYnVnIGluIGlPUyB3ZWJ2aWV3IHdoZXJlIGlPUyBrZXlib2FyZCBkb2VzIG5vdCBmaXJlXG4gICAgLy9tb3VzZWRvd24gJiBtb3VzZXVwIGV2ZW50c1xuICAgIC8vSXNzdWUgIzM2OTlcbiAgICB2YXIgc2VsZWN0ZWQ7XG5cbiAgICAvL2NyZWF0ZSBhIGNoaWxkIHNjb3BlIGZvciB0aGUgdHlwZWFoZWFkIGRpcmVjdGl2ZSBzbyB3ZSBhcmUgbm90IHBvbGx1dGluZyBvcmlnaW5hbCBzY29wZVxuICAgIC8vd2l0aCB0eXBlYWhlYWQtc3BlY2lmaWMgZGF0YSAobWF0Y2hlcywgcXVlcnkgZXRjLilcbiAgICB2YXIgc2NvcGUgPSBvcmlnaW5hbFNjb3BlLiRuZXcoKTtcbiAgICB2YXIgb2ZmRGVzdHJveSA9IG9yaWdpbmFsU2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgc2NvcGUuJGRlc3Ryb3koKTtcbiAgICB9KTtcbiAgICBzY29wZS4kb24oJyRkZXN0cm95Jywgb2ZmRGVzdHJveSk7XG5cbiAgICAvLyBXQUktQVJJQVxuICAgIHZhciBwb3B1cElkID0gJ3R5cGVhaGVhZC0nICsgc2NvcGUuJGlkICsgJy0nICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDApO1xuICAgIGVsZW1lbnQuYXR0cih7XG4gICAgICAnYXJpYS1hdXRvY29tcGxldGUnOiAnbGlzdCcsXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgJ2FyaWEtb3ducyc6IHBvcHVwSWRcbiAgICB9KTtcblxuICAgIHZhciBpbnB1dHNDb250YWluZXIsIGhpbnRJbnB1dEVsZW07XG4gICAgLy9hZGQgcmVhZC1vbmx5IGlucHV0IHRvIHNob3cgaGludFxuICAgIGlmIChzaG93SGludCkge1xuICAgICAgaW5wdXRzQ29udGFpbmVyID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpO1xuICAgICAgaW5wdXRzQ29udGFpbmVyLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcbiAgICAgIGVsZW1lbnQuYWZ0ZXIoaW5wdXRzQ29udGFpbmVyKTtcbiAgICAgIGhpbnRJbnB1dEVsZW0gPSBlbGVtZW50LmNsb25lKCk7XG4gICAgICBoaW50SW5wdXRFbGVtLmF0dHIoJ3BsYWNlaG9sZGVyJywgJycpO1xuICAgICAgaGludElucHV0RWxlbS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgaGludElucHV0RWxlbS52YWwoJycpO1xuICAgICAgaGludElucHV0RWxlbS5jc3Moe1xuICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxuICAgICAgICAndG9wJzogJzBweCcsXG4gICAgICAgICdsZWZ0JzogJzBweCcsXG4gICAgICAgICdib3JkZXItY29sb3InOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAnYm94LXNoYWRvdyc6ICdub25lJyxcbiAgICAgICAgJ29wYWNpdHknOiAxLFxuICAgICAgICAnYmFja2dyb3VuZCc6ICdub25lIDAlIDAlIC8gYXV0byByZXBlYXQgc2Nyb2xsIHBhZGRpbmctYm94IGJvcmRlci1ib3ggcmdiKDI1NSwgMjU1LCAyNTUpJyxcbiAgICAgICAgJ2NvbG9yJzogJyM5OTknXG4gICAgICB9KTtcbiAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgJ3Bvc2l0aW9uJzogJ3JlbGF0aXZlJyxcbiAgICAgICAgJ3ZlcnRpY2FsLWFsaWduJzogJ3RvcCcsXG4gICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50J1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChoaW50SW5wdXRFbGVtLmF0dHIoJ2lkJykpIHtcbiAgICAgICAgaGludElucHV0RWxlbS5yZW1vdmVBdHRyKCdpZCcpOyAvLyByZW1vdmUgZHVwbGljYXRlIGlkIGlmIHByZXNlbnQuXG4gICAgICB9XG4gICAgICBpbnB1dHNDb250YWluZXIuYXBwZW5kKGhpbnRJbnB1dEVsZW0pO1xuICAgICAgaGludElucHV0RWxlbS5hZnRlcihlbGVtZW50KTtcbiAgICB9XG5cbiAgICAvL3BvcC11cCBlbGVtZW50IHVzZWQgdG8gZGlzcGxheSBtYXRjaGVzXG4gICAgdmFyIHBvcFVwRWwgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgdWliLXR5cGVhaGVhZC1wb3B1cD48L2Rpdj4nKTtcbiAgICBwb3BVcEVsLmF0dHIoe1xuICAgICAgaWQ6IHBvcHVwSWQsXG4gICAgICBtYXRjaGVzOiAnbWF0Y2hlcycsXG4gICAgICBhY3RpdmU6ICdhY3RpdmVJZHgnLFxuICAgICAgc2VsZWN0OiAnc2VsZWN0KGFjdGl2ZUlkeCwgZXZ0KScsXG4gICAgICAnbW92ZS1pbi1wcm9ncmVzcyc6ICdtb3ZlSW5Qcm9ncmVzcycsXG4gICAgICBxdWVyeTogJ3F1ZXJ5JyxcbiAgICAgIHBvc2l0aW9uOiAncG9zaXRpb24nLFxuICAgICAgJ2Fzc2lnbi1pcy1vcGVuJzogJ2Fzc2lnbklzT3Blbihpc09wZW4pJyxcbiAgICAgIGRlYm91bmNlOiAnZGVib3VuY2VVcGRhdGUnXG4gICAgfSk7XG4gICAgLy9jdXN0b20gaXRlbSB0ZW1wbGF0ZVxuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChhdHRycy50eXBlYWhlYWRUZW1wbGF0ZVVybCkpIHtcbiAgICAgIHBvcFVwRWwuYXR0cigndGVtcGxhdGUtdXJsJywgYXR0cnMudHlwZWFoZWFkVGVtcGxhdGVVcmwpO1xuICAgIH1cblxuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChhdHRycy50eXBlYWhlYWRQb3B1cFRlbXBsYXRlVXJsKSkge1xuICAgICAgcG9wVXBFbC5hdHRyKCdwb3B1cC10ZW1wbGF0ZS11cmwnLCBhdHRycy50eXBlYWhlYWRQb3B1cFRlbXBsYXRlVXJsKTtcbiAgICB9XG5cbiAgICB2YXIgcmVzZXRIaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2hvd0hpbnQpIHtcbiAgICAgICAgaGludElucHV0RWxlbS52YWwoJycpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcmVzZXRNYXRjaGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICBzY29wZS5tYXRjaGVzID0gW107XG4gICAgICBzY29wZS5hY3RpdmVJZHggPSAtMTtcbiAgICAgIGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcbiAgICAgIHJlc2V0SGludCgpO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0TWF0Y2hJZCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICByZXR1cm4gcG9wdXBJZCArICctb3B0aW9uLScgKyBpbmRleDtcbiAgICB9O1xuXG4gICAgLy8gSW5kaWNhdGUgdGhhdCB0aGUgc3BlY2lmaWVkIG1hdGNoIGlzIHRoZSBhY3RpdmUgKHByZS1zZWxlY3RlZCkgaXRlbSBpbiB0aGUgbGlzdCBvd25lZCBieSB0aGlzIHR5cGVhaGVhZC5cbiAgICAvLyBUaGlzIGF0dHJpYnV0ZSBpcyBhZGRlZCBvciByZW1vdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGUgYGFjdGl2ZUlkeGAgY2hhbmdlcy5cbiAgICBzY29wZS4kd2F0Y2goJ2FjdGl2ZUlkeCcsIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cignYXJpYS1hY3RpdmVkZXNjZW5kYW50Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LmF0dHIoJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcsIGdldE1hdGNoSWQoaW5kZXgpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBpbnB1dElzRXhhY3RNYXRjaCA9IGZ1bmN0aW9uKGlucHV0VmFsdWUsIGluZGV4KSB7XG4gICAgICBpZiAoc2NvcGUubWF0Y2hlcy5sZW5ndGggPiBpbmRleCAmJiBpbnB1dFZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpbnB1dFZhbHVlLnRvVXBwZXJDYXNlKCkgPT09IHNjb3BlLm1hdGNoZXNbaW5kZXhdLmxhYmVsLnRvVXBwZXJDYXNlKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIGdldE1hdGNoZXNBc3luYyA9IGZ1bmN0aW9uKGlucHV0VmFsdWUsIGV2dCkge1xuICAgICAgdmFyIGxvY2FscyA9IHskdmlld1ZhbHVlOiBpbnB1dFZhbHVlfTtcbiAgICAgIGlzTG9hZGluZ1NldHRlcihvcmlnaW5hbFNjb3BlLCB0cnVlKTtcbiAgICAgIGlzTm9SZXN1bHRzU2V0dGVyKG9yaWdpbmFsU2NvcGUsIGZhbHNlKTtcbiAgICAgICRxLndoZW4ocGFyc2VyUmVzdWx0LnNvdXJjZShvcmlnaW5hbFNjb3BlLCBsb2NhbHMpKS50aGVuKGZ1bmN0aW9uKG1hdGNoZXMpIHtcbiAgICAgICAgLy9pdCBtaWdodCBoYXBwZW4gdGhhdCBzZXZlcmFsIGFzeW5jIHF1ZXJpZXMgd2VyZSBpbiBwcm9ncmVzcyBpZiBhIHVzZXIgd2VyZSB0eXBpbmcgZmFzdFxuICAgICAgICAvL2J1dCB3ZSBhcmUgaW50ZXJlc3RlZCBvbmx5IGluIHJlc3BvbnNlcyB0aGF0IGNvcnJlc3BvbmQgdG8gdGhlIGN1cnJlbnQgdmlldyB2YWx1ZVxuICAgICAgICB2YXIgb25DdXJyZW50UmVxdWVzdCA9IGlucHV0VmFsdWUgPT09IG1vZGVsQ3RybC4kdmlld1ZhbHVlO1xuICAgICAgICBpZiAob25DdXJyZW50UmVxdWVzdCAmJiBoYXNGb2N1cykge1xuICAgICAgICAgIGlmIChtYXRjaGVzICYmIG1hdGNoZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2NvcGUuYWN0aXZlSWR4ID0gZm9jdXNGaXJzdCA/IDAgOiAtMTtcbiAgICAgICAgICAgIGlzTm9SZXN1bHRzU2V0dGVyKG9yaWdpbmFsU2NvcGUsIGZhbHNlKTtcbiAgICAgICAgICAgIHNjb3BlLm1hdGNoZXMubGVuZ3RoID0gMDtcblxuICAgICAgICAgICAgLy90cmFuc2Zvcm0gbGFiZWxzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgbG9jYWxzW3BhcnNlclJlc3VsdC5pdGVtTmFtZV0gPSBtYXRjaGVzW2ldO1xuICAgICAgICAgICAgICBzY29wZS5tYXRjaGVzLnB1c2goe1xuICAgICAgICAgICAgICAgIGlkOiBnZXRNYXRjaElkKGkpLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBwYXJzZXJSZXN1bHQudmlld01hcHBlcihzY29wZSwgbG9jYWxzKSxcbiAgICAgICAgICAgICAgICBtb2RlbDogbWF0Y2hlc1tpXVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUucXVlcnkgPSBpbnB1dFZhbHVlO1xuICAgICAgICAgICAgLy9wb3NpdGlvbiBwb3AtdXAgd2l0aCBtYXRjaGVzIC0gd2UgbmVlZCB0byByZS1jYWxjdWxhdGUgaXRzIHBvc2l0aW9uIGVhY2ggdGltZSB3ZSBhcmUgb3BlbmluZyBhIHdpbmRvd1xuICAgICAgICAgICAgLy93aXRoIG1hdGNoZXMgYXMgYSBwb3AtdXAgbWlnaHQgYmUgYWJzb2x1dGUtcG9zaXRpb25lZCBhbmQgcG9zaXRpb24gb2YgYW4gaW5wdXQgbWlnaHQgaGF2ZSBjaGFuZ2VkIG9uIGEgcGFnZVxuICAgICAgICAgICAgLy9kdWUgdG8gb3RoZXIgZWxlbWVudHMgYmVpbmcgcmVuZGVyZWRcbiAgICAgICAgICAgIHJlY2FsY3VsYXRlUG9zaXRpb24oKTtcblxuICAgICAgICAgICAgZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vU2VsZWN0IHRoZSBzaW5nbGUgcmVtYWluaW5nIG9wdGlvbiBpZiB1c2VyIGlucHV0IG1hdGNoZXNcbiAgICAgICAgICAgIGlmIChzZWxlY3RPbkV4YWN0ICYmIHNjb3BlLm1hdGNoZXMubGVuZ3RoID09PSAxICYmIGlucHV0SXNFeGFjdE1hdGNoKGlucHV0VmFsdWUsIDApKSB7XG4gICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzTnVtYmVyKHNjb3BlLmRlYm91bmNlVXBkYXRlKSB8fCBhbmd1bGFyLmlzT2JqZWN0KHNjb3BlLmRlYm91bmNlVXBkYXRlKSkge1xuICAgICAgICAgICAgICAgICQkZGVib3VuY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBzY29wZS5zZWxlY3QoMCwgZXZ0KTtcbiAgICAgICAgICAgICAgICB9LCBhbmd1bGFyLmlzTnVtYmVyKHNjb3BlLmRlYm91bmNlVXBkYXRlKSA/IHNjb3BlLmRlYm91bmNlVXBkYXRlIDogc2NvcGUuZGVib3VuY2VVcGRhdGVbJ2RlZmF1bHQnXSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuc2VsZWN0KDAsIGV2dCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNob3dIaW50KSB7XG4gICAgICAgICAgICAgIHZhciBmaXJzdExhYmVsID0gc2NvcGUubWF0Y2hlc1swXS5sYWJlbDtcbiAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNTdHJpbmcoaW5wdXRWYWx1ZSkgJiZcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICBmaXJzdExhYmVsLnNsaWNlKDAsIGlucHV0VmFsdWUubGVuZ3RoKS50b1VwcGVyQ2FzZSgpID09PSBpbnB1dFZhbHVlLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBoaW50SW5wdXRFbGVtLnZhbChpbnB1dFZhbHVlICsgZmlyc3RMYWJlbC5zbGljZShpbnB1dFZhbHVlLmxlbmd0aCkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhpbnRJbnB1dEVsZW0udmFsKCcnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNldE1hdGNoZXMoKTtcbiAgICAgICAgICAgIGlzTm9SZXN1bHRzU2V0dGVyKG9yaWdpbmFsU2NvcGUsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob25DdXJyZW50UmVxdWVzdCkge1xuICAgICAgICAgIGlzTG9hZGluZ1NldHRlcihvcmlnaW5hbFNjb3BlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNldE1hdGNoZXMoKTtcbiAgICAgICAgaXNMb2FkaW5nU2V0dGVyKG9yaWdpbmFsU2NvcGUsIGZhbHNlKTtcbiAgICAgICAgaXNOb1Jlc3VsdHNTZXR0ZXIob3JpZ2luYWxTY29wZSwgdHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gYmluZCBldmVudHMgb25seSBpZiBhcHBlbmRUb0JvZHkgcGFyYW1zIGV4aXN0IC0gcGVyZm9ybWFuY2UgZmVhdHVyZVxuICAgIGlmIChhcHBlbmRUb0JvZHkpIHtcbiAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5vbigncmVzaXplJywgZmlyZVJlY2FsY3VsYXRpbmcpO1xuICAgICAgJGRvY3VtZW50LmZpbmQoJ2JvZHknKS5vbignc2Nyb2xsJywgZmlyZVJlY2FsY3VsYXRpbmcpO1xuICAgIH1cblxuICAgIC8vIERlY2xhcmUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBvdXRzaWRlIHJlY2FsY3VsYXRpbmcgZm9yXG4gICAgLy8gcHJvcGVyIGRlYm91bmNpbmdcbiAgICB2YXIgZGVib3VuY2VkUmVjYWxjdWxhdGUgPSAkJGRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaWYgcG9wdXAgaXMgdmlzaWJsZVxuICAgICAgaWYgKHNjb3BlLm1hdGNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJlY2FsY3VsYXRlUG9zaXRpb24oKTtcbiAgICAgIH1cblxuICAgICAgc2NvcGUubW92ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICB9LCBldmVudERlYm91bmNlVGltZSk7XG5cbiAgICAvLyBEZWZhdWx0IHByb2dyZXNzIHR5cGVcbiAgICBzY29wZS5tb3ZlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gZmlyZVJlY2FsY3VsYXRpbmcoKSB7XG4gICAgICBpZiAoIXNjb3BlLm1vdmVJblByb2dyZXNzKSB7XG4gICAgICAgIHNjb3BlLm1vdmVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgfVxuXG4gICAgICBkZWJvdW5jZWRSZWNhbGN1bGF0ZSgpO1xuICAgIH1cblxuICAgIC8vIHJlY2FsY3VsYXRlIGFjdHVhbCBwb3NpdGlvbiBhbmQgc2V0IG5ldyB2YWx1ZXMgdG8gc2NvcGVcbiAgICAvLyBhZnRlciBkaWdlc3QgbG9vcCBpcyBwb3B1cCBpbiByaWdodCBwb3NpdGlvblxuICAgIGZ1bmN0aW9uIHJlY2FsY3VsYXRlUG9zaXRpb24oKSB7XG4gICAgICBzY29wZS5wb3NpdGlvbiA9IGFwcGVuZFRvQm9keSA/ICRwb3NpdGlvbi5vZmZzZXQoZWxlbWVudCkgOiAkcG9zaXRpb24ucG9zaXRpb24oZWxlbWVudCk7XG4gICAgICBzY29wZS5wb3NpdGlvbi50b3AgKz0gZWxlbWVudC5wcm9wKCdvZmZzZXRIZWlnaHQnKTtcbiAgICB9XG5cbiAgICAvL3dlIG5lZWQgdG8gcHJvcGFnYXRlIHVzZXIncyBxdWVyeSBzbyB3ZSBjYW4gaGlnbGlnaHQgbWF0Y2hlc1xuICAgIHNjb3BlLnF1ZXJ5ID0gdW5kZWZpbmVkO1xuXG4gICAgLy9EZWNsYXJlIHRoZSB0aW1lb3V0IHByb21pc2UgdmFyIG91dHNpZGUgdGhlIGZ1bmN0aW9uIHNjb3BlIHNvIHRoYXQgc3RhY2tlZCBjYWxscyBjYW4gYmUgY2FuY2VsbGVkIGxhdGVyXG4gICAgdmFyIHRpbWVvdXRQcm9taXNlO1xuXG4gICAgdmFyIHNjaGVkdWxlU2VhcmNoV2l0aFRpbWVvdXQgPSBmdW5jdGlvbihpbnB1dFZhbHVlKSB7XG4gICAgICB0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBnZXRNYXRjaGVzQXN5bmMoaW5wdXRWYWx1ZSk7XG4gICAgICB9LCB3YWl0VGltZSk7XG4gICAgfTtcblxuICAgIHZhciBjYW5jZWxQcmV2aW91c1RpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aW1lb3V0UHJvbWlzZSkge1xuICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXNldE1hdGNoZXMoKTtcblxuICAgIHNjb3BlLmFzc2lnbklzT3BlbiA9IGZ1bmN0aW9uIChpc09wZW4pIHtcbiAgICAgIGlzT3BlblNldHRlcihvcmlnaW5hbFNjb3BlLCBpc09wZW4pO1xuICAgIH07XG5cbiAgICBzY29wZS5zZWxlY3QgPSBmdW5jdGlvbihhY3RpdmVJZHgsIGV2dCkge1xuICAgICAgLy9jYWxsZWQgZnJvbSB3aXRoaW4gdGhlICRkaWdlc3QoKSBjeWNsZVxuICAgICAgdmFyIGxvY2FscyA9IHt9O1xuICAgICAgdmFyIG1vZGVsLCBpdGVtO1xuXG4gICAgICBzZWxlY3RlZCA9IHRydWU7XG4gICAgICBsb2NhbHNbcGFyc2VyUmVzdWx0Lml0ZW1OYW1lXSA9IGl0ZW0gPSBzY29wZS5tYXRjaGVzW2FjdGl2ZUlkeF0ubW9kZWw7XG4gICAgICBtb2RlbCA9IHBhcnNlclJlc3VsdC5tb2RlbE1hcHBlcihvcmlnaW5hbFNjb3BlLCBsb2NhbHMpO1xuICAgICAgJHNldE1vZGVsVmFsdWUob3JpZ2luYWxTY29wZSwgbW9kZWwpO1xuICAgICAgbW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgnZWRpdGFibGUnLCB0cnVlKTtcbiAgICAgIG1vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ3BhcnNlJywgdHJ1ZSk7XG5cbiAgICAgIG9uU2VsZWN0Q2FsbGJhY2sob3JpZ2luYWxTY29wZSwge1xuICAgICAgICAkaXRlbTogaXRlbSxcbiAgICAgICAgJG1vZGVsOiBtb2RlbCxcbiAgICAgICAgJGxhYmVsOiBwYXJzZXJSZXN1bHQudmlld01hcHBlcihvcmlnaW5hbFNjb3BlLCBsb2NhbHMpLFxuICAgICAgICAkZXZlbnQ6IGV2dFxuICAgICAgfSk7XG5cbiAgICAgIHJlc2V0TWF0Y2hlcygpO1xuXG4gICAgICAvL3JldHVybiBmb2N1cyB0byB0aGUgaW5wdXQgZWxlbWVudCBpZiBhIG1hdGNoIHdhcyBzZWxlY3RlZCB2aWEgYSBtb3VzZSBjbGljayBldmVudFxuICAgICAgLy8gdXNlIHRpbWVvdXQgdG8gYXZvaWQgJHJvb3RTY29wZTppbnByb2cgZXJyb3JcbiAgICAgIGlmIChzY29wZS4kZXZhbChhdHRycy50eXBlYWhlYWRGb2N1c09uU2VsZWN0KSAhPT0gZmFsc2UpIHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7IGVsZW1lbnRbMF0uZm9jdXMoKTsgfSwgMCwgZmFsc2UpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvL2JpbmQga2V5Ym9hcmQgZXZlbnRzOiBhcnJvd3MgdXAoMzgpIC8gZG93big0MCksIGVudGVyKDEzKSBhbmQgdGFiKDkpLCBlc2MoMjcpXG4gICAgZWxlbWVudC5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgLy90eXBlYWhlYWQgaXMgb3BlbiBhbmQgYW4gXCJpbnRlcmVzdGluZ1wiIGtleSB3YXMgcHJlc3NlZFxuICAgICAgaWYgKHNjb3BlLm1hdGNoZXMubGVuZ3RoID09PSAwIHx8IEhPVF9LRVlTLmluZGV4T2YoZXZ0LndoaWNoKSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2hvdWxkU2VsZWN0ID0gaXNTZWxlY3RFdmVudChvcmlnaW5hbFNjb3BlLCB7JGV2ZW50OiBldnR9KTtcblxuICAgICAgLyoqXG4gICAgICAgKiBpZiB0aGVyZSdzIG5vdGhpbmcgc2VsZWN0ZWQgKGkuZS4gZm9jdXNGaXJzdCkgYW5kIGVudGVyIG9yIHRhYiBpcyBoaXRcbiAgICAgICAqIG9yXG4gICAgICAgKiBzaGlmdCArIHRhYiBpcyBwcmVzc2VkIHRvIGJyaW5nIGZvY3VzIHRvIHRoZSBwcmV2aW91cyBlbGVtZW50XG4gICAgICAgKiB0aGVuIGNsZWFyIHRoZSByZXN1bHRzXG4gICAgICAgKi9cbiAgICAgIGlmIChzY29wZS5hY3RpdmVJZHggPT09IC0xICYmIHNob3VsZFNlbGVjdCB8fCBldnQud2hpY2ggPT09IDkgJiYgISFldnQuc2hpZnRLZXkpIHtcbiAgICAgICAgcmVzZXRNYXRjaGVzKCk7XG4gICAgICAgIHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciB0YXJnZXQ7XG4gICAgICBzd2l0Y2ggKGV2dC53aGljaCkge1xuICAgICAgICBjYXNlIDI3OiAvLyBlc2NhcGVcbiAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICByZXNldE1hdGNoZXMoKTtcbiAgICAgICAgICBvcmlnaW5hbFNjb3BlLiRkaWdlc3QoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzODogLy8gdXAgYXJyb3dcbiAgICAgICAgICBzY29wZS5hY3RpdmVJZHggPSAoc2NvcGUuYWN0aXZlSWR4ID4gMCA/IHNjb3BlLmFjdGl2ZUlkeCA6IHNjb3BlLm1hdGNoZXMubGVuZ3RoKSAtIDE7XG4gICAgICAgICAgc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgICAgIHRhcmdldCA9IHBvcFVwRWxbMF0ucXVlcnlTZWxlY3RvckFsbCgnLnVpYi10eXBlYWhlYWQtbWF0Y2gnKVtzY29wZS5hY3RpdmVJZHhdO1xuICAgICAgICAgIHRhcmdldC5wYXJlbnROb2RlLnNjcm9sbFRvcCA9IHRhcmdldC5vZmZzZXRUb3A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDA6IC8vIGRvd24gYXJyb3dcbiAgICAgICAgICBzY29wZS5hY3RpdmVJZHggPSAoc2NvcGUuYWN0aXZlSWR4ICsgMSkgJSBzY29wZS5tYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgICBzY29wZS4kZGlnZXN0KCk7XG4gICAgICAgICAgdGFyZ2V0ID0gcG9wVXBFbFswXS5xdWVyeVNlbGVjdG9yQWxsKCcudWliLXR5cGVhaGVhZC1tYXRjaCcpW3Njb3BlLmFjdGl2ZUlkeF07XG4gICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuc2Nyb2xsVG9wID0gdGFyZ2V0Lm9mZnNldFRvcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoc2hvdWxkU2VsZWN0KSB7XG4gICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzTnVtYmVyKHNjb3BlLmRlYm91bmNlVXBkYXRlKSB8fCBhbmd1bGFyLmlzT2JqZWN0KHNjb3BlLmRlYm91bmNlVXBkYXRlKSkge1xuICAgICAgICAgICAgICAgICQkZGVib3VuY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBzY29wZS5zZWxlY3Qoc2NvcGUuYWN0aXZlSWR4LCBldnQpO1xuICAgICAgICAgICAgICAgIH0sIGFuZ3VsYXIuaXNOdW1iZXIoc2NvcGUuZGVib3VuY2VVcGRhdGUpID8gc2NvcGUuZGVib3VuY2VVcGRhdGUgOiBzY29wZS5kZWJvdW5jZVVwZGF0ZVsnZGVmYXVsdCddKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY29wZS5zZWxlY3Qoc2NvcGUuYWN0aXZlSWR4LCBldnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBlbGVtZW50Lm9uKCdmb2N1cycsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIGhhc0ZvY3VzID0gdHJ1ZTtcbiAgICAgIGlmIChtaW5MZW5ndGggPT09IDAgJiYgIW1vZGVsQ3RybC4kdmlld1ZhbHVlKSB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldE1hdGNoZXNBc3luYyhtb2RlbEN0cmwuJHZpZXdWYWx1ZSwgZXZ0KTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBlbGVtZW50Lm9uKCdibHVyJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICBpZiAoaXNTZWxlY3RPbkJsdXIgJiYgc2NvcGUubWF0Y2hlcy5sZW5ndGggJiYgc2NvcGUuYWN0aXZlSWR4ICE9PSAtMSAmJiAhc2VsZWN0ZWQpIHtcbiAgICAgICAgc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNPYmplY3Qoc2NvcGUuZGVib3VuY2VVcGRhdGUpICYmIGFuZ3VsYXIuaXNOdW1iZXIoc2NvcGUuZGVib3VuY2VVcGRhdGUuYmx1cikpIHtcbiAgICAgICAgICAgICQkZGVib3VuY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNjb3BlLnNlbGVjdChzY29wZS5hY3RpdmVJZHgsIGV2dCk7XG4gICAgICAgICAgICB9LCBzY29wZS5kZWJvdW5jZVVwZGF0ZS5ibHVyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuc2VsZWN0KHNjb3BlLmFjdGl2ZUlkeCwgZXZ0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0VkaXRhYmxlICYmIG1vZGVsQ3RybC4kZXJyb3IuZWRpdGFibGUpIHtcbiAgICAgICAgbW9kZWxDdHJsLiRzZXRWaWV3VmFsdWUoKTtcbiAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIC8vIFJlc2V0IHZhbGlkaXR5IGFzIHdlIGFyZSBjbGVhcmluZ1xuICAgICAgICAgIG1vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ2VkaXRhYmxlJywgdHJ1ZSk7XG4gICAgICAgICAgbW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgncGFyc2UnLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVsZW1lbnQudmFsKCcnKTtcbiAgICAgIH1cbiAgICAgIGhhc0ZvY3VzID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZCA9IGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLy8gS2VlcCByZWZlcmVuY2UgdG8gY2xpY2sgaGFuZGxlciB0byB1bmJpbmQgaXQuXG4gICAgdmFyIGRpc21pc3NDbGlja0hhbmRsZXIgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgIC8vIElzc3VlICMzOTczXG4gICAgICAvLyBGaXJlZm94IHRyZWF0cyByaWdodCBjbGljayBhcyBhIGNsaWNrIG9uIGRvY3VtZW50XG4gICAgICBpZiAoZWxlbWVudFswXSAhPT0gZXZ0LnRhcmdldCAmJiBldnQud2hpY2ggIT09IDMgJiYgc2NvcGUubWF0Y2hlcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgcmVzZXRNYXRjaGVzKCk7XG4gICAgICAgIGlmICghJHJvb3RTY29wZS4kJHBoYXNlKSB7XG4gICAgICAgICAgb3JpZ2luYWxTY29wZS4kZGlnZXN0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJGRvY3VtZW50Lm9uKCdjbGljaycsIGRpc21pc3NDbGlja0hhbmRsZXIpO1xuXG4gICAgb3JpZ2luYWxTY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAkZG9jdW1lbnQub2ZmKCdjbGljaycsIGRpc21pc3NDbGlja0hhbmRsZXIpO1xuICAgICAgaWYgKGFwcGVuZFRvQm9keSB8fCBhcHBlbmRUbykge1xuICAgICAgICAkcG9wdXAucmVtb3ZlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcHBlbmRUb0JvZHkpIHtcbiAgICAgICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLm9mZigncmVzaXplJywgZmlyZVJlY2FsY3VsYXRpbmcpO1xuICAgICAgICAkZG9jdW1lbnQuZmluZCgnYm9keScpLm9mZignc2Nyb2xsJywgZmlyZVJlY2FsY3VsYXRpbmcpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBqUXVlcnkgY2FjaGUgbWVtb3J5IGxlYWtcbiAgICAgIHBvcFVwRWwucmVtb3ZlKCk7XG5cbiAgICAgIGlmIChzaG93SGludCkge1xuICAgICAgICAgIGlucHV0c0NvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciAkcG9wdXAgPSAkY29tcGlsZShwb3BVcEVsKShzY29wZSk7XG5cbiAgICBpZiAoYXBwZW5kVG9Cb2R5KSB7XG4gICAgICAkZG9jdW1lbnQuZmluZCgnYm9keScpLmFwcGVuZCgkcG9wdXApO1xuICAgIH0gZWxzZSBpZiAoYXBwZW5kVG8pIHtcbiAgICAgIGFuZ3VsYXIuZWxlbWVudChhcHBlbmRUbykuZXEoMCkuYXBwZW5kKCRwb3B1cCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuYWZ0ZXIoJHBvcHVwKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbihfbW9kZWxDdHJsKSB7XG4gICAgICBtb2RlbEN0cmwgPSBfbW9kZWxDdHJsO1xuICAgICAgbmdNb2RlbE9wdGlvbnMgPSBleHRyYWN0T3B0aW9ucyhtb2RlbEN0cmwpO1xuXG4gICAgICBzY29wZS5kZWJvdW5jZVVwZGF0ZSA9ICRwYXJzZShuZ01vZGVsT3B0aW9ucy5nZXRPcHRpb24oJ2RlYm91bmNlJykpKG9yaWdpbmFsU2NvcGUpO1xuXG4gICAgICAvL3BsdWcgaW50byAkcGFyc2VycyBwaXBlbGluZSB0byBvcGVuIGEgdHlwZWFoZWFkIG9uIHZpZXcgY2hhbmdlcyBpbml0aWF0ZWQgZnJvbSBET01cbiAgICAgIC8vJHBhcnNlcnMga2ljay1pbiBvbiBhbGwgdGhlIGNoYW5nZXMgY29taW5nIGZyb20gdGhlIHZpZXcgYXMgd2VsbCBhcyBtYW51YWxseSB0cmlnZ2VyZWQgYnkgJHNldFZpZXdWYWx1ZVxuICAgICAgbW9kZWxDdHJsLiRwYXJzZXJzLnVuc2hpZnQoZnVuY3Rpb24oaW5wdXRWYWx1ZSkge1xuICAgICAgICBoYXNGb2N1cyA9IHRydWU7XG5cbiAgICAgICAgaWYgKG1pbkxlbmd0aCA9PT0gMCB8fCBpbnB1dFZhbHVlICYmIGlucHV0VmFsdWUubGVuZ3RoID49IG1pbkxlbmd0aCkge1xuICAgICAgICAgIGlmICh3YWl0VGltZSA+IDApIHtcbiAgICAgICAgICAgIGNhbmNlbFByZXZpb3VzVGltZW91dCgpO1xuICAgICAgICAgICAgc2NoZWR1bGVTZWFyY2hXaXRoVGltZW91dChpbnB1dFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2V0TWF0Y2hlc0FzeW5jKGlucHV0VmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpc0xvYWRpbmdTZXR0ZXIob3JpZ2luYWxTY29wZSwgZmFsc2UpO1xuICAgICAgICAgIGNhbmNlbFByZXZpb3VzVGltZW91dCgpO1xuICAgICAgICAgIHJlc2V0TWF0Y2hlcygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzRWRpdGFibGUpIHtcbiAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaW5wdXRWYWx1ZSkge1xuICAgICAgICAgIC8vIFJlc2V0IGluIGNhc2UgdXNlciBoYWQgdHlwZWQgc29tZXRoaW5nIHByZXZpb3VzbHkuXG4gICAgICAgICAgbW9kZWxDdHJsLiRzZXRWYWxpZGl0eSgnZWRpdGFibGUnLCB0cnVlKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ2VkaXRhYmxlJywgZmFsc2UpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfSk7XG5cbiAgICAgIG1vZGVsQ3RybC4kZm9ybWF0dGVycy5wdXNoKGZ1bmN0aW9uKG1vZGVsVmFsdWUpIHtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZVZpZXdWYWx1ZSwgZW1wdHlWaWV3VmFsdWU7XG4gICAgICAgIHZhciBsb2NhbHMgPSB7fTtcblxuICAgICAgICAvLyBUaGUgdmFsaWRpdHkgbWF5IGJlIHNldCB0byBmYWxzZSB2aWEgJHBhcnNlcnMgKHNlZSBhYm92ZSkgaWZcbiAgICAgICAgLy8gdGhlIG1vZGVsIGlzIHJlc3RyaWN0ZWQgdG8gc2VsZWN0ZWQgdmFsdWVzLiBJZiB0aGUgbW9kZWxcbiAgICAgICAgLy8gaXMgc2V0IG1hbnVhbGx5IGl0IGlzIGNvbnNpZGVyZWQgdG8gYmUgdmFsaWQuXG4gICAgICAgIGlmICghaXNFZGl0YWJsZSkge1xuICAgICAgICAgIG1vZGVsQ3RybC4kc2V0VmFsaWRpdHkoJ2VkaXRhYmxlJywgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5wdXRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICBsb2NhbHMuJG1vZGVsID0gbW9kZWxWYWx1ZTtcbiAgICAgICAgICByZXR1cm4gaW5wdXRGb3JtYXR0ZXIob3JpZ2luYWxTY29wZSwgbG9jYWxzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaXQgbWlnaHQgaGFwcGVuIHRoYXQgd2UgZG9uJ3QgaGF2ZSBlbm91Z2ggaW5mbyB0byBwcm9wZXJseSByZW5kZXIgaW5wdXQgdmFsdWVcbiAgICAgICAgLy93ZSBuZWVkIHRvIGNoZWNrIGZvciB0aGlzIHNpdHVhdGlvbiBhbmQgc2ltcGx5IHJldHVybiBtb2RlbCB2YWx1ZSBpZiB3ZSBjYW4ndCBhcHBseSBjdXN0b20gZm9ybWF0dGluZ1xuICAgICAgICBsb2NhbHNbcGFyc2VyUmVzdWx0Lml0ZW1OYW1lXSA9IG1vZGVsVmFsdWU7XG4gICAgICAgIGNhbmRpZGF0ZVZpZXdWYWx1ZSA9IHBhcnNlclJlc3VsdC52aWV3TWFwcGVyKG9yaWdpbmFsU2NvcGUsIGxvY2Fscyk7XG4gICAgICAgIGxvY2Fsc1twYXJzZXJSZXN1bHQuaXRlbU5hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICBlbXB0eVZpZXdWYWx1ZSA9IHBhcnNlclJlc3VsdC52aWV3TWFwcGVyKG9yaWdpbmFsU2NvcGUsIGxvY2Fscyk7XG5cbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZVZpZXdWYWx1ZSAhPT0gZW1wdHlWaWV3VmFsdWUgPyBjYW5kaWRhdGVWaWV3VmFsdWUgOiBtb2RlbFZhbHVlO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGV4dHJhY3RPcHRpb25zKG5nTW9kZWxDdHJsKSB7XG4gICAgICB2YXIgbmdNb2RlbE9wdGlvbnM7XG5cbiAgICAgIGlmIChhbmd1bGFyLnZlcnNpb24ubWlub3IgPCA2KSB7IC8vIGluIGFuZ3VsYXIgPCAxLjYgJG9wdGlvbnMgY291bGQgYmUgbWlzc2luZ1xuICAgICAgICAvLyBndWFyYW50ZWUgYSB2YWx1ZVxuICAgICAgICBuZ01vZGVsT3B0aW9ucyA9IG5nTW9kZWxDdHJsLiRvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIG1pbWljIDEuNisgYXBpXG4gICAgICAgIG5nTW9kZWxPcHRpb25zLmdldE9wdGlvbiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gbmdNb2RlbE9wdGlvbnNba2V5XTtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7IC8vIGluIGFuZ3VsYXIgPj0xLjYgJG9wdGlvbnMgaXMgYWx3YXlzIHByZXNlbnRcbiAgICAgICAgbmdNb2RlbE9wdGlvbnMgPSBuZ01vZGVsQ3RybC4kb3B0aW9ucztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5nTW9kZWxPcHRpb25zO1xuICAgIH1cbiAgfV0pXG5cbiAgLmRpcmVjdGl2ZSgndWliVHlwZWFoZWFkJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRyb2xsZXI6ICdVaWJUeXBlYWhlYWRDb250cm9sbGVyJyxcbiAgICAgIHJlcXVpcmU6IFsnbmdNb2RlbCcsICd1aWJUeXBlYWhlYWQnXSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKG9yaWdpbmFsU2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJscykge1xuICAgICAgICBjdHJsc1sxXS5pbml0KGN0cmxzWzBdKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KVxuXG4gIC5kaXJlY3RpdmUoJ3VpYlR5cGVhaGVhZFBvcHVwJywgWyckJGRlYm91bmNlJywgZnVuY3Rpb24oJCRkZWJvdW5jZSkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZToge1xuICAgICAgICBtYXRjaGVzOiAnPScsXG4gICAgICAgIHF1ZXJ5OiAnPScsXG4gICAgICAgIGFjdGl2ZTogJz0nLFxuICAgICAgICBwb3NpdGlvbjogJyYnLFxuICAgICAgICBtb3ZlSW5Qcm9ncmVzczogJz0nLFxuICAgICAgICBzZWxlY3Q6ICcmJyxcbiAgICAgICAgYXNzaWduSXNPcGVuOiAnJicsXG4gICAgICAgIGRlYm91bmNlOiAnJidcbiAgICAgIH0sXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgdGVtcGxhdGVVcmw6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHJldHVybiBhdHRycy5wb3B1cFRlbXBsYXRlVXJsIHx8ICd1aWIvdGVtcGxhdGUvdHlwZWFoZWFkL3R5cGVhaGVhZC1wb3B1cC5odG1sJztcbiAgICAgIH0sXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgc2NvcGUudGVtcGxhdGVVcmwgPSBhdHRycy50ZW1wbGF0ZVVybDtcblxuICAgICAgICBzY29wZS5pc09wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgaXNEcm9wZG93bk9wZW4gPSBzY29wZS5tYXRjaGVzLmxlbmd0aCA+IDA7XG4gICAgICAgICAgc2NvcGUuYXNzaWduSXNPcGVuKHsgaXNPcGVuOiBpc0Ryb3Bkb3duT3BlbiB9KTtcbiAgICAgICAgICByZXR1cm4gaXNEcm9wZG93bk9wZW47XG4gICAgICAgIH07XG5cbiAgICAgICAgc2NvcGUuaXNBY3RpdmUgPSBmdW5jdGlvbihtYXRjaElkeCkge1xuICAgICAgICAgIHJldHVybiBzY29wZS5hY3RpdmUgPT09IG1hdGNoSWR4O1xuICAgICAgICB9O1xuXG4gICAgICAgIHNjb3BlLnNlbGVjdEFjdGl2ZSA9IGZ1bmN0aW9uKG1hdGNoSWR4KSB7XG4gICAgICAgICAgc2NvcGUuYWN0aXZlID0gbWF0Y2hJZHg7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2NvcGUuc2VsZWN0TWF0Y2ggPSBmdW5jdGlvbihhY3RpdmVJZHgsIGV2dCkge1xuICAgICAgICAgIHZhciBkZWJvdW5jZSA9IHNjb3BlLmRlYm91bmNlKCk7XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNOdW1iZXIoZGVib3VuY2UpIHx8IGFuZ3VsYXIuaXNPYmplY3QoZGVib3VuY2UpKSB7XG4gICAgICAgICAgICAkJGRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzY29wZS5zZWxlY3Qoe2FjdGl2ZUlkeDogYWN0aXZlSWR4LCBldnQ6IGV2dH0pO1xuICAgICAgICAgICAgfSwgYW5ndWxhci5pc051bWJlcihkZWJvdW5jZSkgPyBkZWJvdW5jZSA6IGRlYm91bmNlWydkZWZhdWx0J10pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY29wZS5zZWxlY3Qoe2FjdGl2ZUlkeDogYWN0aXZlSWR4LCBldnQ6IGV2dH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSlcblxuICAuZGlyZWN0aXZlKCd1aWJUeXBlYWhlYWRNYXRjaCcsIFsnJHRlbXBsYXRlUmVxdWVzdCcsICckY29tcGlsZScsICckcGFyc2UnLCBmdW5jdGlvbigkdGVtcGxhdGVSZXF1ZXN0LCAkY29tcGlsZSwgJHBhcnNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIGluZGV4OiAnPScsXG4gICAgICAgIG1hdGNoOiAnPScsXG4gICAgICAgIHF1ZXJ5OiAnPSdcbiAgICAgIH0sXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgdmFyIHRwbFVybCA9ICRwYXJzZShhdHRycy50ZW1wbGF0ZVVybCkoc2NvcGUuJHBhcmVudCkgfHwgJ3VpYi90ZW1wbGF0ZS90eXBlYWhlYWQvdHlwZWFoZWFkLW1hdGNoLmh0bWwnO1xuICAgICAgICAkdGVtcGxhdGVSZXF1ZXN0KHRwbFVybCkudGhlbihmdW5jdGlvbih0cGxDb250ZW50KSB7XG4gICAgICAgICAgdmFyIHRwbEVsID0gYW5ndWxhci5lbGVtZW50KHRwbENvbnRlbnQudHJpbSgpKTtcbiAgICAgICAgICBlbGVtZW50LnJlcGxhY2VXaXRoKHRwbEVsKTtcbiAgICAgICAgICAkY29tcGlsZSh0cGxFbCkoc2NvcGUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSlcblxuICAuZmlsdGVyKCd1aWJUeXBlYWhlYWRIaWdobGlnaHQnLCBbJyRzY2UnLCAnJGluamVjdG9yJywgJyRsb2cnLCBmdW5jdGlvbigkc2NlLCAkaW5qZWN0b3IsICRsb2cpIHtcbiAgICB2YXIgaXNTYW5pdGl6ZVByZXNlbnQ7XG4gICAgaXNTYW5pdGl6ZVByZXNlbnQgPSAkaW5qZWN0b3IuaGFzKCckc2FuaXRpemUnKTtcblxuICAgIGZ1bmN0aW9uIGVzY2FwZVJlZ2V4cChxdWVyeVRvRXNjYXBlKSB7XG4gICAgICAvLyBSZWdleDogY2FwdHVyZSB0aGUgd2hvbGUgcXVlcnkgc3RyaW5nIGFuZCByZXBsYWNlIGl0IHdpdGggdGhlIHN0cmluZyB0aGF0IHdpbGwgYmUgdXNlZCB0byBtYXRjaFxuICAgICAgLy8gdGhlIHJlc3VsdHMsIGZvciBleGFtcGxlIGlmIHRoZSBjYXB0dXJlIGlzIFwiYVwiIHRoZSByZXN1bHQgd2lsbCBiZSBcXGFcbiAgICAgIHJldHVybiBxdWVyeVRvRXNjYXBlLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCAnXFxcXCQxJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29udGFpbnNIdG1sKG1hdGNoSXRlbSkge1xuICAgICAgcmV0dXJuIC88Lio+L2cudGVzdChtYXRjaEl0ZW0pO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbihtYXRjaEl0ZW0sIHF1ZXJ5KSB7XG4gICAgICBpZiAoIWlzU2FuaXRpemVQcmVzZW50ICYmIGNvbnRhaW5zSHRtbChtYXRjaEl0ZW0pKSB7XG4gICAgICAgICRsb2cud2FybignVW5zYWZlIHVzZSBvZiB0eXBlYWhlYWQgcGxlYXNlIHVzZSBuZ1Nhbml0aXplJyk7IC8vIFdhcm4gdGhlIHVzZXIgYWJvdXQgdGhlIGRhbmdlclxuICAgICAgfVxuICAgICAgbWF0Y2hJdGVtID0gcXVlcnkgPyAoJycgKyBtYXRjaEl0ZW0pLnJlcGxhY2UobmV3IFJlZ0V4cChlc2NhcGVSZWdleHAocXVlcnkpLCAnZ2knKSwgJzxzdHJvbmc+JCY8L3N0cm9uZz4nKSA6IG1hdGNoSXRlbTsgLy8gUmVwbGFjZXMgdGhlIGNhcHR1cmUgc3RyaW5nIHdpdGggYSB0aGUgc2FtZSBzdHJpbmcgaW5zaWRlIG9mIGEgXCJzdHJvbmdcIiB0YWdcbiAgICAgIGlmICghaXNTYW5pdGl6ZVByZXNlbnQpIHtcbiAgICAgICAgbWF0Y2hJdGVtID0gJHNjZS50cnVzdEFzSHRtbChtYXRjaEl0ZW0pOyAvLyBJZiAkc2FuaXRpemUgaXMgbm90IHByZXNlbnQgd2UgcGFjayB0aGUgc3RyaW5nIGluIGEgJHNjZSBvYmplY3QgZm9yIHRoZSBuZy1iaW5kLWh0bWwgZGlyZWN0aXZlXG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2hJdGVtO1xuICAgIH07XG4gIH1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvYWNjb3JkaW9uL2FjY29yZGlvbi1ncm91cC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL2FjY29yZGlvbi9hY2NvcmRpb24tZ3JvdXAuaHRtbFwiLFxuICAgIFwiPGRpdiByb2xlPVxcXCJ0YWJcXFwiIGlkPVxcXCJ7ezo6aGVhZGluZ0lkfX1cXFwiIGFyaWEtc2VsZWN0ZWQ9XFxcInt7aXNPcGVufX1cXFwiIGNsYXNzPVxcXCJwYW5lbC1oZWFkaW5nXFxcIiBuZy1rZXlwcmVzcz1cXFwidG9nZ2xlT3BlbigkZXZlbnQpXFxcIj5cXG5cIiArXG4gICAgXCIgIDxoNCBjbGFzcz1cXFwicGFuZWwtdGl0bGVcXFwiPlxcblwiICtcbiAgICBcIiAgICA8YSByb2xlPVxcXCJidXR0b25cXFwiIGRhdGEtdG9nZ2xlPVxcXCJjb2xsYXBzZVxcXCIgaHJlZiBhcmlhLWV4cGFuZGVkPVxcXCJ7e2lzT3Blbn19XFxcIiBhcmlhLWNvbnRyb2xzPVxcXCJ7ezo6cGFuZWxJZH19XFxcIiB0YWJpbmRleD1cXFwiMFxcXCIgY2xhc3M9XFxcImFjY29yZGlvbi10b2dnbGVcXFwiIG5nLWNsaWNrPVxcXCJ0b2dnbGVPcGVuKClcXFwiIHVpYi1hY2NvcmRpb24tdHJhbnNjbHVkZT1cXFwiaGVhZGluZ1xcXCIgbmctZGlzYWJsZWQ9XFxcImlzRGlzYWJsZWRcXFwiIHVpYi10YWJpbmRleC10b2dnbGU+PHNwYW4gdWliLWFjY29yZGlvbi1oZWFkZXIgbmctY2xhc3M9XFxcInsndGV4dC1tdXRlZCc6IGlzRGlzYWJsZWR9XFxcIj57e2hlYWRpbmd9fTwvc3Bhbj48L2E+XFxuXCIgK1xuICAgIFwiICA8L2g0PlxcblwiICtcbiAgICBcIjwvZGl2PlxcblwiICtcbiAgICBcIjxkaXYgaWQ9XFxcInt7OjpwYW5lbElkfX1cXFwiIGFyaWEtbGFiZWxsZWRieT1cXFwie3s6OmhlYWRpbmdJZH19XFxcIiBhcmlhLWhpZGRlbj1cXFwie3shaXNPcGVufX1cXFwiIHJvbGU9XFxcInRhYnBhbmVsXFxcIiBjbGFzcz1cXFwicGFuZWwtY29sbGFwc2UgY29sbGFwc2VcXFwiIHVpYi1jb2xsYXBzZT1cXFwiIWlzT3BlblxcXCI+XFxuXCIgK1xuICAgIFwiICA8ZGl2IGNsYXNzPVxcXCJwYW5lbC1ib2R5XFxcIiBuZy10cmFuc2NsdWRlPjwvZGl2PlxcblwiICtcbiAgICBcIjwvZGl2PlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvYWNjb3JkaW9uL2FjY29yZGlvbi5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL2FjY29yZGlvbi9hY2NvcmRpb24uaHRtbFwiLFxuICAgIFwiPGRpdiByb2xlPVxcXCJ0YWJsaXN0XFxcIiBjbGFzcz1cXFwicGFuZWwtZ3JvdXBcXFwiIG5nLXRyYW5zY2x1ZGU+PC9kaXY+XCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9hbGVydC9hbGVydC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL2FsZXJ0L2FsZXJ0Lmh0bWxcIixcbiAgICBcIjxidXR0b24gbmctc2hvdz1cXFwiY2xvc2VhYmxlXFxcIiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJjbG9zZVxcXCIgbmctY2xpY2s9XFxcImNsb3NlKHskZXZlbnQ6ICRldmVudH0pXFxcIj5cXG5cIiArXG4gICAgXCIgIDxzcGFuIGFyaWEtaGlkZGVuPVxcXCJ0cnVlXFxcIj4mdGltZXM7PC9zcGFuPlxcblwiICtcbiAgICBcIiAgPHNwYW4gY2xhc3M9XFxcInNyLW9ubHlcXFwiPkNsb3NlPC9zcGFuPlxcblwiICtcbiAgICBcIjwvYnV0dG9uPlxcblwiICtcbiAgICBcIjxkaXYgbmctdHJhbnNjbHVkZT48L2Rpdj5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL2Nhcm91c2VsL2Nhcm91c2VsLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvY2Fyb3VzZWwvY2Fyb3VzZWwuaHRtbFwiLFxuICAgIFwiPGRpdiBjbGFzcz1cXFwiY2Fyb3VzZWwtaW5uZXJcXFwiIG5nLXRyYW5zY2x1ZGU+PC9kaXY+XFxuXCIgK1xuICAgIFwiPGEgcm9sZT1cXFwiYnV0dG9uXFxcIiBocmVmIGNsYXNzPVxcXCJsZWZ0IGNhcm91c2VsLWNvbnRyb2xcXFwiIG5nLWNsaWNrPVxcXCJwcmV2KClcXFwiIG5nLWNsYXNzPVxcXCJ7IGRpc2FibGVkOiBpc1ByZXZEaXNhYmxlZCgpIH1cXFwiIG5nLXNob3c9XFxcInNsaWRlcy5sZW5ndGggPiAxXFxcIj5cXG5cIiArXG4gICAgXCIgIDxzcGFuIGFyaWEtaGlkZGVuPVxcXCJ0cnVlXFxcIiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLWxlZnRcXFwiPjwvc3Bhbj5cXG5cIiArXG4gICAgXCIgIDxzcGFuIGNsYXNzPVxcXCJzci1vbmx5XFxcIj5wcmV2aW91czwvc3Bhbj5cXG5cIiArXG4gICAgXCI8L2E+XFxuXCIgK1xuICAgIFwiPGEgcm9sZT1cXFwiYnV0dG9uXFxcIiBocmVmIGNsYXNzPVxcXCJyaWdodCBjYXJvdXNlbC1jb250cm9sXFxcIiBuZy1jbGljaz1cXFwibmV4dCgpXFxcIiBuZy1jbGFzcz1cXFwieyBkaXNhYmxlZDogaXNOZXh0RGlzYWJsZWQoKSB9XFxcIiBuZy1zaG93PVxcXCJzbGlkZXMubGVuZ3RoID4gMVxcXCI+XFxuXCIgK1xuICAgIFwiICA8c3BhbiBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFxcXCI+PC9zcGFuPlxcblwiICtcbiAgICBcIiAgPHNwYW4gY2xhc3M9XFxcInNyLW9ubHlcXFwiPm5leHQ8L3NwYW4+XFxuXCIgK1xuICAgIFwiPC9hPlxcblwiICtcbiAgICBcIjxvbCBjbGFzcz1cXFwiY2Fyb3VzZWwtaW5kaWNhdG9yc1xcXCIgbmctc2hvdz1cXFwic2xpZGVzLmxlbmd0aCA+IDFcXFwiPlxcblwiICtcbiAgICBcIiAgPGxpIG5nLXJlcGVhdD1cXFwic2xpZGUgaW4gc2xpZGVzIHwgb3JkZXJCeTppbmRleE9mU2xpZGUgdHJhY2sgYnkgJGluZGV4XFxcIiBuZy1jbGFzcz1cXFwieyBhY3RpdmU6IGlzQWN0aXZlKHNsaWRlKSB9XFxcIiBuZy1jbGljaz1cXFwic2VsZWN0KHNsaWRlKVxcXCI+XFxuXCIgK1xuICAgIFwiICAgIDxzcGFuIGNsYXNzPVxcXCJzci1vbmx5XFxcIj5zbGlkZSB7eyAkaW5kZXggKyAxIH19IG9mIHt7IHNsaWRlcy5sZW5ndGggfX08c3BhbiBuZy1pZj1cXFwiaXNBY3RpdmUoc2xpZGUpXFxcIj4sIGN1cnJlbnRseSBhY3RpdmU8L3NwYW4+PC9zcGFuPlxcblwiICtcbiAgICBcIiAgPC9saT5cXG5cIiArXG4gICAgXCI8L29sPlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvY2Fyb3VzZWwvc2xpZGUuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS9jYXJvdXNlbC9zbGlkZS5odG1sXCIsXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJ0ZXh0LWNlbnRlclxcXCIgbmctdHJhbnNjbHVkZT48L2Rpdj5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL2RhdGVwaWNrZXIvZGF0ZXBpY2tlci5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL2RhdGVwaWNrZXIvZGF0ZXBpY2tlci5odG1sXCIsXG4gICAgXCI8ZGl2IG5nLXN3aXRjaD1cXFwiZGF0ZXBpY2tlck1vZGVcXFwiPlxcblwiICtcbiAgICBcIiAgPGRpdiB1aWItZGF5cGlja2VyIG5nLXN3aXRjaC13aGVuPVxcXCJkYXlcXFwiIHRhYmluZGV4PVxcXCIwXFxcIiBjbGFzcz1cXFwidWliLWRheXBpY2tlclxcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiICA8ZGl2IHVpYi1tb250aHBpY2tlciBuZy1zd2l0Y2gtd2hlbj1cXFwibW9udGhcXFwiIHRhYmluZGV4PVxcXCIwXFxcIiBjbGFzcz1cXFwidWliLW1vbnRocGlja2VyXFxcIj48L2Rpdj5cXG5cIiArXG4gICAgXCIgIDxkaXYgdWliLXllYXJwaWNrZXIgbmctc3dpdGNoLXdoZW49XFxcInllYXJcXFwiIHRhYmluZGV4PVxcXCIwXFxcIiBjbGFzcz1cXFwidWliLXllYXJwaWNrZXJcXFwiPjwvZGl2PlxcblwiICtcbiAgICBcIjwvZGl2PlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci9kYXkuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS9kYXRlcGlja2VyL2RheS5odG1sXCIsXG4gICAgXCI8dGFibGUgcm9sZT1cXFwiZ3JpZFxcXCIgYXJpYS1sYWJlbGxlZGJ5PVxcXCJ7ezo6dW5pcXVlSWR9fS10aXRsZVxcXCIgYXJpYS1hY3RpdmVkZXNjZW5kYW50PVxcXCJ7e2FjdGl2ZURhdGVJZH19XFxcIj5cXG5cIiArXG4gICAgXCIgIDx0aGVhZD5cXG5cIiArXG4gICAgXCIgICAgPHRyPlxcblwiICtcbiAgICBcIiAgICAgIDx0aD48YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBidG4tc20gcHVsbC1sZWZ0IHVpYi1sZWZ0XFxcIiBuZy1jbGljaz1cXFwibW92ZSgtMSlcXFwiIHRhYmluZGV4PVxcXCItMVxcXCI+PGkgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tbGVmdFxcXCI+PC9pPjxzcGFuIGNsYXNzPVxcXCJzci1vbmx5XFxcIj5wcmV2aW91czwvc3Bhbj48L2J1dHRvbj48L3RoPlxcblwiICtcbiAgICBcIiAgICAgIDx0aCBjb2xzcGFuPVxcXCJ7ezo6NSArIHNob3dXZWVrc319XFxcIj48YnV0dG9uIGlkPVxcXCJ7ezo6dW5pcXVlSWR9fS10aXRsZVxcXCIgcm9sZT1cXFwiaGVhZGluZ1xcXCIgYXJpYS1saXZlPVxcXCJhc3NlcnRpdmVcXFwiIGFyaWEtYXRvbWljPVxcXCJ0cnVlXFxcIiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgYnRuLXNtIHVpYi10aXRsZVxcXCIgbmctY2xpY2s9XFxcInRvZ2dsZU1vZGUoKVxcXCIgbmctZGlzYWJsZWQ9XFxcImRhdGVwaWNrZXJNb2RlID09PSBtYXhNb2RlXFxcIiB0YWJpbmRleD1cXFwiLTFcXFwiPjxzdHJvbmc+e3t0aXRsZX19PC9zdHJvbmc+PC9idXR0b24+PC90aD5cXG5cIiArXG4gICAgXCIgICAgICA8dGg+PGJ1dHRvbiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgYnRuLXNtIHB1bGwtcmlnaHQgdWliLXJpZ2h0XFxcIiBuZy1jbGljaz1cXFwibW92ZSgxKVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48aSBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFxcXCI+PC9pPjxzcGFuIGNsYXNzPVxcXCJzci1vbmx5XFxcIj5uZXh0PC9zcGFuPjwvYnV0dG9uPjwvdGg+XFxuXCIgK1xuICAgIFwiICAgIDwvdHI+XFxuXCIgK1xuICAgIFwiICAgIDx0cj5cXG5cIiArXG4gICAgXCIgICAgICA8dGggbmctaWY9XFxcInNob3dXZWVrc1xcXCIgY2xhc3M9XFxcInRleHQtY2VudGVyXFxcIj48L3RoPlxcblwiICtcbiAgICBcIiAgICAgIDx0aCBuZy1yZXBlYXQ9XFxcImxhYmVsIGluIDo6bGFiZWxzIHRyYWNrIGJ5ICRpbmRleFxcXCIgY2xhc3M9XFxcInRleHQtY2VudGVyXFxcIj48c21hbGwgYXJpYS1sYWJlbD1cXFwie3s6OmxhYmVsLmZ1bGx9fVxcXCI+e3s6OmxhYmVsLmFiYnJ9fTwvc21hbGw+PC90aD5cXG5cIiArXG4gICAgXCIgICAgPC90cj5cXG5cIiArXG4gICAgXCIgIDwvdGhlYWQ+XFxuXCIgK1xuICAgIFwiICA8dGJvZHk+XFxuXCIgK1xuICAgIFwiICAgIDx0ciBjbGFzcz1cXFwidWliLXdlZWtzXFxcIiBuZy1yZXBlYXQ9XFxcInJvdyBpbiByb3dzIHRyYWNrIGJ5ICRpbmRleFxcXCIgcm9sZT1cXFwicm93XFxcIj5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgbmctaWY9XFxcInNob3dXZWVrc1xcXCIgY2xhc3M9XFxcInRleHQtY2VudGVyIGg2XFxcIj48ZW0+e3sgd2Vla051bWJlcnNbJGluZGV4XSB9fTwvZW0+PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgbmctcmVwZWF0PVxcXCJkdCBpbiByb3dcXFwiIGNsYXNzPVxcXCJ1aWItZGF5IHRleHQtY2VudGVyXFxcIiByb2xlPVxcXCJncmlkY2VsbFxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgIGlkPVxcXCJ7ezo6ZHQudWlkfX1cXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICBuZy1jbGFzcz1cXFwiOjpkdC5jdXN0b21DbGFzc1xcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgICA8YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBidG4tc21cXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgIHVpYi1pcy1jbGFzcz1cXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgICAgJ2J0bi1pbmZvJyBmb3Igc2VsZWN0ZWREdCxcXG5cIiArXG4gICAgXCIgICAgICAgICAgICAnYWN0aXZlJyBmb3IgYWN0aXZlRHRcXG5cIiArXG4gICAgXCIgICAgICAgICAgICBvbiBkdFxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgICAgbmctY2xpY2s9XFxcInNlbGVjdChkdC5kYXRlKVxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgICAgbmctZGlzYWJsZWQ9XFxcIjo6ZHQuZGlzYWJsZWRcXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgIHRhYmluZGV4PVxcXCItMVxcXCI+PHNwYW4gbmctY2xhc3M9XFxcIjo6eyd0ZXh0LW11dGVkJzogZHQuc2Vjb25kYXJ5LCAndGV4dC1pbmZvJzogZHQuY3VycmVudH1cXFwiPnt7OjpkdC5sYWJlbH19PC9zcGFuPjwvYnV0dG9uPlxcblwiICtcbiAgICBcIiAgICAgIDwvdGQ+XFxuXCIgK1xuICAgIFwiICAgIDwvdHI+XFxuXCIgK1xuICAgIFwiICA8L3Rib2R5PlxcblwiICtcbiAgICBcIjwvdGFibGU+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9kYXRlcGlja2VyL21vbnRoLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci9tb250aC5odG1sXCIsXG4gICAgXCI8dGFibGUgcm9sZT1cXFwiZ3JpZFxcXCIgYXJpYS1sYWJlbGxlZGJ5PVxcXCJ7ezo6dW5pcXVlSWR9fS10aXRsZVxcXCIgYXJpYS1hY3RpdmVkZXNjZW5kYW50PVxcXCJ7e2FjdGl2ZURhdGVJZH19XFxcIj5cXG5cIiArXG4gICAgXCIgIDx0aGVhZD5cXG5cIiArXG4gICAgXCIgICAgPHRyPlxcblwiICtcbiAgICBcIiAgICAgIDx0aD48YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBidG4tc20gcHVsbC1sZWZ0IHVpYi1sZWZ0XFxcIiBuZy1jbGljaz1cXFwibW92ZSgtMSlcXFwiIHRhYmluZGV4PVxcXCItMVxcXCI+PGkgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tbGVmdFxcXCI+PC9pPjxzcGFuIGNsYXNzPVxcXCJzci1vbmx5XFxcIj5wcmV2aW91czwvc3Bhbj48L2J1dHRvbj48L3RoPlxcblwiICtcbiAgICBcIiAgICAgIDx0aCBjb2xzcGFuPVxcXCJ7ezo6eWVhckhlYWRlckNvbHNwYW59fVxcXCI+PGJ1dHRvbiBpZD1cXFwie3s6OnVuaXF1ZUlkfX0tdGl0bGVcXFwiIHJvbGU9XFxcImhlYWRpbmdcXFwiIGFyaWEtbGl2ZT1cXFwiYXNzZXJ0aXZlXFxcIiBhcmlhLWF0b21pYz1cXFwidHJ1ZVxcXCIgdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSB1aWItdGl0bGVcXFwiIG5nLWNsaWNrPVxcXCJ0b2dnbGVNb2RlKClcXFwiIG5nLWRpc2FibGVkPVxcXCJkYXRlcGlja2VyTW9kZSA9PT0gbWF4TW9kZVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48c3Ryb25nPnt7dGl0bGV9fTwvc3Ryb25nPjwvYnV0dG9uPjwvdGg+XFxuXCIgK1xuICAgIFwiICAgICAgPHRoPjxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBwdWxsLXJpZ2h0IHVpYi1yaWdodFxcXCIgbmctY2xpY2s9XFxcIm1vdmUoMSlcXFwiIHRhYmluZGV4PVxcXCItMVxcXCI+PGkgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcXFwiPjwvaT48c3BhbiBjbGFzcz1cXFwic3Itb25seVxcXCI+bmV4dDwvc3Bhbj48L2k+PC9idXR0b24+PC90aD5cXG5cIiArXG4gICAgXCIgICAgPC90cj5cXG5cIiArXG4gICAgXCIgIDwvdGhlYWQ+XFxuXCIgK1xuICAgIFwiICA8dGJvZHk+XFxuXCIgK1xuICAgIFwiICAgIDx0ciBjbGFzcz1cXFwidWliLW1vbnRoc1xcXCIgbmctcmVwZWF0PVxcXCJyb3cgaW4gcm93cyB0cmFjayBieSAkaW5kZXhcXFwiIHJvbGU9XFxcInJvd1xcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkIG5nLXJlcGVhdD1cXFwiZHQgaW4gcm93XFxcIiBjbGFzcz1cXFwidWliLW1vbnRoIHRleHQtY2VudGVyXFxcIiByb2xlPVxcXCJncmlkY2VsbFxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgIGlkPVxcXCJ7ezo6ZHQudWlkfX1cXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICBuZy1jbGFzcz1cXFwiOjpkdC5jdXN0b21DbGFzc1xcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgICA8YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgICAgdWliLWlzLWNsYXNzPVxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgICAgICAnYnRuLWluZm8nIGZvciBzZWxlY3RlZER0LFxcblwiICtcbiAgICBcIiAgICAgICAgICAgICdhY3RpdmUnIGZvciBhY3RpdmVEdFxcblwiICtcbiAgICBcIiAgICAgICAgICAgIG9uIGR0XFxcIlxcblwiICtcbiAgICBcIiAgICAgICAgICBuZy1jbGljaz1cXFwic2VsZWN0KGR0LmRhdGUpXFxcIlxcblwiICtcbiAgICBcIiAgICAgICAgICBuZy1kaXNhYmxlZD1cXFwiOjpkdC5kaXNhYmxlZFxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgICAgdGFiaW5kZXg9XFxcIi0xXFxcIj48c3BhbiBuZy1jbGFzcz1cXFwiOjp7J3RleHQtaW5mbyc6IGR0LmN1cnJlbnR9XFxcIj57ezo6ZHQubGFiZWx9fTwvc3Bhbj48L2J1dHRvbj5cXG5cIiArXG4gICAgXCIgICAgICA8L3RkPlxcblwiICtcbiAgICBcIiAgICA8L3RyPlxcblwiICtcbiAgICBcIiAgPC90Ym9keT5cXG5cIiArXG4gICAgXCI8L3RhYmxlPlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci95ZWFyLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvZGF0ZXBpY2tlci95ZWFyLmh0bWxcIixcbiAgICBcIjx0YWJsZSByb2xlPVxcXCJncmlkXFxcIiBhcmlhLWxhYmVsbGVkYnk9XFxcInt7Ojp1bmlxdWVJZH19LXRpdGxlXFxcIiBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQ9XFxcInt7YWN0aXZlRGF0ZUlkfX1cXFwiPlxcblwiICtcbiAgICBcIiAgPHRoZWFkPlxcblwiICtcbiAgICBcIiAgICA8dHI+XFxuXCIgK1xuICAgIFwiICAgICAgPHRoPjxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBwdWxsLWxlZnQgdWliLWxlZnRcXFwiIG5nLWNsaWNrPVxcXCJtb3ZlKC0xKVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48aSBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XFxcIj48L2k+PHNwYW4gY2xhc3M9XFxcInNyLW9ubHlcXFwiPnByZXZpb3VzPC9zcGFuPjwvYnV0dG9uPjwvdGg+XFxuXCIgK1xuICAgIFwiICAgICAgPHRoIGNvbHNwYW49XFxcInt7Ojpjb2x1bW5zIC0gMn19XFxcIj48YnV0dG9uIGlkPVxcXCJ7ezo6dW5pcXVlSWR9fS10aXRsZVxcXCIgcm9sZT1cXFwiaGVhZGluZ1xcXCIgYXJpYS1saXZlPVxcXCJhc3NlcnRpdmVcXFwiIGFyaWEtYXRvbWljPVxcXCJ0cnVlXFxcIiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgYnRuLXNtIHVpYi10aXRsZVxcXCIgbmctY2xpY2s9XFxcInRvZ2dsZU1vZGUoKVxcXCIgbmctZGlzYWJsZWQ9XFxcImRhdGVwaWNrZXJNb2RlID09PSBtYXhNb2RlXFxcIiB0YWJpbmRleD1cXFwiLTFcXFwiPjxzdHJvbmc+e3t0aXRsZX19PC9zdHJvbmc+PC9idXR0b24+PC90aD5cXG5cIiArXG4gICAgXCIgICAgICA8dGg+PGJ1dHRvbiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgYnRuLXNtIHB1bGwtcmlnaHQgdWliLXJpZ2h0XFxcIiBuZy1jbGljaz1cXFwibW92ZSgxKVxcXCIgdGFiaW5kZXg9XFxcIi0xXFxcIj48aSBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFxcXCI+PC9pPjxzcGFuIGNsYXNzPVxcXCJzci1vbmx5XFxcIj5uZXh0PC9zcGFuPjwvYnV0dG9uPjwvdGg+XFxuXCIgK1xuICAgIFwiICAgIDwvdHI+XFxuXCIgK1xuICAgIFwiICA8L3RoZWFkPlxcblwiICtcbiAgICBcIiAgPHRib2R5PlxcblwiICtcbiAgICBcIiAgICA8dHIgY2xhc3M9XFxcInVpYi15ZWFyc1xcXCIgbmctcmVwZWF0PVxcXCJyb3cgaW4gcm93cyB0cmFjayBieSAkaW5kZXhcXFwiIHJvbGU9XFxcInJvd1xcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkIG5nLXJlcGVhdD1cXFwiZHQgaW4gcm93XFxcIiBjbGFzcz1cXFwidWliLXllYXIgdGV4dC1jZW50ZXJcXFwiIHJvbGU9XFxcImdyaWRjZWxsXFxcIlxcblwiICtcbiAgICBcIiAgICAgICAgaWQ9XFxcInt7OjpkdC51aWR9fVxcXCJcXG5cIiArXG4gICAgXCIgICAgICAgIG5nLWNsYXNzPVxcXCI6OmR0LmN1c3RvbUNsYXNzXFxcIj5cXG5cIiArXG4gICAgXCIgICAgICAgIDxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0XFxcIlxcblwiICtcbiAgICBcIiAgICAgICAgICB1aWItaXMtY2xhc3M9XFxcIlxcblwiICtcbiAgICBcIiAgICAgICAgICAgICdidG4taW5mbycgZm9yIHNlbGVjdGVkRHQsXFxuXCIgK1xuICAgIFwiICAgICAgICAgICAgJ2FjdGl2ZScgZm9yIGFjdGl2ZUR0XFxuXCIgK1xuICAgIFwiICAgICAgICAgICAgb24gZHRcXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgIG5nLWNsaWNrPVxcXCJzZWxlY3QoZHQuZGF0ZSlcXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgIG5nLWRpc2FibGVkPVxcXCI6OmR0LmRpc2FibGVkXFxcIlxcblwiICtcbiAgICBcIiAgICAgICAgICB0YWJpbmRleD1cXFwiLTFcXFwiPjxzcGFuIG5nLWNsYXNzPVxcXCI6OnsndGV4dC1pbmZvJzogZHQuY3VycmVudH1cXFwiPnt7OjpkdC5sYWJlbH19PC9zcGFuPjwvYnV0dG9uPlxcblwiICtcbiAgICBcIiAgICAgIDwvdGQ+XFxuXCIgK1xuICAgIFwiICAgIDwvdHI+XFxuXCIgK1xuICAgIFwiICA8L3Rib2R5PlxcblwiICtcbiAgICBcIjwvdGFibGU+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9kYXRlcGlja2VyUG9wdXAvcG9wdXAuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS9kYXRlcGlja2VyUG9wdXAvcG9wdXAuaHRtbFwiLFxuICAgIFwiPHVsIHJvbGU9XFxcInByZXNlbnRhdGlvblxcXCIgY2xhc3M9XFxcInVpYi1kYXRlcGlja2VyLXBvcHVwIGRyb3Bkb3duLW1lbnUgdWliLXBvc2l0aW9uLW1lYXN1cmVcXFwiIGRyb3Bkb3duLW5lc3RlZCBuZy1pZj1cXFwiaXNPcGVuXFxcIiBuZy1rZXlkb3duPVxcXCJrZXlkb3duKCRldmVudClcXFwiIG5nLWNsaWNrPVxcXCIkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcXFwiPlxcblwiICtcbiAgICBcIiAgPGxpIG5nLXRyYW5zY2x1ZGU+PC9saT5cXG5cIiArXG4gICAgXCIgIDxsaSBuZy1pZj1cXFwic2hvd0J1dHRvbkJhclxcXCIgY2xhc3M9XFxcInVpYi1idXR0b24tYmFyXFxcIj5cXG5cIiArXG4gICAgXCIgICAgPHNwYW4gY2xhc3M9XFxcImJ0bi1ncm91cCBwdWxsLWxlZnRcXFwiPlxcblwiICtcbiAgICBcIiAgICAgIDxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1zbSBidG4taW5mbyB1aWItZGF0ZXBpY2tlci1jdXJyZW50XFxcIiBuZy1jbGljaz1cXFwic2VsZWN0KCd0b2RheScsICRldmVudClcXFwiIG5nLWRpc2FibGVkPVxcXCJpc0Rpc2FibGVkKCd0b2RheScpXFxcIj57eyBnZXRUZXh0KCdjdXJyZW50JykgfX08L2J1dHRvbj5cXG5cIiArXG4gICAgXCIgICAgICA8YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcImJ0biBidG4tc20gYnRuLWRhbmdlciB1aWItY2xlYXJcXFwiIG5nLWNsaWNrPVxcXCJzZWxlY3QobnVsbCwgJGV2ZW50KVxcXCI+e3sgZ2V0VGV4dCgnY2xlYXInKSB9fTwvYnV0dG9uPlxcblwiICtcbiAgICBcIiAgICA8L3NwYW4+XFxuXCIgK1xuICAgIFwiICAgIDxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1zbSBidG4tc3VjY2VzcyBwdWxsLXJpZ2h0IHVpYi1jbG9zZVxcXCIgbmctY2xpY2s9XFxcImNsb3NlKCRldmVudClcXFwiPnt7IGdldFRleHQoJ2Nsb3NlJykgfX08L2J1dHRvbj5cXG5cIiArXG4gICAgXCIgIDwvbGk+XFxuXCIgK1xuICAgIFwiPC91bD5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL21vZGFsL3dpbmRvdy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL21vZGFsL3dpbmRvdy5odG1sXCIsXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJtb2RhbC1kaWFsb2cge3tzaXplID8gJ21vZGFsLScgKyBzaXplIDogJyd9fVxcXCI+PGRpdiBjbGFzcz1cXFwibW9kYWwtY29udGVudFxcXCIgdWliLW1vZGFsLXRyYW5zY2x1ZGU+PC9kaXY+PC9kaXY+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9wYWdlci9wYWdlci5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL3BhZ2VyL3BhZ2VyLmh0bWxcIixcbiAgICBcIjxsaSBuZy1jbGFzcz1cXFwie2Rpc2FibGVkOiBub1ByZXZpb3VzKCl8fG5nRGlzYWJsZWQsIHByZXZpb3VzOiBhbGlnbn1cXFwiPjxhIGhyZWYgbmctY2xpY2s9XFxcInNlbGVjdFBhZ2UocGFnZSAtIDEsICRldmVudClcXFwiIG5nLWRpc2FibGVkPVxcXCJub1ByZXZpb3VzKCl8fG5nRGlzYWJsZWRcXFwiIHVpYi10YWJpbmRleC10b2dnbGU+e3s6OmdldFRleHQoJ3ByZXZpb3VzJyl9fTwvYT48L2xpPlxcblwiICtcbiAgICBcIjxsaSBuZy1jbGFzcz1cXFwie2Rpc2FibGVkOiBub05leHQoKXx8bmdEaXNhYmxlZCwgbmV4dDogYWxpZ259XFxcIj48YSBocmVmIG5nLWNsaWNrPVxcXCJzZWxlY3RQYWdlKHBhZ2UgKyAxLCAkZXZlbnQpXFxcIiBuZy1kaXNhYmxlZD1cXFwibm9OZXh0KCl8fG5nRGlzYWJsZWRcXFwiIHVpYi10YWJpbmRleC10b2dnbGU+e3s6OmdldFRleHQoJ25leHQnKX19PC9hPjwvbGk+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9wYWdpbmF0aW9uL3BhZ2luYXRpb24uaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS9wYWdpbmF0aW9uL3BhZ2luYXRpb24uaHRtbFwiLFxuICAgIFwiPGxpIHJvbGU9XFxcIm1lbnVpdGVtXFxcIiBuZy1pZj1cXFwiOjpib3VuZGFyeUxpbmtzXFxcIiBuZy1jbGFzcz1cXFwie2Rpc2FibGVkOiBub1ByZXZpb3VzKCl8fG5nRGlzYWJsZWR9XFxcIiBjbGFzcz1cXFwicGFnaW5hdGlvbi1maXJzdFxcXCI+PGEgaHJlZiBuZy1jbGljaz1cXFwic2VsZWN0UGFnZSgxLCAkZXZlbnQpXFxcIiBuZy1kaXNhYmxlZD1cXFwibm9QcmV2aW91cygpfHxuZ0Rpc2FibGVkXFxcIiB1aWItdGFiaW5kZXgtdG9nZ2xlPnt7OjpnZXRUZXh0KCdmaXJzdCcpfX08L2E+PC9saT5cXG5cIiArXG4gICAgXCI8bGkgcm9sZT1cXFwibWVudWl0ZW1cXFwiIG5nLWlmPVxcXCI6OmRpcmVjdGlvbkxpbmtzXFxcIiBuZy1jbGFzcz1cXFwie2Rpc2FibGVkOiBub1ByZXZpb3VzKCl8fG5nRGlzYWJsZWR9XFxcIiBjbGFzcz1cXFwicGFnaW5hdGlvbi1wcmV2XFxcIj48YSBocmVmIG5nLWNsaWNrPVxcXCJzZWxlY3RQYWdlKHBhZ2UgLSAxLCAkZXZlbnQpXFxcIiBuZy1kaXNhYmxlZD1cXFwibm9QcmV2aW91cygpfHxuZ0Rpc2FibGVkXFxcIiB1aWItdGFiaW5kZXgtdG9nZ2xlPnt7OjpnZXRUZXh0KCdwcmV2aW91cycpfX08L2E+PC9saT5cXG5cIiArXG4gICAgXCI8bGkgcm9sZT1cXFwibWVudWl0ZW1cXFwiIG5nLXJlcGVhdD1cXFwicGFnZSBpbiBwYWdlcyB0cmFjayBieSAkaW5kZXhcXFwiIG5nLWNsYXNzPVxcXCJ7YWN0aXZlOiBwYWdlLmFjdGl2ZSxkaXNhYmxlZDogbmdEaXNhYmxlZCYmIXBhZ2UuYWN0aXZlfVxcXCIgY2xhc3M9XFxcInBhZ2luYXRpb24tcGFnZVxcXCI+PGEgaHJlZiBuZy1jbGljaz1cXFwic2VsZWN0UGFnZShwYWdlLm51bWJlciwgJGV2ZW50KVxcXCIgbmctZGlzYWJsZWQ9XFxcIm5nRGlzYWJsZWQmJiFwYWdlLmFjdGl2ZVxcXCIgdWliLXRhYmluZGV4LXRvZ2dsZT57e3BhZ2UudGV4dH19PC9hPjwvbGk+XFxuXCIgK1xuICAgIFwiPGxpIHJvbGU9XFxcIm1lbnVpdGVtXFxcIiBuZy1pZj1cXFwiOjpkaXJlY3Rpb25MaW5rc1xcXCIgbmctY2xhc3M9XFxcIntkaXNhYmxlZDogbm9OZXh0KCl8fG5nRGlzYWJsZWR9XFxcIiBjbGFzcz1cXFwicGFnaW5hdGlvbi1uZXh0XFxcIj48YSBocmVmIG5nLWNsaWNrPVxcXCJzZWxlY3RQYWdlKHBhZ2UgKyAxLCAkZXZlbnQpXFxcIiBuZy1kaXNhYmxlZD1cXFwibm9OZXh0KCl8fG5nRGlzYWJsZWRcXFwiIHVpYi10YWJpbmRleC10b2dnbGU+e3s6OmdldFRleHQoJ25leHQnKX19PC9hPjwvbGk+XFxuXCIgK1xuICAgIFwiPGxpIHJvbGU9XFxcIm1lbnVpdGVtXFxcIiBuZy1pZj1cXFwiOjpib3VuZGFyeUxpbmtzXFxcIiBuZy1jbGFzcz1cXFwie2Rpc2FibGVkOiBub05leHQoKXx8bmdEaXNhYmxlZH1cXFwiIGNsYXNzPVxcXCJwYWdpbmF0aW9uLWxhc3RcXFwiPjxhIGhyZWYgbmctY2xpY2s9XFxcInNlbGVjdFBhZ2UodG90YWxQYWdlcywgJGV2ZW50KVxcXCIgbmctZGlzYWJsZWQ9XFxcIm5vTmV4dCgpfHxuZ0Rpc2FibGVkXFxcIiB1aWItdGFiaW5kZXgtdG9nZ2xlPnt7OjpnZXRUZXh0KCdsYXN0Jyl9fTwvYT48L2xpPlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvdG9vbHRpcC90b29sdGlwLWh0bWwtcG9wdXAuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS90b29sdGlwL3Rvb2x0aXAtaHRtbC1wb3B1cC5odG1sXCIsXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJ0b29sdGlwLWFycm93XFxcIj48L2Rpdj5cXG5cIiArXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJ0b29sdGlwLWlubmVyXFxcIiBuZy1iaW5kLWh0bWw9XFxcImNvbnRlbnRFeHAoKVxcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS90b29sdGlwL3Rvb2x0aXAtcG9wdXAuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS90b29sdGlwL3Rvb2x0aXAtcG9wdXAuaHRtbFwiLFxuICAgIFwiPGRpdiBjbGFzcz1cXFwidG9vbHRpcC1hcnJvd1xcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiPGRpdiBjbGFzcz1cXFwidG9vbHRpcC1pbm5lclxcXCIgbmctYmluZD1cXFwiY29udGVudFxcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS90b29sdGlwL3Rvb2x0aXAtdGVtcGxhdGUtcG9wdXAuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS90b29sdGlwL3Rvb2x0aXAtdGVtcGxhdGUtcG9wdXAuaHRtbFwiLFxuICAgIFwiPGRpdiBjbGFzcz1cXFwidG9vbHRpcC1hcnJvd1xcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiPGRpdiBjbGFzcz1cXFwidG9vbHRpcC1pbm5lclxcXCJcXG5cIiArXG4gICAgXCIgIHVpYi10b29sdGlwLXRlbXBsYXRlLXRyYW5zY2x1ZGU9XFxcImNvbnRlbnRFeHAoKVxcXCJcXG5cIiArXG4gICAgXCIgIHRvb2x0aXAtdGVtcGxhdGUtdHJhbnNjbHVkZS1zY29wZT1cXFwib3JpZ2luU2NvcGUoKVxcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9wb3BvdmVyL3BvcG92ZXItaHRtbC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL3BvcG92ZXIvcG9wb3Zlci1odG1sLmh0bWxcIixcbiAgICBcIjxkaXYgY2xhc3M9XFxcImFycm93XFxcIj48L2Rpdj5cXG5cIiArXG4gICAgXCJcXG5cIiArXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJwb3BvdmVyLWlubmVyXFxcIj5cXG5cIiArXG4gICAgXCIgICAgPGgzIGNsYXNzPVxcXCJwb3BvdmVyLXRpdGxlXFxcIiBuZy1iaW5kPVxcXCJ1aWJUaXRsZVxcXCIgbmctaWY9XFxcInVpYlRpdGxlXFxcIj48L2gzPlxcblwiICtcbiAgICBcIiAgICA8ZGl2IGNsYXNzPVxcXCJwb3BvdmVyLWNvbnRlbnRcXFwiIG5nLWJpbmQtaHRtbD1cXFwiY29udGVudEV4cCgpXFxcIj48L2Rpdj5cXG5cIiArXG4gICAgXCI8L2Rpdj5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL3BvcG92ZXIvcG9wb3Zlci10ZW1wbGF0ZS5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL3BvcG92ZXIvcG9wb3Zlci10ZW1wbGF0ZS5odG1sXCIsXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJhcnJvd1xcXCI+PC9kaXY+XFxuXCIgK1xuICAgIFwiXFxuXCIgK1xuICAgIFwiPGRpdiBjbGFzcz1cXFwicG9wb3Zlci1pbm5lclxcXCI+XFxuXCIgK1xuICAgIFwiICAgIDxoMyBjbGFzcz1cXFwicG9wb3Zlci10aXRsZVxcXCIgbmctYmluZD1cXFwidWliVGl0bGVcXFwiIG5nLWlmPVxcXCJ1aWJUaXRsZVxcXCI+PC9oMz5cXG5cIiArXG4gICAgXCIgICAgPGRpdiBjbGFzcz1cXFwicG9wb3Zlci1jb250ZW50XFxcIlxcblwiICtcbiAgICBcIiAgICAgIHVpYi10b29sdGlwLXRlbXBsYXRlLXRyYW5zY2x1ZGU9XFxcImNvbnRlbnRFeHAoKVxcXCJcXG5cIiArXG4gICAgXCIgICAgICB0b29sdGlwLXRlbXBsYXRlLXRyYW5zY2x1ZGUtc2NvcGU9XFxcIm9yaWdpblNjb3BlKClcXFwiPjwvZGl2PlxcblwiICtcbiAgICBcIjwvZGl2PlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvcG9wb3Zlci9wb3BvdmVyLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvcG9wb3Zlci9wb3BvdmVyLmh0bWxcIixcbiAgICBcIjxkaXYgY2xhc3M9XFxcImFycm93XFxcIj48L2Rpdj5cXG5cIiArXG4gICAgXCJcXG5cIiArXG4gICAgXCI8ZGl2IGNsYXNzPVxcXCJwb3BvdmVyLWlubmVyXFxcIj5cXG5cIiArXG4gICAgXCIgICAgPGgzIGNsYXNzPVxcXCJwb3BvdmVyLXRpdGxlXFxcIiBuZy1iaW5kPVxcXCJ1aWJUaXRsZVxcXCIgbmctaWY9XFxcInVpYlRpdGxlXFxcIj48L2gzPlxcblwiICtcbiAgICBcIiAgICA8ZGl2IGNsYXNzPVxcXCJwb3BvdmVyLWNvbnRlbnRcXFwiIG5nLWJpbmQ9XFxcImNvbnRlbnRcXFwiPjwvZGl2PlxcblwiICtcbiAgICBcIjwvZGl2PlxcblwiICtcbiAgICBcIlwiKTtcbn1dKTtcblxuYW5ndWxhci5tb2R1bGUoXCJ1aWIvdGVtcGxhdGUvcHJvZ3Jlc3NiYXIvYmFyLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvcHJvZ3Jlc3NiYXIvYmFyLmh0bWxcIixcbiAgICBcIjxkaXYgY2xhc3M9XFxcInByb2dyZXNzLWJhclxcXCIgbmctY2xhc3M9XFxcInR5cGUgJiYgJ3Byb2dyZXNzLWJhci0nICsgdHlwZVxcXCIgcm9sZT1cXFwicHJvZ3Jlc3NiYXJcXFwiIGFyaWEtdmFsdWVub3c9XFxcInt7dmFsdWV9fVxcXCIgYXJpYS12YWx1ZW1pbj1cXFwiMFxcXCIgYXJpYS12YWx1ZW1heD1cXFwie3ttYXh9fVxcXCIgbmctc3R5bGU9XFxcInt3aWR0aDogKHBlcmNlbnQgPCAxMDAgPyBwZXJjZW50IDogMTAwKSArICclJ31cXFwiIGFyaWEtdmFsdWV0ZXh0PVxcXCJ7e3BlcmNlbnQgfCBudW1iZXI6MH19JVxcXCIgYXJpYS1sYWJlbGxlZGJ5PVxcXCJ7ezo6dGl0bGV9fVxcXCIgbmctdHJhbnNjbHVkZT48L2Rpdj5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL3Byb2dyZXNzLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvcHJvZ3Jlc3NiYXIvcHJvZ3Jlc3MuaHRtbFwiLFxuICAgIFwiPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3NcXFwiIG5nLXRyYW5zY2x1ZGUgYXJpYS1sYWJlbGxlZGJ5PVxcXCJ7ezo6dGl0bGV9fVxcXCI+PC9kaXY+XCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS9wcm9ncmVzc2Jhci9wcm9ncmVzc2Jhci5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgJHRlbXBsYXRlQ2FjaGUucHV0KFwidWliL3RlbXBsYXRlL3Byb2dyZXNzYmFyL3Byb2dyZXNzYmFyLmh0bWxcIixcbiAgICBcIjxkaXYgY2xhc3M9XFxcInByb2dyZXNzXFxcIj5cXG5cIiArXG4gICAgXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzLWJhclxcXCIgbmctY2xhc3M9XFxcInR5cGUgJiYgJ3Byb2dyZXNzLWJhci0nICsgdHlwZVxcXCIgcm9sZT1cXFwicHJvZ3Jlc3NiYXJcXFwiIGFyaWEtdmFsdWVub3c9XFxcInt7dmFsdWV9fVxcXCIgYXJpYS12YWx1ZW1pbj1cXFwiMFxcXCIgYXJpYS12YWx1ZW1heD1cXFwie3ttYXh9fVxcXCIgbmctc3R5bGU9XFxcInt3aWR0aDogKHBlcmNlbnQgPCAxMDAgPyBwZXJjZW50IDogMTAwKSArICclJ31cXFwiIGFyaWEtdmFsdWV0ZXh0PVxcXCJ7e3BlcmNlbnQgfCBudW1iZXI6MH19JVxcXCIgYXJpYS1sYWJlbGxlZGJ5PVxcXCJ7ezo6dGl0bGV9fVxcXCIgbmctdHJhbnNjbHVkZT48L2Rpdj5cXG5cIiArXG4gICAgXCI8L2Rpdj5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL3JhdGluZy9yYXRpbmcuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS9yYXRpbmcvcmF0aW5nLmh0bWxcIixcbiAgICBcIjxzcGFuIG5nLW1vdXNlbGVhdmU9XFxcInJlc2V0KClcXFwiIG5nLWtleWRvd249XFxcIm9uS2V5ZG93bigkZXZlbnQpXFxcIiB0YWJpbmRleD1cXFwiMFxcXCIgcm9sZT1cXFwic2xpZGVyXFxcIiBhcmlhLXZhbHVlbWluPVxcXCIwXFxcIiBhcmlhLXZhbHVlbWF4PVxcXCJ7e3JhbmdlLmxlbmd0aH19XFxcIiBhcmlhLXZhbHVlbm93PVxcXCJ7e3ZhbHVlfX1cXFwiIGFyaWEtdmFsdWV0ZXh0PVxcXCJ7e3RpdGxlfX1cXFwiPlxcblwiICtcbiAgICBcIiAgICA8c3BhbiBuZy1yZXBlYXQtc3RhcnQ9XFxcInIgaW4gcmFuZ2UgdHJhY2sgYnkgJGluZGV4XFxcIiBjbGFzcz1cXFwic3Itb25seVxcXCI+KHt7ICRpbmRleCA8IHZhbHVlID8gJyonIDogJyAnIH19KTwvc3Bhbj5cXG5cIiArXG4gICAgXCIgICAgPGkgbmctcmVwZWF0LWVuZCBuZy1tb3VzZWVudGVyPVxcXCJlbnRlcigkaW5kZXggKyAxKVxcXCIgbmctY2xpY2s9XFxcInJhdGUoJGluZGV4ICsgMSlcXFwiIGNsYXNzPVxcXCJnbHlwaGljb25cXFwiIG5nLWNsYXNzPVxcXCIkaW5kZXggPCB2YWx1ZSAmJiAoci5zdGF0ZU9uIHx8ICdnbHlwaGljb24tc3RhcicpIHx8IChyLnN0YXRlT2ZmIHx8ICdnbHlwaGljb24tc3Rhci1lbXB0eScpXFxcIiBuZy1hdHRyLXRpdGxlPVxcXCJ7e3IudGl0bGV9fVxcXCI+PC9pPlxcblwiICtcbiAgICBcIjwvc3Bhbj5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL3RhYnMvdGFiLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvdGFicy90YWIuaHRtbFwiLFxuICAgIFwiPGxpIG5nLWNsYXNzPVxcXCJbe2FjdGl2ZTogYWN0aXZlLCBkaXNhYmxlZDogZGlzYWJsZWR9LCBjbGFzc2VzXVxcXCIgY2xhc3M9XFxcInVpYi10YWIgbmF2LWl0ZW1cXFwiPlxcblwiICtcbiAgICBcIiAgPGEgaHJlZiBuZy1jbGljaz1cXFwic2VsZWN0KCRldmVudClcXFwiIGNsYXNzPVxcXCJuYXYtbGlua1xcXCIgdWliLXRhYi1oZWFkaW5nLXRyYW5zY2x1ZGU+e3toZWFkaW5nfX08L2E+XFxuXCIgK1xuICAgIFwiPC9saT5cXG5cIiArXG4gICAgXCJcIik7XG59XSk7XG5cbmFuZ3VsYXIubW9kdWxlKFwidWliL3RlbXBsYXRlL3RhYnMvdGFic2V0Lmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvdGFicy90YWJzZXQuaHRtbFwiLFxuICAgIFwiPGRpdj5cXG5cIiArXG4gICAgXCIgIDx1bCBjbGFzcz1cXFwibmF2IG5hdi17e3RhYnNldC50eXBlIHx8ICd0YWJzJ319XFxcIiBuZy1jbGFzcz1cXFwieyduYXYtc3RhY2tlZCc6IHZlcnRpY2FsLCAnbmF2LWp1c3RpZmllZCc6IGp1c3RpZmllZH1cXFwiIG5nLXRyYW5zY2x1ZGU+PC91bD5cXG5cIiArXG4gICAgXCIgIDxkaXYgY2xhc3M9XFxcInRhYi1jb250ZW50XFxcIj5cXG5cIiArXG4gICAgXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmVcXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgbmctcmVwZWF0PVxcXCJ0YWIgaW4gdGFic2V0LnRhYnNcXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgbmctY2xhc3M9XFxcInthY3RpdmU6IHRhYnNldC5hY3RpdmUgPT09IHRhYi5pbmRleH1cXFwiXFxuXCIgK1xuICAgIFwiICAgICAgICAgdWliLXRhYi1jb250ZW50LXRyYW5zY2x1ZGU9XFxcInRhYlxcXCI+XFxuXCIgK1xuICAgIFwiICAgIDwvZGl2PlxcblwiICtcbiAgICBcIiAgPC9kaXY+XFxuXCIgK1xuICAgIFwiPC9kaXY+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS90aW1lcGlja2VyL3RpbWVwaWNrZXIuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG4gICR0ZW1wbGF0ZUNhY2hlLnB1dChcInVpYi90ZW1wbGF0ZS90aW1lcGlja2VyL3RpbWVwaWNrZXIuaHRtbFwiLFxuICAgIFwiPHRhYmxlIGNsYXNzPVxcXCJ1aWItdGltZXBpY2tlclxcXCI+XFxuXCIgK1xuICAgIFwiICA8dGJvZHk+XFxuXCIgK1xuICAgIFwiICAgIDx0ciBjbGFzcz1cXFwidGV4dC1jZW50ZXJcXFwiIG5nLXNob3c9XFxcIjo6c2hvd1NwaW5uZXJzXFxcIj5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgY2xhc3M9XFxcInVpYi1pbmNyZW1lbnQgaG91cnNcXFwiPjxhIG5nLWNsaWNrPVxcXCJpbmNyZW1lbnRIb3VycygpXFxcIiBuZy1jbGFzcz1cXFwie2Rpc2FibGVkOiBub0luY3JlbWVudEhvdXJzKCl9XFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1saW5rXFxcIiBuZy1kaXNhYmxlZD1cXFwibm9JbmNyZW1lbnRIb3VycygpXFxcIiB0YWJpbmRleD1cXFwiLTFcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXBcXFwiPjwvc3Bhbj48L2E+PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQ+Jm5ic3A7PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgY2xhc3M9XFxcInVpYi1pbmNyZW1lbnQgbWludXRlc1xcXCI+PGEgbmctY2xpY2s9XFxcImluY3JlbWVudE1pbnV0ZXMoKVxcXCIgbmctY2xhc3M9XFxcIntkaXNhYmxlZDogbm9JbmNyZW1lbnRNaW51dGVzKCl9XFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1saW5rXFxcIiBuZy1kaXNhYmxlZD1cXFwibm9JbmNyZW1lbnRNaW51dGVzKClcXFwiIHRhYmluZGV4PVxcXCItMVxcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi11cFxcXCI+PC9zcGFuPjwvYT48L3RkPlxcblwiICtcbiAgICBcIiAgICAgIDx0ZCBuZy1zaG93PVxcXCJzaG93U2Vjb25kc1xcXCI+Jm5ic3A7PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgbmctc2hvdz1cXFwic2hvd1NlY29uZHNcXFwiIGNsYXNzPVxcXCJ1aWItaW5jcmVtZW50IHNlY29uZHNcXFwiPjxhIG5nLWNsaWNrPVxcXCJpbmNyZW1lbnRTZWNvbmRzKClcXFwiIG5nLWNsYXNzPVxcXCJ7ZGlzYWJsZWQ6IG5vSW5jcmVtZW50U2Vjb25kcygpfVxcXCIgY2xhc3M9XFxcImJ0biBidG4tbGlua1xcXCIgbmctZGlzYWJsZWQ9XFxcIm5vSW5jcmVtZW50U2Vjb25kcygpXFxcIiB0YWJpbmRleD1cXFwiLTFcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXBcXFwiPjwvc3Bhbj48L2E+PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgbmctc2hvdz1cXFwic2hvd01lcmlkaWFuXFxcIj48L3RkPlxcblwiICtcbiAgICBcIiAgICA8L3RyPlxcblwiICtcbiAgICBcIiAgICA8dHI+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkIGNsYXNzPVxcXCJmb3JtLWdyb3VwIHVpYi10aW1lIGhvdXJzXFxcIiBuZy1jbGFzcz1cXFwieydoYXMtZXJyb3InOiBpbnZhbGlkSG91cnN9XFxcIj5cXG5cIiArXG4gICAgXCIgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBwbGFjZWhvbGRlcj1cXFwiSEhcXFwiIG5nLW1vZGVsPVxcXCJob3Vyc1xcXCIgbmctY2hhbmdlPVxcXCJ1cGRhdGVIb3VycygpXFxcIiBjbGFzcz1cXFwiZm9ybS1jb250cm9sIHRleHQtY2VudGVyXFxcIiBuZy1yZWFkb25seT1cXFwiOjpyZWFkb25seUlucHV0XFxcIiBtYXhsZW5ndGg9XFxcIjJcXFwiIHRhYmluZGV4PVxcXCJ7ezo6dGFiaW5kZXh9fVxcXCIgbmctZGlzYWJsZWQ9XFxcIm5vSW5jcmVtZW50SG91cnMoKVxcXCIgbmctYmx1cj1cXFwiYmx1cigpXFxcIj5cXG5cIiArXG4gICAgXCIgICAgICA8L3RkPlxcblwiICtcbiAgICBcIiAgICAgIDx0ZCBjbGFzcz1cXFwidWliLXNlcGFyYXRvclxcXCI+OjwvdGQ+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkIGNsYXNzPVxcXCJmb3JtLWdyb3VwIHVpYi10aW1lIG1pbnV0ZXNcXFwiIG5nLWNsYXNzPVxcXCJ7J2hhcy1lcnJvcic6IGludmFsaWRNaW51dGVzfVxcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgICA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIk1NXFxcIiBuZy1tb2RlbD1cXFwibWludXRlc1xcXCIgbmctY2hhbmdlPVxcXCJ1cGRhdGVNaW51dGVzKClcXFwiIGNsYXNzPVxcXCJmb3JtLWNvbnRyb2wgdGV4dC1jZW50ZXJcXFwiIG5nLXJlYWRvbmx5PVxcXCI6OnJlYWRvbmx5SW5wdXRcXFwiIG1heGxlbmd0aD1cXFwiMlxcXCIgdGFiaW5kZXg9XFxcInt7Ojp0YWJpbmRleH19XFxcIiBuZy1kaXNhYmxlZD1cXFwibm9JbmNyZW1lbnRNaW51dGVzKClcXFwiIG5nLWJsdXI9XFxcImJsdXIoKVxcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgPC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgbmctc2hvdz1cXFwic2hvd1NlY29uZHNcXFwiIGNsYXNzPVxcXCJ1aWItc2VwYXJhdG9yXFxcIj46PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgY2xhc3M9XFxcImZvcm0tZ3JvdXAgdWliLXRpbWUgc2Vjb25kc1xcXCIgbmctY2xhc3M9XFxcInsnaGFzLWVycm9yJzogaW52YWxpZFNlY29uZHN9XFxcIiBuZy1zaG93PVxcXCJzaG93U2Vjb25kc1xcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgICA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIlNTXFxcIiBuZy1tb2RlbD1cXFwic2Vjb25kc1xcXCIgbmctY2hhbmdlPVxcXCJ1cGRhdGVTZWNvbmRzKClcXFwiIGNsYXNzPVxcXCJmb3JtLWNvbnRyb2wgdGV4dC1jZW50ZXJcXFwiIG5nLXJlYWRvbmx5PVxcXCJyZWFkb25seUlucHV0XFxcIiBtYXhsZW5ndGg9XFxcIjJcXFwiIHRhYmluZGV4PVxcXCJ7ezo6dGFiaW5kZXh9fVxcXCIgbmctZGlzYWJsZWQ9XFxcIm5vSW5jcmVtZW50U2Vjb25kcygpXFxcIiBuZy1ibHVyPVxcXCJibHVyKClcXFwiPlxcblwiICtcbiAgICBcIiAgICAgIDwvdGQ+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkIG5nLXNob3c9XFxcInNob3dNZXJpZGlhblxcXCIgY2xhc3M9XFxcInVpYi10aW1lIGFtLXBtXFxcIj48YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgbmctY2xhc3M9XFxcIntkaXNhYmxlZDogbm9Ub2dnbGVNZXJpZGlhbigpfVxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCB0ZXh0LWNlbnRlclxcXCIgbmctY2xpY2s9XFxcInRvZ2dsZU1lcmlkaWFuKClcXFwiIG5nLWRpc2FibGVkPVxcXCJub1RvZ2dsZU1lcmlkaWFuKClcXFwiIHRhYmluZGV4PVxcXCJ7ezo6dGFiaW5kZXh9fVxcXCI+e3ttZXJpZGlhbn19PC9idXR0b24+PC90ZD5cXG5cIiArXG4gICAgXCIgICAgPC90cj5cXG5cIiArXG4gICAgXCIgICAgPHRyIGNsYXNzPVxcXCJ0ZXh0LWNlbnRlclxcXCIgbmctc2hvdz1cXFwiOjpzaG93U3Bpbm5lcnNcXFwiPlxcblwiICtcbiAgICBcIiAgICAgIDx0ZCBjbGFzcz1cXFwidWliLWRlY3JlbWVudCBob3Vyc1xcXCI+PGEgbmctY2xpY2s9XFxcImRlY3JlbWVudEhvdXJzKClcXFwiIG5nLWNsYXNzPVxcXCJ7ZGlzYWJsZWQ6IG5vRGVjcmVtZW50SG91cnMoKX1cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWxpbmtcXFwiIG5nLWRpc2FibGVkPVxcXCJub0RlY3JlbWVudEhvdXJzKClcXFwiIHRhYmluZGV4PVxcXCItMVxcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1kb3duXFxcIj48L3NwYW4+PC9hPjwvdGQ+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkPiZuYnNwOzwvdGQ+XFxuXCIgK1xuICAgIFwiICAgICAgPHRkIGNsYXNzPVxcXCJ1aWItZGVjcmVtZW50IG1pbnV0ZXNcXFwiPjxhIG5nLWNsaWNrPVxcXCJkZWNyZW1lbnRNaW51dGVzKClcXFwiIG5nLWNsYXNzPVxcXCJ7ZGlzYWJsZWQ6IG5vRGVjcmVtZW50TWludXRlcygpfVxcXCIgY2xhc3M9XFxcImJ0biBidG4tbGlua1xcXCIgbmctZGlzYWJsZWQ9XFxcIm5vRGVjcmVtZW50TWludXRlcygpXFxcIiB0YWJpbmRleD1cXFwiLTFcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tZG93blxcXCI+PC9zcGFuPjwvYT48L3RkPlxcblwiICtcbiAgICBcIiAgICAgIDx0ZCBuZy1zaG93PVxcXCJzaG93U2Vjb25kc1xcXCI+Jm5ic3A7PC90ZD5cXG5cIiArXG4gICAgXCIgICAgICA8dGQgbmctc2hvdz1cXFwic2hvd1NlY29uZHNcXFwiIGNsYXNzPVxcXCJ1aWItZGVjcmVtZW50IHNlY29uZHNcXFwiPjxhIG5nLWNsaWNrPVxcXCJkZWNyZW1lbnRTZWNvbmRzKClcXFwiIG5nLWNsYXNzPVxcXCJ7ZGlzYWJsZWQ6IG5vRGVjcmVtZW50U2Vjb25kcygpfVxcXCIgY2xhc3M9XFxcImJ0biBidG4tbGlua1xcXCIgbmctZGlzYWJsZWQ9XFxcIm5vRGVjcmVtZW50U2Vjb25kcygpXFxcIiB0YWJpbmRleD1cXFwiLTFcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tZG93blxcXCI+PC9zcGFuPjwvYT48L3RkPlxcblwiICtcbiAgICBcIiAgICAgIDx0ZCBuZy1zaG93PVxcXCJzaG93TWVyaWRpYW5cXFwiPjwvdGQ+XFxuXCIgK1xuICAgIFwiICAgIDwvdHI+XFxuXCIgK1xuICAgIFwiICA8L3Rib2R5PlxcblwiICtcbiAgICBcIjwvdGFibGU+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS90eXBlYWhlYWQvdHlwZWFoZWFkLW1hdGNoLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvdHlwZWFoZWFkL3R5cGVhaGVhZC1tYXRjaC5odG1sXCIsXG4gICAgXCI8YSBocmVmXFxuXCIgK1xuICAgIFwiICAgdGFiaW5kZXg9XFxcIi0xXFxcIlxcblwiICtcbiAgICBcIiAgIG5nLWJpbmQtaHRtbD1cXFwibWF0Y2gubGFiZWwgfCB1aWJUeXBlYWhlYWRIaWdobGlnaHQ6cXVlcnlcXFwiXFxuXCIgK1xuICAgIFwiICAgbmctYXR0ci10aXRsZT1cXFwie3ttYXRjaC5sYWJlbH19XFxcIj48L2E+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuXG5hbmd1bGFyLm1vZHVsZShcInVpYi90ZW1wbGF0ZS90eXBlYWhlYWQvdHlwZWFoZWFkLXBvcHVwLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAkdGVtcGxhdGVDYWNoZS5wdXQoXCJ1aWIvdGVtcGxhdGUvdHlwZWFoZWFkL3R5cGVhaGVhZC1wb3B1cC5odG1sXCIsXG4gICAgXCI8dWwgY2xhc3M9XFxcImRyb3Bkb3duLW1lbnVcXFwiIG5nLXNob3c9XFxcImlzT3BlbigpICYmICFtb3ZlSW5Qcm9ncmVzc1xcXCIgbmctc3R5bGU9XFxcInt0b3A6IHBvc2l0aW9uKCkudG9wKydweCcsIGxlZnQ6IHBvc2l0aW9uKCkubGVmdCsncHgnfVxcXCIgcm9sZT1cXFwibGlzdGJveFxcXCIgYXJpYS1oaWRkZW49XFxcInt7IWlzT3BlbigpfX1cXFwiPlxcblwiICtcbiAgICBcIiAgICA8bGkgY2xhc3M9XFxcInVpYi10eXBlYWhlYWQtbWF0Y2hcXFwiIG5nLXJlcGVhdD1cXFwibWF0Y2ggaW4gbWF0Y2hlcyB0cmFjayBieSAkaW5kZXhcXFwiIG5nLWNsYXNzPVxcXCJ7YWN0aXZlOiBpc0FjdGl2ZSgkaW5kZXgpIH1cXFwiIG5nLW1vdXNlZW50ZXI9XFxcInNlbGVjdEFjdGl2ZSgkaW5kZXgpXFxcIiBuZy1jbGljaz1cXFwic2VsZWN0TWF0Y2goJGluZGV4LCAkZXZlbnQpXFxcIiByb2xlPVxcXCJvcHRpb25cXFwiIGlkPVxcXCJ7ezo6bWF0Y2guaWR9fVxcXCI+XFxuXCIgK1xuICAgIFwiICAgICAgICA8ZGl2IHVpYi10eXBlYWhlYWQtbWF0Y2ggaW5kZXg9XFxcIiRpbmRleFxcXCIgbWF0Y2g9XFxcIm1hdGNoXFxcIiBxdWVyeT1cXFwicXVlcnlcXFwiIHRlbXBsYXRlLXVybD1cXFwidGVtcGxhdGVVcmxcXFwiPjwvZGl2PlxcblwiICtcbiAgICBcIiAgICA8L2xpPlxcblwiICtcbiAgICBcIjwvdWw+XFxuXCIgK1xuICAgIFwiXCIpO1xufV0pO1xuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5jYXJvdXNlbCcpLnJ1bihmdW5jdGlvbigpIHshYW5ndWxhci4kJGNzcCgpLm5vSW5saW5lU3R5bGUgJiYgIWFuZ3VsYXIuJCR1aWJDYXJvdXNlbENzcyAmJiBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2hlYWQnKS5wcmVwZW5kKCc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+Lm5nLWFuaW1hdGUuaXRlbTpub3QoLmxlZnQpOm5vdCgucmlnaHQpey13ZWJraXQtdHJhbnNpdGlvbjowcyBlYXNlLWluLW91dCBsZWZ0O3RyYW5zaXRpb246MHMgZWFzZS1pbi1vdXQgbGVmdH08L3N0eWxlPicpOyBhbmd1bGFyLiQkdWliQ2Fyb3VzZWxDc3MgPSB0cnVlOyB9KTtcbmFuZ3VsYXIubW9kdWxlKCd1aS5ib290c3RyYXAuZGF0ZXBpY2tlcicpLnJ1bihmdW5jdGlvbigpIHshYW5ndWxhci4kJGNzcCgpLm5vSW5saW5lU3R5bGUgJiYgIWFuZ3VsYXIuJCR1aWJEYXRlcGlja2VyQ3NzICYmIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnaGVhZCcpLnByZXBlbmQoJzxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj4udWliLWRhdGVwaWNrZXIgLnVpYi10aXRsZXt3aWR0aDoxMDAlO30udWliLWRheSBidXR0b24sLnVpYi1tb250aCBidXR0b24sLnVpYi15ZWFyIGJ1dHRvbnttaW4td2lkdGg6MTAwJTt9LnVpYi1sZWZ0LC51aWItcmlnaHR7d2lkdGg6MTAwJX08L3N0eWxlPicpOyBhbmd1bGFyLiQkdWliRGF0ZXBpY2tlckNzcyA9IHRydWU7IH0pO1xuYW5ndWxhci5tb2R1bGUoJ3VpLmJvb3RzdHJhcC5wb3NpdGlvbicpLnJ1bihmdW5jdGlvbigpIHshYW5ndWxhci4kJGNzcCgpLm5vSW5saW5lU3R5bGUgJiYgIWFuZ3VsYXIuJCR1aWJQb3NpdGlvbkNzcyAmJiBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2hlYWQnKS5wcmVwZW5kKCc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+LnVpYi1wb3NpdGlvbi1tZWFzdXJle2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudDt2aXNpYmlsaXR5OmhpZGRlbiAhaW1wb3J0YW50O3Bvc2l0aW9uOmFic29sdXRlICFpbXBvcnRhbnQ7dG9wOi05OTk5cHggIWltcG9ydGFudDtsZWZ0Oi05OTk5cHggIWltcG9ydGFudDt9LnVpYi1wb3NpdGlvbi1zY3JvbGxiYXItbWVhc3VyZXtwb3NpdGlvbjphYnNvbHV0ZSAhaW1wb3J0YW50O3RvcDotOTk5OXB4ICFpbXBvcnRhbnQ7d2lkdGg6NTBweCAhaW1wb3J0YW50O2hlaWdodDo1MHB4ICFpbXBvcnRhbnQ7b3ZlcmZsb3c6c2Nyb2xsICFpbXBvcnRhbnQ7fS51aWItcG9zaXRpb24tYm9keS1zY3JvbGxiYXItbWVhc3VyZXtvdmVyZmxvdzpzY3JvbGwgIWltcG9ydGFudDt9PC9zdHlsZT4nKTsgYW5ndWxhci4kJHVpYlBvc2l0aW9uQ3NzID0gdHJ1ZTsgfSk7XG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLmRhdGVwaWNrZXJQb3B1cCcpLnJ1bihmdW5jdGlvbigpIHshYW5ndWxhci4kJGNzcCgpLm5vSW5saW5lU3R5bGUgJiYgIWFuZ3VsYXIuJCR1aWJEYXRlcGlja2VycG9wdXBDc3MgJiYgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdoZWFkJykucHJlcGVuZCgnPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPi51aWItZGF0ZXBpY2tlci1wb3B1cC5kcm9wZG93bi1tZW51e2Rpc3BsYXk6YmxvY2s7ZmxvYXQ6bm9uZTttYXJnaW46MDt9LnVpYi1idXR0b24tYmFye3BhZGRpbmc6MTBweCA5cHggMnB4O308L3N0eWxlPicpOyBhbmd1bGFyLiQkdWliRGF0ZXBpY2tlcnBvcHVwQ3NzID0gdHJ1ZTsgfSk7XG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLnRvb2x0aXAnKS5ydW4oZnVuY3Rpb24oKSB7IWFuZ3VsYXIuJCRjc3AoKS5ub0lubGluZVN0eWxlICYmICFhbmd1bGFyLiQkdWliVG9vbHRpcENzcyAmJiBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2hlYWQnKS5wcmVwZW5kKCc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+W3VpYi10b29sdGlwLXBvcHVwXS50b29sdGlwLnRvcC1sZWZ0ID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLXBvcHVwXS50b29sdGlwLnRvcC1yaWdodCA+IC50b29sdGlwLWFycm93LFt1aWItdG9vbHRpcC1wb3B1cF0udG9vbHRpcC5ib3R0b20tbGVmdCA+IC50b29sdGlwLWFycm93LFt1aWItdG9vbHRpcC1wb3B1cF0udG9vbHRpcC5ib3R0b20tcmlnaHQgPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtcG9wdXBdLnRvb2x0aXAubGVmdC10b3AgPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtcG9wdXBdLnRvb2x0aXAubGVmdC1ib3R0b20gPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtcG9wdXBdLnRvb2x0aXAucmlnaHQtdG9wID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLXBvcHVwXS50b29sdGlwLnJpZ2h0LWJvdHRvbSA+IC50b29sdGlwLWFycm93LFt1aWItdG9vbHRpcC1odG1sLXBvcHVwXS50b29sdGlwLnRvcC1sZWZ0ID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLWh0bWwtcG9wdXBdLnRvb2x0aXAudG9wLXJpZ2h0ID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLWh0bWwtcG9wdXBdLnRvb2x0aXAuYm90dG9tLWxlZnQgPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtaHRtbC1wb3B1cF0udG9vbHRpcC5ib3R0b20tcmlnaHQgPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtaHRtbC1wb3B1cF0udG9vbHRpcC5sZWZ0LXRvcCA+IC50b29sdGlwLWFycm93LFt1aWItdG9vbHRpcC1odG1sLXBvcHVwXS50b29sdGlwLmxlZnQtYm90dG9tID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLWh0bWwtcG9wdXBdLnRvb2x0aXAucmlnaHQtdG9wID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLWh0bWwtcG9wdXBdLnRvb2x0aXAucmlnaHQtYm90dG9tID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLXRlbXBsYXRlLXBvcHVwXS50b29sdGlwLnRvcC1sZWZ0ID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLXRlbXBsYXRlLXBvcHVwXS50b29sdGlwLnRvcC1yaWdodCA+IC50b29sdGlwLWFycm93LFt1aWItdG9vbHRpcC10ZW1wbGF0ZS1wb3B1cF0udG9vbHRpcC5ib3R0b20tbGVmdCA+IC50b29sdGlwLWFycm93LFt1aWItdG9vbHRpcC10ZW1wbGF0ZS1wb3B1cF0udG9vbHRpcC5ib3R0b20tcmlnaHQgPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtdGVtcGxhdGUtcG9wdXBdLnRvb2x0aXAubGVmdC10b3AgPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtdGVtcGxhdGUtcG9wdXBdLnRvb2x0aXAubGVmdC1ib3R0b20gPiAudG9vbHRpcC1hcnJvdyxbdWliLXRvb2x0aXAtdGVtcGxhdGUtcG9wdXBdLnRvb2x0aXAucmlnaHQtdG9wID4gLnRvb2x0aXAtYXJyb3csW3VpYi10b29sdGlwLXRlbXBsYXRlLXBvcHVwXS50b29sdGlwLnJpZ2h0LWJvdHRvbSA+IC50b29sdGlwLWFycm93LFt1aWItcG9wb3Zlci1wb3B1cF0ucG9wb3Zlci50b3AtbGVmdCA+IC5hcnJvdyxbdWliLXBvcG92ZXItcG9wdXBdLnBvcG92ZXIudG9wLXJpZ2h0ID4gLmFycm93LFt1aWItcG9wb3Zlci1wb3B1cF0ucG9wb3Zlci5ib3R0b20tbGVmdCA+IC5hcnJvdyxbdWliLXBvcG92ZXItcG9wdXBdLnBvcG92ZXIuYm90dG9tLXJpZ2h0ID4gLmFycm93LFt1aWItcG9wb3Zlci1wb3B1cF0ucG9wb3Zlci5sZWZ0LXRvcCA+IC5hcnJvdyxbdWliLXBvcG92ZXItcG9wdXBdLnBvcG92ZXIubGVmdC1ib3R0b20gPiAuYXJyb3csW3VpYi1wb3BvdmVyLXBvcHVwXS5wb3BvdmVyLnJpZ2h0LXRvcCA+IC5hcnJvdyxbdWliLXBvcG92ZXItcG9wdXBdLnBvcG92ZXIucmlnaHQtYm90dG9tID4gLmFycm93LFt1aWItcG9wb3Zlci1odG1sLXBvcHVwXS5wb3BvdmVyLnRvcC1sZWZ0ID4gLmFycm93LFt1aWItcG9wb3Zlci1odG1sLXBvcHVwXS5wb3BvdmVyLnRvcC1yaWdodCA+IC5hcnJvdyxbdWliLXBvcG92ZXItaHRtbC1wb3B1cF0ucG9wb3Zlci5ib3R0b20tbGVmdCA+IC5hcnJvdyxbdWliLXBvcG92ZXItaHRtbC1wb3B1cF0ucG9wb3Zlci5ib3R0b20tcmlnaHQgPiAuYXJyb3csW3VpYi1wb3BvdmVyLWh0bWwtcG9wdXBdLnBvcG92ZXIubGVmdC10b3AgPiAuYXJyb3csW3VpYi1wb3BvdmVyLWh0bWwtcG9wdXBdLnBvcG92ZXIubGVmdC1ib3R0b20gPiAuYXJyb3csW3VpYi1wb3BvdmVyLWh0bWwtcG9wdXBdLnBvcG92ZXIucmlnaHQtdG9wID4gLmFycm93LFt1aWItcG9wb3Zlci1odG1sLXBvcHVwXS5wb3BvdmVyLnJpZ2h0LWJvdHRvbSA+IC5hcnJvdyxbdWliLXBvcG92ZXItdGVtcGxhdGUtcG9wdXBdLnBvcG92ZXIudG9wLWxlZnQgPiAuYXJyb3csW3VpYi1wb3BvdmVyLXRlbXBsYXRlLXBvcHVwXS5wb3BvdmVyLnRvcC1yaWdodCA+IC5hcnJvdyxbdWliLXBvcG92ZXItdGVtcGxhdGUtcG9wdXBdLnBvcG92ZXIuYm90dG9tLWxlZnQgPiAuYXJyb3csW3VpYi1wb3BvdmVyLXRlbXBsYXRlLXBvcHVwXS5wb3BvdmVyLmJvdHRvbS1yaWdodCA+IC5hcnJvdyxbdWliLXBvcG92ZXItdGVtcGxhdGUtcG9wdXBdLnBvcG92ZXIubGVmdC10b3AgPiAuYXJyb3csW3VpYi1wb3BvdmVyLXRlbXBsYXRlLXBvcHVwXS5wb3BvdmVyLmxlZnQtYm90dG9tID4gLmFycm93LFt1aWItcG9wb3Zlci10ZW1wbGF0ZS1wb3B1cF0ucG9wb3Zlci5yaWdodC10b3AgPiAuYXJyb3csW3VpYi1wb3BvdmVyLXRlbXBsYXRlLXBvcHVwXS5wb3BvdmVyLnJpZ2h0LWJvdHRvbSA+IC5hcnJvd3t0b3A6YXV0bztib3R0b206YXV0bztsZWZ0OmF1dG87cmlnaHQ6YXV0bzttYXJnaW46MDt9W3VpYi1wb3BvdmVyLXBvcHVwXS5wb3BvdmVyLFt1aWItcG9wb3Zlci1odG1sLXBvcHVwXS5wb3BvdmVyLFt1aWItcG9wb3Zlci10ZW1wbGF0ZS1wb3B1cF0ucG9wb3ZlcntkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnQ7fTwvc3R5bGU+Jyk7IGFuZ3VsYXIuJCR1aWJUb29sdGlwQ3NzID0gdHJ1ZTsgfSk7XG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLnRpbWVwaWNrZXInKS5ydW4oZnVuY3Rpb24oKSB7IWFuZ3VsYXIuJCRjc3AoKS5ub0lubGluZVN0eWxlICYmICFhbmd1bGFyLiQkdWliVGltZXBpY2tlckNzcyAmJiBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2hlYWQnKS5wcmVwZW5kKCc8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+LnVpYi10aW1lIGlucHV0e3dpZHRoOjUwcHg7fTwvc3R5bGU+Jyk7IGFuZ3VsYXIuJCR1aWJUaW1lcGlja2VyQ3NzID0gdHJ1ZTsgfSk7XG5hbmd1bGFyLm1vZHVsZSgndWkuYm9vdHN0cmFwLnR5cGVhaGVhZCcpLnJ1bihmdW5jdGlvbigpIHshYW5ndWxhci4kJGNzcCgpLm5vSW5saW5lU3R5bGUgJiYgIWFuZ3VsYXIuJCR1aWJUeXBlYWhlYWRDc3MgJiYgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdoZWFkJykucHJlcGVuZCgnPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPlt1aWItdHlwZWFoZWFkLXBvcHVwXS5kcm9wZG93bi1tZW51e2Rpc3BsYXk6YmxvY2s7fTwvc3R5bGU+Jyk7IGFuZ3VsYXIuJCR1aWJUeXBlYWhlYWRDc3MgPSB0cnVlOyB9KTsiXX0=

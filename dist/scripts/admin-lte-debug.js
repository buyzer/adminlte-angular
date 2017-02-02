/*! AdminLTE app.js
 * ================
 * Main JS application file for AdminLTE v2. This file
 * should be included in all pages. It controls some layout
 * options and implements exclusive AdminLTE plugins.
 *
 * @Author  Almsaeed Studio
 * @Support <http://www.almsaeedstudio.com>
 * @Email   <abdullah@almsaeedstudio.com>
 * @version 2.3.8
 * @license MIT <http://opensource.org/licenses/MIT>
 */

//Make sure jQuery has been loaded before app.js
if (typeof jQuery === "undefined") {
  throw new Error("AdminLTE requires jQuery");
}

/* AdminLTE
 *
 * @type Object
 * @description $.AdminLTE is the main object for the template's app.
 *              It's used for implementing functions and options related
 *              to the template. Keeping everything wrapped in an object
 *              prevents conflict with other plugins and is a better
 *              way to organize our code.
 */
$.AdminLTE = {};

/* --------------------
 * - AdminLTE Options -
 * --------------------
 * Modify these options to suit your implementation
 */
$.AdminLTE.options = {
  //Add slimscroll to navbar menus
  //This requires you to load the slimscroll plugin
  //in every page before app.js
  navbarMenuSlimscroll: true,
  navbarMenuSlimscrollWidth: "3px", //The width of the scroll bar
  navbarMenuHeight: "200px", //The height of the inner menu
  //General animation speed for JS animated elements such as box collapse/expand and
  //sidebar treeview slide up/down. This options accepts an integer as milliseconds,
  //'fast', 'normal', or 'slow'
  animationSpeed: 500,
  //Sidebar push menu toggle button selector
  sidebarToggleSelector: "[data-toggle='offcanvas']",
  //Activate sidebar push menu
  sidebarPushMenu: true,
  //Activate sidebar slimscroll if the fixed layout is set (requires SlimScroll Plugin)
  sidebarSlimScroll: true,
  //Enable sidebar expand on hover effect for sidebar mini
  //This option is forced to true if both the fixed layout and sidebar mini
  //are used together
  sidebarExpandOnHover: false,
  //BoxRefresh Plugin
  enableBoxRefresh: true,
  //Bootstrap.js tooltip
  enableBSToppltip: true,
  BSTooltipSelector: "[data-toggle='tooltip']",
  //Enable Fast Click. Fastclick.js creates a more
  //native touch experience with touch devices. If you
  //choose to enable the plugin, make sure you load the script
  //before AdminLTE's app.js
  enableFastclick: false,
  //Control Sidebar Tree views
  enableControlTreeView: true,
  //Control Sidebar Options
  enableControlSidebar: true,
  controlSidebarOptions: {
    //Which button should trigger the open/close event
    toggleBtnSelector: "[data-toggle='control-sidebar']",
    //The sidebar selector
    selector: ".control-sidebar",
    //Enable slide over content
    slide: true
  },
  //Box Widget Plugin. Enable this plugin
  //to allow boxes to be collapsed and/or removed
  enableBoxWidget: true,
  //Box Widget plugin options
  boxWidgetOptions: {
    boxWidgetIcons: {
      //Collapse icon
      collapse: 'fa-minus',
      //Open icon
      open: 'fa-plus',
      //Remove icon
      remove: 'fa-times'
    },
    boxWidgetSelectors: {
      //Remove button selector
      remove: '[data-widget="remove"]',
      //Collapse button selector
      collapse: '[data-widget="collapse"]'
    }
  },
  //Direct Chat plugin options
  directChat: {
    //Enable direct chat by default
    enable: true,
    //The button to open and close the chat contacts pane
    contactToggleSelector: '[data-widget="chat-pane-toggle"]'
  },
  //Define the set of colors to use globally around the website
  colors: {
    lightBlue: "#3c8dbc",
    red: "#f56954",
    green: "#00a65a",
    aqua: "#00c0ef",
    yellow: "#f39c12",
    blue: "#0073b7",
    navy: "#001F3F",
    teal: "#39CCCC",
    olive: "#3D9970",
    lime: "#01FF70",
    orange: "#FF851B",
    fuchsia: "#F012BE",
    purple: "#8E24AA",
    maroon: "#D81B60",
    black: "#222222",
    gray: "#d2d6de"
  },
  //The standard screen sizes that bootstrap uses.
  //If you change these in the variables.less file, change
  //them here too.
  screenSizes: {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200
  }
};

/* ------------------
 * - Implementation -
 * ------------------
 * The next block of code implements AdminLTE's
 * functions and plugins as specified by the
 * options above.
 */
$.AdminLTE.init = function(){
  "use strict";
  //Fix for IE page transitions
  $("body").removeClass("hold-transition");

  //Extend options if external options exist
  if (typeof AdminLTEOptions !== "undefined") {
    $.extend(true,
      $.AdminLTE.options,
      AdminLTEOptions);
  }

  //Easy access to options
  var o = $.AdminLTE.options;

  //Set up the object
  _init();

  //Activate the layout maker
  $.AdminLTE.layout.activate();

  //Enable sidebar tree view controls
  if (o.enableControlTreeView) {
    $.AdminLTE.tree('.sidebar');
  }

  //Enable control sidebar
  if (o.enableControlSidebar) {
    $.AdminLTE.controlSidebar.activate();
  }

  //Add slimscroll to navbar dropdown
  if (o.navbarMenuSlimscroll && typeof $.fn.slimscroll != 'undefined') {
    $(".navbar .menu").slimscroll({
      height: o.navbarMenuHeight,
      alwaysVisible: false,
      size: o.navbarMenuSlimscrollWidth
    }).css("width", "100%");
  }

  //Activate sidebar push menu
  if (o.sidebarPushMenu) {
    $.AdminLTE.pushMenu.activate(o.sidebarToggleSelector);
  }

  //Activate Bootstrap tooltip
  if (o.enableBSToppltip) {
    $('body').tooltip({
      selector: o.BSTooltipSelector,
      container: 'body'
    });
  }

  //Activate box widget
  if (o.enableBoxWidget) {
    $.AdminLTE.boxWidget.activate();
  }

  //Activate fast click
  if (o.enableFastclick && typeof FastClick != 'undefined') {
    FastClick.attach(document.body);
  }

  //Activate direct chat widget
  if (o.directChat.enable) {
    $(document).on('click', o.directChat.contactToggleSelector, function () {
      var box = $(this).parents('.direct-chat').first();
      box.toggleClass('direct-chat-contacts-open');
    });
  }

  /*
   * INITIALIZE BUTTON TOGGLE
   * ------------------------
   */
  $('.btn-group[data-toggle="btn-toggle"]').each(function () {
    var group = $(this);
    $(this).find(".btn").on('click', function (e) {
      group.find(".btn.active").removeClass("active");
      $(this).addClass("active");
      e.preventDefault();
    });

  });
  var my_skins = [
    "skin-blue",
    "skin-black",
    "skin-red",
    "skin-yellow",
    "skin-purple",
    "skin-green",
    "skin-blue-light",
    "skin-black-light",
    "skin-red-light",
    "skin-yellow-light",
    "skin-purple-light",
    "skin-green-light"
  ];

  //Create the new tab
  var tab_pane = $("<div />", {
    "id": "control-sidebar-theme-demo-options-tab",
    "class": "tab-pane active"
  });

  //Create the tab button
  var tab_button = $("<li />", {"class": "active"})
      .html("<a href='javascript:void(0)' data-target='#control-sidebar-theme-demo-options-tab' data-toggle='tab'>"
      + "<i class='fa fa-wrench'></i>"
      + "</a>");

  //Add the tab button to the right sidebar tabs
  $("[data-target='#control-sidebar-home-tab']")
      .parent()
      .before(tab_button);

  //Create the menu
  var demo_settings = $("<div />");

  //Layout options
  demo_settings.append(
      "<h4 class='control-sidebar-heading'>"
      + "Layout Options"
      + "</h4>"
        //Fixed layout
      + "<div class='form-group'>"
      + "<label class='control-sidebar-subheading'>"
      + "<input type='checkbox' data-layout='fixed' class='pull-right'/> "
      + "Fixed layout"
      + "</label>"
      + "<p>Activate the fixed layout. You can't use fixed and boxed layouts together</p>"
      + "</div>"
        //Boxed layout
      + "<div class='form-group'>"
      + "<label class='control-sidebar-subheading'>"
      + "<input type='checkbox' data-layout='layout-boxed'class='pull-right'/> "
      + "Boxed Layout"
      + "</label>"
      + "<p>Activate the boxed layout</p>"
      + "</div>"
        //Sidebar Toggle
      + "<div class='form-group'>"
      + "<label class='control-sidebar-subheading'>"
      + "<input type='checkbox' data-layout='sidebar-collapse' class='pull-right'/> "
      + "Toggle Sidebar"
      + "</label>"
      + "<p>Toggle the left sidebar's state (open or collapse)</p>"
      + "</div>"
        //Sidebar mini expand on hover toggle
      + "<div class='form-group'>"
      + "<label class='control-sidebar-subheading'>"
      + "<input type='checkbox' data-enable='expandOnHover' class='pull-right'/> "
      + "Sidebar Expand on Hover"
      + "</label>"
      + "<p>Let the sidebar mini expand on hover</p>"
      + "</div>"
        //Control Sidebar Toggle
      + "<div class='form-group'>"
      + "<label class='control-sidebar-subheading'>"
      + "<input type='checkbox' data-controlsidebar='control-sidebar-open' class='pull-right'/> "
      + "Toggle Right Sidebar Slide"
      + "</label>"
      + "<p>Toggle between slide over content and push content effects</p>"
      + "</div>"
        //Control Sidebar Skin Toggle
      + "<div class='form-group'>"
      + "<label class='control-sidebar-subheading'>"
      + "<input type='checkbox' data-sidebarskin='toggle' class='pull-right'/> "
      + "Toggle Right Sidebar Skin"
      + "</label>"
      + "<p>Toggle between dark and light skins for the right sidebar</p>"
      + "</div>"
  );
  var skins_list = $("<ul />", {"class": 'list-unstyled clearfix'});

  //Dark sidebar skins
  var skin_blue =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-blue' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px; background: #367fa9;'></span><span class='bg-light-blue' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin'>Blue</p>");
  skins_list.append(skin_blue);
  var skin_black =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-black' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div style='box-shadow: 0 0 2px rgba(0,0,0,0.1)' class='clearfix'><span style='display:block; width: 20%; float: left; height: 7px; background: #fefefe;'></span><span style='display:block; width: 80%; float: left; height: 7px; background: #fefefe;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #222;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin'>Black</p>");
  skins_list.append(skin_black);
  var skin_purple =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-purple' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-purple-active'></span><span class='bg-purple' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin'>Purple</p>");
  skins_list.append(skin_purple);
  var skin_green =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-green' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-green-active'></span><span class='bg-green' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin'>Green</p>");
  skins_list.append(skin_green);
  var skin_red =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-red' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-red-active'></span><span class='bg-red' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin'>Red</p>");
  skins_list.append(skin_red);
  var skin_yellow =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-yellow' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-yellow-active'></span><span class='bg-yellow' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin'>Yellow</p>");
  skins_list.append(skin_yellow);

  //Light sidebar skins
  var skin_blue_light =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-blue-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px; background: #367fa9;'></span><span class='bg-light-blue' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin' style='font-size: 12px'>Blue Light</p>");
  skins_list.append(skin_blue_light);
  var skin_black_light =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-black-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div style='box-shadow: 0 0 2px rgba(0,0,0,0.1)' class='clearfix'><span style='display:block; width: 20%; float: left; height: 7px; background: #fefefe;'></span><span style='display:block; width: 80%; float: left; height: 7px; background: #fefefe;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin' style='font-size: 12px'>Black Light</p>");
  skins_list.append(skin_black_light);
  var skin_purple_light =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-purple-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-purple-active'></span><span class='bg-purple' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin' style='font-size: 12px'>Purple Light</p>");
  skins_list.append(skin_purple_light);
  var skin_green_light =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-green-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-green-active'></span><span class='bg-green' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin' style='font-size: 12px'>Green Light</p>");
  skins_list.append(skin_green_light);
  var skin_red_light =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-red-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-red-active'></span><span class='bg-red' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin' style='font-size: 12px'>Red Light</p>");
  skins_list.append(skin_red_light);
  var skin_yellow_light =
      $("<li />", {style: "float:left; width: 33.33333%; padding: 5px;"})
          .append("<a href='javascript:void(0);' data-skin='skin-yellow-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'>"
          + "<div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-yellow-active'></span><span class='bg-yellow' style='display:block; width: 80%; float: left; height: 7px;'></span></div>"
          + "<div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div>"
          + "</a>"
          + "<p class='text-center no-margin' style='font-size: 12px;'>Yellow Light</p>");
  skins_list.append(skin_yellow_light);

  demo_settings.append("<h4 class='control-sidebar-heading'>Skins</h4>");
  demo_settings.append(skins_list);

  tab_pane.append(demo_settings);
  $("#control-sidebar-home-tab").after(tab_pane);

  setup();

  /**
   * Toggles layout classes
   *
   * @param String cls the layout class to toggle
   * @returns void
   */
  function change_layout(cls) {
    $("body").toggleClass(cls);
    AdminLTE.layout.fixSidebar();
    //Fix the problem with right sidebar and layout boxed
    if (cls == "layout-boxed")
      AdminLTE.controlSidebar._fix($(".control-sidebar-bg"));
    if ($('body').hasClass('fixed') && cls == 'fixed') {
      AdminLTE.pushMenu.expandOnHover();
      AdminLTE.layout.activate();
    }
    AdminLTE.controlSidebar._fix($(".control-sidebar-bg"));
    AdminLTE.controlSidebar._fix($(".control-sidebar"));
  }

  /**
   * Replaces the old skin with the new skin
   * @param String cls the new skin class
   * @returns Boolean false to prevent link's default action
   */
  function change_skin(cls) {
    $.each(my_skins, function (i) {
      $("body").removeClass(my_skins[i]);
    });

    $("body").addClass(cls);
    store('skin', cls);
    return false;
  }

  /**
   * Store a new settings in the browser
   *
   * @param String name Name of the setting
   * @param String val Value of the setting
   * @returns void
   */
  function store(name, val) {
    if (typeof (Storage) !== "undefined") {
      localStorage.setItem(name, val);
    } else {
      window.alert('Please use a modern browser to properly view this template!');
    }
  }

  /**
   * Get a prestored setting
   *
   * @param String name Name of of the setting
   * @returns String The value of the setting | null
   */
  function get(name) {
    if (typeof (Storage) !== "undefined") {
      return localStorage.getItem(name);
    } else {
      window.alert('Please use a modern browser to properly view this template!');
    }
  }

  /**
   * Retrieve default settings and apply them to the template
   *
   * @returns void
   */
  function setup() {
    var tmp = get('skin');
    if (tmp && $.inArray(tmp, my_skins))
      change_skin(tmp);

    //Add the change skin listener
    $("[data-skin]").on('click', function (e) {
      if($(this).hasClass('knob'))
        return;
      e.preventDefault();
      change_skin($(this).data('skin'));
    });

    //Add the layout manager
    $("[data-layout]").on('click', function () {
      change_layout($(this).data('layout'));
    });

    $("[data-controlsidebar]").on('click', function () {
      change_layout($(this).data('controlsidebar'));
      var slide = !AdminLTE.options.controlSidebarOptions.slide;
      AdminLTE.options.controlSidebarOptions.slide = slide;
      if (!slide)
        $('.control-sidebar').removeClass('control-sidebar-open');
    });

    $("[data-sidebarskin='toggle']").on('click', function () {
      var sidebar = $(".control-sidebar");
      if (sidebar.hasClass("control-sidebar-dark")) {
        sidebar.removeClass("control-sidebar-dark")
        sidebar.addClass("control-sidebar-light")
      } else {
        sidebar.removeClass("control-sidebar-light")
        sidebar.addClass("control-sidebar-dark")
      }
    });

    $("[data-enable='expandOnHover']").on('click', function () {
      $(this).attr('disabled', true);
      AdminLTE.pushMenu.expandOnHover();
      if (!$('body').hasClass('sidebar-collapse'))
        $("[data-layout='sidebar-collapse']").click();
    });

    // Reset options
    if ($('body').hasClass('fixed')) {
      $("[data-layout='fixed']").attr('checked', 'checked');
    }
    if ($('body').hasClass('layout-boxed')) {
      $("[data-layout='layout-boxed']").attr('checked', 'checked');
    }
    if ($('body').hasClass('sidebar-collapse')) {
      $("[data-layout='sidebar-collapse']").attr('checked', 'checked');
    }
  }

}

/* ----------------------------------
 * - Initialize the AdminLTE Object -
 * ----------------------------------
 * All AdminLTE functions are implemented below.
 */
function _init() {
  'use strict';
  /* Layout
   * ======
   * Fixes the layout height in case min-height fails.
   *
   * @type Object
   * @usage $.AdminLTE.layout.activate()
   *        $.AdminLTE.layout.fix()
   *        $.AdminLTE.layout.fixSidebar()
   */
  $.AdminLTE.layout = {
    activate: function () {
      var _this = this;
      _this.fix();
      _this.fixSidebar();
      $('body, html, .wrapper').css('height', 'auto');
      $(window, ".wrapper").resize(function () {
        _this.fix();
        _this.fixSidebar();
      });
    },
    fix: function () {
      // Remove overflow from .wrapper if layout-boxed exists
      $(".layout-boxed > .wrapper").css('overflow', 'hidden');
      //Get window height and the wrapper height
      var footer_height = $('.main-footer').outerHeight() || 0;
      var neg = $('.main-header').outerHeight() + footer_height;
      var window_height = $(window).height();
      var sidebar_height = $(".sidebar").height() || 0;
      //Set the min-height of the content and sidebar based on the
      //the height of the document.
      if ($("body").hasClass("fixed")) {
        $(".content-wrapper, .right-side").css('min-height', window_height - footer_height);
      } else {
        var postSetWidth;
        if (window_height >= sidebar_height) {
          $(".content-wrapper, .right-side").css('min-height', window_height - neg);
          postSetWidth = window_height - neg;
        } else {
          $(".content-wrapper, .right-side").css('min-height', sidebar_height);
          postSetWidth = sidebar_height;
        }

        //Fix for the control sidebar height
        var controlSidebar = $($.AdminLTE.options.controlSidebarOptions.selector);
        if (typeof controlSidebar !== "undefined") {
          if (controlSidebar.height() > postSetWidth)
            $(".content-wrapper, .right-side").css('min-height', controlSidebar.height());
        }

      }
    },
    fixSidebar: function () {
      //Make sure the body tag has the .fixed class
      if (!$("body").hasClass("fixed")) {
        if (typeof $.fn.slimScroll != 'undefined') {
          $(".sidebar").slimScroll({destroy: true}).height("auto");
        }
        return;
      } else if (typeof $.fn.slimScroll == 'undefined' && window.console) {
        window.console.error("Error: the fixed layout requires the slimscroll plugin!");
      }
      //Enable slimscroll for fixed layout
      if ($.AdminLTE.options.sidebarSlimScroll) {
        if (typeof $.fn.slimScroll != 'undefined') {
          //Destroy if it exists
          $(".sidebar").slimScroll({destroy: true}).height("auto");
          //Add slimscroll
          $(".sidebar").slimScroll({
            height: ($(window).height() - $(".main-header").height()) + "px",
            color: "rgba(0,0,0,0.2)",
            size: "3px"
          });
        }
      }
    }
  };

  /* PushMenu()
   * ==========
   * Adds the push menu functionality to the sidebar.
   *
   * @type Function
   * @usage: $.AdminLTE.pushMenu("[data-toggle='offcanvas']")
   */
  $.AdminLTE.pushMenu = {
    activate: function (toggleBtn) {
      //Get the screen sizes
      var screenSizes = $.AdminLTE.options.screenSizes;

      //Enable sidebar toggle
      $(document).on('click', toggleBtn, function (e) {
        e.preventDefault();

        //Enable sidebar push menu
        if ($(window).width() > (screenSizes.sm - 1)) {
          if ($("body").hasClass('sidebar-collapse')) {
            $("body").removeClass('sidebar-collapse').trigger('expanded.pushMenu');
          } else {
            $("body").addClass('sidebar-collapse').trigger('collapsed.pushMenu');
          }
        }
        //Handle sidebar push menu for small screens
        else {
          if ($("body").hasClass('sidebar-open')) {
            $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu');
          } else {
            $("body").addClass('sidebar-open').trigger('expanded.pushMenu');
          }
        }
      });

      $(".content-wrapper").click(function () {
        //Enable hide menu when clicking on the content-wrapper on small screens
        if ($(window).width() <= (screenSizes.sm - 1) && $("body").hasClass("sidebar-open")) {
          $("body").removeClass('sidebar-open');
        }
      });

      //Enable expand on hover for sidebar mini
      if ($.AdminLTE.options.sidebarExpandOnHover
        || ($('body').hasClass('fixed')
        && $('body').hasClass('sidebar-mini'))) {
        this.expandOnHover();
      }
    },
    expandOnHover: function () {
      var _this = this;
      var screenWidth = $.AdminLTE.options.screenSizes.sm - 1;
      //Expand sidebar on hover
      $('.main-sidebar').hover(function () {
        if ($('body').hasClass('sidebar-mini')
          && $("body").hasClass('sidebar-collapse')
          && $(window).width() > screenWidth) {
          _this.expand();
        }
      }, function () {
        if ($('body').hasClass('sidebar-mini')
          && $('body').hasClass('sidebar-expanded-on-hover')
          && $(window).width() > screenWidth) {
          _this.collapse();
        }
      });
    },
    expand: function () {
      $("body").removeClass('sidebar-collapse').addClass('sidebar-expanded-on-hover');
    },
    collapse: function () {
      if ($('body').hasClass('sidebar-expanded-on-hover')) {
        $('body').removeClass('sidebar-expanded-on-hover').addClass('sidebar-collapse');
      }
    }
  };

  /* Tree()
   * ======
   * Converts the sidebar into a multilevel
   * tree view menu.
   *
   * @type Function
   * @Usage: $.AdminLTE.tree('.sidebar')
   */
  $.AdminLTE.tree = function (menu) {
    var _this = this;
    var animationSpeed = $.AdminLTE.options.animationSpeed;
    $(document).off('click', menu + ' li a')
      .on('click', menu + ' li a', function (e) {
        //Get the clicked link and the next element
        var $this = $(this);
        var checkElement = $this.next();

        //Check if the next element is a menu and is visible
        if ((checkElement.is('.treeview-menu')) && (checkElement.is(':visible')) && (!$('body').hasClass('sidebar-collapse'))) {
          //Close the menu
          checkElement.slideUp(animationSpeed, function () {
            checkElement.removeClass('menu-open');
            //Fix the layout in case the sidebar stretches over the height of the window
            //_this.layout.fix();
          });
          checkElement.parent("li").removeClass("active");
        }
        //If the menu is not visible
        else if ((checkElement.is('.treeview-menu')) && (!checkElement.is(':visible'))) {
          //Get the parent menu
          var parent = $this.parents('ul').first();
          //Close all open menus within the parent
          var ul = parent.find('ul:visible').slideUp(animationSpeed);
          //Remove the menu-open class from the parent
          ul.removeClass('menu-open');
          //Get the parent li
          var parent_li = $this.parent("li");

          //Open the target menu and add the menu-open class
          checkElement.slideDown(animationSpeed, function () {
            //Add the class active to the parent li
            checkElement.addClass('menu-open');
            parent.find('li.active').removeClass('active');
            parent_li.addClass('active');
            //Fix the layout in case the sidebar stretches over the height of the window
            _this.layout.fix();
          });
        }
        //if this isn't a link, prevent the page from being redirected
        if (checkElement.is('.treeview-menu')) {
          e.preventDefault();
        }
      });
  };

  /* ControlSidebar
   * ==============
   * Adds functionality to the right sidebar
   *
   * @type Object
   * @usage $.AdminLTE.controlSidebar.activate(options)
   */
  $.AdminLTE.controlSidebar = {
    //instantiate the object
    activate: function () {
      //Get the object
      var _this = this;
      //Update options
      var o = $.AdminLTE.options.controlSidebarOptions;
      //Get the sidebar
      var sidebar = $(o.selector);
      //The toggle button
      var btn = $(o.toggleBtnSelector);

      //Listen to the click event
      btn.on('click', function (e) {
        e.preventDefault();
        //If the sidebar is not open
        if (!sidebar.hasClass('control-sidebar-open')
          && !$('body').hasClass('control-sidebar-open')) {
          //Open the sidebar
          _this.open(sidebar, o.slide);
        } else {
          _this.close(sidebar, o.slide);
        }
      });

      //If the body has a boxed layout, fix the sidebar bg position
      var bg = $(".control-sidebar-bg");
      _this._fix(bg);

      //If the body has a fixed layout, make the control sidebar fixed
      if ($('body').hasClass('fixed')) {
        _this._fixForFixed(sidebar);
      } else {
        //If the content height is less than the sidebar's height, force max height
        if ($('.content-wrapper, .right-side').height() < sidebar.height()) {
          _this._fixForContent(sidebar);
        }
      }
    },
    //Open the control sidebar
    open: function (sidebar, slide) {
      //Slide over content
      if (slide) {
        sidebar.addClass('control-sidebar-open');
      } else {
        //Push the content by adding the open class to the body instead
        //of the sidebar itself
        $('body').addClass('control-sidebar-open');
      }
    },
    //Close the control sidebar
    close: function (sidebar, slide) {
      if (slide) {
        sidebar.removeClass('control-sidebar-open');
      } else {
        $('body').removeClass('control-sidebar-open');
      }
    },
    _fix: function (sidebar) {
      var _this = this;
      if ($("body").hasClass('layout-boxed')) {
        sidebar.css('position', 'absolute');
        sidebar.height($(".wrapper").height());
        if (_this.hasBindedResize) {
          return;
        }
        $(window).resize(function () {
          _this._fix(sidebar);
        });
        _this.hasBindedResize = true;
      } else {
        sidebar.css({
          'position': 'fixed',
          'height': 'auto'
        });
      }
    },
    _fixForFixed: function (sidebar) {
      sidebar.css({
        'position': 'fixed',
        'max-height': '100%',
        'overflow': 'auto',
        'padding-bottom': '50px'
      });
    },
    _fixForContent: function (sidebar) {
      $(".content-wrapper, .right-side").css('min-height', sidebar.height());
    }
  };

  /* BoxWidget
   * =========
   * BoxWidget is a plugin to handle collapsing and
   * removing boxes from the screen.
   *
   * @type Object
   * @usage $.AdminLTE.boxWidget.activate()
   *        Set all your options in the main $.AdminLTE.options object
   */
  $.AdminLTE.boxWidget = {
    selectors: $.AdminLTE.options.boxWidgetOptions.boxWidgetSelectors,
    icons: $.AdminLTE.options.boxWidgetOptions.boxWidgetIcons,
    animationSpeed: $.AdminLTE.options.animationSpeed,
    activate: function (_box) {
      var _this = this;
      if (!_box) {
        _box = document; // activate all boxes per default
      }
      //Listen for collapse event triggers
      $(_box).on('click', _this.selectors.collapse, function (e) {
        e.preventDefault();
        _this.collapse($(this));
      });

      //Listen for remove event triggers
      $(_box).on('click', _this.selectors.remove, function (e) {
        e.preventDefault();
        _this.remove($(this));
      });
    },
    collapse: function (element) {
      var _this = this;
      //Find the box parent
      var box = element.parents(".box").first();
      //Find the body and the footer
      var box_content = box.find("> .box-body, > .box-footer, > form  >.box-body, > form > .box-footer");
      if (!box.hasClass("collapsed-box")) {
        //Convert minus into plus
        element.children(":first")
          .removeClass(_this.icons.collapse)
          .addClass(_this.icons.open);
        //Hide the content
        box_content.slideUp(_this.animationSpeed, function () {
          box.addClass("collapsed-box");
        });
      } else {
        //Convert plus into minus
        element.children(":first")
          .removeClass(_this.icons.open)
          .addClass(_this.icons.collapse);
        //Show the content
        box_content.slideDown(_this.animationSpeed, function () {
          box.removeClass("collapsed-box");
        });
      }
    },
    remove: function (element) {
      //Find the box parent
      var box = element.parents(".box").first();
      box.slideUp(this.animationSpeed);
    }
  };
}

/* ------------------
 * - Custom Plugins -
 * ------------------
 * All custom plugins are defined below.
 */

/*
 * BOX REFRESH BUTTON
 * ------------------
 * This is a custom plugin to use with the component BOX. It allows you to add
 * a refresh button to the box. It converts the box's state to a loading state.
 *
 * @type plugin
 * @usage $("#box-widget").boxRefresh( options );
 */
(function ($) {

  "use strict";

  $.fn.boxRefresh = function (options) {

    // Render options
    var settings = $.extend({
      //Refresh button selector
      trigger: ".refresh-btn",
      //File source to be loaded (e.g: ajax/src.php)
      source: "",
      //Callbacks
      onLoadStart: function (box) {
        return box;
      }, //Right after the button has been clicked
      onLoadDone: function (box) {
        return box;
      } //When the source has been loaded

    }, options);

    //The overlay
    var overlay = $('<div class="overlay"><div class="fa fa-refresh fa-spin"></div></div>');

    return this.each(function () {
      //if a source is specified
      if (settings.source === "") {
        if (window.console) {
          window.console.log("Please specify a source first - boxRefresh()");
        }
        return;
      }
      //the box
      var box = $(this);
      //the button
      var rBtn = box.find(settings.trigger).first();

      //On trigger click
      rBtn.on('click', function (e) {
        e.preventDefault();
        //Add loading overlay
        start(box);

        //Perform ajax call
        box.find(".box-body").load(settings.source, function () {
          done(box);
        });
      });
    });

    function start(box) {
      //Add overlay and loading img
      box.append(overlay);

      settings.onLoadStart.call(box);
    }

    function done(box) {
      //Remove overlay and loading img
      box.find(overlay).remove();

      settings.onLoadDone.call(box);
    }

  };

})(jQuery);

/*
 * EXPLICIT BOX CONTROLS
 * -----------------------
 * This is a custom plugin to use with the component BOX. It allows you to activate
 * a box inserted in the DOM after the app.js was loaded, toggle and remove box.
 *
 * @type plugin
 * @usage $("#box-widget").activateBox();
 * @usage $("#box-widget").toggleBox();
 * @usage $("#box-widget").removeBox();
 */
(function ($) {

  'use strict';

  $.fn.activateBox = function () {
    $.AdminLTE.boxWidget.activate(this);
  };

  $.fn.toggleBox = function () {
    var button = $($.AdminLTE.boxWidget.selectors.collapse, this);
    $.AdminLTE.boxWidget.collapse(button);
  };

  $.fn.removeBox = function () {
    var button = $($.AdminLTE.boxWidget.selectors.remove, this);
    $.AdminLTE.boxWidget.remove(button);
  };

})(jQuery);

/*
 * TODO LIST CUSTOM PLUGIN
 * -----------------------
 * This plugin depends on iCheck plugin for checkbox and radio inputs
 *
 * @type plugin
 * @usage $("#todo-widget").todolist( options );
 */
(function ($) {

  'use strict';

  $.fn.todolist = function (options) {
    // Render options
    var settings = $.extend({
      //When the user checks the input
      onCheck: function (ele) {
        return ele;
      },
      //When the user unchecks the input
      onUncheck: function (ele) {
        return ele;
      }
    }, options);

    return this.each(function () {

      if (typeof $.fn.iCheck != 'undefined') {
        $('input', this).on('ifChecked', function () {
          var ele = $(this).parents("li").first();
          ele.toggleClass("done");
          settings.onCheck.call(ele);
        });

        $('input', this).on('ifUnchecked', function () {
          var ele = $(this).parents("li").first();
          ele.toggleClass("done");
          settings.onUncheck.call(ele);
        });
      } else {
        $('input', this).on('change', function () {
          var ele = $(this).parents("li").first();
          ele.toggleClass("done");
          if ($('input', ele).is(":checked")) {
            settings.onCheck.call(ele);
          } else {
            settings.onUncheck.call(ele);
          }
        });
      }
    });
  };
}(jQuery));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkbWluLWx0ZS5qcyJdLCJuYW1lcyI6WyJfaW5pdCIsIiQiLCJBZG1pbkxURSIsImxheW91dCIsImFjdGl2YXRlIiwiX3RoaXMiLCJ0aGlzIiwiZml4IiwiZml4U2lkZWJhciIsImNzcyIsIndpbmRvdyIsInJlc2l6ZSIsImZvb3Rlcl9oZWlnaHQiLCJvdXRlckhlaWdodCIsIm5lZyIsIndpbmRvd19oZWlnaHQiLCJoZWlnaHQiLCJzaWRlYmFyX2hlaWdodCIsImhhc0NsYXNzIiwicG9zdFNldFdpZHRoIiwiY29udHJvbFNpZGViYXIiLCJvcHRpb25zIiwiY29udHJvbFNpZGViYXJPcHRpb25zIiwic2VsZWN0b3IiLCJmbiIsInNsaW1TY3JvbGwiLCJjb25zb2xlIiwiZXJyb3IiLCJzaWRlYmFyU2xpbVNjcm9sbCIsImRlc3Ryb3kiLCJjb2xvciIsInNpemUiLCJwdXNoTWVudSIsInRvZ2dsZUJ0biIsInNjcmVlblNpemVzIiwiZG9jdW1lbnQiLCJvbiIsImUiLCJwcmV2ZW50RGVmYXVsdCIsIndpZHRoIiwic20iLCJyZW1vdmVDbGFzcyIsInRyaWdnZXIiLCJhZGRDbGFzcyIsImNsaWNrIiwic2lkZWJhckV4cGFuZE9uSG92ZXIiLCJleHBhbmRPbkhvdmVyIiwic2NyZWVuV2lkdGgiLCJob3ZlciIsImV4cGFuZCIsImNvbGxhcHNlIiwidHJlZSIsIm1lbnUiLCJhbmltYXRpb25TcGVlZCIsIm9mZiIsIiR0aGlzIiwiY2hlY2tFbGVtZW50IiwibmV4dCIsImlzIiwic2xpZGVVcCIsInBhcmVudCIsInBhcmVudHMiLCJmaXJzdCIsInVsIiwiZmluZCIsInBhcmVudF9saSIsInNsaWRlRG93biIsIm8iLCJzaWRlYmFyIiwiYnRuIiwidG9nZ2xlQnRuU2VsZWN0b3IiLCJjbG9zZSIsInNsaWRlIiwib3BlbiIsImJnIiwiX2ZpeCIsIl9maXhGb3JGaXhlZCIsIl9maXhGb3JDb250ZW50IiwiaGFzQmluZGVkUmVzaXplIiwicG9zaXRpb24iLCJtYXgtaGVpZ2h0Iiwib3ZlcmZsb3ciLCJwYWRkaW5nLWJvdHRvbSIsImJveFdpZGdldCIsInNlbGVjdG9ycyIsImJveFdpZGdldE9wdGlvbnMiLCJib3hXaWRnZXRTZWxlY3RvcnMiLCJpY29ucyIsImJveFdpZGdldEljb25zIiwiX2JveCIsInJlbW92ZSIsImVsZW1lbnQiLCJib3giLCJib3hfY29udGVudCIsImNoaWxkcmVuIiwialF1ZXJ5IiwiRXJyb3IiLCJuYXZiYXJNZW51U2xpbXNjcm9sbCIsIm5hdmJhck1lbnVTbGltc2Nyb2xsV2lkdGgiLCJuYXZiYXJNZW51SGVpZ2h0Iiwic2lkZWJhclRvZ2dsZVNlbGVjdG9yIiwic2lkZWJhclB1c2hNZW51IiwiZW5hYmxlQm94UmVmcmVzaCIsImVuYWJsZUJTVG9wcGx0aXAiLCJCU1Rvb2x0aXBTZWxlY3RvciIsImVuYWJsZUZhc3RjbGljayIsImVuYWJsZUNvbnRyb2xUcmVlVmlldyIsImVuYWJsZUNvbnRyb2xTaWRlYmFyIiwiZW5hYmxlQm94V2lkZ2V0IiwiZGlyZWN0Q2hhdCIsImVuYWJsZSIsImNvbnRhY3RUb2dnbGVTZWxlY3RvciIsImNvbG9ycyIsImxpZ2h0Qmx1ZSIsInJlZCIsImdyZWVuIiwiYXF1YSIsInllbGxvdyIsImJsdWUiLCJuYXZ5IiwidGVhbCIsIm9saXZlIiwibGltZSIsIm9yYW5nZSIsImZ1Y2hzaWEiLCJwdXJwbGUiLCJtYXJvb24iLCJibGFjayIsImdyYXkiLCJ4cyIsIm1kIiwibGciLCJpbml0IiwiY2hhbmdlX2xheW91dCIsImNscyIsInRvZ2dsZUNsYXNzIiwiY2hhbmdlX3NraW4iLCJlYWNoIiwibXlfc2tpbnMiLCJpIiwic3RvcmUiLCJuYW1lIiwidmFsIiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsImFsZXJ0IiwiZ2V0IiwiZ2V0SXRlbSIsInNldHVwIiwidG1wIiwiaW5BcnJheSIsImRhdGEiLCJhdHRyIiwiQWRtaW5MVEVPcHRpb25zIiwiZXh0ZW5kIiwic2xpbXNjcm9sbCIsImFsd2F5c1Zpc2libGUiLCJ0b29sdGlwIiwiY29udGFpbmVyIiwiRmFzdENsaWNrIiwiYXR0YWNoIiwiYm9keSIsImdyb3VwIiwidGFiX3BhbmUiLCJpZCIsImNsYXNzIiwidGFiX2J1dHRvbiIsImh0bWwiLCJiZWZvcmUiLCJkZW1vX3NldHRpbmdzIiwiYXBwZW5kIiwic2tpbnNfbGlzdCIsInNraW5fYmx1ZSIsInN0eWxlIiwic2tpbl9ibGFjayIsInNraW5fcHVycGxlIiwic2tpbl9ncmVlbiIsInNraW5fcmVkIiwic2tpbl95ZWxsb3ciLCJza2luX2JsdWVfbGlnaHQiLCJza2luX2JsYWNrX2xpZ2h0Iiwic2tpbl9wdXJwbGVfbGlnaHQiLCJza2luX2dyZWVuX2xpZ2h0Iiwic2tpbl9yZWRfbGlnaHQiLCJza2luX3llbGxvd19saWdodCIsImFmdGVyIiwiYm94UmVmcmVzaCIsInN0YXJ0Iiwib3ZlcmxheSIsInNldHRpbmdzIiwib25Mb2FkU3RhcnQiLCJjYWxsIiwiZG9uZSIsIm9uTG9hZERvbmUiLCJzb3VyY2UiLCJsb2ciLCJyQnRuIiwibG9hZCIsImFjdGl2YXRlQm94IiwidG9nZ2xlQm94IiwiYnV0dG9uIiwicmVtb3ZlQm94IiwidG9kb2xpc3QiLCJvbkNoZWNrIiwiZWxlIiwib25VbmNoZWNrIiwiaUNoZWNrIl0sIm1hcHBpbmdzIjoiQUE0aUJBLFFBQVNBLFNBQ1AsWUFVQUMsR0FBRUMsU0FBU0MsUUFDVEMsU0FBVSxXQUNSLEdBQUlDLEdBQVFDLElBQ1pELEdBQU1FLE1BQ05GLEVBQU1HLGFBQ05QLEVBQUUsd0JBQXdCUSxJQUFJLFNBQVUsUUFDeENSLEVBQUVTLE9BQVEsWUFBWUMsT0FBTyxXQUMzQk4sRUFBTUUsTUFDTkYsRUFBTUcsZ0JBR1ZELElBQUssV0FFSE4sRUFBRSw0QkFBNEJRLElBQUksV0FBWSxTQUU5QyxJQUFJRyxHQUFnQlgsRUFBRSxnQkFBZ0JZLGVBQWlCLEVBQ25EQyxFQUFNYixFQUFFLGdCQUFnQlksY0FBZ0JELEVBQ3hDRyxFQUFnQmQsRUFBRVMsUUFBUU0sU0FDMUJDLEVBQWlCaEIsRUFBRSxZQUFZZSxV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TUFBTThCLEdBQUcsU0FBVSxXQUM1QixHQUFJd0ssR0FBTTNNLEVBQUVLLE1BQU11RCxRQUFRLE1BQU1DLE9BQ2hDOEksR0FBSXJFLFlBQVksUUFDWnRJLEVBQUUsUUFBUzJNLEdBQUtsSixHQUFHLFlBQ3JCbUksRUFBU2MsUUFBUVosS0FBS2EsR0FFdEJmLEVBQVNnQixVQUFVZCxLQUFLYSxTQU1sQzdHIiwiZmlsZSI6ImFkbWluLWx0ZS1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qISBBZG1pbkxURSBhcHAuanNcbiAqID09PT09PT09PT09PT09PT1cbiAqIE1haW4gSlMgYXBwbGljYXRpb24gZmlsZSBmb3IgQWRtaW5MVEUgdjIuIFRoaXMgZmlsZVxuICogc2hvdWxkIGJlIGluY2x1ZGVkIGluIGFsbCBwYWdlcy4gSXQgY29udHJvbHMgc29tZSBsYXlvdXRcbiAqIG9wdGlvbnMgYW5kIGltcGxlbWVudHMgZXhjbHVzaXZlIEFkbWluTFRFIHBsdWdpbnMuXG4gKlxuICogQEF1dGhvciAgQWxtc2FlZWQgU3R1ZGlvXG4gKiBAU3VwcG9ydCA8aHR0cDovL3d3dy5hbG1zYWVlZHN0dWRpby5jb20+XG4gKiBARW1haWwgICA8YWJkdWxsYWhAYWxtc2FlZWRzdHVkaW8uY29tPlxuICogQHZlcnNpb24gMi4zLjhcbiAqIEBsaWNlbnNlIE1JVCA8aHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVD5cbiAqL1xuXG4vL01ha2Ugc3VyZSBqUXVlcnkgaGFzIGJlZW4gbG9hZGVkIGJlZm9yZSBhcHAuanNcbmlmICh0eXBlb2YgalF1ZXJ5ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIkFkbWluTFRFIHJlcXVpcmVzIGpRdWVyeVwiKTtcbn1cblxuLyogQWRtaW5MVEVcbiAqXG4gKiBAdHlwZSBPYmplY3RcbiAqIEBkZXNjcmlwdGlvbiAkLkFkbWluTFRFIGlzIHRoZSBtYWluIG9iamVjdCBmb3IgdGhlIHRlbXBsYXRlJ3MgYXBwLlxuICogICAgICAgICAgICAgIEl0J3MgdXNlZCBmb3IgaW1wbGVtZW50aW5nIGZ1bmN0aW9ucyBhbmQgb3B0aW9ucyByZWxhdGVkXG4gKiAgICAgICAgICAgICAgdG8gdGhlIHRlbXBsYXRlLiBLZWVwaW5nIGV2ZXJ5dGhpbmcgd3JhcHBlZCBpbiBhbiBvYmplY3RcbiAqICAgICAgICAgICAgICBwcmV2ZW50cyBjb25mbGljdCB3aXRoIG90aGVyIHBsdWdpbnMgYW5kIGlzIGEgYmV0dGVyXG4gKiAgICAgICAgICAgICAgd2F5IHRvIG9yZ2FuaXplIG91ciBjb2RlLlxuICovXG4kLkFkbWluTFRFID0ge307XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAtIEFkbWluTFRFIE9wdGlvbnMgLVxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIE1vZGlmeSB0aGVzZSBvcHRpb25zIHRvIHN1aXQgeW91ciBpbXBsZW1lbnRhdGlvblxuICovXG4kLkFkbWluTFRFLm9wdGlvbnMgPSB7XG4gIC8vQWRkIHNsaW1zY3JvbGwgdG8gbmF2YmFyIG1lbnVzXG4gIC8vVGhpcyByZXF1aXJlcyB5b3UgdG8gbG9hZCB0aGUgc2xpbXNjcm9sbCBwbHVnaW5cbiAgLy9pbiBldmVyeSBwYWdlIGJlZm9yZSBhcHAuanNcbiAgbmF2YmFyTWVudVNsaW1zY3JvbGw6IHRydWUsXG4gIG5hdmJhck1lbnVTbGltc2Nyb2xsV2lkdGg6IFwiM3B4XCIsIC8vVGhlIHdpZHRoIG9mIHRoZSBzY3JvbGwgYmFyXG4gIG5hdmJhck1lbnVIZWlnaHQ6IFwiMjAwcHhcIiwgLy9UaGUgaGVpZ2h0IG9mIHRoZSBpbm5lciBtZW51XG4gIC8vR2VuZXJhbCBhbmltYXRpb24gc3BlZWQgZm9yIEpTIGFuaW1hdGVkIGVsZW1lbnRzIHN1Y2ggYXMgYm94IGNvbGxhcHNlL2V4cGFuZCBhbmRcbiAgLy9zaWRlYmFyIHRyZWV2aWV3IHNsaWRlIHVwL2Rvd24uIFRoaXMgb3B0aW9ucyBhY2NlcHRzIGFuIGludGVnZXIgYXMgbWlsbGlzZWNvbmRzLFxuICAvLydmYXN0JywgJ25vcm1hbCcsIG9yICdzbG93J1xuICBhbmltYXRpb25TcGVlZDogNTAwLFxuICAvL1NpZGViYXIgcHVzaCBtZW51IHRvZ2dsZSBidXR0b24gc2VsZWN0b3JcbiAgc2lkZWJhclRvZ2dsZVNlbGVjdG9yOiBcIltkYXRhLXRvZ2dsZT0nb2ZmY2FudmFzJ11cIixcbiAgLy9BY3RpdmF0ZSBzaWRlYmFyIHB1c2ggbWVudVxuICBzaWRlYmFyUHVzaE1lbnU6IHRydWUsXG4gIC8vQWN0aXZhdGUgc2lkZWJhciBzbGltc2Nyb2xsIGlmIHRoZSBmaXhlZCBsYXlvdXQgaXMgc2V0IChyZXF1aXJlcyBTbGltU2Nyb2xsIFBsdWdpbilcbiAgc2lkZWJhclNsaW1TY3JvbGw6IHRydWUsXG4gIC8vRW5hYmxlIHNpZGViYXIgZXhwYW5kIG9uIGhvdmVyIGVmZmVjdCBmb3Igc2lkZWJhciBtaW5pXG4gIC8vVGhpcyBvcHRpb24gaXMgZm9yY2VkIHRvIHRydWUgaWYgYm90aCB0aGUgZml4ZWQgbGF5b3V0IGFuZCBzaWRlYmFyIG1pbmlcbiAgLy9hcmUgdXNlZCB0b2dldGhlclxuICBzaWRlYmFyRXhwYW5kT25Ib3ZlcjogZmFsc2UsXG4gIC8vQm94UmVmcmVzaCBQbHVnaW5cbiAgZW5hYmxlQm94UmVmcmVzaDogdHJ1ZSxcbiAgLy9Cb290c3RyYXAuanMgdG9vbHRpcFxuICBlbmFibGVCU1RvcHBsdGlwOiB0cnVlLFxuICBCU1Rvb2x0aXBTZWxlY3RvcjogXCJbZGF0YS10b2dnbGU9J3Rvb2x0aXAnXVwiLFxuICAvL0VuYWJsZSBGYXN0IENsaWNrLiBGYXN0Y2xpY2suanMgY3JlYXRlcyBhIG1vcmVcbiAgLy9uYXRpdmUgdG91Y2ggZXhwZXJpZW5jZSB3aXRoIHRvdWNoIGRldmljZXMuIElmIHlvdVxuICAvL2Nob29zZSB0byBlbmFibGUgdGhlIHBsdWdpbiwgbWFrZSBzdXJlIHlvdSBsb2FkIHRoZSBzY3JpcHRcbiAgLy9iZWZvcmUgQWRtaW5MVEUncyBhcHAuanNcbiAgZW5hYmxlRmFzdGNsaWNrOiBmYWxzZSxcbiAgLy9Db250cm9sIFNpZGViYXIgVHJlZSB2aWV3c1xuICBlbmFibGVDb250cm9sVHJlZVZpZXc6IHRydWUsXG4gIC8vQ29udHJvbCBTaWRlYmFyIE9wdGlvbnNcbiAgZW5hYmxlQ29udHJvbFNpZGViYXI6IHRydWUsXG4gIGNvbnRyb2xTaWRlYmFyT3B0aW9uczoge1xuICAgIC8vV2hpY2ggYnV0dG9uIHNob3VsZCB0cmlnZ2VyIHRoZSBvcGVuL2Nsb3NlIGV2ZW50XG4gICAgdG9nZ2xlQnRuU2VsZWN0b3I6IFwiW2RhdGEtdG9nZ2xlPSdjb250cm9sLXNpZGViYXInXVwiLFxuICAgIC8vVGhlIHNpZGViYXIgc2VsZWN0b3JcbiAgICBzZWxlY3RvcjogXCIuY29udHJvbC1zaWRlYmFyXCIsXG4gICAgLy9FbmFibGUgc2xpZGUgb3ZlciBjb250ZW50XG4gICAgc2xpZGU6IHRydWVcbiAgfSxcbiAgLy9Cb3ggV2lkZ2V0IFBsdWdpbi4gRW5hYmxlIHRoaXMgcGx1Z2luXG4gIC8vdG8gYWxsb3cgYm94ZXMgdG8gYmUgY29sbGFwc2VkIGFuZC9vciByZW1vdmVkXG4gIGVuYWJsZUJveFdpZGdldDogdHJ1ZSxcbiAgLy9Cb3ggV2lkZ2V0IHBsdWdpbiBvcHRpb25zXG4gIGJveFdpZGdldE9wdGlvbnM6IHtcbiAgICBib3hXaWRnZXRJY29uczoge1xuICAgICAgLy9Db2xsYXBzZSBpY29uXG4gICAgICBjb2xsYXBzZTogJ2ZhLW1pbnVzJyxcbiAgICAgIC8vT3BlbiBpY29uXG4gICAgICBvcGVuOiAnZmEtcGx1cycsXG4gICAgICAvL1JlbW92ZSBpY29uXG4gICAgICByZW1vdmU6ICdmYS10aW1lcydcbiAgICB9LFxuICAgIGJveFdpZGdldFNlbGVjdG9yczoge1xuICAgICAgLy9SZW1vdmUgYnV0dG9uIHNlbGVjdG9yXG4gICAgICByZW1vdmU6ICdbZGF0YS13aWRnZXQ9XCJyZW1vdmVcIl0nLFxuICAgICAgLy9Db2xsYXBzZSBidXR0b24gc2VsZWN0b3JcbiAgICAgIGNvbGxhcHNlOiAnW2RhdGEtd2lkZ2V0PVwiY29sbGFwc2VcIl0nXG4gICAgfVxuICB9LFxuICAvL0RpcmVjdCBDaGF0IHBsdWdpbiBvcHRpb25zXG4gIGRpcmVjdENoYXQ6IHtcbiAgICAvL0VuYWJsZSBkaXJlY3QgY2hhdCBieSBkZWZhdWx0XG4gICAgZW5hYmxlOiB0cnVlLFxuICAgIC8vVGhlIGJ1dHRvbiB0byBvcGVuIGFuZCBjbG9zZSB0aGUgY2hhdCBjb250YWN0cyBwYW5lXG4gICAgY29udGFjdFRvZ2dsZVNlbGVjdG9yOiAnW2RhdGEtd2lkZ2V0PVwiY2hhdC1wYW5lLXRvZ2dsZVwiXSdcbiAgfSxcbiAgLy9EZWZpbmUgdGhlIHNldCBvZiBjb2xvcnMgdG8gdXNlIGdsb2JhbGx5IGFyb3VuZCB0aGUgd2Vic2l0ZVxuICBjb2xvcnM6IHtcbiAgICBsaWdodEJsdWU6IFwiIzNjOGRiY1wiLFxuICAgIHJlZDogXCIjZjU2OTU0XCIsXG4gICAgZ3JlZW46IFwiIzAwYTY1YVwiLFxuICAgIGFxdWE6IFwiIzAwYzBlZlwiLFxuICAgIHllbGxvdzogXCIjZjM5YzEyXCIsXG4gICAgYmx1ZTogXCIjMDA3M2I3XCIsXG4gICAgbmF2eTogXCIjMDAxRjNGXCIsXG4gICAgdGVhbDogXCIjMzlDQ0NDXCIsXG4gICAgb2xpdmU6IFwiIzNEOTk3MFwiLFxuICAgIGxpbWU6IFwiIzAxRkY3MFwiLFxuICAgIG9yYW5nZTogXCIjRkY4NTFCXCIsXG4gICAgZnVjaHNpYTogXCIjRjAxMkJFXCIsXG4gICAgcHVycGxlOiBcIiM4RTI0QUFcIixcbiAgICBtYXJvb246IFwiI0Q4MUI2MFwiLFxuICAgIGJsYWNrOiBcIiMyMjIyMjJcIixcbiAgICBncmF5OiBcIiNkMmQ2ZGVcIlxuICB9LFxuICAvL1RoZSBzdGFuZGFyZCBzY3JlZW4gc2l6ZXMgdGhhdCBib290c3RyYXAgdXNlcy5cbiAgLy9JZiB5b3UgY2hhbmdlIHRoZXNlIGluIHRoZSB2YXJpYWJsZXMubGVzcyBmaWxlLCBjaGFuZ2VcbiAgLy90aGVtIGhlcmUgdG9vLlxuICBzY3JlZW5TaXplczoge1xuICAgIHhzOiA0ODAsXG4gICAgc206IDc2OCxcbiAgICBtZDogOTkyLFxuICAgIGxnOiAxMjAwXG4gIH1cbn07XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLVxuICogLSBJbXBsZW1lbnRhdGlvbiAtXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS1cbiAqIFRoZSBuZXh0IGJsb2NrIG9mIGNvZGUgaW1wbGVtZW50cyBBZG1pbkxURSdzXG4gKiBmdW5jdGlvbnMgYW5kIHBsdWdpbnMgYXMgc3BlY2lmaWVkIGJ5IHRoZVxuICogb3B0aW9ucyBhYm92ZS5cbiAqL1xuJC5BZG1pbkxURS5pbml0ID0gZnVuY3Rpb24oKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIC8vRml4IGZvciBJRSBwYWdlIHRyYW5zaXRpb25zXG4gICQoXCJib2R5XCIpLnJlbW92ZUNsYXNzKFwiaG9sZC10cmFuc2l0aW9uXCIpO1xuXG4gIC8vRXh0ZW5kIG9wdGlvbnMgaWYgZXh0ZXJuYWwgb3B0aW9ucyBleGlzdFxuICBpZiAodHlwZW9mIEFkbWluTFRFT3B0aW9ucyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICQuZXh0ZW5kKHRydWUsXG4gICAgICAkLkFkbWluTFRFLm9wdGlvbnMsXG4gICAgICBBZG1pbkxURU9wdGlvbnMpO1xuICB9XG5cbiAgLy9FYXN5IGFjY2VzcyB0byBvcHRpb25zXG4gIHZhciBvID0gJC5BZG1pbkxURS5vcHRpb25zO1xuXG4gIC8vU2V0IHVwIHRoZSBvYmplY3RcbiAgX2luaXQoKTtcblxuICAvL0FjdGl2YXRlIHRoZSBsYXlvdXQgbWFrZXJcbiAgJC5BZG1pbkxURS5sYXlvdXQuYWN0aXZhdGUoKTtcblxuICAvL0VuYWJsZSBzaWRlYmFyIHRyZWUgdmlldyBjb250cm9sc1xuICBpZiAoby5lbmFibGVDb250cm9sVHJlZVZpZXcpIHtcbiAgICAkLkFkbWluTFRFLnRyZWUoJy5zaWRlYmFyJyk7XG4gIH1cblxuICAvL0VuYWJsZSBjb250cm9sIHNpZGViYXJcbiAgaWYgKG8uZW5hYmxlQ29udHJvbFNpZGViYXIpIHtcbiAgICAkLkFkbWluTFRFLmNvbnRyb2xTaWRlYmFyLmFjdGl2YXRlKCk7XG4gIH1cblxuICAvL0FkZCBzbGltc2Nyb2xsIHRvIG5hdmJhciBkcm9wZG93blxuICBpZiAoby5uYXZiYXJNZW51U2xpbXNjcm9sbCAmJiB0eXBlb2YgJC5mbi5zbGltc2Nyb2xsICE9ICd1bmRlZmluZWQnKSB7XG4gICAgJChcIi5uYXZiYXIgLm1lbnVcIikuc2xpbXNjcm9sbCh7XG4gICAgICBoZWlnaHQ6IG8ubmF2YmFyTWVudUhlaWdodCxcbiAgICAgIGFsd2F5c1Zpc2libGU6IGZhbHNlLFxuICAgICAgc2l6ZTogby5uYXZiYXJNZW51U2xpbXNjcm9sbFdpZHRoXG4gICAgfSkuY3NzKFwid2lkdGhcIiwgXCIxMDAlXCIpO1xuICB9XG5cbiAgLy9BY3RpdmF0ZSBzaWRlYmFyIHB1c2ggbWVudVxuICBpZiAoby5zaWRlYmFyUHVzaE1lbnUpIHtcbiAgICAkLkFkbWluTFRFLnB1c2hNZW51LmFjdGl2YXRlKG8uc2lkZWJhclRvZ2dsZVNlbGVjdG9yKTtcbiAgfVxuXG4gIC8vQWN0aXZhdGUgQm9vdHN0cmFwIHRvb2x0aXBcbiAgaWYgKG8uZW5hYmxlQlNUb3BwbHRpcCkge1xuICAgICQoJ2JvZHknKS50b29sdGlwKHtcbiAgICAgIHNlbGVjdG9yOiBvLkJTVG9vbHRpcFNlbGVjdG9yLFxuICAgICAgY29udGFpbmVyOiAnYm9keSdcbiAgICB9KTtcbiAgfVxuXG4gIC8vQWN0aXZhdGUgYm94IHdpZGdldFxuICBpZiAoby5lbmFibGVCb3hXaWRnZXQpIHtcbiAgICAkLkFkbWluTFRFLmJveFdpZGdldC5hY3RpdmF0ZSgpO1xuICB9XG5cbiAgLy9BY3RpdmF0ZSBmYXN0IGNsaWNrXG4gIGlmIChvLmVuYWJsZUZhc3RjbGljayAmJiB0eXBlb2YgRmFzdENsaWNrICE9ICd1bmRlZmluZWQnKSB7XG4gICAgRmFzdENsaWNrLmF0dGFjaChkb2N1bWVudC5ib2R5KTtcbiAgfVxuXG4gIC8vQWN0aXZhdGUgZGlyZWN0IGNoYXQgd2lkZ2V0XG4gIGlmIChvLmRpcmVjdENoYXQuZW5hYmxlKSB7XG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgby5kaXJlY3RDaGF0LmNvbnRhY3RUb2dnbGVTZWxlY3RvciwgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGJveCA9ICQodGhpcykucGFyZW50cygnLmRpcmVjdC1jaGF0JykuZmlyc3QoKTtcbiAgICAgIGJveC50b2dnbGVDbGFzcygnZGlyZWN0LWNoYXQtY29udGFjdHMtb3BlbicpO1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogSU5JVElBTElaRSBCVVRUT04gVE9HR0xFXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKi9cbiAgJCgnLmJ0bi1ncm91cFtkYXRhLXRvZ2dsZT1cImJ0bi10b2dnbGVcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZ3JvdXAgPSAkKHRoaXMpO1xuICAgICQodGhpcykuZmluZChcIi5idG5cIikub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGdyb3VwLmZpbmQoXCIuYnRuLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG5cbiAgfSk7XG4gIHZhciBteV9za2lucyA9IFtcbiAgICBcInNraW4tYmx1ZVwiLFxuICAgIFwic2tpbi1ibGFja1wiLFxuICAgIFwic2tpbi1yZWRcIixcbiAgICBcInNraW4teWVsbG93XCIsXG4gICAgXCJza2luLXB1cnBsZVwiLFxuICAgIFwic2tpbi1ncmVlblwiLFxuICAgIFwic2tpbi1ibHVlLWxpZ2h0XCIsXG4gICAgXCJza2luLWJsYWNrLWxpZ2h0XCIsXG4gICAgXCJza2luLXJlZC1saWdodFwiLFxuICAgIFwic2tpbi15ZWxsb3ctbGlnaHRcIixcbiAgICBcInNraW4tcHVycGxlLWxpZ2h0XCIsXG4gICAgXCJza2luLWdyZWVuLWxpZ2h0XCJcbiAgXTtcblxuICAvL0NyZWF0ZSB0aGUgbmV3IHRhYlxuICB2YXIgdGFiX3BhbmUgPSAkKFwiPGRpdiAvPlwiLCB7XG4gICAgXCJpZFwiOiBcImNvbnRyb2wtc2lkZWJhci10aGVtZS1kZW1vLW9wdGlvbnMtdGFiXCIsXG4gICAgXCJjbGFzc1wiOiBcInRhYi1wYW5lIGFjdGl2ZVwiXG4gIH0pO1xuXG4gIC8vQ3JlYXRlIHRoZSB0YWIgYnV0dG9uXG4gIHZhciB0YWJfYnV0dG9uID0gJChcIjxsaSAvPlwiLCB7XCJjbGFzc1wiOiBcImFjdGl2ZVwifSlcbiAgICAgIC5odG1sKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApJyBkYXRhLXRhcmdldD0nI2NvbnRyb2wtc2lkZWJhci10aGVtZS1kZW1vLW9wdGlvbnMtdGFiJyBkYXRhLXRvZ2dsZT0ndGFiJz5cIlxuICAgICAgKyBcIjxpIGNsYXNzPSdmYSBmYS13cmVuY2gnPjwvaT5cIlxuICAgICAgKyBcIjwvYT5cIik7XG5cbiAgLy9BZGQgdGhlIHRhYiBidXR0b24gdG8gdGhlIHJpZ2h0IHNpZGViYXIgdGFic1xuICAkKFwiW2RhdGEtdGFyZ2V0PScjY29udHJvbC1zaWRlYmFyLWhvbWUtdGFiJ11cIilcbiAgICAgIC5wYXJlbnQoKVxuICAgICAgLmJlZm9yZSh0YWJfYnV0dG9uKTtcblxuICAvL0NyZWF0ZSB0aGUgbWVudVxuICB2YXIgZGVtb19zZXR0aW5ncyA9ICQoXCI8ZGl2IC8+XCIpO1xuXG4gIC8vTGF5b3V0IG9wdGlvbnNcbiAgZGVtb19zZXR0aW5ncy5hcHBlbmQoXG4gICAgICBcIjxoNCBjbGFzcz0nY29udHJvbC1zaWRlYmFyLWhlYWRpbmcnPlwiXG4gICAgICArIFwiTGF5b3V0IE9wdGlvbnNcIlxuICAgICAgKyBcIjwvaDQ+XCJcbiAgICAgICAgLy9GaXhlZCBsYXlvdXRcbiAgICAgICsgXCI8ZGl2IGNsYXNzPSdmb3JtLWdyb3VwJz5cIlxuICAgICAgKyBcIjxsYWJlbCBjbGFzcz0nY29udHJvbC1zaWRlYmFyLXN1YmhlYWRpbmcnPlwiXG4gICAgICArIFwiPGlucHV0IHR5cGU9J2NoZWNrYm94JyBkYXRhLWxheW91dD0nZml4ZWQnIGNsYXNzPSdwdWxsLXJpZ2h0Jy8+IFwiXG4gICAgICArIFwiRml4ZWQgbGF5b3V0XCJcbiAgICAgICsgXCI8L2xhYmVsPlwiXG4gICAgICArIFwiPHA+QWN0aXZhdGUgdGhlIGZpeGVkIGxheW91dC4gWW91IGNhbid0IHVzZSBmaXhlZCBhbmQgYm94ZWQgbGF5b3V0cyB0b2dldGhlcjwvcD5cIlxuICAgICAgKyBcIjwvZGl2PlwiXG4gICAgICAgIC8vQm94ZWQgbGF5b3V0XG4gICAgICArIFwiPGRpdiBjbGFzcz0nZm9ybS1ncm91cCc+XCJcbiAgICAgICsgXCI8bGFiZWwgY2xhc3M9J2NvbnRyb2wtc2lkZWJhci1zdWJoZWFkaW5nJz5cIlxuICAgICAgKyBcIjxpbnB1dCB0eXBlPSdjaGVja2JveCcgZGF0YS1sYXlvdXQ9J2xheW91dC1ib3hlZCdjbGFzcz0ncHVsbC1yaWdodCcvPiBcIlxuICAgICAgKyBcIkJveGVkIExheW91dFwiXG4gICAgICArIFwiPC9sYWJlbD5cIlxuICAgICAgKyBcIjxwPkFjdGl2YXRlIHRoZSBib3hlZCBsYXlvdXQ8L3A+XCJcbiAgICAgICsgXCI8L2Rpdj5cIlxuICAgICAgICAvL1NpZGViYXIgVG9nZ2xlXG4gICAgICArIFwiPGRpdiBjbGFzcz0nZm9ybS1ncm91cCc+XCJcbiAgICAgICsgXCI8bGFiZWwgY2xhc3M9J2NvbnRyb2wtc2lkZWJhci1zdWJoZWFkaW5nJz5cIlxuICAgICAgKyBcIjxpbnB1dCB0eXBlPSdjaGVja2JveCcgZGF0YS1sYXlvdXQ9J3NpZGViYXItY29sbGFwc2UnIGNsYXNzPSdwdWxsLXJpZ2h0Jy8+IFwiXG4gICAgICArIFwiVG9nZ2xlIFNpZGViYXJcIlxuICAgICAgKyBcIjwvbGFiZWw+XCJcbiAgICAgICsgXCI8cD5Ub2dnbGUgdGhlIGxlZnQgc2lkZWJhcidzIHN0YXRlIChvcGVuIG9yIGNvbGxhcHNlKTwvcD5cIlxuICAgICAgKyBcIjwvZGl2PlwiXG4gICAgICAgIC8vU2lkZWJhciBtaW5pIGV4cGFuZCBvbiBob3ZlciB0b2dnbGVcbiAgICAgICsgXCI8ZGl2IGNsYXNzPSdmb3JtLWdyb3VwJz5cIlxuICAgICAgKyBcIjxsYWJlbCBjbGFzcz0nY29udHJvbC1zaWRlYmFyLXN1YmhlYWRpbmcnPlwiXG4gICAgICArIFwiPGlucHV0IHR5cGU9J2NoZWNrYm94JyBkYXRhLWVuYWJsZT0nZXhwYW5kT25Ib3ZlcicgY2xhc3M9J3B1bGwtcmlnaHQnLz4gXCJcbiAgICAgICsgXCJTaWRlYmFyIEV4cGFuZCBvbiBIb3ZlclwiXG4gICAgICArIFwiPC9sYWJlbD5cIlxuICAgICAgKyBcIjxwPkxldCB0aGUgc2lkZWJhciBtaW5pIGV4cGFuZCBvbiBob3ZlcjwvcD5cIlxuICAgICAgKyBcIjwvZGl2PlwiXG4gICAgICAgIC8vQ29udHJvbCBTaWRlYmFyIFRvZ2dsZVxuICAgICAgKyBcIjxkaXYgY2xhc3M9J2Zvcm0tZ3JvdXAnPlwiXG4gICAgICArIFwiPGxhYmVsIGNsYXNzPSdjb250cm9sLXNpZGViYXItc3ViaGVhZGluZyc+XCJcbiAgICAgICsgXCI8aW5wdXQgdHlwZT0nY2hlY2tib3gnIGRhdGEtY29udHJvbHNpZGViYXI9J2NvbnRyb2wtc2lkZWJhci1vcGVuJyBjbGFzcz0ncHVsbC1yaWdodCcvPiBcIlxuICAgICAgKyBcIlRvZ2dsZSBSaWdodCBTaWRlYmFyIFNsaWRlXCJcbiAgICAgICsgXCI8L2xhYmVsPlwiXG4gICAgICArIFwiPHA+VG9nZ2xlIGJldHdlZW4gc2xpZGUgb3ZlciBjb250ZW50IGFuZCBwdXNoIGNvbnRlbnQgZWZmZWN0czwvcD5cIlxuICAgICAgKyBcIjwvZGl2PlwiXG4gICAgICAgIC8vQ29udHJvbCBTaWRlYmFyIFNraW4gVG9nZ2xlXG4gICAgICArIFwiPGRpdiBjbGFzcz0nZm9ybS1ncm91cCc+XCJcbiAgICAgICsgXCI8bGFiZWwgY2xhc3M9J2NvbnRyb2wtc2lkZWJhci1zdWJoZWFkaW5nJz5cIlxuICAgICAgKyBcIjxpbnB1dCB0eXBlPSdjaGVja2JveCcgZGF0YS1zaWRlYmFyc2tpbj0ndG9nZ2xlJyBjbGFzcz0ncHVsbC1yaWdodCcvPiBcIlxuICAgICAgKyBcIlRvZ2dsZSBSaWdodCBTaWRlYmFyIFNraW5cIlxuICAgICAgKyBcIjwvbGFiZWw+XCJcbiAgICAgICsgXCI8cD5Ub2dnbGUgYmV0d2VlbiBkYXJrIGFuZCBsaWdodCBza2lucyBmb3IgdGhlIHJpZ2h0IHNpZGViYXI8L3A+XCJcbiAgICAgICsgXCI8L2Rpdj5cIlxuICApO1xuICB2YXIgc2tpbnNfbGlzdCA9ICQoXCI8dWwgLz5cIiwge1wiY2xhc3NcIjogJ2xpc3QtdW5zdHlsZWQgY2xlYXJmaXgnfSk7XG5cbiAgLy9EYXJrIHNpZGViYXIgc2tpbnNcbiAgdmFyIHNraW5fYmx1ZSA9XG4gICAgICAkKFwiPGxpIC8+XCIsIHtzdHlsZTogXCJmbG9hdDpsZWZ0OyB3aWR0aDogMzMuMzMzMzMlOyBwYWRkaW5nOiA1cHg7XCJ9KVxuICAgICAgICAgIC5hcHBlbmQoXCI8YSBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBkYXRhLXNraW49J3NraW4tYmx1ZScgc3R5bGU9J2Rpc3BsYXk6IGJsb2NrOyBib3gtc2hhZG93OiAwIDAgM3B4IHJnYmEoMCwwLDAsMC40KScgY2xhc3M9J2NsZWFyZml4IGZ1bGwtb3BhY2l0eS1ob3Zlcic+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4OyBiYWNrZ3JvdW5kOiAjMzY3ZmE5Oyc+PC9zcGFuPjxzcGFuIGNsYXNzPSdiZy1saWdodC1ibHVlJyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICMyMjJkMzI7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nPkJsdWU8L3A+XCIpO1xuICBza2luc19saXN0LmFwcGVuZChza2luX2JsdWUpO1xuICB2YXIgc2tpbl9ibGFjayA9XG4gICAgICAkKFwiPGxpIC8+XCIsIHtzdHlsZTogXCJmbG9hdDpsZWZ0OyB3aWR0aDogMzMuMzMzMzMlOyBwYWRkaW5nOiA1cHg7XCJ9KVxuICAgICAgICAgIC5hcHBlbmQoXCI8YSBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBkYXRhLXNraW49J3NraW4tYmxhY2snIHN0eWxlPSdkaXNwbGF5OiBibG9jazsgYm94LXNoYWRvdzogMCAwIDNweCByZ2JhKDAsMCwwLDAuNCknIGNsYXNzPSdjbGVhcmZpeCBmdWxsLW9wYWNpdHktaG92ZXInPlwiXG4gICAgICAgICAgKyBcIjxkaXYgc3R5bGU9J2JveC1zaGFkb3c6IDAgMCAycHggcmdiYSgwLDAsMCwwLjEpJyBjbGFzcz0nY2xlYXJmaXgnPjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7IGJhY2tncm91bmQ6ICNmZWZlZmU7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDdweDsgYmFja2dyb3VuZDogI2ZlZmVmZTsnPjwvc3Bhbj48L2Rpdj5cIlxuICAgICAgICAgICsgXCI8ZGl2PjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiAyMHB4OyBiYWNrZ3JvdW5kOiAjMjIyOyc+PC9zcGFuPjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogODAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiAyMHB4OyBiYWNrZ3JvdW5kOiAjZjRmNWY3Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjwvYT5cIlxuICAgICAgICAgICsgXCI8cCBjbGFzcz0ndGV4dC1jZW50ZXIgbm8tbWFyZ2luJz5CbGFjazwvcD5cIik7XG4gIHNraW5zX2xpc3QuYXBwZW5kKHNraW5fYmxhY2spO1xuICB2YXIgc2tpbl9wdXJwbGUgPVxuICAgICAgJChcIjxsaSAvPlwiLCB7c3R5bGU6IFwiZmxvYXQ6bGVmdDsgd2lkdGg6IDMzLjMzMzMzJTsgcGFkZGluZzogNXB4O1wifSlcbiAgICAgICAgICAuYXBwZW5kKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApOycgZGF0YS1za2luPSdza2luLXB1cnBsZScgc3R5bGU9J2Rpc3BsYXk6IGJsb2NrOyBib3gtc2hhZG93OiAwIDAgM3B4IHJnYmEoMCwwLDAsMC40KScgY2xhc3M9J2NsZWFyZml4IGZ1bGwtb3BhY2l0eS1ob3Zlcic+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4OycgY2xhc3M9J2JnLXB1cnBsZS1hY3RpdmUnPjwvc3Bhbj48c3BhbiBjbGFzcz0nYmctcHVycGxlJyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICMyMjJkMzI7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nPlB1cnBsZTwvcD5cIik7XG4gIHNraW5zX2xpc3QuYXBwZW5kKHNraW5fcHVycGxlKTtcbiAgdmFyIHNraW5fZ3JlZW4gPVxuICAgICAgJChcIjxsaSAvPlwiLCB7c3R5bGU6IFwiZmxvYXQ6bGVmdDsgd2lkdGg6IDMzLjMzMzMzJTsgcGFkZGluZzogNXB4O1wifSlcbiAgICAgICAgICAuYXBwZW5kKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApOycgZGF0YS1za2luPSdza2luLWdyZWVuJyBzdHlsZT0nZGlzcGxheTogYmxvY2s7IGJveC1zaGFkb3c6IDAgMCAzcHggcmdiYSgwLDAsMCwwLjQpJyBjbGFzcz0nY2xlYXJmaXggZnVsbC1vcGFjaXR5LWhvdmVyJz5cIlxuICAgICAgICAgICsgXCI8ZGl2PjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7JyBjbGFzcz0nYmctZ3JlZW4tYWN0aXZlJz48L3NwYW4+PHNwYW4gY2xhc3M9J2JnLWdyZWVuJyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICMyMjJkMzI7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nPkdyZWVuPC9wPlwiKTtcbiAgc2tpbnNfbGlzdC5hcHBlbmQoc2tpbl9ncmVlbik7XG4gIHZhciBza2luX3JlZCA9XG4gICAgICAkKFwiPGxpIC8+XCIsIHtzdHlsZTogXCJmbG9hdDpsZWZ0OyB3aWR0aDogMzMuMzMzMzMlOyBwYWRkaW5nOiA1cHg7XCJ9KVxuICAgICAgICAgIC5hcHBlbmQoXCI8YSBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBkYXRhLXNraW49J3NraW4tcmVkJyBzdHlsZT0nZGlzcGxheTogYmxvY2s7IGJveC1zaGFkb3c6IDAgMCAzcHggcmdiYSgwLDAsMCwwLjQpJyBjbGFzcz0nY2xlYXJmaXggZnVsbC1vcGFjaXR5LWhvdmVyJz5cIlxuICAgICAgICAgICsgXCI8ZGl2PjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7JyBjbGFzcz0nYmctcmVkLWFjdGl2ZSc+PC9zcGFuPjxzcGFuIGNsYXNzPSdiZy1yZWQnIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogODAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogMjBweDsgYmFja2dyb3VuZDogIzIyMmQzMjsnPjwvc3Bhbj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogMjBweDsgYmFja2dyb3VuZDogI2Y0ZjVmNzsnPjwvc3Bhbj48L2Rpdj5cIlxuICAgICAgICAgICsgXCI8L2E+XCJcbiAgICAgICAgICArIFwiPHAgY2xhc3M9J3RleHQtY2VudGVyIG5vLW1hcmdpbic+UmVkPC9wPlwiKTtcbiAgc2tpbnNfbGlzdC5hcHBlbmQoc2tpbl9yZWQpO1xuICB2YXIgc2tpbl95ZWxsb3cgPVxuICAgICAgJChcIjxsaSAvPlwiLCB7c3R5bGU6IFwiZmxvYXQ6bGVmdDsgd2lkdGg6IDMzLjMzMzMzJTsgcGFkZGluZzogNXB4O1wifSlcbiAgICAgICAgICAuYXBwZW5kKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApOycgZGF0YS1za2luPSdza2luLXllbGxvdycgc3R5bGU9J2Rpc3BsYXk6IGJsb2NrOyBib3gtc2hhZG93OiAwIDAgM3B4IHJnYmEoMCwwLDAsMC40KScgY2xhc3M9J2NsZWFyZml4IGZ1bGwtb3BhY2l0eS1ob3Zlcic+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4OycgY2xhc3M9J2JnLXllbGxvdy1hY3RpdmUnPjwvc3Bhbj48c3BhbiBjbGFzcz0nYmcteWVsbG93JyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICMyMjJkMzI7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nPlllbGxvdzwvcD5cIik7XG4gIHNraW5zX2xpc3QuYXBwZW5kKHNraW5feWVsbG93KTtcblxuICAvL0xpZ2h0IHNpZGViYXIgc2tpbnNcbiAgdmFyIHNraW5fYmx1ZV9saWdodCA9XG4gICAgICAkKFwiPGxpIC8+XCIsIHtzdHlsZTogXCJmbG9hdDpsZWZ0OyB3aWR0aDogMzMuMzMzMzMlOyBwYWRkaW5nOiA1cHg7XCJ9KVxuICAgICAgICAgIC5hcHBlbmQoXCI8YSBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBkYXRhLXNraW49J3NraW4tYmx1ZS1saWdodCcgc3R5bGU9J2Rpc3BsYXk6IGJsb2NrOyBib3gtc2hhZG93OiAwIDAgM3B4IHJnYmEoMCwwLDAsMC40KScgY2xhc3M9J2NsZWFyZml4IGZ1bGwtb3BhY2l0eS1ob3Zlcic+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4OyBiYWNrZ3JvdW5kOiAjMzY3ZmE5Oyc+PC9zcGFuPjxzcGFuIGNsYXNzPSdiZy1saWdodC1ibHVlJyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmOWZhZmM7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nIHN0eWxlPSdmb250LXNpemU6IDEycHgnPkJsdWUgTGlnaHQ8L3A+XCIpO1xuICBza2luc19saXN0LmFwcGVuZChza2luX2JsdWVfbGlnaHQpO1xuICB2YXIgc2tpbl9ibGFja19saWdodCA9XG4gICAgICAkKFwiPGxpIC8+XCIsIHtzdHlsZTogXCJmbG9hdDpsZWZ0OyB3aWR0aDogMzMuMzMzMzMlOyBwYWRkaW5nOiA1cHg7XCJ9KVxuICAgICAgICAgIC5hcHBlbmQoXCI8YSBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBkYXRhLXNraW49J3NraW4tYmxhY2stbGlnaHQnIHN0eWxlPSdkaXNwbGF5OiBibG9jazsgYm94LXNoYWRvdzogMCAwIDNweCByZ2JhKDAsMCwwLDAuNCknIGNsYXNzPSdjbGVhcmZpeCBmdWxsLW9wYWNpdHktaG92ZXInPlwiXG4gICAgICAgICAgKyBcIjxkaXYgc3R5bGU9J2JveC1zaGFkb3c6IDAgMCAycHggcmdiYSgwLDAsMCwwLjEpJyBjbGFzcz0nY2xlYXJmaXgnPjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7IGJhY2tncm91bmQ6ICNmZWZlZmU7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDdweDsgYmFja2dyb3VuZDogI2ZlZmVmZTsnPjwvc3Bhbj48L2Rpdj5cIlxuICAgICAgICAgICsgXCI8ZGl2PjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiAyMHB4OyBiYWNrZ3JvdW5kOiAjZjlmYWZjOyc+PC9zcGFuPjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogODAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiAyMHB4OyBiYWNrZ3JvdW5kOiAjZjRmNWY3Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjwvYT5cIlxuICAgICAgICAgICsgXCI8cCBjbGFzcz0ndGV4dC1jZW50ZXIgbm8tbWFyZ2luJyBzdHlsZT0nZm9udC1zaXplOiAxMnB4Jz5CbGFjayBMaWdodDwvcD5cIik7XG4gIHNraW5zX2xpc3QuYXBwZW5kKHNraW5fYmxhY2tfbGlnaHQpO1xuICB2YXIgc2tpbl9wdXJwbGVfbGlnaHQgPVxuICAgICAgJChcIjxsaSAvPlwiLCB7c3R5bGU6IFwiZmxvYXQ6bGVmdDsgd2lkdGg6IDMzLjMzMzMzJTsgcGFkZGluZzogNXB4O1wifSlcbiAgICAgICAgICAuYXBwZW5kKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApOycgZGF0YS1za2luPSdza2luLXB1cnBsZS1saWdodCcgc3R5bGU9J2Rpc3BsYXk6IGJsb2NrOyBib3gtc2hhZG93OiAwIDAgM3B4IHJnYmEoMCwwLDAsMC40KScgY2xhc3M9J2NsZWFyZml4IGZ1bGwtb3BhY2l0eS1ob3Zlcic+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4OycgY2xhc3M9J2JnLXB1cnBsZS1hY3RpdmUnPjwvc3Bhbj48c3BhbiBjbGFzcz0nYmctcHVycGxlJyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmOWZhZmM7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nIHN0eWxlPSdmb250LXNpemU6IDEycHgnPlB1cnBsZSBMaWdodDwvcD5cIik7XG4gIHNraW5zX2xpc3QuYXBwZW5kKHNraW5fcHVycGxlX2xpZ2h0KTtcbiAgdmFyIHNraW5fZ3JlZW5fbGlnaHQgPVxuICAgICAgJChcIjxsaSAvPlwiLCB7c3R5bGU6IFwiZmxvYXQ6bGVmdDsgd2lkdGg6IDMzLjMzMzMzJTsgcGFkZGluZzogNXB4O1wifSlcbiAgICAgICAgICAuYXBwZW5kKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApOycgZGF0YS1za2luPSdza2luLWdyZWVuLWxpZ2h0JyBzdHlsZT0nZGlzcGxheTogYmxvY2s7IGJveC1zaGFkb3c6IDAgMCAzcHggcmdiYSgwLDAsMCwwLjQpJyBjbGFzcz0nY2xlYXJmaXggZnVsbC1vcGFjaXR5LWhvdmVyJz5cIlxuICAgICAgICAgICsgXCI8ZGl2PjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7JyBjbGFzcz0nYmctZ3JlZW4tYWN0aXZlJz48L3NwYW4+PHNwYW4gY2xhc3M9J2JnLWdyZWVuJyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmOWZhZmM7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nIHN0eWxlPSdmb250LXNpemU6IDEycHgnPkdyZWVuIExpZ2h0PC9wPlwiKTtcbiAgc2tpbnNfbGlzdC5hcHBlbmQoc2tpbl9ncmVlbl9saWdodCk7XG4gIHZhciBza2luX3JlZF9saWdodCA9XG4gICAgICAkKFwiPGxpIC8+XCIsIHtzdHlsZTogXCJmbG9hdDpsZWZ0OyB3aWR0aDogMzMuMzMzMzMlOyBwYWRkaW5nOiA1cHg7XCJ9KVxuICAgICAgICAgIC5hcHBlbmQoXCI8YSBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBkYXRhLXNraW49J3NraW4tcmVkLWxpZ2h0JyBzdHlsZT0nZGlzcGxheTogYmxvY2s7IGJveC1zaGFkb3c6IDAgMCAzcHggcmdiYSgwLDAsMCwwLjQpJyBjbGFzcz0nY2xlYXJmaXggZnVsbC1vcGFjaXR5LWhvdmVyJz5cIlxuICAgICAgICAgICsgXCI8ZGl2PjxzcGFuIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogMjAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7JyBjbGFzcz0nYmctcmVkLWFjdGl2ZSc+PC9zcGFuPjxzcGFuIGNsYXNzPSdiZy1yZWQnIHN0eWxlPSdkaXNwbGF5OmJsb2NrOyB3aWR0aDogODAlOyBmbG9hdDogbGVmdDsgaGVpZ2h0OiA3cHg7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogMjBweDsgYmFja2dyb3VuZDogI2Y5ZmFmYzsnPjwvc3Bhbj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogMjBweDsgYmFja2dyb3VuZDogI2Y0ZjVmNzsnPjwvc3Bhbj48L2Rpdj5cIlxuICAgICAgICAgICsgXCI8L2E+XCJcbiAgICAgICAgICArIFwiPHAgY2xhc3M9J3RleHQtY2VudGVyIG5vLW1hcmdpbicgc3R5bGU9J2ZvbnQtc2l6ZTogMTJweCc+UmVkIExpZ2h0PC9wPlwiKTtcbiAgc2tpbnNfbGlzdC5hcHBlbmQoc2tpbl9yZWRfbGlnaHQpO1xuICB2YXIgc2tpbl95ZWxsb3dfbGlnaHQgPVxuICAgICAgJChcIjxsaSAvPlwiLCB7c3R5bGU6IFwiZmxvYXQ6bGVmdDsgd2lkdGg6IDMzLjMzMzMzJTsgcGFkZGluZzogNXB4O1wifSlcbiAgICAgICAgICAuYXBwZW5kKFwiPGEgaHJlZj0namF2YXNjcmlwdDp2b2lkKDApOycgZGF0YS1za2luPSdza2luLXllbGxvdy1saWdodCcgc3R5bGU9J2Rpc3BsYXk6IGJsb2NrOyBib3gtc2hhZG93OiAwIDAgM3B4IHJnYmEoMCwwLDAsMC40KScgY2xhc3M9J2NsZWFyZml4IGZ1bGwtb3BhY2l0eS1ob3Zlcic+XCJcbiAgICAgICAgICArIFwiPGRpdj48c3BhbiBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDIwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4OycgY2xhc3M9J2JnLXllbGxvdy1hY3RpdmUnPjwvc3Bhbj48c3BhbiBjbGFzcz0nYmcteWVsbG93JyBzdHlsZT0nZGlzcGxheTpibG9jazsgd2lkdGg6IDgwJTsgZmxvYXQ6IGxlZnQ7IGhlaWdodDogN3B4Oyc+PC9zcGFuPjwvZGl2PlwiXG4gICAgICAgICAgKyBcIjxkaXY+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiAyMCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmOWZhZmM7Jz48L3NwYW4+PHNwYW4gc3R5bGU9J2Rpc3BsYXk6YmxvY2s7IHdpZHRoOiA4MCU7IGZsb2F0OiBsZWZ0OyBoZWlnaHQ6IDIwcHg7IGJhY2tncm91bmQ6ICNmNGY1Zjc7Jz48L3NwYW4+PC9kaXY+XCJcbiAgICAgICAgICArIFwiPC9hPlwiXG4gICAgICAgICAgKyBcIjxwIGNsYXNzPSd0ZXh0LWNlbnRlciBuby1tYXJnaW4nIHN0eWxlPSdmb250LXNpemU6IDEycHg7Jz5ZZWxsb3cgTGlnaHQ8L3A+XCIpO1xuICBza2luc19saXN0LmFwcGVuZChza2luX3llbGxvd19saWdodCk7XG5cbiAgZGVtb19zZXR0aW5ncy5hcHBlbmQoXCI8aDQgY2xhc3M9J2NvbnRyb2wtc2lkZWJhci1oZWFkaW5nJz5Ta2luczwvaDQ+XCIpO1xuICBkZW1vX3NldHRpbmdzLmFwcGVuZChza2luc19saXN0KTtcblxuICB0YWJfcGFuZS5hcHBlbmQoZGVtb19zZXR0aW5ncyk7XG4gICQoXCIjY29udHJvbC1zaWRlYmFyLWhvbWUtdGFiXCIpLmFmdGVyKHRhYl9wYW5lKTtcblxuICBzZXR1cCgpO1xuXG4gIC8qKlxuICAgKiBUb2dnbGVzIGxheW91dCBjbGFzc2VzXG4gICAqXG4gICAqIEBwYXJhbSBTdHJpbmcgY2xzIHRoZSBsYXlvdXQgY2xhc3MgdG8gdG9nZ2xlXG4gICAqIEByZXR1cm5zIHZvaWRcbiAgICovXG4gIGZ1bmN0aW9uIGNoYW5nZV9sYXlvdXQoY2xzKSB7XG4gICAgJChcImJvZHlcIikudG9nZ2xlQ2xhc3MoY2xzKTtcbiAgICBBZG1pbkxURS5sYXlvdXQuZml4U2lkZWJhcigpO1xuICAgIC8vRml4IHRoZSBwcm9ibGVtIHdpdGggcmlnaHQgc2lkZWJhciBhbmQgbGF5b3V0IGJveGVkXG4gICAgaWYgKGNscyA9PSBcImxheW91dC1ib3hlZFwiKVxuICAgICAgQWRtaW5MVEUuY29udHJvbFNpZGViYXIuX2ZpeCgkKFwiLmNvbnRyb2wtc2lkZWJhci1iZ1wiKSk7XG4gICAgaWYgKCQoJ2JvZHknKS5oYXNDbGFzcygnZml4ZWQnKSAmJiBjbHMgPT0gJ2ZpeGVkJykge1xuICAgICAgQWRtaW5MVEUucHVzaE1lbnUuZXhwYW5kT25Ib3ZlcigpO1xuICAgICAgQWRtaW5MVEUubGF5b3V0LmFjdGl2YXRlKCk7XG4gICAgfVxuICAgIEFkbWluTFRFLmNvbnRyb2xTaWRlYmFyLl9maXgoJChcIi5jb250cm9sLXNpZGViYXItYmdcIikpO1xuICAgIEFkbWluTFRFLmNvbnRyb2xTaWRlYmFyLl9maXgoJChcIi5jb250cm9sLXNpZGViYXJcIikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIHRoZSBvbGQgc2tpbiB3aXRoIHRoZSBuZXcgc2tpblxuICAgKiBAcGFyYW0gU3RyaW5nIGNscyB0aGUgbmV3IHNraW4gY2xhc3NcbiAgICogQHJldHVybnMgQm9vbGVhbiBmYWxzZSB0byBwcmV2ZW50IGxpbmsncyBkZWZhdWx0IGFjdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gY2hhbmdlX3NraW4oY2xzKSB7XG4gICAgJC5lYWNoKG15X3NraW5zLCBmdW5jdGlvbiAoaSkge1xuICAgICAgJChcImJvZHlcIikucmVtb3ZlQ2xhc3MobXlfc2tpbnNbaV0pO1xuICAgIH0pO1xuXG4gICAgJChcImJvZHlcIikuYWRkQ2xhc3MoY2xzKTtcbiAgICBzdG9yZSgnc2tpbicsIGNscyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3JlIGEgbmV3IHNldHRpbmdzIGluIHRoZSBicm93c2VyXG4gICAqXG4gICAqIEBwYXJhbSBTdHJpbmcgbmFtZSBOYW1lIG9mIHRoZSBzZXR0aW5nXG4gICAqIEBwYXJhbSBTdHJpbmcgdmFsIFZhbHVlIG9mIHRoZSBzZXR0aW5nXG4gICAqIEByZXR1cm5zIHZvaWRcbiAgICovXG4gIGZ1bmN0aW9uIHN0b3JlKG5hbWUsIHZhbCkge1xuICAgIGlmICh0eXBlb2YgKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShuYW1lLCB2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ1BsZWFzZSB1c2UgYSBtb2Rlcm4gYnJvd3NlciB0byBwcm9wZXJseSB2aWV3IHRoaXMgdGVtcGxhdGUhJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByZXN0b3JlZCBzZXR0aW5nXG4gICAqXG4gICAqIEBwYXJhbSBTdHJpbmcgbmFtZSBOYW1lIG9mIG9mIHRoZSBzZXR0aW5nXG4gICAqIEByZXR1cm5zIFN0cmluZyBUaGUgdmFsdWUgb2YgdGhlIHNldHRpbmcgfCBudWxsXG4gICAqL1xuICBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgIGlmICh0eXBlb2YgKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0obmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hbGVydCgnUGxlYXNlIHVzZSBhIG1vZGVybiBicm93c2VyIHRvIHByb3Blcmx5IHZpZXcgdGhpcyB0ZW1wbGF0ZSEnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgZGVmYXVsdCBzZXR0aW5ncyBhbmQgYXBwbHkgdGhlbSB0byB0aGUgdGVtcGxhdGVcbiAgICpcbiAgICogQHJldHVybnMgdm9pZFxuICAgKi9cbiAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgdmFyIHRtcCA9IGdldCgnc2tpbicpO1xuICAgIGlmICh0bXAgJiYgJC5pbkFycmF5KHRtcCwgbXlfc2tpbnMpKVxuICAgICAgY2hhbmdlX3NraW4odG1wKTtcblxuICAgIC8vQWRkIHRoZSBjaGFuZ2Ugc2tpbiBsaXN0ZW5lclxuICAgICQoXCJbZGF0YS1za2luXVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYoJCh0aGlzKS5oYXNDbGFzcygna25vYicpKVxuICAgICAgICByZXR1cm47XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjaGFuZ2Vfc2tpbigkKHRoaXMpLmRhdGEoJ3NraW4nKSk7XG4gICAgfSk7XG5cbiAgICAvL0FkZCB0aGUgbGF5b3V0IG1hbmFnZXJcbiAgICAkKFwiW2RhdGEtbGF5b3V0XVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGFuZ2VfbGF5b3V0KCQodGhpcykuZGF0YSgnbGF5b3V0JykpO1xuICAgIH0pO1xuXG4gICAgJChcIltkYXRhLWNvbnRyb2xzaWRlYmFyXVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGFuZ2VfbGF5b3V0KCQodGhpcykuZGF0YSgnY29udHJvbHNpZGViYXInKSk7XG4gICAgICB2YXIgc2xpZGUgPSAhQWRtaW5MVEUub3B0aW9ucy5jb250cm9sU2lkZWJhck9wdGlvbnMuc2xpZGU7XG4gICAgICBBZG1pbkxURS5vcHRpb25zLmNvbnRyb2xTaWRlYmFyT3B0aW9ucy5zbGlkZSA9IHNsaWRlO1xuICAgICAgaWYgKCFzbGlkZSlcbiAgICAgICAgJCgnLmNvbnRyb2wtc2lkZWJhcicpLnJlbW92ZUNsYXNzKCdjb250cm9sLXNpZGViYXItb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJChcIltkYXRhLXNpZGViYXJza2luPSd0b2dnbGUnXVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2lkZWJhciA9ICQoXCIuY29udHJvbC1zaWRlYmFyXCIpO1xuICAgICAgaWYgKHNpZGViYXIuaGFzQ2xhc3MoXCJjb250cm9sLXNpZGViYXItZGFya1wiKSkge1xuICAgICAgICBzaWRlYmFyLnJlbW92ZUNsYXNzKFwiY29udHJvbC1zaWRlYmFyLWRhcmtcIilcbiAgICAgICAgc2lkZWJhci5hZGRDbGFzcyhcImNvbnRyb2wtc2lkZWJhci1saWdodFwiKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lkZWJhci5yZW1vdmVDbGFzcyhcImNvbnRyb2wtc2lkZWJhci1saWdodFwiKVxuICAgICAgICBzaWRlYmFyLmFkZENsYXNzKFwiY29udHJvbC1zaWRlYmFyLWRhcmtcIilcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICQoXCJbZGF0YS1lbmFibGU9J2V4cGFuZE9uSG92ZXInXVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKHRoaXMpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICBBZG1pbkxURS5wdXNoTWVudS5leHBhbmRPbkhvdmVyKCk7XG4gICAgICBpZiAoISQoJ2JvZHknKS5oYXNDbGFzcygnc2lkZWJhci1jb2xsYXBzZScpKVxuICAgICAgICAkKFwiW2RhdGEtbGF5b3V0PSdzaWRlYmFyLWNvbGxhcHNlJ11cIikuY2xpY2soKTtcbiAgICB9KTtcblxuICAgIC8vIFJlc2V0IG9wdGlvbnNcbiAgICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAkKFwiW2RhdGEtbGF5b3V0PSdmaXhlZCddXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cbiAgICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKCdsYXlvdXQtYm94ZWQnKSkge1xuICAgICAgJChcIltkYXRhLWxheW91dD0nbGF5b3V0LWJveGVkJ11cIikuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgfVxuICAgIGlmICgkKCdib2R5JykuaGFzQ2xhc3MoJ3NpZGViYXItY29sbGFwc2UnKSkge1xuICAgICAgJChcIltkYXRhLWxheW91dD0nc2lkZWJhci1jb2xsYXBzZSddXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cbiAgfVxuXG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIC0gSW5pdGlhbGl6ZSB0aGUgQWRtaW5MVEUgT2JqZWN0IC1cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIEFsbCBBZG1pbkxURSBmdW5jdGlvbnMgYXJlIGltcGxlbWVudGVkIGJlbG93LlxuICovXG5mdW5jdGlvbiBfaW5pdCgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvKiBMYXlvdXRcbiAgICogPT09PT09XG4gICAqIEZpeGVzIHRoZSBsYXlvdXQgaGVpZ2h0IGluIGNhc2UgbWluLWhlaWdodCBmYWlscy5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqIEB1c2FnZSAkLkFkbWluTFRFLmxheW91dC5hY3RpdmF0ZSgpXG4gICAqICAgICAgICAkLkFkbWluTFRFLmxheW91dC5maXgoKVxuICAgKiAgICAgICAgJC5BZG1pbkxURS5sYXlvdXQuZml4U2lkZWJhcigpXG4gICAqL1xuICAkLkFkbWluTFRFLmxheW91dCA9IHtcbiAgICBhY3RpdmF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIF90aGlzLmZpeCgpO1xuICAgICAgX3RoaXMuZml4U2lkZWJhcigpO1xuICAgICAgJCgnYm9keSwgaHRtbCwgLndyYXBwZXInKS5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgICAkKHdpbmRvdywgXCIud3JhcHBlclwiKS5yZXNpemUoZnVuY3Rpb24gKCkge1xuICAgICAgICBfdGhpcy5maXgoKTtcbiAgICAgICAgX3RoaXMuZml4U2lkZWJhcigpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBmaXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFJlbW92ZSBvdmVyZmxvdyBmcm9tIC53cmFwcGVyIGlmIGxheW91dC1ib3hlZCBleGlzdHNcbiAgICAgICQoXCIubGF5b3V0LWJveGVkID4gLndyYXBwZXJcIikuY3NzKCdvdmVyZmxvdycsICdoaWRkZW4nKTtcbiAgICAgIC8vR2V0IHdpbmRvdyBoZWlnaHQgYW5kIHRoZSB3cmFwcGVyIGhlaWdodFxuICAgICAgdmFyIGZvb3Rlcl9oZWlnaHQgPSAkKCcubWFpbi1mb290ZXInKS5vdXRlckhlaWdodCgpIHx8IDA7XG4gICAgICB2YXIgbmVnID0gJCgnLm1haW4taGVhZGVyJykub3V0ZXJIZWlnaHQoKSArIGZvb3Rlcl9oZWlnaHQ7XG4gICAgICB2YXIgd2luZG93X2hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcbiAgICAgIHZhciBzaWRlYmFyX2hlaWdodCA9ICQoXCIuc2lkZWJhclwiKS5oZWlnaHQoKSB8fCAwO1xuICAgICAgLy9TZXQgdGhlIG1pbi1oZWlnaHQgb2YgdGhlIGNvbnRlbnQgYW5kIHNpZGViYXIgYmFzZWQgb24gdGhlXG4gICAgICAvL3RoZSBoZWlnaHQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgaWYgKCQoXCJib2R5XCIpLmhhc0NsYXNzKFwiZml4ZWRcIikpIHtcbiAgICAgICAgJChcIi5jb250ZW50LXdyYXBwZXIsIC5yaWdodC1zaWRlXCIpLmNzcygnbWluLWhlaWdodCcsIHdpbmRvd19oZWlnaHQgLSBmb290ZXJfaGVpZ2h0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwb3N0U2V0V2lkdGg7XG4gICAgICAgIGlmICh3aW5kb3dfaGVpZ2h0ID49IHNpZGViYXJfaGVpZ2h0KSB7XG4gICAgICAgICAgJChcIi5jb250ZW50LXdyYXBwZXIsIC5yaWdodC1zaWRlXCIpLmNzcygnbWluLWhlaWdodCcsIHdpbmRvd19oZWlnaHQgLSBuZWcpO1xuICAgICAgICAgIHBvc3RTZXRXaWR0aCA9IHdpbmRvd19oZWlnaHQgLSBuZWc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJChcIi5jb250ZW50LXdyYXBwZXIsIC5yaWdodC1zaWRlXCIpLmNzcygnbWluLWhlaWdodCcsIHNpZGViYXJfaGVpZ2h0KTtcbiAgICAgICAgICBwb3N0U2V0V2lkdGggPSBzaWRlYmFyX2hlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vRml4IGZvciB0aGUgY29udHJvbCBzaWRlYmFyIGhlaWdodFxuICAgICAgICB2YXIgY29udHJvbFNpZGViYXIgPSAkKCQuQWRtaW5MVEUub3B0aW9ucy5jb250cm9sU2lkZWJhck9wdGlvbnMuc2VsZWN0b3IpO1xuICAgICAgICBpZiAodHlwZW9mIGNvbnRyb2xTaWRlYmFyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgaWYgKGNvbnRyb2xTaWRlYmFyLmhlaWdodCgpID4gcG9zdFNldFdpZHRoKVxuICAgICAgICAgICAgJChcIi5jb250ZW50LXdyYXBwZXIsIC5yaWdodC1zaWRlXCIpLmNzcygnbWluLWhlaWdodCcsIGNvbnRyb2xTaWRlYmFyLmhlaWdodCgpKTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfSxcbiAgICBmaXhTaWRlYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvL01ha2Ugc3VyZSB0aGUgYm9keSB0YWcgaGFzIHRoZSAuZml4ZWQgY2xhc3NcbiAgICAgIGlmICghJChcImJvZHlcIikuaGFzQ2xhc3MoXCJmaXhlZFwiKSkge1xuICAgICAgICBpZiAodHlwZW9mICQuZm4uc2xpbVNjcm9sbCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICQoXCIuc2lkZWJhclwiKS5zbGltU2Nyb2xsKHtkZXN0cm95OiB0cnVlfSkuaGVpZ2h0KFwiYXV0b1wiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiAkLmZuLnNsaW1TY3JvbGwgPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUpIHtcbiAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IoXCJFcnJvcjogdGhlIGZpeGVkIGxheW91dCByZXF1aXJlcyB0aGUgc2xpbXNjcm9sbCBwbHVnaW4hXCIpO1xuICAgICAgfVxuICAgICAgLy9FbmFibGUgc2xpbXNjcm9sbCBmb3IgZml4ZWQgbGF5b3V0XG4gICAgICBpZiAoJC5BZG1pbkxURS5vcHRpb25zLnNpZGViYXJTbGltU2Nyb2xsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgJC5mbi5zbGltU2Nyb2xsICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgLy9EZXN0cm95IGlmIGl0IGV4aXN0c1xuICAgICAgICAgICQoXCIuc2lkZWJhclwiKS5zbGltU2Nyb2xsKHtkZXN0cm95OiB0cnVlfSkuaGVpZ2h0KFwiYXV0b1wiKTtcbiAgICAgICAgICAvL0FkZCBzbGltc2Nyb2xsXG4gICAgICAgICAgJChcIi5zaWRlYmFyXCIpLnNsaW1TY3JvbGwoe1xuICAgICAgICAgICAgaGVpZ2h0OiAoJCh3aW5kb3cpLmhlaWdodCgpIC0gJChcIi5tYWluLWhlYWRlclwiKS5oZWlnaHQoKSkgKyBcInB4XCIsXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2JhKDAsMCwwLDAuMilcIixcbiAgICAgICAgICAgIHNpemU6IFwiM3B4XCJcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKiBQdXNoTWVudSgpXG4gICAqID09PT09PT09PT1cbiAgICogQWRkcyB0aGUgcHVzaCBtZW51IGZ1bmN0aW9uYWxpdHkgdG8gdGhlIHNpZGViYXIuXG4gICAqXG4gICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAqIEB1c2FnZTogJC5BZG1pbkxURS5wdXNoTWVudShcIltkYXRhLXRvZ2dsZT0nb2ZmY2FudmFzJ11cIilcbiAgICovXG4gICQuQWRtaW5MVEUucHVzaE1lbnUgPSB7XG4gICAgYWN0aXZhdGU6IGZ1bmN0aW9uICh0b2dnbGVCdG4pIHtcbiAgICAgIC8vR2V0IHRoZSBzY3JlZW4gc2l6ZXNcbiAgICAgIHZhciBzY3JlZW5TaXplcyA9ICQuQWRtaW5MVEUub3B0aW9ucy5zY3JlZW5TaXplcztcblxuICAgICAgLy9FbmFibGUgc2lkZWJhciB0b2dnbGVcbiAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIHRvZ2dsZUJ0biwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vRW5hYmxlIHNpZGViYXIgcHVzaCBtZW51XG4gICAgICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSA+IChzY3JlZW5TaXplcy5zbSAtIDEpKSB7XG4gICAgICAgICAgaWYgKCQoXCJib2R5XCIpLmhhc0NsYXNzKCdzaWRlYmFyLWNvbGxhcHNlJykpIHtcbiAgICAgICAgICAgICQoXCJib2R5XCIpLnJlbW92ZUNsYXNzKCdzaWRlYmFyLWNvbGxhcHNlJykudHJpZ2dlcignZXhwYW5kZWQucHVzaE1lbnUnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChcImJvZHlcIikuYWRkQ2xhc3MoJ3NpZGViYXItY29sbGFwc2UnKS50cmlnZ2VyKCdjb2xsYXBzZWQucHVzaE1lbnUnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9IYW5kbGUgc2lkZWJhciBwdXNoIG1lbnUgZm9yIHNtYWxsIHNjcmVlbnNcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKCQoXCJib2R5XCIpLmhhc0NsYXNzKCdzaWRlYmFyLW9wZW4nKSkge1xuICAgICAgICAgICAgJChcImJvZHlcIikucmVtb3ZlQ2xhc3MoJ3NpZGViYXItb3BlbicpLnJlbW92ZUNsYXNzKCdzaWRlYmFyLWNvbGxhcHNlJykudHJpZ2dlcignY29sbGFwc2VkLnB1c2hNZW51Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCJib2R5XCIpLmFkZENsYXNzKCdzaWRlYmFyLW9wZW4nKS50cmlnZ2VyKCdleHBhbmRlZC5wdXNoTWVudScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgICQoXCIuY29udGVudC13cmFwcGVyXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9FbmFibGUgaGlkZSBtZW51IHdoZW4gY2xpY2tpbmcgb24gdGhlIGNvbnRlbnQtd3JhcHBlciBvbiBzbWFsbCBzY3JlZW5zXG4gICAgICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSA8PSAoc2NyZWVuU2l6ZXMuc20gLSAxKSAmJiAkKFwiYm9keVwiKS5oYXNDbGFzcyhcInNpZGViYXItb3BlblwiKSkge1xuICAgICAgICAgICQoXCJib2R5XCIpLnJlbW92ZUNsYXNzKCdzaWRlYmFyLW9wZW4nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vRW5hYmxlIGV4cGFuZCBvbiBob3ZlciBmb3Igc2lkZWJhciBtaW5pXG4gICAgICBpZiAoJC5BZG1pbkxURS5vcHRpb25zLnNpZGViYXJFeHBhbmRPbkhvdmVyXG4gICAgICAgIHx8ICgkKCdib2R5JykuaGFzQ2xhc3MoJ2ZpeGVkJylcbiAgICAgICAgJiYgJCgnYm9keScpLmhhc0NsYXNzKCdzaWRlYmFyLW1pbmknKSkpIHtcbiAgICAgICAgdGhpcy5leHBhbmRPbkhvdmVyKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBleHBhbmRPbkhvdmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgdmFyIHNjcmVlbldpZHRoID0gJC5BZG1pbkxURS5vcHRpb25zLnNjcmVlblNpemVzLnNtIC0gMTtcbiAgICAgIC8vRXhwYW5kIHNpZGViYXIgb24gaG92ZXJcbiAgICAgICQoJy5tYWluLXNpZGViYXInKS5ob3ZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKCdib2R5JykuaGFzQ2xhc3MoJ3NpZGViYXItbWluaScpXG4gICAgICAgICAgJiYgJChcImJvZHlcIikuaGFzQ2xhc3MoJ3NpZGViYXItY29sbGFwc2UnKVxuICAgICAgICAgICYmICQod2luZG93KS53aWR0aCgpID4gc2NyZWVuV2lkdGgpIHtcbiAgICAgICAgICBfdGhpcy5leHBhbmQoKTtcbiAgICAgICAgfVxuICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKCdzaWRlYmFyLW1pbmknKVxuICAgICAgICAgICYmICQoJ2JvZHknKS5oYXNDbGFzcygnc2lkZWJhci1leHBhbmRlZC1vbi1ob3ZlcicpXG4gICAgICAgICAgJiYgJCh3aW5kb3cpLndpZHRoKCkgPiBzY3JlZW5XaWR0aCkge1xuICAgICAgICAgIF90aGlzLmNvbGxhcHNlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZXhwYW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKFwiYm9keVwiKS5yZW1vdmVDbGFzcygnc2lkZWJhci1jb2xsYXBzZScpLmFkZENsYXNzKCdzaWRlYmFyLWV4cGFuZGVkLW9uLWhvdmVyJyk7XG4gICAgfSxcbiAgICBjb2xsYXBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCQoJ2JvZHknKS5oYXNDbGFzcygnc2lkZWJhci1leHBhbmRlZC1vbi1ob3ZlcicpKSB7XG4gICAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnc2lkZWJhci1leHBhbmRlZC1vbi1ob3ZlcicpLmFkZENsYXNzKCdzaWRlYmFyLWNvbGxhcHNlJyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qIFRyZWUoKVxuICAgKiA9PT09PT1cbiAgICogQ29udmVydHMgdGhlIHNpZGViYXIgaW50byBhIG11bHRpbGV2ZWxcbiAgICogdHJlZSB2aWV3IG1lbnUuXG4gICAqXG4gICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAqIEBVc2FnZTogJC5BZG1pbkxURS50cmVlKCcuc2lkZWJhcicpXG4gICAqL1xuICAkLkFkbWluTFRFLnRyZWUgPSBmdW5jdGlvbiAobWVudSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGFuaW1hdGlvblNwZWVkID0gJC5BZG1pbkxURS5vcHRpb25zLmFuaW1hdGlvblNwZWVkO1xuICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2snLCBtZW51ICsgJyBsaSBhJylcbiAgICAgIC5vbignY2xpY2snLCBtZW51ICsgJyBsaSBhJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgLy9HZXQgdGhlIGNsaWNrZWQgbGluayBhbmQgdGhlIG5leHQgZWxlbWVudFxuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgY2hlY2tFbGVtZW50ID0gJHRoaXMubmV4dCgpO1xuXG4gICAgICAgIC8vQ2hlY2sgaWYgdGhlIG5leHQgZWxlbWVudCBpcyBhIG1lbnUgYW5kIGlzIHZpc2libGVcbiAgICAgICAgaWYgKChjaGVja0VsZW1lbnQuaXMoJy50cmVldmlldy1tZW51JykpICYmIChjaGVja0VsZW1lbnQuaXMoJzp2aXNpYmxlJykpICYmICghJCgnYm9keScpLmhhc0NsYXNzKCdzaWRlYmFyLWNvbGxhcHNlJykpKSB7XG4gICAgICAgICAgLy9DbG9zZSB0aGUgbWVudVxuICAgICAgICAgIGNoZWNrRWxlbWVudC5zbGlkZVVwKGFuaW1hdGlvblNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaGVja0VsZW1lbnQucmVtb3ZlQ2xhc3MoJ21lbnUtb3BlbicpO1xuICAgICAgICAgICAgLy9GaXggdGhlIGxheW91dCBpbiBjYXNlIHRoZSBzaWRlYmFyIHN0cmV0Y2hlcyBvdmVyIHRoZSBoZWlnaHQgb2YgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy9fdGhpcy5sYXlvdXQuZml4KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY2hlY2tFbGVtZW50LnBhcmVudChcImxpXCIpLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vSWYgdGhlIG1lbnUgaXMgbm90IHZpc2libGVcbiAgICAgICAgZWxzZSBpZiAoKGNoZWNrRWxlbWVudC5pcygnLnRyZWV2aWV3LW1lbnUnKSkgJiYgKCFjaGVja0VsZW1lbnQuaXMoJzp2aXNpYmxlJykpKSB7XG4gICAgICAgICAgLy9HZXQgdGhlIHBhcmVudCBtZW51XG4gICAgICAgICAgdmFyIHBhcmVudCA9ICR0aGlzLnBhcmVudHMoJ3VsJykuZmlyc3QoKTtcbiAgICAgICAgICAvL0Nsb3NlIGFsbCBvcGVuIG1lbnVzIHdpdGhpbiB0aGUgcGFyZW50XG4gICAgICAgICAgdmFyIHVsID0gcGFyZW50LmZpbmQoJ3VsOnZpc2libGUnKS5zbGlkZVVwKGFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgICAvL1JlbW92ZSB0aGUgbWVudS1vcGVuIGNsYXNzIGZyb20gdGhlIHBhcmVudFxuICAgICAgICAgIHVsLnJlbW92ZUNsYXNzKCdtZW51LW9wZW4nKTtcbiAgICAgICAgICAvL0dldCB0aGUgcGFyZW50IGxpXG4gICAgICAgICAgdmFyIHBhcmVudF9saSA9ICR0aGlzLnBhcmVudChcImxpXCIpO1xuXG4gICAgICAgICAgLy9PcGVuIHRoZSB0YXJnZXQgbWVudSBhbmQgYWRkIHRoZSBtZW51LW9wZW4gY2xhc3NcbiAgICAgICAgICBjaGVja0VsZW1lbnQuc2xpZGVEb3duKGFuaW1hdGlvblNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL0FkZCB0aGUgY2xhc3MgYWN0aXZlIHRvIHRoZSBwYXJlbnQgbGlcbiAgICAgICAgICAgIGNoZWNrRWxlbWVudC5hZGRDbGFzcygnbWVudS1vcGVuJyk7XG4gICAgICAgICAgICBwYXJlbnQuZmluZCgnbGkuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgcGFyZW50X2xpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIC8vRml4IHRoZSBsYXlvdXQgaW4gY2FzZSB0aGUgc2lkZWJhciBzdHJldGNoZXMgb3ZlciB0aGUgaGVpZ2h0IG9mIHRoZSB3aW5kb3dcbiAgICAgICAgICAgIF90aGlzLmxheW91dC5maXgoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2lmIHRoaXMgaXNuJ3QgYSBsaW5rLCBwcmV2ZW50IHRoZSBwYWdlIGZyb20gYmVpbmcgcmVkaXJlY3RlZFxuICAgICAgICBpZiAoY2hlY2tFbGVtZW50LmlzKCcudHJlZXZpZXctbWVudScpKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcblxuICAvKiBDb250cm9sU2lkZWJhclxuICAgKiA9PT09PT09PT09PT09PVxuICAgKiBBZGRzIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIHJpZ2h0IHNpZGViYXJcbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqIEB1c2FnZSAkLkFkbWluTFRFLmNvbnRyb2xTaWRlYmFyLmFjdGl2YXRlKG9wdGlvbnMpXG4gICAqL1xuICAkLkFkbWluTFRFLmNvbnRyb2xTaWRlYmFyID0ge1xuICAgIC8vaW5zdGFudGlhdGUgdGhlIG9iamVjdFxuICAgIGFjdGl2YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvL0dldCB0aGUgb2JqZWN0XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgLy9VcGRhdGUgb3B0aW9uc1xuICAgICAgdmFyIG8gPSAkLkFkbWluTFRFLm9wdGlvbnMuY29udHJvbFNpZGViYXJPcHRpb25zO1xuICAgICAgLy9HZXQgdGhlIHNpZGViYXJcbiAgICAgIHZhciBzaWRlYmFyID0gJChvLnNlbGVjdG9yKTtcbiAgICAgIC8vVGhlIHRvZ2dsZSBidXR0b25cbiAgICAgIHZhciBidG4gPSAkKG8udG9nZ2xlQnRuU2VsZWN0b3IpO1xuXG4gICAgICAvL0xpc3RlbiB0byB0aGUgY2xpY2sgZXZlbnRcbiAgICAgIGJ0bi5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vSWYgdGhlIHNpZGViYXIgaXMgbm90IG9wZW5cbiAgICAgICAgaWYgKCFzaWRlYmFyLmhhc0NsYXNzKCdjb250cm9sLXNpZGViYXItb3BlbicpXG4gICAgICAgICAgJiYgISQoJ2JvZHknKS5oYXNDbGFzcygnY29udHJvbC1zaWRlYmFyLW9wZW4nKSkge1xuICAgICAgICAgIC8vT3BlbiB0aGUgc2lkZWJhclxuICAgICAgICAgIF90aGlzLm9wZW4oc2lkZWJhciwgby5zbGlkZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3RoaXMuY2xvc2Uoc2lkZWJhciwgby5zbGlkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvL0lmIHRoZSBib2R5IGhhcyBhIGJveGVkIGxheW91dCwgZml4IHRoZSBzaWRlYmFyIGJnIHBvc2l0aW9uXG4gICAgICB2YXIgYmcgPSAkKFwiLmNvbnRyb2wtc2lkZWJhci1iZ1wiKTtcbiAgICAgIF90aGlzLl9maXgoYmcpO1xuXG4gICAgICAvL0lmIHRoZSBib2R5IGhhcyBhIGZpeGVkIGxheW91dCwgbWFrZSB0aGUgY29udHJvbCBzaWRlYmFyIGZpeGVkXG4gICAgICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgIF90aGlzLl9maXhGb3JGaXhlZChzaWRlYmFyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vSWYgdGhlIGNvbnRlbnQgaGVpZ2h0IGlzIGxlc3MgdGhhbiB0aGUgc2lkZWJhcidzIGhlaWdodCwgZm9yY2UgbWF4IGhlaWdodFxuICAgICAgICBpZiAoJCgnLmNvbnRlbnQtd3JhcHBlciwgLnJpZ2h0LXNpZGUnKS5oZWlnaHQoKSA8IHNpZGViYXIuaGVpZ2h0KCkpIHtcbiAgICAgICAgICBfdGhpcy5fZml4Rm9yQ29udGVudChzaWRlYmFyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgLy9PcGVuIHRoZSBjb250cm9sIHNpZGViYXJcbiAgICBvcGVuOiBmdW5jdGlvbiAoc2lkZWJhciwgc2xpZGUpIHtcbiAgICAgIC8vU2xpZGUgb3ZlciBjb250ZW50XG4gICAgICBpZiAoc2xpZGUpIHtcbiAgICAgICAgc2lkZWJhci5hZGRDbGFzcygnY29udHJvbC1zaWRlYmFyLW9wZW4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vUHVzaCB0aGUgY29udGVudCBieSBhZGRpbmcgdGhlIG9wZW4gY2xhc3MgdG8gdGhlIGJvZHkgaW5zdGVhZFxuICAgICAgICAvL29mIHRoZSBzaWRlYmFyIGl0c2VsZlxuICAgICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2NvbnRyb2wtc2lkZWJhci1vcGVuJyk7XG4gICAgICB9XG4gICAgfSxcbiAgICAvL0Nsb3NlIHRoZSBjb250cm9sIHNpZGViYXJcbiAgICBjbG9zZTogZnVuY3Rpb24gKHNpZGViYXIsIHNsaWRlKSB7XG4gICAgICBpZiAoc2xpZGUpIHtcbiAgICAgICAgc2lkZWJhci5yZW1vdmVDbGFzcygnY29udHJvbC1zaWRlYmFyLW9wZW4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnY29udHJvbC1zaWRlYmFyLW9wZW4nKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIF9maXg6IGZ1bmN0aW9uIChzaWRlYmFyKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKCQoXCJib2R5XCIpLmhhc0NsYXNzKCdsYXlvdXQtYm94ZWQnKSkge1xuICAgICAgICBzaWRlYmFyLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcbiAgICAgICAgc2lkZWJhci5oZWlnaHQoJChcIi53cmFwcGVyXCIpLmhlaWdodCgpKTtcbiAgICAgICAgaWYgKF90aGlzLmhhc0JpbmRlZFJlc2l6ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBfdGhpcy5fZml4KHNpZGViYXIpO1xuICAgICAgICB9KTtcbiAgICAgICAgX3RoaXMuaGFzQmluZGVkUmVzaXplID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpZGViYXIuY3NzKHtcbiAgICAgICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxuICAgICAgICAgICdoZWlnaHQnOiAnYXV0bydcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfZml4Rm9yRml4ZWQ6IGZ1bmN0aW9uIChzaWRlYmFyKSB7XG4gICAgICBzaWRlYmFyLmNzcyh7XG4gICAgICAgICdwb3NpdGlvbic6ICdmaXhlZCcsXG4gICAgICAgICdtYXgtaGVpZ2h0JzogJzEwMCUnLFxuICAgICAgICAnb3ZlcmZsb3cnOiAnYXV0bycsXG4gICAgICAgICdwYWRkaW5nLWJvdHRvbSc6ICc1MHB4J1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBfZml4Rm9yQ29udGVudDogZnVuY3Rpb24gKHNpZGViYXIpIHtcbiAgICAgICQoXCIuY29udGVudC13cmFwcGVyLCAucmlnaHQtc2lkZVwiKS5jc3MoJ21pbi1oZWlnaHQnLCBzaWRlYmFyLmhlaWdodCgpKTtcbiAgICB9XG4gIH07XG5cbiAgLyogQm94V2lkZ2V0XG4gICAqID09PT09PT09PVxuICAgKiBCb3hXaWRnZXQgaXMgYSBwbHVnaW4gdG8gaGFuZGxlIGNvbGxhcHNpbmcgYW5kXG4gICAqIHJlbW92aW5nIGJveGVzIGZyb20gdGhlIHNjcmVlbi5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqIEB1c2FnZSAkLkFkbWluTFRFLmJveFdpZGdldC5hY3RpdmF0ZSgpXG4gICAqICAgICAgICBTZXQgYWxsIHlvdXIgb3B0aW9ucyBpbiB0aGUgbWFpbiAkLkFkbWluTFRFLm9wdGlvbnMgb2JqZWN0XG4gICAqL1xuICAkLkFkbWluTFRFLmJveFdpZGdldCA9IHtcbiAgICBzZWxlY3RvcnM6ICQuQWRtaW5MVEUub3B0aW9ucy5ib3hXaWRnZXRPcHRpb25zLmJveFdpZGdldFNlbGVjdG9ycyxcbiAgICBpY29uczogJC5BZG1pbkxURS5vcHRpb25zLmJveFdpZGdldE9wdGlvbnMuYm94V2lkZ2V0SWNvbnMsXG4gICAgYW5pbWF0aW9uU3BlZWQ6ICQuQWRtaW5MVEUub3B0aW9ucy5hbmltYXRpb25TcGVlZCxcbiAgICBhY3RpdmF0ZTogZnVuY3Rpb24gKF9ib3gpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoIV9ib3gpIHtcbiAgICAgICAgX2JveCA9IGRvY3VtZW50OyAvLyBhY3RpdmF0ZSBhbGwgYm94ZXMgcGVyIGRlZmF1bHRcbiAgICAgIH1cbiAgICAgIC8vTGlzdGVuIGZvciBjb2xsYXBzZSBldmVudCB0cmlnZ2Vyc1xuICAgICAgJChfYm94KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuY29sbGFwc2UsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgX3RoaXMuY29sbGFwc2UoJCh0aGlzKSk7XG4gICAgICB9KTtcblxuICAgICAgLy9MaXN0ZW4gZm9yIHJlbW92ZSBldmVudCB0cmlnZ2Vyc1xuICAgICAgJChfYm94KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMucmVtb3ZlLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIF90aGlzLnJlbW92ZSgkKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29sbGFwc2U6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgLy9GaW5kIHRoZSBib3ggcGFyZW50XG4gICAgICB2YXIgYm94ID0gZWxlbWVudC5wYXJlbnRzKFwiLmJveFwiKS5maXJzdCgpO1xuICAgICAgLy9GaW5kIHRoZSBib2R5IGFuZCB0aGUgZm9vdGVyXG4gICAgICB2YXIgYm94X2NvbnRlbnQgPSBib3guZmluZChcIj4gLmJveC1ib2R5LCA+IC5ib3gtZm9vdGVyLCA+IGZvcm0gID4uYm94LWJvZHksID4gZm9ybSA+IC5ib3gtZm9vdGVyXCIpO1xuICAgICAgaWYgKCFib3guaGFzQ2xhc3MoXCJjb2xsYXBzZWQtYm94XCIpKSB7XG4gICAgICAgIC8vQ29udmVydCBtaW51cyBpbnRvIHBsdXNcbiAgICAgICAgZWxlbWVudC5jaGlsZHJlbihcIjpmaXJzdFwiKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcyhfdGhpcy5pY29ucy5jb2xsYXBzZSlcbiAgICAgICAgICAuYWRkQ2xhc3MoX3RoaXMuaWNvbnMub3Blbik7XG4gICAgICAgIC8vSGlkZSB0aGUgY29udGVudFxuICAgICAgICBib3hfY29udGVudC5zbGlkZVVwKF90aGlzLmFuaW1hdGlvblNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYm94LmFkZENsYXNzKFwiY29sbGFwc2VkLWJveFwiKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL0NvbnZlcnQgcGx1cyBpbnRvIG1pbnVzXG4gICAgICAgIGVsZW1lbnQuY2hpbGRyZW4oXCI6Zmlyc3RcIilcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoX3RoaXMuaWNvbnMub3BlbilcbiAgICAgICAgICAuYWRkQ2xhc3MoX3RoaXMuaWNvbnMuY29sbGFwc2UpO1xuICAgICAgICAvL1Nob3cgdGhlIGNvbnRlbnRcbiAgICAgICAgYm94X2NvbnRlbnQuc2xpZGVEb3duKF90aGlzLmFuaW1hdGlvblNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYm94LnJlbW92ZUNsYXNzKFwiY29sbGFwc2VkLWJveFwiKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAvL0ZpbmQgdGhlIGJveCBwYXJlbnRcbiAgICAgIHZhciBib3ggPSBlbGVtZW50LnBhcmVudHMoXCIuYm94XCIpLmZpcnN0KCk7XG4gICAgICBib3guc2xpZGVVcCh0aGlzLmFuaW1hdGlvblNwZWVkKTtcbiAgICB9XG4gIH07XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLVxuICogLSBDdXN0b20gUGx1Z2lucyAtXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS1cbiAqIEFsbCBjdXN0b20gcGx1Z2lucyBhcmUgZGVmaW5lZCBiZWxvdy5cbiAqL1xuXG4vKlxuICogQk9YIFJFRlJFU0ggQlVUVE9OXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS1cbiAqIFRoaXMgaXMgYSBjdXN0b20gcGx1Z2luIHRvIHVzZSB3aXRoIHRoZSBjb21wb25lbnQgQk9YLiBJdCBhbGxvd3MgeW91IHRvIGFkZFxuICogYSByZWZyZXNoIGJ1dHRvbiB0byB0aGUgYm94LiBJdCBjb252ZXJ0cyB0aGUgYm94J3Mgc3RhdGUgdG8gYSBsb2FkaW5nIHN0YXRlLlxuICpcbiAqIEB0eXBlIHBsdWdpblxuICogQHVzYWdlICQoXCIjYm94LXdpZGdldFwiKS5ib3hSZWZyZXNoKCBvcHRpb25zICk7XG4gKi9cbihmdW5jdGlvbiAoJCkge1xuXG4gIFwidXNlIHN0cmljdFwiO1xuXG4gICQuZm4uYm94UmVmcmVzaCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICAvLyBSZW5kZXIgb3B0aW9uc1xuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcbiAgICAgIC8vUmVmcmVzaCBidXR0b24gc2VsZWN0b3JcbiAgICAgIHRyaWdnZXI6IFwiLnJlZnJlc2gtYnRuXCIsXG4gICAgICAvL0ZpbGUgc291cmNlIHRvIGJlIGxvYWRlZCAoZS5nOiBhamF4L3NyYy5waHApXG4gICAgICBzb3VyY2U6IFwiXCIsXG4gICAgICAvL0NhbGxiYWNrc1xuICAgICAgb25Mb2FkU3RhcnQ6IGZ1bmN0aW9uIChib3gpIHtcbiAgICAgICAgcmV0dXJuIGJveDtcbiAgICAgIH0sIC8vUmlnaHQgYWZ0ZXIgdGhlIGJ1dHRvbiBoYXMgYmVlbiBjbGlja2VkXG4gICAgICBvbkxvYWREb25lOiBmdW5jdGlvbiAoYm94KSB7XG4gICAgICAgIHJldHVybiBib3g7XG4gICAgICB9IC8vV2hlbiB0aGUgc291cmNlIGhhcyBiZWVuIGxvYWRlZFxuXG4gICAgfSwgb3B0aW9ucyk7XG5cbiAgICAvL1RoZSBvdmVybGF5XG4gICAgdmFyIG92ZXJsYXkgPSAkKCc8ZGl2IGNsYXNzPVwib3ZlcmxheVwiPjxkaXYgY2xhc3M9XCJmYSBmYS1yZWZyZXNoIGZhLXNwaW5cIj48L2Rpdj48L2Rpdj4nKTtcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgLy9pZiBhIHNvdXJjZSBpcyBzcGVjaWZpZWRcbiAgICAgIGlmIChzZXR0aW5ncy5zb3VyY2UgPT09IFwiXCIpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5jb25zb2xlKSB7XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUubG9nKFwiUGxlYXNlIHNwZWNpZnkgYSBzb3VyY2UgZmlyc3QgLSBib3hSZWZyZXNoKClcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy90aGUgYm94XG4gICAgICB2YXIgYm94ID0gJCh0aGlzKTtcbiAgICAgIC8vdGhlIGJ1dHRvblxuICAgICAgdmFyIHJCdG4gPSBib3guZmluZChzZXR0aW5ncy50cmlnZ2VyKS5maXJzdCgpO1xuXG4gICAgICAvL09uIHRyaWdnZXIgY2xpY2tcbiAgICAgIHJCdG4ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvL0FkZCBsb2FkaW5nIG92ZXJsYXlcbiAgICAgICAgc3RhcnQoYm94KTtcblxuICAgICAgICAvL1BlcmZvcm0gYWpheCBjYWxsXG4gICAgICAgIGJveC5maW5kKFwiLmJveC1ib2R5XCIpLmxvYWQoc2V0dGluZ3Muc291cmNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZG9uZShib3gpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gc3RhcnQoYm94KSB7XG4gICAgICAvL0FkZCBvdmVybGF5IGFuZCBsb2FkaW5nIGltZ1xuICAgICAgYm94LmFwcGVuZChvdmVybGF5KTtcblxuICAgICAgc2V0dGluZ3Mub25Mb2FkU3RhcnQuY2FsbChib3gpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvbmUoYm94KSB7XG4gICAgICAvL1JlbW92ZSBvdmVybGF5IGFuZCBsb2FkaW5nIGltZ1xuICAgICAgYm94LmZpbmQob3ZlcmxheSkucmVtb3ZlKCk7XG5cbiAgICAgIHNldHRpbmdzLm9uTG9hZERvbmUuY2FsbChib3gpO1xuICAgIH1cblxuICB9O1xuXG59KShqUXVlcnkpO1xuXG4vKlxuICogRVhQTElDSVQgQk9YIENPTlRST0xTXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogVGhpcyBpcyBhIGN1c3RvbSBwbHVnaW4gdG8gdXNlIHdpdGggdGhlIGNvbXBvbmVudCBCT1guIEl0IGFsbG93cyB5b3UgdG8gYWN0aXZhdGVcbiAqIGEgYm94IGluc2VydGVkIGluIHRoZSBET00gYWZ0ZXIgdGhlIGFwcC5qcyB3YXMgbG9hZGVkLCB0b2dnbGUgYW5kIHJlbW92ZSBib3guXG4gKlxuICogQHR5cGUgcGx1Z2luXG4gKiBAdXNhZ2UgJChcIiNib3gtd2lkZ2V0XCIpLmFjdGl2YXRlQm94KCk7XG4gKiBAdXNhZ2UgJChcIiNib3gtd2lkZ2V0XCIpLnRvZ2dsZUJveCgpO1xuICogQHVzYWdlICQoXCIjYm94LXdpZGdldFwiKS5yZW1vdmVCb3goKTtcbiAqL1xuKGZ1bmN0aW9uICgkKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gICQuZm4uYWN0aXZhdGVCb3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5BZG1pbkxURS5ib3hXaWRnZXQuYWN0aXZhdGUodGhpcyk7XG4gIH07XG5cbiAgJC5mbi50b2dnbGVCb3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJ1dHRvbiA9ICQoJC5BZG1pbkxURS5ib3hXaWRnZXQuc2VsZWN0b3JzLmNvbGxhcHNlLCB0aGlzKTtcbiAgICAkLkFkbWluTFRFLmJveFdpZGdldC5jb2xsYXBzZShidXR0b24pO1xuICB9O1xuXG4gICQuZm4ucmVtb3ZlQm94ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBidXR0b24gPSAkKCQuQWRtaW5MVEUuYm94V2lkZ2V0LnNlbGVjdG9ycy5yZW1vdmUsIHRoaXMpO1xuICAgICQuQWRtaW5MVEUuYm94V2lkZ2V0LnJlbW92ZShidXR0b24pO1xuICB9O1xuXG59KShqUXVlcnkpO1xuXG4vKlxuICogVE9ETyBMSVNUIENVU1RPTSBQTFVHSU5cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBUaGlzIHBsdWdpbiBkZXBlbmRzIG9uIGlDaGVjayBwbHVnaW4gZm9yIGNoZWNrYm94IGFuZCByYWRpbyBpbnB1dHNcbiAqXG4gKiBAdHlwZSBwbHVnaW5cbiAqIEB1c2FnZSAkKFwiI3RvZG8td2lkZ2V0XCIpLnRvZG9saXN0KCBvcHRpb25zICk7XG4gKi9cbihmdW5jdGlvbiAoJCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAkLmZuLnRvZG9saXN0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAvLyBSZW5kZXIgb3B0aW9uc1xuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcbiAgICAgIC8vV2hlbiB0aGUgdXNlciBjaGVja3MgdGhlIGlucHV0XG4gICAgICBvbkNoZWNrOiBmdW5jdGlvbiAoZWxlKSB7XG4gICAgICAgIHJldHVybiBlbGU7XG4gICAgICB9LFxuICAgICAgLy9XaGVuIHRoZSB1c2VyIHVuY2hlY2tzIHRoZSBpbnB1dFxuICAgICAgb25VbmNoZWNrOiBmdW5jdGlvbiAoZWxlKSB7XG4gICAgICAgIHJldHVybiBlbGU7XG4gICAgICB9XG4gICAgfSwgb3B0aW9ucyk7XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcblxuICAgICAgaWYgKHR5cGVvZiAkLmZuLmlDaGVjayAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAkKCdpbnB1dCcsIHRoaXMpLm9uKCdpZkNoZWNrZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGVsZSA9ICQodGhpcykucGFyZW50cyhcImxpXCIpLmZpcnN0KCk7XG4gICAgICAgICAgZWxlLnRvZ2dsZUNsYXNzKFwiZG9uZVwiKTtcbiAgICAgICAgICBzZXR0aW5ncy5vbkNoZWNrLmNhbGwoZWxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnaW5wdXQnLCB0aGlzKS5vbignaWZVbmNoZWNrZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGVsZSA9ICQodGhpcykucGFyZW50cyhcImxpXCIpLmZpcnN0KCk7XG4gICAgICAgICAgZWxlLnRvZ2dsZUNsYXNzKFwiZG9uZVwiKTtcbiAgICAgICAgICBzZXR0aW5ncy5vblVuY2hlY2suY2FsbChlbGUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQoJ2lucHV0JywgdGhpcykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgZWxlID0gJCh0aGlzKS5wYXJlbnRzKFwibGlcIikuZmlyc3QoKTtcbiAgICAgICAgICBlbGUudG9nZ2xlQ2xhc3MoXCJkb25lXCIpO1xuICAgICAgICAgIGlmICgkKCdpbnB1dCcsIGVsZSkuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgICAgc2V0dGluZ3Mub25DaGVjay5jYWxsKGVsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldHRpbmdzLm9uVW5jaGVjay5jYWxsKGVsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0oalF1ZXJ5KSk7XG4iXX0=

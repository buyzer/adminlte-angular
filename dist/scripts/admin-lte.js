function _init(){"use strict";$.AdminLTE.layout={activate:function(){var e=this;e.fix(),e.fixSidebar(),$("body, html, .wrapper").css("height","auto"),$(window,".wrapper").resize(function(){e.fix(),e.fixSidebar()})},fix:function(){$(".layout-boxed > .wrapper").css("overflow","hidden");var e=$(".main-footer").outerHeight()||0,a=$(".main-header").outerHeight()+e,i=$(window).height(),t=$(".sidebar").height()||0;if($("body").hasClass("fixed"))$(".content-wrapper, .right-side").css("min-height",i-e);else{var s;i>=t?($(".content-wrapper, .right-side").css("min-height",i-a),s=i-a):($(".content-wrapper, .right-side").css("min-height",t),s=t);var l=$($.AdminLTE.options.controlSidebarOptions.selector);"undefined"!=typeof l&&l.height()>s&&$(".content-wrapper, .right-side").css("min-height",l.height())}},fixSidebar:function(){return $("body").hasClass("fixed")?("undefined"==typeof $.fn.slimScroll&&window.console&&window.console.error("Error: the fixed layout requires the slimscroll plugin!"),void($.AdminLTE.options.sidebarSlimScroll&&"undefined"!=typeof $.fn.slimScroll&&($(".sidebar").slimScroll({destroy:!0}).height("auto"),$(".sidebar").slimScroll({height:$(window).height()-$(".main-header").height()+"px",color:"rgba(0,0,0,0.2)",size:"3px"})))):void("undefined"!=typeof $.fn.slimScroll&&$(".sidebar").slimScroll({destroy:!0}).height("auto"))}},$.AdminLTE.pushMenu={activate:function(e){var a=$.AdminLTE.options.screenSizes;$(document).on("click",e,function(e){e.preventDefault(),$(window).width()>a.sm-1?$("body").hasClass("sidebar-collapse")?$("body").removeClass("sidebar-collapse").trigger("expanded.pushMenu"):$("body").addClass("sidebar-collapse").trigger("collapsed.pushMenu"):$("body").hasClass("sidebar-open")?$("body").removeClass("sidebar-open").removeClass("sidebar-collapse").trigger("collapsed.pushMenu"):$("body").addClass("sidebar-open").trigger("expanded.pushMenu")}),$(".content-wrapper").click(function(){$(window).width()<=a.sm-1&&$("body").hasClass("sidebar-open")&&$("body").removeClass("sidebar-open")}),($.AdminLTE.options.sidebarExpandOnHover||$("body").hasClass("fixed")&&$("body").hasClass("sidebar-mini"))&&this.expandOnHover()},expandOnHover:function(){var e=this,a=$.AdminLTE.options.screenSizes.sm-1;$(".main-sidebar").hover(function(){$("body").hasClass("sidebar-mini")&&$("body").hasClass("sidebar-collapse")&&$(window).width()>a&&e.expand()},function(){$("body").hasClass("sidebar-mini")&&$("body").hasClass("sidebar-expanded-on-hover")&&$(window).width()>a&&e.collapse()})},expand:function(){$("body").removeClass("sidebar-collapse").addClass("sidebar-expanded-on-hover")},collapse:function(){$("body").hasClass("sidebar-expanded-on-hover")&&$("body").removeClass("sidebar-expanded-on-hover").addClass("sidebar-collapse")}},$.AdminLTE.tree=function(e){var a=this,i=$.AdminLTE.options.animationSpeed;$(document).off("click",e+" li a").on("click",e+" li a",function(e){var t=$(this),s=t.next();if(s.is(".treeview-menu")&&s.is(":visible")&&!$("body").hasClass("sidebar-collapse"))s.slideUp(i,function(){s.removeClass("menu-open")}),s.parent("li").removeClass("active");else if(s.is(".treeview-menu")&&!s.is(":visible")){var l=t.parents("ul").first(),o=l.find("ul:visible").slideUp(i);o.removeClass("menu-open");var n=t.parent("li");s.slideDown(i,function(){s.addClass("menu-open"),l.find("li.active").removeClass("active"),n.addClass("active"),a.layout.fix()})}s.is(".treeview-menu")&&e.preventDefault()})},$.AdminLTE.controlSidebar={activate:function(){var e=this,a=$.AdminLTE.options.controlSidebarOptions,i=$(a.selector),t=$(a.toggleBtnSelector);t.on("click",function(t){t.preventDefault(),i.hasClass("control-sidebar-open")||$("body").hasClass("control-sidebar-open")?e.close(i,a.slide):e.open(i,a.slide)});var s=$(".control-sidebar-bg");e._fix(s),$("body").hasClass("fixed")?e._fixForFixed(i):$(".content-wrapper, .right-side").height()<i.height()&&e._fixForContent(i)},open:function(e,a){a?e.addClass("control-sidebar-open"):$("body").addClass("control-sidebar-open")},close:function(e,a){a?e.removeClass("control-sidebar-open"):$("body").removeClass("control-sidebar-open")},_fix:function(e){var a=this;if($("body").hasClass("layout-boxed")){if(e.css("position","absolute"),e.height($(".wrapper").height()),a.hasBindedResize)return;$(window).resize(function(){a._fix(e)}),a.hasBindedResize=!0}else e.css({position:"fixed",height:"auto"})},_fixForFixed:function(e){e.css({position:"fixed","max-height":"100%",overflow:"auto","padding-bottom":"50px"})},_fixForContent:function(e){$(".content-wrapper, .right-side").css("min-height",e.height())}},$.AdminLTE.boxWidget={selectors:$.AdminLTE.options.boxWidgetOptions.boxWidgetSelectors,icons:$.AdminLTE.options.boxWidgetOptions.boxWidgetIcons,animationSpeed:$.AdminLTE.options.animationSpeed,activate:function(e){var a=this;e||(e=document),$(e).on("click",a.selectors.collapse,function(e){e.preventDefault(),a.collapse($(this))}),$(e).on("click",a.selectors.remove,function(e){e.preventDefault(),a.remove($(this))})},collapse:function(e){var a=this,i=e.parents(".box").first(),t=i.find("> .box-body, > .box-footer, > form  >.box-body, > form > .box-footer");i.hasClass("collapsed-box")?(e.children(":first").removeClass(a.icons.open).addClass(a.icons.collapse),t.slideDown(a.animationSpeed,function(){i.removeClass("collapsed-box")})):(e.children(":first").removeClass(a.icons.collapse).addClass(a.icons.open),t.slideUp(a.animationSpeed,function(){i.addClass("collapsed-box")}))},remove:function(e){var a=e.parents(".box").first();a.slideUp(this.animationSpeed)}}}if("undefined"==typeof jQuery)throw new Error("AdminLTE requires jQuery");$.AdminLTE={},$.AdminLTE.options={navbarMenuSlimscroll:!0,navbarMenuSlimscrollWidth:"3px",navbarMenuHeight:"200px",animationSpeed:500,sidebarToggleSelector:"[data-toggle='offcanvas']",sidebarPushMenu:!0,sidebarSlimScroll:!0,sidebarExpandOnHover:!1,enableBoxRefresh:!0,enableBSToppltip:!0,BSTooltipSelector:"[data-toggle='tooltip']",enableFastclick:!1,enableControlTreeView:!0,enableControlSidebar:!0,controlSidebarOptions:{toggleBtnSelector:"[data-toggle='control-sidebar']",selector:".control-sidebar",slide:!0},enableBoxWidget:!0,boxWidgetOptions:{boxWidgetIcons:{collapse:"fa-minus",open:"fa-plus",remove:"fa-times"},boxWidgetSelectors:{remove:'[data-widget="remove"]',collapse:'[data-widget="collapse"]'}},directChat:{enable:!0,contactToggleSelector:'[data-widget="chat-pane-toggle"]'},colors:{lightBlue:"#3c8dbc",red:"#f56954",green:"#00a65a",aqua:"#00c0ef",yellow:"#f39c12",blue:"#0073b7",navy:"#001F3F",teal:"#39CCCC",olive:"#3D9970",lime:"#01FF70",orange:"#FF851B",fuchsia:"#F012BE",purple:"#8E24AA",maroon:"#D81B60",black:"#222222",gray:"#d2d6de"},screenSizes:{xs:480,sm:768,md:992,lg:1200}},$.AdminLTE.init=function(){"use strict";function e(e){$("body").toggleClass(e),AdminLTE.layout.fixSidebar(),"layout-boxed"==e&&AdminLTE.controlSidebar._fix($(".control-sidebar-bg")),$("body").hasClass("fixed")&&"fixed"==e&&(AdminLTE.pushMenu.expandOnHover(),AdminLTE.layout.activate()),AdminLTE.controlSidebar._fix($(".control-sidebar-bg")),AdminLTE.controlSidebar._fix($(".control-sidebar"))}function a(e){return $.each(o,function(e){$("body").removeClass(o[e])}),$("body").addClass(e),i("skin",e),!1}function i(e,a){"undefined"!=typeof Storage?localStorage.setItem(e,a):window.alert("Please use a modern browser to properly view this template!")}function t(e){return"undefined"!=typeof Storage?localStorage.getItem(e):void window.alert("Please use a modern browser to properly view this template!")}function s(){var i=t("skin");i&&$.inArray(i,o)&&a(i),$("[data-skin]").on("click",function(e){$(this).hasClass("knob")||(e.preventDefault(),a($(this).data("skin")))}),$("[data-layout]").on("click",function(){e($(this).data("layout"))}),$("[data-controlsidebar]").on("click",function(){e($(this).data("controlsidebar"));var a=!AdminLTE.options.controlSidebarOptions.slide;AdminLTE.options.controlSidebarOptions.slide=a,a||$(".control-sidebar").removeClass("control-sidebar-open")}),$("[data-sidebarskin='toggle']").on("click",function(){var e=$(".control-sidebar");e.hasClass("control-sidebar-dark")?(e.removeClass("control-sidebar-dark"),e.addClass("control-sidebar-light")):(e.removeClass("control-sidebar-light"),e.addClass("control-sidebar-dark"))}),$("[data-enable='expandOnHover']").on("click",function(){$(this).attr("disabled",!0),AdminLTE.pushMenu.expandOnHover(),$("body").hasClass("sidebar-collapse")||$("[data-layout='sidebar-collapse']").click()}),$("body").hasClass("fixed")&&$("[data-layout='fixed']").attr("checked","checked"),$("body").hasClass("layout-boxed")&&$("[data-layout='layout-boxed']").attr("checked","checked"),$("body").hasClass("sidebar-collapse")&&$("[data-layout='sidebar-collapse']").attr("checked","checked")}$("body").removeClass("hold-transition"),"undefined"!=typeof AdminLTEOptions&&$.extend(!0,$.AdminLTE.options,AdminLTEOptions);var l=$.AdminLTE.options;_init(),$.AdminLTE.layout.activate(),l.enableControlTreeView&&$.AdminLTE.tree(".sidebar"),l.enableControlSidebar&&$.AdminLTE.controlSidebar.activate(),l.navbarMenuSlimscroll&&"undefined"!=typeof $.fn.slimscroll&&$(".navbar .menu").slimscroll({height:l.navbarMenuHeight,alwaysVisible:!1,size:l.navbarMenuSlimscrollWidth}).css("width","100%"),l.sidebarPushMenu&&$.AdminLTE.pushMenu.activate(l.sidebarToggleSelector),l.enableBSToppltip&&$("body").tooltip({selector:l.BSTooltipSelector,container:"body"}),l.enableBoxWidget&&$.AdminLTE.boxWidget.activate(),l.enableFastclick&&"undefined"!=typeof FastClick&&FastClick.attach(document.body),l.directChat.enable&&$(document).on("click",l.directChat.contactToggleSelector,function(){var e=$(this).parents(".direct-chat").first();e.toggleClass("direct-chat-contacts-open")}),$('.btn-group[data-toggle="btn-toggle"]').each(function(){var e=$(this);$(this).find(".btn").on("click",function(a){e.find(".btn.active").removeClass("active"),$(this).addClass("active"),a.preventDefault()})});var o=["skin-blue","skin-black","skin-red","skin-yellow","skin-purple","skin-green","skin-blue-light","skin-black-light","skin-red-light","skin-yellow-light","skin-purple-light","skin-green-light"],n=$("<div />",{id:"control-sidebar-theme-demo-options-tab",class:"tab-pane active"}),d=$("<li />",{class:"active"}).html("<a href='javascript:void(0)' data-target='#control-sidebar-theme-demo-options-tab' data-toggle='tab'><i class='fa fa-wrench'></i></a>");$("[data-target='#control-sidebar-home-tab']").parent().before(d);var r=$("<div />");r.append("<h4 class='control-sidebar-heading'>Layout Options</h4><div class='form-group'><label class='control-sidebar-subheading'><input type='checkbox' data-layout='fixed' class='pull-right'/> Fixed layout</label><p>Activate the fixed layout. You can't use fixed and boxed layouts together</p></div><div class='form-group'><label class='control-sidebar-subheading'><input type='checkbox' data-layout='layout-boxed'class='pull-right'/> Boxed Layout</label><p>Activate the boxed layout</p></div><div class='form-group'><label class='control-sidebar-subheading'><input type='checkbox' data-layout='sidebar-collapse' class='pull-right'/> Toggle Sidebar</label><p>Toggle the left sidebar's state (open or collapse)</p></div><div class='form-group'><label class='control-sidebar-subheading'><input type='checkbox' data-enable='expandOnHover' class='pull-right'/> Sidebar Expand on Hover</label><p>Let the sidebar mini expand on hover</p></div><div class='form-group'><label class='control-sidebar-subheading'><input type='checkbox' data-controlsidebar='control-sidebar-open' class='pull-right'/> Toggle Right Sidebar Slide</label><p>Toggle between slide over content and push content effects</p></div><div class='form-group'><label class='control-sidebar-subheading'><input type='checkbox' data-sidebarskin='toggle' class='pull-right'/> Toggle Right Sidebar Skin</label><p>Toggle between dark and light skins for the right sidebar</p></div>");var p=$("<ul />",{class:"list-unstyled clearfix"}),c=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-blue' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px; background: #367fa9;'></span><span class='bg-light-blue' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin'>Blue</p>");p.append(c);var h=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-black' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div style='box-shadow: 0 0 2px rgba(0,0,0,0.1)' class='clearfix'><span style='display:block; width: 20%; float: left; height: 7px; background: #fefefe;'></span><span style='display:block; width: 80%; float: left; height: 7px; background: #fefefe;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #222;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin'>Black</p>");p.append(h);var f=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-purple' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-purple-active'></span><span class='bg-purple' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin'>Purple</p>");p.append(f);var b=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-green' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-green-active'></span><span class='bg-green' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin'>Green</p>");p.append(b);var g=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-red' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-red-active'></span><span class='bg-red' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin'>Red</p>");p.append(g);var u=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-yellow' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-yellow-active'></span><span class='bg-yellow' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #222d32;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin'>Yellow</p>");p.append(u);var y=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-blue-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px; background: #367fa9;'></span><span class='bg-light-blue' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin' style='font-size: 12px'>Blue Light</p>");p.append(y);var v=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-black-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div style='box-shadow: 0 0 2px rgba(0,0,0,0.1)' class='clearfix'><span style='display:block; width: 20%; float: left; height: 7px; background: #fefefe;'></span><span style='display:block; width: 80%; float: left; height: 7px; background: #fefefe;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin' style='font-size: 12px'>Black Light</p>");p.append(v);var x=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-purple-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-purple-active'></span><span class='bg-purple' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin' style='font-size: 12px'>Purple Light</p>");p.append(x);var k=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-green-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-green-active'></span><span class='bg-green' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin' style='font-size: 12px'>Green Light</p>");p.append(k);var m=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-red-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-red-active'></span><span class='bg-red' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin' style='font-size: 12px'>Red Light</p>");p.append(m);var w=$("<li />",{style:"float:left; width: 33.33333%; padding: 5px;"}).append("<a href='javascript:void(0);' data-skin='skin-yellow-light' style='display: block; box-shadow: 0 0 3px rgba(0,0,0,0.4)' class='clearfix full-opacity-hover'><div><span style='display:block; width: 20%; float: left; height: 7px;' class='bg-yellow-active'></span><span class='bg-yellow' style='display:block; width: 80%; float: left; height: 7px;'></span></div><div><span style='display:block; width: 20%; float: left; height: 20px; background: #f9fafc;'></span><span style='display:block; width: 80%; float: left; height: 20px; background: #f4f5f7;'></span></div></a><p class='text-center no-margin' style='font-size: 12px;'>Yellow Light</p>");p.append(w),r.append("<h4 class='control-sidebar-heading'>Skins</h4>"),r.append(p),n.append(r),$("#control-sidebar-home-tab").after(n),s()},function(e){"use strict";e.fn.boxRefresh=function(a){function i(e){e.append(l),s.onLoadStart.call(e)}function t(e){e.find(l).remove(),s.onLoadDone.call(e)}var s=e.extend({trigger:".refresh-btn",source:"",onLoadStart:function(e){return e},onLoadDone:function(e){return e}},a),l=e('<div class="overlay"><div class="fa fa-refresh fa-spin"></div></div>');return this.each(function(){if(""===s.source)return void(window.console&&window.console.log("Please specify a source first - boxRefresh()"));var a=e(this),l=a.find(s.trigger).first();l.on("click",function(e){e.preventDefault(),i(a),a.find(".box-body").load(s.source,function(){t(a)})})})}}(jQuery),function(e){"use strict";e.fn.activateBox=function(){e.AdminLTE.boxWidget.activate(this)},e.fn.toggleBox=function(){var a=e(e.AdminLTE.boxWidget.selectors.collapse,this);e.AdminLTE.boxWidget.collapse(a)},e.fn.removeBox=function(){var a=e(e.AdminLTE.boxWidget.selectors.remove,this);e.AdminLTE.boxWidget.remove(a)}}(jQuery),function(e){"use strict";e.fn.todolist=function(a){var i=e.extend({onCheck:function(e){return e},onUncheck:function(e){return e}},a);return this.each(function(){"undefined"!=typeof e.fn.iCheck?(e("input",this).on("ifChecked",function(){var a=e(this).parents("li").first();a.toggleClass("done"),i.onCheck.call(a)}),e("input",this).on("ifUnchecked",function(){var a=e(this).parents("li").first();a.toggleClass("done"),i.onUncheck.call(a)})):e("input",this).on("change",function(){var a=e(this).parents("li").first();a.toggleClass("done"),e("input",a).is(":checked")?i.onCheck.call(a):i.onUncheck.call(a)})})}}(jQuery);
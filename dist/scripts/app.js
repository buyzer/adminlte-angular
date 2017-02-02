var baseApp=angular.module("baseApp",["ui.router","ngAnimate","angular-loading-bar","configRouter"]);baseApp.config(["$stateProvider","$locationProvider",function(e,t){e.state("base",{url:"",templateUrl:"templates/app.html",controller:"ctrlBase"}),t.html5Mode(!0)}]);var configRouter=angular.module("configRouter",["ui.router"]);configRouter.config(["$stateProvider",function(e){e.state("base.dashboard",{url:"/",templateUrl:"templates/dashboard.html",controller:"ctrlDashboard"}),e.state("base.widgets",{url:"/widgets",templateUrl:"templates/widgets.html"}),e.state("base.charts-chartjs",{url:"/charts/chartjs",templateUrl:"templates/charts/chartjs.html",controller:"ctrlChartsChartjs"}),e.state("base.charts-flot",{url:"/charts/flot",templateUrl:"templates/charts/flot.html",controller:"ctrlChartsFlot"}),e.state("base.ui-general",{url:"/ui-element/general",templateUrl:"templates/ui/general.html"}),e.state("base.ui-icons",{url:"/ui-element/icons",templateUrl:"templates/ui/icons.html"}),e.state("base.ui-buttons",{url:"/ui-element/buttons",templateUrl:"templates/ui/buttons.html"}),e.state("base.ui-sliders",{url:"/ui-element/sliders",templateUrl:"templates/ui/sliders.html",controller:"ctrlUiSlider"}),e.state("base.ui-timeline",{url:"/ui-element/timeline",templateUrl:"templates/ui/timeline.html"}),e.state("base.forms-general",{url:"/forms/general",templateUrl:"templates/forms/general.html"}),e.state("base.forms-editors",{url:"/forms/editors",templateUrl:"templates/forms/editors.html",controller:"ctrlFormsEditor"}),e.state("base.forms-advanced",{url:"/forms/advanced",templateUrl:"templates/forms/advanced.html",controller:"ctrlFormsAdvanced"})}]),configRouter.controller("ctrlBase",[function(){angular.element(document).ready(function(){$.AdminLTE.init(),$(".connectedSortable .box-header, .connectedSortable .nav-tabs-custom").css("cursor","move"),$(".connectedSortable").sortable({placeholder:"sort-highlight",connectWith:".connectedSortable",handle:".box-header, .nav-tabs",forcePlaceholderSize:!0,zIndex:999999}),$(".connectedSortable .box-header, .connectedSortable .nav-tabs-custom").css("cursor","move"),$(".todo-list").sortable({placeholder:"sort-highlight",handle:".handle",forcePlaceholderSize:!0,zIndex:999999}),$(".daterange").daterangepicker({ranges:{Today:[moment(),moment()],Yesterday:[moment().subtract(1,"days"),moment().subtract(1,"days")],"Last 7 Days":[moment().subtract(6,"days"),moment()],"Last 30 Days":[moment().subtract(29,"days"),moment()],"This Month":[moment().startOf("month"),moment().endOf("month")],"Last Month":[moment().subtract(1,"month").startOf("month"),moment().subtract(1,"month").endOf("month")]},startDate:moment().subtract(29,"days"),endDate:moment()},function(e,t){window.alert("You chose: "+e.format("MMMM D, YYYY")+" - "+t.format("MMMM D, YYYY"))}),$("#chat-box").slimScroll({height:"250px"}),$("#calendar").datepicker()})}]),configRouter.controller("ctrlChartsChartjs",[function(){angular.element(document).ready(function(){var e=$("#areaChart").get(0).getContext("2d"),t=new Chart(e),a={labels:["January","February","March","April","May","June","July"],datasets:[{label:"Electronics",fillColor:"rgba(210, 214, 222, 1)",strokeColor:"rgba(210, 214, 222, 1)",pointColor:"rgba(210, 214, 222, 1)",pointStrokeColor:"#c1c7d1",pointHighlightFill:"#fff",pointHighlightStroke:"rgba(220,220,220,1)",data:[65,59,80,81,56,55,40]},{label:"Digital Goods",fillColor:"rgba(60,141,188,0.9)",strokeColor:"rgba(60,141,188,0.8)",pointColor:"#3b8bba",pointStrokeColor:"rgba(60,141,188,1)",pointHighlightFill:"#fff",pointHighlightStroke:"rgba(60,141,188,1)",data:[28,48,40,19,86,27,90]}]},o={showScale:!0,scaleShowGridLines:!1,scaleGridLineColor:"rgba(0,0,0,.05)",scaleGridLineWidth:1,scaleShowHorizontalLines:!0,scaleShowVerticalLines:!0,bezierCurve:!0,bezierCurveTension:.3,pointDot:!1,pointDotRadius:4,pointDotStrokeWidth:1,pointHitDetectionRadius:20,datasetStroke:!0,datasetStrokeWidth:2,datasetFill:!0,legendTemplate:'<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].lineColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>',maintainAspectRatio:!0,responsive:!0};t.Line(a,o);var r=$("#lineChart").get(0).getContext("2d"),l=new Chart(r),i=o;i.datasetFill=!1,l.Line(a,i);var n=$("#pieChart").get(0).getContext("2d"),s=new Chart(n),c=[{value:700,color:"#f56954",highlight:"#f56954",label:"Chrome"},{value:500,color:"#00a65a",highlight:"#00a65a",label:"IE"},{value:400,color:"#f39c12",highlight:"#f39c12",label:"FireFox"},{value:600,color:"#00c0ef",highlight:"#00c0ef",label:"Safari"},{value:300,color:"#3c8dbc",highlight:"#3c8dbc",label:"Opera"},{value:100,color:"#d2d6de",highlight:"#d2d6de",label:"Navigator"}],d={segmentShowStroke:!0,segmentStrokeColor:"#fff",segmentStrokeWidth:2,percentageInnerCutout:50,animationSteps:100,animationEasing:"easeOutBounce",animateRotate:!0,animateScale:!1,responsive:!0,maintainAspectRatio:!0,legendTemplate:'<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'};s.Doughnut(c,d);var m=$("#barChart").get(0).getContext("2d"),h=new Chart(m),u=a;u.datasets[1].fillColor="#00a65a",u.datasets[1].strokeColor="#00a65a",u.datasets[1].pointColor="#00a65a";var p={scaleBeginAtZero:!0,scaleShowGridLines:!0,scaleGridLineColor:"rgba(0,0,0,.05)",scaleGridLineWidth:1,scaleShowHorizontalLines:!0,scaleShowVerticalLines:!0,barShowStroke:!0,barStrokeWidth:2,barValueSpacing:5,barDatasetSpacing:1,legendTemplate:'<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>',responsive:!0,maintainAspectRatio:!0};p.datasetFill=!1,h.Bar(u,p)})}]),configRouter.controller("ctrlChartsFlot",[function(){function e(e,t){return'<div style="font-size:13px; text-align:center; padding:2px; color: #fff; font-weight: 600;">'+e+"<br>"+Math.round(t.percent)+"%</div>"}angular.element(document).ready(function(){function t(){for(o.length>0&&(o=o.slice(1));o.length<r;){var e=o.length>0?o[o.length-1]:50,t=e+10*Math.random()-5;t<0?t=0:t>100&&(t=100),o.push(t)}for(var a=[],l=0;l<o.length;++l)a.push([l,o[l]]);return a}function a(){l.setData([t()]),l.draw(),"on"===n&&setTimeout(a,i)}var o=[],r=100,l=$.plot("#interactive",[t()],{grid:{borderColor:"#f3f3f3",borderWidth:1,tickColor:"#f3f3f3"},series:{shadowSize:0,color:"#3c8dbc"},lines:{fill:!0,color:"#3c8dbc"},yaxis:{min:0,max:100,show:!0},xaxis:{show:!0}}),i=500,n="on";"on"===n&&a(),$("#realtime .btn").click(function(){n="on"===$(this).data("toggle")?"on":"off",a()});for(var s=[],c=[],d=0;d<14;d+=.5)s.push([d,Math.sin(d)]),c.push([d,Math.cos(d)]);var m={data:s,color:"#3c8dbc"},h={data:c,color:"#00c0ef"};$.plot("#line-chart",[m,h],{grid:{hoverable:!0,borderColor:"#f3f3f3",borderWidth:1,tickColor:"#f3f3f3"},series:{shadowSize:0,lines:{show:!0},points:{show:!0}},lines:{fill:!1,color:["#3c8dbc","#f56954"]},yaxis:{show:!0},xaxis:{show:!0}}),$('<div class="tooltip-inner" id="line-chart-tooltip"></div>').css({position:"absolute",display:"none",opacity:.8}).appendTo("body"),$("#line-chart").bind("plothover",function(e,t,a){if(a){var o=a.datapoint[0].toFixed(2),r=a.datapoint[1].toFixed(2);$("#line-chart-tooltip").html(a.series.label+" of "+o+" = "+r).css({top:a.pageY+5,left:a.pageX+5}).fadeIn(200)}else $("#line-chart-tooltip").hide()});var u=[[2,88],[3,93.3],[4,102],[5,108.5],[6,115.7],[7,115.6],[8,124.6],[9,130.3],[10,134.3],[11,141.4],[12,146.5],[13,151.7],[14,159.9],[15,165.4],[16,167.8],[17,168.7],[18,169.5],[19,168]];$.plot("#area-chart",[u],{grid:{borderWidth:0},series:{shadowSize:0,color:"#00c0ef"},lines:{fill:!0},yaxis:{show:!1},xaxis:{show:!1}});var p={data:[["January",10],["February",8],["March",4],["April",13],["May",17],["June",9]],color:"#3c8dbc"};$.plot("#bar-chart",[p],{grid:{borderWidth:1,borderColor:"#f3f3f3",tickColor:"#f3f3f3"},series:{bars:{show:!0,barWidth:.5,align:"center"}},xaxis:{mode:"categories",tickLength:0}});var g=[{label:"Series2",data:30,color:"#3c8dbc"},{label:"Series3",data:20,color:"#0073b7"},{label:"Series4",data:50,color:"#00c0ef"}];$.plot("#donut-chart",g,{series:{pie:{show:!0,radius:1,innerRadius:.5,label:{show:!0,radius:2/3,formatter:e,threshold:.1}}},legend:{show:!1}})})}]),baseApp.controller("ctrlDashboard",["$http","$scope","cfpLoadingBar",function(e,t,a){t.test=function(){a.start()},e.get("https://www.reddit.com/r/gaming.json?limit=100&jsonp=angular.callbacks._1").then(function(e){console.log(e)})}]),configRouter.controller("ctrlExample",[function(){angular.element(document).ready(function(){})}]),configRouter.controller("ctrlFormsAdvanced",[function(){angular.element(document).ready(function(){$(".select2").select2(),$("#datemask").inputmask("dd/mm/yyyy",{placeholder:"dd/mm/yyyy"}),$("#datemask2").inputmask("mm/dd/yyyy",{placeholder:"mm/dd/yyyy"}),$("[data-mask]").inputmask(),$("#reservation").daterangepicker(),$("#reservationtime").daterangepicker({timePicker:!0,timePickerIncrement:30,format:"MM/DD/YYYY h:mm A"}),$("#daterange-btn").daterangepicker({ranges:{Today:[moment(),moment()],Yesterday:[moment().subtract(1,"days"),moment().subtract(1,"days")],"Last 7 Days":[moment().subtract(6,"days"),moment()],"Last 30 Days":[moment().subtract(29,"days"),moment()],"This Month":[moment().startOf("month"),moment().endOf("month")],"Last Month":[moment().subtract(1,"month").startOf("month"),moment().subtract(1,"month").endOf("month")]},startDate:moment().subtract(29,"days"),endDate:moment()},function(e,t){$("#daterange-btn span").html(e.format("MMMM D, YYYY")+" - "+t.format("MMMM D, YYYY"))}),$("#datepicker").datepicker({autoclose:!0}),$('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({checkboxClass:"icheckbox_minimal-blue",radioClass:"iradio_minimal-blue"}),$('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({checkboxClass:"icheckbox_minimal-red",radioClass:"iradio_minimal-red"}),$('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({checkboxClass:"icheckbox_flat-green",radioClass:"iradio_flat-green"}),$(".my-colorpicker1").colorpicker(),$(".my-colorpicker2").colorpicker(),$(".timepicker").timepicker({showInputs:!1})})}]),configRouter.controller("ctrlFormsEditor",[function(){angular.element(document).ready(function(){CKEDITOR.replace("editor1"),$(".textarea").wysihtml5()})}]),configRouter.controller("ctrlUiSlider",[function(){angular.element(document).ready(function(){$(".slider").slider()})}]);
var baseApp = angular.module('baseApp' , ['ui.router','ngAnimate','angular-loading-bar','configRouter']); 
baseApp.config(['$stateProvider','$locationProvider',function($stateProvider,$locationProvider){
	$stateProvider.state('base' , {
		url : '',
		templateUrl : 'templates/app.html',
		controller : 'ctrlBase'
	});
	$locationProvider.html5Mode(true);
}]);

var configRouter = angular.module('configRouter' , ['ui.router']);
configRouter.config(['$stateProvider' , function($stateProvider){
	$stateProvider.state('base.dashboard' ,{
		url : '/',
		templateUrl : 'templates/dashboard.html',
		controller : 'ctrlDashboard'
	});
	$stateProvider.state('base.widgets' ,{
		url : '/widgets',
		templateUrl : 'templates/widgets.html'
	});
	// Chart
	$stateProvider.state('base.charts-chartjs' ,{
		url : '/charts/chartjs',
		templateUrl : 'templates/charts/chartjs.html',
		controller : 'ctrlChartsChartjs'
	});
	$stateProvider.state('base.charts-flot' ,{
		url : '/charts/flot',
		templateUrl : 'templates/charts/flot.html',
		controller : 'ctrlChartsFlot'
	});
	// UI Element
	$stateProvider.state('base.ui-general' ,{
		url : '/ui-element/general',
		templateUrl : 'templates/ui/general.html'
	});
	$stateProvider.state('base.ui-icons' ,{
		url : '/ui-element/icons',
		templateUrl : 'templates/ui/icons.html'
	});
	$stateProvider.state('base.ui-buttons' ,{
		url : '/ui-element/buttons',
		templateUrl : 'templates/ui/buttons.html'
	});
	$stateProvider.state('base.ui-sliders' ,{
		url : '/ui-element/sliders',
		templateUrl : 'templates/ui/sliders.html',
		controller : 'ctrlUiSlider'
	});
	$stateProvider.state('base.ui-timeline' ,{
		url : '/ui-element/timeline',
		templateUrl : 'templates/ui/timeline.html'
	});
	// Form Element
	$stateProvider.state('base.forms-general' ,{
		url : '/forms/general',
		templateUrl : 'templates/forms/general.html'
	});
	$stateProvider.state('base.forms-editors' ,{
		url : '/forms/editors',
		templateUrl : 'templates/forms/editors.html',
		controller : 'ctrlFormsEditor'
	});
	$stateProvider.state('base.forms-advanced' ,{
		url : '/forms/advanced',
		templateUrl : 'templates/forms/advanced.html',
		controller : 'ctrlFormsAdvanced'
	});
	// Table
	$stateProvider.state('base.tables-data' ,{
		url : '/tables/data',
		templateUrl : 'templates/tables/data.html',
		controller : 'ctrlTablesData'
	});
	$stateProvider.state('base.tables-simple' ,{
		url : '/tables/simple',
		templateUrl : 'templates/tables/simple.html'
	});
	//Calendar
	$stateProvider.state('base.calendar' ,{
		url : '/calendar',
		templateUrl : 'templates/calendar.html',
		controller : 'ctrlCalendar'
	});
}]);
configRouter.controller('ctrlBase',[function(){
  	angular.element(document).ready(function(){
  		$.AdminLTE.init(); // call admin lte function
		$(".connectedSortable .box-header, .connectedSortable .nav-tabs-custom").css("cursor", "move");

		//jQuery UI sortable for the todo list
		//Make the dashboard widgets sortable Using jquery UI
		$(".connectedSortable").sortable({
			placeholder: "sort-highlight",
			connectWith: ".connectedSortable",
			handle: ".box-header, .nav-tabs",
			forcePlaceholderSize: true,
			zIndex: 999999
		});
		$(".connectedSortable .box-header, .connectedSortable .nav-tabs-custom").css("cursor", "move");

		//jQuery UI sortable for the todo list
		$(".todo-list").sortable({
			placeholder: "sort-highlight",
			handle: ".handle",
			forcePlaceholderSize: true,
			zIndex: 999999
		});

		$('.daterange').daterangepicker({
			ranges: {
			  'Today': [moment(), moment()],
			  'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			  'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			  'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			  'This Month': [moment().startOf('month'), moment().endOf('month')],
			  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
			},
			startDate: moment().subtract(29, 'days'),
			endDate: moment()
			}, function (start, end) {
			window.alert("You chose: " + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
		});
		//The Calender
		//SLIMSCROLL FOR CHAT WIDGET
		$('#chat-box').slimScroll({
		height: '250px'
		});

		$("#calendar").datepicker();

	});

}]);
configRouter.controller('ctrlCalendar',[function(){
  	angular.element(document).ready(function(){
	  	function ini_events(ele) {
	      ele.each(function () {

	        // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
	        // it doesn't need to have a start or end
	        var eventObject = {
	          title: $.trim($(this).text()) // use the element's text as the event title
	        };

	        // store the Event Object in the DOM element so we can get to it later
	        $(this).data('eventObject', eventObject);

	        // make the event draggable using jQuery UI
	        $(this).draggable({
	          zIndex: 1070,
	          revert: true, // will cause the event to go back to its
	          revertDuration: 0  //  original position after the drag
	        });

	      });
	    }

	    ini_events($('#external-events div.external-event'));

	    /* initialize the calendar
	     -----------------------------------------------------------------*/
	    //Date for the calendar events (dummy data)
	    var date = new Date();
	    var d = date.getDate(),
	        m = date.getMonth(),
	        y = date.getFullYear();
	    $('#calendar').fullCalendar({
	      header: {
	        left: 'prev,next today',
	        center: 'title',
	        right: 'month,agendaWeek,agendaDay'
	      },
	      buttonText: {
	        today: 'today',
	        month: 'month',
	        week: 'week',
	        day: 'day'
	      },
	      //Random default events
	      events: [
	        {
	          title: 'All Day Event',
	          start: new Date(y, m, 1),
	          backgroundColor: "#f56954", //red
	          borderColor: "#f56954" //red
	        },
	        {
	          title: 'Long Event',
	          start: new Date(y, m, d - 5),
	          end: new Date(y, m, d - 2),
	          backgroundColor: "#f39c12", //yellow
	          borderColor: "#f39c12" //yellow
	        },
	        {
	          title: 'Meeting',
	          start: new Date(y, m, d, 10, 30),
	          allDay: false,
	          backgroundColor: "#0073b7", //Blue
	          borderColor: "#0073b7" //Blue
	        },
	        {
	          title: 'Lunch',
	          start: new Date(y, m, d, 12, 0),
	          end: new Date(y, m, d, 14, 0),
	          allDay: false,
	          backgroundColor: "#00c0ef", //Info (aqua)
	          borderColor: "#00c0ef" //Info (aqua)
	        },
	        {
	          title: 'Birthday Party',
	          start: new Date(y, m, d + 1, 19, 0),
	          end: new Date(y, m, d + 1, 22, 30),
	          allDay: false,
	          backgroundColor: "#00a65a", //Success (green)
	          borderColor: "#00a65a" //Success (green)
	        },
	        {
	          title: 'Click for Google',
	          start: new Date(y, m, 28),
	          end: new Date(y, m, 29),
	          url: 'http://google.com/',
	          backgroundColor: "#3c8dbc", //Primary (light-blue)
	          borderColor: "#3c8dbc" //Primary (light-blue)
	        }
	      ],
	      editable: true,
	      droppable: true, // this allows things to be dropped onto the calendar !!!
	      drop: function (date, allDay) { // this function is called when something is dropped

	        // retrieve the dropped element's stored Event Object
	        var originalEventObject = $(this).data('eventObject');

	        // we need to copy it, so that multiple events don't have a reference to the same object
	        var copiedEventObject = $.extend({}, originalEventObject);

	        // assign it the date that was reported
	        copiedEventObject.start = date;
	        copiedEventObject.allDay = allDay;
	        copiedEventObject.backgroundColor = $(this).css("background-color");
	        copiedEventObject.borderColor = $(this).css("border-color");

	        // render the event on the calendar
	        // the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
	        $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);

	        // is the "remove after drop" checkbox checked?
	        if ($('#drop-remove').is(':checked')) {
	          // if so, remove the element from the "Draggable Events" list
	          $(this).remove();
	        }

	      }
	    });

	    /* ADDING EVENTS */
	    var currColor = "#3c8dbc"; //Red by default
	    //Color chooser button
	    var colorChooser = $("#color-chooser-btn");
	    $("#color-chooser > li > a").click(function (e) {
	      e.preventDefault();
	      //Save color
	      currColor = $(this).css("color");
	      //Add color effect to button
	      $('#add-new-event').css({"background-color": currColor, "border-color": currColor});
	    });
	    $("#add-new-event").click(function (e) {
	      e.preventDefault();
	      //Get value and make sure it is not null
	      var val = $("#new-event").val();
	      if (val.length == 0) {
	        return;
	      }

	      //Create events
	      var event = $("<div />");
	      event.css({"background-color": currColor, "border-color": currColor, "color": "#fff"}).addClass("external-event");
	      event.html(val);
	      $('#external-events').prepend(event);

	      //Add draggable funtionality
	      ini_events(event);

	      //Remove event from text input
	      $("#new-event").val("");
	    });
	});

}]);
configRouter.controller('ctrlChartsChartjs',[function(){
  	angular.element(document).ready(function(){
  		// Get context with jQuery - using jQuery's .get() method.
	    var areaChartCanvas = $("#areaChart").get(0).getContext("2d");
	    // This will get the first returned node in the jQuery collection.
	    var areaChart = new Chart(areaChartCanvas);

	    var areaChartData = {
	      labels: ["January", "February", "March", "April", "May", "June", "July"],
	      datasets: [
	        {
	          label: "Electronics",
	          fillColor: "rgba(210, 214, 222, 1)",
	          strokeColor: "rgba(210, 214, 222, 1)",
	          pointColor: "rgba(210, 214, 222, 1)",
	          pointStrokeColor: "#c1c7d1",
	          pointHighlightFill: "#fff",
	          pointHighlightStroke: "rgba(220,220,220,1)",
	          data: [65, 59, 80, 81, 56, 55, 40]
	        },
	        {
	          label: "Digital Goods",
	          fillColor: "rgba(60,141,188,0.9)",
	          strokeColor: "rgba(60,141,188,0.8)",
	          pointColor: "#3b8bba",
	          pointStrokeColor: "rgba(60,141,188,1)",
	          pointHighlightFill: "#fff",
	          pointHighlightStroke: "rgba(60,141,188,1)",
	          data: [28, 48, 40, 19, 86, 27, 90]
	        }
	      ]
	    };

	    var areaChartOptions = {
	      //Boolean - If we should show the scale at all
	      showScale: true,
	      //Boolean - Whether grid lines are shown across the chart
	      scaleShowGridLines: false,
	      //String - Colour of the grid lines
	      scaleGridLineColor: "rgba(0,0,0,.05)",
	      //Number - Width of the grid lines
	      scaleGridLineWidth: 1,
	      //Boolean - Whether to show horizontal lines (except X axis)
	      scaleShowHorizontalLines: true,
	      //Boolean - Whether to show vertical lines (except Y axis)
	      scaleShowVerticalLines: true,
	      //Boolean - Whether the line is curved between points
	      bezierCurve: true,
	      //Number - Tension of the bezier curve between points
	      bezierCurveTension: 0.3,
	      //Boolean - Whether to show a dot for each point
	      pointDot: false,
	      //Number - Radius of each point dot in pixels
	      pointDotRadius: 4,
	      //Number - Pixel width of point dot stroke
	      pointDotStrokeWidth: 1,
	      //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
	      pointHitDetectionRadius: 20,
	      //Boolean - Whether to show a stroke for datasets
	      datasetStroke: true,
	      //Number - Pixel width of dataset stroke
	      datasetStrokeWidth: 2,
	      //Boolean - Whether to fill the dataset with a color
	      datasetFill: true,
	      //String - A legend template
	      legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
	      //Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
	      maintainAspectRatio: true,
	      //Boolean - whether to make the chart responsive to window resizing
	      responsive: true
	    };

	    //Create the line chart
	    areaChart.Line(areaChartData, areaChartOptions);

	    //-------------
	    //- LINE CHART -
	    //--------------
	    var lineChartCanvas = $("#lineChart").get(0).getContext("2d");
	    var lineChart = new Chart(lineChartCanvas);
	    var lineChartOptions = areaChartOptions;
	    lineChartOptions.datasetFill = false;
	    lineChart.Line(areaChartData, lineChartOptions);

	    //-------------
	    //- PIE CHART -
	    //-------------
	    // Get context with jQuery - using jQuery's .get() method.
	    var pieChartCanvas = $("#pieChart").get(0).getContext("2d");
	    var pieChart = new Chart(pieChartCanvas);
	    var PieData = [
	      {
	        value: 700,
	        color: "#f56954",
	        highlight: "#f56954",
	        label: "Chrome"
	      },
	      {
	        value: 500,
	        color: "#00a65a",
	        highlight: "#00a65a",
	        label: "IE"
	      },
	      {
	        value: 400,
	        color: "#f39c12",
	        highlight: "#f39c12",
	        label: "FireFox"
	      },
	      {
	        value: 600,
	        color: "#00c0ef",
	        highlight: "#00c0ef",
	        label: "Safari"
	      },
	      {
	        value: 300,
	        color: "#3c8dbc",
	        highlight: "#3c8dbc",
	        label: "Opera"
	      },
	      {
	        value: 100,
	        color: "#d2d6de",
	        highlight: "#d2d6de",
	        label: "Navigator"
	      }
	    ];
	    var pieOptions = {
	      //Boolean - Whether we should show a stroke on each segment
	      segmentShowStroke: true,
	      //String - The colour of each segment stroke
	      segmentStrokeColor: "#fff",
	      //Number - The width of each segment stroke
	      segmentStrokeWidth: 2,
	      //Number - The percentage of the chart that we cut out of the middle
	      percentageInnerCutout: 50, // This is 0 for Pie charts
	      //Number - Amount of animation steps
	      animationSteps: 100,
	      //String - Animation easing effect
	      animationEasing: "easeOutBounce",
	      //Boolean - Whether we animate the rotation of the Doughnut
	      animateRotate: true,
	      //Boolean - Whether we animate scaling the Doughnut from the centre
	      animateScale: false,
	      //Boolean - whether to make the chart responsive to window resizing
	      responsive: true,
	      // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
	      maintainAspectRatio: true,
	      //String - A legend template
	      legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"
	    };
	    //Create pie or douhnut chart
	    // You can switch between pie and douhnut using the method below.
	    pieChart.Doughnut(PieData, pieOptions);

	    //-------------
	    //- BAR CHART -
	    //-------------
	    var barChartCanvas = $("#barChart").get(0).getContext("2d");
	    var barChart = new Chart(barChartCanvas);
	    var barChartData = areaChartData;
	    barChartData.datasets[1].fillColor = "#00a65a";
	    barChartData.datasets[1].strokeColor = "#00a65a";
	    barChartData.datasets[1].pointColor = "#00a65a";
	    var barChartOptions = {
	      //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
	      scaleBeginAtZero: true,
	      //Boolean - Whether grid lines are shown across the chart
	      scaleShowGridLines: true,
	      //String - Colour of the grid lines
	      scaleGridLineColor: "rgba(0,0,0,.05)",
	      //Number - Width of the grid lines
	      scaleGridLineWidth: 1,
	      //Boolean - Whether to show horizontal lines (except X axis)
	      scaleShowHorizontalLines: true,
	      //Boolean - Whether to show vertical lines (except Y axis)
	      scaleShowVerticalLines: true,
	      //Boolean - If there is a stroke on each bar
	      barShowStroke: true,
	      //Number - Pixel width of the bar stroke
	      barStrokeWidth: 2,
	      //Number - Spacing between each of the X value sets
	      barValueSpacing: 5,
	      //Number - Spacing between data sets within X values
	      barDatasetSpacing: 1,
	      //String - A legend template
	      legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
	      //Boolean - whether to make the chart responsive
	      responsive: true,
	      maintainAspectRatio: true
	    };

	    barChartOptions.datasetFill = false;
	    barChart.Bar(barChartData, barChartOptions);
	});
}]);
configRouter.controller('ctrlChartsFlot',[function(){
	// alert('a');
  	angular.element(document).ready(function(){
	    /*
	     * Flot Interactive Chart
	     * -----------------------
	     */
	    // We use an inline data source in the example, usually data would
	    // be fetched from a server
	    var data = [], totalPoints = 100;

	    function getRandomData() {

	      if (data.length > 0)
	        data = data.slice(1);

	      // Do a random walk
	      while (data.length < totalPoints) {

	        var prev = data.length > 0 ? data[data.length - 1] : 50,
	            y = prev + Math.random() * 10 - 5;

	        if (y < 0) {
	          y = 0;
	        } else if (y > 100) {
	          y = 100;
	        }

	        data.push(y);
	      }

	      // Zip the generated y values with the x values
	      var res = [];
	      for (var i = 0; i < data.length; ++i) {
	        res.push([i, data[i]]);
	      }

	      return res;
	    }

	    var interactive_plot = $.plot("#interactive", [getRandomData()], {
	      grid: {
	        borderColor: "#f3f3f3",
	        borderWidth: 1,
	        tickColor: "#f3f3f3"
	      },
	      series: {
	        shadowSize: 0, // Drawing is faster without shadows
	        color: "#3c8dbc"
	      },
	      lines: {
	        fill: true, //Converts the line chart to area chart
	        color: "#3c8dbc"
	      },
	      yaxis: {
	        min: 0,
	        max: 100,
	        show: true
	      },
	      xaxis: {
	        show: true
	      }
	    });

	    var updateInterval = 500; //Fetch data ever x milliseconds
	    var realtime = "on"; //If == to on then fetch data every x seconds. else stop fetching
	    function update() {

	      interactive_plot.setData([getRandomData()]);

	      // Since the axes don't change, we don't need to call plot.setupGrid()
	      interactive_plot.draw();
	      if (realtime === "on")
	        setTimeout(update, updateInterval);
	    }

	    //INITIALIZE REALTIME DATA FETCHING
	    if (realtime === "on") {
	      update();
	    }
	    //REALTIME TOGGLE
	    $("#realtime .btn").click(function () {
	      if ($(this).data("toggle") === "on") {
	        realtime = "on";
	      }
	      else {
	        realtime = "off";
	      }
	      update();
	    });
	    /*
	     * END INTERACTIVE CHART
	     */


	    /*
	     * LINE CHART
	     * ----------
	     */
	    //LINE randomly generated data

	    var sin = [], cos = [];
	    for (var i = 0; i < 14; i += 0.5) {
	      sin.push([i, Math.sin(i)]);
	      cos.push([i, Math.cos(i)]);
	    }
	    var line_data1 = {
	      data: sin,
	      color: "#3c8dbc"
	    };
	    var line_data2 = {
	      data: cos,
	      color: "#00c0ef"
	    };
	    $.plot("#line-chart", [line_data1, line_data2], {
	      grid: {
	        hoverable: true,
	        borderColor: "#f3f3f3",
	        borderWidth: 1,
	        tickColor: "#f3f3f3"
	      },
	      series: {
	        shadowSize: 0,
	        lines: {
	          show: true
	        },
	        points: {
	          show: true
	        }
	      },
	      lines: {
	        fill: false,
	        color: ["#3c8dbc", "#f56954"]
	      },
	      yaxis: {
	        show: true,
	      },
	      xaxis: {
	        show: true
	      }
	    });
	    //Initialize tooltip on hover
	    $('<div class="tooltip-inner" id="line-chart-tooltip"></div>').css({
	      position: "absolute",
	      display: "none",
	      opacity: 0.8
	    }).appendTo("body");
	    $("#line-chart").bind("plothover", function (event, pos, item) {

	      if (item) {
	        var x = item.datapoint[0].toFixed(2),
	            y = item.datapoint[1].toFixed(2);

	        $("#line-chart-tooltip").html(item.series.label + " of " + x + " = " + y)
	            .css({top: item.pageY + 5, left: item.pageX + 5})
	            .fadeIn(200);
	      } else {
	        $("#line-chart-tooltip").hide();
	      }

	    });
	    /* END LINE CHART */

	    /*
	     * FULL WIDTH STATIC AREA CHART
	     * -----------------
	     */
	    var areaData = [[2, 88.0], [3, 93.3], [4, 102.0], [5, 108.5], [6, 115.7], [7, 115.6],
	      [8, 124.6], [9, 130.3], [10, 134.3], [11, 141.4], [12, 146.5], [13, 151.7], [14, 159.9],
	      [15, 165.4], [16, 167.8], [17, 168.7], [18, 169.5], [19, 168.0]];
	    $.plot("#area-chart", [areaData], {
	      grid: {
	        borderWidth: 0
	      },
	      series: {
	        shadowSize: 0, // Drawing is faster without shadows
	        color: "#00c0ef"
	      },
	      lines: {
	        fill: true //Converts the line chart to area chart
	      },
	      yaxis: {
	        show: false
	      },
	      xaxis: {
	        show: false
	      }
	    });

	    /* END AREA CHART */

	    /*
	     * BAR CHART
	     * ---------
	     */

	    var bar_data = {
	      data: [["January", 10], ["February", 8], ["March", 4], ["April", 13], ["May", 17], ["June", 9]],
	      color: "#3c8dbc"
	    };
	    $.plot("#bar-chart", [bar_data], {
	      grid: {
	        borderWidth: 1,
	        borderColor: "#f3f3f3",
	        tickColor: "#f3f3f3"
	      },
	      series: {
	        bars: {
	          show: true,
	          barWidth: 0.5,
	          align: "center"
	        }
	      },
	      xaxis: {
	        mode: "categories",
	        tickLength: 0
	      }
	    });
	    /* END BAR CHART */

	    /*
	     * DONUT CHART
	     * -----------
	     */

	    var donutData = [
	      {label: "Series2", data: 30, color: "#3c8dbc"},
	      {label: "Series3", data: 20, color: "#0073b7"},
	      {label: "Series4", data: 50, color: "#00c0ef"}
	    ];
	    $.plot("#donut-chart", donutData, {
	      series: {
	        pie: {
	          show: true,
	          radius: 1,
	          innerRadius: 0.5,
	          label: {
	            show: true,
	            radius: 2 / 3,
	            formatter: labelFormatter,
	            threshold: 0.1
	          }

	        }
	      },
	      legend: {
	        show: false
	      }
	    });
	    /*
	     * END DONUT CHART
	     */

	});
  	function labelFormatter(label, series) {
    	return '<div style="font-size:13px; text-align:center; padding:2px; color: #fff; font-weight: 600;">'
        + label
        + "<br>"
        + Math.round(series.percent) + "%</div>";
  	}

}]);
baseApp.controller('ctrlDashboard',['$http','$scope','cfpLoadingBar',function($http,$scope,cfpLoadingBar){
	$scope.test = function(){
    	// alert('a')
    	cfpLoadingBar.start()
  	}
  	$http.get("https://www.reddit.com/r/gaming.json?limit=100&jsonp=angular.callbacks._1")
  	.then(function(res){
  		console.log(res)
  	});
  	// console.log('a')
	//Make the dashboard widgets sortable Using jquery UI
  
  
}]);
configRouter.controller('ctrlExample',[function(){
  	angular.element(document).ready(function(){
  	

	});

}]);
configRouter.controller('ctrlFormsAdvanced',[function(){
  angular.element(document).ready(function(){
  	$(".select2").select2();

    //Datemask dd/mm/yyyy
    $("#datemask").inputmask("dd/mm/yyyy", {"placeholder": "dd/mm/yyyy"});
    //Datemask2 mm/dd/yyyy
    $("#datemask2").inputmask("mm/dd/yyyy", {"placeholder": "mm/dd/yyyy"});
    //Money Euro
    $("[data-mask]").inputmask();

    //Date range picker
    $('#reservation').daterangepicker();
    //Date range picker with time picker
    $('#reservationtime').daterangepicker({timePicker: true, timePickerIncrement: 30, format: 'MM/DD/YYYY h:mm A'});
    //Date range as a button
    $('#daterange-btn').daterangepicker(
        {
          ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
          },
          startDate: moment().subtract(29, 'days'),
          endDate: moment()
        },
        function (start, end) {
          $('#daterange-btn span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        }
    );

    //Date picker
    $('#datepicker').datepicker({
      autoclose: true
    });

    //iCheck for checkbox and radio inputs
    $('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
      checkboxClass: 'icheckbox_minimal-blue',
      radioClass: 'iradio_minimal-blue'
    });
    //Red color scheme for iCheck
    $('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({
      checkboxClass: 'icheckbox_minimal-red',
      radioClass: 'iradio_minimal-red'
    });
    //Flat red color scheme for iCheck
    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
      checkboxClass: 'icheckbox_flat-green',
      radioClass: 'iradio_flat-green'
    });

    //Colorpicker
    $(".my-colorpicker1").colorpicker();
    //color picker with addon
    $(".my-colorpicker2").colorpicker();

    //Timepicker
    $(".timepicker").timepicker({
      showInputs: false
    });
	});

}]);
configRouter.controller('ctrlFormsEditor',[function(){
  	angular.element(document).ready(function(){
	  	CKEDITOR.replace('editor1');
	    //bootstrap WYSIHTML5 - text editor
	    $(".textarea").wysihtml5();	
	});

}]);
configRouter.controller('ctrlTablesData',[function(){
  	angular.element(document).ready(function(){
  		$("#example1").DataTable();
	    $('#example2').DataTable({
	      "paging": true,
	      "lengthChange": false,
	      "searching": false,
	      "ordering": true,
	      "info": true,
	      "autoWidth": false
	    });

	});

}]);
configRouter.controller('ctrlUiSlider',[function(){
  	angular.element(document).ready(function(){
    	/* BOOTSTRAP SLIDER */
	    $('.slider').slider();
	});

}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXIuYmFzZS5qcyIsImNvbnRyb2xsZXIuY2FsZW5kYXIuanMiLCJjb250cm9sbGVyLmNoYXJ0cy5jaGFydGpzLmpzIiwiY29udHJvbGxlci5jaGFydHMuZmxvdC5qcyIsImNvbnRyb2xsZXIuZGFzaGJvYXJkLmpzIiwiY29udHJvbGxlci5leGFtcGxlLmpzIiwiY29udHJvbGxlci5mb3Jtcy5hZHZhbmNlZC5qcyIsImNvbnRyb2xsZXIuZm9ybXMuZWRpdG9yLmpzIiwiY29udHJvbGxlci50YWJsZXMuZGF0YS5qcyIsImNvbnRyb2xsZXIudWkuc2xpZGVyLmpzIl0sIm5hbWVzIjpbImJhc2VBcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiaHRtbDVNb2RlIiwiY29uZmlnUm91dGVyIiwiZWxlbWVudCIsImRvY3VtZW50IiwicmVhZHkiLCIkIiwiQWRtaW5MVEUiLCJpbml0IiwiY3NzIiwic29ydGFibGUiLCJwbGFjZWhvbGRlciIsImNvbm5lY3RXaXRoIiwiaGFuZGxlIiwiZm9yY2VQbGFjZWhvbGRlclNpemUiLCJ6SW5kZXgiLCJkYXRlcmFuZ2VwaWNrZXIiLCJyYW5nZXMiLCJUb2RheSIsIm1vbWVudCIsIlllc3RlcmRheSIsInN1YnRyYWN0IiwiTGFzdCA3IERheXMiLCJMYXN0IDMwIERheXMiLCJUaGlzIE1vbnRoIiwic3RhcnRPZiIsImVuZE9mIiwiTGFzdCBNb250aCIsInN0YXJ0RGF0ZSIsImVuZERhdGUiLCJzdGFydCIsImVuZCIsIndpbmRvdyIsImFsZXJ0IiwiZm9ybWF0Iiwic2xpbVNjcm9sbCIsImhlaWdodCIsImRhdGVwaWNrZXIiLCJpbmlfZXZlbnRzIiwiZWxlIiwiZWFjaCIsImV2ZW50T2JqZWN0IiwidGl0bGUiLCJ0cmltIiwidGhpcyIsInRleHQiLCJkYXRhIiwiZHJhZ2dhYmxlIiwicmV2ZXJ0IiwicmV2ZXJ0RHVyYXRpb24iLCJkYXRlIiwiRGF0ZSIsImQiLCJnZXREYXRlIiwibSIsImdldE1vbnRoIiwieSIsImdldEZ1bGxZZWFyIiwiZnVsbENhbGVuZGFyIiwiaGVhZGVyIiwibGVmdCIsImNlbnRlciIsInJpZ2h0IiwiYnV0dG9uVGV4dCIsInRvZGF5IiwibW9udGgiLCJ3ZWVrIiwiZGF5IiwiZXZlbnRzIiwiYmFja2dyb3VuZENvbG9yIiwiYm9yZGVyQ29sb3IiLCJhbGxEYXkiLCJlZGl0YWJsZSIsImRyb3BwYWJsZSIsImRyb3AiLCJvcmlnaW5hbEV2ZW50T2JqZWN0IiwiY29waWVkRXZlbnRPYmplY3QiLCJleHRlbmQiLCJpcyIsInJlbW92ZSIsImN1cnJDb2xvciIsImNsaWNrIiwiZSIsInByZXZlbnREZWZhdWx0IiwiYmFja2dyb3VuZC1jb2xvciIsImJvcmRlci1jb2xvciIsInZhbCIsImxlbmd0aCIsImV2ZW50IiwiY29sb3IiLCJhZGRDbGFzcyIsImh0bWwiLCJwcmVwZW5kIiwiYXJlYUNoYXJ0Q2FudmFzIiwiZ2V0IiwiZ2V0Q29udGV4dCIsImFyZWFDaGFydCIsIkNoYXJ0IiwiYXJlYUNoYXJ0RGF0YSIsImxhYmVscyIsImRhdGFzZXRzIiwibGFiZWwiLCJmaWxsQ29sb3IiLCJzdHJva2VDb2xvciIsInBvaW50Q29sb3IiLCJwb2ludFN0cm9rZUNvbG9yIiwicG9pbnRIaWdobGlnaHRGaWxsIiwicG9pbnRIaWdobGlnaHRTdHJva2UiLCJhcmVhQ2hhcnRPcHRpb25zIiwic2hvd1NjYWxlIiwic2NhbGVTaG93R3JpZExpbmVzIiwic2NhbGVHcmlkTGluZUNvbG9yIiwic2NhbGVHcmlkTGluZVdpZHRoIiwic2NhbGVTaG93SG9yaXpvbnRhbExpbmVzIiwic2NhbGVTaG93VmVydGljYWxMaW5lcyIsImJlemllckN1cnZlIiwiYmV6aWVyQ3VydmVUZW5zaW9uIiwicG9pbnREb3QiLCJwb2ludERvdFJhZGl1cyIsInBvaW50RG90U3Ryb2tlV2lkdGgiLCJwb2ludEhpdERldGVjdGlvblJhZGl1cyIsImRhdGFzZXRTdHJva2UiLCJkYXRhc2V0U3Ryb2tlV2lkdGgiLCJkYXRhc2V0RmlsbCIsImxlZ2VuZFRlbXBsYXRlIiwibWFpbnRhaW5Bc3BlY3RSYXRpbyIsInJlc3BvbnNpdmUiLCJMaW5lIiwibGluZUNoYXJ0Q2FudmFzIiwibGluZUNoYXJ0IiwibGluZUNoYXJ0T3B0aW9ucyIsInBpZUNoYXJ0Q2FudmFzIiwicGllQ2hhcnQiLCJQaWVEYXRhIiwidmFsdWUiLCJoaWdobGlnaHQiLCJwaWVPcHRpb25zIiwic2VnbWVudFNob3dTdHJva2UiLCJzZWdtZW50U3Ryb2tlQ29sb3IiLCJzZWdtZW50U3Ryb2tlV2lkdGgiLCJwZXJjZW50YWdlSW5uZXJDdXRvdXQiLCJhbmltYXRpb25TdGVwcyIsImFuaW1hdGlvbkVhc2luZyIsImFuaW1hdGVSb3RhdGUiLCJhbmltYXRlU2NhbGUiLCJEb3VnaG51dCIsImJhckNoYXJ0Q2FudmFzIiwiYmFyQ2hhcnQiLCJiYXJDaGFydERhdGEiLCJiYXJDaGFydE9wdGlvbnMiLCJzY2FsZUJlZ2luQXRaZXJvIiwiYmFyU2hvd1N0cm9rZSIsImJhclN0cm9rZVdpZHRoIiwiYmFyVmFsdWVTcGFjaW5nIiwiYmFyRGF0YXNldFNwYWNpbmciLCJCYXIiLCJsYWJlbEZvcm1hdHRlciIsInNlcmllcyIsIk1hdGgiLCJyb3VuZCIsInBlcmNlbnQiLCJnZXRSYW5kb21EYXRhIiwic2xpY2UiLCJ0b3RhbFBvaW50cyIsInByZXYiLCJyYW5kb20iLCJwdXNoIiwicmVzIiwiaSIsInVwZGF0ZSIsImludGVyYWN0aXZlX3Bsb3QiLCJzZXREYXRhIiwiZHJhdyIsInJlYWx0aW1lIiwic2V0VGltZW91dCIsInVwZGF0ZUludGVydmFsIiwicGxvdCIsImdyaWQiLCJib3JkZXJXaWR0aCIsInRpY2tDb2xvciIsInNoYWRvd1NpemUiLCJsaW5lcyIsImZpbGwiLCJ5YXhpcyIsIm1pbiIsIm1heCIsInNob3ciLCJ4YXhpcyIsInNpbiIsImNvcyIsImxpbmVfZGF0YTEiLCJsaW5lX2RhdGEyIiwiaG92ZXJhYmxlIiwicG9pbnRzIiwicG9zaXRpb24iLCJkaXNwbGF5Iiwib3BhY2l0eSIsImFwcGVuZFRvIiwiYmluZCIsInBvcyIsIml0ZW0iLCJ4IiwiZGF0YXBvaW50IiwidG9GaXhlZCIsInRvcCIsInBhZ2VZIiwicGFnZVgiLCJmYWRlSW4iLCJoaWRlIiwiYXJlYURhdGEiLCJiYXJfZGF0YSIsImJhcnMiLCJiYXJXaWR0aCIsImFsaWduIiwibW9kZSIsInRpY2tMZW5ndGgiLCJkb251dERhdGEiLCJwaWUiLCJyYWRpdXMiLCJpbm5lclJhZGl1cyIsImZvcm1hdHRlciIsInRocmVzaG9sZCIsImxlZ2VuZCIsIiRodHRwIiwiJHNjb3BlIiwiY2ZwTG9hZGluZ0JhciIsInRlc3QiLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsInNlbGVjdDIiLCJpbnB1dG1hc2siLCJ0aW1lUGlja2VyIiwidGltZVBpY2tlckluY3JlbWVudCIsImF1dG9jbG9zZSIsImlDaGVjayIsImNoZWNrYm94Q2xhc3MiLCJyYWRpb0NsYXNzIiwiY29sb3JwaWNrZXIiLCJ0aW1lcGlja2VyIiwic2hvd0lucHV0cyIsIkNLRURJVE9SIiwicmVwbGFjZSIsInd5c2lodG1sNSIsIkRhdGFUYWJsZSIsInBhZ2luZyIsImxlbmd0aENoYW5nZSIsInNlYXJjaGluZyIsIm9yZGVyaW5nIiwiaW5mbyIsImF1dG9XaWR0aCIsInNsaWRlciJdLCJtYXBwaW5ncyI6IkFBQUEsR0FBQUEsU0FBQUMsUUFBQUMsT0FBQSxXQUFBLFlBQUEsWUFBQSxzQkFBQSxnQkFDQUYsU0FBQUcsUUFBQSxpQkFBQSxvQkFBQSxTQUFBQyxFQUFBQyxHQUNBRCxFQUFBRSxNQUFBLFFBQ0FDLElBQUEsR0FDQUMsWUFBQSxxQkFDQUMsV0FBQSxhQUVBSixFQUFBSyxXQUFBLEtBR0EsSUFBQUMsY0FBQVYsUUFBQUMsT0FBQSxnQkFBQSxhQUNBUyxjQUFBUixRQUFBLGlCQUFBLFNBQUFDLEdBQ0FBLEVBQUFFLE1B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QUFOLFNBQUFPLE1BQUEsVUFDQUMsY0FBQVIsU0FBQUUsU0FBQSxFQUFBLFNBQUFJLFFBQUEsU0FBQU4sU0FBQUUsU0FBQSxFQUFBLFNBQUFLLE1BQUEsV0FFQUUsVUFBQVQsU0FBQUUsU0FBQSxHQUFBLFFBQ0FRLFFBQUFWLFVBRUEsU0FBQVcsRUFBQUMsR0FDQXpCLEVBQUEsdUJBQUFxRixLQUFBN0QsRUFBQUksT0FBQSxnQkFBQSxNQUFBSCxFQUFBRyxPQUFBLG1CQUtBNUIsRUFBQSxlQUFBK0IsWUFDQXFNLFdBQUEsSUFJQXBPLEVBQUEsK0RBQUFxTyxRQUNBQyxjQUFBLHlCQUNBQyxXQUFBLHdCQUdBdk8sRUFBQSx1RUFBQXFPLFFBQ0FDLGNBQUEsd0JBQ0FDLFdBQUEsdUJBR0F2TyxFQUFBLGlFQUFBcU8sUUFDQUMsY0FBQSx1QkFDQUMsV0FBQSxzQkFJQXZPLEVBQUEsb0JBQUF3TyxjQUVBeE8sRUFBQSxvQkFBQXdPLGNBR0F4TyxFQUFBLGVBQUF5TyxZQUNBQyxZQUFBLFNDOURBOU8sYUFBQUYsV0FBQSxtQkFBQSxXQUNBUixRQUFBVyxRQUFBQyxVQUFBQyxNQUFBLFdBQ0E0TyxTQUFBQyxRQUFBLFdBRUE1TyxFQUFBLGFBQUE2TyxpQkNKQWpQLGFBQUFGLFdBQUEsa0JBQUEsV0FDQVIsUUFBQVcsUUFBQUMsVUFBQUMsTUFBQSxXQUNBQyxFQUFBLGFBQUE4TyxZQUNBOU8sRUFBQSxhQUFBOE8sV0FDQUMsUUFBQSxFQUNBQyxjQUFBLEVBQ0FDLFdBQUEsRUFDQUMsVUFBQSxFQUNBQyxNQUFBLEVBQ0FDLFdBQUEsU0NUQXhQLGFBQUFGLFdBQUEsZ0JBQUEsV0FDQVIsUUFBQVcsUUFBQUMsVUFBQUMsTUFBQSxXQUVBQyxFQUFBLFdBQUFxUCIsImZpbGUiOiJhcHAtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYmFzZUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdiYXNlQXBwJyAsIFsndWkucm91dGVyJywnbmdBbmltYXRlJywnYW5ndWxhci1sb2FkaW5nLWJhcicsJ2NvbmZpZ1JvdXRlciddKTsgXHJcbmJhc2VBcHAuY29uZmlnKFsnJHN0YXRlUHJvdmlkZXInLCckbG9jYXRpb25Qcm92aWRlcicsZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsJGxvY2F0aW9uUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlJyAsIHtcclxuXHRcdHVybCA6ICcnLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL2FwcC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybEJhc2UnXHJcblx0fSk7XHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG59XSk7XHJcblxyXG52YXIgY29uZmlnUm91dGVyID0gYW5ndWxhci5tb2R1bGUoJ2NvbmZpZ1JvdXRlcicgLCBbJ3VpLnJvdXRlciddKTtcclxuY29uZmlnUm91dGVyLmNvbmZpZyhbJyRzdGF0ZVByb3ZpZGVyJyAsIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS5kYXNoYm9hcmQnICx7XHJcblx0XHR1cmwgOiAnLycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvZGFzaGJvYXJkLmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlciA6ICdjdHJsRGFzaGJvYXJkJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLndpZGdldHMnICx7XHJcblx0XHR1cmwgOiAnL3dpZGdldHMnLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL3dpZGdldHMuaHRtbCdcclxuXHR9KTtcclxuXHQvLyBDaGFydFxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLmNoYXJ0cy1jaGFydGpzJyAse1xyXG5cdFx0dXJsIDogJy9jaGFydHMvY2hhcnRqcycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvY2hhcnRzL2NoYXJ0anMuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyIDogJ2N0cmxDaGFydHNDaGFydGpzJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLmNoYXJ0cy1mbG90JyAse1xyXG5cdFx0dXJsIDogJy9jaGFydHMvZmxvdCcsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvY2hhcnRzL2Zsb3QuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyIDogJ2N0cmxDaGFydHNGbG90J1xyXG5cdH0pO1xyXG5cdC8vIFVJIEVsZW1lbnRcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS51aS1nZW5lcmFsJyAse1xyXG5cdFx0dXJsIDogJy91aS1lbGVtZW50L2dlbmVyYWwnLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL3VpL2dlbmVyYWwuaHRtbCdcclxuXHR9KTtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS51aS1pY29ucycgLHtcclxuXHRcdHVybCA6ICcvdWktZWxlbWVudC9pY29ucycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvdWkvaWNvbnMuaHRtbCdcclxuXHR9KTtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS51aS1idXR0b25zJyAse1xyXG5cdFx0dXJsIDogJy91aS1lbGVtZW50L2J1dHRvbnMnLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL3VpL2J1dHRvbnMuaHRtbCdcclxuXHR9KTtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS51aS1zbGlkZXJzJyAse1xyXG5cdFx0dXJsIDogJy91aS1lbGVtZW50L3NsaWRlcnMnLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL3VpL3NsaWRlcnMuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyIDogJ2N0cmxVaVNsaWRlcidcclxuXHR9KTtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS51aS10aW1lbGluZScgLHtcclxuXHRcdHVybCA6ICcvdWktZWxlbWVudC90aW1lbGluZScsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvdWkvdGltZWxpbmUuaHRtbCdcclxuXHR9KTtcclxuXHQvLyBGb3JtIEVsZW1lbnRcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS5mb3Jtcy1nZW5lcmFsJyAse1xyXG5cdFx0dXJsIDogJy9mb3Jtcy9nZW5lcmFsJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy9mb3Jtcy9nZW5lcmFsLmh0bWwnXHJcblx0fSk7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UuZm9ybXMtZWRpdG9ycycgLHtcclxuXHRcdHVybCA6ICcvZm9ybXMvZWRpdG9ycycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvZm9ybXMvZWRpdG9ycy5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybEZvcm1zRWRpdG9yJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLmZvcm1zLWFkdmFuY2VkJyAse1xyXG5cdFx0dXJsIDogJy9mb3Jtcy9hZHZhbmNlZCcsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvZm9ybXMvYWR2YW5jZWQuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyIDogJ2N0cmxGb3Jtc0FkdmFuY2VkJ1xyXG5cdH0pO1xyXG5cdC8vIFRhYmxlXHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UudGFibGVzLWRhdGEnICx7XHJcblx0XHR1cmwgOiAnL3RhYmxlcy9kYXRhJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy90YWJsZXMvZGF0YS5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybFRhYmxlc0RhdGEnXHJcblx0fSk7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UudGFibGVzLXNpbXBsZScgLHtcclxuXHRcdHVybCA6ICcvdGFibGVzL3NpbXBsZScsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvdGFibGVzL3NpbXBsZS5odG1sJ1xyXG5cdH0pO1xyXG5cdC8vQ2FsZW5kYXJcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS5jYWxlbmRhcicgLHtcclxuXHRcdHVybCA6ICcvY2FsZW5kYXInLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL2NhbGVuZGFyLmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlciA6ICdjdHJsQ2FsZW5kYXInXHJcblx0fSk7XHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybEJhc2UnLFtmdW5jdGlvbigpe1xyXG4gIFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gIFx0XHQkLkFkbWluTFRFLmluaXQoKTsgLy8gY2FsbCBhZG1pbiBsdGUgZnVuY3Rpb25cclxuXHRcdCQoXCIuY29ubmVjdGVkU29ydGFibGUgLmJveC1oZWFkZXIsIC5jb25uZWN0ZWRTb3J0YWJsZSAubmF2LXRhYnMtY3VzdG9tXCIpLmNzcyhcImN1cnNvclwiLCBcIm1vdmVcIik7XHJcblxyXG5cdFx0Ly9qUXVlcnkgVUkgc29ydGFibGUgZm9yIHRoZSB0b2RvIGxpc3RcclxuXHRcdC8vTWFrZSB0aGUgZGFzaGJvYXJkIHdpZGdldHMgc29ydGFibGUgVXNpbmcganF1ZXJ5IFVJXHJcblx0XHQkKFwiLmNvbm5lY3RlZFNvcnRhYmxlXCIpLnNvcnRhYmxlKHtcclxuXHRcdFx0cGxhY2Vob2xkZXI6IFwic29ydC1oaWdobGlnaHRcIixcclxuXHRcdFx0Y29ubmVjdFdpdGg6IFwiLmNvbm5lY3RlZFNvcnRhYmxlXCIsXHJcblx0XHRcdGhhbmRsZTogXCIuYm94LWhlYWRlciwgLm5hdi10YWJzXCIsXHJcblx0XHRcdGZvcmNlUGxhY2Vob2xkZXJTaXplOiB0cnVlLFxyXG5cdFx0XHR6SW5kZXg6IDk5OTk5OVxyXG5cdFx0fSk7XHJcblx0XHQkKFwiLmNvbm5lY3RlZFNvcnRhYmxlIC5ib3gtaGVhZGVyLCAuY29ubmVjdGVkU29ydGFibGUgLm5hdi10YWJzLWN1c3RvbVwiKS5jc3MoXCJjdXJzb3JcIiwgXCJtb3ZlXCIpO1xyXG5cclxuXHRcdC8valF1ZXJ5IFVJIHNvcnRhYmxlIGZvciB0aGUgdG9kbyBsaXN0XHJcblx0XHQkKFwiLnRvZG8tbGlzdFwiKS5zb3J0YWJsZSh7XHJcblx0XHRcdHBsYWNlaG9sZGVyOiBcInNvcnQtaGlnaGxpZ2h0XCIsXHJcblx0XHRcdGhhbmRsZTogXCIuaGFuZGxlXCIsXHJcblx0XHRcdGZvcmNlUGxhY2Vob2xkZXJTaXplOiB0cnVlLFxyXG5cdFx0XHR6SW5kZXg6IDk5OTk5OVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0JCgnLmRhdGVyYW5nZScpLmRhdGVyYW5nZXBpY2tlcih7XHJcblx0XHRcdHJhbmdlczoge1xyXG5cdFx0XHQgICdUb2RheSc6IFttb21lbnQoKSwgbW9tZW50KCldLFxyXG5cdFx0XHQgICdZZXN0ZXJkYXknOiBbbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKSwgbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKV0sXHJcblx0XHRcdCAgJ0xhc3QgNyBEYXlzJzogW21vbWVudCgpLnN1YnRyYWN0KDYsICdkYXlzJyksIG1vbWVudCgpXSxcclxuXHRcdFx0ICAnTGFzdCAzMCBEYXlzJzogW21vbWVudCgpLnN1YnRyYWN0KDI5LCAnZGF5cycpLCBtb21lbnQoKV0sXHJcblx0XHRcdCAgJ1RoaXMgTW9udGgnOiBbbW9tZW50KCkuc3RhcnRPZignbW9udGgnKSwgbW9tZW50KCkuZW5kT2YoJ21vbnRoJyldLFxyXG5cdFx0XHQgICdMYXN0IE1vbnRoJzogW21vbWVudCgpLnN1YnRyYWN0KDEsICdtb250aCcpLnN0YXJ0T2YoJ21vbnRoJyksIG1vbWVudCgpLnN1YnRyYWN0KDEsICdtb250aCcpLmVuZE9mKCdtb250aCcpXVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRzdGFydERhdGU6IG1vbWVudCgpLnN1YnRyYWN0KDI5LCAnZGF5cycpLFxyXG5cdFx0XHRlbmREYXRlOiBtb21lbnQoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xyXG5cdFx0XHR3aW5kb3cuYWxlcnQoXCJZb3UgY2hvc2U6IFwiICsgc3RhcnQuZm9ybWF0KCdNTU1NIEQsIFlZWVknKSArICcgLSAnICsgZW5kLmZvcm1hdCgnTU1NTSBELCBZWVlZJykpO1xyXG5cdFx0fSk7XHJcblx0XHQvL1RoZSBDYWxlbmRlclxyXG5cdFx0Ly9TTElNU0NST0xMIEZPUiBDSEFUIFdJREdFVFxyXG5cdFx0JCgnI2NoYXQtYm94Jykuc2xpbVNjcm9sbCh7XHJcblx0XHRoZWlnaHQ6ICcyNTBweCdcclxuXHRcdH0pO1xyXG5cclxuXHRcdCQoXCIjY2FsZW5kYXJcIikuZGF0ZXBpY2tlcigpO1xyXG5cclxuXHR9KTtcclxuXHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybENhbGVuZGFyJyxbZnVuY3Rpb24oKXtcclxuICBcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuXHQgIFx0ZnVuY3Rpb24gaW5pX2V2ZW50cyhlbGUpIHtcclxuXHQgICAgICBlbGUuZWFjaChmdW5jdGlvbiAoKSB7XHJcblxyXG5cdCAgICAgICAgLy8gY3JlYXRlIGFuIEV2ZW50IE9iamVjdCAoaHR0cDovL2Fyc2hhdy5jb20vZnVsbGNhbGVuZGFyL2RvY3MvZXZlbnRfZGF0YS9FdmVudF9PYmplY3QvKVxyXG5cdCAgICAgICAgLy8gaXQgZG9lc24ndCBuZWVkIHRvIGhhdmUgYSBzdGFydCBvciBlbmRcclxuXHQgICAgICAgIHZhciBldmVudE9iamVjdCA9IHtcclxuXHQgICAgICAgICAgdGl0bGU6ICQudHJpbSgkKHRoaXMpLnRleHQoKSkgLy8gdXNlIHRoZSBlbGVtZW50J3MgdGV4dCBhcyB0aGUgZXZlbnQgdGl0bGVcclxuXHQgICAgICAgIH07XHJcblxyXG5cdCAgICAgICAgLy8gc3RvcmUgdGhlIEV2ZW50IE9iamVjdCBpbiB0aGUgRE9NIGVsZW1lbnQgc28gd2UgY2FuIGdldCB0byBpdCBsYXRlclxyXG5cdCAgICAgICAgJCh0aGlzKS5kYXRhKCdldmVudE9iamVjdCcsIGV2ZW50T2JqZWN0KTtcclxuXHJcblx0ICAgICAgICAvLyBtYWtlIHRoZSBldmVudCBkcmFnZ2FibGUgdXNpbmcgalF1ZXJ5IFVJXHJcblx0ICAgICAgICAkKHRoaXMpLmRyYWdnYWJsZSh7XHJcblx0ICAgICAgICAgIHpJbmRleDogMTA3MCxcclxuXHQgICAgICAgICAgcmV2ZXJ0OiB0cnVlLCAvLyB3aWxsIGNhdXNlIHRoZSBldmVudCB0byBnbyBiYWNrIHRvIGl0c1xyXG5cdCAgICAgICAgICByZXZlcnREdXJhdGlvbjogMCAgLy8gIG9yaWdpbmFsIHBvc2l0aW9uIGFmdGVyIHRoZSBkcmFnXHJcblx0ICAgICAgICB9KTtcclxuXHJcblx0ICAgICAgfSk7XHJcblx0ICAgIH1cclxuXHJcblx0ICAgIGluaV9ldmVudHMoJCgnI2V4dGVybmFsLWV2ZW50cyBkaXYuZXh0ZXJuYWwtZXZlbnQnKSk7XHJcblxyXG5cdCAgICAvKiBpbml0aWFsaXplIHRoZSBjYWxlbmRhclxyXG5cdCAgICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cdCAgICAvL0RhdGUgZm9yIHRoZSBjYWxlbmRhciBldmVudHMgKGR1bW15IGRhdGEpXHJcblx0ICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuXHQgICAgdmFyIGQgPSBkYXRlLmdldERhdGUoKSxcclxuXHQgICAgICAgIG0gPSBkYXRlLmdldE1vbnRoKCksXHJcblx0ICAgICAgICB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpO1xyXG5cdCAgICAkKCcjY2FsZW5kYXInKS5mdWxsQ2FsZW5kYXIoe1xyXG5cdCAgICAgIGhlYWRlcjoge1xyXG5cdCAgICAgICAgbGVmdDogJ3ByZXYsbmV4dCB0b2RheScsXHJcblx0ICAgICAgICBjZW50ZXI6ICd0aXRsZScsXHJcblx0ICAgICAgICByaWdodDogJ21vbnRoLGFnZW5kYVdlZWssYWdlbmRhRGF5J1xyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgYnV0dG9uVGV4dDoge1xyXG5cdCAgICAgICAgdG9kYXk6ICd0b2RheScsXHJcblx0ICAgICAgICBtb250aDogJ21vbnRoJyxcclxuXHQgICAgICAgIHdlZWs6ICd3ZWVrJyxcclxuXHQgICAgICAgIGRheTogJ2RheSdcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIC8vUmFuZG9tIGRlZmF1bHQgZXZlbnRzXHJcblx0ICAgICAgZXZlbnRzOiBbXHJcblx0ICAgICAgICB7XHJcblx0ICAgICAgICAgIHRpdGxlOiAnQWxsIERheSBFdmVudCcsXHJcblx0ICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZSh5LCBtLCAxKSxcclxuXHQgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmNTY5NTRcIiwgLy9yZWRcclxuXHQgICAgICAgICAgYm9yZGVyQ29sb3I6IFwiI2Y1Njk1NFwiIC8vcmVkXHJcblx0ICAgICAgICB9LFxyXG5cdCAgICAgICAge1xyXG5cdCAgICAgICAgICB0aXRsZTogJ0xvbmcgRXZlbnQnLFxyXG5cdCAgICAgICAgICBzdGFydDogbmV3IERhdGUoeSwgbSwgZCAtIDUpLFxyXG5cdCAgICAgICAgICBlbmQ6IG5ldyBEYXRlKHksIG0sIGQgLSAyKSxcclxuXHQgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmMzljMTJcIiwgLy95ZWxsb3dcclxuXHQgICAgICAgICAgYm9yZGVyQ29sb3I6IFwiI2YzOWMxMlwiIC8veWVsbG93XHJcblx0ICAgICAgICB9LFxyXG5cdCAgICAgICAge1xyXG5cdCAgICAgICAgICB0aXRsZTogJ01lZXRpbmcnLFxyXG5cdCAgICAgICAgICBzdGFydDogbmV3IERhdGUoeSwgbSwgZCwgMTAsIDMwKSxcclxuXHQgICAgICAgICAgYWxsRGF5OiBmYWxzZSxcclxuXHQgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiMwMDczYjdcIiwgLy9CbHVlXHJcblx0ICAgICAgICAgIGJvcmRlckNvbG9yOiBcIiMwMDczYjdcIiAvL0JsdWVcclxuXHQgICAgICAgIH0sXHJcblx0ICAgICAgICB7XHJcblx0ICAgICAgICAgIHRpdGxlOiAnTHVuY2gnLFxyXG5cdCAgICAgICAgICBzdGFydDogbmV3IERhdGUoeSwgbSwgZCwgMTIsIDApLFxyXG5cdCAgICAgICAgICBlbmQ6IG5ldyBEYXRlKHksIG0sIGQsIDE0LCAwKSxcclxuXHQgICAgICAgICAgYWxsRGF5OiBmYWxzZSxcclxuXHQgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiMwMGMwZWZcIiwgLy9JbmZvIChhcXVhKVxyXG5cdCAgICAgICAgICBib3JkZXJDb2xvcjogXCIjMDBjMGVmXCIgLy9JbmZvIChhcXVhKVxyXG5cdCAgICAgICAgfSxcclxuXHQgICAgICAgIHtcclxuXHQgICAgICAgICAgdGl0bGU6ICdCaXJ0aGRheSBQYXJ0eScsXHJcblx0ICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZSh5LCBtLCBkICsgMSwgMTksIDApLFxyXG5cdCAgICAgICAgICBlbmQ6IG5ldyBEYXRlKHksIG0sIGQgKyAxLCAyMiwgMzApLFxyXG5cdCAgICAgICAgICBhbGxEYXk6IGZhbHNlLFxyXG5cdCAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzAwYTY1YVwiLCAvL1N1Y2Nlc3MgKGdyZWVuKVxyXG5cdCAgICAgICAgICBib3JkZXJDb2xvcjogXCIjMDBhNjVhXCIgLy9TdWNjZXNzIChncmVlbilcclxuXHQgICAgICAgIH0sXHJcblx0ICAgICAgICB7XHJcblx0ICAgICAgICAgIHRpdGxlOiAnQ2xpY2sgZm9yIEdvb2dsZScsXHJcblx0ICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZSh5LCBtLCAyOCksXHJcblx0ICAgICAgICAgIGVuZDogbmV3IERhdGUoeSwgbSwgMjkpLFxyXG5cdCAgICAgICAgICB1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbS8nLFxyXG5cdCAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzNjOGRiY1wiLCAvL1ByaW1hcnkgKGxpZ2h0LWJsdWUpXHJcblx0ICAgICAgICAgIGJvcmRlckNvbG9yOiBcIiMzYzhkYmNcIiAvL1ByaW1hcnkgKGxpZ2h0LWJsdWUpXHJcblx0ICAgICAgICB9XHJcblx0ICAgICAgXSxcclxuXHQgICAgICBlZGl0YWJsZTogdHJ1ZSxcclxuXHQgICAgICBkcm9wcGFibGU6IHRydWUsIC8vIHRoaXMgYWxsb3dzIHRoaW5ncyB0byBiZSBkcm9wcGVkIG9udG8gdGhlIGNhbGVuZGFyICEhIVxyXG5cdCAgICAgIGRyb3A6IGZ1bmN0aW9uIChkYXRlLCBhbGxEYXkpIHsgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiBzb21ldGhpbmcgaXMgZHJvcHBlZFxyXG5cclxuXHQgICAgICAgIC8vIHJldHJpZXZlIHRoZSBkcm9wcGVkIGVsZW1lbnQncyBzdG9yZWQgRXZlbnQgT2JqZWN0XHJcblx0ICAgICAgICB2YXIgb3JpZ2luYWxFdmVudE9iamVjdCA9ICQodGhpcykuZGF0YSgnZXZlbnRPYmplY3QnKTtcclxuXHJcblx0ICAgICAgICAvLyB3ZSBuZWVkIHRvIGNvcHkgaXQsIHNvIHRoYXQgbXVsdGlwbGUgZXZlbnRzIGRvbid0IGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIHNhbWUgb2JqZWN0XHJcblx0ICAgICAgICB2YXIgY29waWVkRXZlbnRPYmplY3QgPSAkLmV4dGVuZCh7fSwgb3JpZ2luYWxFdmVudE9iamVjdCk7XHJcblxyXG5cdCAgICAgICAgLy8gYXNzaWduIGl0IHRoZSBkYXRlIHRoYXQgd2FzIHJlcG9ydGVkXHJcblx0ICAgICAgICBjb3BpZWRFdmVudE9iamVjdC5zdGFydCA9IGRhdGU7XHJcblx0ICAgICAgICBjb3BpZWRFdmVudE9iamVjdC5hbGxEYXkgPSBhbGxEYXk7XHJcblx0ICAgICAgICBjb3BpZWRFdmVudE9iamVjdC5iYWNrZ3JvdW5kQ29sb3IgPSAkKHRoaXMpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XHJcblx0ICAgICAgICBjb3BpZWRFdmVudE9iamVjdC5ib3JkZXJDb2xvciA9ICQodGhpcykuY3NzKFwiYm9yZGVyLWNvbG9yXCIpO1xyXG5cclxuXHQgICAgICAgIC8vIHJlbmRlciB0aGUgZXZlbnQgb24gdGhlIGNhbGVuZGFyXHJcblx0ICAgICAgICAvLyB0aGUgbGFzdCBgdHJ1ZWAgYXJndW1lbnQgZGV0ZXJtaW5lcyBpZiB0aGUgZXZlbnQgXCJzdGlja3NcIiAoaHR0cDovL2Fyc2hhdy5jb20vZnVsbGNhbGVuZGFyL2RvY3MvZXZlbnRfcmVuZGVyaW5nL3JlbmRlckV2ZW50LylcclxuXHQgICAgICAgICQoJyNjYWxlbmRhcicpLmZ1bGxDYWxlbmRhcigncmVuZGVyRXZlbnQnLCBjb3BpZWRFdmVudE9iamVjdCwgdHJ1ZSk7XHJcblxyXG5cdCAgICAgICAgLy8gaXMgdGhlIFwicmVtb3ZlIGFmdGVyIGRyb3BcIiBjaGVja2JveCBjaGVja2VkP1xyXG5cdCAgICAgICAgaWYgKCQoJyNkcm9wLXJlbW92ZScpLmlzKCc6Y2hlY2tlZCcpKSB7XHJcblx0ICAgICAgICAgIC8vIGlmIHNvLCByZW1vdmUgdGhlIGVsZW1lbnQgZnJvbSB0aGUgXCJEcmFnZ2FibGUgRXZlbnRzXCIgbGlzdFxyXG5cdCAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG5cdCAgICAgICAgfVxyXG5cclxuXHQgICAgICB9XHJcblx0ICAgIH0pO1xyXG5cclxuXHQgICAgLyogQURESU5HIEVWRU5UUyAqL1xyXG5cdCAgICB2YXIgY3VyckNvbG9yID0gXCIjM2M4ZGJjXCI7IC8vUmVkIGJ5IGRlZmF1bHRcclxuXHQgICAgLy9Db2xvciBjaG9vc2VyIGJ1dHRvblxyXG5cdCAgICB2YXIgY29sb3JDaG9vc2VyID0gJChcIiNjb2xvci1jaG9vc2VyLWJ0blwiKTtcclxuXHQgICAgJChcIiNjb2xvci1jaG9vc2VyID4gbGkgPiBhXCIpLmNsaWNrKGZ1bmN0aW9uIChlKSB7XHJcblx0ICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdCAgICAgIC8vU2F2ZSBjb2xvclxyXG5cdCAgICAgIGN1cnJDb2xvciA9ICQodGhpcykuY3NzKFwiY29sb3JcIik7XHJcblx0ICAgICAgLy9BZGQgY29sb3IgZWZmZWN0IHRvIGJ1dHRvblxyXG5cdCAgICAgICQoJyNhZGQtbmV3LWV2ZW50JykuY3NzKHtcImJhY2tncm91bmQtY29sb3JcIjogY3VyckNvbG9yLCBcImJvcmRlci1jb2xvclwiOiBjdXJyQ29sb3J9KTtcclxuXHQgICAgfSk7XHJcblx0ICAgICQoXCIjYWRkLW5ldy1ldmVudFwiKS5jbGljayhmdW5jdGlvbiAoZSkge1xyXG5cdCAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHQgICAgICAvL0dldCB2YWx1ZSBhbmQgbWFrZSBzdXJlIGl0IGlzIG5vdCBudWxsXHJcblx0ICAgICAgdmFyIHZhbCA9ICQoXCIjbmV3LWV2ZW50XCIpLnZhbCgpO1xyXG5cdCAgICAgIGlmICh2YWwubGVuZ3RoID09IDApIHtcclxuXHQgICAgICAgIHJldHVybjtcclxuXHQgICAgICB9XHJcblxyXG5cdCAgICAgIC8vQ3JlYXRlIGV2ZW50c1xyXG5cdCAgICAgIHZhciBldmVudCA9ICQoXCI8ZGl2IC8+XCIpO1xyXG5cdCAgICAgIGV2ZW50LmNzcyh7XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IGN1cnJDb2xvciwgXCJib3JkZXItY29sb3JcIjogY3VyckNvbG9yLCBcImNvbG9yXCI6IFwiI2ZmZlwifSkuYWRkQ2xhc3MoXCJleHRlcm5hbC1ldmVudFwiKTtcclxuXHQgICAgICBldmVudC5odG1sKHZhbCk7XHJcblx0ICAgICAgJCgnI2V4dGVybmFsLWV2ZW50cycpLnByZXBlbmQoZXZlbnQpO1xyXG5cclxuXHQgICAgICAvL0FkZCBkcmFnZ2FibGUgZnVudGlvbmFsaXR5XHJcblx0ICAgICAgaW5pX2V2ZW50cyhldmVudCk7XHJcblxyXG5cdCAgICAgIC8vUmVtb3ZlIGV2ZW50IGZyb20gdGV4dCBpbnB1dFxyXG5cdCAgICAgICQoXCIjbmV3LWV2ZW50XCIpLnZhbChcIlwiKTtcclxuXHQgICAgfSk7XHJcblx0fSk7XHJcblxyXG59XSk7IiwiY29uZmlnUm91dGVyLmNvbnRyb2xsZXIoJ2N0cmxDaGFydHNDaGFydGpzJyxbZnVuY3Rpb24oKXtcclxuICBcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICBcdFx0Ly8gR2V0IGNvbnRleHQgd2l0aCBqUXVlcnkgLSB1c2luZyBqUXVlcnkncyAuZ2V0KCkgbWV0aG9kLlxyXG5cdCAgICB2YXIgYXJlYUNoYXJ0Q2FudmFzID0gJChcIiNhcmVhQ2hhcnRcIikuZ2V0KDApLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHQgICAgLy8gVGhpcyB3aWxsIGdldCB0aGUgZmlyc3QgcmV0dXJuZWQgbm9kZSBpbiB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24uXHJcblx0ICAgIHZhciBhcmVhQ2hhcnQgPSBuZXcgQ2hhcnQoYXJlYUNoYXJ0Q2FudmFzKTtcclxuXHJcblx0ICAgIHZhciBhcmVhQ2hhcnREYXRhID0ge1xyXG5cdCAgICAgIGxhYmVsczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCJdLFxyXG5cdCAgICAgIGRhdGFzZXRzOiBbXHJcblx0ICAgICAgICB7XHJcblx0ICAgICAgICAgIGxhYmVsOiBcIkVsZWN0cm9uaWNzXCIsXHJcblx0ICAgICAgICAgIGZpbGxDb2xvcjogXCJyZ2JhKDIxMCwgMjE0LCAyMjIsIDEpXCIsXHJcblx0ICAgICAgICAgIHN0cm9rZUNvbG9yOiBcInJnYmEoMjEwLCAyMTQsIDIyMiwgMSlcIixcclxuXHQgICAgICAgICAgcG9pbnRDb2xvcjogXCJyZ2JhKDIxMCwgMjE0LCAyMjIsIDEpXCIsXHJcblx0ICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6IFwiI2MxYzdkMVwiLFxyXG5cdCAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6IFwiI2ZmZlwiLFxyXG5cdCAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogXCJyZ2JhKDIyMCwyMjAsMjIwLDEpXCIsXHJcblx0ICAgICAgICAgIGRhdGE6IFs2NSwgNTksIDgwLCA4MSwgNTYsIDU1LCA0MF1cclxuXHQgICAgICAgIH0sXHJcblx0ICAgICAgICB7XHJcblx0ICAgICAgICAgIGxhYmVsOiBcIkRpZ2l0YWwgR29vZHNcIixcclxuXHQgICAgICAgICAgZmlsbENvbG9yOiBcInJnYmEoNjAsMTQxLDE4OCwwLjkpXCIsXHJcblx0ICAgICAgICAgIHN0cm9rZUNvbG9yOiBcInJnYmEoNjAsMTQxLDE4OCwwLjgpXCIsXHJcblx0ICAgICAgICAgIHBvaW50Q29sb3I6IFwiIzNiOGJiYVwiLFxyXG5cdCAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiBcInJnYmEoNjAsMTQxLDE4OCwxKVwiLFxyXG5cdCAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6IFwiI2ZmZlwiLFxyXG5cdCAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogXCJyZ2JhKDYwLDE0MSwxODgsMSlcIixcclxuXHQgICAgICAgICAgZGF0YTogWzI4LCA0OCwgNDAsIDE5LCA4NiwgMjcsIDkwXVxyXG5cdCAgICAgICAgfVxyXG5cdCAgICAgIF1cclxuXHQgICAgfTtcclxuXHJcblx0ICAgIHZhciBhcmVhQ2hhcnRPcHRpb25zID0ge1xyXG5cdCAgICAgIC8vQm9vbGVhbiAtIElmIHdlIHNob3VsZCBzaG93IHRoZSBzY2FsZSBhdCBhbGxcclxuXHQgICAgICBzaG93U2NhbGU6IHRydWUsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XHJcblx0ICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiBmYWxzZSxcclxuXHQgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xyXG5cdCAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcclxuXHQgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXHJcblx0ICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBob3Jpem9udGFsIGxpbmVzIChleGNlcHQgWCBheGlzKVxyXG5cdCAgICAgIHNjYWxlU2hvd0hvcml6b250YWxMaW5lczogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgdmVydGljYWwgbGluZXMgKGV4Y2VwdCBZIGF4aXMpXHJcblx0ICAgICAgc2NhbGVTaG93VmVydGljYWxMaW5lczogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBsaW5lIGlzIGN1cnZlZCBiZXR3ZWVuIHBvaW50c1xyXG5cdCAgICAgIGJlemllckN1cnZlOiB0cnVlLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gVGVuc2lvbiBvZiB0aGUgYmV6aWVyIGN1cnZlIGJldHdlZW4gcG9pbnRzXHJcblx0ICAgICAgYmV6aWVyQ3VydmVUZW5zaW9uOiAwLjMsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgZG90IGZvciBlYWNoIHBvaW50XHJcblx0ICAgICAgcG9pbnREb3Q6IGZhbHNlLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gUmFkaXVzIG9mIGVhY2ggcG9pbnQgZG90IGluIHBpeGVsc1xyXG5cdCAgICAgIHBvaW50RG90UmFkaXVzOiA0LFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgcG9pbnQgZG90IHN0cm9rZVxyXG5cdCAgICAgIHBvaW50RG90U3Ryb2tlV2lkdGg6IDEsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBhbW91bnQgZXh0cmEgdG8gYWRkIHRvIHRoZSByYWRpdXMgdG8gY2F0ZXIgZm9yIGhpdCBkZXRlY3Rpb24gb3V0c2lkZSB0aGUgZHJhd24gcG9pbnRcclxuXHQgICAgICBwb2ludEhpdERldGVjdGlvblJhZGl1czogMjAsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgc3Ryb2tlIGZvciBkYXRhc2V0c1xyXG5cdCAgICAgIGRhdGFzZXRTdHJva2U6IHRydWUsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBkYXRhc2V0IHN0cm9rZVxyXG5cdCAgICAgIGRhdGFzZXRTdHJva2VXaWR0aDogMixcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIGZpbGwgdGhlIGRhdGFzZXQgd2l0aCBhIGNvbG9yXHJcblx0ICAgICAgZGF0YXNldEZpbGw6IHRydWUsXHJcblx0ICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxyXG5cdCAgICAgIGxlZ2VuZFRlbXBsYXRlOiBcIjx1bCBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kXFxcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmxpbmVDb2xvciU+XFxcIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD5cIixcclxuXHQgICAgICAvL0Jvb2xlYW4gLSB3aGV0aGVyIHRvIG1haW50YWluIHRoZSBzdGFydGluZyBhc3BlY3QgcmF0aW8gb3Igbm90IHdoZW4gcmVzcG9uc2l2ZSwgaWYgc2V0IHRvIGZhbHNlLCB3aWxsIHRha2UgdXAgZW50aXJlIGNvbnRhaW5lclxyXG5cdCAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IHRydWUsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gd2hldGhlciB0byBtYWtlIHRoZSBjaGFydCByZXNwb25zaXZlIHRvIHdpbmRvdyByZXNpemluZ1xyXG5cdCAgICAgIHJlc3BvbnNpdmU6IHRydWVcclxuXHQgICAgfTtcclxuXHJcblx0ICAgIC8vQ3JlYXRlIHRoZSBsaW5lIGNoYXJ0XHJcblx0ICAgIGFyZWFDaGFydC5MaW5lKGFyZWFDaGFydERhdGEsIGFyZWFDaGFydE9wdGlvbnMpO1xyXG5cclxuXHQgICAgLy8tLS0tLS0tLS0tLS0tXHJcblx0ICAgIC8vLSBMSU5FIENIQVJUIC1cclxuXHQgICAgLy8tLS0tLS0tLS0tLS0tLVxyXG5cdCAgICB2YXIgbGluZUNoYXJ0Q2FudmFzID0gJChcIiNsaW5lQ2hhcnRcIikuZ2V0KDApLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHQgICAgdmFyIGxpbmVDaGFydCA9IG5ldyBDaGFydChsaW5lQ2hhcnRDYW52YXMpO1xyXG5cdCAgICB2YXIgbGluZUNoYXJ0T3B0aW9ucyA9IGFyZWFDaGFydE9wdGlvbnM7XHJcblx0ICAgIGxpbmVDaGFydE9wdGlvbnMuZGF0YXNldEZpbGwgPSBmYWxzZTtcclxuXHQgICAgbGluZUNoYXJ0LkxpbmUoYXJlYUNoYXJ0RGF0YSwgbGluZUNoYXJ0T3B0aW9ucyk7XHJcblxyXG5cdCAgICAvLy0tLS0tLS0tLS0tLS1cclxuXHQgICAgLy8tIFBJRSBDSEFSVCAtXHJcblx0ICAgIC8vLS0tLS0tLS0tLS0tLVxyXG5cdCAgICAvLyBHZXQgY29udGV4dCB3aXRoIGpRdWVyeSAtIHVzaW5nIGpRdWVyeSdzIC5nZXQoKSBtZXRob2QuXHJcblx0ICAgIHZhciBwaWVDaGFydENhbnZhcyA9ICQoXCIjcGllQ2hhcnRcIikuZ2V0KDApLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHQgICAgdmFyIHBpZUNoYXJ0ID0gbmV3IENoYXJ0KHBpZUNoYXJ0Q2FudmFzKTtcclxuXHQgICAgdmFyIFBpZURhdGEgPSBbXHJcblx0ICAgICAge1xyXG5cdCAgICAgICAgdmFsdWU6IDcwMCxcclxuXHQgICAgICAgIGNvbG9yOiBcIiNmNTY5NTRcIixcclxuXHQgICAgICAgIGhpZ2hsaWdodDogXCIjZjU2OTU0XCIsXHJcblx0ICAgICAgICBsYWJlbDogXCJDaHJvbWVcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAge1xyXG5cdCAgICAgICAgdmFsdWU6IDUwMCxcclxuXHQgICAgICAgIGNvbG9yOiBcIiMwMGE2NWFcIixcclxuXHQgICAgICAgIGhpZ2hsaWdodDogXCIjMDBhNjVhXCIsXHJcblx0ICAgICAgICBsYWJlbDogXCJJRVwiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB7XHJcblx0ICAgICAgICB2YWx1ZTogNDAwLFxyXG5cdCAgICAgICAgY29sb3I6IFwiI2YzOWMxMlwiLFxyXG5cdCAgICAgICAgaGlnaGxpZ2h0OiBcIiNmMzljMTJcIixcclxuXHQgICAgICAgIGxhYmVsOiBcIkZpcmVGb3hcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAge1xyXG5cdCAgICAgICAgdmFsdWU6IDYwMCxcclxuXHQgICAgICAgIGNvbG9yOiBcIiMwMGMwZWZcIixcclxuXHQgICAgICAgIGhpZ2hsaWdodDogXCIjMDBjMGVmXCIsXHJcblx0ICAgICAgICBsYWJlbDogXCJTYWZhcmlcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAge1xyXG5cdCAgICAgICAgdmFsdWU6IDMwMCxcclxuXHQgICAgICAgIGNvbG9yOiBcIiMzYzhkYmNcIixcclxuXHQgICAgICAgIGhpZ2hsaWdodDogXCIjM2M4ZGJjXCIsXHJcblx0ICAgICAgICBsYWJlbDogXCJPcGVyYVwiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB7XHJcblx0ICAgICAgICB2YWx1ZTogMTAwLFxyXG5cdCAgICAgICAgY29sb3I6IFwiI2QyZDZkZVwiLFxyXG5cdCAgICAgICAgaGlnaGxpZ2h0OiBcIiNkMmQ2ZGVcIixcclxuXHQgICAgICAgIGxhYmVsOiBcIk5hdmlnYXRvclwiXHJcblx0ICAgICAgfVxyXG5cdCAgICBdO1xyXG5cdCAgICB2YXIgcGllT3B0aW9ucyA9IHtcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxyXG5cdCAgICAgIHNlZ21lbnRTaG93U3Ryb2tlOiB0cnVlLFxyXG5cdCAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXHJcblx0ICAgICAgc2VnbWVudFN0cm9rZUNvbG9yOiBcIiNmZmZcIixcclxuXHQgICAgICAvL051bWJlciAtIFRoZSB3aWR0aCBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXHJcblx0ICAgICAgc2VnbWVudFN0cm9rZVdpZHRoOiAyLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gVGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIGNoYXJ0IHRoYXQgd2UgY3V0IG91dCBvZiB0aGUgbWlkZGxlXHJcblx0ICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0OiA1MCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXHJcblx0ICAgICAgLy9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXHJcblx0ICAgICAgYW5pbWF0aW9uU3RlcHM6IDEwMCxcclxuXHQgICAgICAvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0XHJcblx0ICAgICAgYW5pbWF0aW9uRWFzaW5nOiBcImVhc2VPdXRCb3VuY2VcIixcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxyXG5cdCAgICAgIGFuaW1hdGVSb3RhdGU6IHRydWUsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxyXG5cdCAgICAgIGFuaW1hdGVTY2FsZTogZmFsc2UsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gd2hldGhlciB0byBtYWtlIHRoZSBjaGFydCByZXNwb25zaXZlIHRvIHdpbmRvdyByZXNpemluZ1xyXG5cdCAgICAgIHJlc3BvbnNpdmU6IHRydWUsXHJcblx0ICAgICAgLy8gQm9vbGVhbiAtIHdoZXRoZXIgdG8gbWFpbnRhaW4gdGhlIHN0YXJ0aW5nIGFzcGVjdCByYXRpbyBvciBub3Qgd2hlbiByZXNwb25zaXZlLCBpZiBzZXQgdG8gZmFsc2UsIHdpbGwgdGFrZSB1cCBlbnRpcmUgY29udGFpbmVyXHJcblx0ICAgICAgbWFpbnRhaW5Bc3BlY3RSYXRpbzogdHJ1ZSxcclxuXHQgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXHJcblx0ICAgICAgbGVnZW5kVGVtcGxhdGU6IFwiPHVsIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmRcXFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6PCU9c2VnbWVudHNbaV0uZmlsbENvbG9yJT5cXFwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPlwiXHJcblx0ICAgIH07XHJcblx0ICAgIC8vQ3JlYXRlIHBpZSBvciBkb3VobnV0IGNoYXJ0XHJcblx0ICAgIC8vIFlvdSBjYW4gc3dpdGNoIGJldHdlZW4gcGllIGFuZCBkb3VobnV0IHVzaW5nIHRoZSBtZXRob2QgYmVsb3cuXHJcblx0ICAgIHBpZUNoYXJ0LkRvdWdobnV0KFBpZURhdGEsIHBpZU9wdGlvbnMpO1xyXG5cclxuXHQgICAgLy8tLS0tLS0tLS0tLS0tXHJcblx0ICAgIC8vLSBCQVIgQ0hBUlQgLVxyXG5cdCAgICAvLy0tLS0tLS0tLS0tLS1cclxuXHQgICAgdmFyIGJhckNoYXJ0Q2FudmFzID0gJChcIiNiYXJDaGFydFwiKS5nZXQoMCkuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdCAgICB2YXIgYmFyQ2hhcnQgPSBuZXcgQ2hhcnQoYmFyQ2hhcnRDYW52YXMpO1xyXG5cdCAgICB2YXIgYmFyQ2hhcnREYXRhID0gYXJlYUNoYXJ0RGF0YTtcclxuXHQgICAgYmFyQ2hhcnREYXRhLmRhdGFzZXRzWzFdLmZpbGxDb2xvciA9IFwiIzAwYTY1YVwiO1xyXG5cdCAgICBiYXJDaGFydERhdGEuZGF0YXNldHNbMV0uc3Ryb2tlQ29sb3IgPSBcIiMwMGE2NWFcIjtcclxuXHQgICAgYmFyQ2hhcnREYXRhLmRhdGFzZXRzWzFdLnBvaW50Q29sb3IgPSBcIiMwMGE2NWFcIjtcclxuXHQgICAgdmFyIGJhckNoYXJ0T3B0aW9ucyA9IHtcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXHJcblx0ICAgICAgc2NhbGVCZWdpbkF0WmVybzogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcclxuXHQgICAgICBzY2FsZVNob3dHcmlkTGluZXM6IHRydWUsXHJcblx0ICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcclxuXHQgICAgICBzY2FsZUdyaWRMaW5lQ29sb3I6IFwicmdiYSgwLDAsMCwuMDUpXCIsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xyXG5cdCAgICAgIHNjYWxlR3JpZExpbmVXaWR0aDogMSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgaG9yaXpvbnRhbCBsaW5lcyAoZXhjZXB0IFggYXhpcylcclxuXHQgICAgICBzY2FsZVNob3dIb3Jpem9udGFsTGluZXM6IHRydWUsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IHZlcnRpY2FsIGxpbmVzIChleGNlcHQgWSBheGlzKVxyXG5cdCAgICAgIHNjYWxlU2hvd1ZlcnRpY2FsTGluZXM6IHRydWUsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gSWYgdGhlcmUgaXMgYSBzdHJva2Ugb24gZWFjaCBiYXJcclxuXHQgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGJhciBzdHJva2VcclxuXHQgICAgICBiYXJTdHJva2VXaWR0aDogMixcclxuXHQgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBlYWNoIG9mIHRoZSBYIHZhbHVlIHNldHNcclxuXHQgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZGF0YSBzZXRzIHdpdGhpbiBYIHZhbHVlc1xyXG5cdCAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxyXG5cdCAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcclxuXHQgICAgICBsZWdlbmRUZW1wbGF0ZTogXCI8dWwgY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZFxcXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlxcXCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+XCIsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gd2hldGhlciB0byBtYWtlIHRoZSBjaGFydCByZXNwb25zaXZlXHJcblx0ICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcclxuXHQgICAgICBtYWludGFpbkFzcGVjdFJhdGlvOiB0cnVlXHJcblx0ICAgIH07XHJcblxyXG5cdCAgICBiYXJDaGFydE9wdGlvbnMuZGF0YXNldEZpbGwgPSBmYWxzZTtcclxuXHQgICAgYmFyQ2hhcnQuQmFyKGJhckNoYXJ0RGF0YSwgYmFyQ2hhcnRPcHRpb25zKTtcclxuXHR9KTtcclxufV0pOyIsImNvbmZpZ1JvdXRlci5jb250cm9sbGVyKCdjdHJsQ2hhcnRzRmxvdCcsW2Z1bmN0aW9uKCl7XHJcblx0Ly8gYWxlcnQoJ2EnKTtcclxuICBcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuXHQgICAgLypcclxuXHQgICAgICogRmxvdCBJbnRlcmFjdGl2ZSBDaGFydFxyXG5cdCAgICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdCAgICAgKi9cclxuXHQgICAgLy8gV2UgdXNlIGFuIGlubGluZSBkYXRhIHNvdXJjZSBpbiB0aGUgZXhhbXBsZSwgdXN1YWxseSBkYXRhIHdvdWxkXHJcblx0ICAgIC8vIGJlIGZldGNoZWQgZnJvbSBhIHNlcnZlclxyXG5cdCAgICB2YXIgZGF0YSA9IFtdLCB0b3RhbFBvaW50cyA9IDEwMDtcclxuXHJcblx0ICAgIGZ1bmN0aW9uIGdldFJhbmRvbURhdGEoKSB7XHJcblxyXG5cdCAgICAgIGlmIChkYXRhLmxlbmd0aCA+IDApXHJcblx0ICAgICAgICBkYXRhID0gZGF0YS5zbGljZSgxKTtcclxuXHJcblx0ICAgICAgLy8gRG8gYSByYW5kb20gd2Fsa1xyXG5cdCAgICAgIHdoaWxlIChkYXRhLmxlbmd0aCA8IHRvdGFsUG9pbnRzKSB7XHJcblxyXG5cdCAgICAgICAgdmFyIHByZXYgPSBkYXRhLmxlbmd0aCA+IDAgPyBkYXRhW2RhdGEubGVuZ3RoIC0gMV0gOiA1MCxcclxuXHQgICAgICAgICAgICB5ID0gcHJldiArIE1hdGgucmFuZG9tKCkgKiAxMCAtIDU7XHJcblxyXG5cdCAgICAgICAgaWYgKHkgPCAwKSB7XHJcblx0ICAgICAgICAgIHkgPSAwO1xyXG5cdCAgICAgICAgfSBlbHNlIGlmICh5ID4gMTAwKSB7XHJcblx0ICAgICAgICAgIHkgPSAxMDA7XHJcblx0ICAgICAgICB9XHJcblxyXG5cdCAgICAgICAgZGF0YS5wdXNoKHkpO1xyXG5cdCAgICAgIH1cclxuXHJcblx0ICAgICAgLy8gWmlwIHRoZSBnZW5lcmF0ZWQgeSB2YWx1ZXMgd2l0aCB0aGUgeCB2YWx1ZXNcclxuXHQgICAgICB2YXIgcmVzID0gW107XHJcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgKytpKSB7XHJcblx0ICAgICAgICByZXMucHVzaChbaSwgZGF0YVtpXV0pO1xyXG5cdCAgICAgIH1cclxuXHJcblx0ICAgICAgcmV0dXJuIHJlcztcclxuXHQgICAgfVxyXG5cclxuXHQgICAgdmFyIGludGVyYWN0aXZlX3Bsb3QgPSAkLnBsb3QoXCIjaW50ZXJhY3RpdmVcIiwgW2dldFJhbmRvbURhdGEoKV0sIHtcclxuXHQgICAgICBncmlkOiB7XHJcblx0ICAgICAgICBib3JkZXJDb2xvcjogXCIjZjNmM2YzXCIsXHJcblx0ICAgICAgICBib3JkZXJXaWR0aDogMSxcclxuXHQgICAgICAgIHRpY2tDb2xvcjogXCIjZjNmM2YzXCJcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHNlcmllczoge1xyXG5cdCAgICAgICAgc2hhZG93U2l6ZTogMCwgLy8gRHJhd2luZyBpcyBmYXN0ZXIgd2l0aG91dCBzaGFkb3dzXHJcblx0ICAgICAgICBjb2xvcjogXCIjM2M4ZGJjXCJcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIGxpbmVzOiB7XHJcblx0ICAgICAgICBmaWxsOiB0cnVlLCAvL0NvbnZlcnRzIHRoZSBsaW5lIGNoYXJ0IHRvIGFyZWEgY2hhcnRcclxuXHQgICAgICAgIGNvbG9yOiBcIiMzYzhkYmNcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgeWF4aXM6IHtcclxuXHQgICAgICAgIG1pbjogMCxcclxuXHQgICAgICAgIG1heDogMTAwLFxyXG5cdCAgICAgICAgc2hvdzogdHJ1ZVxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgeGF4aXM6IHtcclxuXHQgICAgICAgIHNob3c6IHRydWVcclxuXHQgICAgICB9XHJcblx0ICAgIH0pO1xyXG5cclxuXHQgICAgdmFyIHVwZGF0ZUludGVydmFsID0gNTAwOyAvL0ZldGNoIGRhdGEgZXZlciB4IG1pbGxpc2Vjb25kc1xyXG5cdCAgICB2YXIgcmVhbHRpbWUgPSBcIm9uXCI7IC8vSWYgPT0gdG8gb24gdGhlbiBmZXRjaCBkYXRhIGV2ZXJ5IHggc2Vjb25kcy4gZWxzZSBzdG9wIGZldGNoaW5nXHJcblx0ICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcclxuXHJcblx0ICAgICAgaW50ZXJhY3RpdmVfcGxvdC5zZXREYXRhKFtnZXRSYW5kb21EYXRhKCldKTtcclxuXHJcblx0ICAgICAgLy8gU2luY2UgdGhlIGF4ZXMgZG9uJ3QgY2hhbmdlLCB3ZSBkb24ndCBuZWVkIHRvIGNhbGwgcGxvdC5zZXR1cEdyaWQoKVxyXG5cdCAgICAgIGludGVyYWN0aXZlX3Bsb3QuZHJhdygpO1xyXG5cdCAgICAgIGlmIChyZWFsdGltZSA9PT0gXCJvblwiKVxyXG5cdCAgICAgICAgc2V0VGltZW91dCh1cGRhdGUsIHVwZGF0ZUludGVydmFsKTtcclxuXHQgICAgfVxyXG5cclxuXHQgICAgLy9JTklUSUFMSVpFIFJFQUxUSU1FIERBVEEgRkVUQ0hJTkdcclxuXHQgICAgaWYgKHJlYWx0aW1lID09PSBcIm9uXCIpIHtcclxuXHQgICAgICB1cGRhdGUoKTtcclxuXHQgICAgfVxyXG5cdCAgICAvL1JFQUxUSU1FIFRPR0dMRVxyXG5cdCAgICAkKFwiI3JlYWx0aW1lIC5idG5cIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG5cdCAgICAgIGlmICgkKHRoaXMpLmRhdGEoXCJ0b2dnbGVcIikgPT09IFwib25cIikge1xyXG5cdCAgICAgICAgcmVhbHRpbWUgPSBcIm9uXCI7XHJcblx0ICAgICAgfVxyXG5cdCAgICAgIGVsc2Uge1xyXG5cdCAgICAgICAgcmVhbHRpbWUgPSBcIm9mZlwiO1xyXG5cdCAgICAgIH1cclxuXHQgICAgICB1cGRhdGUoKTtcclxuXHQgICAgfSk7XHJcblx0ICAgIC8qXHJcblx0ICAgICAqIEVORCBJTlRFUkFDVElWRSBDSEFSVFxyXG5cdCAgICAgKi9cclxuXHJcblxyXG5cdCAgICAvKlxyXG5cdCAgICAgKiBMSU5FIENIQVJUXHJcblx0ICAgICAqIC0tLS0tLS0tLS1cclxuXHQgICAgICovXHJcblx0ICAgIC8vTElORSByYW5kb21seSBnZW5lcmF0ZWQgZGF0YVxyXG5cclxuXHQgICAgdmFyIHNpbiA9IFtdLCBjb3MgPSBbXTtcclxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNDsgaSArPSAwLjUpIHtcclxuXHQgICAgICBzaW4ucHVzaChbaSwgTWF0aC5zaW4oaSldKTtcclxuXHQgICAgICBjb3MucHVzaChbaSwgTWF0aC5jb3MoaSldKTtcclxuXHQgICAgfVxyXG5cdCAgICB2YXIgbGluZV9kYXRhMSA9IHtcclxuXHQgICAgICBkYXRhOiBzaW4sXHJcblx0ICAgICAgY29sb3I6IFwiIzNjOGRiY1wiXHJcblx0ICAgIH07XHJcblx0ICAgIHZhciBsaW5lX2RhdGEyID0ge1xyXG5cdCAgICAgIGRhdGE6IGNvcyxcclxuXHQgICAgICBjb2xvcjogXCIjMDBjMGVmXCJcclxuXHQgICAgfTtcclxuXHQgICAgJC5wbG90KFwiI2xpbmUtY2hhcnRcIiwgW2xpbmVfZGF0YTEsIGxpbmVfZGF0YTJdLCB7XHJcblx0ICAgICAgZ3JpZDoge1xyXG5cdCAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxyXG5cdCAgICAgICAgYm9yZGVyQ29sb3I6IFwiI2YzZjNmM1wiLFxyXG5cdCAgICAgICAgYm9yZGVyV2lkdGg6IDEsXHJcblx0ICAgICAgICB0aWNrQ29sb3I6IFwiI2YzZjNmM1wiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICBzZXJpZXM6IHtcclxuXHQgICAgICAgIHNoYWRvd1NpemU6IDAsXHJcblx0ICAgICAgICBsaW5lczoge1xyXG5cdCAgICAgICAgICBzaG93OiB0cnVlXHJcblx0ICAgICAgICB9LFxyXG5cdCAgICAgICAgcG9pbnRzOiB7XHJcblx0ICAgICAgICAgIHNob3c6IHRydWVcclxuXHQgICAgICAgIH1cclxuXHQgICAgICB9LFxyXG5cdCAgICAgIGxpbmVzOiB7XHJcblx0ICAgICAgICBmaWxsOiBmYWxzZSxcclxuXHQgICAgICAgIGNvbG9yOiBbXCIjM2M4ZGJjXCIsIFwiI2Y1Njk1NFwiXVxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgeWF4aXM6IHtcclxuXHQgICAgICAgIHNob3c6IHRydWUsXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB4YXhpczoge1xyXG5cdCAgICAgICAgc2hvdzogdHJ1ZVxyXG5cdCAgICAgIH1cclxuXHQgICAgfSk7XHJcblx0ICAgIC8vSW5pdGlhbGl6ZSB0b29sdGlwIG9uIGhvdmVyXHJcblx0ICAgICQoJzxkaXYgY2xhc3M9XCJ0b29sdGlwLWlubmVyXCIgaWQ9XCJsaW5lLWNoYXJ0LXRvb2x0aXBcIj48L2Rpdj4nKS5jc3Moe1xyXG5cdCAgICAgIHBvc2l0aW9uOiBcImFic29sdXRlXCIsXHJcblx0ICAgICAgZGlzcGxheTogXCJub25lXCIsXHJcblx0ICAgICAgb3BhY2l0eTogMC44XHJcblx0ICAgIH0pLmFwcGVuZFRvKFwiYm9keVwiKTtcclxuXHQgICAgJChcIiNsaW5lLWNoYXJ0XCIpLmJpbmQoXCJwbG90aG92ZXJcIiwgZnVuY3Rpb24gKGV2ZW50LCBwb3MsIGl0ZW0pIHtcclxuXHJcblx0ICAgICAgaWYgKGl0ZW0pIHtcclxuXHQgICAgICAgIHZhciB4ID0gaXRlbS5kYXRhcG9pbnRbMF0udG9GaXhlZCgyKSxcclxuXHQgICAgICAgICAgICB5ID0gaXRlbS5kYXRhcG9pbnRbMV0udG9GaXhlZCgyKTtcclxuXHJcblx0ICAgICAgICAkKFwiI2xpbmUtY2hhcnQtdG9vbHRpcFwiKS5odG1sKGl0ZW0uc2VyaWVzLmxhYmVsICsgXCIgb2YgXCIgKyB4ICsgXCIgPSBcIiArIHkpXHJcblx0ICAgICAgICAgICAgLmNzcyh7dG9wOiBpdGVtLnBhZ2VZICsgNSwgbGVmdDogaXRlbS5wYWdlWCArIDV9KVxyXG5cdCAgICAgICAgICAgIC5mYWRlSW4oMjAwKTtcclxuXHQgICAgICB9IGVsc2Uge1xyXG5cdCAgICAgICAgJChcIiNsaW5lLWNoYXJ0LXRvb2x0aXBcIikuaGlkZSgpO1xyXG5cdCAgICAgIH1cclxuXHJcblx0ICAgIH0pO1xyXG5cdCAgICAvKiBFTkQgTElORSBDSEFSVCAqL1xyXG5cclxuXHQgICAgLypcclxuXHQgICAgICogRlVMTCBXSURUSCBTVEFUSUMgQVJFQSBDSEFSVFxyXG5cdCAgICAgKiAtLS0tLS0tLS0tLS0tLS0tLVxyXG5cdCAgICAgKi9cclxuXHQgICAgdmFyIGFyZWFEYXRhID0gW1syLCA4OC4wXSwgWzMsIDkzLjNdLCBbNCwgMTAyLjBdLCBbNSwgMTA4LjVdLCBbNiwgMTE1LjddLCBbNywgMTE1LjZdLFxyXG5cdCAgICAgIFs4LCAxMjQuNl0sIFs5LCAxMzAuM10sIFsxMCwgMTM0LjNdLCBbMTEsIDE0MS40XSwgWzEyLCAxNDYuNV0sIFsxMywgMTUxLjddLCBbMTQsIDE1OS45XSxcclxuXHQgICAgICBbMTUsIDE2NS40XSwgWzE2LCAxNjcuOF0sIFsxNywgMTY4LjddLCBbMTgsIDE2OS41XSwgWzE5LCAxNjguMF1dO1xyXG5cdCAgICAkLnBsb3QoXCIjYXJlYS1jaGFydFwiLCBbYXJlYURhdGFdLCB7XHJcblx0ICAgICAgZ3JpZDoge1xyXG5cdCAgICAgICAgYm9yZGVyV2lkdGg6IDBcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHNlcmllczoge1xyXG5cdCAgICAgICAgc2hhZG93U2l6ZTogMCwgLy8gRHJhd2luZyBpcyBmYXN0ZXIgd2l0aG91dCBzaGFkb3dzXHJcblx0ICAgICAgICBjb2xvcjogXCIjMDBjMGVmXCJcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIGxpbmVzOiB7XHJcblx0ICAgICAgICBmaWxsOiB0cnVlIC8vQ29udmVydHMgdGhlIGxpbmUgY2hhcnQgdG8gYXJlYSBjaGFydFxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgeWF4aXM6IHtcclxuXHQgICAgICAgIHNob3c6IGZhbHNlXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB4YXhpczoge1xyXG5cdCAgICAgICAgc2hvdzogZmFsc2VcclxuXHQgICAgICB9XHJcblx0ICAgIH0pO1xyXG5cclxuXHQgICAgLyogRU5EIEFSRUEgQ0hBUlQgKi9cclxuXHJcblx0ICAgIC8qXHJcblx0ICAgICAqIEJBUiBDSEFSVFxyXG5cdCAgICAgKiAtLS0tLS0tLS1cclxuXHQgICAgICovXHJcblxyXG5cdCAgICB2YXIgYmFyX2RhdGEgPSB7XHJcblx0ICAgICAgZGF0YTogW1tcIkphbnVhcnlcIiwgMTBdLCBbXCJGZWJydWFyeVwiLCA4XSwgW1wiTWFyY2hcIiwgNF0sIFtcIkFwcmlsXCIsIDEzXSwgW1wiTWF5XCIsIDE3XSwgW1wiSnVuZVwiLCA5XV0sXHJcblx0ICAgICAgY29sb3I6IFwiIzNjOGRiY1wiXHJcblx0ICAgIH07XHJcblx0ICAgICQucGxvdChcIiNiYXItY2hhcnRcIiwgW2Jhcl9kYXRhXSwge1xyXG5cdCAgICAgIGdyaWQ6IHtcclxuXHQgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG5cdCAgICAgICAgYm9yZGVyQ29sb3I6IFwiI2YzZjNmM1wiLFxyXG5cdCAgICAgICAgdGlja0NvbG9yOiBcIiNmM2YzZjNcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgc2VyaWVzOiB7XHJcblx0ICAgICAgICBiYXJzOiB7XHJcblx0ICAgICAgICAgIHNob3c6IHRydWUsXHJcblx0ICAgICAgICAgIGJhcldpZHRoOiAwLjUsXHJcblx0ICAgICAgICAgIGFsaWduOiBcImNlbnRlclwiXHJcblx0ICAgICAgICB9XHJcblx0ICAgICAgfSxcclxuXHQgICAgICB4YXhpczoge1xyXG5cdCAgICAgICAgbW9kZTogXCJjYXRlZ29yaWVzXCIsXHJcblx0ICAgICAgICB0aWNrTGVuZ3RoOiAwXHJcblx0ICAgICAgfVxyXG5cdCAgICB9KTtcclxuXHQgICAgLyogRU5EIEJBUiBDSEFSVCAqL1xyXG5cclxuXHQgICAgLypcclxuXHQgICAgICogRE9OVVQgQ0hBUlRcclxuXHQgICAgICogLS0tLS0tLS0tLS1cclxuXHQgICAgICovXHJcblxyXG5cdCAgICB2YXIgZG9udXREYXRhID0gW1xyXG5cdCAgICAgIHtsYWJlbDogXCJTZXJpZXMyXCIsIGRhdGE6IDMwLCBjb2xvcjogXCIjM2M4ZGJjXCJ9LFxyXG5cdCAgICAgIHtsYWJlbDogXCJTZXJpZXMzXCIsIGRhdGE6IDIwLCBjb2xvcjogXCIjMDA3M2I3XCJ9LFxyXG5cdCAgICAgIHtsYWJlbDogXCJTZXJpZXM0XCIsIGRhdGE6IDUwLCBjb2xvcjogXCIjMDBjMGVmXCJ9XHJcblx0ICAgIF07XHJcblx0ICAgICQucGxvdChcIiNkb251dC1jaGFydFwiLCBkb251dERhdGEsIHtcclxuXHQgICAgICBzZXJpZXM6IHtcclxuXHQgICAgICAgIHBpZToge1xyXG5cdCAgICAgICAgICBzaG93OiB0cnVlLFxyXG5cdCAgICAgICAgICByYWRpdXM6IDEsXHJcblx0ICAgICAgICAgIGlubmVyUmFkaXVzOiAwLjUsXHJcblx0ICAgICAgICAgIGxhYmVsOiB7XHJcblx0ICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuXHQgICAgICAgICAgICByYWRpdXM6IDIgLyAzLFxyXG5cdCAgICAgICAgICAgIGZvcm1hdHRlcjogbGFiZWxGb3JtYXR0ZXIsXHJcblx0ICAgICAgICAgICAgdGhyZXNob2xkOiAwLjFcclxuXHQgICAgICAgICAgfVxyXG5cclxuXHQgICAgICAgIH1cclxuXHQgICAgICB9LFxyXG5cdCAgICAgIGxlZ2VuZDoge1xyXG5cdCAgICAgICAgc2hvdzogZmFsc2VcclxuXHQgICAgICB9XHJcblx0ICAgIH0pO1xyXG5cdCAgICAvKlxyXG5cdCAgICAgKiBFTkQgRE9OVVQgQ0hBUlRcclxuXHQgICAgICovXHJcblxyXG5cdH0pO1xyXG4gIFx0ZnVuY3Rpb24gbGFiZWxGb3JtYXR0ZXIobGFiZWwsIHNlcmllcykge1xyXG4gICAgXHRyZXR1cm4gJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTNweDsgdGV4dC1hbGlnbjpjZW50ZXI7IHBhZGRpbmc6MnB4OyBjb2xvcjogI2ZmZjsgZm9udC13ZWlnaHQ6IDYwMDtcIj4nXHJcbiAgICAgICAgKyBsYWJlbFxyXG4gICAgICAgICsgXCI8YnI+XCJcclxuICAgICAgICArIE1hdGgucm91bmQoc2VyaWVzLnBlcmNlbnQpICsgXCIlPC9kaXY+XCI7XHJcbiAgXHR9XHJcblxyXG59XSk7IiwiYmFzZUFwcC5jb250cm9sbGVyKCdjdHJsRGFzaGJvYXJkJyxbJyRodHRwJywnJHNjb3BlJywnY2ZwTG9hZGluZ0JhcicsZnVuY3Rpb24oJGh0dHAsJHNjb3BlLGNmcExvYWRpbmdCYXIpe1xyXG5cdCRzY29wZS50ZXN0ID0gZnVuY3Rpb24oKXtcclxuICAgIFx0Ly8gYWxlcnQoJ2EnKVxyXG4gICAgXHRjZnBMb2FkaW5nQmFyLnN0YXJ0KClcclxuICBcdH1cclxuICBcdCRodHRwLmdldChcImh0dHBzOi8vd3d3LnJlZGRpdC5jb20vci9nYW1pbmcuanNvbj9saW1pdD0xMDAmanNvbnA9YW5ndWxhci5jYWxsYmFja3MuXzFcIilcclxuICBcdC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcbiAgXHRcdGNvbnNvbGUubG9nKHJlcylcclxuICBcdH0pO1xyXG4gIFx0Ly8gY29uc29sZS5sb2coJ2EnKVxyXG5cdC8vTWFrZSB0aGUgZGFzaGJvYXJkIHdpZGdldHMgc29ydGFibGUgVXNpbmcganF1ZXJ5IFVJXHJcbiAgXHJcbiAgXHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybEV4YW1wbGUnLFtmdW5jdGlvbigpe1xyXG4gIFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gIFx0XHJcblxyXG5cdH0pO1xyXG5cclxufV0pOyIsImNvbmZpZ1JvdXRlci5jb250cm9sbGVyKCdjdHJsRm9ybXNBZHZhbmNlZCcsW2Z1bmN0aW9uKCl7XHJcbiAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gIFx0JChcIi5zZWxlY3QyXCIpLnNlbGVjdDIoKTtcclxuXHJcbiAgICAvL0RhdGVtYXNrIGRkL21tL3l5eXlcclxuICAgICQoXCIjZGF0ZW1hc2tcIikuaW5wdXRtYXNrKFwiZGQvbW0veXl5eVwiLCB7XCJwbGFjZWhvbGRlclwiOiBcImRkL21tL3l5eXlcIn0pO1xyXG4gICAgLy9EYXRlbWFzazIgbW0vZGQveXl5eVxyXG4gICAgJChcIiNkYXRlbWFzazJcIikuaW5wdXRtYXNrKFwibW0vZGQveXl5eVwiLCB7XCJwbGFjZWhvbGRlclwiOiBcIm1tL2RkL3l5eXlcIn0pO1xyXG4gICAgLy9Nb25leSBFdXJvXHJcbiAgICAkKFwiW2RhdGEtbWFza11cIikuaW5wdXRtYXNrKCk7XHJcblxyXG4gICAgLy9EYXRlIHJhbmdlIHBpY2tlclxyXG4gICAgJCgnI3Jlc2VydmF0aW9uJykuZGF0ZXJhbmdlcGlja2VyKCk7XHJcbiAgICAvL0RhdGUgcmFuZ2UgcGlja2VyIHdpdGggdGltZSBwaWNrZXJcclxuICAgICQoJyNyZXNlcnZhdGlvbnRpbWUnKS5kYXRlcmFuZ2VwaWNrZXIoe3RpbWVQaWNrZXI6IHRydWUsIHRpbWVQaWNrZXJJbmNyZW1lbnQ6IDMwLCBmb3JtYXQ6ICdNTS9ERC9ZWVlZIGg6bW0gQSd9KTtcclxuICAgIC8vRGF0ZSByYW5nZSBhcyBhIGJ1dHRvblxyXG4gICAgJCgnI2RhdGVyYW5nZS1idG4nKS5kYXRlcmFuZ2VwaWNrZXIoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmFuZ2VzOiB7XHJcbiAgICAgICAgICAgICdUb2RheSc6IFttb21lbnQoKSwgbW9tZW50KCldLFxyXG4gICAgICAgICAgICAnWWVzdGVyZGF5JzogW21vbWVudCgpLnN1YnRyYWN0KDEsICdkYXlzJyksIG1vbWVudCgpLnN1YnRyYWN0KDEsICdkYXlzJyldLFxyXG4gICAgICAgICAgICAnTGFzdCA3IERheXMnOiBbbW9tZW50KCkuc3VidHJhY3QoNiwgJ2RheXMnKSwgbW9tZW50KCldLFxyXG4gICAgICAgICAgICAnTGFzdCAzMCBEYXlzJzogW21vbWVudCgpLnN1YnRyYWN0KDI5LCAnZGF5cycpLCBtb21lbnQoKV0sXHJcbiAgICAgICAgICAgICdUaGlzIE1vbnRoJzogW21vbWVudCgpLnN0YXJ0T2YoJ21vbnRoJyksIG1vbWVudCgpLmVuZE9mKCdtb250aCcpXSxcclxuICAgICAgICAgICAgJ0xhc3QgTW9udGgnOiBbbW9tZW50KCkuc3VidHJhY3QoMSwgJ21vbnRoJykuc3RhcnRPZignbW9udGgnKSwgbW9tZW50KCkuc3VidHJhY3QoMSwgJ21vbnRoJykuZW5kT2YoJ21vbnRoJyldXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc3RhcnREYXRlOiBtb21lbnQoKS5zdWJ0cmFjdCgyOSwgJ2RheXMnKSxcclxuICAgICAgICAgIGVuZERhdGU6IG1vbWVudCgpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xyXG4gICAgICAgICAgJCgnI2RhdGVyYW5nZS1idG4gc3BhbicpLmh0bWwoc3RhcnQuZm9ybWF0KCdNTU1NIEQsIFlZWVknKSArICcgLSAnICsgZW5kLmZvcm1hdCgnTU1NTSBELCBZWVlZJykpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy9EYXRlIHBpY2tlclxyXG4gICAgJCgnI2RhdGVwaWNrZXInKS5kYXRlcGlja2VyKHtcclxuICAgICAgYXV0b2Nsb3NlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2lDaGVjayBmb3IgY2hlY2tib3ggYW5kIHJhZGlvIGlucHV0c1xyXG4gICAgJCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdLm1pbmltYWwsIGlucHV0W3R5cGU9XCJyYWRpb1wiXS5taW5pbWFsJykuaUNoZWNrKHtcclxuICAgICAgY2hlY2tib3hDbGFzczogJ2ljaGVja2JveF9taW5pbWFsLWJsdWUnLFxyXG4gICAgICByYWRpb0NsYXNzOiAnaXJhZGlvX21pbmltYWwtYmx1ZSdcclxuICAgIH0pO1xyXG4gICAgLy9SZWQgY29sb3Igc2NoZW1lIGZvciBpQ2hlY2tcclxuICAgICQoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXS5taW5pbWFsLXJlZCwgaW5wdXRbdHlwZT1cInJhZGlvXCJdLm1pbmltYWwtcmVkJykuaUNoZWNrKHtcclxuICAgICAgY2hlY2tib3hDbGFzczogJ2ljaGVja2JveF9taW5pbWFsLXJlZCcsXHJcbiAgICAgIHJhZGlvQ2xhc3M6ICdpcmFkaW9fbWluaW1hbC1yZWQnXHJcbiAgICB9KTtcclxuICAgIC8vRmxhdCByZWQgY29sb3Igc2NoZW1lIGZvciBpQ2hlY2tcclxuICAgICQoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXS5mbGF0LXJlZCwgaW5wdXRbdHlwZT1cInJhZGlvXCJdLmZsYXQtcmVkJykuaUNoZWNrKHtcclxuICAgICAgY2hlY2tib3hDbGFzczogJ2ljaGVja2JveF9mbGF0LWdyZWVuJyxcclxuICAgICAgcmFkaW9DbGFzczogJ2lyYWRpb19mbGF0LWdyZWVuJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9Db2xvcnBpY2tlclxyXG4gICAgJChcIi5teS1jb2xvcnBpY2tlcjFcIikuY29sb3JwaWNrZXIoKTtcclxuICAgIC8vY29sb3IgcGlja2VyIHdpdGggYWRkb25cclxuICAgICQoXCIubXktY29sb3JwaWNrZXIyXCIpLmNvbG9ycGlja2VyKCk7XHJcblxyXG4gICAgLy9UaW1lcGlja2VyXHJcbiAgICAkKFwiLnRpbWVwaWNrZXJcIikudGltZXBpY2tlcih7XHJcbiAgICAgIHNob3dJbnB1dHM6IGZhbHNlXHJcbiAgICB9KTtcclxuXHR9KTtcclxuXHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybEZvcm1zRWRpdG9yJyxbZnVuY3Rpb24oKXtcclxuICBcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuXHQgIFx0Q0tFRElUT1IucmVwbGFjZSgnZWRpdG9yMScpO1xyXG5cdCAgICAvL2Jvb3RzdHJhcCBXWVNJSFRNTDUgLSB0ZXh0IGVkaXRvclxyXG5cdCAgICAkKFwiLnRleHRhcmVhXCIpLnd5c2lodG1sNSgpO1x0XHJcblx0fSk7XHJcblxyXG59XSk7IiwiY29uZmlnUm91dGVyLmNvbnRyb2xsZXIoJ2N0cmxUYWJsZXNEYXRhJyxbZnVuY3Rpb24oKXtcclxuICBcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICBcdFx0JChcIiNleGFtcGxlMVwiKS5EYXRhVGFibGUoKTtcclxuXHQgICAgJCgnI2V4YW1wbGUyJykuRGF0YVRhYmxlKHtcclxuXHQgICAgICBcInBhZ2luZ1wiOiB0cnVlLFxyXG5cdCAgICAgIFwibGVuZ3RoQ2hhbmdlXCI6IGZhbHNlLFxyXG5cdCAgICAgIFwic2VhcmNoaW5nXCI6IGZhbHNlLFxyXG5cdCAgICAgIFwib3JkZXJpbmdcIjogdHJ1ZSxcclxuXHQgICAgICBcImluZm9cIjogdHJ1ZSxcclxuXHQgICAgICBcImF1dG9XaWR0aFwiOiBmYWxzZVxyXG5cdCAgICB9KTtcclxuXHJcblx0fSk7XHJcblxyXG59XSk7IiwiY29uZmlnUm91dGVyLmNvbnRyb2xsZXIoJ2N0cmxVaVNsaWRlcicsW2Z1bmN0aW9uKCl7XHJcbiAgXHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICBcdC8qIEJPT1RTVFJBUCBTTElERVIgKi9cclxuXHQgICAgJCgnLnNsaWRlcicpLnNsaWRlcigpO1xyXG5cdH0pO1xyXG5cclxufV0pOyJdfQ==

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
configRouter.controller('ctrlUiSlider',[function(){
  	angular.element(document).ready(function(){
    	/* BOOTSTRAP SLIDER */
	    $('.slider').slider();
	});

}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXIuYmFzZS5qcyIsImNvbnRyb2xsZXIuY2hhcnRzLmNoYXJ0anMuanMiLCJjb250cm9sbGVyLmNoYXJ0cy5mbG90LmpzIiwiY29udHJvbGxlci5kYXNoYm9hcmQuanMiLCJjb250cm9sbGVyLmV4YW1wbGUuanMiLCJjb250cm9sbGVyLmZvcm1zLmFkdmFuY2VkLmpzIiwiY29udHJvbGxlci5mb3Jtcy5lZGl0b3IuanMiLCJjb250cm9sbGVyLnVpLnNsaWRlci5qcyJdLCJuYW1lcyI6WyJiYXNlQXBwIiwiYW5ndWxhciIsIm1vZHVsZSIsImNvbmZpZyIsIiRzdGF0ZVByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJzdGF0ZSIsInVybCIsInRlbXBsYXRlVXJsIiwiY29udHJvbGxlciIsImh0bWw1TW9kZSIsImNvbmZpZ1JvdXRlciIsImVsZW1lbnQiLCJkb2N1bWVudCIsInJlYWR5IiwiJCIsIkFkbWluTFRFIiwiaW5pdCIsImNzcyIsInNvcnRhYmxlIiwicGxhY2Vob2xkZXIiLCJjb25uZWN0V2l0aCIsImhhbmRsZSIsImZvcmNlUGxhY2Vob2xkZXJTaXplIiwiekluZGV4IiwiZGF0ZXJhbmdlcGlja2VyIiwicmFuZ2VzIiwiVG9kYXkiLCJtb21lbnQiLCJZZXN0ZXJkYXkiLCJzdWJ0cmFjdCIsIkxhc3QgNyBEYXlzIiwiTGFzdCAzMCBEYXlzIiwiVGhpcyBNb250aCIsInN0YXJ0T2YiLCJlbmRPZiIsIkxhc3QgTW9udGgiLCJzdGFydERhdGUiLCJlbmREYXRlIiwic3RhcnQiLCJlbmQiLCJ3aW5kb3ciLCJhbGVydCIsImZvcm1hdCIsInNsaW1TY3JvbGwiLCJoZWlnaHQiLCJkYXRlcGlja2VyIiwiYXJlYUNoYXJ0Q2FudmFzIiwiZ2V0IiwiZ2V0Q29udGV4dCIsImFyZWFDaGFydCIsIkNoYXJ0IiwiYXJlYUNoYXJ0RGF0YSIsImxhYmVscyIsImRhdGFzZXRzIiwibGFiZWwiLCJmaWxsQ29sb3IiLCJzdHJva2VDb2xvciIsInBvaW50Q29sb3IiLCJwb2ludFN0cm9rZUNvbG9yIiwicG9pbnRIaWdobGlnaHRGaWxsIiwicG9pbnRIaWdobGlnaHRTdHJva2UiLCJkYXRhIiwiYXJlYUNoYXJ0T3B0aW9ucyIsInNob3dTY2FsZSIsInNjYWxlU2hvd0dyaWRMaW5lcyIsInNjYWxlR3JpZExpbmVDb2xvciIsInNjYWxlR3JpZExpbmVXaWR0aCIsInNjYWxlU2hvd0hvcml6b250YWxMaW5lcyIsInNjYWxlU2hvd1ZlcnRpY2FsTGluZXMiLCJiZXppZXJDdXJ2ZSIsImJlemllckN1cnZlVGVuc2lvbiIsInBvaW50RG90IiwicG9pbnREb3RSYWRpdXMiLCJwb2ludERvdFN0cm9rZVdpZHRoIiwicG9pbnRIaXREZXRlY3Rpb25SYWRpdXMiLCJkYXRhc2V0U3Ryb2tlIiwiZGF0YXNldFN0cm9rZVdpZHRoIiwiZGF0YXNldEZpbGwiLCJsZWdlbmRUZW1wbGF0ZSIsIm1haW50YWluQXNwZWN0UmF0aW8iLCJyZXNwb25zaXZlIiwiTGluZSIsImxpbmVDaGFydENhbnZhcyIsImxpbmVDaGFydCIsImxpbmVDaGFydE9wdGlvbnMiLCJwaWVDaGFydENhbnZhcyIsInBpZUNoYXJ0IiwiUGllRGF0YSIsInZhbHVlIiwiY29sb3IiLCJoaWdobGlnaHQiLCJwaWVPcHRpb25zIiwic2VnbWVudFNob3dTdHJva2UiLCJzZWdtZW50U3Ryb2tlQ29sb3IiLCJzZWdtZW50U3Ryb2tlV2lkdGgiLCJwZXJjZW50YWdlSW5uZXJDdXRvdXQiLCJhbmltYXRpb25TdGVwcyIsImFuaW1hdGlvbkVhc2luZyIsImFuaW1hdGVSb3RhdGUiLCJhbmltYXRlU2NhbGUiLCJEb3VnaG51dCIsImJhckNoYXJ0Q2FudmFzIiwiYmFyQ2hhcnQiLCJiYXJDaGFydERhdGEiLCJiYXJDaGFydE9wdGlvbnMiLCJzY2FsZUJlZ2luQXRaZXJvIiwiYmFyU2hvd1N0cm9rZSIsImJhclN0cm9rZVdpZHRoIiwiYmFyVmFsdWVTcGFjaW5nIiwiYmFyRGF0YXNldFNwYWNpbmciLCJCYXIiLCJsYWJlbEZvcm1hdHRlciIsInNlcmllcyIsIk1hdGgiLCJyb3VuZCIsInBlcmNlbnQiLCJnZXRSYW5kb21EYXRhIiwibGVuZ3RoIiwic2xpY2UiLCJ0b3RhbFBvaW50cyIsInByZXYiLCJ5IiwicmFuZG9tIiwicHVzaCIsInJlcyIsImkiLCJ1cGRhdGUiLCJpbnRlcmFjdGl2ZV9wbG90Iiwic2V0RGF0YSIsImRyYXciLCJyZWFsdGltZSIsInNldFRpbWVvdXQiLCJ1cGRhdGVJbnRlcnZhbCIsInBsb3QiLCJncmlkIiwiYm9yZGVyQ29sb3IiLCJib3JkZXJXaWR0aCIsInRpY2tDb2xvciIsInNoYWRvd1NpemUiLCJsaW5lcyIsImZpbGwiLCJ5YXhpcyIsIm1pbiIsIm1heCIsInNob3ciLCJ4YXhpcyIsImNsaWNrIiwidGhpcyIsInNpbiIsImNvcyIsImxpbmVfZGF0YTEiLCJsaW5lX2RhdGEyIiwiaG92ZXJhYmxlIiwicG9pbnRzIiwicG9zaXRpb24iLCJkaXNwbGF5Iiwib3BhY2l0eSIsImFwcGVuZFRvIiwiYmluZCIsImV2ZW50IiwicG9zIiwiaXRlbSIsIngiLCJkYXRhcG9pbnQiLCJ0b0ZpeGVkIiwiaHRtbCIsInRvcCIsInBhZ2VZIiwibGVmdCIsInBhZ2VYIiwiZmFkZUluIiwiaGlkZSIsImFyZWFEYXRhIiwiYmFyX2RhdGEiLCJiYXJzIiwiYmFyV2lkdGgiLCJhbGlnbiIsIm1vZGUiLCJ0aWNrTGVuZ3RoIiwiZG9udXREYXRhIiwicGllIiwicmFkaXVzIiwiaW5uZXJSYWRpdXMiLCJmb3JtYXR0ZXIiLCJ0aHJlc2hvbGQiLCJsZWdlbmQiLCIkaHR0cCIsIiRzY29wZSIsImNmcExvYWRpbmdCYXIiLCJ0ZXN0IiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJzZWxlY3QyIiwiaW5wdXRtYXNrIiwidGltZVBpY2tlciIsInRpbWVQaWNrZXJJbmNyZW1lbnQiLCJhdXRvY2xvc2UiLCJpQ2hlY2siLCJjaGVja2JveENsYXNzIiwicmFkaW9DbGFzcyIsImNvbG9ycGlja2VyIiwidGltZXBpY2tlciIs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QSxRQUFBRixVQUNBSSxnQkFBQUosU0FBQUUsU0FBQSxHQUFBLFFBQUFGLFVBQ0FLLGNBQUFMLFNBQUFNLFFBQUEsU0FBQU4sU0FBQU8sTUFBQSxVQUNBQyxjQUFBUixTQUFBRSxTQUFBLEVBQUEsU0FBQUksUUFBQSxTQUFBTixTQUFBRSxTQUFBLEVBQUEsU0FBQUssTUFBQSxXQUVBRSxVQUFBVCxTQUFBRSxTQUFBLEdBQUEsUUFDQVEsUUFBQVYsVUFFQSxTQUFBVyxFQUFBQyxHQUNBekIsRUFBQSx1QkFBQXVKLEtBQUEvSCxFQUFBSSxPQUFBLGdCQUFBLE1BQUFILEVBQUFHLE9BQUEsbUJBS0E1QixFQUFBLGVBQUErQixZQUNBd0osV0FBQSxJQUlBdkwsRUFBQSwrREFBQXdMLFFBQ0FDLGNBQUEseUJBQ0FDLFdBQUEsd0JBR0ExTCxFQUFBLHVFQUFBd0wsUUFDQUMsY0FBQSx3QkFDQUMsV0FBQSx1QkFHQTFMLEVBQUEsaUVBQUF3TCxRQUNBQyxjQUFBLHVCQUNBQyxXQUFBLHNCQUlBMUwsRUFBQSxvQkFBQTJMLGNBRUEzTCxFQUFBLG9CQUFBMkwsY0FHQTNMLEVBQUEsZUFBQTRMLFlBQ0FDLFlBQUEsU0M5REFqTSxhQUFBRixXQUFBLG1CQUFBLFdBQ0FSLFFBQUFXLFFBQUFDLFVBQUFDLE1BQUEsV0FDQStMLFNBQUFDLFFBQUEsV0FFQS9MLEVBQUEsYUFBQWdNLGlCQ0pBcE0sYUFBQUYsV0FBQSxnQkFBQSxXQUNBUixRQUFBVyxRQUFBQyxVQUFBQyxNQUFBLFdBRUFDLEVBQUEsV0FBQWlNIiwiZmlsZSI6ImFwcC1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBiYXNlQXBwID0gYW5ndWxhci5tb2R1bGUoJ2Jhc2VBcHAnICwgWyd1aS5yb3V0ZXInLCduZ0FuaW1hdGUnLCdhbmd1bGFyLWxvYWRpbmctYmFyJywnY29uZmlnUm91dGVyJ10pOyBcclxuYmFzZUFwcC5jb25maWcoWyckc3RhdGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJyxmdW5jdGlvbigkc3RhdGVQcm92aWRlciwkbG9jYXRpb25Qcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UnICwge1xyXG5cdFx0dXJsIDogJycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvYXBwLmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlciA6ICdjdHJsQmFzZSdcclxuXHR9KTtcclxuXHQkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XHJcbn1dKTtcclxuXHJcbnZhciBjb25maWdSb3V0ZXIgPSBhbmd1bGFyLm1vZHVsZSgnY29uZmlnUm91dGVyJyAsIFsndWkucm91dGVyJ10pO1xyXG5jb25maWdSb3V0ZXIuY29uZmlnKFsnJHN0YXRlUHJvdmlkZXInICwgZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLmRhc2hib2FyZCcgLHtcclxuXHRcdHVybCA6ICcvJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy9kYXNoYm9hcmQuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyIDogJ2N0cmxEYXNoYm9hcmQnXHJcblx0fSk7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2Uud2lkZ2V0cycgLHtcclxuXHRcdHVybCA6ICcvd2lkZ2V0cycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvd2lkZ2V0cy5odG1sJ1xyXG5cdH0pO1xyXG5cdC8vIENoYXJ0XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UuY2hhcnRzLWNoYXJ0anMnICx7XHJcblx0XHR1cmwgOiAnL2NoYXJ0cy9jaGFydGpzJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy9jaGFydHMvY2hhcnRqcy5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybENoYXJ0c0NoYXJ0anMnXHJcblx0fSk7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UuY2hhcnRzLWZsb3QnICx7XHJcblx0XHR1cmwgOiAnL2NoYXJ0cy9mbG90JyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy9jaGFydHMvZmxvdC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybENoYXJ0c0Zsb3QnXHJcblx0fSk7XHJcblx0Ly8gVUkgRWxlbWVudFxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLnVpLWdlbmVyYWwnICx7XHJcblx0XHR1cmwgOiAnL3VpLWVsZW1lbnQvZ2VuZXJhbCcsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvdWkvZ2VuZXJhbC5odG1sJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLnVpLWljb25zJyAse1xyXG5cdFx0dXJsIDogJy91aS1lbGVtZW50L2ljb25zJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy91aS9pY29ucy5odG1sJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLnVpLWJ1dHRvbnMnICx7XHJcblx0XHR1cmwgOiAnL3VpLWVsZW1lbnQvYnV0dG9ucycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvdWkvYnV0dG9ucy5odG1sJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLnVpLXNsaWRlcnMnICx7XHJcblx0XHR1cmwgOiAnL3VpLWVsZW1lbnQvc2xpZGVycycsXHJcblx0XHR0ZW1wbGF0ZVVybCA6ICd0ZW1wbGF0ZXMvdWkvc2xpZGVycy5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybFVpU2xpZGVyJ1xyXG5cdH0pO1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLnVpLXRpbWVsaW5lJyAse1xyXG5cdFx0dXJsIDogJy91aS1lbGVtZW50L3RpbWVsaW5lJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy91aS90aW1lbGluZS5odG1sJ1xyXG5cdH0pO1xyXG5cdC8vIEZvcm0gRWxlbWVudFxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdiYXNlLmZvcm1zLWdlbmVyYWwnICx7XHJcblx0XHR1cmwgOiAnL2Zvcm1zL2dlbmVyYWwnLFxyXG5cdFx0dGVtcGxhdGVVcmwgOiAndGVtcGxhdGVzL2Zvcm1zL2dlbmVyYWwuaHRtbCdcclxuXHR9KTtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYmFzZS5mb3Jtcy1lZGl0b3JzJyAse1xyXG5cdFx0dXJsIDogJy9mb3Jtcy9lZGl0b3JzJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy9mb3Jtcy9lZGl0b3JzLmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlciA6ICdjdHJsRm9ybXNFZGl0b3InXHJcblx0fSk7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jhc2UuZm9ybXMtYWR2YW5jZWQnICx7XHJcblx0XHR1cmwgOiAnL2Zvcm1zL2FkdmFuY2VkJyxcclxuXHRcdHRlbXBsYXRlVXJsIDogJ3RlbXBsYXRlcy9mb3Jtcy9hZHZhbmNlZC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXIgOiAnY3RybEZvcm1zQWR2YW5jZWQnXHJcblx0fSk7XHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybEJhc2UnLFtmdW5jdGlvbigpe1xyXG4gIFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gIFx0XHQkLkFkbWluTFRFLmluaXQoKTsgLy8gY2FsbCBhZG1pbiBsdGUgZnVuY3Rpb25cclxuXHRcdCQoXCIuY29ubmVjdGVkU29ydGFibGUgLmJveC1oZWFkZXIsIC5jb25uZWN0ZWRTb3J0YWJsZSAubmF2LXRhYnMtY3VzdG9tXCIpLmNzcyhcImN1cnNvclwiLCBcIm1vdmVcIik7XHJcblxyXG5cdFx0Ly9qUXVlcnkgVUkgc29ydGFibGUgZm9yIHRoZSB0b2RvIGxpc3RcclxuXHRcdC8vTWFrZSB0aGUgZGFzaGJvYXJkIHdpZGdldHMgc29ydGFibGUgVXNpbmcganF1ZXJ5IFVJXHJcblx0XHQkKFwiLmNvbm5lY3RlZFNvcnRhYmxlXCIpLnNvcnRhYmxlKHtcclxuXHRcdFx0cGxhY2Vob2xkZXI6IFwic29ydC1oaWdobGlnaHRcIixcclxuXHRcdFx0Y29ubmVjdFdpdGg6IFwiLmNvbm5lY3RlZFNvcnRhYmxlXCIsXHJcblx0XHRcdGhhbmRsZTogXCIuYm94LWhlYWRlciwgLm5hdi10YWJzXCIsXHJcblx0XHRcdGZvcmNlUGxhY2Vob2xkZXJTaXplOiB0cnVlLFxyXG5cdFx0XHR6SW5kZXg6IDk5OTk5OVxyXG5cdFx0fSk7XHJcblx0XHQkKFwiLmNvbm5lY3RlZFNvcnRhYmxlIC5ib3gtaGVhZGVyLCAuY29ubmVjdGVkU29ydGFibGUgLm5hdi10YWJzLWN1c3RvbVwiKS5jc3MoXCJjdXJzb3JcIiwgXCJtb3ZlXCIpO1xyXG5cclxuXHRcdC8valF1ZXJ5IFVJIHNvcnRhYmxlIGZvciB0aGUgdG9kbyBsaXN0XHJcblx0XHQkKFwiLnRvZG8tbGlzdFwiKS5zb3J0YWJsZSh7XHJcblx0XHRcdHBsYWNlaG9sZGVyOiBcInNvcnQtaGlnaGxpZ2h0XCIsXHJcblx0XHRcdGhhbmRsZTogXCIuaGFuZGxlXCIsXHJcblx0XHRcdGZvcmNlUGxhY2Vob2xkZXJTaXplOiB0cnVlLFxyXG5cdFx0XHR6SW5kZXg6IDk5OTk5OVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0JCgnLmRhdGVyYW5nZScpLmRhdGVyYW5nZXBpY2tlcih7XHJcblx0XHRcdHJhbmdlczoge1xyXG5cdFx0XHQgICdUb2RheSc6IFttb21lbnQoKSwgbW9tZW50KCldLFxyXG5cdFx0XHQgICdZZXN0ZXJkYXknOiBbbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKSwgbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKV0sXHJcblx0XHRcdCAgJ0xhc3QgNyBEYXlzJzogW21vbWVudCgpLnN1YnRyYWN0KDYsICdkYXlzJyksIG1vbWVudCgpXSxcclxuXHRcdFx0ICAnTGFzdCAzMCBEYXlzJzogW21vbWVudCgpLnN1YnRyYWN0KDI5LCAnZGF5cycpLCBtb21lbnQoKV0sXHJcblx0XHRcdCAgJ1RoaXMgTW9udGgnOiBbbW9tZW50KCkuc3RhcnRPZignbW9udGgnKSwgbW9tZW50KCkuZW5kT2YoJ21vbnRoJyldLFxyXG5cdFx0XHQgICdMYXN0IE1vbnRoJzogW21vbWVudCgpLnN1YnRyYWN0KDEsICdtb250aCcpLnN0YXJ0T2YoJ21vbnRoJyksIG1vbWVudCgpLnN1YnRyYWN0KDEsICdtb250aCcpLmVuZE9mKCdtb250aCcpXVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRzdGFydERhdGU6IG1vbWVudCgpLnN1YnRyYWN0KDI5LCAnZGF5cycpLFxyXG5cdFx0XHRlbmREYXRlOiBtb21lbnQoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xyXG5cdFx0XHR3aW5kb3cuYWxlcnQoXCJZb3UgY2hvc2U6IFwiICsgc3RhcnQuZm9ybWF0KCdNTU1NIEQsIFlZWVknKSArICcgLSAnICsgZW5kLmZvcm1hdCgnTU1NTSBELCBZWVlZJykpO1xyXG5cdFx0fSk7XHJcblx0XHQvL1RoZSBDYWxlbmRlclxyXG5cdFx0Ly9TTElNU0NST0xMIEZPUiBDSEFUIFdJREdFVFxyXG5cdFx0JCgnI2NoYXQtYm94Jykuc2xpbVNjcm9sbCh7XHJcblx0XHRoZWlnaHQ6ICcyNTBweCdcclxuXHRcdH0pO1xyXG5cclxuXHRcdCQoXCIjY2FsZW5kYXJcIikuZGF0ZXBpY2tlcigpO1xyXG5cclxuXHR9KTtcclxuXHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybENoYXJ0c0NoYXJ0anMnLFtmdW5jdGlvbigpe1xyXG4gIFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gIFx0XHQvLyBHZXQgY29udGV4dCB3aXRoIGpRdWVyeSAtIHVzaW5nIGpRdWVyeSdzIC5nZXQoKSBtZXRob2QuXHJcblx0ICAgIHZhciBhcmVhQ2hhcnRDYW52YXMgPSAkKFwiI2FyZWFDaGFydFwiKS5nZXQoMCkuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdCAgICAvLyBUaGlzIHdpbGwgZ2V0IHRoZSBmaXJzdCByZXR1cm5lZCBub2RlIGluIHRoZSBqUXVlcnkgY29sbGVjdGlvbi5cclxuXHQgICAgdmFyIGFyZWFDaGFydCA9IG5ldyBDaGFydChhcmVhQ2hhcnRDYW52YXMpO1xyXG5cclxuXHQgICAgdmFyIGFyZWFDaGFydERhdGEgPSB7XHJcblx0ICAgICAgbGFiZWxzOiBbXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIl0sXHJcblx0ICAgICAgZGF0YXNldHM6IFtcclxuXHQgICAgICAgIHtcclxuXHQgICAgICAgICAgbGFiZWw6IFwiRWxlY3Ryb25pY3NcIixcclxuXHQgICAgICAgICAgZmlsbENvbG9yOiBcInJnYmEoMjEwLCAyMTQsIDIyMiwgMSlcIixcclxuXHQgICAgICAgICAgc3Ryb2tlQ29sb3I6IFwicmdiYSgyMTAsIDIxNCwgMjIyLCAxKVwiLFxyXG5cdCAgICAgICAgICBwb2ludENvbG9yOiBcInJnYmEoMjEwLCAyMTQsIDIyMiwgMSlcIixcclxuXHQgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogXCIjYzFjN2QxXCIsXHJcblx0ICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogXCIjZmZmXCIsXHJcblx0ICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiBcInJnYmEoMjIwLDIyMCwyMjAsMSlcIixcclxuXHQgICAgICAgICAgZGF0YTogWzY1LCA1OSwgODAsIDgxLCA1NiwgNTUsIDQwXVxyXG5cdCAgICAgICAgfSxcclxuXHQgICAgICAgIHtcclxuXHQgICAgICAgICAgbGFiZWw6IFwiRGlnaXRhbCBHb29kc1wiLFxyXG5cdCAgICAgICAgICBmaWxsQ29sb3I6IFwicmdiYSg2MCwxNDEsMTg4LDAuOSlcIixcclxuXHQgICAgICAgICAgc3Ryb2tlQ29sb3I6IFwicmdiYSg2MCwxNDEsMTg4LDAuOClcIixcclxuXHQgICAgICAgICAgcG9pbnRDb2xvcjogXCIjM2I4YmJhXCIsXHJcblx0ICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6IFwicmdiYSg2MCwxNDEsMTg4LDEpXCIsXHJcblx0ICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogXCIjZmZmXCIsXHJcblx0ICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiBcInJnYmEoNjAsMTQxLDE4OCwxKVwiLFxyXG5cdCAgICAgICAgICBkYXRhOiBbMjgsIDQ4LCA0MCwgMTksIDg2LCAyNywgOTBdXHJcblx0ICAgICAgICB9XHJcblx0ICAgICAgXVxyXG5cdCAgICB9O1xyXG5cclxuXHQgICAgdmFyIGFyZWFDaGFydE9wdGlvbnMgPSB7XHJcblx0ICAgICAgLy9Cb29sZWFuIC0gSWYgd2Ugc2hvdWxkIHNob3cgdGhlIHNjYWxlIGF0IGFsbFxyXG5cdCAgICAgIHNob3dTY2FsZTogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcclxuXHQgICAgICBzY2FsZVNob3dHcmlkTGluZXM6IGZhbHNlLFxyXG5cdCAgICAgIC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXHJcblx0ICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcclxuXHQgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXHJcblx0ICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGhvcml6b250YWwgbGluZXMgKGV4Y2VwdCBYIGF4aXMpXHJcblx0ICAgICAgc2NhbGVTaG93SG9yaXpvbnRhbExpbmVzOiB0cnVlLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyB2ZXJ0aWNhbCBsaW5lcyAoZXhjZXB0IFkgYXhpcylcclxuXHQgICAgICBzY2FsZVNob3dWZXJ0aWNhbExpbmVzOiB0cnVlLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIGxpbmUgaXMgY3VydmVkIGJldHdlZW4gcG9pbnRzXHJcblx0ICAgICAgYmV6aWVyQ3VydmU6IHRydWUsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBUZW5zaW9uIG9mIHRoZSBiZXppZXIgY3VydmUgYmV0d2VlbiBwb2ludHNcclxuXHQgICAgICBiZXppZXJDdXJ2ZVRlbnNpb246IDAuMyxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBkb3QgZm9yIGVhY2ggcG9pbnRcclxuXHQgICAgICBwb2ludERvdDogZmFsc2UsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBSYWRpdXMgb2YgZWFjaCBwb2ludCBkb3QgaW4gcGl4ZWxzXHJcblx0ICAgICAgcG9pbnREb3RSYWRpdXM6IDQsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBwb2ludCBkb3Qgc3Ryb2tlXHJcblx0ICAgICAgcG9pbnREb3RTdHJva2VXaWR0aDogMSxcclxuXHQgICAgICAvL051bWJlciAtIGFtb3VudCBleHRyYSB0byBhZGQgdG8gdGhlIHJhZGl1cyB0byBjYXRlciBmb3IgaGl0IGRldGVjdGlvbiBvdXRzaWRlIHRoZSBkcmF3biBwb2ludFxyXG5cdCAgICAgIHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzOiAyMCxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBzdHJva2UgZm9yIGRhdGFzZXRzXHJcblx0ICAgICAgZGF0YXNldFN0cm9rZTogdHJ1ZSxcclxuXHQgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIGRhdGFzZXQgc3Ryb2tlXHJcblx0ICAgICAgZGF0YXNldFN0cm9rZVdpZHRoOiAyLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gZmlsbCB0aGUgZGF0YXNldCB3aXRoIGEgY29sb3JcclxuXHQgICAgICBkYXRhc2V0RmlsbDogdHJ1ZSxcclxuXHQgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXHJcblx0ICAgICAgbGVnZW5kVGVtcGxhdGU6IFwiPHVsIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmRcXFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0ubGluZUNvbG9yJT5cXFwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPlwiLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIHdoZXRoZXIgdG8gbWFpbnRhaW4gdGhlIHN0YXJ0aW5nIGFzcGVjdCByYXRpbyBvciBub3Qgd2hlbiByZXNwb25zaXZlLCBpZiBzZXQgdG8gZmFsc2UsIHdpbGwgdGFrZSB1cCBlbnRpcmUgY29udGFpbmVyXHJcblx0ICAgICAgbWFpbnRhaW5Bc3BlY3RSYXRpbzogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSB3aGV0aGVyIHRvIG1ha2UgdGhlIGNoYXJ0IHJlc3BvbnNpdmUgdG8gd2luZG93IHJlc2l6aW5nXHJcblx0ICAgICAgcmVzcG9uc2l2ZTogdHJ1ZVxyXG5cdCAgICB9O1xyXG5cclxuXHQgICAgLy9DcmVhdGUgdGhlIGxpbmUgY2hhcnRcclxuXHQgICAgYXJlYUNoYXJ0LkxpbmUoYXJlYUNoYXJ0RGF0YSwgYXJlYUNoYXJ0T3B0aW9ucyk7XHJcblxyXG5cdCAgICAvLy0tLS0tLS0tLS0tLS1cclxuXHQgICAgLy8tIExJTkUgQ0hBUlQgLVxyXG5cdCAgICAvLy0tLS0tLS0tLS0tLS0tXHJcblx0ICAgIHZhciBsaW5lQ2hhcnRDYW52YXMgPSAkKFwiI2xpbmVDaGFydFwiKS5nZXQoMCkuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdCAgICB2YXIgbGluZUNoYXJ0ID0gbmV3IENoYXJ0KGxpbmVDaGFydENhbnZhcyk7XHJcblx0ICAgIHZhciBsaW5lQ2hhcnRPcHRpb25zID0gYXJlYUNoYXJ0T3B0aW9ucztcclxuXHQgICAgbGluZUNoYXJ0T3B0aW9ucy5kYXRhc2V0RmlsbCA9IGZhbHNlO1xyXG5cdCAgICBsaW5lQ2hhcnQuTGluZShhcmVhQ2hhcnREYXRhLCBsaW5lQ2hhcnRPcHRpb25zKTtcclxuXHJcblx0ICAgIC8vLS0tLS0tLS0tLS0tLVxyXG5cdCAgICAvLy0gUElFIENIQVJUIC1cclxuXHQgICAgLy8tLS0tLS0tLS0tLS0tXHJcblx0ICAgIC8vIEdldCBjb250ZXh0IHdpdGggalF1ZXJ5IC0gdXNpbmcgalF1ZXJ5J3MgLmdldCgpIG1ldGhvZC5cclxuXHQgICAgdmFyIHBpZUNoYXJ0Q2FudmFzID0gJChcIiNwaWVDaGFydFwiKS5nZXQoMCkuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdCAgICB2YXIgcGllQ2hhcnQgPSBuZXcgQ2hhcnQocGllQ2hhcnRDYW52YXMpO1xyXG5cdCAgICB2YXIgUGllRGF0YSA9IFtcclxuXHQgICAgICB7XHJcblx0ICAgICAgICB2YWx1ZTogNzAwLFxyXG5cdCAgICAgICAgY29sb3I6IFwiI2Y1Njk1NFwiLFxyXG5cdCAgICAgICAgaGlnaGxpZ2h0OiBcIiNmNTY5NTRcIixcclxuXHQgICAgICAgIGxhYmVsOiBcIkNocm9tZVwiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB7XHJcblx0ICAgICAgICB2YWx1ZTogNTAwLFxyXG5cdCAgICAgICAgY29sb3I6IFwiIzAwYTY1YVwiLFxyXG5cdCAgICAgICAgaGlnaGxpZ2h0OiBcIiMwMGE2NWFcIixcclxuXHQgICAgICAgIGxhYmVsOiBcIklFXCJcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHtcclxuXHQgICAgICAgIHZhbHVlOiA0MDAsXHJcblx0ICAgICAgICBjb2xvcjogXCIjZjM5YzEyXCIsXHJcblx0ICAgICAgICBoaWdobGlnaHQ6IFwiI2YzOWMxMlwiLFxyXG5cdCAgICAgICAgbGFiZWw6IFwiRmlyZUZveFwiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB7XHJcblx0ICAgICAgICB2YWx1ZTogNjAwLFxyXG5cdCAgICAgICAgY29sb3I6IFwiIzAwYzBlZlwiLFxyXG5cdCAgICAgICAgaGlnaGxpZ2h0OiBcIiMwMGMwZWZcIixcclxuXHQgICAgICAgIGxhYmVsOiBcIlNhZmFyaVwiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB7XHJcblx0ICAgICAgICB2YWx1ZTogMzAwLFxyXG5cdCAgICAgICAgY29sb3I6IFwiIzNjOGRiY1wiLFxyXG5cdCAgICAgICAgaGlnaGxpZ2h0OiBcIiMzYzhkYmNcIixcclxuXHQgICAgICAgIGxhYmVsOiBcIk9wZXJhXCJcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHtcclxuXHQgICAgICAgIHZhbHVlOiAxMDAsXHJcblx0ICAgICAgICBjb2xvcjogXCIjZDJkNmRlXCIsXHJcblx0ICAgICAgICBoaWdobGlnaHQ6IFwiI2QyZDZkZVwiLFxyXG5cdCAgICAgICAgbGFiZWw6IFwiTmF2aWdhdG9yXCJcclxuXHQgICAgICB9XHJcblx0ICAgIF07XHJcblx0ICAgIHZhciBwaWVPcHRpb25zID0ge1xyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2Ugc2hvdWxkIHNob3cgYSBzdHJva2Ugb24gZWFjaCBzZWdtZW50XHJcblx0ICAgICAgc2VnbWVudFNob3dTdHJva2U6IHRydWUsXHJcblx0ICAgICAgLy9TdHJpbmcgLSBUaGUgY29sb3VyIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcclxuXHQgICAgICBzZWdtZW50U3Ryb2tlQ29sb3I6IFwiI2ZmZlwiLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gVGhlIHdpZHRoIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcclxuXHQgICAgICBzZWdtZW50U3Ryb2tlV2lkdGg6IDIsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBUaGUgcGVyY2VudGFnZSBvZiB0aGUgY2hhcnQgdGhhdCB3ZSBjdXQgb3V0IG9mIHRoZSBtaWRkbGVcclxuXHQgICAgICBwZXJjZW50YWdlSW5uZXJDdXRvdXQ6IDUwLCAvLyBUaGlzIGlzIDAgZm9yIFBpZSBjaGFydHNcclxuXHQgICAgICAvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcclxuXHQgICAgICBhbmltYXRpb25TdGVwczogMTAwLFxyXG5cdCAgICAgIC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3RcclxuXHQgICAgICBhbmltYXRpb25FYXNpbmc6IFwiZWFzZU91dEJvdW5jZVwiLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSB0aGUgcm90YXRpb24gb2YgdGhlIERvdWdobnV0XHJcblx0ICAgICAgYW5pbWF0ZVJvdGF0ZTogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgc2NhbGluZyB0aGUgRG91Z2hudXQgZnJvbSB0aGUgY2VudHJlXHJcblx0ICAgICAgYW5pbWF0ZVNjYWxlOiBmYWxzZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSB3aGV0aGVyIHRvIG1ha2UgdGhlIGNoYXJ0IHJlc3BvbnNpdmUgdG8gd2luZG93IHJlc2l6aW5nXHJcblx0ICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcclxuXHQgICAgICAvLyBCb29sZWFuIC0gd2hldGhlciB0byBtYWludGFpbiB0aGUgc3RhcnRpbmcgYXNwZWN0IHJhdGlvIG9yIG5vdCB3aGVuIHJlc3BvbnNpdmUsIGlmIHNldCB0byBmYWxzZSwgd2lsbCB0YWtlIHVwIGVudGlyZSBjb250YWluZXJcclxuXHQgICAgICBtYWludGFpbkFzcGVjdFJhdGlvOiB0cnVlLFxyXG5cdCAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcclxuXHQgICAgICBsZWdlbmRUZW1wbGF0ZTogXCI8dWwgY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZFxcXCI+PCUgZm9yICh2YXIgaT0wOyBpPHNlZ21lbnRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlxcXCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+XCJcclxuXHQgICAgfTtcclxuXHQgICAgLy9DcmVhdGUgcGllIG9yIGRvdWhudXQgY2hhcnRcclxuXHQgICAgLy8gWW91IGNhbiBzd2l0Y2ggYmV0d2VlbiBwaWUgYW5kIGRvdWhudXQgdXNpbmcgdGhlIG1ldGhvZCBiZWxvdy5cclxuXHQgICAgcGllQ2hhcnQuRG91Z2hudXQoUGllRGF0YSwgcGllT3B0aW9ucyk7XHJcblxyXG5cdCAgICAvLy0tLS0tLS0tLS0tLS1cclxuXHQgICAgLy8tIEJBUiBDSEFSVCAtXHJcblx0ICAgIC8vLS0tLS0tLS0tLS0tLVxyXG5cdCAgICB2YXIgYmFyQ2hhcnRDYW52YXMgPSAkKFwiI2JhckNoYXJ0XCIpLmdldCgwKS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblx0ICAgIHZhciBiYXJDaGFydCA9IG5ldyBDaGFydChiYXJDaGFydENhbnZhcyk7XHJcblx0ICAgIHZhciBiYXJDaGFydERhdGEgPSBhcmVhQ2hhcnREYXRhO1xyXG5cdCAgICBiYXJDaGFydERhdGEuZGF0YXNldHNbMV0uZmlsbENvbG9yID0gXCIjMDBhNjVhXCI7XHJcblx0ICAgIGJhckNoYXJ0RGF0YS5kYXRhc2V0c1sxXS5zdHJva2VDb2xvciA9IFwiIzAwYTY1YVwiO1xyXG5cdCAgICBiYXJDaGFydERhdGEuZGF0YXNldHNbMV0ucG9pbnRDb2xvciA9IFwiIzAwYTY1YVwiO1xyXG5cdCAgICB2YXIgYmFyQ2hhcnRPcHRpb25zID0ge1xyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcclxuXHQgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxyXG5cdCAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcclxuXHQgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xyXG5cdCAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcclxuXHQgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXHJcblx0ICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxyXG5cdCAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBob3Jpem9udGFsIGxpbmVzIChleGNlcHQgWCBheGlzKVxyXG5cdCAgICAgIHNjYWxlU2hvd0hvcml6b250YWxMaW5lczogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgdmVydGljYWwgbGluZXMgKGV4Y2VwdCBZIGF4aXMpXHJcblx0ICAgICAgc2NhbGVTaG93VmVydGljYWxMaW5lczogdHJ1ZSxcclxuXHQgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxyXG5cdCAgICAgIGJhclNob3dTdHJva2U6IHRydWUsXHJcblx0ICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxyXG5cdCAgICAgIGJhclN0cm9rZVdpZHRoOiAyLFxyXG5cdCAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xyXG5cdCAgICAgIGJhclZhbHVlU3BhY2luZzogNSxcclxuXHQgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXHJcblx0ICAgICAgYmFyRGF0YXNldFNwYWNpbmc6IDEsXHJcblx0ICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxyXG5cdCAgICAgIGxlZ2VuZFRlbXBsYXRlOiBcIjx1bCBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kXFxcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XFxcIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD5cIixcclxuXHQgICAgICAvL0Jvb2xlYW4gLSB3aGV0aGVyIHRvIG1ha2UgdGhlIGNoYXJ0IHJlc3BvbnNpdmVcclxuXHQgICAgICByZXNwb25zaXZlOiB0cnVlLFxyXG5cdCAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IHRydWVcclxuXHQgICAgfTtcclxuXHJcblx0ICAgIGJhckNoYXJ0T3B0aW9ucy5kYXRhc2V0RmlsbCA9IGZhbHNlO1xyXG5cdCAgICBiYXJDaGFydC5CYXIoYmFyQ2hhcnREYXRhLCBiYXJDaGFydE9wdGlvbnMpO1xyXG5cdH0pO1xyXG59XSk7IiwiY29uZmlnUm91dGVyLmNvbnRyb2xsZXIoJ2N0cmxDaGFydHNGbG90JyxbZnVuY3Rpb24oKXtcclxuXHQvLyBhbGVydCgnYScpO1xyXG4gIFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG5cdCAgICAvKlxyXG5cdCAgICAgKiBGbG90IEludGVyYWN0aXZlIENoYXJ0XHJcblx0ICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0ICAgICAqL1xyXG5cdCAgICAvLyBXZSB1c2UgYW4gaW5saW5lIGRhdGEgc291cmNlIGluIHRoZSBleGFtcGxlLCB1c3VhbGx5IGRhdGEgd291bGRcclxuXHQgICAgLy8gYmUgZmV0Y2hlZCBmcm9tIGEgc2VydmVyXHJcblx0ICAgIHZhciBkYXRhID0gW10sIHRvdGFsUG9pbnRzID0gMTAwO1xyXG5cclxuXHQgICAgZnVuY3Rpb24gZ2V0UmFuZG9tRGF0YSgpIHtcclxuXHJcblx0ICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMClcclxuXHQgICAgICAgIGRhdGEgPSBkYXRhLnNsaWNlKDEpO1xyXG5cclxuXHQgICAgICAvLyBEbyBhIHJhbmRvbSB3YWxrXHJcblx0ICAgICAgd2hpbGUgKGRhdGEubGVuZ3RoIDwgdG90YWxQb2ludHMpIHtcclxuXHJcblx0ICAgICAgICB2YXIgcHJldiA9IGRhdGEubGVuZ3RoID4gMCA/IGRhdGFbZGF0YS5sZW5ndGggLSAxXSA6IDUwLFxyXG5cdCAgICAgICAgICAgIHkgPSBwcmV2ICsgTWF0aC5yYW5kb20oKSAqIDEwIC0gNTtcclxuXHJcblx0ICAgICAgICBpZiAoeSA8IDApIHtcclxuXHQgICAgICAgICAgeSA9IDA7XHJcblx0ICAgICAgICB9IGVsc2UgaWYgKHkgPiAxMDApIHtcclxuXHQgICAgICAgICAgeSA9IDEwMDtcclxuXHQgICAgICAgIH1cclxuXHJcblx0ICAgICAgICBkYXRhLnB1c2goeSk7XHJcblx0ICAgICAgfVxyXG5cclxuXHQgICAgICAvLyBaaXAgdGhlIGdlbmVyYXRlZCB5IHZhbHVlcyB3aXRoIHRoZSB4IHZhbHVlc1xyXG5cdCAgICAgIHZhciByZXMgPSBbXTtcclxuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyArK2kpIHtcclxuXHQgICAgICAgIHJlcy5wdXNoKFtpLCBkYXRhW2ldXSk7XHJcblx0ICAgICAgfVxyXG5cclxuXHQgICAgICByZXR1cm4gcmVzO1xyXG5cdCAgICB9XHJcblxyXG5cdCAgICB2YXIgaW50ZXJhY3RpdmVfcGxvdCA9ICQucGxvdChcIiNpbnRlcmFjdGl2ZVwiLCBbZ2V0UmFuZG9tRGF0YSgpXSwge1xyXG5cdCAgICAgIGdyaWQ6IHtcclxuXHQgICAgICAgIGJvcmRlckNvbG9yOiBcIiNmM2YzZjNcIixcclxuXHQgICAgICAgIGJvcmRlcldpZHRoOiAxLFxyXG5cdCAgICAgICAgdGlja0NvbG9yOiBcIiNmM2YzZjNcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgc2VyaWVzOiB7XHJcblx0ICAgICAgICBzaGFkb3dTaXplOiAwLCAvLyBEcmF3aW5nIGlzIGZhc3RlciB3aXRob3V0IHNoYWRvd3NcclxuXHQgICAgICAgIGNvbG9yOiBcIiMzYzhkYmNcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgbGluZXM6IHtcclxuXHQgICAgICAgIGZpbGw6IHRydWUsIC8vQ29udmVydHMgdGhlIGxpbmUgY2hhcnQgdG8gYXJlYSBjaGFydFxyXG5cdCAgICAgICAgY29sb3I6IFwiIzNjOGRiY1wiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB5YXhpczoge1xyXG5cdCAgICAgICAgbWluOiAwLFxyXG5cdCAgICAgICAgbWF4OiAxMDAsXHJcblx0ICAgICAgICBzaG93OiB0cnVlXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB4YXhpczoge1xyXG5cdCAgICAgICAgc2hvdzogdHJ1ZVxyXG5cdCAgICAgIH1cclxuXHQgICAgfSk7XHJcblxyXG5cdCAgICB2YXIgdXBkYXRlSW50ZXJ2YWwgPSA1MDA7IC8vRmV0Y2ggZGF0YSBldmVyIHggbWlsbGlzZWNvbmRzXHJcblx0ICAgIHZhciByZWFsdGltZSA9IFwib25cIjsgLy9JZiA9PSB0byBvbiB0aGVuIGZldGNoIGRhdGEgZXZlcnkgeCBzZWNvbmRzLiBlbHNlIHN0b3AgZmV0Y2hpbmdcclxuXHQgICAgZnVuY3Rpb24gdXBkYXRlKCkge1xyXG5cclxuXHQgICAgICBpbnRlcmFjdGl2ZV9wbG90LnNldERhdGEoW2dldFJhbmRvbURhdGEoKV0pO1xyXG5cclxuXHQgICAgICAvLyBTaW5jZSB0aGUgYXhlcyBkb24ndCBjaGFuZ2UsIHdlIGRvbid0IG5lZWQgdG8gY2FsbCBwbG90LnNldHVwR3JpZCgpXHJcblx0ICAgICAgaW50ZXJhY3RpdmVfcGxvdC5kcmF3KCk7XHJcblx0ICAgICAgaWYgKHJlYWx0aW1lID09PSBcIm9uXCIpXHJcblx0ICAgICAgICBzZXRUaW1lb3V0KHVwZGF0ZSwgdXBkYXRlSW50ZXJ2YWwpO1xyXG5cdCAgICB9XHJcblxyXG5cdCAgICAvL0lOSVRJQUxJWkUgUkVBTFRJTUUgREFUQSBGRVRDSElOR1xyXG5cdCAgICBpZiAocmVhbHRpbWUgPT09IFwib25cIikge1xyXG5cdCAgICAgIHVwZGF0ZSgpO1xyXG5cdCAgICB9XHJcblx0ICAgIC8vUkVBTFRJTUUgVE9HR0xFXHJcblx0ICAgICQoXCIjcmVhbHRpbWUgLmJ0blwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcblx0ICAgICAgaWYgKCQodGhpcykuZGF0YShcInRvZ2dsZVwiKSA9PT0gXCJvblwiKSB7XHJcblx0ICAgICAgICByZWFsdGltZSA9IFwib25cIjtcclxuXHQgICAgICB9XHJcblx0ICAgICAgZWxzZSB7XHJcblx0ICAgICAgICByZWFsdGltZSA9IFwib2ZmXCI7XHJcblx0ICAgICAgfVxyXG5cdCAgICAgIHVwZGF0ZSgpO1xyXG5cdCAgICB9KTtcclxuXHQgICAgLypcclxuXHQgICAgICogRU5EIElOVEVSQUNUSVZFIENIQVJUXHJcblx0ICAgICAqL1xyXG5cclxuXHJcblx0ICAgIC8qXHJcblx0ICAgICAqIExJTkUgQ0hBUlRcclxuXHQgICAgICogLS0tLS0tLS0tLVxyXG5cdCAgICAgKi9cclxuXHQgICAgLy9MSU5FIHJhbmRvbWx5IGdlbmVyYXRlZCBkYXRhXHJcblxyXG5cdCAgICB2YXIgc2luID0gW10sIGNvcyA9IFtdO1xyXG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE0OyBpICs9IDAuNSkge1xyXG5cdCAgICAgIHNpbi5wdXNoKFtpLCBNYXRoLnNpbihpKV0pO1xyXG5cdCAgICAgIGNvcy5wdXNoKFtpLCBNYXRoLmNvcyhpKV0pO1xyXG5cdCAgICB9XHJcblx0ICAgIHZhciBsaW5lX2RhdGExID0ge1xyXG5cdCAgICAgIGRhdGE6IHNpbixcclxuXHQgICAgICBjb2xvcjogXCIjM2M4ZGJjXCJcclxuXHQgICAgfTtcclxuXHQgICAgdmFyIGxpbmVfZGF0YTIgPSB7XHJcblx0ICAgICAgZGF0YTogY29zLFxyXG5cdCAgICAgIGNvbG9yOiBcIiMwMGMwZWZcIlxyXG5cdCAgICB9O1xyXG5cdCAgICAkLnBsb3QoXCIjbGluZS1jaGFydFwiLCBbbGluZV9kYXRhMSwgbGluZV9kYXRhMl0sIHtcclxuXHQgICAgICBncmlkOiB7XHJcblx0ICAgICAgICBob3ZlcmFibGU6IHRydWUsXHJcblx0ICAgICAgICBib3JkZXJDb2xvcjogXCIjZjNmM2YzXCIsXHJcblx0ICAgICAgICBib3JkZXJXaWR0aDogMSxcclxuXHQgICAgICAgIHRpY2tDb2xvcjogXCIjZjNmM2YzXCJcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHNlcmllczoge1xyXG5cdCAgICAgICAgc2hhZG93U2l6ZTogMCxcclxuXHQgICAgICAgIGxpbmVzOiB7XHJcblx0ICAgICAgICAgIHNob3c6IHRydWVcclxuXHQgICAgICAgIH0sXHJcblx0ICAgICAgICBwb2ludHM6IHtcclxuXHQgICAgICAgICAgc2hvdzogdHJ1ZVxyXG5cdCAgICAgICAgfVxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgbGluZXM6IHtcclxuXHQgICAgICAgIGZpbGw6IGZhbHNlLFxyXG5cdCAgICAgICAgY29sb3I6IFtcIiMzYzhkYmNcIiwgXCIjZjU2OTU0XCJdXHJcblx0ICAgICAgfSxcclxuXHQgICAgICB5YXhpczoge1xyXG5cdCAgICAgICAgc2hvdzogdHJ1ZSxcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHhheGlzOiB7XHJcblx0ICAgICAgICBzaG93OiB0cnVlXHJcblx0ICAgICAgfVxyXG5cdCAgICB9KTtcclxuXHQgICAgLy9Jbml0aWFsaXplIHRvb2x0aXAgb24gaG92ZXJcclxuXHQgICAgJCgnPGRpdiBjbGFzcz1cInRvb2x0aXAtaW5uZXJcIiBpZD1cImxpbmUtY2hhcnQtdG9vbHRpcFwiPjwvZGl2PicpLmNzcyh7XHJcblx0ICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcclxuXHQgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcclxuXHQgICAgICBvcGFjaXR5OiAwLjhcclxuXHQgICAgfSkuYXBwZW5kVG8oXCJib2R5XCIpO1xyXG5cdCAgICAkKFwiI2xpbmUtY2hhcnRcIikuYmluZChcInBsb3Rob3ZlclwiLCBmdW5jdGlvbiAoZXZlbnQsIHBvcywgaXRlbSkge1xyXG5cclxuXHQgICAgICBpZiAoaXRlbSkge1xyXG5cdCAgICAgICAgdmFyIHggPSBpdGVtLmRhdGFwb2ludFswXS50b0ZpeGVkKDIpLFxyXG5cdCAgICAgICAgICAgIHkgPSBpdGVtLmRhdGFwb2ludFsxXS50b0ZpeGVkKDIpO1xyXG5cclxuXHQgICAgICAgICQoXCIjbGluZS1jaGFydC10b29sdGlwXCIpLmh0bWwoaXRlbS5zZXJpZXMubGFiZWwgKyBcIiBvZiBcIiArIHggKyBcIiA9IFwiICsgeSlcclxuXHQgICAgICAgICAgICAuY3NzKHt0b3A6IGl0ZW0ucGFnZVkgKyA1LCBsZWZ0OiBpdGVtLnBhZ2VYICsgNX0pXHJcblx0ICAgICAgICAgICAgLmZhZGVJbigyMDApO1xyXG5cdCAgICAgIH0gZWxzZSB7XHJcblx0ICAgICAgICAkKFwiI2xpbmUtY2hhcnQtdG9vbHRpcFwiKS5oaWRlKCk7XHJcblx0ICAgICAgfVxyXG5cclxuXHQgICAgfSk7XHJcblx0ICAgIC8qIEVORCBMSU5FIENIQVJUICovXHJcblxyXG5cdCAgICAvKlxyXG5cdCAgICAgKiBGVUxMIFdJRFRIIFNUQVRJQyBBUkVBIENIQVJUXHJcblx0ICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tXHJcblx0ICAgICAqL1xyXG5cdCAgICB2YXIgYXJlYURhdGEgPSBbWzIsIDg4LjBdLCBbMywgOTMuM10sIFs0LCAxMDIuMF0sIFs1LCAxMDguNV0sIFs2LCAxMTUuN10sIFs3LCAxMTUuNl0sXHJcblx0ICAgICAgWzgsIDEyNC42XSwgWzksIDEzMC4zXSwgWzEwLCAxMzQuM10sIFsxMSwgMTQxLjRdLCBbMTIsIDE0Ni41XSwgWzEzLCAxNTEuN10sIFsxNCwgMTU5LjldLFxyXG5cdCAgICAgIFsxNSwgMTY1LjRdLCBbMTYsIDE2Ny44XSwgWzE3LCAxNjguN10sIFsxOCwgMTY5LjVdLCBbMTksIDE2OC4wXV07XHJcblx0ICAgICQucGxvdChcIiNhcmVhLWNoYXJ0XCIsIFthcmVhRGF0YV0sIHtcclxuXHQgICAgICBncmlkOiB7XHJcblx0ICAgICAgICBib3JkZXJXaWR0aDogMFxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgc2VyaWVzOiB7XHJcblx0ICAgICAgICBzaGFkb3dTaXplOiAwLCAvLyBEcmF3aW5nIGlzIGZhc3RlciB3aXRob3V0IHNoYWRvd3NcclxuXHQgICAgICAgIGNvbG9yOiBcIiMwMGMwZWZcIlxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgbGluZXM6IHtcclxuXHQgICAgICAgIGZpbGw6IHRydWUgLy9Db252ZXJ0cyB0aGUgbGluZSBjaGFydCB0byBhcmVhIGNoYXJ0XHJcblx0ICAgICAgfSxcclxuXHQgICAgICB5YXhpczoge1xyXG5cdCAgICAgICAgc2hvdzogZmFsc2VcclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHhheGlzOiB7XHJcblx0ICAgICAgICBzaG93OiBmYWxzZVxyXG5cdCAgICAgIH1cclxuXHQgICAgfSk7XHJcblxyXG5cdCAgICAvKiBFTkQgQVJFQSBDSEFSVCAqL1xyXG5cclxuXHQgICAgLypcclxuXHQgICAgICogQkFSIENIQVJUXHJcblx0ICAgICAqIC0tLS0tLS0tLVxyXG5cdCAgICAgKi9cclxuXHJcblx0ICAgIHZhciBiYXJfZGF0YSA9IHtcclxuXHQgICAgICBkYXRhOiBbW1wiSmFudWFyeVwiLCAxMF0sIFtcIkZlYnJ1YXJ5XCIsIDhdLCBbXCJNYXJjaFwiLCA0XSwgW1wiQXByaWxcIiwgMTNdLCBbXCJNYXlcIiwgMTddLCBbXCJKdW5lXCIsIDldXSxcclxuXHQgICAgICBjb2xvcjogXCIjM2M4ZGJjXCJcclxuXHQgICAgfTtcclxuXHQgICAgJC5wbG90KFwiI2Jhci1jaGFydFwiLCBbYmFyX2RhdGFdLCB7XHJcblx0ICAgICAgZ3JpZDoge1xyXG5cdCAgICAgICAgYm9yZGVyV2lkdGg6IDEsXHJcblx0ICAgICAgICBib3JkZXJDb2xvcjogXCIjZjNmM2YzXCIsXHJcblx0ICAgICAgICB0aWNrQ29sb3I6IFwiI2YzZjNmM1wiXHJcblx0ICAgICAgfSxcclxuXHQgICAgICBzZXJpZXM6IHtcclxuXHQgICAgICAgIGJhcnM6IHtcclxuXHQgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuXHQgICAgICAgICAgYmFyV2lkdGg6IDAuNSxcclxuXHQgICAgICAgICAgYWxpZ246IFwiY2VudGVyXCJcclxuXHQgICAgICAgIH1cclxuXHQgICAgICB9LFxyXG5cdCAgICAgIHhheGlzOiB7XHJcblx0ICAgICAgICBtb2RlOiBcImNhdGVnb3JpZXNcIixcclxuXHQgICAgICAgIHRpY2tMZW5ndGg6IDBcclxuXHQgICAgICB9XHJcblx0ICAgIH0pO1xyXG5cdCAgICAvKiBFTkQgQkFSIENIQVJUICovXHJcblxyXG5cdCAgICAvKlxyXG5cdCAgICAgKiBET05VVCBDSEFSVFxyXG5cdCAgICAgKiAtLS0tLS0tLS0tLVxyXG5cdCAgICAgKi9cclxuXHJcblx0ICAgIHZhciBkb251dERhdGEgPSBbXHJcblx0ICAgICAge2xhYmVsOiBcIlNlcmllczJcIiwgZGF0YTogMzAsIGNvbG9yOiBcIiMzYzhkYmNcIn0sXHJcblx0ICAgICAge2xhYmVsOiBcIlNlcmllczNcIiwgZGF0YTogMjAsIGNvbG9yOiBcIiMwMDczYjdcIn0sXHJcblx0ICAgICAge2xhYmVsOiBcIlNlcmllczRcIiwgZGF0YTogNTAsIGNvbG9yOiBcIiMwMGMwZWZcIn1cclxuXHQgICAgXTtcclxuXHQgICAgJC5wbG90KFwiI2RvbnV0LWNoYXJ0XCIsIGRvbnV0RGF0YSwge1xyXG5cdCAgICAgIHNlcmllczoge1xyXG5cdCAgICAgICAgcGllOiB7XHJcblx0ICAgICAgICAgIHNob3c6IHRydWUsXHJcblx0ICAgICAgICAgIHJhZGl1czogMSxcclxuXHQgICAgICAgICAgaW5uZXJSYWRpdXM6IDAuNSxcclxuXHQgICAgICAgICAgbGFiZWw6IHtcclxuXHQgICAgICAgICAgICBzaG93OiB0cnVlLFxyXG5cdCAgICAgICAgICAgIHJhZGl1czogMiAvIDMsXHJcblx0ICAgICAgICAgICAgZm9ybWF0dGVyOiBsYWJlbEZvcm1hdHRlcixcclxuXHQgICAgICAgICAgICB0aHJlc2hvbGQ6IDAuMVxyXG5cdCAgICAgICAgICB9XHJcblxyXG5cdCAgICAgICAgfVxyXG5cdCAgICAgIH0sXHJcblx0ICAgICAgbGVnZW5kOiB7XHJcblx0ICAgICAgICBzaG93OiBmYWxzZVxyXG5cdCAgICAgIH1cclxuXHQgICAgfSk7XHJcblx0ICAgIC8qXHJcblx0ICAgICAqIEVORCBET05VVCBDSEFSVFxyXG5cdCAgICAgKi9cclxuXHJcblx0fSk7XHJcbiAgXHRmdW5jdGlvbiBsYWJlbEZvcm1hdHRlcihsYWJlbCwgc2VyaWVzKSB7XHJcbiAgICBcdHJldHVybiAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxM3B4OyB0ZXh0LWFsaWduOmNlbnRlcjsgcGFkZGluZzoycHg7IGNvbG9yOiAjZmZmOyBmb250LXdlaWdodDogNjAwO1wiPidcclxuICAgICAgICArIGxhYmVsXHJcbiAgICAgICAgKyBcIjxicj5cIlxyXG4gICAgICAgICsgTWF0aC5yb3VuZChzZXJpZXMucGVyY2VudCkgKyBcIiU8L2Rpdj5cIjtcclxuICBcdH1cclxuXHJcbn1dKTsiLCJiYXNlQXBwLmNvbnRyb2xsZXIoJ2N0cmxEYXNoYm9hcmQnLFsnJGh0dHAnLCckc2NvcGUnLCdjZnBMb2FkaW5nQmFyJyxmdW5jdGlvbigkaHR0cCwkc2NvcGUsY2ZwTG9hZGluZ0Jhcil7XHJcblx0JHNjb3BlLnRlc3QgPSBmdW5jdGlvbigpe1xyXG4gICAgXHQvLyBhbGVydCgnYScpXHJcbiAgICBcdGNmcExvYWRpbmdCYXIuc3RhcnQoKVxyXG4gIFx0fVxyXG4gIFx0JGh0dHAuZ2V0KFwiaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL2dhbWluZy5qc29uP2xpbWl0PTEwMCZqc29ucD1hbmd1bGFyLmNhbGxiYWNrcy5fMVwiKVxyXG4gIFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuICBcdFx0Y29uc29sZS5sb2cocmVzKVxyXG4gIFx0fSk7XHJcbiAgXHQvLyBjb25zb2xlLmxvZygnYScpXHJcblx0Ly9NYWtlIHRoZSBkYXNoYm9hcmQgd2lkZ2V0cyBzb3J0YWJsZSBVc2luZyBqcXVlcnkgVUlcclxuICBcclxuICBcclxufV0pOyIsImNvbmZpZ1JvdXRlci5jb250cm9sbGVyKCdjdHJsRXhhbXBsZScsW2Z1bmN0aW9uKCl7XHJcbiAgXHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgXHRcclxuXHJcblx0fSk7XHJcblxyXG59XSk7IiwiY29uZmlnUm91dGVyLmNvbnRyb2xsZXIoJ2N0cmxGb3Jtc0FkdmFuY2VkJyxbZnVuY3Rpb24oKXtcclxuICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgXHQkKFwiLnNlbGVjdDJcIikuc2VsZWN0MigpO1xyXG5cclxuICAgIC8vRGF0ZW1hc2sgZGQvbW0veXl5eVxyXG4gICAgJChcIiNkYXRlbWFza1wiKS5pbnB1dG1hc2soXCJkZC9tbS95eXl5XCIsIHtcInBsYWNlaG9sZGVyXCI6IFwiZGQvbW0veXl5eVwifSk7XHJcbiAgICAvL0RhdGVtYXNrMiBtbS9kZC95eXl5XHJcbiAgICAkKFwiI2RhdGVtYXNrMlwiKS5pbnB1dG1hc2soXCJtbS9kZC95eXl5XCIsIHtcInBsYWNlaG9sZGVyXCI6IFwibW0vZGQveXl5eVwifSk7XHJcbiAgICAvL01vbmV5IEV1cm9cclxuICAgICQoXCJbZGF0YS1tYXNrXVwiKS5pbnB1dG1hc2soKTtcclxuXHJcbiAgICAvL0RhdGUgcmFuZ2UgcGlja2VyXHJcbiAgICAkKCcjcmVzZXJ2YXRpb24nKS5kYXRlcmFuZ2VwaWNrZXIoKTtcclxuICAgIC8vRGF0ZSByYW5nZSBwaWNrZXIgd2l0aCB0aW1lIHBpY2tlclxyXG4gICAgJCgnI3Jlc2VydmF0aW9udGltZScpLmRhdGVyYW5nZXBpY2tlcih7dGltZVBpY2tlcjogdHJ1ZSwgdGltZVBpY2tlckluY3JlbWVudDogMzAsIGZvcm1hdDogJ01NL0REL1lZWVkgaDptbSBBJ30pO1xyXG4gICAgLy9EYXRlIHJhbmdlIGFzIGEgYnV0dG9uXHJcbiAgICAkKCcjZGF0ZXJhbmdlLWJ0bicpLmRhdGVyYW5nZXBpY2tlcihcclxuICAgICAgICB7XHJcbiAgICAgICAgICByYW5nZXM6IHtcclxuICAgICAgICAgICAgJ1RvZGF5JzogW21vbWVudCgpLCBtb21lbnQoKV0sXHJcbiAgICAgICAgICAgICdZZXN0ZXJkYXknOiBbbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKSwgbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKV0sXHJcbiAgICAgICAgICAgICdMYXN0IDcgRGF5cyc6IFttb21lbnQoKS5zdWJ0cmFjdCg2LCAnZGF5cycpLCBtb21lbnQoKV0sXHJcbiAgICAgICAgICAgICdMYXN0IDMwIERheXMnOiBbbW9tZW50KCkuc3VidHJhY3QoMjksICdkYXlzJyksIG1vbWVudCgpXSxcclxuICAgICAgICAgICAgJ1RoaXMgTW9udGgnOiBbbW9tZW50KCkuc3RhcnRPZignbW9udGgnKSwgbW9tZW50KCkuZW5kT2YoJ21vbnRoJyldLFxyXG4gICAgICAgICAgICAnTGFzdCBNb250aCc6IFttb21lbnQoKS5zdWJ0cmFjdCgxLCAnbW9udGgnKS5zdGFydE9mKCdtb250aCcpLCBtb21lbnQoKS5zdWJ0cmFjdCgxLCAnbW9udGgnKS5lbmRPZignbW9udGgnKV1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzdGFydERhdGU6IG1vbWVudCgpLnN1YnRyYWN0KDI5LCAnZGF5cycpLFxyXG4gICAgICAgICAgZW5kRGF0ZTogbW9tZW50KClcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XHJcbiAgICAgICAgICAkKCcjZGF0ZXJhbmdlLWJ0biBzcGFuJykuaHRtbChzdGFydC5mb3JtYXQoJ01NTU0gRCwgWVlZWScpICsgJyAtICcgKyBlbmQuZm9ybWF0KCdNTU1NIEQsIFlZWVknKSk7XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvL0RhdGUgcGlja2VyXHJcbiAgICAkKCcjZGF0ZXBpY2tlcicpLmRhdGVwaWNrZXIoe1xyXG4gICAgICBhdXRvY2xvc2U6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vaUNoZWNrIGZvciBjaGVja2JveCBhbmQgcmFkaW8gaW5wdXRzXHJcbiAgICAkKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0ubWluaW1hbCwgaW5wdXRbdHlwZT1cInJhZGlvXCJdLm1pbmltYWwnKS5pQ2hlY2soe1xyXG4gICAgICBjaGVja2JveENsYXNzOiAnaWNoZWNrYm94X21pbmltYWwtYmx1ZScsXHJcbiAgICAgIHJhZGlvQ2xhc3M6ICdpcmFkaW9fbWluaW1hbC1ibHVlJ1xyXG4gICAgfSk7XHJcbiAgICAvL1JlZCBjb2xvciBzY2hlbWUgZm9yIGlDaGVja1xyXG4gICAgJCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdLm1pbmltYWwtcmVkLCBpbnB1dFt0eXBlPVwicmFkaW9cIl0ubWluaW1hbC1yZWQnKS5pQ2hlY2soe1xyXG4gICAgICBjaGVja2JveENsYXNzOiAnaWNoZWNrYm94X21pbmltYWwtcmVkJyxcclxuICAgICAgcmFkaW9DbGFzczogJ2lyYWRpb19taW5pbWFsLXJlZCdcclxuICAgIH0pO1xyXG4gICAgLy9GbGF0IHJlZCBjb2xvciBzY2hlbWUgZm9yIGlDaGVja1xyXG4gICAgJCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdLmZsYXQtcmVkLCBpbnB1dFt0eXBlPVwicmFkaW9cIl0uZmxhdC1yZWQnKS5pQ2hlY2soe1xyXG4gICAgICBjaGVja2JveENsYXNzOiAnaWNoZWNrYm94X2ZsYXQtZ3JlZW4nLFxyXG4gICAgICByYWRpb0NsYXNzOiAnaXJhZGlvX2ZsYXQtZ3JlZW4nXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL0NvbG9ycGlja2VyXHJcbiAgICAkKFwiLm15LWNvbG9ycGlja2VyMVwiKS5jb2xvcnBpY2tlcigpO1xyXG4gICAgLy9jb2xvciBwaWNrZXIgd2l0aCBhZGRvblxyXG4gICAgJChcIi5teS1jb2xvcnBpY2tlcjJcIikuY29sb3JwaWNrZXIoKTtcclxuXHJcbiAgICAvL1RpbWVwaWNrZXJcclxuICAgICQoXCIudGltZXBpY2tlclwiKS50aW1lcGlja2VyKHtcclxuICAgICAgc2hvd0lucHV0czogZmFsc2VcclxuICAgIH0pO1xyXG5cdH0pO1xyXG5cclxufV0pOyIsImNvbmZpZ1JvdXRlci5jb250cm9sbGVyKCdjdHJsRm9ybXNFZGl0b3InLFtmdW5jdGlvbigpe1xyXG4gIFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG5cdCAgXHRDS0VESVRPUi5yZXBsYWNlKCdlZGl0b3IxJyk7XHJcblx0ICAgIC8vYm9vdHN0cmFwIFdZU0lIVE1MNSAtIHRleHQgZWRpdG9yXHJcblx0ICAgICQoXCIudGV4dGFyZWFcIikud3lzaWh0bWw1KCk7XHRcclxuXHR9KTtcclxuXHJcbn1dKTsiLCJjb25maWdSb3V0ZXIuY29udHJvbGxlcignY3RybFVpU2xpZGVyJyxbZnVuY3Rpb24oKXtcclxuICBcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgIFx0LyogQk9PVFNUUkFQIFNMSURFUiAqL1xyXG5cdCAgICAkKCcuc2xpZGVyJykuc2xpZGVyKCk7XHJcblx0fSk7XHJcblxyXG59XSk7Il19

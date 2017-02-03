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
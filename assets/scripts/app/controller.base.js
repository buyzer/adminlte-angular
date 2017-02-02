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
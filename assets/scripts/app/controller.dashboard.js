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
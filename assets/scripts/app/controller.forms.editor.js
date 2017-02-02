configRouter.controller('ctrlFormsEditor',[function(){
  	angular.element(document).ready(function(){
	  	CKEDITOR.replace('editor1');
	    //bootstrap WYSIHTML5 - text editor
	    $(".textarea").wysihtml5();	
	});

}]);
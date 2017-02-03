/*! DataTables Bootstrap 3 integration
 * ©2011-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * DataTables integration for Bootstrap 3. This requires Bootstrap 3 and
 * DataTables 1.10 or newer.
 *
 * This file sets the defaults and adds options to DataTables to style its
 * controls using Bootstrap. See http://datatables.net/manual/styling/bootstrap
 * for further information.
 */
(function(window, document, undefined){

var factory = function( $, DataTable ) {
"use strict";


/* Set the defaults for DataTables initialisation */
$.extend( true, DataTable.defaults, {
	dom:
		"<'row'<'col-sm-6'l><'col-sm-6'f>>" +
		"<'row'<'col-sm-12'tr>>" +
		"<'row'<'col-sm-5'i><'col-sm-7'p>>",
	renderer: 'bootstrap'
} );


/* Default class modification */
$.extend( DataTable.ext.classes, {
	sWrapper:      "dataTables_wrapper form-inline dt-bootstrap",
	sFilterInput:  "form-control input-sm",
	sLengthSelect: "form-control input-sm"
} );


/* Bootstrap paging button renderer */
DataTable.ext.renderer.pageButton.bootstrap = function ( settings, host, idx, buttons, page, pages ) {
	var api     = new DataTable.Api( settings );
	var classes = settings.oClasses;
	var lang    = settings.oLanguage.oPaginate;
	var btnDisplay, btnClass, counter=0;

	var attach = function( container, buttons ) {
		var i, ien, node, button;
		var clickHandler = function ( e ) {
			e.preventDefault();
			if ( !$(e.currentTarget).hasClass('disabled') ) {
				api.page( e.data.action ).draw( false );
			}
		};

		for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
			button = buttons[i];

			if ( $.isArray( button ) ) {
				attach( container, button );
			}
			else {
				btnDisplay = '';
				btnClass = '';

				switch ( button ) {
					case 'ellipsis':
						btnDisplay = '&hellip;';
						btnClass = 'disabled';
						break;

					case 'first':
						btnDisplay = lang.sFirst;
						btnClass = button + (page > 0 ?
							'' : ' disabled');
						break;

					case 'previous':
						btnDisplay = lang.sPrevious;
						btnClass = button + (page > 0 ?
							'' : ' disabled');
						break;

					case 'next':
						btnDisplay = lang.sNext;
						btnClass = button + (page < pages-1 ?
							'' : ' disabled');
						break;

					case 'last':
						btnDisplay = lang.sLast;
						btnClass = button + (page < pages-1 ?
							'' : ' disabled');
						break;

					default:
						btnDisplay = button + 1;
						btnClass = page === button ?
							'active' : '';
						break;
				}

				if ( btnDisplay ) {
					node = $('<li>', {
							'class': classes.sPageButton+' '+btnClass,
							'id': idx === 0 && typeof button === 'string' ?
								settings.sTableId +'_'+ button :
								null
						} )
						.append( $('<a>', {
								'href': '#',
								'aria-controls': settings.sTableId,
								'data-dt-idx': counter,
								'tabindex': settings.iTabIndex
							} )
							.html( btnDisplay )
						)
						.appendTo( container );

					settings.oApi._fnBindAction(
						node, {action: button}, clickHandler
					);

					counter++;
				}
			}
		}
	};

	// IE9 throws an 'unknown error' if document.activeElement is used
	// inside an iframe or frame. 
	var activeEl;

	try {
		// Because this approach is destroying and recreating the paging
		// elements, focus is lost on the select button which is bad for
		// accessibility. So we want to restore focus once the draw has
		// completed
		activeEl = $(document.activeElement).data('dt-idx');
	}
	catch (e) {}

	attach(
		$(host).empty().html('<ul class="pagination"/>').children('ul'),
		buttons
	);

	if ( activeEl ) {
		$(host).find( '[data-dt-idx='+activeEl+']' ).focus();
	}
};


/*
 * TableTools Bootstrap compatibility
 * Required TableTools 2.1+
 */
if ( DataTable.TableTools ) {
	// Set the classes that TableTools uses to something suitable for Bootstrap
	$.extend( true, DataTable.TableTools.classes, {
		"container": "DTTT btn-group",
		"buttons": {
			"normal": "btn btn-default",
			"disabled": "disabled"
		},
		"collection": {
			"container": "DTTT_dropdown dropdown-menu",
			"buttons": {
				"normal": "",
				"disabled": "disabled"
			}
		},
		"print": {
			"info": "DTTT_print_info"
		},
		"select": {
			"row": "active"
		}
	} );

	// Have the collection use a bootstrap compatible drop down
	$.extend( true, DataTable.TableTools.DEFAULTS.oTags, {
		"collection": {
			"container": "ul",
			"button": "li",
			"liner": "a"
		}
	} );
}

}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGFUYWJsZXMuYm9vdHN0cmFwLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImRvY3VtZW50IiwidW5kZWZpbmVkIiwiZmFjdG9yeSIsIiQiLCJEYXRhVGFibGUiLCJleHRlbmQiLCJkZWZhdWx0cyIsImRvbSIsInJlbmRlcmVyIiwiZXh0IiwiY2xhc3NlcyIsInNXcmFwcGVyIiwic0ZpbHRlcklucHV0Iiwic0xlbmd0aFNlbGVjdCIsInBhZ2VCdXR0b24iLCJib290c3RyYXAiLCJzZXR0aW5ncyIsImhvc3QiLCJpZHgiLCJidXR0b25zIiwicGFnZSIsInBhZ2VzIiwiYnRuRGlzcGxheSIsImJ0bkNsYXNzIiwiYWN0aXZlRWwiLCJhcGkiLCJBcGkiLCJvQ2xhc3NlcyIsImxhbmciLCJvTGFuZ3VhZ2UiLCJvUGFnaW5hdGUiLCJjb3VudGVyIiwiYXR0YWNoIiwiY29udGFpbmVyIiwiaSIsImllbiIsIm5vZGUiLCJidXR0b24iLCJjbGlja0hhbmRsZXIiLCJlIiwicHJldmVudERlZmF1bHQiLCJjdXJyZW50VGFyZ2V0IiwiaGFzQ2xhc3MiLCJkYXRhIiwiYWN0aW9uIiwiZHJhdyIsImxlbmd0aCIsImlzQXJyYXkiLCJzRmlyc3QiLCJzUHJldmlvdXMiLCJzTmV4dCIsInNMYXN0IiwiY2xhc3MiLCJzUGFnZUJ1dHRvbiIsImlkIiwic1RhYmxlSWQiLCJhcHBlbmQiLCJocmVmIiwiYXJpYS1jb250cm9scyIsImRhdGEtZHQtaWR4IiwidGFiaW5kZXgiLCJpVGFiSW5kZXgiLCJodG1sIiwiYXBwZW5kVG8iLCJvQXBpIiwiX2ZuQmluZEFjdGlvbiIsImFjdGl2ZUVsZW1lbnQiLCJlbXB0eSIsImNoaWxkcmVuIiwiZmluZCIsImZvY3VzIiwiVGFibGVUb29scyIsIm5vcm1hbCIsImRpc2FibGVkIiwiY29sbGVjdGlvbiIsInByaW50IiwiaW5mbyIsInNlbGVjdCIsInJvdyIsIkRFRkFVTFRTIiwib1RhZ3MiLCJsaW5lciIsImRlZmluZSIsImFtZCIsImV4cG9ydHMi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LFlBQ0N6QyxVQUFhLEtBQ2JJLE9BQVUsS0FDVjRDLE1BQVMsUUFTVyxtQkFBWEMsU0FBeUJBLE9BQU9DLElBQzNDRCxRQUFTLFNBQVUsY0FBZWhGLEdBRU4sZ0JBQVprRixTQUVibEYsRUFBU21GLFFBQVEsVUFBV0EsUUFBUSxlQUU5QkMsUUFFVHBGLEVBQVNvRixPQUFRQSxPQUFPQyxHQUFHQyxZQUl6QnpGLE9BQVFDIiwiZmlsZSI6ImRhdGFUYWJsZXMuYm9vdHN0cmFwLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohIERhdGFUYWJsZXMgQm9vdHN0cmFwIDMgaW50ZWdyYXRpb25cbiAqIMKpMjAxMS0yMDE0IFNwcnlNZWRpYSBMdGQgLSBkYXRhdGFibGVzLm5ldC9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBEYXRhVGFibGVzIGludGVncmF0aW9uIGZvciBCb290c3RyYXAgMy4gVGhpcyByZXF1aXJlcyBCb290c3RyYXAgMyBhbmRcbiAqIERhdGFUYWJsZXMgMS4xMCBvciBuZXdlci5cbiAqXG4gKiBUaGlzIGZpbGUgc2V0cyB0aGUgZGVmYXVsdHMgYW5kIGFkZHMgb3B0aW9ucyB0byBEYXRhVGFibGVzIHRvIHN0eWxlIGl0c1xuICogY29udHJvbHMgdXNpbmcgQm9vdHN0cmFwLiBTZWUgaHR0cDovL2RhdGF0YWJsZXMubmV0L21hbnVhbC9zdHlsaW5nL2Jvb3RzdHJhcFxuICogZm9yIGZ1cnRoZXIgaW5mb3JtYXRpb24uXG4gKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpe1xuXG52YXIgZmFjdG9yeSA9IGZ1bmN0aW9uKCAkLCBEYXRhVGFibGUgKSB7XG5cInVzZSBzdHJpY3RcIjtcblxuXG4vKiBTZXQgdGhlIGRlZmF1bHRzIGZvciBEYXRhVGFibGVzIGluaXRpYWxpc2F0aW9uICovXG4kLmV4dGVuZCggdHJ1ZSwgRGF0YVRhYmxlLmRlZmF1bHRzLCB7XG5cdGRvbTpcblx0XHRcIjwncm93JzwnY29sLXNtLTYnbD48J2NvbC1zbS02J2Y+PlwiICtcblx0XHRcIjwncm93JzwnY29sLXNtLTEyJ3RyPj5cIiArXG5cdFx0XCI8J3Jvdyc8J2NvbC1zbS01J2k+PCdjb2wtc20tNydwPj5cIixcblx0cmVuZGVyZXI6ICdib290c3RyYXAnXG59ICk7XG5cblxuLyogRGVmYXVsdCBjbGFzcyBtb2RpZmljYXRpb24gKi9cbiQuZXh0ZW5kKCBEYXRhVGFibGUuZXh0LmNsYXNzZXMsIHtcblx0c1dyYXBwZXI6ICAgICAgXCJkYXRhVGFibGVzX3dyYXBwZXIgZm9ybS1pbmxpbmUgZHQtYm9vdHN0cmFwXCIsXG5cdHNGaWx0ZXJJbnB1dDogIFwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsXG5cdHNMZW5ndGhTZWxlY3Q6IFwiZm9ybS1jb250cm9sIGlucHV0LXNtXCJcbn0gKTtcblxuXG4vKiBCb290c3RyYXAgcGFnaW5nIGJ1dHRvbiByZW5kZXJlciAqL1xuRGF0YVRhYmxlLmV4dC5yZW5kZXJlci5wYWdlQnV0dG9uLmJvb3RzdHJhcCA9IGZ1bmN0aW9uICggc2V0dGluZ3MsIGhvc3QsIGlkeCwgYnV0dG9ucywgcGFnZSwgcGFnZXMgKSB7XG5cdHZhciBhcGkgICAgID0gbmV3IERhdGFUYWJsZS5BcGkoIHNldHRpbmdzICk7XG5cdHZhciBjbGFzc2VzID0gc2V0dGluZ3Mub0NsYXNzZXM7XG5cdHZhciBsYW5nICAgID0gc2V0dGluZ3Mub0xhbmd1YWdlLm9QYWdpbmF0ZTtcblx0dmFyIGJ0bkRpc3BsYXksIGJ0bkNsYXNzLCBjb3VudGVyPTA7XG5cblx0dmFyIGF0dGFjaCA9IGZ1bmN0aW9uKCBjb250YWluZXIsIGJ1dHRvbnMgKSB7XG5cdFx0dmFyIGksIGllbiwgbm9kZSwgYnV0dG9uO1xuXHRcdHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoIGUgKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRpZiAoICEkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2Rpc2FibGVkJykgKSB7XG5cdFx0XHRcdGFwaS5wYWdlKCBlLmRhdGEuYWN0aW9uICkuZHJhdyggZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Zm9yICggaT0wLCBpZW49YnV0dG9ucy5sZW5ndGggOyBpPGllbiA7IGkrKyApIHtcblx0XHRcdGJ1dHRvbiA9IGJ1dHRvbnNbaV07XG5cblx0XHRcdGlmICggJC5pc0FycmF5KCBidXR0b24gKSApIHtcblx0XHRcdFx0YXR0YWNoKCBjb250YWluZXIsIGJ1dHRvbiApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGJ0bkRpc3BsYXkgPSAnJztcblx0XHRcdFx0YnRuQ2xhc3MgPSAnJztcblxuXHRcdFx0XHRzd2l0Y2ggKCBidXR0b24gKSB7XG5cdFx0XHRcdFx0Y2FzZSAnZWxsaXBzaXMnOlxuXHRcdFx0XHRcdFx0YnRuRGlzcGxheSA9ICcmaGVsbGlwOyc7XG5cdFx0XHRcdFx0XHRidG5DbGFzcyA9ICdkaXNhYmxlZCc7XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgJ2ZpcnN0Jzpcblx0XHRcdFx0XHRcdGJ0bkRpc3BsYXkgPSBsYW5nLnNGaXJzdDtcblx0XHRcdFx0XHRcdGJ0bkNsYXNzID0gYnV0dG9uICsgKHBhZ2UgPiAwID9cblx0XHRcdFx0XHRcdFx0JycgOiAnIGRpc2FibGVkJyk7XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgJ3ByZXZpb3VzJzpcblx0XHRcdFx0XHRcdGJ0bkRpc3BsYXkgPSBsYW5nLnNQcmV2aW91cztcblx0XHRcdFx0XHRcdGJ0bkNsYXNzID0gYnV0dG9uICsgKHBhZ2UgPiAwID9cblx0XHRcdFx0XHRcdFx0JycgOiAnIGRpc2FibGVkJyk7XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgJ25leHQnOlxuXHRcdFx0XHRcdFx0YnRuRGlzcGxheSA9IGxhbmcuc05leHQ7XG5cdFx0XHRcdFx0XHRidG5DbGFzcyA9IGJ1dHRvbiArIChwYWdlIDwgcGFnZXMtMSA/XG5cdFx0XHRcdFx0XHRcdCcnIDogJyBkaXNhYmxlZCcpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlICdsYXN0Jzpcblx0XHRcdFx0XHRcdGJ0bkRpc3BsYXkgPSBsYW5nLnNMYXN0O1xuXHRcdFx0XHRcdFx0YnRuQ2xhc3MgPSBidXR0b24gKyAocGFnZSA8IHBhZ2VzLTEgP1xuXHRcdFx0XHRcdFx0XHQnJyA6ICcgZGlzYWJsZWQnKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdGJ0bkRpc3BsYXkgPSBidXR0b24gKyAxO1xuXHRcdFx0XHRcdFx0YnRuQ2xhc3MgPSBwYWdlID09PSBidXR0b24gP1xuXHRcdFx0XHRcdFx0XHQnYWN0aXZlJyA6ICcnO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGJ0bkRpc3BsYXkgKSB7XG5cdFx0XHRcdFx0bm9kZSA9ICQoJzxsaT4nLCB7XG5cdFx0XHRcdFx0XHRcdCdjbGFzcyc6IGNsYXNzZXMuc1BhZ2VCdXR0b24rJyAnK2J0bkNsYXNzLFxuXHRcdFx0XHRcdFx0XHQnaWQnOiBpZHggPT09IDAgJiYgdHlwZW9mIGJ1dHRvbiA9PT0gJ3N0cmluZycgP1xuXHRcdFx0XHRcdFx0XHRcdHNldHRpbmdzLnNUYWJsZUlkICsnXycrIGJ1dHRvbiA6XG5cdFx0XHRcdFx0XHRcdFx0bnVsbFxuXHRcdFx0XHRcdFx0fSApXG5cdFx0XHRcdFx0XHQuYXBwZW5kKCAkKCc8YT4nLCB7XG5cdFx0XHRcdFx0XHRcdFx0J2hyZWYnOiAnIycsXG5cdFx0XHRcdFx0XHRcdFx0J2FyaWEtY29udHJvbHMnOiBzZXR0aW5ncy5zVGFibGVJZCxcblx0XHRcdFx0XHRcdFx0XHQnZGF0YS1kdC1pZHgnOiBjb3VudGVyLFxuXHRcdFx0XHRcdFx0XHRcdCd0YWJpbmRleCc6IHNldHRpbmdzLmlUYWJJbmRleFxuXHRcdFx0XHRcdFx0XHR9IClcblx0XHRcdFx0XHRcdFx0Lmh0bWwoIGJ0bkRpc3BsYXkgKVxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0LmFwcGVuZFRvKCBjb250YWluZXIgKTtcblxuXHRcdFx0XHRcdHNldHRpbmdzLm9BcGkuX2ZuQmluZEFjdGlvbihcblx0XHRcdFx0XHRcdG5vZGUsIHthY3Rpb246IGJ1dHRvbn0sIGNsaWNrSGFuZGxlclxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRjb3VudGVyKys7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly8gSUU5IHRocm93cyBhbiAndW5rbm93biBlcnJvcicgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpcyB1c2VkXG5cdC8vIGluc2lkZSBhbiBpZnJhbWUgb3IgZnJhbWUuIFxuXHR2YXIgYWN0aXZlRWw7XG5cblx0dHJ5IHtcblx0XHQvLyBCZWNhdXNlIHRoaXMgYXBwcm9hY2ggaXMgZGVzdHJveWluZyBhbmQgcmVjcmVhdGluZyB0aGUgcGFnaW5nXG5cdFx0Ly8gZWxlbWVudHMsIGZvY3VzIGlzIGxvc3Qgb24gdGhlIHNlbGVjdCBidXR0b24gd2hpY2ggaXMgYmFkIGZvclxuXHRcdC8vIGFjY2Vzc2liaWxpdHkuIFNvIHdlIHdhbnQgdG8gcmVzdG9yZSBmb2N1cyBvbmNlIHRoZSBkcmF3IGhhc1xuXHRcdC8vIGNvbXBsZXRlZFxuXHRcdGFjdGl2ZUVsID0gJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5kYXRhKCdkdC1pZHgnKTtcblx0fVxuXHRjYXRjaCAoZSkge31cblxuXHRhdHRhY2goXG5cdFx0JChob3N0KS5lbXB0eSgpLmh0bWwoJzx1bCBjbGFzcz1cInBhZ2luYXRpb25cIi8+JykuY2hpbGRyZW4oJ3VsJyksXG5cdFx0YnV0dG9uc1xuXHQpO1xuXG5cdGlmICggYWN0aXZlRWwgKSB7XG5cdFx0JChob3N0KS5maW5kKCAnW2RhdGEtZHQtaWR4PScrYWN0aXZlRWwrJ10nICkuZm9jdXMoKTtcblx0fVxufTtcblxuXG4vKlxuICogVGFibGVUb29scyBCb290c3RyYXAgY29tcGF0aWJpbGl0eVxuICogUmVxdWlyZWQgVGFibGVUb29scyAyLjErXG4gKi9cbmlmICggRGF0YVRhYmxlLlRhYmxlVG9vbHMgKSB7XG5cdC8vIFNldCB0aGUgY2xhc3NlcyB0aGF0IFRhYmxlVG9vbHMgdXNlcyB0byBzb21ldGhpbmcgc3VpdGFibGUgZm9yIEJvb3RzdHJhcFxuXHQkLmV4dGVuZCggdHJ1ZSwgRGF0YVRhYmxlLlRhYmxlVG9vbHMuY2xhc3Nlcywge1xuXHRcdFwiY29udGFpbmVyXCI6IFwiRFRUVCBidG4tZ3JvdXBcIixcblx0XHRcImJ1dHRvbnNcIjoge1xuXHRcdFx0XCJub3JtYWxcIjogXCJidG4gYnRuLWRlZmF1bHRcIixcblx0XHRcdFwiZGlzYWJsZWRcIjogXCJkaXNhYmxlZFwiXG5cdFx0fSxcblx0XHRcImNvbGxlY3Rpb25cIjoge1xuXHRcdFx0XCJjb250YWluZXJcIjogXCJEVFRUX2Ryb3Bkb3duIGRyb3Bkb3duLW1lbnVcIixcblx0XHRcdFwiYnV0dG9uc1wiOiB7XG5cdFx0XHRcdFwibm9ybWFsXCI6IFwiXCIsXG5cdFx0XHRcdFwiZGlzYWJsZWRcIjogXCJkaXNhYmxlZFwiXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcInByaW50XCI6IHtcblx0XHRcdFwiaW5mb1wiOiBcIkRUVFRfcHJpbnRfaW5mb1wiXG5cdFx0fSxcblx0XHRcInNlbGVjdFwiOiB7XG5cdFx0XHRcInJvd1wiOiBcImFjdGl2ZVwiXG5cdFx0fVxuXHR9ICk7XG5cblx0Ly8gSGF2ZSB0aGUgY29sbGVjdGlvbiB1c2UgYSBib290c3RyYXAgY29tcGF0aWJsZSBkcm9wIGRvd25cblx0JC5leHRlbmQoIHRydWUsIERhdGFUYWJsZS5UYWJsZVRvb2xzLkRFRkFVTFRTLm9UYWdzLCB7XG5cdFx0XCJjb2xsZWN0aW9uXCI6IHtcblx0XHRcdFwiY29udGFpbmVyXCI6IFwidWxcIixcblx0XHRcdFwiYnV0dG9uXCI6IFwibGlcIixcblx0XHRcdFwibGluZXJcIjogXCJhXCJcblx0XHR9XG5cdH0gKTtcbn1cblxufTsgLy8gL2ZhY3RvcnlcblxuXG4vLyBEZWZpbmUgYXMgYW4gQU1EIG1vZHVsZSBpZiBwb3NzaWJsZVxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG5cdGRlZmluZSggWydqcXVlcnknLCAnZGF0YXRhYmxlcyddLCBmYWN0b3J5ICk7XG59XG5lbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAgIC8vIE5vZGUvQ29tbW9uSlNcbiAgICBmYWN0b3J5KCByZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnZGF0YXRhYmxlcycpICk7XG59XG5lbHNlIGlmICggalF1ZXJ5ICkge1xuXHQvLyBPdGhlcndpc2Ugc2ltcGx5IGluaXRpYWxpc2UgYXMgbm9ybWFsLCBzdG9wcGluZyBtdWx0aXBsZSBldmFsdWF0aW9uXG5cdGZhY3RvcnkoIGpRdWVyeSwgalF1ZXJ5LmZuLmRhdGFUYWJsZSApO1xufVxuXG5cbn0pKHdpbmRvdywgZG9jdW1lbnQpO1xuXG4iXX0=

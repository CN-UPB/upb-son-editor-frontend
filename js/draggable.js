$(document).ready(function() {


	$( ".vnf" ).draggable({
	
	helper: "clone",
	//revert: "invalid"
	
	});
	
/*	
	//$( "ul, li" ).disableSelection();
   /* $( "#editor" ).droppable({
      drop: function( event, ui ) {
        $( this )
          .addClass( "ui-state-highlight" )
          .find( "p" )
            .html( "Dropped!" ); 
      }
    });*/
	$( ".editor-area" ).droppable({
		drop: function(event, ui) {
		var dropped_vnf = $(this).getData('.vnf');
		$("<li class='.vnf' draggable='true'>" + dropped_vnf + "</li>").appendChild(document.getElementById('#editor')).draggable();
		}
	
	});



	
  });
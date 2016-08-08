$(document).ready(function() {

	$(".vnf").draggable({helper: "clone", revert: "invalid"});
	

	$( "#editor").droppable({
		accept: ".vnf",
		drop: function(event, ui) {

			var data = ui.draggable.clone();
	
			//console.log(data);
			
			// remove the 'vnf' class from the source vnf , add new class 'vnf-after-drop' to the clone
			data.removeClass('vnf');
			data.addClass('vnf-after-drop');
			data.removeClass('ui-draggable');
			
			//console.log($(ui.draggable).position());
			//var mouseX = $(ui.draggable).left;
			//var mouseY = $(ui.draggable).top;
			
			// position of the draggable minus position of the droppable relative to the document
			
			var $newPosX = ui.offset.left - $(this).offset().left;
			var $newPosY = ui.offset.top - $(this).offset().top;

			data.css({position:'relative', left: $newPosX, top: $newPosY});
			
			data.draggable({ cursor: 'move', containment: '#editor'});
			
			// Add the cloned vnf to the editor div, it will be the first element of data array
			
			document.getElementById("editor").appendChild(data[0]);
			
			// Give the resizable properties to the dragged vnf
			
			data.resizable({handles: 'all', animate: true, ghost: true});
			
			//console.log(event.clientX);
			//console.log(event.clientY);
			
		}
	
	});



	
  });
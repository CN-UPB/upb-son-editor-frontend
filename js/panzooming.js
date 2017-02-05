var zoomMatrix = [];
var current_zoom = 1;
var $setLeft;// the origin of editor
var $setTop;
var $panzoom;

function changeZoomTo() {
    var x = document.getElementById("percent").value;
    current_zoom = x / 100;
    $panzoom.panzoom("zoom", current_zoom, {
	animate : true,
	silent : true
    });
    instance.setZoom(current_zoom);
    $panzoom.panzoom("pan", -130, -60, {
	relative : true,
	animation : true
    });
    $("#editor").offset({
	top : $setTop,
	left : $setLeft
    });
}

// inform jsplumb the current zoom
function onZoomChanged(e, Panzoom, zoom) {
    instance.setZoom(zoom);
    $panzoom.panzoom("pan", -130, -60, {
	relative : true,
	animation : true
    });
    $("#editor").offset({
	top : $setTop,
	left : $setLeft
    });
}

$(document).ready(
	function() {
	    $setLeft = $('#editor').offset().left;
	    $setTop = $('#editor').offset().top;

	    // initialize panzoom
	    var $section = $('#editor-parent');
	    var $menu_actions = $('#menu-actions');
	    $panzoom = $section.find('#editor').panzoom({
		$zoomIn : $menu_actions.find(".zoom-in"),
		$zoomOut : $menu_actions.find(".zoom-out"),
		$reset : $menu_actions.find(".reset"),
		transition : true,
		which : 2,// Set whether you'd like to pan on left (1), middle
		// (2), or right click (3)
		maxScale : 1.5,
		increment : 0.1,
		minScale : 0.5,
		easing : "ease-in-out",
		onZoom : onZoomChanged,
		cursor : "default",	
	    });
	    $panzoom.parent().on(
		    'mousewheel.focal',
		    function(e) {
			e.preventDefault();
			var delta = e.delta || e.originalEvent.wheelDelta;
			var zoomOut = delta ? delta < 0
				: e.originalEvent.deltaY > 0;
			$panzoom.panzoom('zoom', zoomOut, {
			    animate : false,
			    focal : e
			});
			zoomMatrix = ($panzoom.panzoom("getMatrix"));
			current_zoom = zoomMatrix[0];
			current_zoom = parseFloat(current_zoom).toFixed(1);
			document.getElementById('percent').value = Math
				.round(parseFloat(current_zoom) * 100);
		    });

	    $panzoom.on('panzoomreset', function(e) {
		current_zoom = 1;
		document.getElementById('percent').value = 100;
		instance.setZoom(current_zoom);
		$panzoom.panzoom("pan", -130, -60, {
		    relative : true,
		    animation : true
		});
		$("#editor").offset({
		    top : $setTop,
		    left : $setLeft
		});

	    });
	    
	    //limit the pan translation so that the background will not be seen.
	    $panzoom.on('panzoomend',
		    function(e, panzoom, matrix, changed) {
			var offset = $(panzoom.elem).offset();
			var top = offset.top;
			var left = offset.left;
			var editorAreaHeight = $(panzoom.elem).height()
				* panzoom.scale;
			var editorAreaWidth = $(panzoom.elem).width()
				* panzoom.scale;
			var windowHeight = $('#editor-parent').height();
			var windowWidth = $('#editor-parent').width();
			var minTop = $setTop
				- (editorAreaHeight - windowHeight);
			var minLeft = $setLeft
				- (editorAreaWidth - windowWidth);
			if (top > $setTop) {
			    $(panzoom.elem).offset({
				top : $setTop
			    });
			}
			if (top < minTop) {
			    $(panzoom.elem).offset({
				top : minTop
			    });
			}
			if (left > $setLeft) {
			    $(panzoom.elem).offset({
				left : $setLeft
			    });
			}
			if (left < minLeft) {
			    $(panzoom.elem).offset({
				left : minLeft
			    });
			}
		    });

	    $menu_actions.find(".zoom-in").on(
		    "click",
		    function(e) {
			if (current_zoom < 1.5) {
			    current_zoom = parseFloat(current_zoom) + 0.1;
			    document.getElementById('percent').value = Math
				    .round(parseFloat(current_zoom) * 100);
			}
		    });

	    $menu_actions.find(".zoom-out").on(
		    "click",
		    function(e) {
			if (current_zoom > 0.5) {
			    current_zoom = current_zoom - 0.1;
			    document.getElementById('percent').value = Math
				    .round(parseFloat(current_zoom) * 100);
			}
		    });
	});
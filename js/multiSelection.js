var area;
var x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, x4 = 0, y3 = 0, y4 = 0;
var select = true;
var inputSelect = false;
var selectedNodes = [];
function reCalc() {
    // This will restyle the area
    x3 = Math.min(x1, x2); // Smaller X
    x4 = Math.max(x1, x2);// Larger X
    y3 = Math.min(y1, y2); // Smaller Y
    y4 = Math.max(y1, y2);// Larger Y
    area.style.left = x3 + 'px';
    area.style.top = y3 + 'px';
    area.style.width = x4 - x3 + 'px';
    area.style.height = y4 - y3 + 'px';
}

function calSelectedNodes() {
    selectedNodes = [];
    var nodes = $('#editor>.jsplumb-draggable').not('.jsplumb-endpoint');
    for ( var i = 0; i < nodes.length; i++) {
	var node = $(nodes[i]);
	var x = node.offset().left;
	var y = node.offset().top;
	if (x3 <= x && x <= x4 && y3 <= y && y <= y4) {
	    selectedNodes.push(nodes[i].id);
	}
    }

    for ( var i = 0; i < selectedNodes.length; i++) {
	var dataId = selectedNodes[i].replace(":", "\\:");
	var node = $("#" + dataId);
	node.addClass("selectedNode");
	instance.addToDragSelection(node);
    }
    select = false;
}

function pauseEvent(e) {
    if (e.stopPropagation)
	e.stopPropagation();
    if (e.preventDefault)
	e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}

function setMousedownForDraggable(elem) {
    elem.mousedown(function(e) {
	if (!$(this).hasClass("selectedNode")) {
	    for ( var i = 0; i < selectedNodes.length; i++) {
		var dataId = selectedNodes[i].replace(":", "\\:");
		var node = $("#" + dataId);
		node.removeClass("selectedNode");
	    }
	    instance.clearDragSelection();
	}
    });
}

$(document).ready(function() {
    area = document.getElementById('selectArea');
    $("#editor").mousedown(function(e) {
	if (!select) {
	    for ( var i = 0; i < selectedNodes.length; i++) {
		var dataId = selectedNodes[i].replace(":", "\\:");
		var node = $("#" + dataId);
		node.removeClass("selectedNode");
	    }
	    instance.clearDragSelection();
	    select = true;
	}
	var target = $(e.target);
	if (!target.is("input")) {
	    // normal selection
	    if (!inputSelect) // last section was not input
	    {
		pauseEvent(e);// pause select texts
		inputSelect = false;
	    }
	    area.hidden = 0;
	} else {
	    inputSelect = true;
	    area.hidden = 1;
	}
	// Unhide the area
	x1 = e.clientX;
	// Set the initial X
	y1 = e.clientY;
	// Set the initial Y
	reCalc();
    });

    $("#editor").mousemove(function(e) {
	x2 = e.clientX;
	// Update the current position X
	y2 = e.clientY;
	// Update the current position Y
	reCalc();
    });

    $("#selectArea").mousemove(function(e) {
	x2 = e.clientX;
	// Update the current position X
	y2 = e.clientY;
	// Update the current position Y
	reCalc();
    });
    $("#editor").mouseup(function(e) {
	if (select) {
	    calSelectedNodes();
	}
	// Hide the area
	area.hidden = 1;
    });
    $("#selectArea").mouseup(function(e) {
	if (inputSelect) {
	    inputSelect = false;
	} else if (select) {
	    calSelectedNodes();
	}
	area.hidden = 1;
	// Hide the div
    });
});
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

function calSelectedNodes(shiftX, shiftY) {
    selectedNodes = [];
    if (cur_ns.descriptor.network_functions != null) {
	for ( var i = 0; i < cur_ns.descriptor.network_functions.length; i++) {
	    var vnf = cur_ns.descriptor.network_functions[i];
	    var position = cur_ns.meta.positions[vnf.vnf_id];
	    if (position[0] >= x3 - shiftX && position[0] <= x4 - shiftX
		    && position[1] >= y3 - shiftY && position[1] <= y4 - shiftY) {
		if ($.inArray(vnf, selectedNodes))
		    selectedNodes.push(vnf.vnf_id);
	    }
	}
    }
    if (cur_ns.descriptor.network_services != null) {
	for ( var i = 0; i < cur_ns.descriptor.network_services.length; i++) {
	    var ns = cur_ns.descriptor.network_services[i];
	    var position = cur_ns.meta.positions[ns.ns_id];
	    if (position[0] >= x3 - shiftX && position[0] <= x4 - shiftX
		    && position[1] >= y3 - shiftY && position[1] <= y4 - shiftY) {
		if ($.inArray(ns, selectedNodes))
		    selectedNodes.push(ns.ns_id);
	    }
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

$(document).ready(function() {
    area = document.getElementById('selectArea');
    $("#editor").mousedown(function(e) {
	var target = $(e.target);
	if (!target.is("input")) {
	    if (!inputSelect) {
		pauseEvent(e);//pause select texts
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
	if (!select) {
	    for ( var i = 0; i < selectedNodes.length; i++) {
		var dataId = selectedNodes[i].replace(":", "\\:");
		var node = $("#" + dataId);
		node.removeClass("selectedNode");
	    }
	    instance.clearDragSelection();
	    select = true;
	}
	reCalc();
    });

    $("#editor").mousemove(function(e) {
	x2 = e.clientX;
	// Update the current position X
	y2 = e.clientY;
	// Update the current position Y
	reCalc();
    });
    $("#editor").mouseup(function(e) {
	if (select) {
	    var offset = $(this).offset();
	    calSelectedNodes(offset.left, offset.top);
	}
	// Hide the area
	area.hidden = 1;
    });
    $("#selectArea").mouseup(function(e) {
	if (inputSelect) {
	    inputSelect = false;
	}
	area.hidden = 1;
	// Hide the div
    });
});

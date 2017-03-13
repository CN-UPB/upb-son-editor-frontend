/**
 * Written by Linghui
 * The idea to use a rectangle selected by the mouse to define which nodes are inside this rectangle.
 * The user can perform dragging and deletion to those selected nodes.
 * By dragging the user needs to click on one of the selected nodes.
 * It is used in nsView.html.
 */

/**
 * stores the rectangle
 */
var area;
/**
 * the coordinates of the rectangle
 */
var x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, x4 = 0, y3 = 0, y4 = 0;
/**
 * indicates if the mouse click is for multi-selecting
 */
var select = false;
/**
 * indicates if the mouse click is on the name of the node or not
 */
var inputSelect = false;
/**
 * stores the selected nodes inside the rectangle
 */
var selectedNodes = [];
/**
 * It recalculates the selected rectangle during the movement of mouse.
 */
function reCalc() {
    // This will restyle the area
    x3 = Math.min(x1, x2);
    // Smaller X
    x4 = Math.max(x1, x2);
    // Larger X
    y3 = Math.min(y1, y2);
    // Smaller Y
    y4 = Math.max(y1, y2);
    // Larger Y
    area.style.left = x3 + 'px';
    area.style.top = y3 + 'px';
    area.style.width = x4 - x3 + 'px';
    area.style.height = y4 - y3 + 'px';
}

/**
 * It calculates which nodes are inside the rectangle
 */
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
    markNodesSelected();
    select = false;
}

/**
 *It marks selected nodes with red dashed border in the editor.
 */
function markNodesSelected(){
    for ( var i = 0; i < selectedNodes.length; i++) {
	var dataId = selectedNodes[i].replace(":", "\\:");
	var node = $("#" + dataId);
	node.addClass("selectedNode");
	instance.addToDragSelection(node);
    }
    if (selectedNodes.length == 1 && node.hasClass("vnf-after-drop")){
    	var data = ko.dataFor(node[0]);
		if (data.uid) {
			$("#editButton").show();
		}
    }
}
/**
 * It pauses selecting texts.
 */
function pauseEvent(e) {
    if (e.stopPropagation){e.stopPropagation();}
    if (e.preventDefault){e.preventDefault();}
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}

/**
 * It is called in drawNode() in nsEditor.js to reset variables for selection
 * @param elem
 */
function setMousedownForDraggable(elem) {
    elem.mousedown(function(e) {
	if (!$(this).hasClass("selectedNode")) {
	    cancelSelection();
	}
    });
    elem.mouseup(function(e) {
	if (!$(this).hasClass("selectedNode") && !$(e.target).is("input")) {
	    if (!isDragAction){
		//select single clicked on node
		selectedNodes = [this.id];
		markNodesSelected();
		select = false;
	    }
	}
    });
}

/**
 * It cancels the selection and unmarks the selected nodes.
 */
function cancelSelection() {
    for ( var i = 0; i < selectedNodes.length; i++) {
	var dataId = selectedNodes[i].replace(":", "\\:");
	var node = $("#" + dataId);
	node.removeClass("selectedNode");
    }
    instance.clearDragSelection();
    $("#editButton").hide();
}

/**
 * It deletes all selected nodes.
 */
function deleteSelectedNodes() {
    if (selectedNodes.length > 0) {
	var errorMsg="Do you really want to delete all selected nodes?";
	if(selectedNodes.length==1)
	{
	    errorMsg="Do you really want to delete the selected node?";
	}
	$("#deleteDialog").dialog({
	    modal : true,
	    buttons : {
		Yes : function() {
		    $(this).dialog("close");
		    for ( var i = 0; i < selectedNodes.length; i++) {
			var dataId = selectedNodes[i].replace(":", "\\:");
			var node = $("#" + dataId);
			instance.detachAllConnections(node);
			instance.removeAllEndpoints(node);
			var deleteId = selectedNodes[i];
			deleteNodeFromDpt(deleteId, node.attr("class"));
			node.remove();
			usedIDs.splice($.inArray(deleteId, usedIDs), 1);
		    }
		    updateServiceOnServer();
		    selectedNodes = [];
		},
		Cancel : function() {
		    $(this).dialog("close");
		}
	    }
	}).text(errorMsg);
    }
}

/**
 * It opens the VNF descriptor of the current selected VNF node.
 */
function editSelected(){
		var node = selectedNodes[0];
		var data = ko.dataFor($("#"+node)[0]);
		if (data.uid){
			if (vnf_map[data.uid()]){
				var vnfId = vnf_map[data.uid()]['id'];
			    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "edit&fromNSEditor";
			}
		}
}

/**
 * It sets the mouse events
 */
$(document).ready(function() {
    area = document.getElementById('selectArea');
    $('html').keyup(function(e) {
	if (e.keyCode == 46) {
	    deleteSelectedNodes();
	}
    });
    $("#editor").mousedown(function(e) {
	var target = $(e.target);
	if (!(target.is("input")||target.is("path"))) {
	    // normal selection
	    if (!inputSelect) // last section was not input
	    {
		pauseEvent(e);
		// pause select texts
		inputSelect = false;
	    }
	    area.hidden = 0;
	} else {
	    if(target.is("input"))
		{
	    inputSelect = true;
	    area.hidden = 1;
		}
	}
	// Unhide the area
	x1 = e.clientX;
	// Set the initial X
	y1 = e.clientY;
	// Set the initial Y
	reCalc();
	if (!select) {
	    cancelSelection();
	    select = true;
	}
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